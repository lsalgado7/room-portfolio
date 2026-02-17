export class SnakeApp {
    constructor(canvas, ctx, callbacks) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.callbacks = callbacks;

        this.gridSize = 32; // Grid cells
        this.speed = 100; // ms per move
        this.lastMove = 0;
        
        // Bind input so we can remove it later
        this.handleInput = this.handleInput.bind(this);
    }

    onStart() {
        this.snake = [{x: 10, y: 10}];
        this.dir = {x: 1, y: 0};
        this.food = this.spawnFood();
        
        window.addEventListener('keydown', this.handleInput);
    }

    onEnd() {
        window.removeEventListener('keydown', this.handleInput);
    }

    handleInput(e) {
        if(e.key === 'Escape') {
            this.callbacks.launch('menu');
            return;
        }

        // Prevent default scrolling when playing
        if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].indexOf(e.code) > -1) {
            e.preventDefault();
        }

        switch(e.key) {
            case 'ArrowUp': if(this.dir.y === 0) this.dir = {x: 0, y: -1}; break;
            case 'ArrowDown': if(this.dir.y === 0) this.dir = {x: 0, y: 1}; break;
            case 'ArrowLeft': if(this.dir.x === 0) this.dir = {x: -1, y: 0}; break;
            case 'ArrowRight': if(this.dir.x === 0) this.dir = {x: 1, y: 0}; break;
        }
    }

    spawnFood() {
        const tiles = this.canvas.width / this.gridSize;
        return {
            x: Math.floor(Math.random() * tiles),
            y: Math.floor(Math.random() * tiles)
        };
    }

    update(deltaTime) {
        const now = performance.now();
        if (now - this.lastMove < this.speed) return;
        this.lastMove = now;

        // Logic
        const head = {x: this.snake[0].x + this.dir.x, y: this.snake[0].y + this.dir.y};
        this.snake.unshift(head);

        // Check Eat
        if (head.x === this.food.x && head.y === this.food.y) {
            this.food = this.spawnFood();
        } else {
            this.snake.pop();
        }

        this.draw();
    }

    draw() {
        // Clear Screen
        this.ctx.fillStyle = "#000000";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw Snake
        this.ctx.fillStyle = "#00FF00";
        this.snake.forEach(seg => {
            this.ctx.fillRect(seg.x * this.gridSize, seg.y * this.gridSize, this.gridSize - 2, this.gridSize - 2);
        });

        // Draw Food
        this.ctx.fillStyle = "#FF0000";
        this.ctx.fillRect(this.food.x * this.gridSize, this.food.y * this.gridSize, this.gridSize, this.gridSize);
    }
}