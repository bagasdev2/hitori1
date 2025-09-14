const chalk = require('chalk');
const moment = require('moment');

class MenuTemplate {
    constructor() {
        this.botName = 'HITORI-MASTER';
        this.version = '1.0.0';
    }

    // Main menu
    generateMainMenu(botStats = {}) {
        const currentTime = moment().format('HH:mm DD/MM/YYYY');
        const uptime = this.formatUptime(process.uptime());
        
        return `
╭─「 *${this.botName}* 」
│ 🤖 WhatsApp Bot Full Power
│ 📱 Version: ${this.version}
│ ⏰ ${currentTime}
│ 🔄 Uptime: ${uptime}
│ 👥 Users: ${botStats.users || 0}
│ 🏢 Groups: ${botStats.groups || 0}
╰────────────────

╭─「 *📋 MENU CATEGORIES* 」
│ • .botinfo - Bot information
│ • .groupmenu - Group commands
│ • .mediamenu - Media tools
│ • .gamemenu - Games & Fun
│ • .aimenu - AI & Tools
│ • .downloadmenu - Download tools
│ • .ownermenu - Owner commands
╰────────────────

╭─「 *🎯 QUICK COMMANDS* 」
│ • .ping - Check bot status
│ • .sticker - Create sticker
│ • .ai <text> - Ask AI
│ • .ytdl <url> - YouTube download
│ • .tictactoe - Play game
╰────────────────

*🎉 Type any menu to see commands!*

Made with ❤️ by ${this.botName}
        `;
    }

    // Bot information menu
    generateBotInfo(stats = {}) {
        const uptime = this.formatUptime(process.uptime());
        const memory = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
        
        return `
╭─「 *🤖 BOT INFORMATION* 」
│ 📱 Name: ${this.botName}
│ 🏷️ Version: ${this.version}
│ ⏰ Uptime: ${uptime}
│ 💾 Memory: ${memory} MB
│ 🖥️ Platform: ${process.platform}
│ 📡 Node.js: ${process.version}
│ 👥 Total Users: ${stats.totalUsers || 0}
│ 🏢 Total Groups: ${stats.totalGroups || 0}
│ 📨 Messages Today: ${stats.messagesToday || 0}
│ 🎯 Commands Used: ${stats.commandsUsed || 0}
╰────────────────

╭─「 *🎛️ FEATURES* 」
│ ✅ Multi-language support
│ ✅ Anti-spam protection
│ ✅ Auto-reply system
│ ✅ Media processing
│ ✅ Game system
│ ✅ AI integration
│ ✅ Group management
│ ✅ Download tools
│ ✅ Sticker maker
│ ✅ JadiBot system
╰────────────────

*🔗 Support: github.com/hitori-master*
        `;
    }

    // Group management menu
    generateGroupMenu() {
        return `
╭─「 *👥 GROUP COMMANDS* 」
│ *🛡️ ADMIN ONLY*
│ • .kick @user - Kick member
│ • .promote @user - Make admin
│ • .demote @user - Remove admin
│ • .add <number> - Add member
│ • .setname <text> - Change name
│ • .setdesc <text> - Change desc
│ • .group open/close - Group settings
│ • .antilink on/off - Toggle anti-link
│ • .welcome on/off - Toggle welcome
│ • .autokick on/off - Auto-kick inactive
╰────────────────

╭─「 *📢 MESSAGING* 」
│ • .hidetag <text> - Hidden mention
│ • .tagall - Tag all members
│ • .announce <text> - Announcement
│ • .vote <question> - Create poll
│ • .poll <options> - Multiple choice
╰────────────────

╭─「 *📊 GROUP INFO* 」
│ • .groupinfo - Group details
│ • .admins - List admins
│ • .members - Member count
│ • .stats - Group statistics
│ • .leaderboard - Active members
│ • .inactive - Inactive members
╰────────────────

╭─「 *⚙️ SETTINGS* 」
│ • .setrules <text> - Set rules
│ • .rules - Show rules
│ • .setlang <code> - Set language
│ • .timezone <zone> - Set timezone
│ • .filter add <word> - Add filter
│ • .filter remove <word> - Remove filter
╰────────────────

*📝 Note: Admin commands require admin privileges*
        `;
    }

    // Media tools menu
    generateMediaMenu() {
        return `
╭─「 *🎨 MEDIA TOOLS* 」
│ *🖼️ STICKERS*
│ • .sticker - Create sticker
│ • .s - Quick sticker
│ • .takestick <pack|author> - Add metadata
│ • .toimg - Sticker to image
│ • .tovideo - Sticker to video
│ • .smeme <top|bottom> - Meme sticker
│ • .attp <text> - Text to sticker
╰────────────────

╭─「 *🖼️ IMAGE TOOLS* 」
│ • .blur - Blur image
│ • .sharpen - Sharpen image
│ • .invert - Invert colors
│ • .grayscale - Black & white
│ • .sepia - Sepia effect
│ • .resize <width>x<height> - Resize
│ • .compress - Compress image
│ • .enhance - Enhance quality
╰────────────────

╭─「 *🎵 AUDIO TOOLS* 」
│ • .bass - Bass boost
│ • .deep - Deep voice
│ • .fast - Speed up
│ • .slow - Speed down
│ • .robot - Robot voice
│ • .nightcore - Nightcore effect
│ • .reverse - Reverse audio
│ • .volume <level> - Adjust volume
╰────────────────

╭─「 *🎥 VIDEO TOOLS* 」
│ • .compress - Compress video
│ • .togif - Video to GIF
│ • .reverse - Reverse video
│ • .trim <start>-<end> - Trim video
│ • .rotate <angle> - Rotate video
│ • .watermark <text> - Add watermark
╰────────────────

*📎 Reply to media with command*
        `;
    }

    // Games menu
    generateGameMenu() {
        return `
╭─「 *🎮 GAMES & FUN* 」
│ *🎯 COMPETITIVE GAMES*
│ • .tictactoe - TicTacToe game
│ • .connect4 - Connect Four
│ • .chess - Chess game
│ • .checkers - Checkers game
│ • .battleship - Battleship
│ • .wordchain - Word chain
╰────────────────

╭─「 *🎲 LUCK GAMES* 」
│ • .slot - Slot machine
│ • .dice - Roll dice
│ • .coin - Coin flip
│ • .lottery - Buy lottery ticket
│ • .scratch - Scratch card
│ • .roulette <bet> - Roulette
╰────────────────

╭─「 *🧠 QUIZ GAMES* 」
│ • .math - Math quiz
│ • .tebakangka - Guess number
│ • .tebakgambar - Guess image
│ • .tebaklagu - Guess song
│ • .trivia - Trivia quiz
│ • .riddle - Riddle game
╰────────────────

╭─「 *🎊 FUN COMMANDS* 」
│ • .truth - Truth question
│ • .dare - Dare challenge
│ • .rate - Rate something
│ • .ship @user1 @user2 - Ship users
│ • .jodohku - Find match
│ • .cekmati - Death percentage
│ • .cekgay - Gay percentage
│ • .ceksange - Sanity check
╰────────────────

╭─「 *🏆 STATISTICS* 」
│ • .mystats - Your game stats
│ • .leaderboard - Top players
│ • .ranking - Global ranking
│ • .gamestats - Game statistics
╰────────────────

*🎮 Type command to play!*
        `;
    }

    // AI and tools menu
    generateAIMenu() {
        return `
╭─「 *🤖 AI FEATURES* 」
│ *💭 CHAT AI*
│ • .ai <text> - General AI chat
│ • .gpt <text> - ChatGPT style
│ • .claude <text> - Claude AI
│ • .gemini <text> - Google Gemini
│ • .simi <text> - SimSimi chat
│ • .character <name> <text> - Character AI
╰────────────────

╭─「 *🎨 AI GENERATION* 」
│ • .txt2img <prompt> - Text to image
│ • .img2img <style> - Image to image
│ • .logo <text> - Generate logo
│ • .banner <text> - Create banner
│ • .avatar - Generate avatar
│ • .qrcode <text> - Create QR code
╰────────────────

╭─「 *🔧 UTILITIES* 」
│ • .translate <lang> <text> - Translate
│ • .tts <lang> <text> - Text to speech
│ • .weather <city> - Weather info
│ • .news - Latest news
│ • .crypto <symbol> - Crypto price
│ • .calc <expression> - Calculator
│ • .base64 encode/decode <text> - Base64
╰────────────────

╭─「 *🔍 SEARCH TOOLS* 」
│ • .google <query> - Google search
│ • .image <query> - Image search
│ • .lyrics <song> - Song lyrics
│ • .recipe <dish> - Recipe search
│ • .movie <title> - Movie info
│ • .anime <title> - Anime info
╰────────────────

╭─「 *📚 EDUCATIONAL* 」
│ • .define <word> - Dictionary
│ • .synonym <word> - Synonyms
│ • .formula <topic> - Math formulas
│ • .element <name> - Periodic table
│ • .country <name> - Country info
│ • .history <date> - This day in history
╰────────────────

*🧠 Powered by advanced AI models*
        `;
    }

    // Download menu
    generateDownloadMenu() {
        return `
╭─「 *📥 DOWNLOAD TOOLS* 」
│ *🎵 MUSIC*
│ • .ytmp3 <url> - YouTube audio
│ • .ytmp4 <url> - YouTube video
│ • .spotify <url> - Spotify track
│ • .soundcloud <url> - SoundCloud
│ • .play <query> - Search & play
│ • .song <title> - Download song
╰────────────────

╭─「 *📱 SOCIAL MEDIA* 」
│ • .tiktok <url> - TikTok video
│ • .instagram <url> - Instagram post
│ • .facebook <url> - Facebook video
│ • .twitter <url> - Twitter video
│ • .pinterest <url> - Pinterest image
│ • .reddit <url> - Reddit post
╰────────────────

╭─「 *📺 VIDEO PLATFORMS* 」
│ • .youtube <url> - YouTube video
│ • .dailymotion <url> - Dailymotion
│ • .vimeo <url> - Vimeo video
│ • .twitch <url> - Twitch clip
│ • .bilibili <url> - Bilibili video
╰────────────────

╭─「 *📄 DOCUMENTS* 」
│ • .mediafire <url> - MediaFire
│ • .mega <url> - Mega.nz
│ • .gdrive <url> - Google Drive
│ • .dropbox <url> - Dropbox
│ • .scribd <url> - Scribd document
╰────────────────

╭─「 *🖼️ IMAGES* 」
│ • .pinterest <query> - Pinterest images
│ • .unsplash <query> - Unsplash photos
│ • .pixabay <query> - Free images
│ • .wallpaper <query> - HD wallpapers
│ • .meme <category> - Random memes
╰────────────────

*⚡ Fast & high quality downloads*
        `;
    }

    // Owner commands menu
    generateOwnerMenu() {
        return `
╭─「 *👑 OWNER COMMANDS* 」
│ *🛡️ OWNER ONLY*
│ • .restart - Restart bot
│ • .shutdown - Stop bot
│ • .update - Update bot
│ • .backup - Create backup
│ • .restore - Restore backup
│ • .logs - View logs
│ • .eval <code> - Execute code
│ • .exec <command> - Shell command
╰────────────────

╭─「 *👥 USER MANAGEMENT* 」
│ • .ban @user - Ban user
│ • .unban @user - Unban user
│ • .premium @user - Add premium
│ • .unpremium @user - Remove premium
│ • .setlimit @user <amount> - Set limit
│ • .addmoney @user <amount> - Add money
│ • .resetuser @user - Reset user data
╰────────────────

╭─「 *🏢 GROUP MANAGEMENT* 」
│ • .broadcast <text> - Broadcast message
│ • .broadcastgc <text> - Broadcast groups
│ • .join <link> - Join group
│ • .leave <id> - Leave group
│ • .blocklist - View blocked users
│ • .grouplist - View all groups
╰────────────────

╭─「 *⚙️ BOT SETTINGS* 」
│ • .setname <name> - Set bot name
│ • .setstatus <text> - Set status
│ • .setpp - Set profile picture
│ • .setprefix <prefix> - Change prefix
│ • .maintenance on/off - Maintenance mode
│ • .autoread on/off - Auto read messages
╰────────────────

╭─「 *📊 ANALYTICS* 」
│ • .stats - Bot statistics
│ • .performance - Performance data
│ • .errors - Error logs
│ • .usage - Command usage
│ • .bandwidth - Bandwidth usage
│ • .report - Generate report
╰────────────────

╭─「 *🔧 DATABASE* 」
│ • .dbstats - Database stats
│ • .cleanup - Clean database
│ • .optimize - Optimize database
│ • .export - Export data
│ • .import - Import data
│ • .reset - Reset database
╰────────────────

*⚠️ Use these commands carefully!*
        `;
    }

    // JadiBot menu
    generateJadiBotMenu() {
        return `
╭─「 *🤖 JADIBOT SYSTEM* 」
│ *📱 SETUP*
│ • .jadibot - Start JadiBot
│ • .stopjadibot - Stop JadiBot
│ • .getcode - Get pairing code
│ • .reconnect - Reconnect JadiBot
│ • .jadistatus - Check status
╰────────────────

╭─「 *📋 INFORMATION* 」
│ • .listjadibot - List active bots
│ • .myjadibot - Your JadiBot info
│ • .jadistats - JadiBot statistics
│ • .botcount - Total bots count
╰────────────────

╭─「 *⚙️ MANAGEMENT* 」
│ • .jadiprefix <prefix> - Change prefix
│ • .jadisettings - Bot settings
│ • .jadiname <name> - Change name
│ • .jadibio <bio> - Change bio
│ • .jadiavatar - Change avatar
╰────────────────

╭─「 *🎮 FEATURES* 」
│ • All main bot commands
│ • Independent operation  
│ • Custom settings
│ • Own statistics
│ • Auto-reply system
│ • Media processing
╰────────────────

╭─「 *💡 HOW TO USE* 」
│ 1. Type .jadibot
│ 2. Wait for pairing code
│ 3. Open WhatsApp > Settings
│ 4. Go to Linked Devices
│ 5. Enter the pairing code
│ 6. Your JadiBot is ready!
╰────────────────

*🚀 Run your own WhatsApp bot!*
        `;
    }

    // Premium features menu
    generatePremiumMenu() {
        return `
╭─「 *💎 PREMIUM FEATURES* 」
│ *🌟 EXCLUSIVE ACCESS*
│ • Unlimited downloads
│ • Priority processing
│ • Advanced AI features
│ • Custom commands
│ • No cooldowns
│ • Premium support
│ • Early access features
│ • Custom sticker packs
╰────────────────

╭─「 *🎨 PREMIUM TOOLS* 」
│ • HD image processing
│ • Professional stickers  
│ • Advanced video editing
│ • AI image generation
│ • Batch processing
│ • Cloud storage access
│ • API integrations
│ • Custom automations
╰────────────────

╭─「 *💰 PRICING* 」
│ • Daily: $1.99
│ • Weekly: $9.99
│ • Monthly: $19.99
│ • Lifetime: $99.99
│ 
│ *🎁 Special Offers*
│ • First week free
│ • Student discount 50%
│ • Group discounts available
╰────────────────

╭─「 *💳 HOW TO GET* 」
│ • .premium buy - Purchase
│ • .premium gift @user - Gift premium
│ • .premium status - Check status
│ • .premium features - Full list
╰────────────────

*✨ Upgrade for the ultimate experience!*
        `;
    }

    // Help menu for specific command
    generateCommandHelp(command) {
        const helps = {
            sticker: `
*🎯 STICKER COMMAND HELP*

📝 *Usage:*
• .sticker - Reply to image/video
• .s - Quick sticker creation
• .sticker pack|author - With metadata

🎨 *Features:*
• Image to sticker
• Video to animated sticker  
• GIF to sticker
• Custom pack name
• Custom author name

📋 *Examples:*
• .s (reply to image)
• .sticker HITORI|Master
• .sticker (reply to video)

⚡ *Tips:*
• Use square images for best results
• Videos will be limited to 6 seconds
• Animated stickers work in most apps
            `,
            
            ai: `
*🤖 AI COMMAND HELP*

📝 *Usage:*
• .ai <question> - General AI
• .gpt <text> - ChatGPT style
• .claude <text> - Claude AI

🧠 *Features:*
• Natural conversation
• Multiple AI models
• Context awareness
• Multi-language support

📋 *Examples:*
• .ai What is the capital of France?
• .gpt Write a poem about nature
• .claude Explain quantum physics

⚡ *Tips:*
• Be specific in your questions
• Use proper grammar for better results
• Context from previous messages is remembered
            `,
            
            download: `
*📥 DOWNLOAD COMMAND HELP*

📝 *Usage:*
• .ytdl <url> - YouTube download
• .tiktok <url> - TikTok download
• .instagram <url> - Instagram download

🎵 *Supported:*
• YouTube (video/audio)
• TikTok (no watermark)
• Instagram (posts/stories)
• Facebook videos
• Twitter videos

📋 *Examples:*
• .ytdl https://youtu.be/dQw4w9WgXcQ
• .tiktok https://tiktok.com/@user/video
• .instagram https://instagram.com/p/ABC123

⚡ *Tips:*
• Use full URLs for best results
• Some content may be region-restricted
• Downloads are processed in queue
            `
        };

        return helps[command] || `❌ No help available for command: ${command}`;
    }

    // Format uptime helper
    formatUptime(seconds) {
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

    // Generate custom menu
    generateCustomMenu(title, commands, description = '') {
        let menu = `╭─「 *${title}* 」\n`;
        
        if (description) {
            menu += `│ ${description}\n`;
            menu += `╰────────────────\n\n`;
        }

        const categories = {};
        
        commands.forEach(cmd => {
            const category = cmd.category || 'General';
            if (!categories[category]) {
                categories[category] = [];
            }
            categories[category].push(cmd);
        });

        Object.keys(categories).forEach(category => {
            menu += `╭─「 *${category.toUpperCase()}* 」\n`;
            categories[category].forEach(cmd => {
                menu += `│ • ${cmd.command} - ${cmd.description}\n`;
            });
            menu += `╰────────────────\n\n`;
        });

        menu += `Made with ❤️ by ${this.botName}`;
        
        return menu;
    }

    // Generate stats menu
    generateStatsMenu(userStats, groupStats, botStats) {
        return `
╭─「 *📊 STATISTICS* 」
│ *🤖 BOT STATS*
│ • Uptime: ${this.formatUptime(process.uptime())}
│ • Messages: ${botStats.totalMessages || 0}
│ • Commands: ${botStats.totalCommands || 0}
│ • Users: ${botStats.totalUsers || 0}
│ • Groups: ${botStats.totalGroups || 0}
│ • Memory: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB
╰────────────────

╭─「 *👤 YOUR STATS* 」
│ • Messages sent: ${userStats.messages || 0}
│ • Commands used: ${userStats.commands || 0}
│ • Games played: ${userStats.games || 0}
│ • Stickers made: ${userStats.stickers || 0}
│ • Downloads: ${userStats.downloads || 0}
│ • AI queries: ${userStats.ai || 0}
╰────────────────

╭─「 *🏢 GROUP STATS* 」
│ • Total messages: ${groupStats.messages || 0}
│ • Active members: ${groupStats.activeMembers || 0}
│ • Commands used: ${groupStats.commands || 0}
│ • Media shared: ${groupStats.media || 0}
╰────────────────

*📈 Updated: ${moment().format('HH:mm DD/MM/YYYY')}*
        `;
    }
}

// Create singleton instance
const menuTemplate = new MenuTemplate();

module.exports = menuTemplate;