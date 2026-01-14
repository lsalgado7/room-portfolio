// animations.js
import gsap from "gsap";
import * as THREE from 'three';

// used by clickable animations
export function playClickAnimation(object) {
  gsap.killTweensOf(object.scale);
    const scaleVal = new THREE.Vector3(1.4, 1.4, 1.4);

    gsap.to(object.scale, {
        x: object.userData.initialScale.x * scaleVal.x,
        y: object.userData.initialScale.y * scaleVal.y,
        z: object.userData.initialScale.z * scaleVal.z,
        duration: 0.3, 
        ease: "power1.out" // Makes the direction change smoother
    });
    gsap.to(object.scale, {
        x: object.userData.initialScale.x,
        y: object.userData.initialScale.y,
        z: object.userData.initialScale.z,
        duration: 0.3, 
        ease: "power2.in" // Makes the direction change smoother
    });
}

// used by hoverable interactions
export function playHoverAnimation(object, isHovering) {
    const signObjs = ['work', 'about', 'contact'];
    const scaleVal = new THREE.Vector3(1.35, 1.35, 1.35);
    // reset animations if interupted
  gsap.killTweensOf(object.scale);
  gsap.killTweensOf(object.rotation);
  gsap.killTweensOf(object.position);

  // check which object, then set scale/rotation values
  
  let rotationVal = 0;

  // do sign stuff
  
  if(signObjs.some(name => object.name.includes(name))) {
    if (object.name.includes('about')) {
        rotationVal = -Math.PI/32
    } else {
        rotationVal = Math.PI/32
    }
  }

  if(isHovering) {
    gsap.to(object.scale, {
      x: object.userData.initialScale.x * scaleVal.x,
      y: object.userData.initialScale.y * scaleVal.y,
      z: object.userData.initialScale.z * scaleVal.z,
      duration: 0.5,
      ease: "back.out(1.8)"
    });
    gsap.to(object.rotation, {
      y: object.userData.initialRotation.y + rotationVal,
      duration: 0.2,
      ease: "back.out(1.8)"
    });
  } else {
    gsap.to(object.scale, {
      x: object.userData.initialScale.x,
      y: object.userData.initialScale.y,
      z: object.userData.initialScale.z,
      duration: 0.3,
      ease: "expo.in(1.8)"
    });
    gsap.to(object.rotation, {
      y: object.userData.initialRotation.y,
      duration: 0.2,
      ease: "expo.in(1.8)"
    });
  }
}

let isModalOpen = false;

export const showModalAnimation = (modal, controls) => {
  modal.style.display = "block"
  // var for modal
  isModalOpen = true;
  if (controls) controls.enabled = false;


  gsap.set(modal, {opacity: 0});
  gsap.to(modal, {
    opacity: 1,
    duration: 0.5,
  });
}

export const hideModalAnimation = (modal, controls) => {
  gsap.to(modal, {
    opacity:0,
    duration: 0.5,
    onComplete: ()=> {
      modal.style.display = "none";
      isModalOpen = false;
      controls.enabled = true;
    }
  });
}