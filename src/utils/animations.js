// animations.js
import gsap from "gsap";
import * as THREE from 'three';

// used by clickable animations
export function playClickAnimation(object) {
    // 1. Kill existing tweens (interrupts hover animations)
    gsap.killTweensOf(object.scale);

    // 2. Define our recoil and return scales
    const recoilScale = new THREE.Vector3(0.95, 0.95, 0.95);
    const hoverScale = new THREE.Vector3(1.05, 1.05, 1.05); // Matches generic hover below

    // 3. Create a timeline to sequence the steps
    const tl = gsap.timeline();

    // Shrink down (recoil)
    tl.to(object.scale, {
        x: object.userData.initialScale.x * recoilScale.x,
        y: object.userData.initialScale.y * recoilScale.y,
        z: object.userData.initialScale.z * recoilScale.z,
        duration: 0.1, 
        ease: "power2.out"
    })
    // Snap back up to the hover scale
    .to(object.scale, {
        x: object.userData.initialScale.x * hoverScale.x,
        y: object.userData.initialScale.y * hoverScale.y,
        z: object.userData.initialScale.z * hoverScale.z,
        duration: 0.2, 
        ease: "back.out(1.5)"
    });
}

// used by hoverable interactions
export function playHoverAnimation(object, isHovering) {
  const signObjs = ['work', 'about', 'contact'];
  const isSign = signObjs.some(name => object.name.includes(name));

  // Set the target scale based on whether it is a sign or a standard clickable object
  const scaleVal = isSign 
      ? new THREE.Vector3(1.35, 1.35, 1.35) 
      : new THREE.Vector3(1.05, 1.05, 1.05);

  // reset animations if interupted
  gsap.killTweensOf(object.scale);
  
  let rotationVal = 0;

  if (isSign) {
    gsap.killTweensOf(object.rotation);
    gsap.killTweensOf(object.position);

    if (object.name.includes('about')) {
        rotationVal = -Math.PI/32;
    } else {
        rotationVal = Math.PI/32;
    }
  }

  if (isHovering) {
    // Scale up
    gsap.to(object.scale, {
      x: object.userData.initialScale.x * scaleVal.x,
      y: object.userData.initialScale.y * scaleVal.y,
      z: object.userData.initialScale.z * scaleVal.z,
      duration: 0.5,
      ease: "back.out(1.8)"
    });

    // Only apply rotation to the explicit sign objects
    if (isSign) {
        gsap.to(object.rotation, {
          y: object.userData.initialRotation.y + rotationVal,
          duration: 0.2,
          ease: "back.out(1.8)"
        });
    }
  } else {
    // Return to default resting scale
    gsap.to(object.scale, {
      x: object.userData.initialScale.x,
      y: object.userData.initialScale.y,
      z: object.userData.initialScale.z,
      duration: 0.3,
      ease: "expo.in(1.8)"
    });

    if (isSign) {
        gsap.to(object.rotation, {
          y: object.userData.initialRotation.y,
          duration: 0.2,
          ease: "expo.in(1.8)"
        });
    }
  }
}

export const showModalAnimation = (modal) => {
  modal.style.display = "block";
  gsap.set(modal, { opacity: 0 });
  gsap.to(modal, {
    opacity: 1,
    duration: 0.5,
  });
};

export const hideModalAnimation = (modal) => {
  gsap.to(modal, {
    opacity: 0,
    duration: 0.2,
    onComplete: () => {
      modal.style.display = "none";
      if (typeof onCompleteCallback == 'function') onCompleteCallback();
    }
  });
};

export function animateSceneObjects(elapsedTime, fans, interactSign, chairSeat) {
  // Animations
  fans.forEach(fan => {
    fan.rotation.y += 0.05
  });
  
  if (interactSign && interactSign.visible) {
    interactSign.position.y += Math.sin(Date.now() / 500) * 0.001; 
  }

  // Add the chair swivel animation
  if (chairSeat) {
    // Math.sin(elapsedTime * speed) * amplitude
    // Adjust 1.0 (speed) and 0.25 (rotation amount)
    chairSeat.rotation.y = chairSeat.userData.baseRotationY + Math.sin(elapsedTime * 0.8) * 0.2;
  }
}