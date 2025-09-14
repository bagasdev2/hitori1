const chalk = require('chalk');
const moment = require('moment');
const fs = require('fs-extra');

// Import libraries
const { getCommand, isOwner, isAdmin, formatTime } = require('../lib/function');
const games = require('../lib/game');
const converter = require('../lib/converter');
const { createSticker } = require('../lib/exif');

async function handleMessage(conn, message, database) {
    try {
        if (!message.message) return;

        const m = {
            key: message.key,
            message: message.message,
            fromMe: message.key.fromMe,
            id: message.key.id,
            chat: message.key.remoteJid,
            isGroup: message.key.remoteJid.endsWith('@g.us'),
            sender: message.key.participant || message.key.remoteJid,
            timestamp: message.messageTimestamp * 1000
        };

        // Extract message content
        const messageType = Object.keys(message.message)[0];
        let text = '';
        
        if (messageType === 'conversation') {
            text = message.message.conversation;
        } else if (messageType === 'extendedTextMessage') {
            text = message.message.extendedTextMessage.text;
        } else if (messageType === 'imageMessage') {
            text = message.message.imageMessage.caption || '';
        } else if (messageType === 'videoMessage') {
            text = message.message.videoMessage.caption || '';
        } else if (messageType === 'documentMessage') {
            text = message.message.documentMessage.caption || '';
        }

        m.text = text;
        m.messageType = messageType;

        // Skip if no text or from bot itself
        if (!text || m.fromMe) return;

        // Get command and arguments
        const prefix = database.settings.prefix || '.';
        const isCommand = text.startsWith(prefix);
        
        if (isCommand) {
            const command = text.slice(prefix.length).trim().split(' ')[0].toLowerCase();
            const args = text.slice(prefix.length + command.length).trim().split(' ');
            
            m.command = command;
            m.args = args;
            m.fullArgs = args.join(' ');

            console.log(chalk.blue(`📨 Command: ${command} from ${m.sender}`));

            // Handle commands
            await handleCommand(conn, m, database);
        } else {
            // Handle non-command messages
            await handleNonCommand(conn, m, database);
        }

        // Update user stats
        updateUserStats(m.sender, database);

    } catch (error) {
        console.error(chalk.red('❌ Error in handleMessage:'), error);
    }
}

async function handleCommand(conn, m, database) {
    const { command, args, fullArgs, sender, chat, isGroup } = m;

    try {
        // Owner commands
        if (isOwner(sender, database)) {
            switch (command) {
                case 'restart':
                    await conn.sendMessage(chat, { text: '🔄 Restarting bot...' });
                    process.exit(0);
                    break;

                case 'backup':
                    await backupDatabase(conn, chat);
                    break;

                case 'ban':
                    if (args[0]) {
                        const target = args[0].replace('@', '') + '@s.whatsapp.net';
                        database.banned.push(target);
                        await conn.sendMessage(chat, { text: `✅ ${args[0]} has been banned!` });
                    }
                    break;

                case 'unban':
                    if (args[0]) {
                        const target = args[0].replace('@', '') + '@s.whatsapp.net';
                        database.banned = database.banned.filter(x => x !== target);
                        await conn.sendMessage(chat, { text: `✅ ${args[0]} has been unbanned!` });
                    }
                    break;

                case 'premium':
                    if (args[0]) {
                        const target = args[0].replace('@', '') + '@s.whatsapp.net';
                        database.premium.push(target);
                        await conn.sendMessage(chat, { text: `✅ ${args[0]} is now premium!` });
                    }
                    break;
            }
        }

        // Group admin commands
        if (isGroup && await isAdmin(conn, chat, sender)) {
            switch (command) {
                case 'kick':
                    if (args[0]) {
                        const target = args[0].replace('@', '') + '@s.whatsapp.net';
                        await conn.groupParticipantsUpdate(chat, [target], 'remove');
                        await conn.sendMessage(chat, { text: `👢 Kicked ${args[0]}!` });
                    }
                    break;

                case 'promote':
                    if (args[0]) {
                        const target = args[0].replace('@', '') + '@s.whatsapp.net';
                        await conn.groupParticipantsUpdate(chat, [target], 'promote');
                        await conn.sendMessage(chat, { text: `⬆️ Promoted ${args[0]}!` });
                    }
                    break;

                case 'demote':
                    if (args[0]) {
                        const target = args[0].replace('@', '') + '@s.whatsapp.net';
                        await conn.groupParticipantsUpdate(chat, [target], 'demote');
                        await conn.sendMessage(chat, { text: `⬇️ Demoted ${args[0]}!` });
                    }
                    break;

                case 'hidetag':
                    const groupMetadata = await conn.groupMetadata(chat);
                    const participants = groupMetadata.participants.map(p => p.id);
                    await conn.sendMessage(chat, {
                        text: fullArgs || '📢 Hidden tag message',
                        mentions: participants
                    });
                    break;

                case 'tagall':
                    const groupData = await conn.groupMetadata(chat);
                    let tagText = '📢 Tag All Members:\n\n';
                    const members = groupData.participants.map(p => p.id);
                    members.forEach((member, i) => {
                        tagText += `${i + 1}. @${member.split('@')[0]}\n`;
                    });
                    await conn.sendMessage(chat, {
                        text: tagText,
                        mentions: members
                    });
                    break;

                case 'antilink':
                    const setting = args[0]?.toLowerCase();
                    if (setting === 'on') {
                        if (!database.groups[chat]) database.groups[chat] = {};
                        database.groups[chat].antilink = true;
                        await conn.sendMessage(chat, { text: '✅ Anti-link enabled!' });
                    } else if (setting === 'off') {
                        if (database.groups[chat]) database.groups[chat].antilink = false;
                        await conn.sendMessage(chat, { text: '❌ Anti-link disabled!' });
                    } else {
                        await conn.sendMessage(chat, { text: '❓ Usage: .antilink on/off' });
                    }
                    break;
            }
        }

        // General commands
        switch (command) {
            case 'menu':
                await sendMenu(conn, chat);
                break;

            case 'ping':
                const start = Date.now();
                const ping = Date.now() - start;
                await conn.sendMessage(chat, { 
                    text: `🏓 Pong!\n📊 Speed: ${ping}ms\n⏰ Time: ${moment().format('HH:mm:ss DD/MM/YYYY')}` 
                });
                break;

            case 'info':
            case 'botstats':
                await sendBotInfo(conn, chat, database);
                break;

            // Games
            case 'tictactoe':
            case 'ttt':
                await games.tictactoe(conn, chat, sender, args);
                break;

            case 'slot':
                await games.slot(conn, chat, sender);
                break;

            case 'tebakangka':
                await games.guessNumber(conn, chat, sender, args);
                break;

            // Media commands
            case 'sticker':
            case 's':
                await createStickerFromMessage(conn, m);
                break;

            case 'toimg':
                await converter.stickerToImage(conn, m);
                break;

            case 'tovideo':
                await converter.stickerToVideo(conn, m);
                break;

            // AI commands
            case 'ai':
                if (fullArgs) {
                    await handleAIRequest(conn, chat, fullArgs);
                } else {
                    await conn.sendMessage(chat, { text: '❓ Usage: .ai <question>' });
                }
                break;

            // Download commands
            case 'ytdl':
            case 'youtube':
                if (fullArgs) {
                    await downloadYoutube(conn, chat, fullArgs);
                } else {
                    await conn.sendMessage(chat, { text: '❓ Usage: .ytdl <youtube url>' });
                }
                break;

            case 'tiktok':
                if (fullArgs) {
                    await downloadTiktok(conn, chat, fullArgs);
                } else {
                    await conn.sendMessage(chat, { text: '❓ Usage: .tiktok <tiktok url>' });
                }
                break;

            // Fun commands
            case 'joke':
                await sendRandomJoke(conn, chat);
                break;

            case 'quote':
                await sendRandomQuote(conn, chat);
                break;

            case 'cekdead':
            case 'cekmati':
                const deadPercent = Math.floor(Math.random() * 100);
                await conn.sendMessage(chat, {
                    text: `💀 @${sender.split('@')[0]} memiliki ${deadPercent}% peluang mati hari ini!`,
                    mentions: [sender]
                });
                break;

            case 'jodohku':
                if (isGroup) {
                    const groupData = await conn.groupMetadata(chat);
                    const members = groupData.participants.map(p => p.id);
                    const randomPartner = members[Math.floor(Math.random() * members.length)];
                    const lovePercent = Math.floor(Math.random() * 100);
                    
                    await conn.sendMessage(chat, {
                        text: `💕 Jodoh @${sender.split('@')[0]} adalah @${randomPartner.split('@')[0]} dengan tingkat kecocokan ${lovePercent}%!`,
                        mentions: [sender, randomPartner]
                    });
                } else {
                    await conn.sendMessage(chat, { text: '❌ Command ini hanya bisa digunakan di grup!' });
                }
                break;

            default:
                // Check for custom auto-replies
                await checkAutoReply(conn, m, database);
                break;
        }

    } catch (error) {
        console.error(chalk.red(`❌ Error handling command ${command}:`), error);
        await conn.sendMessage(chat, { text: '❌ Terjadi error saat menjalankan command!' });
    }
}

async function handleNonCommand(conn, m, database) {
    const { text, chat, sender, isGroup } = m;

    try {
        // Check anti-link
        if (isGroup && database.groups[chat]?.antilink) {
            if (text.match(/(https?:\/\/|www\.)/gi)) {
                if (!await isAdmin(conn, chat, sender)) {
                    await conn.sendMessage(chat, { text: '⚠️ Link terdeteksi! Pesan akan dihapus.' });
                    await conn.sendMessage(chat, { delete: m.key });
                    return;
                }
            }
        }

        // Auto-reply keywords
        const lowerText = text.toLowerCase();
        if (lowerText.includes('halo') || lowerText.includes('hello') || lowerText.includes('hi')) {
            await conn.sendMessage(chat, { text: '👋 Halo juga! Ada yang bisa saya bantu?' });
        }

        if (lowerText.includes('selamat pagi')) {
            await conn.sendMessage(chat, { text: '🌅 Selamat pagi! Semoga hari ini menyenangkan!' });
        }

        if (lowerText.includes('selamat malam')) {
            await conn.sendMessage(chat, { text: '🌙 Selamat malam! Selamat istirahat!' });
        }

        // Auto-reaction for certain messages
        if (lowerText.includes('love') || lowerText.includes('❤️')) {
            await conn.sendMessage(chat, { react: { text: '❤️', key: m.key } });
        }

        if (lowerText.includes('funny') || lowerText.includes('😂')) {
            await conn.sendMessage(chat, { react: { text: '😂', key: m.key } });
        }

    } catch (error) {
        console.error(chalk.red('❌ Error in handleNonCommand:'), error);
    }
}

function updateUserStats(sender, database) {
    if (!database.users[sender]) {
        database.users[sender] = {
            messageCount: 0,
            commandCount: 0,
            firstSeen: Date.now(),
            lastSeen: Date.now()
        };
    }
    
    database.users[sender].messageCount++;
    database.users[sender].lastSeen = Date.now();
}

async function sendMenu(conn, chat) {
    const menuText = `
╭─「 *HITORI-MASTER* 」
│ 🤖 WhatsApp Bot Full Power
│ ⏰ ${moment().format('HH:mm DD/MM/YYYY')}
╰────────────────

╭─「 *BOT COMMANDS* 」
│ • .menu - Show this menu
│ • .ping - Check bot latency
│ • .info - Bot information
│ • .botstats - Bot statistics
╰────────────────

╭─「 *GROUP COMMANDS* 」
│ • .kick @user - Kick member
│ • .promote @user - Promote to admin
│ • .demote @user - Demote from admin
│ • .hidetag <text> - Hidden tag
│ • .tagall - Tag all members
│ • .antilink on/off - Toggle anti-link
╰────────────────

╭─「 *MEDIA TOOLS* 」
│ • .sticker - Create sticker
│ • .toimg - Sticker to image
│ • .tovideo - Sticker to video
│ • .ytdl <url> - Download YouTube
│ • .tiktok <url> - Download TikTok
╰────────────────

╭─「 *GAMES* 」
│ • .tictactoe - Play TicTacToe
│ • .slot - Slot machine
│ • .tebakangka - Guess number
╰────────────────

╭─「 *AI & FUN* 」
│ • .ai <question> - Ask AI
│ • .joke - Random joke
│ • .quote - Random quote
│ • .cekmati - Death percentage
│ • .jodohku - Find your match
╰────────────────

Made with ❤️ by HITORI-MASTER
    `;

    await conn.sendMessage(chat, { text: menuText });
}

async function sendBotInfo(conn, chat, database) {
    const uptime = process.uptime();
    const totalUsers = Object.keys(database.users).length;
    const totalGroups = Object.keys(database.groups).length;

    const infoText = `
╭─「 *BOT INFORMATION* 」
│ 🤖 Name: HITORI-MASTER
│ 📱 Version: 1.0.0
│ ⏰ Uptime: ${formatTime(uptime)}
│ 👥 Total Users: ${totalUsers}
│ 🏢 Total Groups: ${totalGroups}
│ 💾 Memory: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB
│ 🖥️ Platform: ${process.platform}
│ 📡 Node.js: ${process.version}
╰────────────────
    `;

    await conn.sendMessage(chat, { text: infoText });
}

// Additional functions will be implemented in separate files
async function createStickerFromMessage(conn, m) {
    // Implementation in lib/exif.js
    await createSticker(conn, m);
}

async function handleAIRequest(conn, chat, question) {
    // AI implementation
    await conn.sendMessage(chat, { text: '🤖 AI: Fitur ini sedang dalam pengembangan!' });
}

async function downloadYoutube(conn, chat, url) {
    // YouTube download implementation
    await conn.sendMessage(chat, { text: '📺 YouTube: Fitur ini sedang dalam pengembangan!' });
}

async function downloadTiktok(conn, chat, url) {
    // TikTok download implementation
    await conn.sendMessage(chat, { text: '🎵 TikTok: Fitur ini sedang dalam pengembangan!' });
}

async function sendRandomJoke(conn, chat) {
    const jokes = [
        "Kenapa komputer bisa masuk angin? Karena windowsnya kebuka terus!",
        "Apa perbedaan antara kamu dan wifi? Wifi bisa connect, kamu tidak!",
        "Kenapa pisang tidak pernah kesepian? Karena mereka selalu bergerombol!",
        "Apa yang lebih cepat dari kilat? Gosip!",
        "Kenapa hantu suka main facebook? Karena mereka suka menghantui orang!"
    ];
    
    const randomJoke = jokes[Math.floor(Math.random() * jokes.length)];
    await conn.sendMessage(chat, { text: `😄 ${randomJoke}` });
}

async function sendRandomQuote(conn, chat) {
    const quotes = [
        "Hidup adalah 10% apa yang terjadi padamu dan 90% bagaimana kamu meresponsnya.",
        "Kesuksesan adalah kemampuan untuk pergi dari satu kegagalan ke kegagalan lain tanpa kehilangan antusiasme.",
        "Cara terbaik untuk memulai adalah berhenti berbicara dan mulai melakukan.",
        "Jangan takut gagal. Takutlah tidak mencoba.",
        "Impian tidak memiliki tanggal kedaluwarsa."
    ];
    
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    await conn.sendMessage(chat, { text: `💭 *Quote of the day:*\n\n"${randomQuote}"` });
}

async function checkAutoReply(conn, m, database) {
    // Check for custom auto-reply messages
    // Implementation here
}

async function backupDatabase(conn, chat) {
    try {
        const backup = JSON.stringify(database, null, 2);
        const filename = `backup_${moment().format('YYYY-MM-DD_HH-mm-ss')}.json`;
        
        await fs.writeFile(`./database/backup_${filename}`, backup);
        await conn.sendMessage(chat, { 
            document: Buffer.from(backup),
            fileName: filename,
            mimetype: 'application/json'
        });
        
        await conn.sendMessage(chat, { text: '✅ Database backup created!' });
    } catch (error) {
        console.error(chalk.red('❌ Error creating backup:'), error);
        await conn.sendMessage(chat, { text: '❌ Failed to create backup!' });
    }
}

module.exports = { handleMessage };