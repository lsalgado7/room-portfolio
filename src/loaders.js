// loaders.js
import * as THREE from 'three';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { textureMap } from './mappings.js';

export const manager = new THREE.LoadingManager();
export const textureLoader = new THREE.TextureLoader();

// Model Loader Setup
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('/draco/');

export const gltfLoader = new GLTFLoader(manager);
gltfLoader.setDRACOLoader(dracoLoader);

// Environment Map
export const environmentMap = new THREE.CubeTextureLoader(manager)
  .setPath('textures/skybox/')
  .load([
    'px.webp', 'nx.webp', 'py.webp', 
    'ny.webp', 'pz.webp', 'nz.webp',
  ]);

// Load and process all textures from the map
export const loadedTextures = {};

Object.entries(textureMap).forEach(([key, paths]) => {
  const texture = textureLoader.load(paths)
  texture.flipY = false;
  texture.colorSpace = THREE.SRGBColorSpace;

  texture.minFilter = THREE.LinearFilter; 
  texture.generateMipmaps = false;

  loadedTextures[key] = texture;
});