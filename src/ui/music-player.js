import { playlist } from '../config/playlist.js';

export class EmbedPlayer {
    constructor() {
        this.currentIndex = 0;
        // Start open by default? Or false to start collapsed. 
        // User asked for "Open by default" in final plan.
        this.isOpen = true; 
        this.hasInteracted = false;

        this.initUI();
        this.loadTrack(this.currentIndex);
    }

    initUI() {
        // 1. Main Container (The sliding box)
        this.container = document.createElement('div');
        this.container.className = 'music-player-container';
        
        // 2. The Toggle Tab (🎵) - Attached to the side
        this.toggleBtn = document.createElement('button');
        this.toggleBtn.className = 'music-toggle-tab';
        this.toggleBtn.textContent = '🎵';
        this.toggleBtn.onclick = () => this.toggleSlide();
        
        // 3. Content Wrapper (Header + Iframe + Controls)
        const content = document.createElement('div');
        content.className = 'music-content';

        // -- Header --
        const header = document.createElement('h3');
        header.className = 'music-header';
        header.textContent = '[ Music Player ]';

        // -- Iframe Box --
        this.iframeBox = document.createElement('div');
        this.iframeBox.className = 'iframe-box';

        // -- Controls (Prev / Next) --
        const controls = document.createElement('div');
        controls.className = 'music-controls';

        const prevBtn = document.createElement('button');
        prevBtn.textContent = '<<';
        prevBtn.onclick = () => this.changeTrack(-1);

        const nextBtn = document.createElement('button');
        nextBtn.textContent = '>>';
        nextBtn.onclick = () => this.changeTrack(1);

        controls.appendChild(prevBtn);
        controls.appendChild(nextBtn);

        // Assemble Content
        content.appendChild(header);
        content.appendChild(this.iframeBox);
        content.appendChild(controls);

        // Assemble Container
        this.container.appendChild(this.toggleBtn); // Tab is visually outside via CSS
        this.container.appendChild(content);

        document.body.appendChild(this.container);
    }

    loadTrack(index) {
        const track = playlist[index];
        let src = track.src;

        if (this.hasInteracted) {
             src = src.endsWith('/') ? `${src}autoplay=1/` : `${src}/autoplay=1/`;
        }
        
        this.iframeBox.innerHTML = `
            <iframe 
                style="border: 0; width: 100%; height: 42px;" 
                src="${src}" 
                seamless>
                <a href="${track.href}">${track.title}</a>
            </iframe>
        `;
    }

    changeTrack(direction) {
        this.hasInteracted = true;
        this.currentIndex = (this.currentIndex + direction + playlist.length) % playlist.length;
        this.loadTrack(this.currentIndex);
    }

    toggleSlide() {
        this.isOpen = !this.isOpen;
        this.container.classList.toggle('collapsed', !this.isOpen);
    }
}