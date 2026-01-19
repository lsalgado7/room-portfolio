// main.js
import './style.scss'
import * as THREE from 'three';
import { OrbitControls } from './utils/orbit-controls.js';
import { initLoadingScreen, returnToLanding } from './landing-page.js';

// Imported Modules
import { initModalEvents, isModalActive } from './modals.js';
import { loadRoomScene, fans} from './loaders.js';
import { raycaster, pointer, setupRaycasterEvents, updateObjectHover } from './raycasts.js';

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
    tipsBox.classList.toggle('hidden');
  };

  // Keyboard 'H' Toggle
  window.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'h') toggleTips();
  });

  // Help Icon Click
  helpIcon.addEventListener('click', toggleTips);
}

function setupNavigation() {
    const backBtn = document.getElementById('back-to-landing');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            returnToLanding();
        });
    }
}

// Call this alongside your other setup functions
setupNavigation();

// Call this in your main initialization
setupTipsToggle();

// Render Loop
const render = () =>{
  // Update controls
  controls.update();

  // Updates object hover state
  updateObjectHover();
  
  fans.forEach(fan => {
    fan.rotation.y += 0.05
  })

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
