// loading-screen.js
import { manager } from './loaders.js';
import gsap from "gsap";

export function initLoadingScreen() {
    const loadingScreen = document.querySelector(".loading-screen");
    const loadingScreenButton = document.querySelector(".loading-screen-button");
    const btnText = loadingScreenButton.querySelector(".btn-text")
    
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

    document.body.classList.add(isTouchDevice ? 'is-mobile' : 'is-desktop');

    // State tracking
    let isLoaded = false;

    // 1. Hook into the Manager from loaders.js
    manager.onLoad = function () {
        isLoaded = true;
        loadingScreenButton.classList.add("is-ready"); // Add a class
        if (btnText) btnText.textContent = "Enter!";
    };

    manager.onProgress = function (url, itemsLoaded, itemsTotal) {
        // Optional: Update percentage text
        btnText.textContent = `Loading... ${Math.round((itemsLoaded / itemsTotal) * 100)}%`;
    };

    // 2. Handle Enter Click
    function handleEnter() {
        if (!isLoaded) return;

        // Change button style on click
        loadingScreenButton.style.cursor = "default";
        if (btnText) btnText.textContent = "~ Welcome ~";

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
    const btnText = loadingScreenButton.querySelector(".btn-text");
    
    // 1. Reset the button text back to "Enter!"
    if (btnText) {
        btnText.textContent = "Enter!";
    }
    loadingScreenButton.style.cursor = "pointer";
    loadingScreen.style.display = "block";
    
    gsap.to(loadingScreen, {
        y: "0",
        scale: 1,
        duration: 1.2,
        ease: "expo.out",
        clearProps: "transform",
        onStart: () => {
            // Re-fade in the landing content
            gsap.to(".landing-wrapper", { opacity: 1, delay: 0.5 });
        }
    });
}