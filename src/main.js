import './style.scss'
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import gsap from "gsap"

const canvas = document.querySelector("#experience-canvas");
const sizes ={
  height: window.innerHeight,
  width: window.innerWidth
}

// ---- CREATING POP UP WINDOWS ----
const modals = {
  work: document.querySelector(".modal.work"),
  about: document.querySelector(".modal.about"),
  contact: document.querySelector(".modal.contact")
}

document.querySelectorAll(".modal-exit-button").forEach(button=> {
  button.addEventListener("click", (e) => {
    const modal = e.target.closest(".modal");
    hideModal(modal);
  })
})

const showModal = (modal) => {
  modal.style.display = "block"

  gsap.set(modal, {opacity: 0});

  gsap.to(modal, {
    opacity: 1,
    duration: 0.5,
  });
}

const hideModal = (modal) => {
  gsap.to(modal, {
    opacity:0,
    duration: 0.5,
    onComplete: ()=> {
      modal.style.display = "none";
    }
  });
}

const fans = [];

const raycasterObjects = [];
let currentIntersects = []

const socialLinks = {
  "github" : "https://github.com/lsalgado7",
  "linkedin" : "https://www.linkedin.com/in/lsalgado7/"
}

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

const scene = new THREE.Scene();

// Loaders
const textureLoader = new THREE.TextureLoader();

// Model Loader
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('/draco/');

const loader = new GLTFLoader();
loader.setDRACOLoader(dracoLoader);

const environmentMap = new THREE.CubeTextureLoader()
  .setPath('textures/skybox/')
  .load( [
    'px.webp',
    'nx.webp',
    'py.webp',
    'ny.webp',
    'pz.webp',
    'nz.webp',
  ])

const textureMap = {
  First:"/textures/room/TS_one.webp",
  Second:"/textures/room/TS_two.webp",
  Third:"/textures/room/TS_three.webp",
  Fourth:"/textures/room/TS_four.webp",
  Fifth:"/textures/room/TS_five.webp",
  Sixth:"/textures/room/TS_six.webp",
  one:"/textures/room/TS_one.webp",
  two:"/textures/room/TS_two.webp",
  three:"/textures/room/TS_three.webp",
  four:"/textures/room/TS_four.webp",
  five:"/textures/room/TS_five.webp",
  six:"/textures/room/TS_six.webp"
};

const loadedTextures = {};

Object.entries(textureMap).forEach(([key, paths]) => {
  const texture = textureLoader.load(paths)
  texture.flipY = false;
  texture.colorSpace = THREE.SRGBColorSpace;
  loadedTextures[key] = texture;
})

const glassMaterial = new THREE.MeshPhysicalMaterial({
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
})

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

const screenMaterial = new THREE.MeshBasicMaterial({
  map: videoTexture,
});

window.addEventListener("mousemove", (e)=>{
  pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
  pointer.y = - (e.clientY / window.innerHeight) * 2 + 1;
});

window.addEventListener("click", (e) =>{
  if(currentIntersects.length>0) {
    const object = currentIntersects[0].object;

    Object.entries(socialLinks).forEach(([key, url]) =>{
      if (object.name.includes(key)) {
        const newWindow = window.open();
        newWindow.opener = null;
        newWindow.location = url;
        newWindow.target = "_blank";
        newWindow.rel = "noopener noreferrer";
      }
    });

    if (object.name.includes('click_work')) {
      showModal(modals.work);
    } else if (object.name.includes('click_about')) {
      showModal(modals.about);
    } else if (object.name.includes('click_contact')) {
      showModal(modals.contact);
    }
  }
});

const notClickable = ['key', 'fan', 'glass', 'First',
  'Second', 'Third', 'Fourth', 'Fifth', 'Sixth',
  'screen', 'mouse', 'monitor', 'chair'
]

loader.load("/models/Room_Portfolio.glb", (glb)=>{
  glb.scene.traverse(child=>{
    if(child.isMesh){

      if (child.name.includes('click_desktop')) {
        child.material.visible = false;
      }

      if(!notClickable.some(name => child.name.includes(name))) {
        raycasterObjects.push(child);
      }

      if(child.name.includes("glass")){
        child.material = glassMaterial;
      } else if (child.name.includes("screen")){
        child.material = screenMaterial;

        const uvs = child.geometry.attributes.uv;
        let minU = Infinity, minV = Infinity, maxU = -Infinity, maxV = -Infinity;

        // 1. Find the current range of the UVs
        for (let i = 0; i < uvs.count; i++) {
          const u = uvs.getX(i);
          const v = uvs.getY(i);
          if (u < minU) minU = u;
          if (v < minV) minV = v;
          if (u > maxU) maxU = u;
          if (v > maxV) maxV = v;
        }

        // 2. Normalize the UVs (stretch them to 0-1)
        for (let i = 0; i < uvs.count; i++) {
          const u = uvs.getX(i);
          const v = uvs.getY(i);
              
          // Calculate normalized 0-1 values
          const normalizedU = (u - minU) / (maxU - minU);
          const normalizedV = (v - minV) / (maxV - minV);
              
          // Swap X and Y to rotate 90 degrees. 
          // We use (1 - normalizedU) to fix the orientation direction.
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

const camera = new THREE.PerspectiveCamera(
  35,
  sizes.width / sizes.height,
  0.1,
  1000
);
camera.position.set(14.546610594521159, 10.11721024371067, -14.476390073543648);

const renderer = new THREE.WebGLRenderer({canvas:canvas, antialias: true });
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.update();
controls.target.set(0.5127399372523783, 4.046808560932034, -0.1731077747794347);

// Event Listeners
window.addEventListener("resize", ()=>{
  sizes.width = window.innerWidth

  sizes.height = window.innerHeight

  // Update Camera
  camera.aspect = sizes.width / sizes.height
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

const render = () =>{
  controls.update();
  
  fans.forEach(fan=>{
    fan.rotation.y += 0.05
  })

  // Raycaster
  raycaster.setFromCamera(pointer, camera);
  
  // calculate objects intersecting the picking ray
  currentIntersects = raycaster.intersectObjects(raycasterObjects);

  for (let i=0; i < currentIntersects.length; i++){

  }

  if(currentIntersects.length>0){
    const currentIntersectObject = currentIntersects[0].object

    if(currentIntersectObject.name.includes("click")) {
      document.body.style.cursor = "pointer"
    } else{
      document.body.style.cursor = "default"
    }
  } else{
    document.body.style.cursor = "default"
  }
  
  renderer.render(scene, camera);

  window.requestAnimationFrame(render);
}

render();