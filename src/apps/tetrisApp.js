export class TetrisApp {
    constructor(canvas, ctx, callbacks) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.callbacks = callbacks;

        // --- CONFIGURATION ---
        this.cols = 10;
        this.rows = 20;
        this.blockSize = 40; 
        this.boardColor = "#111111";

        // Calculate offsets to center the game
        this.gameWidth = this.cols * this.blockSize;
        this.gameHeight = this.rows * this.blockSize;
        this.offsetX = (this.canvas.width - this.gameWidth) / 2;
        this.offsetY = (this.canvas.height - this.gameHeight) / 2;

        // --- GAME STATE ---
        // States: 'START', 'PLAYING', 'GAMEOVER'
        this.gameState = 'START'; 
        this.playerName = "";
        this.board = [];
        this.score = 0;
        this.level = 1;
        this.linesCleared = 0;
        
        // Timing
        this.dropCounter = 0;
        this.dropInterval = 1000;
        this.lastTime = 0;

        // Bind input
        this.handleInput = this.handleInput.bind(this);

        this.pieces = "ILJOTSZ";
        this.colors = [
            null, 
            "#FF0D72", "#0DC2FF", "#0DFF72", "#F538FF", 
            "#FF8E0D", "#FFE138", "#3877FF", 
        ];

        // --- LEADERBOARD ---
        this.highScores = JSON.parse(localStorage.getItem('tetris_scores')) || [];
    }

    onStart() {
        // Don't reset everything; just ensure we are in START mode
        this.gameState = 'START';
        this.playerName = ""; 
        window.addEventListener('keydown', this.handleInput);
        this.draw();
    }

    onEnd() {
        window.removeEventListener('keydown', this.handleInput);
    }

    resetGame() {
        this.board = Array.from({ length: this.rows }, () => Array(this.cols).fill(0));
        
        // Reset Stats
        this.score = 0;
        this.level = 1;
        this.linesCleared = 0;
        this.gameState = 'PLAYING';
        
        // Set initial speed
        this.updateSpeed(); 

        this.player = this.createPiece(this.randomPieceType());
        this.draw();
    }

    updateSpeed() {
        // Simple formula: 1000ms * (0.9 ^ (level - 1))
        const calculatedSpeed = 1000 * Math.pow(0.9, this.level - 1);
        this.dropInterval = Math.max(100, calculatedSpeed);
    }

    randomPieceType() {
        return this.pieces[Math.floor(Math.random() * this.pieces.length)];
    }

    createPiece(type) {
        let matrix;
        switch(type) {
            case 'T': matrix = [[0,1,0],[1,1,1],[0,0,0]]; break;
            case 'I': matrix = [[0,1,0,0],[0,1,0,0],[0,1,0,0],[0,1,0,0]]; break;
            case 'L': matrix = [[0,1,0],[0,1,0],[0,1,1]]; break;
            case 'J': matrix = [[0,1,0],[0,1,0],[1,1,0]]; break;
            case 'O': matrix = [[1,1],[1,1]]; break;
            case 'Z': matrix = [[1,1,0],[0,1,1],[0,0,0]]; break;
            case 'S': matrix = [[0,1,1],[1,1,0],[0,0,0]]; break;
        }
        return {
            matrix: matrix,
            pos: { x: Math.floor(this.cols / 2) - Math.floor(matrix[0].length / 2), y: 0 },
            scoreValue: 10
        };
    }

    handleInput(e) {
        // Global Escape to Exit
        if(e.key === 'Escape') {
            this.callbacks.launch('menu');
            return;
        }

        // --- START SCREEN INPUT ---
        if (this.gameState === 'START') {
            e.preventDefault();
            if (e.key === 'Enter') {
                if (this.playerName.trim().length > 0) {
                    this.resetGame();
                }
            } else if (e.key === 'Backspace') {
                this.playerName = this.playerName.slice(0, -1);
            } else if (e.key.length === 1 && this.playerName.length < 10) {
                // Allow letters and numbers only
                if (/[a-zA-Z0-9 ]/.test(e.key)) {
                    this.playerName += e.key.toUpperCase();
                }
            }
            this.draw();
            return;
        }

        // --- GAME OVER INPUT ---
        if(this.gameState === 'GAMEOVER') {
            if (e.key === 'Enter') {
                // Return to Start Screen to let them change name or just hit enter again
                this.gameState = 'START';
                this.draw();
            }
            return;
        }

        // --- PLAYING INPUT ---
        if (this.gameState === 'PLAYING') {
            if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].indexOf(e.key) > -1) {
                e.preventDefault();
            }

            if (e.key === 'ArrowLeft') {
                this.playerMove(-1);
            } else if (e.key === 'ArrowRight') {
                this.playerMove(1);
            } else if (e.key === 'ArrowDown') {
                this.playerDrop();
            } else if (e.key === 'ArrowUp') {
                this.playerRotate(1);
            }
        }
    }

    playerMove(dir) {
        this.player.pos.x += dir;
        if (this.collide(this.board, this.player)) {
            this.player.pos.x -= dir;
        } else {
            this.draw();
        }
    }

    playerRotate(dir) {
        const pos = this.player.pos.x;
        let offset = 1;
        this.rotate(this.player.matrix, dir);
        while (this.collide(this.board, this.player)) {
            this.player.pos.x += offset;
            offset = -(offset + (offset > 0 ? 1 : -1));
            if (offset > this.player.matrix[0].length) {
                this.rotate(this.player.matrix, -dir);
                this.player.pos.x = pos;
                return;
            }
        }
        this.draw();
    }

    rotate(matrix, dir) {
        for (let y = 0; y < matrix.length; ++y) {
            for (let x = 0; x < y; ++x) {
                [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
            }
        }
        if (dir > 0) matrix.forEach(row => row.reverse());
        else matrix.reverse();
    }

    playerDrop() {
        this.player.pos.y++;
        if (this.collide(this.board, this.player)) {
            this.player.pos.y--;
            this.merge(this.board, this.player);
            this.arenaSweep(); 
            this.player = this.createPiece(this.randomPieceType());
            
            if (this.collide(this.board, this.player)) {
                this.endGame();
            }
        }
        this.dropCounter = 0;
        this.draw();
    }

    collide(arena, player) {
        const [m, o] = [player.matrix, player.pos];
        for (let y = 0; y < m.length; ++y) {
            for (let x = 0; x < m[y].length; ++x) {
                if (m[y][x] !== 0 &&
                    (arena[y + o.y] && arena[y + o.y][x + o.x]) !== 0) {
                    return true;
                }
            }
        }
        return false;
    }

    merge(arena, player) {
        player.matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    arena[y + player.pos.y][x + player.pos.x] = Math.floor(Math.random() * 7) + 1;
                }
            });
        });
    }

    arenaSweep() {
        let rowCount = 0; 
        outer: for (let y = this.board.length - 1; y > 0; --y) {
            for (let x = 0; x < this.board[y].length; ++x) {
                if (this.board[y][x] === 0) {
                    continue outer;
                }
            }
            const row = this.board.splice(y, 1)[0].fill(0);
            this.board.unshift(row);
            ++y;
            rowCount++;
        }

        if (rowCount > 0) {
            const lineScores = [0, 100, 300, 500, 800];
            this.score += lineScores[rowCount] * this.level;
            
            this.linesCleared += rowCount;
            const newLevel = Math.floor(this.linesCleared / 10) + 1;
            
            if (newLevel > this.level) {
                this.level = newLevel;
                this.updateSpeed(); 
            }
        }
    }

    endGame() {
        this.gameState = 'GAMEOVER';
        this.checkHighScore();
        this.draw();
    }

    checkHighScore() {
        // Just save directly using the name they entered at start
        const name = this.playerName || "ANON";
        this.saveHighScore(name, this.score);
    }

    saveHighScore(name, score) {
        const newScore = { name, score };
        this.highScores.push(newScore);
        
        this.highScores.sort((a, b) => b.score - a.score);
        this.highScores.splice(5);

        localStorage.setItem('tetris_scores', JSON.stringify(this.highScores));
        this.draw();
    }

    update(deltaTime) {
        if (this.gameState !== 'PLAYING') return;

        this.dropCounter += deltaTime;
        if (this.dropCounter > this.dropInterval) {
            this.playerDrop();
        }
    }

    draw() {
        // --- Common Background ---
        this.ctx.fillStyle = "#202028";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // --- STATE: START SCREEN ---
        if (this.gameState === 'START') {
            this.ctx.fillStyle = "#00FF00";
            this.ctx.font = "bold 80px monospace";
            this.ctx.textAlign = "center";
            this.ctx.fillText("TETRIS", this.canvas.width / 2, 300);

            this.ctx.fillStyle = "#FFFFFF";
            this.ctx.font = "40px monospace";
            this.ctx.fillText("ENTER PLAYER NAME:", this.canvas.width / 2, 450);

            // Draw Input Box
            this.ctx.fillStyle = "#000000";
            this.ctx.fillRect(this.canvas.width/2 - 200, 500, 400, 60);
            this.ctx.strokeStyle = "#00FF00";
            this.ctx.lineWidth = 4;
            this.ctx.strokeRect(this.canvas.width/2 - 200, 500, 400, 60);

            // Draw Name + Blinking Cursor
            this.ctx.fillStyle = "#00FF00";
            this.ctx.font = "40px monospace";
            // Blinking effect using Date.now()
            const cursor = Math.floor(Date.now() / 500) % 2 === 0 ? "_" : " ";
            this.ctx.fillText((this.playerName + cursor).toUpperCase(), this.canvas.width / 2, 545);

            this.ctx.fillStyle = "#AAAAAA";
            this.ctx.font = "30px monospace";
            this.ctx.fillText("PRESS [ENTER] TO START", this.canvas.width / 2, 700);
            return;
        }

        // --- STATE: PLAYING / GAME OVER ---
        
        // Game Board Background
        this.ctx.fillStyle = "#000000";
        this.ctx.fillRect(this.offsetX, this.offsetY, this.gameWidth, this.gameHeight);
        
        this.ctx.strokeStyle = "#FFFFFF";
        this.ctx.lineWidth = 4;
        this.ctx.strokeRect(this.offsetX - 2, this.offsetY - 2, this.gameWidth + 4, this.gameHeight + 4);

        // Draw Board Content
        this.board.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    this.drawBlock(x, y, this.colors[value]);
                }
            });
        });

        // Active Piece
        if (this.player && this.gameState === 'PLAYING') {
            this.player.matrix.forEach((row, y) => {
                row.forEach((value, x) => {
                    if (value !== 0) {
                        this.drawBlock(x + this.player.pos.x, y + this.player.pos.y, "#FFFFFF");
                    }
                });
            });
        }

        // UI Text
        this.ctx.fillStyle = "#FFFFFF";
        this.ctx.font = "bold 40px monospace";
        
        const centerY = this.offsetY + (this.gameHeight / 2);

        // Right Side: Score & Name
        this.ctx.textAlign = "left"; 
        this.ctx.fillText(`SCORE`, this.offsetX + this.gameWidth + 40, centerY - 40);
        this.ctx.fillText(`${this.score}`, this.offsetX + this.gameWidth + 40, centerY);
        this.ctx.font = "30px monospace";
        this.ctx.fillStyle = "#AAAAAA";
        this.ctx.fillText(`PLAYER: ${this.playerName}`, this.offsetX + this.gameWidth + 40, centerY + 60);
        
        // Left Side: Level
        this.ctx.fillStyle = "#FFFFFF";
        this.ctx.font = "bold 40px monospace";
        this.ctx.textAlign = "right";
        this.ctx.fillText(`LEVEL: ${this.level}`, this.offsetX - 40, centerY);

        // Title
        this.ctx.textAlign = "center";
        this.ctx.fillText("TETRIS", this.canvas.width / 2, 100);

        // --- STATE: GAME OVER ---
        if (this.gameState === 'GAMEOVER') {
            this.ctx.fillStyle = "rgba(0,0,0,0.85)";
            this.ctx.fillRect(this.offsetX, this.offsetY, this.gameWidth, this.gameHeight);
            
            this.ctx.fillStyle = "#FF0000";
            this.ctx.font = "bold 50px monospace";
            this.ctx.fillText("GAME OVER", this.canvas.width/2, this.offsetY + 80);

            // Leaderboard
            this.ctx.fillStyle = "#FFFF00";
            this.ctx.font = "bold 30px monospace";
            this.ctx.fillText("HIGH SCORES", this.canvas.width/2, this.offsetY + 160);

            this.ctx.fillStyle = "#FFFFFF";
            this.ctx.font = "24px monospace";
            this.ctx.textAlign = "center";

            if (this.highScores.length === 0) {
                this.ctx.fillText("No scores yet!", this.canvas.width/2, this.offsetY + 220);
            } else {
                this.highScores.forEach((s, index) => {
                    const yPos = this.offsetY + 220 + (index * 40);
                    const text = `${index + 1}. ${s.name.padEnd(10, ' ')}  ${s.score}`;
                    
                    // Highlight current run if it made the board
                    if (s.score === this.score && s.name === this.playerName) {
                         this.ctx.fillStyle = "#00FF00";
                    } else {
                         this.ctx.fillStyle = "#FFFFFF";
                    }
                    this.ctx.fillText(text, this.canvas.width/2, yPos);
                });
            }

            this.ctx.fillStyle = "#00FF00";
            this.ctx.font = "20px monospace";
            this.ctx.fillText("Press [ENTER] to Restart", this.canvas.width/2, this.offsetY + this.gameHeight - 50);
        }
    }

    drawBlock(x, y, color) {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(
            this.offsetX + x * this.blockSize, 
            this.offsetY + y * this.blockSize, 
            this.blockSize - 2, 
            this.blockSize - 2
        );
    }
}