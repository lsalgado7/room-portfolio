// main.js
import './style.scss'
import * as THREE from 'three';
import { OrbitControls } from './utils/orbit-controls.js';
import { initLoadingScreen } from './loading-screen.js';

// Imported Modules
import { socialLinks, textureMap, notClickable, hoverItems } from './mappings.js';
import { modals, initModalEvents, showModal } from './modals.js';
import { playClickAnimation, playHoverAnimation } from './animations.js';
import { gltfLoader, loadedTextures } from './loaders.js';
import { glassMaterial, createVideoMaterial } from './materials.js';
import { raycaster, pointer, setupRaycasterEvents } from './raycasts.js';

const canvas = document.querySelector("#experience-canvas");
const sizes = {
  height: window.innerHeight,
  width: window.innerWidth
}

initLoadingScreen();

// Scene Setup
const scene = new THREE.Scene();
const screenMaterial = createVideoMaterial();
const fans = [];
const raycasterObjects = [];

// State variables for interaction
let currentIntersects = []
let currentHoveredObject = null;

// Camera
const camera = new THREE.PerspectiveCamera(
  35,
  sizes.width / sizes.height,
  0.1,
  1000
);
camera.position.set(14.546610594521159, 10.11721024371067, -14.476390073543648);

// Renderer
const renderer = new THREE.WebGLRenderer({canvas:canvas, antialias: true });
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// Controls
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

let isModalOpen = false;
// Init DOM events
setupRaycasterEvents(isModalOpen);
initModalEvents(controls);

// Raycaster Interaction Logic
function handleRaycasterInteraction() {
  if (event.target !== canvas) return;

  if(currentIntersects.length > 0) {
    const object = currentIntersects[0].object;

    // if clicked social link, take user to link
    Object.entries(socialLinks).forEach(([key, url]) =>{
      if (object.name.includes(key)) {
        const newWindow = window.open();
        newWindow.opener = null;
        newWindow.location = url;
        newWindow.target = "_blank";
        newWindow.rel = "noopener noreferrer";
      }
    });

    // if clicked modal button, display modal
    if (object.name.includes('click_work')) {
      isModalOpen = true;
      showModal(modals.work, controls);
    } else if (object.name.includes('click_about')) {
      isModalOpen = true;
      showModal(modals.about, controls);
    } else if (object.name.includes('click_contact')) {
      isModalOpen = true;
      showModal(modals.contact, controls);
    }

    // if clicked animatable object, animate
    if(!notClickable.some(name => object.name.includes(name)) &&
    !hoverItems.some(name => object.name.includes(name))) {
      playClickAnimation(object);
    }
  }
}

// Interaction Listeners
window.addEventListener("touchend", (e) =>{
  e.preventDefault();
  handleRaycasterInteraction(e);
}, { passive:false });

window.addEventListener("click", handleRaycasterInteraction);

// Load 3D Model
gltfLoader.load("/models/Room_Portfolio.glb", (glb)=>{
  glb.scene.traverse(child => {
    if(child.isMesh){
      // make desktop hitbox invisible
      if (child.name.includes('click_desktop')) {
        child.material.visible = false;
      }
      
      // get interactable objects
      if(!notClickable.some(name => child.name.includes(name))) {
        raycasterObjects.push(child);
        child.userData.initialScale = new THREE.Vector3().copy(child.scale);
        child.userData.initialPosition = new THREE.Vector3().copy(child.position);
        child.userData.initialRotation = new THREE.Euler().copy(child.rotation);
      }

      // assign glass/screen materials
      if(child.name.includes("glass")){
        child.material = glassMaterial;
      } else if (child.name.includes("screen")){
        child.material = screenMaterial;

        // UV Fix Logic for computer screen
        const uvs = child.geometry.attributes.uv;
        let minU = Infinity, minV = Infinity, maxU = -Infinity, maxV = -Infinity;

        for (let i = 0; i < uvs.count; i++) {
          const u = uvs.getX(i);
          const v = uvs.getY(i);
          if (u < minU) minU = u;
          if (v < minV) minV = v;
          if (u > maxU) maxU = u;
          if (v > maxV) maxV = v;
        }

        for (let i = 0; i < uvs.count; i++) {
          const u = uvs.getX(i);
          const v = uvs.getY(i);
          const normalizedU = (u - minU) / (maxU - minU);
          const normalizedV = (v - minV) / (maxV - minV);
          uvs.setXY(i, normalizedV, normalizedU);
        }
        
        uvs.needsUpdate = true;

      } else {
        Object.keys(textureMap).forEach(key=>{
          if(child.name.includes(key)){
            const material = new THREE.MeshBasicMaterial({
              map: loadedTextures[key],
            });
            child.material = material;

            if(child.name.includes('fan')){
              fans.push(child);
            }

            if(child.material.map){
              child.material.map.minFilter = THREE.LinearFilter;
            }
          }
        });
      }
    }
  });
  scene.add(glb.scene);
});

// Resize
window.addEventListener("resize", ()=>{
  sizes.width = window.innerWidth
  sizes.height = window.innerHeight

  camera.aspect = sizes.width / sizes.height
  camera.updateProjectionMatrix();

  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// Render Loop
const render = () =>{
  controls.update();
  
  fans.forEach(fan => {
    fan.rotation.y += 0.05
  })

  // Raycaster
  raycaster.setFromCamera(pointer, camera);
  currentIntersects = raycaster.intersectObjects(raycasterObjects);

  // check if mouse is over a valid object
  if(currentIntersects.length > 0){
    const currentIntersectObject = currentIntersects[0].object

    // if a clickable, do hover animation things
    if(currentIntersectObject.name.includes("click")) {
      if (currentIntersectObject !== currentHoveredObject) {
        if (currentHoveredObject) {
          playHoverAnimation(currentHoveredObject, false);
        }
        playHoverAnimation(currentIntersectObject, true);
        currentHoveredObject = currentIntersectObject;
      }
      document.body.style.cursor = "pointer"
    } else{
      document.body.style.cursor = "default"
    }
  } else{
    if (currentHoveredObject) {
      playHoverAnimation(currentHoveredObject, false);
    }
    currentHoveredObject = null;
    document.body.style.cursor = "default"
  }
  
  renderer.render(scene, camera);
  window.requestAnimationFrame(render);
}

render();
