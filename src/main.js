// main.js
import * as THREE from 'three';
// Utils
import { OrbitControls } from './utils/orbit-controls.js';
import { animateSceneObjects } from './utils/animations.js';
// UI
import { initLoadingScreen, returnToLanding } from './ui/landing-page.js';
import { initModalEvents, showModal, modals } from './ui/modals.js';
import { EmbedPlayer } from './ui/music-player.js';
// World
import { loadRoomScene, fans, interactSign, chairSeat } from './world/loaders.js';
// Interaction
import { setupRaycasterEvents, updateObjectHover } from './interaction/raycasts.js';
import { setupDesktopViewEvents, isDesktopViewActive } from './interaction/desktop-view.js';
// Systems
import { computer } from './systems/monitor.js';

const canvas = document.querySelector("#experience-canvas");
const sizes = {
  height: window.innerHeight,
  width: window.innerWidth
}

// Scene Setup
const scene = new THREE.Scene();

// State variables for interaction
export const raycasterObjects = [];

// Camera
export const camera = new THREE.PerspectiveCamera(
  35,
  sizes.width / sizes.height,
  0.1,
  1000
);
camera.position.set(15.717788027775475, 12.999056165580686, -30.399979518146132 );

// Renderer setup
const renderer = new THREE.WebGLRenderer({canvas:canvas, antialias: true });
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// Controls setup
const controls = new OrbitControls(camera, renderer.domElement);
controls.minDistance = 5;
controls.maxDistance = 35;
controls.minPolarAngle = 0;
controls.maxPolarAngle = Math.PI / 2;
controls.minAzimuthAngle = Math.PI / 2;
controls.maxAzimuthAngle = Math.PI;
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.update();
controls.target.set(0.5127399372523783, 4.046808560932034, -0.1731077747794347);

// Init DOM events
setupRaycasterEvents(canvas, controls);
initModalEvents(controls);
setupDesktopViewEvents(camera, controls);

// Load Models
loadRoomScene(scene);

// ready loading screen
initLoadingScreen();

// Resize
window.addEventListener("resize", ()=>{
  sizes.width = window.innerWidth
  sizes.height = window.innerHeight

  camera.aspect = sizes.width / sizes.height
  camera.updateProjectionMatrix();

  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

function setupTipsToggle() {
  const tipsBox = document.getElementById('tips-box');
  const helpIcon = document.getElementById('help-icon');
  
  const toggleTips = () => {
    // Check if the hidden class was added or removed
    const isHidden = tipsBox.classList.toggle('hidden');
    
    // Only update the interact sign if we aren't currently zoomed into the desktop
    if (interactSign && !isDesktopViewActive) {
      interactSign.visible = !isHidden;
    }
  };

  // Keyboard 'H' Toggle
  window.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'h' && !isDesktopViewActive) toggleTips();
  });

  // Help Icon Click
  if (helpIcon) helpIcon.addEventListener('click', toggleTips);
}

function setupCredits() {
  const creditsBtn = document.getElementById('credits-icon');
  
  if (creditsBtn && modals.credits) {
    creditsBtn.addEventListener('click', () => {
      // Pass controls so it disables OrbitControls while the modal is open
      showModal(modals.credits, controls); 
    });
  }
}

// Initialize Music Player
const musicPlayer = new EmbedPlayer();

function setupNavigation() {
    const backBtn = document.getElementById('back-to-landing');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            returnToLanding();
        });
    }
}

// initialize objects
setupNavigation();
setupTipsToggle();
setupCredits();

// --- TIME SETUP ---
const clock = new THREE.Clock();

// Render Loop
const render = () =>{
  // Calculate Delta Time (in seconds) and Elapsed Time
  const deltaTimeSeconds = clock.getDelta();
  const elapsedTime = clock.getElapsedTime();
  
  // Update controls
  controls.update();

  // update computer for interactions
  // Pass milliseconds (seconds * 1000) because TetrisApp uses 1000ms intervals
  computer.update(deltaTimeSeconds * 1000);

  // Updates object hover state
  updateObjectHover();
  
  animateSceneObjects(elapsedTime, fans, interactSign, chairSeat)

  // Do rendering
  renderer.render(scene, camera);
  window.requestAnimationFrame(render);
}

render();

/*
  Used to get camera starting camera position
  Put in render loop to use

  console.log(
    `Position: ${camera.position.x}, ${camera.position.y}, ${camera.position.z} | ` +
    `Rotation: ${camera.rotation.x}, ${camera.rotation.y}, ${camera.rotation.z} | ` +
    `Target: ${controls.target.x}, ${controls.target.y}, ${controls.target.z}`
  );
  */
