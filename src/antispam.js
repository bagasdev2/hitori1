const chalk = require('chalk');

class AntiSpam {
    constructor() {
        this.userMessages = new Map();
        this.spamThreshold = 5; // Max messages per interval
        this.timeWindow = 10000; // 10 seconds
        this.banDuration = 300000; // 5 minutes ban
        this.bannedUsers = new Map();
    }

    async check(message) {
        try {
            const userId = message.key.participant || message.key.remoteJid;
            const now = Date.now();

            // Check if user is currently banned
            if (this.bannedUsers.has(userId)) {
                const banExpiry = this.bannedUsers.get(userId);
                if (now < banExpiry) {
                    console.log(chalk.yellow(`🚫 Blocked spam message from ${userId}`));
                    return true; // Block message
                } else {
                    // Ban expired, remove from banned list
                    this.bannedUsers.delete(userId);
                }
            }

            // Initialize user message tracking
            if (!this.userMessages.has(userId)) {
                this.userMessages.set(userId, []);
            }

            const userMsgHistory = this.userMessages.get(userId);
            
            // Clean old messages outside time window
            const validMessages = userMsgHistory.filter(timestamp => 
                now - timestamp < this.timeWindow
            );

            // Add current message
            validMessages.push(now);
            this.userMessages.set(userId, validMessages);

            // Check if user exceeded spam threshold
            if (validMessages.length > this.spamThreshold) {
                // Ban user temporarily
                this.bannedUsers.set(userId, now + this.banDuration);
                console.log(chalk.red(`🚫 User ${userId} banned for spam (${this.banDuration/1000}s)`));
                
                // Clear message history
                this.userMessages.delete(userId);
                
                return true; // Block message
            }

            return false; // Allow message

        } catch (error) {
            console.error(chalk.red('❌ Error in antispam check:'), error);
            return false; // Allow message on error
        }
    }

    // Check for repeated messages (flood)
    async checkFlood(message) {
        try {
            const messageText = this.extractText(message);
            if (!messageText) return false;

            const userId = message.key.participant || message.key.remoteJid;
            const cacheKey = `${userId}_lastmsg`;
            
            if (this.lastMessages && this.lastMessages[cacheKey]) {
                const lastMsg = this.lastMessages[cacheKey];
                const timeDiff = Date.now() - lastMsg.timestamp;
                
                // If same message sent within 3 seconds
                if (lastMsg.text === messageText && timeDiff < 3000) {
                    console.log(chalk.yellow(`🔄 Flood detected from ${userId}`));
                    return true; // Block flood message
                }
            }

            // Store last message
            if (!this.lastMessages) this.lastMessages = {};
            this.lastMessages[cacheKey] = {
                text: messageText,
                timestamp: Date.now()
            };

            return false;

        } catch (error) {
            console.error(chalk.red('❌ Error in flood check:'), error);
            return false;
        }
    }

    // Extract text content from message
    extractText(message) {
        try {
            if (!message.message) return '';

            const messageType = Object.keys(message.message)[0];
            let text = '';

            switch (messageType) {
                case 'conversation':
                    text = message.message.conversation;
                    break;
                case 'extendedTextMessage':
                    text = message.message.extendedTextMessage.text;
                    break;
                case 'imageMessage':
                    text = message.message.imageMessage.caption || '';
                    break;
                case 'videoMessage':
                    text = message.message.videoMessage.caption || '';
                    break;
                default:
                    text = '';
            }

            return text.trim();
        } catch (error) {
            return '';
        }
    }

    // Check for racist/offensive content
    async checkRacism(message) {
        try {
            const text = this.extractText(message).toLowerCase();
            if (!text) return false;

            const racistWords = [
                'bangsat', 'anjing', 'babi', 'tolol', 'idiot', 'goblok',
                'kontol', 'memek', 'ngentot', 'bangke', 'asu',
                // Add more offensive words here
            ];

            const hasOffensiveWord = racistWords.some(word => 
                text.includes(word)
            );

            if (hasOffensiveWord) {
                const userId = message.key.participant || message.key.remoteJid;
                console.log(chalk.red(`🤬 Offensive content detected from ${userId}`));
                return true;
            }

            return false;

        } catch (error) {
            console.error(chalk.red('❌ Error in racism check:'), error);
            return false;
        }
    }

    // Combined check function
    async check(message) {
        try {
            // Skip bot's own messages
            if (message.key.fromMe) return false;

            // Check spam
            const isSpam = await this.checkSpam(message);
            if (isSpam) return true;

            // Check flood
            const isFlood = await this.checkFlood(message);
            if (isFlood) return true;

            // Check racist content
            const isOffensive = await this.checkRacism(message);
            if (isOffensive) return true;

            return false;

        } catch (error) {
            console.error(chalk.red('❌ Error in antispam check:'), error);
            return false;
        }
    }

    // Alias for main check
    async checkSpam(message) {
        return await this.check(message);
    }

    // Get banned users list
    getBannedUsers() {
        const now = Date.now();
        const activeBans = [];
        
        for (const [userId, expiry] of this.bannedUsers.entries()) {
            if (now < expiry) {
                activeBans.push({
                    userId,
                    expiry,
                    remaining: expiry - now
                });
            }
        }
        
        return activeBans;
    }

    // Manual ban user
    banUser(userId, duration = this.banDuration) {
        const expiry = Date.now() + duration;
        this.bannedUsers.set(userId, expiry);
        console.log(chalk.red(`🚫 Manually banned user ${userId} for ${duration/1000}s`));
        return expiry;
    }

    // Manual unban user
    unbanUser(userId) {
        if (this.bannedUsers.has(userId)) {
            this.bannedUsers.delete(userId);
            console.log(chalk.green(`✅ Unbanned user ${userId}`));
            return true;
        }
        return false;
    }

    // Clear all data
    clearData() {
        this.userMessages.clear();
        this.bannedUsers.clear();
        this.lastMessages = {};
        console.log(chalk.blue('🧹 Anti-spam data cleared'));
    }

    // Get statistics
    getStats() {
        return {
            totalTrackedUsers: this.userMessages.size,
            totalBannedUsers: this.bannedUsers.size,
            spamThreshold: this.spamThreshold,
            timeWindow: this.timeWindow,
            banDuration: this.banDuration
        };
    }
}

// Create singleton instance
const antispam = new AntiSpam();

module.exports = antispam;