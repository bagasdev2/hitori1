const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const sharp = require('sharp');
const ffmpeg = require('fluent-ffmpeg');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

class MediaConverter {
    constructor() {
        this.tempDir = './src/media/temp';
        this.outputDir = './src/media/output';
        this.initDirectories();
    }

    async initDirectories() {
        await fs.ensureDir(this.tempDir);
        await fs.ensureDir(this.outputDir);
    }

    // Sticker to Image conversion
    async stickerToImage(conn, message) {
        try {
            if (!message.message || !message.message.stickerMessage) {
                await conn.sendMessage(message.key.remoteJid, {
                    text: '❌ Reply sticker untuk convert ke gambar!'
                });
                return;
            }

            console.log(chalk.blue('🖼️ Converting sticker to image...'));

            // Download sticker
            const stickerBuffer = await conn.downloadMediaMessage(message);
            const inputPath = path.join(this.tempDir, `sticker_${Date.now()}.webp`);
            const outputPath = path.join(this.outputDir, `image_${Date.now()}.png`);

            // Save sticker buffer
            await fs.writeFile(inputPath, stickerBuffer);

            // Convert using Sharp
            await sharp(inputPath)
                .png()
                .toFile(outputPath);

            // Read converted image
            const imageBuffer = await fs.readFile(outputPath);

            // Send converted image
            await conn.sendMessage(message.key.remoteJid, {
                image: imageBuffer,
                caption: '✅ Sticker berhasil diconvert ke gambar!'
            });

            // Cleanup
            await fs.unlink(inputPath);
            await fs.unlink(outputPath);

            console.log(chalk.green('✅ Sticker to image conversion completed'));

        } catch (error) {
            console.error(chalk.red('❌ Error converting sticker to image:'), error);
            await conn.sendMessage(message.key.remoteJid, {
                text: '❌ Gagal convert sticker ke gambar!'
            });
        }
    }

    // Sticker to Video conversion
    async stickerToVideo(conn, message) {
        try {
            if (!message.message || !message.message.stickerMessage) {
                await conn.sendMessage(message.key.remoteJid, {
                    text: '❌ Reply sticker untuk convert ke video!'
                });
                return;
            }

            console.log(chalk.blue('🎥 Converting sticker to video...'));

            const stickerBuffer = await conn.downloadMediaMessage(message);
            const inputPath = path.join(this.tempDir, `sticker_${Date.now()}.webp`);
            const outputPath = path.join(this.outputDir, `video_${Date.now()}.mp4`);

            await fs.writeFile(inputPath, stickerBuffer);

            // Convert using FFmpeg
            await new Promise((resolve, reject) => {
                ffmpeg(inputPath)
                    .outputFormat('mp4')
                    .videoCodec('libx264')
                    .audioCodec('aac')
                    .duration(5) // 5 seconds loop
                    .save(outputPath)
                    .on('end', resolve)
                    .on('error', reject);
            });

            const videoBuffer = await fs.readFile(outputPath);

            await conn.sendMessage(message.key.remoteJid, {
                video: videoBuffer,
                caption: '✅ Sticker berhasil diconvert ke video!'
            });

            // Cleanup
            await fs.unlink(inputPath);
            await fs.unlink(outputPath);

            console.log(chalk.green('✅ Sticker to video conversion completed'));

        } catch (error) {
            console.error(chalk.red('❌ Error converting sticker to video:'), error);
            await conn.sendMessage(message.key.remoteJid, {
                text: '❌ Gagal convert sticker ke video!'
            });
        }
    }

    // Image to Sticker conversion
    async imageToSticker(conn, message, options = {}) {
        try {
            const { pack = 'HITORI-MASTER', author = 'Bot' } = options;
            
            let imageBuffer;
            let isQuotedImage = false;

            // Check if replying to an image
            if (message.message.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage) {
                const quotedMessage = {
                    key: message.key,
                    message: message.message.extendedTextMessage.contextInfo.quotedMessage
                };
                imageBuffer = await conn.downloadMediaMessage(quotedMessage);
                isQuotedImage = true;
            } else if (message.message.imageMessage) {
                imageBuffer = await conn.downloadMediaMessage(message);
            }

            if (!imageBuffer) {
                await conn.sendMessage(message.key.remoteJid, {
                    text: '❌ Kirim gambar atau reply gambar untuk dibuat sticker!'
                });
                return;
            }

            console.log(chalk.blue('🎯 Converting image to sticker...'));

            const inputPath = path.join(this.tempDir, `image_${Date.now()}.png`);
            const outputPath = path.join(this.outputDir, `sticker_${Date.now()}.webp`);

            await fs.writeFile(inputPath, imageBuffer);

            // Resize and convert to WebP
            await sharp(inputPath)
                .resize(512, 512, {
                    fit: 'contain',
                    background: { r: 0, g: 0, b: 0, alpha: 0 }
                })
                .webp({
                    quality: 80,
                    effort: 6
                })
                .toFile(outputPath);

            const stickerBuffer = await fs.readFile(outputPath);

            // Add EXIF data
            const exifData = await this.addExifData(stickerBuffer, pack, author);

            await conn.sendMessage(message.key.remoteJid, {
                sticker: exifData
            });

            // Cleanup
            await fs.unlink(inputPath);
            await fs.unlink(outputPath);

            console.log(chalk.green('✅ Image to sticker conversion completed'));

        } catch (error) {
            console.error(chalk.red('❌ Error converting image to sticker:'), error);
            await conn.sendMessage(message.key.remoteJid, {
                text: '❌ Gagal convert gambar ke sticker!'
            });
        }
    }

    // Video to GIF conversion
    async videoToGif(conn, message, options = {}) {
        try {
            const { duration = 6, fps = 15, scale = 320 } = options;

            if (!message.message.videoMessage) {
                await conn.sendMessage(message.key.remoteJid, {
                    text: '❌ Reply video untuk convert ke GIF!'
                });
                return;
            }

            console.log(chalk.blue('🎞️ Converting video to GIF...'));

            const videoBuffer = await conn.downloadMediaMessage(message);
            const inputPath = path.join(this.tempDir, `video_${Date.now()}.mp4`);
            const outputPath = path.join(this.outputDir, `gif_${Date.now()}.gif`);

            await fs.writeFile(inputPath, videoBuffer);

            // Convert using FFmpeg
            await new Promise((resolve, reject) => {
                ffmpeg(inputPath)
                    .duration(duration)
                    .fps(fps)
                    .size(`${scale}x?`)
                    .outputFormat('gif')
                    .save(outputPath)
                    .on('end', resolve)
                    .on('error', reject);
            });

            const gifBuffer = await fs.readFile(outputPath);

            await conn.sendMessage(message.key.remoteJid, {
                video: gifBuffer,
                gifPlayback: true,
                caption: '✅ Video berhasil diconvert ke GIF!'
            });

            // Cleanup
            await fs.unlink(inputPath);
            await fs.unlink(outputPath);

            console.log(chalk.green('✅ Video to GIF conversion completed'));

        } catch (error) {
            console.error(chalk.red('❌ Error converting video to GIF:'), error);
            await conn.sendMessage(message.key.remoteJid, {
                text: '❌ Gagal convert video ke GIF!'
            });
        }
    }

    // Audio format conversion
    async convertAudio(conn, message, format = 'mp3', options = {}) {
        try {
            const { bitrate = '128k', sampleRate = 44100 } = options;

            if (!message.message.audioMessage) {
                await conn.sendMessage(message.key.remoteJid, {
                    text: '❌ Reply audio untuk convert format!'
                });
                return;
            }

            console.log(chalk.blue(`🎵 Converting audio to ${format}...`));

            const audioBuffer = await conn.downloadMediaMessage(message);
            const inputPath = path.join(this.tempDir, `audio_${Date.now()}.ogg`);
            const outputPath = path.join(this.outputDir, `audio_${Date.now()}.${format}`);

            await fs.writeFile(inputPath, audioBuffer);

            // Convert using FFmpeg
            await new Promise((resolve, reject) => {
                ffmpeg(inputPath)
                    .audioBitrate(bitrate)
                    .audioFrequency(sampleRate)
                    .format(format)
                    .save(outputPath)
                    .on('end', resolve)
                    .on('error', reject);
            });

            const convertedBuffer = await fs.readFile(outputPath);

            await conn.sendMessage(message.key.remoteJid, {
                audio: convertedBuffer,
                mimetype: `audio/${format}`,
                caption: `✅ Audio berhasil diconvert ke ${format.toUpperCase()}!`
            });

            // Cleanup
            await fs.unlink(inputPath);
            await fs.unlink(outputPath);

            console.log(chalk.green(`✅ Audio to ${format} conversion completed`));

        } catch (error) {
            console.error(chalk.red(`❌ Error converting audio to ${format}:`), error);
            await conn.sendMessage(message.key.remoteJid, {
                text: `❌ Gagal convert audio ke ${format}!`
            });
        }
    }

    // Add EXIF data to sticker
    async addExifData(buffer, pack, author) {
        try {
            const { writeExif } = require('../lib/exif');
            return await writeExif(buffer, { pack, author });
        } catch (error) {
            console.error(chalk.red('❌ Error adding EXIF data:'), error);
            return buffer;
        }
    }

    // Compress image
    async compressImage(buffer, quality = 80) {
        try {
            return await sharp(buffer)
                .jpeg({ quality })
                .toBuffer();
        } catch (error) {
            console.error(chalk.red('❌ Error compressing image:'), error);
            return buffer;
        }
    }

    // Resize image
    async resizeImage(buffer, width, height) {
        try {
            return await sharp(buffer)
                .resize(width, height, {
                    fit: 'contain',
                    background: { r: 255, g: 255, b: 255, alpha: 1 }
                })
                .toBuffer();
        } catch (error) {
            console.error(chalk.red('❌ Error resizing image:'), error);
            return buffer;
        }
    }

    // Clean temporary files
    async cleanTempFiles() {
        try {
            const files = await fs.readdir(this.tempDir);
            const outputFiles = await fs.readdir(this.outputDir);
            
            const now = Date.now();
            const oneHour = 60 * 60 * 1000;

            // Clean temp files older than 1 hour
            for (const file of files) {
                const filePath = path.join(this.tempDir, file);
                const stats = await fs.stat(filePath);
                
                if (now - stats.mtime.getTime() > oneHour) {
                    await fs.unlink(filePath);
                    console.log(chalk.yellow(`🗑️ Cleaned temp file: ${file}`));
                }
            }

            // Clean output files older than 1 hour
            for (const file of outputFiles) {
                const filePath = path.join(this.outputDir, file);
                const stats = await fs.stat(filePath);
                
                if (now - stats.mtime.getTime() > oneHour) {
                    await fs.unlink(filePath);
                    console.log(chalk.yellow(`🗑️ Cleaned output file: ${file}`));
                }
            }

        } catch (error) {
            console.error(chalk.red('❌ Error cleaning temp files:'), error);
        }
    }
}

// Create singleton instance
const converter = new MediaConverter();

// Auto-clean temp files every hour
setInterval(() => {
    converter.cleanTempFiles();
}, 60 * 60 * 1000);

module.exports = converter;