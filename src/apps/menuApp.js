export class MenuApp {
    constructor(canvas, ctx, callbacks) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.callbacks = callbacks; // Allows us to tell the computer to switch apps
        
        this.options = [
            { label: "Play Snake", action: () => this.callbacks.launch('snake') },
            { label: "Play Tetris", action: () => this.callbacks.launch('tetris')},
            { label: "Typing Test", action: () => this.callbacks.launch('typing')},
            { label: "Shut Down", action: () => this.callbacks.exit() }
        ];
        this.selectedIndex = 0;
        
        this.handleInput = this.handleInput.bind(this);
    }

    onStart() {
        window.addEventListener('keydown', this.handleInput);
        this.draw();
    }

    onEnd() {
        window.removeEventListener('keydown', this.handleInput);
    }

    handleInput(e) {
        if(["ArrowUp","ArrowDown","Enter"].indexOf(e.code) > -1) {
            e.preventDefault();
        }
        
        switch(e.key) {
            case 'ArrowUp': 
                this.selectedIndex = (this.selectedIndex - 1 + this.options.length) % this.options.length;
                break;
            case 'ArrowDown': 
                this.selectedIndex = (this.selectedIndex + 1) % this.options.length;
                break;
            case 'Enter':
                this.options[this.selectedIndex].action();
                break;
            case 'Escape':
                this.callbacks.exit();
                break;
        }
        this.draw();
    }

    update(deltaTime) {
        // Static screen, no continuous update needed
    }

    draw() {
        // 1. Background
        this.ctx.fillStyle = "#111111";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 2. Title
        this.ctx.fillStyle = "#00ff00";
        this.ctx.font = "bold 80px monospace";
        this.ctx.textAlign = "center";
        this.ctx.fillText("LEVI'S TERMINAL", this.canvas.width / 2, 250);

        this.ctx.fillStyle = "#00aa00";
        this.ctx.font = "bold 40px monospace";
        this.ctx.fillText("v1.0.0", this.canvas.width / 2, 310);

        // 3. Draw Options
        this.ctx.font = "60px monospace";
        
        this.options.forEach((opt, index) => {
            const y = 550 + (index * 120);
            
            if (index === this.selectedIndex) {
                // Highlight Selected
                this.ctx.fillStyle = "#00ff00";
                this.ctx.fillText(`> ${opt.label} <`, this.canvas.width / 2, y);
            } else {
                // Normal
                this.ctx.fillStyle = "#004400";
                this.ctx.fillText(opt.label, this.canvas.width / 2, y);
            }
        });

        // 4. Footer
        this.ctx.font = "30px monospace";
        this.ctx.fillStyle = "#00aa00";
        this.ctx.fillText("[UP/DOWN] to Select  [ENTER] to Confirm", this.canvas.width / 2, 1000);
    }
}