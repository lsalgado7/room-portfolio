// raycasts.js
import * as THREE from 'three';
import { isModalActive } from './modals.js'; // Import the state directly

export const raycaster = new THREE.Raycaster();
export const pointer = new THREE.Vector2();

// Pass canvas and the interaction handler as arguments
export function setupRaycasterEvents(canvas, handleInteraction) {
  
  window.addEventListener("mousemove", (e) => {
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = - (e.clientY / window.innerHeight) * 2 + 1;
  });

  window.addEventListener("touchstart", (e) => {
    const isInsideModal = e.target.closest(".modal");
    
    // 1. If inside modal, do nothing (allows scrolling)
    if (isInsideModal) return;

    // 2. If hitting canvas, handle interaction
    if (e.target === canvas) {
      // Update pointer position for touch
      pointer.x = (e.touches[0].clientX / window.innerWidth) * 2 - 1;
      pointer.y = - (e.touches[0].clientY / window.innerHeight) * 2 + 1;
      
      // Stop the page from bouncing/scrolling while interacting with 3D
      e.preventDefault(); 
      handleInteraction(e);
    }
  }, { passive: false });

  window.addEventListener("mousedown", (e) => {
    if (e.target === canvas && !isModalActive) {
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.y = - (e.clientY / window.innerHeight) * 2 + 1;
      handleInteraction(e);
    }
  });
}