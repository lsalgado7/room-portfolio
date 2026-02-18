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
        this.board = [];
        this.gameOver = false;
        this.score = 0;
        
        // Leveling
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
    }

    onStart() {
        this.resetGame();
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
        this.gameOver = false;
        
        // Set initial speed
        this.updateSpeed(); 

        this.player = this.createPiece(this.randomPieceType());
        this.draw();
    }

    // New helper to calculate speed based on level
    updateSpeed() {
        // Simple formula: 1000ms * (0.9 ^ (level - 1))
        // Level 1: 1000ms, Level 2: 900ms, Level 10: ~387ms
        const calculatedSpeed = 1000 * Math.pow(0.9, this.level - 1);
        
        // Cap the speed so it doesn't get impossible (e.g., min 100ms)
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
        if(this.gameOver && e.key === 'Enter') {
            this.resetGame();
            return;
        }
        if(e.key === 'Escape') {
            this.callbacks.launch('menu');
            return;
        }
        if (this.gameOver) return;

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
            this.arenaSweep(); // Check for lines
            this.player = this.createPiece(this.randomPieceType());
            
            if (this.collide(this.board, this.player)) {
                this.gameOver = true;
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
        let rowCount = 0; // Track rows cleared in this specific sweep
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
            // Scoring
            // 1 line = 100, 2 = 300, 3 = 500, 4 = 800 (Classic-ish)
            const lineScores = [0, 100, 300, 500, 800];
            this.score += lineScores[rowCount] * this.level;
            
            // Leveling Logic
            this.linesCleared += rowCount;
            const newLevel = Math.floor(this.linesCleared / 10) + 1;
            
            if (newLevel > this.level) {
                this.level = newLevel;
                this.updateSpeed(); // Make it faster!
            }
        }
    }

    update(deltaTime) {
        if (this.gameOver) return;

        this.dropCounter += deltaTime;
        if (this.dropCounter > this.dropInterval) {
            this.playerDrop();
        }
    }

    draw() {
        // --- 1. Background ---
        this.ctx.fillStyle = "#202028";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // --- 2. Game Board ---
        this.ctx.fillStyle = "#000000";
        this.ctx.fillRect(this.offsetX, this.offsetY, this.gameWidth, this.gameHeight);
        
        this.ctx.strokeStyle = "#FFFFFF";
        this.ctx.lineWidth = 4;
        this.ctx.strokeRect(this.offsetX - 2, this.offsetY - 2, this.gameWidth + 4, this.gameHeight + 4);

        // --- 3. Board Content ---
        this.board.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    this.drawBlock(x, y, this.colors[value]);
                }
            });
        });

        // --- 4. Active Piece ---
        if (this.player) {
            this.player.matrix.forEach((row, y) => {
                row.forEach((value, x) => {
                    if (value !== 0) {
                        this.drawBlock(x + this.player.pos.x, y + this.player.pos.y, "#FFFFFF");
                    }
                });
            });
        }

        // --- 5. UI Text ---
        this.ctx.fillStyle = "#FFFFFF";
        this.ctx.font = "bold 40px monospace";
        
        // Calculate vertical center of the board
        const centerY = this.offsetY + (this.gameHeight / 2);

        this.ctx.textAlign = "left"; 
        this.ctx.fillText(`SCORE: ${this.score}`, this.offsetX + this.gameWidth + 40, centerY);

        this.ctx.textAlign = "right";
        this.ctx.fillText(`LEVEL: ${this.level}`, this.offsetX - 40, centerY);

        this.ctx.textAlign = "center";
        this.ctx.fillText("TETRIS", this.canvas.width / 2, 80);

        if (this.gameOver) {
            this.ctx.fillStyle = "rgba(0,0,0,0.8)";
            this.ctx.fillRect(this.offsetX, this.offsetY, this.gameWidth, this.gameHeight);
            this.ctx.fillStyle = "#FF0000";
            this.ctx.fillText("GAME OVER", this.canvas.width/2, this.canvas.height/2);
            this.ctx.fillStyle = "#FFFFFF";
            this.ctx.font = "20px monospace";
            this.ctx.fillText("Press [ENTER] to Restart", this.canvas.width/2, this.canvas.height/2 + 50);
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