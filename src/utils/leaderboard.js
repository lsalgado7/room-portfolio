// src/utils/leaderboard.js

export class LeaderboardHelper {
    constructor(gameKey, maxScores = 5) {
        this.gameKey = gameKey;
        this.maxScores = maxScores;
        this.playerName = "";
        
        // Try to load old Tetris/Snake scores if they exist under old names, 
        // otherwise default to standard naming
        const fallbackKey = gameKey === 'tetris' ? 'tetris_scores' : 
                            gameKey === 'snake' ? 'snake_leaderboard' : `${gameKey}_leaderboard`;
                            
        this.scores = this.loadScores(fallbackKey);
    }

    loadScores(key) {
        const saved = localStorage.getItem(key);
        return saved ? JSON.parse(saved) : [];
    }

    saveScore(score) {
        const name = this.playerName.trim() || "ANON";
        this.scores.push({ name, score });
        
        // Sort highest to lowest
        this.scores.sort((a, b) => b.score - a.score);
        this.scores = this.scores.slice(0, this.maxScores);
        
        localStorage.setItem(`${this.gameKey}_leaderboard`, JSON.stringify(this.scores));
    }

    // Returns true if the input was handled, allowing the app to redraw
    handleNameInput(e, onConfirm) {
        if (e.key === 'Enter') {
            if (this.playerName.trim().length > 0) {
                onConfirm();
            }
            return true;
        }
        if (e.key === 'Backspace') {
            this.playerName = this.playerName.slice(0, -1);
            return true;
        }
        if (e.key.length === 1 && this.playerName.length < 10) {
            // Allow letters and numbers only
            if (/[a-zA-Z0-9 ]/.test(e.key)) {
                this.playerName += e.key.toUpperCase();
            }
            return true;
        }
        return false;
    }

    drawNameEntry(ctx, canvasWidth, canvasHeight, title) {
        const cx = canvasWidth / 2;
        const cy = canvasHeight / 2;

        ctx.fillStyle = "#00FF00";
        ctx.font = "bold 80px monospace";
        ctx.textAlign = "center";
        ctx.fillText(title, cx, 150);

        ctx.fillStyle = "#FFFFFF";
        ctx.font = "40px monospace";
        ctx.fillText("ENTER PLAYER NAME", cx, cy - 80);

        ctx.fillStyle = "#000000";
        ctx.strokeStyle = "#00FF00";
        ctx.lineWidth = 4;
        ctx.fillRect(cx - 200, cy - 40, 400, 80);
        ctx.strokeRect(cx - 200, cy - 40, 400, 80);

        ctx.fillStyle = "#00FF00";
        ctx.font = "bold 50px monospace";
        const cursor = (Math.floor(Date.now() / 500) % 2 === 0) ? "_" : " ";
        ctx.fillText(this.playerName + cursor, cx, cy + 18);

        ctx.fillStyle = "#AAAAAA";
        ctx.font = "30px monospace";
        ctx.fillText("Press [ENTER] to Start", cx, cy + 100);

        this.drawScores(ctx, cx, cy + 200);
    }

    drawScores(ctx, x, y, currentScore = -1) {
        ctx.fillStyle = "#FFFF00";
        ctx.font = "bold 35px monospace";
        ctx.textAlign = "center";
        ctx.fillText("- HIGH SCORES -", x, y);

        ctx.font = "30px monospace";
        
        if (this.scores.length === 0) {
            ctx.fillStyle = "#FFFFFF";
            ctx.fillText("No scores yet!", x, y + 50);
        } else {
            this.scores.forEach((entry, index) => {
                // Pad strings so the columns align perfectly in monospace
                const namePart = entry.name.padEnd(10, ' ');
                const scorePart = entry.score.toString().padStart(6, ' ');
                const text = `${index + 1}. ${namePart} - ${scorePart}`;
                
                if (entry.score === currentScore && entry.name === this.playerName) {
                    ctx.fillStyle = "#00FF00"; // Highlight current run
                } else {
                    ctx.fillStyle = "#FFFFFF";
                }
                ctx.fillText(text, x, y + 50 + (index * 40));
            });
        }
    }
}