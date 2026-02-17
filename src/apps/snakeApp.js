export class SnakeApp {
    constructor(canvas, ctx, callbacks) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.callbacks = callbacks;
        
        this.gridSize = 32; 
        this.speed = 90; // Slightly faster for fun
        this.lastMove = 0;
        
        // --- LAYOUT CONFIGURATION ---
        // Canvas is 1024x1024. Let's define the playable grid size.
        this.cols = 28; // 28 * 32 = 896px width
        this.rows = 24; // 24 * 32 = 768px height

        // Calculate centering offsets
        this.gameWidth = this.cols * this.gridSize;
        this.gameHeight = this.rows * this.gridSize;
        
        this.offsetX = (this.canvas.width - this.gameWidth) / 2; // Center horizontally
        this.offsetY = 200; // Push down to make room for Title
        
        this.handleInput = this.handleInput.bind(this);
    }

    onStart() {
        this.resetGame();
        window.addEventListener('keydown', this.handleInput);
    }

    onEnd() {
        window.removeEventListener('keydown', this.handleInput);
    }

    resetGame() {
        // Start in the middle of the game grid
        const startX = Math.floor(this.cols / 2);
        const startY = Math.floor(this.rows / 2);

        this.snake = [{x: startX, y: startY}];
        this.dir = {x: 1, y: 0}; // Moving Right
        this.score = 0;
        this.gameOver = false;
        this.food = this.spawnFood();
        this.draw(); // Initial draw
    }

    handleInput(e) {
        if(e.key === 'Escape') {
            this.callbacks.launch('menu');
            return;
        }

        // Restart on Game Over with Enter
        if (this.gameOver && e.key === 'Enter') {
            this.resetGame();
            return;
        }

        // Prevent scrolling
        if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].indexOf(e.code) > -1) {
            e.preventDefault();
        }

        // Prevent reversing directly into self
        const goingUp = this.dir.y === -1;
        const goingDown = this.dir.y === 1;
        const goingLeft = this.dir.x === -1;
        const goingRight = this.dir.x === 1;

        switch(e.key) {
            case 'ArrowUp': 
                if(!goingDown) this.dir = {x: 0, y: -1}; 
                break;
            case 'ArrowDown': 
                if(!goingUp) this.dir = {x: 0, y: 1}; 
                break;
            case 'ArrowLeft': 
                if(!goingRight) this.dir = {x: -1, y: 0}; 
                break;
            case 'ArrowRight': 
                if(!goingLeft) this.dir = {x: 1, y: 0}; 
                break;
        }
    }

    spawnFood() {
        // Random position within the COLS/ROWS limits
        return {
            x: Math.floor(Math.random() * this.cols),
            y: Math.floor(Math.random() * this.rows)
        };
    }

    update(deltaTime) {
        if (this.gameOver) return;

        const now = performance.now();
        if (now - this.lastMove < this.speed) return;
        this.lastMove = now;

        const head = {
            x: this.snake[0].x + this.dir.x, 
            y: this.snake[0].y + this.dir.y
        };

        // 1. Check Wall Collision (Game Over)
        if (head.x < 0 || head.x >= this.cols || head.y < 0 || head.y >= this.rows) {
            this.gameOver = true;
            this.draw(); // Draw game over screen
            return;
        }

        // 2. Check Self Collision
        // We skip the last tail segment because it will move forward anyway
        for(let i = 0; i < this.snake.length - 1; i++) {
            if (head.x === this.snake[i].x && head.y === this.snake[i].y) {
                this.gameOver = true;
                this.draw();
                return;
            }
        }

        // 3. Move Snake
        this.snake.unshift(head);

        // 4. Check Food Eat
        if (head.x === this.food.x && head.y === this.food.y) {
            this.score += 10;
            this.food = this.spawnFood();
            // Don't pop tail, so we grow
        } else {
            this.snake.pop(); // Remove tail
        }

        this.draw();
    }

    draw() {
        // --- 1. Draw "Monitor" UI (Global Coordinates) ---
        
        // Background (Dark Gray)
        this.ctx.fillStyle = "#222222";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Title text
        this.ctx.fillStyle = "#00FF00";
        this.ctx.font = "bold 100px monospace";
        this.ctx.textAlign = "center";
        this.ctx.textBaseline = "middle";
        this.ctx.fillText("SNAKE", this.canvas.width / 2, 100);

        // Score text (Top Right of game area)
        this.ctx.font = "bold 40px monospace";
        this.ctx.textAlign = "right";
        this.ctx.fillText(`SCORE: ${this.score}`, this.canvas.width - this.offsetX, 160);

        // Border/Frame around game
        this.ctx.strokeStyle = "#555555";
        this.ctx.lineWidth = 10;
        this.ctx.strokeRect(
            this.offsetX - 5, 
            this.offsetY - 5, 
            this.gameWidth + 10, 
            this.gameHeight + 10
        );

        // Game Background (Black)
        this.ctx.fillStyle = "#000000";
        this.ctx.fillRect(this.offsetX, this.offsetY, this.gameWidth, this.gameHeight);

        // --- 2. Draw Game Elements (Translated Coordinates) ---
        this.ctx.save();
        this.ctx.translate(this.offsetX, this.offsetY); // <--- Magic happens here

        // Draw Food
        this.ctx.fillStyle = "#FF0000";
        this.ctx.fillRect(
            this.food.x * this.gridSize, 
            this.food.y * this.gridSize, 
            this.gridSize, 
            this.gridSize
        );

        // Draw Snake
        this.ctx.fillStyle = "#00FF00";
        this.snake.forEach(seg => {
            this.ctx.fillRect(
                seg.x * this.gridSize, 
                seg.y * this.gridSize, 
                this.gridSize - 2, // -2 for small gap between segments
                this.gridSize - 2
            );
        });

        // Draw Game Over Overlay
        if (this.gameOver) {
            this.ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
            this.ctx.fillRect(0, 0, this.gameWidth, this.gameHeight);

            this.ctx.fillStyle = "#FFFFFF";
            this.ctx.font = "bold 60px monospace";
            this.ctx.textAlign = "center";
            this.ctx.fillText("GAME OVER", this.gameWidth / 2, this.gameHeight / 2 - 20);
            
            this.ctx.font = "30px monospace";
            this.ctx.fillText("Press [ENTER] to Restart", this.gameWidth / 2, this.gameHeight / 2 + 40);
            this.ctx.fillText("Press [ESC] to Quit", this.gameWidth / 2, this.gameHeight / 2 + 80);
        }

        this.ctx.restore();
    }
}