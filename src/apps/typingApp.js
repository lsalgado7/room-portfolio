// src/apps/typingApp.js
import { LeaderboardHelper } from '../utils/leaderboard.js';

export class TypingApp {
    constructor(canvas, ctx, callbacks) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.callbacks = callbacks;

        // Common tech & standard words for the test
        this.dictionary = [
            "the", "be", "to", "of", "and", "a", "in", "that", "have", "it", "for", "not", "on", "with", "as", "you", "do", "at", "this", "but", "by", "from", "they", "we", "say", "she", "or", "an", "will", "my", "one", "all", "would", "there", "their", "what", "so", "up", "out", "if", "about", "who", "get", "which", "go", "when", "make", "can", "like", "time", "no", "just", "know", "take", "people", "into", "year", "your", "good", "some", "could", "them", "see", "other", "than", "then", "now", "look", "only", "come", "its", "over", "think", "also", "back", "after", "use", "two", "how", "our", "work", "first", "well", "way", "even", "new", "want", "because", "any", "these", "give", "day", "most", "us", "is",
            "function", "const", "let", "var", "return", "data", "code", "array", "object", "string", "boolean", "null", "undefined", "class", "import", "export", "default", "async", "await", "promise", "system", "server", "client", "error", "debug"
        ];

        this.leaderboard = new LeaderboardHelper('typing');
        this.gameState = 'START'; 
        this.handleInput = this.handleInput.bind(this);
    }

    onStart() {
        this.gameState = 'START';
        window.addEventListener('keydown', this.handleInput);
        this.draw();
    }

    onEnd() {
        window.removeEventListener('keydown', this.handleInput);
    }

    resetGame() {
        this.words = this.generateWords(100);
        this.activeWordIndex = 0;
        this.currentInput = "";
        
        // Stats
        this.correctChars = 0;
        this.totalTypedChars = 0;
        
        // Timer
        this.timeLeft = 60.0;
        this.gameState = 'PLAYING';
    }

    generateWords(count) {
        const words = [];
        for (let i = 0; i < count; i++) {
            const randomIdx = Math.floor(Math.random() * this.dictionary.length);
            words.push(this.dictionary[randomIdx]);
        }
        return words;
    }

    handleInput(e) {
        if (e.key === 'Escape') {
            this.callbacks.launch('menu');
            return;
        }

        if (this.gameState === 'START') {
            if (this.leaderboard.handleNameInput(e, () => { this.resetGame(); })) {
                this.draw();
            }
            return;
        }

        if (this.gameState === 'GAMEOVER') {
            if (e.key === 'Enter') {
                this.gameState = 'START'; // Go back to name entry
                this.draw();
            }
            return;
        }

        if (this.gameState === 'PLAYING') {
            // Prevent default scrolling for spacebar
            if (e.key === ' ') e.preventDefault();

            // Handle Backspace
            if (e.key === 'Backspace') {
                this.currentInput = this.currentInput.slice(0, -1);
                return;
            }

            // Handle Space (Submit Word)
            if (e.key === ' ') {
                if (this.currentInput.trim().length === 0) return; // Ignore empty spaces
                
                const targetWord = this.words[this.activeWordIndex];
                const typedWord = this.currentInput.trim();

                this.totalTypedChars += typedWord.length;

                // Check if word is perfectly correct
                if (typedWord === targetWord) {
                    this.correctChars += targetWord.length;
                }

                this.activeWordIndex++;
                this.currentInput = "";

                // Generate more words if getting close to the end
                if (this.activeWordIndex >= this.words.length - 10) {
                    this.words.push(...this.generateWords(50));
                }
                return;
            }

            // Handle typing standard characters
            if (e.key.length === 1 && /[a-zA-Z0-9.,!?'-]/.test(e.key)) {
                this.currentInput += e.key.toLowerCase();
            }
        }
    }

    update(deltaTime) {
        // Draw during NAME_ENTRY
        if (this.gameState === 'START') {
            this.draw();
            return;
        }
        
        if (this.gameState === 'PLAYING') {
            // deltaTime is coming in as milliseconds from monitor.js, convert to seconds
            this.timeLeft -= (deltaTime / 1000);
            
            if (this.timeLeft <= 0) {
                this.timeLeft = 0;

                this.finalWPM = Math.round(this.correctChars / 5);
                this.leaderboard.saveScore(this.finalWPM);

                this.gameState = 'GAMEOVER';
            }
            this.draw();
        }
    }

    draw() {
        // Clear Background
        this.ctx.fillStyle = "#111111";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        if (this.gameState === 'START') {
            this.leaderboard.drawNameEntry(this.ctx, this.canvas.width, this.canvas.height, "TERMINAL TYPING TEST");
            return;
        } else {
            // Title
            this.ctx.fillStyle = "#00FF00";
            this.ctx.font = "bold 60px monospace";
            this.ctx.textAlign = "center";
            this.ctx.fillText("TERMINAL TYPING TEST", this.canvas.width / 2, 120);
        }

        if (this.gameState === 'PLAYING') {
            // Timer
            this.ctx.fillStyle = this.timeLeft <= 10 ? "#FF0000" : "#FFFFFF";
            this.ctx.font = "bold 50px monospace";
            this.ctx.textAlign = "right";
            this.ctx.fillText(`TIME: ${Math.ceil(this.timeLeft)}s`, this.canvas.width - 100, 120);

            // Draw Word Queue
            this.ctx.textAlign = "left";
            this.ctx.font = "60px monospace";
            
            const targetWord = this.words[this.activeWordIndex];
            const upcomingWords = this.words.slice(this.activeWordIndex + 1, this.activeWordIndex + 5).join(" ");
            
            // "TARGET >" Label
            this.ctx.fillStyle = "#AAAAAA";
            this.ctx.fillText("TARGET > ", 200, 450);

            // Active Word (White)
            let xOffset = 520;
            this.ctx.fillStyle = "#FFFFFF";
            this.ctx.fillText(targetWord, xOffset, 450);
            
            // Upcoming Words (Gray)
            xOffset += this.ctx.measureText(targetWord + " ").width;
            this.ctx.fillStyle = "#444444";
            this.ctx.fillText(upcomingWords, xOffset, 450);

            // "INPUT  >" Label
            this.ctx.fillStyle = "#AAAAAA";
            this.ctx.fillText("INPUT  > ", 200, 580);

            // User's Current Input
            // Color code red if they are making a typo currently
            const isTypo = !targetWord.startsWith(this.currentInput);
            this.ctx.fillStyle = isTypo ? "#FF0000" : "#00FF00";
            
            const cursor = (Math.floor(Date.now() / 500) % 2 === 0) ? "_" : "";
            this.ctx.fillText(this.currentInput + cursor, 520, 580);
            
            // Real-time WPM
            const elapsedMins = (60 - this.timeLeft) / 60;
            const currentWPM = elapsedMins > 0 ? Math.round((this.correctChars / 5) / elapsedMins) : 0;
            
            this.ctx.fillStyle = "#555555";
            this.ctx.font = "30px monospace";
            this.ctx.textAlign = "center";
            this.ctx.fillText(`Current WPM: ${currentWPM}`, this.canvas.width / 2, 850);
            return;
        }

        if (this.gameState === 'GAMEOVER') {
            this.ctx.fillStyle = "#FFFFFF";
            this.ctx.font = "bold 80px monospace";
            this.ctx.fillText("TEST COMPLETE", this.canvas.width / 2, 350);

            // Final Math
            // Standard WPM formula: (Correct Characters / 5) / Time In Minutes (1 min)
            const finalWPM = Math.round(this.correctChars / 5);
            const accuracy = this.totalTypedChars > 0 ? Math.round((this.correctChars / this.totalTypedChars) * 100) : 0;

            this.ctx.fillStyle = "#00FF00";
            this.ctx.font = "60px monospace";
            this.ctx.fillText(`WPM: ${finalWPM}`, this.canvas.width / 2, 500);
            
            this.ctx.fillStyle = "#FFFFFF";
            this.ctx.fillText(`Accuracy: ${accuracy}%`, this.canvas.width / 2, 600);

            this.ctx.fillStyle = "#AAAAAA";
            this.ctx.font = "30px monospace";
            this.ctx.fillText("Press [ENTER] to Try Again", this.canvas.width / 2, 800);
            this.ctx.fillText("Press [ESC] to Return to Menu", this.canvas.width / 2, 860);
        }
    }
}