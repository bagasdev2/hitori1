const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const P = require('pino');
const chalk = require('chalk');
const fs = require('fs-extra');
const path = require('path');

class JadiBot {
    constructor() {
        this.bots = new Map();
        this.logger = P({ level: 'silent' });
    }

    async startJadiBot(parentConn, userId, chatId) {
        try {
            console.log(chalk.blue(`🤖 Starting JadiBot for ${userId}`));

            const sessionPath = `./database/jadibot/${userId.replace('@', '_')}`;
            await fs.ensureDir(sessionPath);

            const { state, saveCreds } = await useMultiFileAuthState(sessionPath);

            const conn = makeWASocket({
                auth: state,
                logger: this.logger,
                printQRInTerminal: false,
                browser: [`JadiBot-${userId.split('@')[0]}`, 'Desktop', '1.0.0'],
                generateHighQualityLinkPreview: true,
                syncFullHistory: false,
                markOnlineOnConnect: false
            });

            // Store bot instance
            this.bots.set(userId, {
                conn,
                parentConn,
                chatId,
                userId,
                startTime: Date.now(),
                status: 'connecting'
            });

            // Connection events
            conn.ev.on('connection.update', async (update) => {
                await this.handleJadiBotConnection(userId, update, saveCreds);
            });

            conn.ev.on('creds.update', saveCreds);

            // Message events
            conn.ev.on('messages.upsert', async (m) => {
                await this.handleJadiBotMessage(userId, m);
            });

            // Generate pairing code
            setTimeout(async () => {
                if (conn.authState?.creds && !conn.authState.creds.registered) {
                    try {
                        const code = await conn.requestPairingCode(userId.replace('@s.whatsapp.net', ''));
                        
                        await parentConn.sendMessage(chatId, {
                            text: `🔐 *JadiBot Pairing Code*\n\n` +
                                  `📱 Nomor: ${userId.split('@')[0]}\n` +
                                  `🔑 Code: \`${code}\`\n\n` +
                                  `📝 Cara pairing:\n` +
                                  `1. Buka WhatsApp di HP\n` +
                                  `2. Masuk ke Settings > Linked Devices\n` +
                                  `3. Pilih "Link a Device"\n` +
                                  `4. Masukkan code: ${code}\n\n` +
                                  `⏰ Code berlaku 60 detik`
                        });

                        console.log(chalk.green(`📋 Pairing code for ${userId}: ${code}`));
                    } catch (error) {
                        console.error(chalk.red(`❌ Error generating pairing code for ${userId}:`), error);
                        await parentConn.sendMessage(chatId, {
                            text: `❌ Gagal generate pairing code untuk ${userId}`
                        });
                    }
                }
            }, 3000);

            return true;

        } catch (error) {
            console.error(chalk.red(`❌ Error starting JadiBot for ${userId}:`), error);
            return false;
        }
    }

    async handleJadiBotConnection(userId, update, saveCreds) {
        const { connection, lastDisconnect } = update;
        const botData = this.bots.get(userId);
        
        if (!botData) return;

        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            
            console.log(chalk.red(`❌ JadiBot ${userId} disconnected: ${lastDisconnect?.error}`));
            
            botData.status = 'disconnected';
            
            await botData.parentConn.sendMessage(botData.chatId, {
                text: `❌ JadiBot ${userId.split('@')[0]} terputus!\n` +
                      `Reason: ${lastDisconnect?.error?.output?.statusCode || 'Unknown'}`
            });

            if (shouldReconnect) {
                console.log(chalk.yellow(`🔄 Reconnecting JadiBot ${userId}...`));
                setTimeout(() => {
                    this.startJadiBot(botData.parentConn, userId, botData.chatId);
                }, 5000);
            } else {
                this.stopJadiBot(userId);
            }

        } else if (connection === 'open') {
            console.log(chalk.green(`✅ JadiBot ${userId} connected!`));
            
            botData.status = 'connected';
            botData.connectedAt = Date.now();

            await botData.parentConn.sendMessage(botData.chatId, {
                text: `✅ JadiBot berhasil terhubung!\n\n` +
                      `📱 Nomor: ${userId.split('@')[0]}\n` +
                      `🤖 Bot Name: ${botData.conn.user?.name || 'JadiBot'}\n` +
                      `⏰ Connected: ${new Date().toLocaleString()}\n\n` +
                      `🎉 JadiBot siap digunakan!`
            });
        }
    }

    async handleJadiBotMessage(userId, m) {
        try {
            const message = m.messages[0];
            if (!message || message.key.fromMe) return;

            const botData = this.bots.get(userId);
            if (!botData) return;

            // Forward important messages to parent bot
            const messageText = this.extractMessageText(message);
            if (messageText && messageText.startsWith('.')) {
                console.log(chalk.blue(`📨 JadiBot ${userId} received command: ${messageText}`));
                
                // Simple command handling for JadiBot
                await this.handleJadiBotCommand(botData.conn, message, messageText);
            }

        } catch (error) {
            console.error(chalk.red(`❌ Error handling JadiBot message for ${userId}:`), error);
        }
    }

    async handleJadiBotCommand(conn, message, text) {
        const command = text.slice(1).trim().split(' ')[0].toLowerCase();
        const chatId = message.key.remoteJid;

        try {
            switch (command) {
                case 'ping':
                    await conn.sendMessage(chatId, {
                        text: `🏓 Pong! JadiBot aktif\n⏰ ${new Date().toLocaleString()}`
                    });
                    break;

                case 'info':
                    await conn.sendMessage(chatId, {
                        text: `🤖 *JadiBot Information*\n\n` +
                              `📱 Number: ${conn.user?.id.split('@')[0]}\n` +
                              `👤 Name: ${conn.user?.name}\n` +
                              `🔗 Status: Connected\n` +
                              `⏰ Started: ${new Date().toLocaleString()}`
                    });
                    break;

                case 'menu':
                    await conn.sendMessage(chatId, {
                        text: `📋 *JadiBot Menu*\n\n` +
                              `• .ping - Test bot\n` +
                              `• .info - Bot info\n` +
                              `• .menu - Show menu\n` +
                              `• .stop - Stop JadiBot\n\n` +
                              `🤖 JadiBot by HITORI-MASTER`
                    });
                    break;

                case 'stop':
                    await conn.sendMessage(chatId, {
                        text: `🛑 JadiBot akan dihentikan...`
                    });
                    
                    // Find and stop this jadibot
                    for (const [userId, botData] of this.bots.entries()) {
                        if (botData.conn === conn) {
                            this.stopJadiBot(userId);
                            break;
                        }
                    }
                    break;

                default:
                    await conn.sendMessage(chatId, {
                        text: `❓ Command tidak dikenali. Ketik .menu untuk melihat daftar command.`
                    });
            }
        } catch (error) {
            console.error(chalk.red('❌ Error handling JadiBot command:'), error);
        }
    }

    async stopJadiBot(userId) {
        try {
            const botData = this.bots.get(userId);
            if (!botData) return false;

            console.log(chalk.yellow(`🛑 Stopping JadiBot ${userId}`));

            // Close connection
            if (botData.conn) {
                botData.conn.ws.close();
            }

            // Notify parent
            if (botData.parentConn && botData.chatId) {
                await botData.parentConn.sendMessage(botData.chatId, {
                    text: `🛑 JadiBot ${userId.split('@')[0]} telah dihentikan`
                });
            }

            // Remove from active bots
            this.bots.delete(userId);

            // Clean up session files (optional)
            const sessionPath = `./database/jadibot/${userId.replace('@', '_')}`;
            if (await fs.pathExists(sessionPath)) {
                await fs.remove(sessionPath);
            }

            return true;

        } catch (error) {
            console.error(chalk.red(`❌ Error stopping JadiBot ${userId}:`), error);
            return false;
        }
    }

    async listJadiBots() {
        const botList = [];
        
        for (const [userId, botData] of this.bots.entries()) {
            const uptime = botData.connectedAt ? Date.now() - botData.connectedAt : 0;
            botList.push({
                userId: userId.split('@')[0],
                status: botData.status,
                uptime: this.formatUptime(uptime),
                startTime: new Date(botData.startTime).toLocaleString()
            });
        }

        return botList;
    }

    async stopAllJadiBots() {
        console.log(chalk.yellow('🛑 Stopping all JadiBots...'));
        
        const userIds = Array.from(this.bots.keys());
        let stopped = 0;

        for (const userId of userIds) {
            const success = await this.stopJadiBot(userId);
            if (success) stopped++;
        }

        console.log(chalk.green(`✅ Stopped ${stopped}/${userIds.length} JadiBots`));
        return stopped;
    }

    extractMessageText(message) {
        try {
            const messageType = Object.keys(message.message)[0];
            
            switch (messageType) {
                case 'conversation':
                    return message.message.conversation;
                case 'extendedTextMessage':
                    return message.message.extendedTextMessage.text;
                case 'imageMessage':
                    return message.message.imageMessage.caption || '';
                case 'videoMessage':
                    return message.message.videoMessage.caption || '';
                default:
                    return '';
            }
        } catch {
            return '';
        }
    }

    formatUptime(uptime) {
        const seconds = Math.floor(uptime / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
        if (hours > 0) return `${hours}h ${minutes % 60}m`;
        if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
        return `${seconds}s`;
    }

    getStats() {
        return {
            totalBots: this.bots.size,
            connectedBots: Array.from(this.bots.values()).filter(bot => bot.status === 'connected').length,
            disconnectedBots: Array.from(this.bots.values()).filter(bot => bot.status === 'disconnected').length,
            connectingBots: Array.from(this.bots.values()).filter(bot => bot.status === 'connecting').length
        };
    }
}

// Create singleton instance
const jadiBot = new JadiBot();

module.exports = { startJadiBot: jadiBot.startJadiBot.bind(jadiBot), jadiBot };