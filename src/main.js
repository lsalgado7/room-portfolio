import './style.scss'
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const canvas = document.querySelector("#experience-canvas");
const sizes ={
  height: window.innerHeight,
  width: window.innerWidth
}

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
})

loader.load("/models/Room_Portfolio.glb", (glb)=>{
  glb.scene.traverse(child=>{
    if(child.isMesh){
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
  
  console.log(camera.position);
  console.log("000000000");
  console.log(controls.target);

  renderer.render(scene, camera);

  window.requestAnimationFrame(render);
}

render();