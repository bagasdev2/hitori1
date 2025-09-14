const chalk = require('chalk');
const fs = require('fs-extra');
const path = require('path');

class GameManager {
    constructor() {
        this.activeGames = new Map();
        this.gameStats = new Map();
        this.loadGameStats();
    }

    async loadGameStats() {
        try {
            const statsPath = './database/game_stats.json';
            if (await fs.pathExists(statsPath)) {
                const stats = await fs.readJson(statsPath);
                this.gameStats = new Map(Object.entries(stats));
            }
        } catch (error) {
            console.error(chalk.red('❌ Error loading game stats:'), error);
        }
    }

    async saveGameStats() {
        try {
            const statsPath = './database/game_stats.json';
            const stats = Object.fromEntries(this.gameStats);
            await fs.writeJson(statsPath, stats, { spaces: 2 });
        } catch (error) {
            console.error(chalk.red('❌ Error saving game stats:'), error);
        }
    }

    // TicTacToe Game
    async tictactoe(conn, chatId, playerId, args) {
        try {
            const gameId = `ttt_${chatId}`;
            
            if (args.length === 0) {
                // Show help
                await conn.sendMessage(chatId, {
                    text: `🎮 *TicTacToe Game*\n\n` +
                          `🎯 Commands:\n` +
                          `• .ttt start - Start new game\n` +
                          `• .ttt join - Join existing game\n` +
                          `• .ttt <position> - Make move (1-9)\n` +
                          `• .ttt quit - Quit game\n\n` +
                          `📱 Positions:\n` +
                          `1️⃣2️⃣3️⃣\n4️⃣5️⃣6️⃣\n7️⃣8️⃣9️⃣`
                });
                return;
            }

            const action = args[0].toLowerCase();

            switch (action) {
                case 'start':
                    await this.startTicTacToe(conn, chatId, playerId);
                    break;
                case 'join':
                    await this.joinTicTacToe(conn, chatId, playerId);
                    break;
                case 'quit':
                    await this.quitTicTacToe(conn, chatId, playerId);
                    break;
                default:
                    const position = parseInt(action);
                    if (position >= 1 && position <= 9) {
                        await this.playTicTacToe(conn, chatId, playerId, position);
                    } else {
                        await conn.sendMessage(chatId, {
                            text: '❌ Invalid position! Use numbers 1-9'
                        });
                    }
            }

        } catch (error) {
            console.error(chalk.red('❌ Error in TicTacToe:'), error);
            await conn.sendMessage(chatId, {
                text: '❌ Game error occurred!'
            });
        }
    }

    async startTicTacToe(conn, chatId, playerId) {
        const gameId = `ttt_${chatId}`;
        
        const game = {
            type: 'tictactoe',
            board: Array(9).fill(''),
            players: [playerId],
            currentPlayer: 0,
            status: 'waiting',
            createdAt: Date.now()
        };

        this.activeGames.set(gameId, game);

        await conn.sendMessage(chatId, {
            text: `🎮 *TicTacToe Started!*\n\n` +
                  `👤 Player 1 (X): @${playerId.split('@')[0]}\n` +
                  `⏳ Waiting for Player 2...\n\n` +
                  `Type .ttt join to join the game!`,
            mentions: [playerId]
        });
    }

    async joinTicTacToe(conn, chatId, playerId) {
        const gameId = `ttt_${chatId}`;
        const game = this.activeGames.get(gameId);

        if (!game) {
            await conn.sendMessage(chatId, {
                text: '❌ No TicTacToe game found! Use .ttt start to create one.'
            });
            return;
        }

        if (game.players.includes(playerId)) {
            await conn.sendMessage(chatId, {
                text: '❌ You are already in the game!'
            });
            return;
        }

        if (game.players.length >= 2) {
            await conn.sendMessage(chatId, {
                text: '❌ Game is full! Wait for the current game to finish.'
            });
            return;
        }

        game.players.push(playerId);
        game.status = 'playing';

        await conn.sendMessage(chatId, {
            text: `🎮 *Game Started!*\n\n` +
                  `👤 Player 1 (X): @${game.players[0].split('@')[0]}\n` +
                  `👤 Player 2 (O): @${game.players[1].split('@')[0]}\n\n` +
                  `${this.renderBoard(game.board)}\n\n` +
                  `🎯 @${game.players[0].split('@')[0]}'s turn (X)`,
            mentions: game.players
        });
    }

    async playTicTacToe(conn, chatId, playerId, position) {
        const gameId = `ttt_${chatId}`;
        const game = this.activeGames.get(gameId);

        if (!game || game.status !== 'playing') {
            await conn.sendMessage(chatId, {
                text: '❌ No active TicTacToe game!'
            });
            return;
        }

        if (!game.players.includes(playerId)) {
            await conn.sendMessage(chatId, {
                text: '❌ You are not in this game!'
            });
            return;
        }

        if (game.players[game.currentPlayer] !== playerId) {
            await conn.sendMessage(chatId, {
                text: `❌ Not your turn! Wait for @${game.players[game.currentPlayer].split('@')[0]}`,
                mentions: [game.players[game.currentPlayer]]
            });
            return;
        }

        if (game.board[position - 1] !== '') {
            await conn.sendMessage(chatId, {
                text: '❌ Position already taken!'
            });
            return;
        }

        // Make move
        const symbol = game.currentPlayer === 0 ? 'X' : 'O';
        game.board[position - 1] = symbol;

        // Check for winner
        const winner = this.checkWinner(game.board);
        
        if (winner) {
            game.status = 'finished';
            const winnerPlayer = game.players[game.currentPlayer];
            
            await conn.sendMessage(chatId, {
                text: `🎉 *Game Over!*\n\n` +
                      `${this.renderBoard(game.board)}\n\n` +
                      `🏆 Winner: @${winnerPlayer.split('@')[0]} (${symbol})`,
                mentions: [winnerPlayer]
            });

            // Update stats
            this.updateGameStats(winnerPlayer, 'tictactoe', 'win');
            const loser = game.players[1 - game.currentPlayer];
            this.updateGameStats(loser, 'tictactoe', 'loss');

            this.activeGames.delete(gameId);
            return;
        }

        // Check for draw
        if (!game.board.includes('')) {
            game.status = 'finished';
            
            await conn.sendMessage(chatId, {
                text: `🤝 *Game Over - Draw!*\n\n` +
                      `${this.renderBoard(game.board)}\n\n` +
                      `Good game!`,
                mentions: game.players
            });

            // Update stats
            this.updateGameStats(game.players[0], 'tictactoe', 'draw');
            this.updateGameStats(game.players[1], 'tictactoe', 'draw');

            this.activeGames.delete(gameId);
            return;
        }

        // Switch player
        game.currentPlayer = 1 - game.currentPlayer;

        await conn.sendMessage(chatId, {
            text: `🎮 *TicTacToe*\n\n` +
                  `${this.renderBoard(game.board)}\n\n` +
                  `🎯 @${game.players[game.currentPlayer].split('@')[0]}'s turn (${game.currentPlayer === 0 ? 'X' : 'O'})`,
            mentions: [game.players[game.currentPlayer]]
        });
    }

    renderBoard(board) {
        const symbols = {
            '': '⬜',
            'X': '❌',
            'O': '⭕'
        };

        let result = '';
        for (let i = 0; i < 9; i += 3) {
            result += `${symbols[board[i]] || `${i+1}️⃣`}${symbols[board[i+1]] || `${i+2}️⃣`}${symbols[board[i+2]] || `${i+3}️⃣`}\n`;
        }
        return result;
    }

    checkWinner(board) {
        const lines = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
            [0, 4, 8], [2, 4, 6] // Diagonals
        ];

        for (const [a, b, c] of lines) {
            if (board[a] && board[a] === board[b] && board[a] === board[c]) {
                return board[a];
            }
        }
        return null;
    }

    async quitTicTacToe(conn, chatId, playerId) {
        const gameId = `ttt_${chatId}`;
        const game = this.activeGames.get(gameId);

        if (!game) {
            await conn.sendMessage(chatId, {
                text: '❌ No active TicTacToe game!'
            });
            return;
        }

        if (!game.players.includes(playerId)) {
            await conn.sendMessage(chatId, {
                text: '❌ You are not in this game!'
            });
            return;
        }

        this.activeGames.delete(gameId);
        
        await conn.sendMessage(chatId, {
            text: `🛑 TicTacToe game ended by @${playerId.split('@')[0]}`,
            mentions: [playerId]
        });
    }

    // Slot Machine Game
    async slot(conn, chatId, playerId) {
        try {
            const symbols = ['🍎', '🍊', '🍋', '🍇', '🍒', '💎', '🎰', '🔥'];
            const reel1 = symbols[Math.floor(Math.random() * symbols.length)];
            const reel2 = symbols[Math.floor(Math.random() * symbols.length)];
            const reel3 = symbols[Math.floor(Math.random() * symbols.length)];

            let result = '📱 *SLOT MACHINE* 📱\n\n';
            result += `🎰 [ ${reel1} | ${reel2} | ${reel3} ] 🎰\n\n`;

            let win = false;
            let winAmount = 0;
            let message = '';

            if (reel1 === reel2 && reel2 === reel3) {
                // Jackpot!
                win = true;
                winAmount = 1000;
                message = '🎉 JACKPOT! 🎉';
                
                if (reel1 === '💎') {
                    winAmount = 5000;
                    message = '💎 DIAMOND JACKPOT! 💎';
                }
            } else if (reel1 === reel2 || reel2 === reel3 || reel1 === reel3) {
                // Two matching
                win = true;
                winAmount = 100;
                message = '✨ Two match! ✨';
            } else {
                message = '😢 Try again!';
            }

            result += message + '\n';
            
            if (win) {
                result += `💰 You won ${winAmount} coins!`;
                this.updateGameStats(playerId, 'slot', 'win', winAmount);
            } else {
                result += '🎲 Better luck next time!';
                this.updateGameStats(playerId, 'slot', 'loss');
            }

            await conn.sendMessage(chatId, { text: result });

        } catch (error) {
            console.error(chalk.red('❌ Error in slot game:'), error);
            await conn.sendMessage(chatId, {
                text: '❌ Slot machine error!'
            });
        }
    }

    // Guess Number Game
    async guessNumber(conn, chatId, playerId, args) {
        try {
            const gameId = `guess_${chatId}_${playerId}`;
            
            if (args.length === 0 || args[0] === 'start') {
                // Start new game
                const number = Math.floor(Math.random() * 100) + 1;
                const game = {
                    type: 'guess',
                    number,
                    attempts: 0,
                    maxAttempts: 10,
                    playerId,
                    status: 'playing',
                    startTime: Date.now()
                };

                this.activeGames.set(gameId, game);

                await conn.sendMessage(chatId, {
                    text: `🔢 *Guess the Number!*\n\n` +
                          `🎯 I'm thinking of a number between 1-100\n` +
                          `🎲 You have ${game.maxAttempts} attempts\n\n` +
                          `💡 Type: .tebakangka <number>`
                });
                return;
            }

            const guess = parseInt(args[0]);
            if (isNaN(guess) || guess < 1 || guess > 100) {
                await conn.sendMessage(chatId, {
                    text: '❌ Please enter a valid number between 1-100!'
                });
                return;
            }

            const game = this.activeGames.get(gameId);
            if (!game || game.status !== 'playing') {
                await conn.sendMessage(chatId, {
                    text: '❌ No active number guessing game! Use .tebakangka start'
                });
                return;
            }

            game.attempts++;

            if (guess === game.number) {
                // Winner!
                const timeTaken = (Date.now() - game.startTime) / 1000;
                const score = Math.max(1000 - (game.attempts * 50), 100);
                
                await conn.sendMessage(chatId, {
                    text: `🎉 *CORRECT!* 🎉\n\n` +
                          `🔢 Number: ${game.number}\n` +
                          `🎯 Attempts: ${game.attempts}/${game.maxAttempts}\n` +
                          `⏰ Time: ${timeTaken.toFixed(1)}s\n` +
                          `🏆 Score: ${score} points`
                });

                this.updateGameStats(playerId, 'guess', 'win', score);
                this.activeGames.delete(gameId);

            } else if (game.attempts >= game.maxAttempts) {
                // Game over
                await conn.sendMessage(chatId, {
                    text: `😢 *Game Over!*\n\n` +
                          `🔢 The number was: ${game.number}\n` +
                          `🎯 You used all ${game.maxAttempts} attempts\n` +
                          `🎲 Try again with .tebakangka start`
                });

                this.updateGameStats(playerId, 'guess', 'loss');
                this.activeGames.delete(gameId);

            } else {
                // Continue game
                const hint = guess > game.number ? 'Too high! 📉' : 'Too low! 📈';
                const remaining = game.maxAttempts - game.attempts;

                await conn.sendMessage(chatId, {
                    text: `🎯 ${hint}\n\n` +
                          `🎲 Attempts left: ${remaining}\n` +
                          `💡 Try again!`
                });
            }

        } catch (error) {
            console.error(chalk.red('❌ Error in guess number game:'), error);
            await conn.sendMessage(chatId, {
                text: '❌ Game error occurred!'
            });
        }
    }

    // Math Quiz Game
    async mathQuiz(conn, chatId, playerId) {
        try {
            const operations = ['+', '-', '*'];
            const operation = operations[Math.floor(Math.random() * operations.length)];
            
            let num1, num2, answer;
            
            switch (operation) {
                case '+':
                    num1 = Math.floor(Math.random() * 50) + 1;
                    num2 = Math.floor(Math.random() * 50) + 1;
                    answer = num1 + num2;
                    break;
                case '-':
                    num1 = Math.floor(Math.random() * 50) + 25;
                    num2 = Math.floor(Math.random() * 25) + 1;
                    answer = num1 - num2;
                    break;
                case '*':
                    num1 = Math.floor(Math.random() * 12) + 1;
                    num2 = Math.floor(Math.random() * 12) + 1;
                    answer = num1 * num2;
                    break;
            }

            const gameId = `math_${chatId}`;
            const game = {
                type: 'math',
                question: `${num1} ${operation} ${num2}`,
                answer,
                startTime: Date.now(),
                timeout: 30000 // 30 seconds
            };

            this.activeGames.set(gameId, game);

            await conn.sendMessage(chatId, {
                text: `🧮 *Math Quiz*\n\n` +
                      `❓ ${game.question} = ?\n\n` +
                      `⏰ You have 30 seconds!\n` +
                      `💡 Reply with your answer`
            });

            // Set timeout
            setTimeout(() => {
                if (this.activeGames.has(gameId)) {
                    this.activeGames.delete(gameId);
                    conn.sendMessage(chatId, {
                        text: `⏰ *Time's up!*\n\n` +
                              `❓ ${game.question} = ${answer}\n` +
                              `😢 Better luck next time!`
                    });
                }
            }, game.timeout);

        } catch (error) {
            console.error(chalk.red('❌ Error in math quiz:'), error);
        }
    }

    // Check math quiz answer
    async checkMathAnswer(conn, chatId, playerId, message) {
        const gameId = `math_${chatId}`;
        const game = this.activeGames.get(gameId);

        if (!game || game.type !== 'math') return false;

        const userAnswer = parseInt(message.text);
        if (isNaN(userAnswer)) return false;

        this.activeGames.delete(gameId);

        const timeTaken = (Date.now() - game.startTime) / 1000;

        if (userAnswer === game.answer) {
            const score = Math.max(1000 - Math.floor(timeTaken * 10), 100);
            
            await conn.sendMessage(chatId, {
                text: `🎉 *Correct!* 🎉\n\n` +
                      `❓ ${game.question} = ${game.answer}\n` +
                      `⏰ Time: ${timeTaken.toFixed(1)}s\n` +
                      `🏆 Score: ${score} points\n\n` +
                      `🧮 @${playerId.split('@')[0]} got it right!`,
                mentions: [playerId]
            });

            this.updateGameStats(playerId, 'math', 'win', score);
        } else {
            await conn.sendMessage(chatId, {
                text: `❌ *Incorrect!*\n\n` +
                      `❓ ${game.question} = ${game.answer}\n` +
                      `📝 Your answer: ${userAnswer}\n` +
                      `🎲 Try again next time!`
            });

            this.updateGameStats(playerId, 'math', 'loss');
        }

        return true;
    }

    // Update game statistics
    updateGameStats(playerId, gameType, result, points = 0) {
        try {
            if (!this.gameStats.has(playerId)) {
                this.gameStats.set(playerId, {
                    totalGames: 0,
                    totalWins: 0,
                    totalPoints: 0,
                    games: {}
                });
            }

            const stats = this.gameStats.get(playerId);
            stats.totalGames++;

            if (result === 'win') {
                stats.totalWins++;
                stats.totalPoints += points;
            }

            if (!stats.games[gameType]) {
                stats.games[gameType] = {
                    played: 0,
                    wins: 0,
                    losses: 0,
                    draws: 0,
                    points: 0
                };
            }

            stats.games[gameType].played++;
            stats.games[gameType][result === 'draw' ? 'draws' : result === 'win' ? 'wins' : 'losses']++;
            
            if (result === 'win') {
                stats.games[gameType].points += points;
            }

            this.saveGameStats();

        } catch (error) {
            console.error(chalk.red('❌ Error updating game stats:'), error);
        }
    }

    // Get player statistics
    async getPlayerStats(playerId) {
        const stats = this.gameStats.get(playerId);
        if (!stats) {
            return {
                totalGames: 0,
                totalWins: 0,
                totalPoints: 0,
                winRate: 0,
                games: {}
            };
        }

        return {
            ...stats,
            winRate: stats.totalGames > 0 ? (stats.totalWins / stats.totalGames * 100).toFixed(1) : 0
        };
    }

    // Get leaderboard
    async getLeaderboard(gameType = null) {
        const players = [];
        
        for (const [playerId, stats] of this.gameStats) {
            if (gameType && !stats.games[gameType]) continue;
            
            const playerStats = gameType ? stats.games[gameType] : {
                points: stats.totalPoints,
                wins: stats.totalWins,
                played: stats.totalGames
            };

            players.push({
                id: playerId.split('@')[0],
                ...playerStats,
                winRate: playerStats.played > 0 ? (playerStats.wins / playerStats.played * 100).toFixed(1) : 0
            });
        }

        return players
            .sort((a, b) => b.points - a.points)
            .slice(0, 10);
    }

    // Clean up expired games
    cleanupGames() {
        const now = Date.now();
        const timeout = 10 * 60 * 1000; // 10 minutes

        for (const [gameId, game] of this.activeGames) {
            if (now - game.createdAt > timeout || now - game.startTime > timeout) {
                this.activeGames.delete(gameId);
                console.log(chalk.yellow(`🧹 Cleaned up expired game: ${gameId}`));
            }
        }
    }
}

// Create singleton instance
const gameManager = new GameManager();

// Auto cleanup every 5 minutes
setInterval(() => {
    gameManager.cleanupGames();
}, 5 * 60 * 1000);

module.exports = gameManager;