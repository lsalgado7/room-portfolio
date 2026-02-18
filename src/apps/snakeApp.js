export class SnakeApp {
    constructor(canvas, ctx, callbacks) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.callbacks = callbacks;
        
        this.gridSize = 32; 
        this.speed = 90; 
        this.lastMove = 0;
        
        // --- LAYOUT CONFIGURATION ---
        this.cols = 28; 
        this.rows = 24; 

        this.gameWidth = this.cols * this.gridSize;
        this.gameHeight = this.rows * this.gridSize;
        
        this.offsetX = (this.canvas.width - this.gameWidth) / 2; 
        this.offsetY = 200; 
        
        // --- GAME STATE & LEADERBOARD ---
        this.gameState = 'NAME_ENTRY'; // Options: NAME_ENTRY, PLAYING, GAME_OVER
        this.playerName = "";
        this.maxNameLength = 10;
        this.leaderboard = this.loadLeaderboard(); // Load from LocalStorage

        this.inputQueue = [];
        this.handleInput = this.handleInput.bind(this);
    }

    onStart() {
        this.gameState = 'NAME_ENTRY';
        this.playerName = "";
        this.resetGameVariables();
        window.addEventListener('keydown', this.handleInput);
        this.draw();
    }

    onEnd() {
        window.removeEventListener('keydown', this.handleInput);
    }

    resetGameVariables() {
        const startX = Math.floor(this.cols / 2);
        const startY = Math.floor(this.rows / 2);

        this.snake = [{x: startX, y: startY}];
        this.dir = {x: 1, y: 0}; 
        this.inputQueue = [];
        this.score = 0;
        this.gameOver = false;
        this.food = this.spawnFood();
    }

    // --- LEADERBOARD LOGIC ---
    loadLeaderboard() {
        const saved = localStorage.getItem('snake_leaderboard');
        return saved ? JSON.parse(saved) : [];
    }

    saveScore() {
        const entry = {
            name: this.playerName || "ANON",
            score: this.score,
            date: new Date().toLocaleDateString()
        };

        this.leaderboard.push(entry);
        // Sort by score (High to Low)
        this.leaderboard.sort((a, b) => b.score - a.score);
        // Keep top 5
        this.leaderboard = this.leaderboard.slice(0, 5);
        
        localStorage.setItem('snake_leaderboard', JSON.stringify(this.leaderboard));
    }

    handleInput(e) {
        if(e.key === 'Escape') {
            this.callbacks.launch('menu');
            return;
        }

        // --- STATE: ENTER NAME ---
        if (this.gameState === 'NAME_ENTRY') {
            if (e.key === 'Enter') {
                if (this.playerName.trim().length > 0) {
                    this.gameState = 'PLAYING';
                    this.draw();
                }
                return;
            }
            if (e.key === 'Backspace') {
                this.playerName = this.playerName.slice(0, -1);
                this.draw();
                return;
            }
            // Allow only single letters/numbers
            if (e.key.length === 1 && this.playerName.length < this.maxNameLength) {
                // Regex to allow letters and numbers only
                if (/[a-zA-Z0-9 ]/.test(e.key)) {
                    this.playerName += e.key.toUpperCase();
                    this.draw();
                }
            }
            return;
        }

        // --- STATE: GAME OVER ---
        if (this.gameState === 'GAME_OVER' && e.key === 'Enter') {
            // Restart goes back to game, keeping same name
            this.resetGameVariables();
            this.gameState = 'PLAYING';
            this.draw();
            return;
        }

        // --- STATE: PLAYING (Snake Movement) ---
        if (this.gameState === 'PLAYING') {
            // Prevent scrolling
            if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].indexOf(e.key) > -1) {
                e.preventDefault();
            }

            if (this.inputQueue.length < 2) {
                const keyMap = {
                    'ArrowUp':    {x: 0, y: -1},
                    'ArrowDown':  {x: 0, y: 1},
                    'ArrowLeft':  {x: -1, y: 0},
                    'ArrowRight': {x: 1, y: 0}
                };
            
                const desiredDir = keyMap[e.key];
                if (!desiredDir) return; 
            
                const lastPlannedDir = this.inputQueue.length > 0 
                    ? this.inputQueue[this.inputQueue.length - 1] 
                    : this.dir;
            
                if (desiredDir.x + lastPlannedDir.x === 0 && desiredDir.y + lastPlannedDir.y === 0) return;
                if (desiredDir.x === lastPlannedDir.x && desiredDir.y === lastPlannedDir.y) return;
            
                this.inputQueue.push(desiredDir);
            }
        }
    }

    spawnFood() {
        let newFood;
        let isInvalid = true;

        if (this.snake.length >= this.cols * this.rows) {
            this.gameOver = true; 
            this.gameState = 'GAME_OVER';
            return { x: -1, y: -1 }; 
        }

        while (isInvalid) {
            newFood = {
                x: Math.floor(Math.random() * this.cols),
                y: Math.floor(Math.random() * this.rows)
            };
            const onBody = this.snake.some(segment => 
                segment.x === newFood.x && segment.y === newFood.y
            );
            if (!onBody) isInvalid = false;
        }
        return newFood;
    }

    update(deltaTime) {
        // Draw during NAME_ENTRY
        if (this.gameState === 'NAME_ENTRY') {
            this.draw();
            return;
        }

        // Stop game logic if game over
        if (this.gameState !== 'PLAYING') return;

        const now = performance.now();
        if (now - this.lastMove < this.speed) return;
        this.lastMove = now;

        if (this.inputQueue.length > 0) {
            this.dir = this.inputQueue.shift();
        }

        const head = {
            x: this.snake[0].x + this.dir.x, 
            y: this.snake[0].y + this.dir.y
        };

        // 1. Check Wall Collision
        if (head.x < 0 || head.x >= this.cols || head.y < 0 || head.y >= this.rows) {
            this.triggerGameOver();
            return;
        }

        // 2. Check Self Collision
        for(let i = 0; i < this.snake.length - 1; i++) {
            if (head.x === this.snake[i].x && head.y === this.snake[i].y) {
                this.triggerGameOver();
                return;
            }
        }

        // 3. Move Snake
        this.snake.unshift(head);

        // 4. Check Food
        if (head.x === this.food.x && head.y === this.food.y) {
            this.score += 10;
            this.food = this.spawnFood();
        } else {
            this.snake.pop(); 
        }

        this.draw();
    }

    triggerGameOver() {
        this.gameOver = true;
        this.gameState = 'GAME_OVER';
        this.saveScore(); // <--- Save score on death
        this.draw();
    }

    draw() {
        // --- CLEAR BACKGROUND ---
        this.ctx.fillStyle = "#222222";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // --- TITLE ---
        this.ctx.fillStyle = "#00FF00";
        this.ctx.font = "bold 100px monospace";
        this.ctx.textAlign = "center";
        this.ctx.textBaseline = "middle";
        this.ctx.fillText("SNAKE", this.canvas.width / 2, 100);

        // --- DRAW BASED ON STATE ---

        if (this.gameState === 'NAME_ENTRY') {
            this.drawNameEntry();
        } else {
            this.drawGameInterface();
        }
    }

    drawNameEntry() {
        const cx = this.canvas.width / 2;
        const cy = this.canvas.height / 2;

        // Prompt
        this.ctx.fillStyle = "#FFFFFF";
        this.ctx.font = "40px monospace";
        this.ctx.fillText("ENTER PLAYER NAME", cx, cy - 80);

        // The Input Box
        this.ctx.fillStyle = "#000000";
        this.ctx.strokeStyle = "#00FF00";
        this.ctx.lineWidth = 4;
        this.ctx.fillRect(cx - 200, cy - 40, 400, 80);
        this.ctx.strokeRect(cx - 200, cy - 40, 400, 80);

        // The Typed Name
        this.ctx.fillStyle = "#00FF00";
        this.ctx.font = "bold 50px monospace";
        this.ctx.fillText(this.playerName + (Math.floor(Date.now() / 500) % 2 ? "_" : " "), cx, cy + 5);

        // Instructions
        this.ctx.fillStyle = "#AAAAAA";
        this.ctx.font = "30px monospace";
        this.ctx.fillText("Press [ENTER] to Start", cx, cy + 100);

        // Draw Leaderboard Preview
        this.drawLeaderboard(cx, cy + 200);
    }

    drawGameInterface() {
        // Score
        this.ctx.fillStyle = "#00FF00";
        this.ctx.font = "bold 40px monospace";
        this.ctx.textAlign = "right";
        this.ctx.fillText(`SCORE: ${this.score}`, this.canvas.width - this.offsetX, 160);
        this.ctx.textAlign = "left";
        this.ctx.fillText(`PLAYER: ${this.playerName}`, this.offsetX, 160);

        // Frame
        this.ctx.strokeStyle = "#555555";
        this.ctx.lineWidth = 10;
        this.ctx.strokeRect(
            this.offsetX - 5, this.offsetY - 5, 
            this.gameWidth + 10, this.gameHeight + 10
        );

        // Board Background
        this.ctx.fillStyle = "#000000";
        this.ctx.fillRect(this.offsetX, this.offsetY, this.gameWidth, this.gameHeight);

        // --- GAME ELEMENTS ---
        this.ctx.save();
        this.ctx.translate(this.offsetX, this.offsetY);

        // Food
        this.ctx.fillStyle = "#FF0000";
        this.ctx.fillRect(this.food.x * this.gridSize, this.food.y * this.gridSize, this.gridSize, this.gridSize);

        // Snake
        this.ctx.fillStyle = "#00FF00";
        this.snake.forEach(seg => {
            this.ctx.fillRect(seg.x * this.gridSize, seg.y * this.gridSize, this.gridSize - 2, this.gridSize - 2);
        });

        // Game Over Overlay
        if (this.gameState === 'GAME_OVER') {
            this.ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
            this.ctx.fillRect(0, 0, this.gameWidth, this.gameHeight);

            this.ctx.fillStyle = "#FFFFFF";
            this.ctx.font = "bold 60px monospace";
            this.ctx.textAlign = "center";
            this.ctx.fillText("GAME OVER", this.gameWidth / 2, this.gameHeight / 2 - 100);
            
            this.ctx.fillStyle = "#00FF00";
            this.ctx.fillText(`Final Score: ${this.score}`, this.gameWidth / 2, this.gameHeight / 2 - 30);

            this.ctx.fillStyle = "#FFFFFF";
            this.ctx.font = "30px monospace";
            this.ctx.fillText("Press [ENTER] to Restart", this.gameWidth / 2, this.gameHeight / 2 + 40);
            this.ctx.fillText("Press [ESC] to Quit", this.gameWidth / 2, this.gameHeight / 2 + 80);

            // Show Leaderboard on Game Over too
            this.ctx.restore(); // Restore to global coordinates for leaderboard
            this.drawLeaderboard(this.canvas.width / 2, this.offsetY + 200);
            return;
        }

        this.ctx.restore();
    }

    drawLeaderboard(x, y) {
        this.ctx.fillStyle = "#FFFF00";
        this.ctx.font = "bold 35px monospace";
        this.ctx.textAlign = "center";
        this.ctx.fillText("- HIGH SCORES -", x, y);

        this.ctx.font = "30px monospace";
        this.ctx.fillStyle = "#FFFFFF";
        
        if (this.leaderboard.length === 0) {
            this.ctx.fillText("No scores yet!", x, y + 40);
        } else {
            this.leaderboard.forEach((entry, index) => {
                const text = `${index + 1}. ${entry.name} - ${entry.score}`;
                this.ctx.fillText(text, x, y + 40 + (index * 40));
            });
        }
    }
}