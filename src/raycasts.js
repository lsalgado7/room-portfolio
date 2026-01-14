// raycasts.js
import * as THREE from 'three';

export const raycaster = new THREE.Raycaster();
export const pointer = new THREE.Vector2();

export function setupRaycasterEvents(camera, isModalOpen) {
  window.addEventListener("mousemove", (e)=>{
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = - (e.clientY / window.innerHeight) * 2 + 1;
  });

  window.addEventListener("touchstart", (e) =>{
    // get first finger touch
    if (isModalOpen) return;
    e.preventDefault();
    pointer.x = (e.touches[0].clientX / window.innerWidth) * 2 - 1;
    pointer.y = - (e.touches[0].clientY / window.innerHeight) * 2 + 1;
  }, { passive:false });
}