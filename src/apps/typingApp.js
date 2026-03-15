// src/apps/typingApp.js
import { LeaderboardHelper } from '../utils/leaderboard.js';

export class TypingApp {
    constructor(canvas, ctx, callbacks) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.callbacks = callbacks;

        this.languages = [
            { id: 'rust', label: 'Rust', prefix: 'rs', count: 6 },
            { id: 'python', label: 'Python', prefix: 'py', count: 6 },
            { id: 'cpp', label: 'C++', prefix: 'cpp', count: 6 }
        ];

        this.leaderboard = new LeaderboardHelper('coding');
        this.gameState = 'LANGUAGE_SELECT'; 
        this.selectedLanguage = 0;
        this.handleInput = this.handleInput.bind(this);
    }

    onStart() {
        this.gameState = 'LANGUAGE_SELECT';
        this.selectedLanguage = 0;
        window.addEventListener('keydown', this.handleInput);
        this.draw();
    }

    onEnd() {
        window.removeEventListener('keydown', this.handleInput);
    }

    resetGame() {
        this.seenSnippets = [];
        this.correctChars = 0;
        this.totalTypedChars = 0;
        this.timeLeft = 60.0;
        this.loadNewSnippet();
    }

    async loadNewSnippet() {
        this.gameState = 'LOADING';
        this.draw();
        
        const lang = this.languages[this.selectedLanguage];
        let available = [];
        for (let i = 1; i <= lang.count; i++) {
            if (!this.seenSnippets.includes(i)) available.push(i);
        }
        if (available.length === 0) {
            this.seenSnippets = [];
            for (let i = 1; i <= lang.count; i++) available.push(i);
        }
        
        const randomIndex = available[Math.floor(Math.random() * available.length)];
        this.seenSnippets.push(randomIndex);
        
        try {
            const response = await fetch(`./code_text/${lang.id}/${lang.prefix}${randomIndex}.txt`);
            if (response.ok) {
                this.targetText = await response.text();
                // Normalize line endings and convert tabs to spaces to match typical browser output
                this.targetText = this.targetText.replace(/\r\n/g, '\n').replace(/\t/g, '    ');
            } else {
                this.targetText = "// Failed to load snippet\n// Please try again";
            }
        } catch (e) {
            this.targetText = "// Error loading snippet\n// Check your network connection";
        }
        
        this.currentInput = "";
        this.gameState = 'PLAYING';
        this.draw();
    }

    getCorrectChars() {
        let currentCorrect = 0;
        if (this.currentInput && this.targetText) {
            for (let i = 0; i < this.currentInput.length; i++) {
                if (this.currentInput[i] === this.targetText[i]) {
                    currentCorrect++;
                } else {
                    break;
                }
            }
        }
        return this.correctChars + currentCorrect;
    }

    handleInput(e) {
        if (e.key === 'Escape') {
            this.callbacks.launch('menu');
            return;
        }

        if (this.gameState === 'LANGUAGE_SELECT') {
            if (e.key === 'ArrowUp') {
                this.selectedLanguage = (this.selectedLanguage - 1 + this.languages.length) % this.languages.length;
                this.draw();
            } else if (e.key === 'ArrowDown') {
                this.selectedLanguage = (this.selectedLanguage + 1) % this.languages.length;
                this.draw();
            } else if (e.key === 'Enter') {
                this.gameState = 'NAME_ENTRY';
                this.draw();
            }
            return;
        }

        if (this.gameState === 'NAME_ENTRY') {
            if (this.leaderboard.handleNameInput(e, () => { this.resetGame(); })) {
                this.draw();
            }
            return;
        }

        if (this.gameState === 'GAMEOVER') {
            if (e.key === 'Enter') {
                this.gameState = 'LANGUAGE_SELECT'; 
                this.draw();
            }
            return;
        }

        if (this.gameState === 'PLAYING') {
            if (e.key === 'Backspace') {
                if (this.currentInput.length > 0) {
                    this.currentInput = this.currentInput.slice(0, -1);
                }
                this.draw();
                return;
            }

            let char = "";
            if (e.key === 'Enter') {
                char = '\n';
            } else if (e.key === 'Tab') {
                e.preventDefault(); // Prevent tab focus shifting
                char = '    ';
            } else if (e.key.length === 1) {
                char = e.key;
            }

            if (char) {
                if (char === ' ') e.preventDefault(); // Prevent page scrolling

                this.currentInput += char;
                this.totalTypedChars += char.length;

                // Automatically switch to next snippet if successfully fully typed
                if (this.currentInput === this.targetText) {
                    this.correctChars += this.targetText.length;
                    this.loadNewSnippet();
                } else {
                    this.draw();
                }
            }
        }
    }

    update(deltaTime) {
        if (this.gameState === 'LANGUAGE_SELECT' || this.gameState === 'NAME_ENTRY' || this.gameState === 'LOADING') {
            this.draw();
            return;
        }
        
        if (this.gameState === 'PLAYING') {
            this.timeLeft -= (deltaTime / 1000);
            
            if (this.timeLeft <= 0) {
                this.timeLeft = 0;
                this.finalWPM = Math.round(this.getCorrectChars() / 5);
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

        if (this.gameState === 'LANGUAGE_SELECT') {
            this.ctx.fillStyle = "#00FF00";
            this.ctx.font = "bold 60px monospace";
            this.ctx.textAlign = "center";
            this.ctx.fillText("CODING TEST", this.canvas.width / 2, 200);

            this.ctx.fillStyle = "#AAAAAA";
            this.ctx.font = "40px monospace";
            this.ctx.fillText("Select Language:", this.canvas.width / 2, 350);

            for (let i = 0; i < this.languages.length; i++) {
                const y = 450 + i * 70;
                if (i === this.selectedLanguage) {
                    this.ctx.fillStyle = "#00FF00";
                    this.ctx.fillText(`> ${this.languages[i].label} <`, this.canvas.width / 2, y);
                } else {
                    this.ctx.fillStyle = "#004400";
                    this.ctx.fillText(this.languages[i].label, this.canvas.width / 2, y);
                }
            }
            return;
        }

        if (this.gameState === 'NAME_ENTRY') {
            this.leaderboard.drawNameEntry(this.ctx, this.canvas.width, this.canvas.height, "CODING TEST");
            return;
        }

        if (this.gameState === 'LOADING') {
            this.ctx.fillStyle = "#FFFFFF";
            this.ctx.font = "bold 50px monospace";
            this.ctx.textAlign = "center";
            this.ctx.fillText("LOADING SNIPPET...", this.canvas.width / 2, this.canvas.height / 2);
            return;
        }

        this.ctx.fillStyle = "#00FF00";
        this.ctx.font = "bold 60px monospace";
        this.ctx.textAlign = "center";
        this.ctx.fillText("CODING TEST", this.canvas.width / 2, 80);

        if (this.gameState === 'PLAYING') {
            this.ctx.fillStyle = this.timeLeft <= 10 ? "#FF0000" : "#FFFFFF";
            this.ctx.font = "bold 40px monospace";
            this.ctx.textAlign = "right";
            this.ctx.fillText(`TIME: ${Math.ceil(this.timeLeft)}s`, this.canvas.width - 100, 80);

            const elapsedMins = (60 - this.timeLeft) / 60;
            const currentCorrect = this.getCorrectChars();
            const currentWPM = elapsedMins > 0 ? Math.round((currentCorrect / 5) / elapsedMins) : 0;
            
            this.ctx.fillStyle = "#d3d3d3ff";
            this.ctx.font = "30px monospace";
            this.ctx.textAlign = "center";
            this.ctx.fillText(`Current WPM: ${currentWPM}`, this.canvas.width / 2, 130);

            this.ctx.textAlign = "left";
            this.ctx.font = "28px monospace";

            const lines = this.targetText.split('\n');
            const inputLines = this.currentInput.split('\n');

            const lineHeight = 36;
            const activeLineIndex = inputLines.length - 1;
            
            // Auto-scroll down as they reach deeper lines
            let startY = 200;
            if (activeLineIndex > 10) {
                startY -= (activeLineIndex - 10) * lineHeight;
            }

            let hasError = false;

            for (let i = 0; i < lines.length; i++) {
                const targetLine = lines[i];
                const inputLine = inputLines[i]; 

                let currentX = 100;

                for (let j = 0; j < targetLine.length; j++) {
                    const char = targetLine[j];
                    const inputChar = inputLine !== undefined ? inputLine[j] : undefined;

                    if (inputChar === undefined) {
                        this.ctx.fillStyle = "#d2d2d2ff"; 
                    } else {
                        if (inputChar === char && !hasError) {
                            this.ctx.fillStyle = "#00FF00";
                        } else {
                            this.ctx.fillStyle = "#FF0000";
                            hasError = true;
                        }
                    }

                    const textToDraw = (inputChar !== undefined && inputChar !== char) ? inputChar : char;
                    this.ctx.fillText(textToDraw, currentX, startY);
                    currentX += this.ctx.measureText(textToDraw).width;
                }

                // Draw extra typed characters in red
                if (inputLine !== undefined && inputLine.length > targetLine.length) {
                    const extraChars = inputLine.slice(targetLine.length);
                    this.ctx.fillStyle = "#FF0000";
                    hasError = true;
                    for (let k = 0; k < extraChars.length; k++) {
                        this.ctx.fillText(extraChars[k], currentX, startY);
                        currentX += this.ctx.measureText(extraChars[k]).width;
                    }
                }

                // Catch if they hit enter too early
                if (inputLine !== undefined && i < inputLines.length - 1) {
                    if (inputLine.length !== targetLine.length) {
                        hasError = true;
                    }
                }

                if (i === activeLineIndex) {
                    const cursor = (Math.floor(Date.now() / 500) % 2 === 0) ? "_" : "";
                    this.ctx.fillStyle = hasError ? "#FF0000" : "#00FF00";
                    this.ctx.fillText(cursor, currentX, startY);
                }

                startY += lineHeight;
            }

            return;
        }

        if (this.gameState === 'GAMEOVER') {
            this.ctx.fillStyle = "#FFFFFF";
            this.ctx.font = "bold 80px monospace";
            this.ctx.textAlign = "center";
            this.ctx.fillText("TEST COMPLETE", this.canvas.width / 2, 350);

            const accuracy = this.totalTypedChars > 0 ? Math.round((this.getCorrectChars() / this.totalTypedChars) * 100) : 0;

            this.ctx.fillStyle = "#00FF00";
            this.ctx.font = "60px monospace";
            this.ctx.fillText(`WPM: ${this.finalWPM}`, this.canvas.width / 2, 500);
            
            this.ctx.fillStyle = "#FFFFFF";
            this.ctx.fillText(`Accuracy: ${accuracy}%`, this.canvas.width / 2, 600);

            this.ctx.fillStyle = "#AAAAAA";
            this.ctx.font = "30px monospace";
            this.ctx.fillText("Press [ENTER] to Try Again", this.canvas.width / 2, 800);
            this.ctx.fillText("Press [ESC] to Return to Menu", this.canvas.width / 2, 860);
        }
    }
}