import * as THREE from 'three';
import { screenMesh } from '../world/loaders.js';
import { SnakeApp } from '../apps/snakeApp.js';
import { MenuApp } from '../apps/menuApp.js';
import { TetrisApp } from '../apps/tetrisApp.js';

export class Monitor {
    constructor() {
        // SETUP CANVAS
        this.canvas = document.createElement('canvas');
        this.canvas.width = 1024; 
        this.canvas.height = 1024;
        this.ctx = this.canvas.getContext('2d');

        // SETUP TEXTURE
        this.texture = new THREE.CanvasTexture(this.canvas);
        this.texture.colorSpace = THREE.SRGBColorSpace;
        this.texture.flipY = false; 

        // FLIP HORIZONTALLY
        this.texture.center.set(0.5, 0.5);
        this.texture.repeat.set(-1, 1);

        // Create a Material for the screen
        this.material = new THREE.MeshBasicMaterial({ map: this.texture });
        
        this.currentApp = null;

        // --- APP REGISTRY ---
        // This maps string names to Classes
        this.apps = {
            'menu': MenuApp,
            'snake': SnakeApp,
            'tetris': TetrisApp
        };

        // --- SYSTEM CALLBACKS ---
        // These are passed to apps so they can control the computer
        this.systemCallbacks = {
            launch: (appName) => this.launchApp(appName),
            exit: () => this.triggerExit()
        };
    }

    // Call this when entering Desktop View
    mount() {
        if(screenMesh) {
            this.originalMaterial = screenMesh.material;
            screenMesh.material = this.material;
            this.launchApp('menu');
        }
    }

    // Call this when exiting Desktop View
    unmount() {
        if (this.currentApp) this.closeApp();
        if(screenMesh && this.originalMaterial) {
            screenMesh.material = this.originalMaterial;
        }
    }

    launchApp(appName) {
        if (this.currentApp) this.closeApp();
        
        const AppClass = this.apps[appName];
        if (AppClass) {
            // Instantiate the new app and pass the canvas + callbacks
            this.currentApp = new AppClass(this.canvas, this.ctx, this.systemCallbacks);
            this.currentApp.onStart();
            
            // Force a redraw immediately
            this.texture.needsUpdate = true;
        }
    }

    closeApp() {
        if (!this.currentApp) return;
        this.currentApp.onEnd();
        this.currentApp = null;
    }

    triggerExit() {
        // Finds the HTML exit button and clicks it to leave desktop view
        const exitBtn = document.getElementById('exit-desktop-btn');
        if(exitBtn) exitBtn.click();
    }

    update(deltaTime) {
        if (this.currentApp) {
            this.currentApp.update(deltaTime);
            this.texture.needsUpdate = true; // Tell Three.js the canvas changed
        }
    }
}

// Singleton instance
export const computer = new Monitor();