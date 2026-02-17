// src/desktop-view.js
import gsap from 'gsap';
import * as THREE from 'three';

// State to track if we are currently at the desk
export let isDesktopViewActive = false;

// Store original camera position to return to
let originalPosition = new THREE.Vector3();
let originalTarget = new THREE.Vector3();

// Store original constraints
let savedConstraints = {};

//Position: -1.2416436778860407, 5.9246796151950765, -2.913753351614945 |
//Rotation: -2.955586009837653, 1.3322675125434146e-16, 3.141592653589793 |
//Target: -1.2416436778860414, 5, 2

// Configuration for where the camera should go (YOU WILL NEED TO TUNE THESE VALUES)
const DESKTOP_CAMERA_POS = new THREE.Vector3(-1.24164, 6.42467, -1.91375); // Example: slightly in front of screen
const DESKTOP_TARGET_POS = new THREE.Vector3(-1.24164, 5.5, 3); // Example: looking at screen center

export function setupDesktopViewEvents(camera, controls) {
    const exitBtn = document.getElementById('exit-desktop-btn');
    
    if(exitBtn) {
        exitBtn.addEventListener('click', () => {
            exitDesktopView(camera, controls);
        });
    }

    // Optional: Allow 'Escape' key to exit
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && isDesktopViewActive) {
            exitDesktopView(camera, controls);
        }
    });
}

export function enterDesktopView(camera, controls) {
    if (isDesktopViewActive) return;

    // 1. Save current state
    originalPosition.copy(camera.position);
    originalTarget.copy(controls.target);
    isDesktopViewActive = true;

    savedConstraints = {
        minDistance: controls.minDistance,
        minAzimuthAngle: controls.minAzimuthAngle,
        maxAzimuthAngle: controls.maxAzimuthAngle,
        minPolarAngle: controls.minPolarAngle,
        maxPolarAngle: controls.maxPolarAngle,
        // Clone vectors to avoid reference issues
        minPan: controls.minPan.clone(), 
        maxPan: controls.maxPan.clone()
    };

    // 2. Unlock ALL limits
    controls.minDistance = 0;
    controls.minAzimuthAngle = -Infinity;
    controls.maxAzimuthAngle = Infinity;
    controls.minPolarAngle = 0;
    controls.maxPolarAngle = Math.PI;
    
    // Expand pan limits to practically infinite
    controls.minPan.set(-100, -100, -100);
    controls.maxPan.set(100, 100, 100);

    // 3. Disable User Interaction
    controls.enableRotate = false;
    controls.enableZoom = false;
    controls.enablePan = false;

    // 4. Animate Camera Position
    gsap.to(camera.position, {
        x: DESKTOP_CAMERA_POS.x,
        y: DESKTOP_CAMERA_POS.y,
        z: DESKTOP_CAMERA_POS.z,
        duration: 1.5,
        ease: "power2.inOut"
    });

    // 4. Animate Camera Target (where it looks)
    gsap.to(controls.target, {
        x: DESKTOP_TARGET_POS.x,
        y: DESKTOP_TARGET_POS.y,
        z: DESKTOP_TARGET_POS.z,
        duration: 1.5,
        ease: "power2.inOut",
        onUpdate: () => controls.update(), // Important: keep controls synced during tween
        onComplete: () => {
            // Show the exit button after animation finishes
            const exitBtn = document.getElementById('exit-desktop-btn');
            if(exitBtn) exitBtn.classList.add('active');
        }
    });
}

export function exitDesktopView(camera, controls) {
    if (!isDesktopViewActive) return;

    const exitBtn = document.getElementById('exit-desktop-btn');
    if(exitBtn) exitBtn.classList.remove('active');

    // 1. Animate back to original position
    gsap.to(camera.position, {
        x: originalPosition.x,
        y: originalPosition.y,
        z: originalPosition.z,
        duration: 1.2,
        ease: "power2.inOut"
    });

    // 2. Animate target back
    gsap.to(controls.target, {
        x: originalTarget.x,
        y: originalTarget.y,
        z: originalTarget.z,
        duration: 1.2,
        ease: "power2.inOut",
        onUpdate: () => controls.update(),
        onComplete: () => {
            // 3. Re-enable controls
            controls.enableRotate = true;
            controls.enableZoom = true;
            controls.enablePan = true;

            // 4. Restore Constraints
            controls.minDistance = savedConstraints.minDistance;
            controls.minAzimuthAngle = savedConstraints.minAzimuthAngle;
            controls.maxAzimuthAngle = savedConstraints.maxAzimuthAngle;
            controls.minPolarAngle = savedConstraints.minPolarAngle;
            controls.maxPolarAngle = savedConstraints.maxPolarAngle;
            controls.minPan.copy(savedConstraints.minPan);
            controls.maxPan.copy(savedConstraints.maxPan);

            isDesktopViewActive = false;
        }
    });
}