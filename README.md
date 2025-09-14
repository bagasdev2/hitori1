# HITORI-MASTER WhatsApp Bot

🤖 **WhatsApp Bot Full Power** dengan fitur lengkap dan modern untuk mengelola grup, entertainment, dan produktivitas.

## ✨ Fitur Utama

### 🤖 **Bot Core**
- ✅ Login tanpa QR Code (Pairing Code/GitHub Token)
- ✅ Multi-device support dengan Baileys
- ✅ Auto-reply sistem cerdas
- ✅ Anti-spam & Anti-flood protection
- ✅ Backup & restore session otomatis
- ✅ JadiBot multi-user system

### 👥 **Grup Management Next-Level**
- 🎉 Auto Welcome/Goodbye dengan sticker
- 🔗 Anti-Link & Anti-Invite protection
- 📊 Statistik grup & member activity
- ⏰ Scheduled announcements
- 🎯 Member patrol (auto-kick inactive 7 days)
- 💬 Vote/Poll system untuk grup
- 🏷️ Tag management (TagAll/HideTag)

### 🎮 **Games & Entertainment**
- 🎯 TicTacToe, Connect4, Chess
- 🎰 Slot machine, Dice, Lottery
- 🧠 Math Quiz, Trivia, Riddles
- 🎲 Truth/Dare, Ship calculator
- 📊 Leaderboard & achievements
- 🏆 Gaming statistics tracking

### 🎨 **Media Tools & AI**
- 🖼️ Advanced sticker maker dengan EXIF
- 🎵 Audio effects (bass, nightcore, robot)
- 📱 Video processing & editing
- 🤖 AI Chat (GPT, Claude, Gemini)
- 🎭 Text-to-Image generation
- 📝 Nulis (handwriting generator)

### 📥 **Download Engine**
- 🎵 YouTube (MP3/MP4)
- 📱 TikTok (no watermark)
- 📸 Instagram, Facebook, Twitter
- ☁️ MediaFire, Google Drive, Mega
- 🎨 Pinterest, Unsplash images

### 🛡️ **Keamanan & Moderasi**
- 🚫 Anti-delete message recovery
- 🤬 Profanity filter dengan AI
- 👑 Role-based access control
- 📊 Analytics & performance monitoring
- 🔒 User ban/premium system

## 🚀 Quick Start

### Persiapan
```bash
# Clone repository
git clone https://github.com/your-username/hitori-master.git
cd hitori-master

# Install dependencies
npm install

# Start bot
npm start
```

### Konfigurasi
1. Edit `database/database.json` untuk owner number
2. Bot akan generate pairing code otomatis
3. Scan code atau masukkan di WhatsApp > Linked Devices

## 📱 Termux Installation

```bash
# Update packages
pkg update && pkg upgrade

# Install required packages
pkg install nodejs npm git ffmpeg

# Clone bot
git clone https://github.com/your-username/hitori-master.git
cd hitori-master

# Install dependencies
npm install

# Start bot
node src/index.js
```

## 🎯 Command Categories

### 📋 **General Commands**
```
.menu        - Main menu
.ping        - Bot status
.info        - Bot information
.stats       - Statistics
.help <cmd>  - Command help
```

### 👑 **Owner Commands**
```
.restart     - Restart bot
.backup      - Create backup
.ban @user   - Ban user
.premium     - Manage premium
.broadcast   - Broadcast message
```

### 👥 **Group Commands**  
```
.kick @user     - Kick member
.promote @user  - Make admin
.tagall         - Tag all members
.antilink on    - Enable anti-link
.vote <text>    - Create poll
```

### 🎨 **Media Commands**
```
.sticker      - Create sticker
.toimg        - Sticker to image
.blur         - Blur effect
.bass         - Bass boost
.compress     - Compress media
```

### 🎮 **Game Commands**
```
.tictactoe    - Play TicTacToe  
.slot         - Slot machine
.math         - Math quiz
.tebakangka   - Guess number
.leaderboard  - Top players
```

### 🤖 **AI Commands**
```
.ai <text>      - General AI
.gpt <text>     - ChatGPT
.txt2img <text> - Generate image
.translate      - Translate text
.summarize      - Summarize text
```

### 📥 **Download Commands**
```
.ytdl <url>     - YouTube download
.tiktok <url>   - TikTok download
.instagram <url> - Instagram download
.spotify <url>   - Spotify track
.mediafire <url> - MediaFire download
```

## 🏗️ Struktur Project

```
hitori-master/
├── src/
│   ├── index.js          # Main entry point
│   ├── message.js        # Message handler
│   ├── database.js       # Database manager
│   ├── antispam.js       # Anti-spam system
│   ├── jadibot.js        # JadiBot system
│   ├── media/            # Media assets
│   ├── nulis/            # Font & handwriting
│   └── plugins/          # Plugin system
├── lib/
│   ├── function.js       # Utility functions
│   ├── converter.js      # Media converter
│   ├── exif.js           # Sticker metadata
│   ├── game.js           # Game engine
│   ├── math.js           # Math calculator
│   └── template_menu.js  # Menu templates
├── database/
│   ├── database.json     # Main database
│   ├── stats.json        # Statistics
│   ├── jadibot/          # JadiBot sessions
│   └── sampah/           # Temp files
└── package.json          # Dependencies
```

## 🔧 Advanced Configuration

### Environment Variables
```env
# Bot Settings
BOT_NAME=HITORI-MASTER
OWNER_NUMBER=6281234567890
PREFIX=.
TIMEZONE=Asia/Jakarta

# API Keys (optional)
OPENAI_API_KEY=your_openai_key
GOOGLE_API_KEY=your_google_key
SPOTIFY_CLIENT_ID=your_spotify_id
```

### Custom Commands
```javascript
// Add to src/plugins/
module.exports = {
  name: 'customcmd',
  description: 'Custom command',
  execute: async (conn, message, args) => {
    // Your custom logic
  }
};
```

## 🎮 Gaming System

Bot memiliki sistem gaming lengkap dengan:
- 🏆 **Leaderboard global**
- 💰 **Virtual currency system**  
- 🎯 **Achievement badges**
- 📊 **Detailed statistics**
- 🎁 **Daily rewards**
- 🏅 **Tournament system**

## 🤖 JadiBot System

Fitur unik yang memungkinkan user menjalankan bot sendiri:
- 📱 **Multi-user support**
- 🔐 **Pairing code authentication**
- ⚙️ **Independent settings**
- 📊 **Separate statistics**
- 🛡️ **Secure session management**

## 🛡️ Security Features

- 🔒 **Rate limiting & anti-spam**
- 🚫 **Malicious content detection**  
- 👑 **Permission-based commands**
- 📝 **Audit logging**
- 🔐 **Secure session storage**
- 🛡️ **Input validation & sanitization**

## 📊 Analytics & Monitoring

- 📈 **Real-time performance metrics**
- 📊 **User behavior analytics**
- 🔍 **Error tracking & logging**  
- 📱 **System resource monitoring**
- 📋 **Daily/weekly reports**

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Credits

- **Baileys** - WhatsApp Web API
- **FFmpeg** - Media processing
- **Sharp** - Image processing
- **OpenAI** - AI integration
- **Node.js** - Runtime environment

## 💬 Support

- 📧 **Email**: support@hitori-master.com
- 💬 **Telegram**: @HitoriMasterSupport
- 🌐 **Website**: https://hitori-master.com
- 📱 **WhatsApp**: +62 812-3456-7890

---

<div align="center">

**⭐ Star this repo if you like it!**

Made with ❤️ by **HITORI-MASTER Team**

</div>