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

    // Track mouse movement to update the radial gradient center
    window.addEventListener("mousemove", (e) => {
      // Calculate percentage based on window size
      const x = (e.clientX / window.innerWidth) * 100;
      const y = (e.clientY / window.innerHeight) * 100;

      // Apply variables to the loading screen container
      loadingScreen.style.setProperty('--mouse-x', `${x}%`);
      loadingScreen.style.setProperty('--mouse-y', `${y}%`);
    });

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

    document.body.classList.add(isTouchDevice ? 'is-mobile' : 'is-desktop');

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
        
        // Fade out everything inside the wrapper
        tl.to(".landing-wrapper", {
            opacity: 0,
            y: -20,
            duration: 0.5
        });
    
        // Existing "shrink and drop" effect
        tl.to(".loading-screen", {
            scale: 0.5,
            duration: 1.0,
            delay: 0.25,
            ease: "back.in(1.2)",
        }).to(".loading-screen", {
            y: "200vh",
            duration: 1.2,
            ease: "back.in(1.8)",
            onComplete: () => {
                document.querySelector(".loading-screen").style.display = "none";
            },
        }, "-=0.2");
    }
}

export function returnToLanding() {
    const loadingScreen = document.querySelector(".loading-screen");
    const loadingScreenButton = document.querySelector(".loading-screen-button");
    
    // 1. Reset the button text back to "Enter!"
    if (loadingScreenButton) {
        loadingScreenButton.textContent = "Enter!";
    }

    loadingScreen.style.display = "block";
    
    gsap.to(loadingScreen, {
        y: "0",
        scale: 1,
        duration: 1.2,
        ease: "expo.out",
        onStart: () => {
            // Re-fade in the landing content
            gsap.to(".landing-wrapper", { opacity: 1, delay: 0.5 });
        }
    });
}