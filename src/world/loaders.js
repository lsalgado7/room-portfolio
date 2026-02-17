// loaders.js
import * as THREE from 'three';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
// Go up to config
import { textureMap, notClickable } from '../config/mappings.js';
// Sibling file in same folder
import { createVideoMaterial, initMaterials, glassMaterial } from './materials.js';
// Go up to main
import { raycasterObjects } from '../main.js';

export const manager = new THREE.LoadingManager();
const textureLoader = new THREE.TextureLoader();

// Model Loader Setup
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('/draco/');

const gltfLoader = new GLTFLoader(manager);
gltfLoader.setDRACOLoader(dracoLoader);

const loadedTextures = {};
export const fans = [];
export let screenMesh = null;
export let interactSign = null;

// Load and process all textures from the map
// EX: If obj has 'one' in the name, load its texture from TS_one
Object.entries(textureMap).forEach(([key, paths]) => {
  const texture = textureLoader.load(paths)
  texture.flipY = false;
  texture.colorSpace = THREE.SRGBColorSpace;

  texture.minFilter = THREE.LinearFilter; 
  texture.generateMipmaps = false;

  loadedTextures[key] = texture;
});

// New function to handle the room loading logic
export const loadRoomScene = (scene) => {
  initMaterials(manager);
  const screenMaterial = createVideoMaterial();

  // load in the glb room scene, and for each individual model in scene, do things
  gltfLoader.load("/models/Room_Portfolio.glb", (glb) => {
    glb.scene.traverse(child => {
      if (child.isMesh) {
        // make the desktop hitbox invisible and setup sign
        if (child.name.includes('click_desktop')) {
          child.material.visible = false;

          interactSign = createInteractLabel(child.position);
          scene.add(interactSign);
        }

        // get interactable objects, save them to a list & save initial spacial data
        if (!notClickable.some(name => child.name.includes(name))) {
          raycasterObjects.push(child);
          child.userData.initialScale = new THREE.Vector3().copy(child.scale);
          child.userData.initialPosition = new THREE.Vector3().copy(child.position);
          child.userData.initialRotation = new THREE.Euler().copy(child.rotation);
        }

        // assign glass/screen materials to appropriate models
        if (child.name.includes("glass")) {
          child.material = glassMaterial;
        } else if (child.name.includes("screen")) {
          screenMesh = child;
          child.material = screenMaterial;
          setupScreenUVs(child);
        } else {
          applyTextures(child);
        }
      }
    });
    scene.add(glb.scene);
  });
};

// Helper functions to keep traverse clean

// Fix the UV for the screen via code (DO THIS IN BLENDER LATER TO REMOVE THIS CODEBLOCK)
function setupScreenUVs(child) {
  const uvs = child.geometry.attributes.uv;
  let minU = Infinity, minV = Infinity, maxU = -Infinity, maxV = -Infinity;
  for (let i = 0; i < uvs.count; i++) {
    const u = uvs.getX(i); const v = uvs.getY(i);
    minU = Math.min(minU, u); minV = Math.min(minV, v);
    maxU = Math.max(maxU, u); maxV = Math.max(maxV, v);
  }
  for (let i = 0; i < uvs.count; i++) {
    const u = uvs.getX(i); const v = uvs.getY(i);
    uvs.setXY(i, (v - minV) / (maxV - minV), (u - minU) / (maxU - minU));
  }
  uvs.needsUpdate = true;
}

// this function is called by loadRoomScene for each model in our scene
function applyTextures(child) {
  Object.keys(textureMap).forEach(key => {
    // add materials to each object based off the texture map
    if (child.name.includes(key)) {
      child.material = new THREE.MeshBasicMaterial({ map: loadedTextures[key] });
      // make a list of fan objects to animate later
      if (child.name.includes('fan')) fans.push(child);
    }
  });
}

// Helper function to create the texture and sprite for interact sign
function createInteractLabel(position) {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.width = 512;
  canvas.height = 256;

  // 1. Draw Background (Rounded Rect style)
  context.fillStyle = 'rgba(0, 0, 0, 0.3)'; // Semi-transparent black
  context.beginPath();
  context.roundRect(10, 10, 492, 236, 40); // Requires modern browser, or use fillRect
  context.fill();

  // 2. Draw Border
  context.strokeStyle = 'rgba(255, 255, 255, 0.8)';
  context.lineWidth = 8;
  context.stroke();

  // 3. Draw Text
  context.font = 'bold 80px Arial';
  context.fillStyle = 'white';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText('Interact', 256, 128);

  // 4. Create Sprite
  const texture = new THREE.CanvasTexture(canvas);
  // minFilter Linear fixes text shimmering
  texture.minFilter = THREE.LinearFilter; 
  
  const material = new THREE.SpriteMaterial({ 
    map: texture, 
    transparent: true,
    depthTest: false, // Optional: makes it visible through objects if you want
    depthWrite: false
  });
  
  const sprite = new THREE.Sprite(material);
  // Copy position of the desktop hitbox
  sprite.position.copy(position);
  // Reposition it
  sprite.position.x += 1;
  sprite.position.z -= 1.35; 
  // Scale it (aspect ratio of canvas is 2:1)
  sprite.scale.set(1.5, 0.75, 1); 

  return sprite;
}