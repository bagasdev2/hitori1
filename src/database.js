const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

const DATABASE_PATH = './database/database.json';

async function initDatabase() {
    try {
        // Ensure database directory exists
        await fs.ensureDir('./database');
        
        // Check if database file exists
        if (await fs.pathExists(DATABASE_PATH)) {
            const data = await fs.readJson(DATABASE_PATH);
            console.log(chalk.green('✅ Database loaded successfully'));
            return data;
        } else {
            // Create default database
            const defaultDatabase = {
                users: {},
                groups: {},
                settings: {
                    botName: "HITORI-MASTER",
                    ownerNumber: "6281234567890",
                    prefix: ".",
                    antispam: true,
                    antilink: true,
                    antiracism: true,
                    autoReply: true,
                    maintenance: false
                },
                banned: [],
                premium: [],
                games: {},
                votes: {},
                announcements: [],
                autoReply: {
                    "halo": "Halo juga! 👋",
                    "ping": "Pong! 🏓",
                    "bot": "Ya, ada yang bisa saya bantu? 🤖"
                },
                customCommands: {}
            };
            
            await fs.writeJson(DATABASE_PATH, defaultDatabase, { spaces: 2 });
            console.log(chalk.blue('📊 Default database created'));
            return defaultDatabase;
        }
    } catch (error) {
        console.error(chalk.red('❌ Error initializing database:'), error);
        throw error;
    }
}

async function saveDatabase(database) {
    try {
        await fs.writeJson(DATABASE_PATH, database, { spaces: 2 });
        console.log(chalk.green('💾 Database saved'));
    } catch (error) {
        console.error(chalk.red('❌ Error saving database:'), error);
    }
}

async function getUserData(userId, database) {
    if (!database.users[userId]) {
        database.users[userId] = {
            id: userId,
            name: '',
            messageCount: 0,
            commandCount: 0,
            exp: 0,
            level: 1,
            money: 1000,
            lastClaim: 0,
            premium: false,
            banned: false,
            warnings: 0,
            joinDate: Date.now(),
            lastSeen: Date.now(),
            gameStats: {
                tictactoe: { wins: 0, losses: 0, draws: 0 },
                slot: { plays: 0, wins: 0, totalWin: 0 },
                guess: { plays: 0, wins: 0 }
            }
        };
    }
    return database.users[userId];
}

async function getGroupData(groupId, database) {
    if (!database.groups[groupId]) {
        database.groups[groupId] = {
            id: groupId,
            name: '',
            antilink: false,
            antispam: true,
            welcome: true,
            goodbye: true,
            autoReply: true,
            adminOnly: false,
            nsfw: false,
            game: true,
            memberStats: {},
            rules: '',
            announcements: [],
            warnings: {}
        };
    }
    return database.groups[groupId];
}

async function addUser(userId, userData, database) {
    database.users[userId] = {
        ...getUserData(userId, database),
        ...userData
    };
    await saveDatabase(database);
}

async function updateUser(userId, updates, database) {
    const userData = await getUserData(userId, database);
    database.users[userId] = { ...userData, ...updates };
    await saveDatabase(database);
}

async function deleteUser(userId, database) {
    if (database.users[userId]) {
        delete database.users[userId];
        await saveDatabase(database);
        return true;
    }
    return false;
}

async function addGroup(groupId, groupData, database) {
    database.groups[groupId] = {
        ...getGroupData(groupId, database),
        ...groupData
    };
    await saveDatabase(database);
}

async function updateGroup(groupId, updates, database) {
    const groupData = await getGroupData(groupId, database);
    database.groups[groupId] = { ...groupData, ...updates };
    await saveDatabase(database);
}

async function deleteGroup(groupId, database) {
    if (database.groups[groupId]) {
        delete database.groups[groupId];
        await saveDatabase(database);
        return true;
    }
    return false;
}

// Premium user functions
async function addPremium(userId, database) {
    if (!database.premium.includes(userId)) {
        database.premium.push(userId);
        await updateUser(userId, { premium: true }, database);
        return true;
    }
    return false;
}

async function removePremium(userId, database) {
    const index = database.premium.indexOf(userId);
    if (index > -1) {
        database.premium.splice(index, 1);
        await updateUser(userId, { premium: false }, database);
        return true;
    }
    return false;
}

function isPremium(userId, database) {
    return database.premium.includes(userId);
}

// Ban functions
async function banUser(userId, database) {
    if (!database.banned.includes(userId)) {
        database.banned.push(userId);
        await updateUser(userId, { banned: true }, database);
        return true;
    }
    return false;
}

async function unbanUser(userId, database) {
    const index = database.banned.indexOf(userId);
    if (index > -1) {
        database.banned.splice(index, 1);
        await updateUser(userId, { banned: false }, database);
        return true;
    }
    return false;
}

function isBanned(userId, database) {
    return database.banned.includes(userId);
}

// Statistics functions
async function updateUserStats(userId, type, value, database) {
    const userData = await getUserData(userId, database);
    
    switch (type) {
        case 'message':
            userData.messageCount++;
            break;
        case 'command':
            userData.commandCount++;
            break;
        case 'exp':
            userData.exp += value || 1;
            // Level up calculation
            const newLevel = Math.floor(userData.exp / 100) + 1;
            if (newLevel > userData.level) {
                userData.level = newLevel;
                return { levelUp: true, newLevel };
            }
            break;
        case 'money':
            userData.money += value || 0;
            break;
    }
    
    userData.lastSeen = Date.now();
    await updateUser(userId, userData, database);
    return { success: true };
}

// Backup and restore functions
async function createBackup(database) {
    try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = `./database/backup_${timestamp}.json`;
        
        await fs.writeJson(backupPath, database, { spaces: 2 });
        console.log(chalk.green(`✅ Backup created: ${backupPath}`));
        return backupPath;
    } catch (error) {
        console.error(chalk.red('❌ Error creating backup:'), error);
        return false;
    }
}

async function restoreBackup(backupPath) {
    try {
        if (await fs.pathExists(backupPath)) {
            const backupData = await fs.readJson(backupPath);
            await fs.writeJson(DATABASE_PATH, backupData, { spaces: 2 });
            console.log(chalk.green('✅ Database restored from backup'));
            return true;
        } else {
            console.error(chalk.red('❌ Backup file not found'));
            return false;
        }
    } catch (error) {
        console.error(chalk.red('❌ Error restoring backup:'), error);
        return false;
    }
}

module.exports = {
    initDatabase,
    saveDatabase,
    getUserData,
    getGroupData,
    addUser,
    updateUser,
    deleteUser,
    addGroup,
    updateGroup,
    deleteGroup,
    addPremium,
    removePremium,
    isPremium,
    banUser,
    unbanUser,
    isBanned,
    updateUserStats,
    createBackup,
    restoreBackup
};