// loading-screen.js
import { manager } from './loaders.js';
import gsap from "gsap";

export function initLoadingScreen() {
    const loadingScreen = document.querySelector(".loading-screen");
    const loadingScreenButton = document.querySelector(".loading-screen-button");
    // const noSoundButton = document.querySelector(".no-sound-button"); // currently unused
    
    // Select the instruction texts
    const desktopText = document.querySelector(".desktop-instructions");
    const mobileText = document.querySelector(".mobile-instructions");

    // --- DEVICE DETECTION LOGIC ---
    // Check if device supports touch events
    const isTouchDevice = 
        'ontouchstart' in window || 
        navigator.maxTouchPoints > 0 || 
        navigator.msMaxTouchPoints > 0;

    if (isTouchDevice) {
        mobileText.style.display = "block";
        desktopText.style.display = "none";
    } else {
        desktopText.style.display = "block";
        mobileText.style.display = "none";
    }

    // State tracking
    let isLoaded = false;

    // 1. Hook into the Manager from loaders.js
    manager.onLoad = function () {
        isLoaded = true;
        
        // Update UI to "Ready" state
        loadingScreenButton.style.border = "8px solid #B6A48C";
        loadingScreenButton.style.background = "#695D47";
        loadingScreenButton.style.color = "#e6dede";
        loadingScreenButton.textContent = "Enter!";
        loadingScreenButton.style.cursor = "pointer";
        
        // Make the secondary button visible if you want audio options later
        // noSoundButton.style.display = "block"; 
    };

    manager.onProgress = function (url, itemsLoaded, itemsTotal) {
        // Optional: Update percentage text
        loadingScreenButton.textContent = `Loading... ${Math.round((itemsLoaded / itemsTotal) * 100)}%`;
    };

    // 2. Handle Enter Click
    function handleEnter() {
        if (!isLoaded) return;

        // Change button style on click
        loadingScreenButton.style.cursor = "default";
        loadingScreenButton.style.border = "8px solid #2B352C";
        loadingScreenButton.style.background = "#D3C6B5";
        loadingScreenButton.style.color = "#2B352C";
        loadingScreenButton.textContent = "~ Welcome ~";
        loadingScreen.style.background = "#D3C6B5";

        // Play the reveal animation
        playReveal();
    }

    // Event Listeners
    loadingScreenButton.addEventListener("click", handleEnter);
    loadingScreenButton.addEventListener("touchend", (e) => {
        e.preventDefault();
        handleEnter();
    });

    // 3. Reveal Animation
    function playReveal() {
        const tl = gsap.timeline();

        tl.to(".landing-content", {
            opacity: 0,
            duration: 0.4
        });

        tl.to(loadingScreen, {
            scale: 0.5,
            duration: 1.2,
            delay: 0.25,
            ease: "back.in(1.8)",
        }).to(loadingScreen, {
            y: "200vh",
            duration: 1.2,
            ease: "back.in(1.8)",
            onComplete: () => {
                loadingScreen.style.display = "none";
                // If you have an intro animation for the camera, trigger it here:
                // playIntroAnimation(); 
            },
        }, "-=0.1");
    }
}