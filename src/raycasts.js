// raycasts.js
import * as THREE from 'three';
import { isModalActive } from './modals.js'; 
import { socialLinks, notClickable, hoverItems } from './mappings.js';
import { playClickAnimation, playHoverAnimation } from './animations.js';
import { showModal, modals } from './modals.js';

export const raycaster = new THREE.Raycaster();
export const pointer = new THREE.Vector2();

let prevObject = null;
let currentObject = null;

// Setup event listeners so the app knows what to do with inputs
export function setupRaycasterEvents(canvas, ctrls) {
  window.addEventListener("mousemove", (e) => {
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = - (e.clientY / window.innerHeight) * 2 + 1;
  });

  window.addEventListener("touchstart", (e) => {
    const isInsideModal = e.target.closest(".modal");
    if (isInsideModal) return;

    if (e.target === canvas) {
      pointer.x = (e.touches[0].clientX / window.innerWidth) * 2 - 1;
      pointer.y = - (e.touches[0].clientY / window.innerHeight) * 2 + 1;
      e.preventDefault(); 
      handleRaycasterInteraction(currentObject, ctrls); // No need to pass 'e' if we use the pointer variable
    }
  }, { passive: false });

  window.addEventListener("mousedown", (e) => {
    if (e.target === canvas && !isModalActive) {
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.y = - (e.clientY / window.innerHeight) * 2 + 1;
      handleRaycasterInteraction(currentObject, ctrls);
    }
  });
}

// update hover state for objects in scene
export function updateObjectHover(object) {
  if (isModalActive || !object || !object.name) {
    resetHover();
    return;
  }

  currentObject = object;

  if (object.name.includes("click") && !object.name.includes("desktop")) {
    if (object !== prevObject) {
      if (prevObject) {
        playHoverAnimation(prevObject, false);
      }
      playHoverAnimation(object, true);
      prevObject = object;
    }
    document.body.style.cursor = "pointer";
  } else {
    resetHover();
  }
}


export function clearCurrentObject() {
  currentObject = null;
  prevObject = null;
}

// --- HELPER FUNCTIONS ---

// Run for 3D Clicks
function handleRaycasterInteraction(object, controls) {
  if (isModalActive || !object) return;

  // Social Links Logic
  Object.entries(socialLinks).forEach(([key, url]) => {
    if (object.name.includes(key)) {
      const newWindow = window.open();
      newWindow.opener = null;
      newWindow.location = url;
    }
  });

  // Modal Trigger Logic
  if (object.name.includes('click_work')) {
    showModal(modals.work, controls);
  } else if (object.name.includes('click_about')) {

    showModal(modals.about, controls);
  } else if (object.name.includes('click_contact')) {
    showModal(modals.contact, controls);
  }

  // Click Animations
  if (!notClickable.some(name => object.name.includes(name)) &&
      !hoverItems.some(name => object.name.includes(name))) {
    playClickAnimation(object);
  }
}

// play fade out animation and reset cursor/variables
function resetHover() {
  if (prevObject) {
    playHoverAnimation(prevObject, false);
    prevObject = null;
  }
  document.body.style.cursor = "default";
}