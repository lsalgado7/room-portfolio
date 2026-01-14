// materials.js
import * as THREE from 'three';
import { environmentMap } from './loaders.js';

export const glassMaterial = new THREE.MeshPhysicalMaterial({
  color: 0xb5b5b5,
  transmission: 1,
  opacity: 1,
  metalness: 0,
  roughness: 0,
  ior: 1.5,
  thickness: 0.01,
  specularIntensity: 1,
  envMap: environmentMap,
  specularColor: 0xb5b5b5,
  envMapIntensity: 1
});

export function createVideoMaterial() {
  const videoElement = document.createElement("video");
  videoElement.src = "/textures/video/Screen.mp4"
  videoElement.loop = true;
  videoElement.muted = true;
  videoElement.playsInline = true;
  videoElement.autoplay = true;
  videoElement.play()

  const videoTexture = new THREE.VideoTexture(videoElement)
  videoTexture.colorSpace = THREE.SRGBColorSpace
  videoTexture.flipY = false;

  return new THREE.MeshBasicMaterial({
    map: videoTexture,
  });
}