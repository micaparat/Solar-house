import * as THREE from "https://cdn.skypack.dev/three@0.133/build/three.module.js";

import { FontLoader } from "https://cdn.skypack.dev/three@0.133/examples/jsm/loaders/FontLoader.js";

import { TextGeometry } from "https://cdn.skypack.dev/three@0.133/examples/jsm/geometries/TextGeometry.js";

import { OrbitControls } from "https://cdn.skypack.dev/three@0.133/examples/jsm/controls/OrbitControls.js";

import { GLTFLoader } from "https://cdn.skypack.dev/three@0.133/examples/jsm/loaders/GLTFLoader.js";

let mobile = false;

var indoorLightIntensity = 0;

let animationSpeed = 0.01;

let calcMouseX = 0;
let calcMouseY = 0;

let targetX = 0;
let targetY = 0;

let windowHalfX = window.innerWidth / 2;
let windowHalfY = window.innerHeight / 2;

// Create a scene
const scene = new THREE.Scene();

// Create a camera
const camera = new THREE.PerspectiveCamera(24, 1, 0.1, 2000); // Aspect ratio set to 1 for initial setup

// Position the camera

camera.position.set(0, 3, 12);

const orbitGroup = new THREE.Group();
orbitGroup.position.set(-2.5, 39.5, 7.5);
scene.add(orbitGroup);
orbitGroup.add(camera);

// Create a renderer and set its size
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.shadowMap.enabled = true;
// renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Optional: Softens the shadow edges

// const controls = new OrbitControls(camera, renderer.domElement); //CONTROLS

const container = document.getElementById("canvas-container");
renderer.setSize(container.clientWidth, container.clientHeight);
container.appendChild(renderer.domElement);

// Adjust renderer size when the window is resized
window.addEventListener("resize", () => {
  renderer.setSize(container.clientWidth, container.clientHeight);
  camera.aspect = container.clientWidth / container.clientHeight;
  windowHalfX = window.innerWidth / 2;
  windowHalfY = window.innerHeight / 2;
  camera.updateProjectionMatrix();
});

//Resize on load
onLoad();

// GEOMETRY

const groundSphereGeo = new THREE.SphereGeometry(40, 32, 128);
const shadowBoxGeo = new THREE.BoxGeometry(60, 2, 60);
const houseCubeGeo = new THREE.BoxGeometry(1, 1, 1);
const skyPlaneGeo = new THREE.PlaneGeometry(150, 350); // Adjust the size as needed
const starsPlaneGeo = new THREE.PlaneGeometry(200, 200);
const houseGroup = new THREE.Group();

var gltfScene;
const gltfLoader = new GLTFLoader();
gltfLoader.load(
  "./solar-house.glb",
  function (gltf) {
    gltfScene = gltf.scene;
    // console.log("loaded");
    gltf.scene.traverse(function (node) {
      if (node.isMesh) {
        node.castShadow = true;
        node.receiveShadow = true;
        // // console.log("shadows work");
        // node.material.castShadow = true;
        // node.material.receiveShadow = true;
      } else if (node.isLight) {
        // Enable shadows for lights
        node.castShadow = true;
        node.shadow.bias = -0.005;
        node.decay = 5;
        node.distance = 3.5;
      }
    });

    houseGroup.add(gltfScene);
    houseGroup.scale.set(0.2, 0.2, 0.2);
    houseGroup.position.set(0, 32, 2);

    scene.add(houseGroup);
  },
  // called while loading is progressing
  function (xhr) {
    console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
  },
  // called when loading has errors
  function (error) {
    console.log("An error happened");
  }
);

// MATERIALS

const textureLoader = new THREE.TextureLoader();

const whiteMat = new THREE.MeshPhysicalMaterial({
  color: 0xffffff,
  roughness: 1,
  metalness: 0,
  dithering: true,
});

function createVerticalGradientTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 2048; // Adjust the height as needed for the gradient resolution
  const ctx = canvas.getContext("2d");

  // Create a vertical gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "rgba(0,3,11,1)"); // Start color (adjust as needed)
  gradient.addColorStop(0.37, "rgba(5,35,57,1)"); // 37% color (adjust as needed)
  gradient.addColorStop(0.58, "rgba(227,89,122,1)"); // 58% color (adjust as needed)
  gradient.addColorStop(0.75, "rgba(185,243,255,1)"); // 75% color (adjust as needed)
  gradient.addColorStop(1, "rgba(103,203,255,1)"); // End color (adjust as needed)

  // Fill the canvas with the gradient
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  return canvas;
}

// Create the gradient texture
const gradientTexture = new THREE.CanvasTexture(
  createVerticalGradientTexture()
);

// const starsTexture = textureLoader.load("stars-texture.jpg"); // Replace 'path_to_your_image.jpg' with your image path
// const starsMaterial = new THREE.MeshBasicMaterial({
//   map: starsTexture,
//   side: THREE.DoubleSide,
//   transparent: true,
// });

const skyPlaneMaterial = new THREE.MeshBasicMaterial({ map: gradientTexture });

const sphere = new THREE.Mesh(groundSphereGeo, whiteMat);
const shadowBox = new THREE.Mesh(shadowBoxGeo, whiteMat);
sphere.castShadow = true; // Enable shadow reception
sphere.receiveShadow = true; // Enable shadow reception
shadowBox.castShadow = true; // Enable shadow reception
shadowBox.position.set(-40, 30, 0);

const house = new THREE.Mesh(houseCubeGeo, whiteMat);
house.position.set(-2.5, 39.5, 7.5);
house.castShadow = true; // Enable shadow  casting

const skyPlane = new THREE.Mesh(skyPlaneGeo, skyPlaneMaterial);
skyPlane.position.set(0, 137.5, -67);
// skyPlane.rotation.y = Math.PI;

// const starsPlaneMesh = new THREE.Mesh(starsPlaneGeo, starsMaterial);
// starsPlaneMesh.position.set(48, 17, -61);

scene.add(sphere, shadowBox, skyPlane);
// scene.add(skyPlane);

// LIGHTS

var sunIntensity = 1;
var moonIntensity = 1;
var skyIntensity = 1;

// HOUSE LIGHTS

// AMBIENT

const skyLight = new THREE.AmbientLight(0x70e2ff, skyIntensity); // soft white light

// SUN

const sunObject = new THREE.DirectionalLight(0xffffff, sunIntensity);
sunObject.castShadow = true; // Enable shadow casting
sunObject.position.set(-50, 40, 35);
sunObject.shadow.mapSize.width = 2048;
sunObject.shadow.mapSize.height = 2048;
sunObject.shadow.camera.near = 0.5;
sunObject.shadow.camera.far = 100;
sunObject.shadow.camera.left = -10;
sunObject.shadow.camera.right = 10;
sunObject.shadow.camera.top = -10;
sunObject.shadow.camera.bottom = 50;
sunObject.shadow.bias = -0.005;

// MOON

const moonObject = new THREE.DirectionalLight(0x5d85c9, moonIntensity);
moonObject.castShadow = true; // Enable shadow casting
moonObject.position.x = 25;
moonObject.position.y = 40;
moonObject.position.z = 28;
moonObject.shadow.mapSize.width = 2048;
moonObject.shadow.mapSize.height = 2048;
moonObject.shadow.camera.near = 0.5;
moonObject.shadow.camera.far = 100;
moonObject.shadow.camera.left = -10;
moonObject.shadow.camera.right = 10;
moonObject.shadow.camera.top = -10;
moonObject.shadow.camera.bottom = 30;

sunObject.target = houseGroup;
moonObject.target = houseGroup;

const sunHelper = new THREE.CameraHelper(sunObject.shadow.camera);
const moonHelper = new THREE.CameraHelper(moonObject.shadow.camera);

// scene.add(sunHelper);
// scene.add(moonHelper);
scene.add(skyLight, sunObject, moonObject);

function onLoad() {
  renderer.setSize(container.clientWidth, container.clientHeight);
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
}

//Capture cursor location
document.addEventListener("mousemove", onDocumentMouseMove);

function onDocumentMouseMove(event) {
  let rawMouseX = event.clientX - windowHalfX;
  let rawMouseY = event.clientY - windowHalfY;

  // Normalize mouse positions
  calcMouseX = (rawMouseX / windowHalfX) * 50 + 50; // Map to the range 0-100
  calcMouseY = -(rawMouseY / windowHalfY) * 50 + 50; // Map to the range 0-100
}

// Function to map values
function mapRange(value, fromLow, fromHigh, toLow, toHigh) {
  return toLow + ((value - fromLow) * (toHigh - toLow)) / (fromHigh - fromLow);
}

function createPointLight(scene, x, y, z, intensity, color) {
  const pointLight = new THREE.PointLight(color, intensity);
  pointLight.position.set(x, y, z);

  scene.add(pointLight);

  return pointLight;
}

function dayCycle(mousepos) {
  if (sunObject && moonObject) {
    sunObject.position.y +=
      animationSpeed * (mousepos - 20 - sunObject.position.y);
    sunObject.intensity +=
      animationSpeed * (mousepos / 100 - sunObject.intensity);

    moonObject.position.y +=
      animationSpeed * (-mousepos + 70 - moonObject.position.y);
    moonObject.intensity +=
      animationSpeed * (-mousepos / 100 + 0.5 - moonObject.intensity);

    skyLight.intensity +=
      animationSpeed * (mousepos / 150 - skyLight.intensity);

    const skyPosNormalizedValue = mapRange(mousepos, 0.2, 100, -110, 185);
    skyPlane.position.y +=
      animationSpeed * (skyPosNormalizedValue - skyPlane.position.y);

    // const starsPosNormalizedValue = mapRange(mousepos, 0.2, 100, 0.5, 0);
    // starsPlaneMesh.material.opacity +=
    //   animationSpeed *
    //   (starsPosNormalizedValue - starsPlaneMesh.material.opacity);

    // const starsRotNormalizedValue = mapRange(mousepos, 0.2, 100, 1.5, 0);
    // starsPlaneMesh.rotation.z +=
    //   animationSpeed * (starsRotNormalizedValue - starsPlaneMesh.rotation.z);

    // console.log(
    //   "moon intensity: ",
    //   moonObject.intensity,
    //   "moon position: ",
    //   moonObject.position.y,
    //   "sun intensity: ",
    //   sunObject.intensity,
    //   "sun position: ",
    //   sunObject.position.y,
    //   "skylight intensity: ",
    //   skyLight.intensity
    // );
    // console.log("skyplane position: ", skyPlane.position.y, mousepos);
    // console.log("stars opacity: ", starsPlaneMesh.material.opacity);
  }
}

// Create a function to animate the light's color using HSL
function animateSkyColor(light) {
  const maxY = 80; // Set the maximum Y value for the animation
  const minY = 30; // Set the minimum Y value for the animation

  // Calculate the normalized position of the light along the Y-axis using mapRange function
  const normalizedY = mapRange(light.position.y, minY, maxY, 0, 1);

  // Map the Y position to the desired values for hue and lightness
  const hueStart = 18 / 360; // Hue for orange (18/360)
  const hueEnd = 45 / 360; // Hue for yellow (45/360)
  const hue = hueStart + normalizedY * (hueEnd - hueStart); // Interpolate between hues

  const lightness = mapRange(normalizedY, 0, 1, 0.3, 0.7); // Map to lightness range from 0.5 to 1

  light.color.setHSL(hue, 1, lightness); // Set the HSL values to the sunlight color
  // console.log("lightness: ", lightness);
}

function animateInteriorLights(light) {
  const lights = [];

  gltfScene.traverse(function (node) {
    if (node.isLight) {
      lights.push(node);
    }
  });

  if (light.position.y < 13) {
    lights.forEach((light, index) => {
      setTimeout(() => {
        light.intensity = 1.6;
      }, getRandomNumber(600, 3200) * index);
    });
    // console.log("position under 13");
  } else {
    lights.forEach((light) => {
      light.intensity = 0;
    });
  }
  // console.log(light.position.y);
}

function getRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function orbitCamera(mouseposX, mouseposY) {
  const cameraXOrbitNormalizedValue = mapRange(mouseposX, 0.2, 100, 0.1, -0.3);
  orbitGroup.rotation.y +=
    (animationSpeed / 3) *
    (cameraXOrbitNormalizedValue - orbitGroup.rotation.y);
  const cameraYOrbitNormalizedValue = mapRange(
    mouseposY,
    0.2,
    100,
    0.03,
    -0.03
  );
  orbitGroup.rotation.x +=
    (animationSpeed / 3) *
    (cameraYOrbitNormalizedValue - orbitGroup.rotation.x);
}

// Render function
const animate = () => {
  requestAnimationFrame(animate);

  // Add your animations or interactions here, if any
  targetX = calcMouseX;
  targetY = calcMouseY;

  dayCycle(targetY);
  orbitCamera(targetX, targetY);
  animateSkyColor(sunObject);
  animateInteriorLights(sunObject);

  // Render the scene
  renderer.render(scene, camera);
};

animate();

// GUI

var gui = new dat.GUI({
  width: 360,
});

const cameraPositionFolder = gui.addFolder("Camera position");
cameraPositionFolder.add(camera.position, "x", -100, 100, 1);
cameraPositionFolder.add(camera.position, "y", -100, 100, 1);
cameraPositionFolder.add(camera.position, "z", -100, 100, 1);

const housePositionFolder = gui.addFolder("House position");
housePositionFolder.add(houseGroup.position, "x", -100, 100, 1);
housePositionFolder.add(houseGroup.position, "y", -100, 100, 1);
housePositionFolder.add(houseGroup.position, "z", -100, 100, 1);

cameraPositionFolder.open();
housePositionFolder.open();
