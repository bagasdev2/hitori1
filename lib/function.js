const chalk = require('chalk');
const fs = require('fs-extra');
const axios = require('axios');
const crypto = require('crypto');

// Utility functions
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function getTime(format = 'HH:mm:ss DD/MM/YYYY') {
    return require('moment')().format(format);
}

function formatTime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    let result = '';
    if (days > 0) result += `${days}d `;
    if (hours > 0) result += `${hours}h `;
    if (minutes > 0) result += `${minutes}m `;
    if (secs > 0) result += `${secs}s`;

    return result.trim() || '0s';
}

function generateRandomId(length = 10) {
    return crypto.randomBytes(length).toString('hex');
}

function formatSize(bytes) {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Permission functions
function isOwner(userId, database) {
    const ownerNumbers = [database.settings.ownerNumber, '6281234567890']; // Add backup owner
    return ownerNumbers.includes(userId.replace('@s.whatsapp.net', ''));
}

async function isAdmin(conn, groupId, userId) {
    try {
        const groupData = await conn.groupMetadata(groupId);
        const admins = groupData.participants
            .filter(p => p.admin === 'admin' || p.admin === 'superadmin')
            .map(p => p.id);
        
        return admins.includes(userId);
    } catch (error) {
        console.error(chalk.red('❌ Error checking admin status:'), error);
        return false;
    }
}

async function isBotAdmin(conn, groupId) {
    try {
        const groupData = await conn.groupMetadata(groupId);
        const botId = conn.user.id;
        const admins = groupData.participants
            .filter(p => p.admin === 'admin' || p.admin === 'superadmin')
            .map(p => p.id);
        
        return admins.includes(botId);
    } catch (error) {
        console.error(chalk.red('❌ Error checking bot admin status:'), error);
        return false;
    }
}

// Message parsing functions
function getCommand(text, prefix = '.') {
    if (!text.startsWith(prefix)) return null;
    
    const command = text.slice(prefix.length).trim().split(' ')[0].toLowerCase();
    const args = text.slice(prefix.length + command.length).trim().split(' ');
    
    return {
        command,
        args: args.filter(arg => arg.length > 0),
        fullArgs: args.join(' ')
    };
}

function extractMentions(text) {
    const mentionPattern = /@(\d+)/g;
    const mentions = [];
    let match;
    
    while ((match = mentionPattern.exec(text)) !== null) {
        mentions.push(match[1] + '@s.whatsapp.net');
    }
    
    return mentions;
}

function extractUrls(text) {
    const urlPattern = /(https?:\/\/[^\s]+)/g;
    return text.match(urlPattern) || [];
}

// File handling functions
async function downloadMediaMessage(message) {
    try {
        const messageType = Object.keys(message)[0];
        const media = message[messageType];
        
        if (!media) return null;
        
        const buffer = await require('@whiskeysockets/baileys').downloadMediaMessage(
            { message },
            'buffer',
            {},
            {
                logger: require('pino')({ level: 'silent' }),
                reuploadRequest: require('@whiskeysockets/baileys').updateMediaMessage
            }
        );
        
        return {
            buffer,
            mimetype: media.mimetype,
            filename: media.fileName || `media_${Date.now()}`,
            size: buffer.length
        };
    } catch (error) {
        console.error(chalk.red('❌ Error downloading media:'), error);
        return null;
    }
}

async function saveMediaToFile(mediaData, directory = './src/media/temp') {
    try {
        await fs.ensureDir(directory);
        
        const filename = `${generateRandomId()}_${mediaData.filename}`;
        const filepath = `${directory}/${filename}`;
        
        await fs.writeFile(filepath, mediaData.buffer);
        
        return {
            filepath,
            filename,
            size: mediaData.size,
            mimetype: mediaData.mimetype
        };
    } catch (error) {
        console.error(chalk.red('❌ Error saving media:'), error);
        return null;
    }
}

// Statistics functions
async function updateStats(type, data) {
    try {
        const statsPath = './database/stats.json';
        const stats = await fs.readJson(statsPath);
        
        switch (type) {
            case 'message':
                stats.botStats.totalCommands++;
                break;
            case 'connection':
                if (data.connected) {
                    stats.botStats.startTime = data.time;
                }
                break;
            case 'user':
                if (!stats.userStats[data.userId]) {
                    stats.userStats[data.userId] = {
                        messages: 0,
                        commands: 0,
                        firstSeen: Date.now()
                    };
                }
                stats.userStats[data.userId].messages++;
                stats.userStats[data.userId].lastSeen = Date.now();
                break;
            case 'group':
                if (!stats.groupStats[data.groupId]) {
                    stats.groupStats[data.groupId] = {
                        messages: 0,
                        members: data.memberCount || 0
                    };
                }
                stats.groupStats[data.groupId].messages++;
                break;
            case 'command':
                if (!stats.commandStats[data.command]) {
                    stats.commandStats[data.command] = 0;
                }
                stats.commandStats[data.command]++;
                break;
        }
        
        await fs.writeJson(statsPath, stats, { spaces: 2 });
    } catch (error) {
        console.error(chalk.red('❌ Error updating stats:'), error);
    }
}

// Text processing functions
function capitalizeFirst(text) {
    return text.charAt(0).toUpperCase() + text.slice(1);
}

function removeAccents(text) {
    return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function cleanText(text) {
    return text
        .replace(/[^\w\s]/gi, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function truncateText(text, maxLength = 100) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

// Validation functions
function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function isValidPhoneNumber(phone) {
    const phoneRegex = /^(\+|00)[1-9]\d{1,14}$/;
    return phoneRegex.test(phone);
}

// Array utility functions
function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

function getRandomElement(array) {
    return array[Math.floor(Math.random() * array.length)];
}

function chunk(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
}

// HTTP request functions
async function fetchJson(url, options = {}) {
    try {
        const response = await axios.get(url, {
            timeout: 10000,
            ...options
        });
        
        return response.data;
    } catch (error) {
        console.error(chalk.red(`❌ Error fetching ${url}:`), error.message);
        throw error;
    }
}

async function postJson(url, data, options = {}) {
    try {
        const response = await axios.post(url, data, {
            timeout: 10000,
            headers: { 'Content-Type': 'application/json' },
            ...options
        });
        
        return response.data;
    } catch (error) {
        console.error(chalk.red(`❌ Error posting to ${url}:`), error.message);
        throw error;
    }
}

// Color functions for console
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m'
};

function colorText(text, color) {
    return `${colors[color] || ''}${text}${colors.reset}`;
}

// Export all functions
module.exports = {
    sleep,
    getTime,
    formatTime,
    generateRandomId,
    formatSize,
    isOwner,
    isAdmin,
    isBotAdmin,
    getCommand,
    extractMentions,
    extractUrls,
    downloadMediaMessage,
    saveMediaToFile,
    updateStats,
    capitalizeFirst,
    removeAccents,
    cleanText,
    truncateText,
    isValidUrl,
    isValidEmail,
    isValidPhoneNumber,
    shuffleArray,
    getRandomElement,
    chunk,
    fetchJson,
    postJson,
    colorText,
    colors
};