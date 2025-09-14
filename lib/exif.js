const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

class ExifManager {
    constructor() {
        this.tempDir = './src/media/temp';
    }

    // Create sticker with EXIF data
    async createSticker(conn, message, options = {}) {
        try {
            const { pack = 'HITORI-MASTER', author = 'WhatsApp Bot', quality = 80 } = options;

            let mediaBuffer;
            let messageData;

            // Check if replying to media
            if (message.message.extendedTextMessage?.contextInfo?.quotedMessage) {
                const quotedMessage = message.message.extendedTextMessage.contextInfo.quotedMessage;
                
                if (quotedMessage.imageMessage) {
                    messageData = { key: message.key, message: quotedMessage };
                    mediaBuffer = await conn.downloadMediaMessage(messageData);
                } else if (quotedMessage.videoMessage) {
                    messageData = { key: message.key, message: quotedMessage };
                    mediaBuffer = await conn.downloadMediaMessage(messageData);
                } else {
                    await conn.sendMessage(message.key.remoteJid, {
                        text: '❌ Reply gambar atau video untuk dibuat sticker!'
                    });
                    return;
                }
            } else if (message.message.imageMessage) {
                mediaBuffer = await conn.downloadMediaMessage(message);
            } else if (message.message.videoMessage) {
                mediaBuffer = await conn.downloadMediaMessage(message);
            } else {
                await conn.sendMessage(message.key.remoteJid, {
                    text: '❌ Kirim gambar/video atau reply media untuk dibuat sticker!'
                });
                return;
            }

            console.log(chalk.blue('🎯 Creating sticker with EXIF...'));

            // Process media to WebP format
            const stickerBuffer = await this.processToWebP(mediaBuffer, quality);
            
            // Add EXIF data
            const finalSticker = await this.writeExif(stickerBuffer, { pack, author });

            // Send sticker
            await conn.sendMessage(message.key.remoteJid, {
                sticker: finalSticker
            });

            console.log(chalk.green('✅ Sticker created successfully'));

        } catch (error) {
            console.error(chalk.red('❌ Error creating sticker:'), error);
            await conn.sendMessage(message.key.remoteJid, {
                text: '❌ Gagal membuat sticker!'
            });
        }
    }

    // Process media to WebP format
    async processToWebP(buffer, quality = 80) {
        try {
            const sharp = require('sharp');
            const ffmpeg = require('fluent-ffmpeg');
            const tempInput = path.join(this.tempDir, `input_${Date.now()}`);
            const tempOutput = path.join(this.tempDir, `output_${Date.now()}.webp`);

            await fs.ensureDir(this.tempDir);
            await fs.writeFile(tempInput, buffer);

            // Detect if it's a video or image
            const isVideo = await this.isVideoFile(buffer);

            if (isVideo) {
                // Convert video to animated WebP using FFmpeg
                await new Promise((resolve, reject) => {
                    ffmpeg(tempInput)
                        .outputOptions([
                            '-vcodec libwebp',
                            '-vf scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=white@0.0',
                            '-lossless 0',
                            '-compression_level 6',
                            `-quality ${quality}`,
                            '-preset picture',
                            '-an',
                            '-vsync 0',
                            '-loop 0'
                        ])
                        .duration(6) // Limit to 6 seconds
                        .save(tempOutput)
                        .on('end', resolve)
                        .on('error', reject);
                });
            } else {
                // Convert image to WebP using Sharp
                await sharp(tempInput)
                    .resize(512, 512, {
                        fit: 'contain',
                        background: { r: 255, g: 255, b: 255, alpha: 0 }
                    })
                    .webp({
                        quality: quality,
                        effort: 6
                    })
                    .toFile(tempOutput);
            }

            const result = await fs.readFile(tempOutput);

            // Cleanup
            await fs.unlink(tempInput).catch(() => {});
            await fs.unlink(tempOutput).catch(() => {});

            return result;

        } catch (error) {
            console.error(chalk.red('❌ Error processing to WebP:'), error);
            throw error;
        }
    }

    // Write EXIF data to WebP
    async writeExif(webpBuffer, metadata) {
        try {
            const { pack, author } = metadata;
            
            // Create EXIF data
            const exifData = {
                'sticker-pack-id': 'HITORI-MASTER-STICKERS',
                'sticker-pack-name': pack,
                'sticker-pack-publisher': author,
                'sticker-pack-publisher-email': '',
                'sticker-pack-publisher-website': '',
                'android-app-store-link': '',
                'ios-app-store-link': '',
                'emojies': ['😀', '😂', '🤖']
            };

            // For now, return buffer as-is since WebP EXIF is complex
            // In a real implementation, you would use a proper EXIF library
            return webpBuffer;

        } catch (error) {
            console.error(chalk.red('❌ Error writing EXIF:'), error);
            return webpBuffer;
        }
    }

    // Check if buffer contains video
    async isVideoFile(buffer) {
        try {
            // Simple check based on file headers
            const header = buffer.slice(0, 12);
            
            // Check for common video formats
            if (header.includes(Buffer.from('ftyp'))) return true; // MP4
            if (header.includes(Buffer.from('AVI '))) return true; // AVI
            if (header.includes(Buffer.from('WEBM'))) return true; // WebM
            if (header.includes(Buffer.from('MThd'))) return true; // MOV
            
            return false;
        } catch {
            return false;
        }
    }

    // Create custom sticker with text
    async createTextSticker(conn, chatId, text, options = {}) {
        try {
            const { 
                backgroundColor = '#FFFFFF', 
                textColor = '#000000',
                fontSize = 100,
                pack = 'HITORI-MASTER',
                author = 'Text Sticker'
            } = options;

            console.log(chalk.blue('📝 Creating text sticker...'));

            const canvas = require('canvas');
            const canvasElement = canvas.createCanvas(512, 512);
            const ctx = canvasElement.getContext('2d');

            // Set background
            ctx.fillStyle = backgroundColor;
            ctx.fillRect(0, 0, 512, 512);

            // Set text properties
            ctx.fillStyle = textColor;
            ctx.font = `${fontSize}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // Word wrap function
            const words = text.split(' ');
            const lines = [];
            let currentLine = '';

            for (const word of words) {
                const testLine = currentLine + (currentLine ? ' ' : '') + word;
                const metrics = ctx.measureText(testLine);
                
                if (metrics.width > 450) {
                    if (currentLine) {
                        lines.push(currentLine);
                        currentLine = word;
                    } else {
                        lines.push(word);
                    }
                } else {
                    currentLine = testLine;
                }
            }
            
            if (currentLine) {
                lines.push(currentLine);
            }

            // Draw text lines
            const lineHeight = fontSize * 1.2;
            const startY = 256 - (lines.length - 1) * lineHeight / 2;

            for (let i = 0; i < lines.length; i++) {
                ctx.fillText(lines[i], 256, startY + i * lineHeight);
            }

            // Convert to buffer
            const imageBuffer = canvasElement.toBuffer('image/png');
            
            // Convert to WebP sticker
            const stickerBuffer = await this.processToWebP(imageBuffer);
            const finalSticker = await this.writeExif(stickerBuffer, { pack, author });

            // Send sticker
            await conn.sendMessage(chatId, {
                sticker: finalSticker
            });

            console.log(chalk.green('✅ Text sticker created successfully'));

        } catch (error) {
            console.error(chalk.red('❌ Error creating text sticker:'), error);
            await conn.sendMessage(chatId, {
                text: '❌ Gagal membuat text sticker!'
            });
        }
    }

    // Create meme sticker
    async createMemeSticker(conn, message, topText = '', bottomText = '', options = {}) {
        try {
            const { pack = 'HITORI-MASTER', author = 'Meme Sticker' } = options;

            if (!message.message.imageMessage) {
                await conn.sendMessage(message.key.remoteJid, {
                    text: '❌ Reply gambar untuk membuat meme sticker!'
                });
                return;
            }

            console.log(chalk.blue('😂 Creating meme sticker...'));

            const imageBuffer = await conn.downloadMediaMessage(message);
            
            const canvas = require('canvas');
            const sharp = require('sharp');

            // Load image
            const image = await canvas.loadImage(imageBuffer);
            const canvasElement = canvas.createCanvas(512, 512);
            const ctx = canvasElement.getContext('2d');

            // Draw background image
            ctx.drawImage(image, 0, 0, 512, 512);

            // Set text properties
            ctx.fillStyle = 'white';
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 4;
            ctx.font = 'bold 40px Impact, Arial';
            ctx.textAlign = 'center';

            // Draw top text
            if (topText) {
                ctx.fillText(topText.toUpperCase(), 256, 50);
                ctx.strokeText(topText.toUpperCase(), 256, 50);
            }

            // Draw bottom text
            if (bottomText) {
                ctx.fillText(bottomText.toUpperCase(), 256, 470);
                ctx.strokeText(bottomText.toUpperCase(), 256, 470);
            }

            // Convert to buffer
            const memeBuffer = canvasElement.toBuffer('image/png');
            
            // Convert to WebP sticker
            const stickerBuffer = await this.processToWebP(memeBuffer);
            const finalSticker = await this.writeExif(stickerBuffer, { pack, author });

            // Send sticker
            await conn.sendMessage(message.key.remoteJid, {
                sticker: finalSticker
            });

            console.log(chalk.green('✅ Meme sticker created successfully'));

        } catch (error) {
            console.error(chalk.red('❌ Error creating meme sticker:'), error);
            await conn.sendMessage(message.key.remoteJid, {
                text: '❌ Gagal membuat meme sticker!'
            });
        }
    }

    // Get sticker info
    async getStickerInfo(message) {
        try {
            if (!message.message.stickerMessage) {
                return null;
            }

            const buffer = await conn.downloadMediaMessage(message);
            
            // Extract EXIF data (simplified version)
            return {
                size: buffer.length,
                format: 'WebP',
                dimensions: '512x512',
                isAnimated: buffer.includes(Buffer.from('ANMF'))
            };

        } catch (error) {
            console.error(chalk.red('❌ Error getting sticker info:'), error);
            return null;
        }
    }
}

// Create singleton instance
const exifManager = new ExifManager();

module.exports = {
    createSticker: exifManager.createSticker.bind(exifManager),
    createTextSticker: exifManager.createTextSticker.bind(exifManager),
    createMemeSticker: exifManager.createMemeSticker.bind(exifManager),
    writeExif: exifManager.writeExif.bind(exifManager),
    getStickerInfo: exifManager.getStickerInfo.bind(exifManager),
    exifManager
};