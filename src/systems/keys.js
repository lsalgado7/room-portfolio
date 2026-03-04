// src/systems/keys.js
import gsap from 'gsap';
import { isDesktopViewActive } from '../interaction/desktop-view.js';

// Dictionary to hold our 3D key objects
const keyMeshes = {};

// Map special JavaScript event.codes to your custom Blender names
// Updated to match your exact outliner names and abbreviations
const customKeyMap = {
    'ArrowDown': 'key_darr',
    'ArrowUp': 'key_uarr',
    'ArrowLeft': 'key_larr',
    'ArrowRight': 'key_rarr',
    'ControlLeft': 'key_lctrl',
    'ControlRight': 'key_rctrl',
    'ShiftLeft': 'key_lshft',
    'ShiftRight': 'key_rshft',
    'AltLeft': 'key_lalt',
    'AltRight': 'key_ralt',
    'Space': 'key_spc',
    'Enter': 'key_ent',
    'Backspace': 'key_bs',
    'Escape': 'key_esc',
    'Tab': 'key_tab',
    'CapsLock': 'key_cl',
    
    // Symbol Keys
    'Period': 'key_.',
    'Quote': "key_'",
    'Comma': 'key_,',
    'Minus': 'key_-',
    'Slash': 'key_/',
    'Semicolon': 'key_;',
    'Equal': 'key_=',
    'BracketLeft': 'key_[',
    'Backslash': 'key_\\',
    'BracketRight': 'key_]'
};

// Called by loaders.js when the model loads
export function registerKey(mesh) {
    // Splits "key_a_two" into "key_a"
    const name = mesh.name.split('_')[0] + '_' + mesh.name.split('_')[1]; 
    
    // Save the original resting position
    mesh.userData.basePosition = mesh.position.clone();
    
    // Store it in our dictionary
    keyMeshes[name.toLowerCase()] = mesh;
}

// Translator: Converts JS event.code to your 3D model name
function getMeshName(eventCode) {
    // 1. Check if it's a special/symbol key we manually mapped
    if (customKeyMap[eventCode]) return customKeyMap[eventCode];
    
    // 2. Auto-map standard letters (e.g., "KeyF" -> "key_f")
    if (eventCode.startsWith('Key')) {
        return `key_${eventCode.charAt(3).toLowerCase()}`;
    }
    
    // 3. Auto-map standard numbers (e.g., "Digit5" -> "key_5")
    if (eventCode.startsWith('Digit')) {
        return `key_${eventCode.charAt(5)}`;
    }
    
    return null;
}

// Track what is currently pressed so we don't spam animations on hold
const pressedKeys = new Set();

// Listen for keys pressing DOWN
window.addEventListener('keydown', (e) => {
    // Only animate if we are actively using the computer
    if (!isDesktopViewActive) return;
    if (pressedKeys.has(e.code)) return;
    
    pressedKeys.add(e.code);
    const meshName = getMeshName(e.code);
    
    if (meshName && keyMeshes[meshName]) {
        const mesh = keyMeshes[meshName];
        gsap.killTweensOf(mesh.position);
        
        // Push the key down. 
        // NOTE: Depending on your Blender export, you may need to change 'y' 
        // to 'z' or 'x', and adjust the travel distance (0.015) to look right.
        gsap.to(mesh.position, {
            y: mesh.userData.basePosition.y - 0.015, 
            duration: 0.05,
            ease: 'power2.out'
        });
    }
});

// Listen for keys popping UP
window.addEventListener('keyup', (e) => {
    pressedKeys.delete(e.code);
    const meshName = getMeshName(e.code);
    
    if (meshName && keyMeshes[meshName]) {
        const mesh = keyMeshes[meshName];
        gsap.killTweensOf(mesh.position);
        
        // Return to resting position
        gsap.to(mesh.position, {
            y: mesh.userData.basePosition.y,
            duration: 0.1,
            ease: 'power2.out'
        });
    }
});