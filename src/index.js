const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const P = require('pino');
const chalk = require('chalk');
const moment = require('moment');
const fs = require('fs-extra');
const path = require('path');

// Import modules
const { handleMessage } = require('./message');
const { initDatabase, saveDatabase } = require('./database');
const { startJadiBot } = require('./jadibot');
const antispam = require('./antispam');

// Import libraries
const { updateStats } = require('../lib/function');

const logger = P({ timestamp: () => `,"time":"${new Date().toJSON()}"` }, P.destination('./logs/bot.log'));

class HitoriMaster {
    constructor() {
        this.conn = null;
        this.store = null;
        this.qr = '';
        this.connecting = false;
        this.database = null;
        
        console.log(chalk.blue.bold(`
╔══════════════════════════════════════╗
║           HITORI-MASTER              ║
║      WhatsApp Bot Full Power         ║
║           Version 1.0.0              ║
╚══════════════════════════════════════╝
        `));
    }

    async initialize() {
        try {
            // Initialize database
            this.database = await initDatabase();
            
            // Create logs directory
            await fs.ensureDir('./logs');
            
            // Start connection
            await this.startConnection();
            
            console.log(chalk.green('✅ Bot initialized successfully!'));
        } catch (error) {
            console.error(chalk.red('❌ Error initializing bot:'), error);
        }
    }

    async startConnection() {
        const { state, saveCreds } = await useMultiFileAuthState('./database/auth');
        const { version, isLatest } = await fetchLatestBaileysVersion();
        
        console.log(chalk.yellow(`Using WA v${version.join('.')}, isLatest: ${isLatest}`));

        const conn = makeWASocket({
            version,
            logger: logger.child({ class: 'socket' }),
            printQRInTerminal: false, // Disable QR terminal print
            auth: state,
            browser: ['HITORI-MASTER', 'Desktop', '1.0.0'],
            generateHighQualityLinkPreview: true,
            syncFullHistory: true,
            markOnlineOnConnect: true,
            keepAliveIntervalMs: 30000,
            connectTimeoutMs: 60000,
            defaultQueryTimeoutMs: 60000,
            retryRequestDelayMs: 250,
            emitOwnEvents: true,
            fireInitQueries: true,
            generateThumbnail: true,
            syncHistory: true,
            msgRetryCounterMap: {},
            shouldSyncHistoryMessage: () => true,
            patchMessageBeforeSending: (message) => {
                const requiresPatch = !!(
                    message.buttonsMessage ||
                    message.templateMessage ||
                    message.listMessage
                );
                if (requiresPatch) {
                    message = {
                        viewOnceMessage: {
                            message
                        }
                    };
                }
                return message;
            }
        });

        this.conn = conn;

        // Connection events
        conn.ev.on('connection.update', async (update) => {
            await this.handleConnectionUpdate(update, saveCreds);
        });

        conn.ev.on('creds.update', saveCreds);

        // Message events
        conn.ev.on('messages.upsert', async (m) => {
            await this.handleIncomingMessage(m);
        });

        // Group events
        conn.ev.on('group-participants.update', async (update) => {
            await this.handleGroupUpdate(update);
        });

        // Store events
        conn.ev.on('chats.set', () => {
            console.log(chalk.green('✅ Chats loaded'));
        });

        conn.ev.on('contacts.set', () => {
            console.log(chalk.green('✅ Contacts loaded'));
        });
    }

    async handleConnectionUpdate(update, saveCreds) {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            this.qr = qr;
            console.log(chalk.yellow('📱 Scan QR code above or use pairing code'));
            
            // Generate pairing code instead of QR
            if (!this.conn?.authState.creds.registered) {
                console.log(chalk.blue('🔐 Starting pairing mode...'));
                setTimeout(async () => {
                    try {
                        const code = await this.conn.requestPairingCode('6281234567890'); // Replace with your number
                        console.log(chalk.green.bold(`📋 Pairing Code: ${code}`));
                    } catch (error) {
                        console.error(chalk.red('❌ Error generating pairing code:'), error);
                    }
                }, 3000);
            }
        }

        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log(chalk.red(`Connection closed due to ${lastDisconnect?.error}`));
            
            if (shouldReconnect) {
                console.log(chalk.yellow('🔄 Reconnecting...'));
                setTimeout(() => this.startConnection(), 3000);
            }
        } else if (connection === 'open') {
            console.log(chalk.green.bold('🎉 Connected to WhatsApp!'));
            console.log(chalk.blue(`📱 Bot Number: ${this.conn.user.id.split('@')[0]}`));
            
            // Update bot stats
            updateStats('connection', { connected: true, time: moment().format() });
            
            // Start scheduled tasks
            this.startScheduledTasks();
        }
    }

    async handleIncomingMessage(m) {
        try {
            const message = m.messages[0];
            if (!message) return;

            // Skip if message is from status broadcast
            if (message.key.remoteJid === 'status@broadcast') return;

            // Anti-spam check
            if (await antispam.check(message)) return;

            // Handle message
            await handleMessage(this.conn, message, this.database);

            // Update stats
            updateStats('message', { 
                from: message.key.remoteJid,
                timestamp: message.messageTimestamp 
            });

        } catch (error) {
            console.error(chalk.red('❌ Error handling message:'), error);
        }
    }

    async handleGroupUpdate(update) {
        try {
            const { id, participants, action } = update;
            
            if (action === 'add') {
                // Welcome new members
                await this.sendWelcome(id, participants);
            } else if (action === 'remove') {
                // Goodbye for removed members
                await this.sendGoodbye(id, participants);
            }

        } catch (error) {
            console.error(chalk.red('❌ Error handling group update:'), error);
        }
    }

    async sendWelcome(groupId, participants) {
        try {
            const groupData = await this.conn.groupMetadata(groupId);
            
            for (const participant of participants) {
                const welcomeText = `👋 Selamat datang @${participant.split('@')[0]} di grup *${groupData.subject}*!\n\nSemoga betah dan jangan lupa baca rules ya! 🎉`;
                
                await this.conn.sendMessage(groupId, {
                    text: welcomeText,
                    mentions: [participant]
                });

                // Send welcome sticker if available
                if (fs.existsSync('./src/media/welcome/welcome.webp')) {
                    await this.conn.sendMessage(groupId, {
                        sticker: fs.readFileSync('./src/media/welcome/welcome.webp')
                    });
                }
            }
        } catch (error) {
            console.error(chalk.red('❌ Error sending welcome:'), error);
        }
    }

    async sendGoodbye(groupId, participants) {
        try {
            const groupData = await this.conn.groupMetadata(groupId);
            
            for (const participant of participants) {
                const goodbyeText = `👋 @${participant.split('@')[0]} telah meninggalkan grup *${groupData.subject}*\n\nTerima kasih sudah bergabung! 👋`;
                
                await this.conn.sendMessage(groupId, {
                    text: goodbyeText,
                    mentions: [participant]
                });

                // Send goodbye sticker if available
                if (fs.existsSync('./src/media/goodbye/goodbye.webp')) {
                    await this.conn.sendMessage(groupId, {
                        sticker: fs.readFileSync('./src/media/goodbye/goodbye.webp')
                    });
                }
            }
        } catch (error) {
            console.error(chalk.red('❌ Error sending goodbye:'), error);
        }
    }

    startScheduledTasks() {
        console.log(chalk.blue('⏰ Starting scheduled tasks...'));
        
        // Schedule daily stats reset
        const cron = require('cron');
        
        new cron.CronJob('0 0 * * *', async () => {
            console.log(chalk.yellow('🔄 Resetting daily stats...'));
            // Reset daily stats logic here
        }, null, true);

        // Schedule weekly member activity check
        new cron.CronJob('0 0 * * 0', async () => {
            console.log(chalk.yellow('🔍 Checking member activity...'));
            // Check inactive members logic here
        }, null, true);

        // Auto save database every hour
        new cron.CronJob('0 * * * *', async () => {
            await saveDatabase(this.database);
            console.log(chalk.green('💾 Database auto-saved'));
        }, null, true);
    }
}

// Initialize and start bot
const bot = new HitoriMaster();
bot.initialize();

// Handle process termination
process.on('SIGINT', async () => {
    console.log(chalk.yellow('\n🛑 Bot stopping...'));
    await saveDatabase(bot.database);
    process.exit(0);
});

process.on('uncaughtException', (error) => {
    console.error(chalk.red('❌ Uncaught Exception:'), error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error(chalk.red('❌ Unhandled Rejection at:'), promise, 'reason:', reason);
});