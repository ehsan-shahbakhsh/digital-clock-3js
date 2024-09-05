import * as THREE from "three";

import {TTFLoader} from "three/addons/loaders/TTFLoader.js";
import {Font} from "three/addons/loaders/FontLoader.js";
import {TextGeometry} from "three/addons/geometries/TextGeometry.js";

import Stats from "three/addons/libs/stats.module.js";
import GUI from "lil-gui";

let cameraTarget;
let textMesh1, textMesh2, textGeometry;
let firstLetter = true;

let text = getTime();
const depth = 20,
    size = 70,
    hover = 30,
    curveSegments = 4,
    bevelThickness = 2,
    bevelSize = 1.5;

let font = null;
let gui = null;
let debugMode = false;
const debugObject = {};
debugObject.mirror = true;
debugObject.color = new THREE.Color().setHSL(Math.random(), 1, 0.5, THREE.SRGBColorSpace);
if (window.location.hash && window.location.hash === '#debug') {
    debugMode = true;
}

let targetRotation = 0;
let targetRotationOnPointerDown = 0;

let pointerX = 0;
let pointerXOnPointerDown = 0;

let windowHalfX = window.innerWidth / 2;

// Stats
const stats = new Stats();
stats.setMode(0);
if (debugMode) {
    document.body.appendChild(stats.dom);
}

// Debug panel
if (debugMode) {
    gui = new GUI();

    gui.add(debugObject, 'mirror').onChange((value) => {
        debugObject.mirror = value;
        refreshText();
    });
    gui.addColor(debugObject, 'color').name('light color');
}

// Canvas
const canvas = document.querySelector('canvas.webgl');

// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);
scene.fog = new THREE.Fog(0x000000, 250, 1400);

/**
 * sizes
 * @type {{width: number, height: number}}
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight,
};
window.addEventListener('resize', () => {
    // Update sizes
    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight;

    // Update camera
    camera.aspect = sizes.width / sizes.height;
    camera.updateProjectionMatrix();

    // Update renderer
    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// Camera
const camera = new THREE.PerspectiveCamera(30, sizes.width / sizes.height, 1, 1500);
camera.position.set(0, 400, 700);

cameraTarget = new THREE.Vector3(0, 150, 0);

// Renderer
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
});

renderer.setPixelRatio(Math.min(window.devicePixelRatio));
renderer.setSize(sizes.width, sizes.height);
renderer.setAnimationLoop(animate);

// Loaders
const loader = new TTFLoader();
loader.load('/fonts/ttf/kenpixel.ttf', function (json) {
    font = new Font(json);
    createText();
});
const textureLoader = new THREE.TextureLoader();

/**
 * Textures
 */
const star = textureLoader.load('./particles/6.png');
star.colorSpace = THREE.SRGBColorSpace;

/**
 * Galaxy
 */
const count = 3000;
const positionsArray = new Float32Array(count * 3);

for (let i = 0; i < count; i++) {
    const i3 = i * 3;

    positionsArray[i3] = (Math.random() - 0.5) * 500;
    positionsArray[i3+1] = 1000 * Math.random() - 500;
    positionsArray[i3+2] = (Math.random() - 0.5) * 500;
}

const geometry = new THREE.BufferGeometry();
geometry.setAttribute('position', new THREE.Float32BufferAttribute(positionsArray, 3));

// Points
const points = new THREE.Points(
    geometry,
    new THREE.PointsMaterial({
        size: 5,
        map: star,
        alphaMap: star,
        transparent: true,
        sizeAttenuation: true,
        depthWrite: false,
        alphaTest: 0.5,
    }),
);
scene.add(points);

// Lights
const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.4);
dirLight1.position.set(0, 0, 1).normalize();
scene.add(dirLight1);

const dirLight2 = new THREE.DirectionalLight(0xffffff, 2);
dirLight2.position.set(0, hover, 10).normalize();
dirLight2.color = debugObject.color;
scene.add(dirLight2);

/**
 * Meshes
 */
const material = new THREE.MeshPhongMaterial({color: 0xffffff, flatShading: true});

const group = new THREE.Group();
group.position.y = 100;

scene.add(group);

const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(10000, 10000),
    new THREE.MeshBasicMaterial({color: 0xffffff, opacity: 0.5, transparent: true})
);
plane.position.y = 100;
plane.rotation.x = -Math.PI / 2;
scene.add(plane);

// Events
canvas.style.touchAction = 'none';
canvas.addEventListener('pointerdown', onPointerDown);
window.setInterval(() => {
    // Update time text
    text = getTime();
    refreshText();
}, 1000);

function createText() {
    textGeometry = new TextGeometry(text, {

        font: font,

        size: size,
        depth: depth,
        curveSegments: curveSegments,

        bevelThickness: bevelThickness,
        bevelSize: bevelSize,
        bevelEnabled: true
    });

    textGeometry.computeBoundingBox();
    textGeometry.computeVertexNormals();

    const centerOffset = -0.5 * (textGeometry.boundingBox.max.x - textGeometry.boundingBox.min.x);

    textMesh1 = new THREE.Mesh(textGeometry, material);

    textMesh1.position.x = centerOffset;
    textMesh1.position.y = hover;
    textMesh1.position.z = 0;

    textMesh1.rotation.x = 0;
    textMesh1.rotation.y = Math.PI * 2;

    group.add(textMesh1);

    if (debugObject.mirror) {
        textMesh2 = new THREE.Mesh(textGeometry, material);

        textMesh2.position.x = centerOffset;
        textMesh2.position.y = -hover;
        textMesh2.position.z = depth;

        textMesh2.rotation.x = Math.PI;
        textMesh2.rotation.y = Math.PI * 2;

        group.add(textMesh2);
    }
}

function refreshText() {
    group.remove(textMesh1);
    if (debugObject.mirror) group.remove(textMesh2);
    else if (textMesh2 !== undefined) group.remove(textMesh2);

    if (!text) return;

    createText();
}

function onPointerDown(event) {
    if (event.isPrimary === false) return;

    pointerXOnPointerDown = event.clientX - windowHalfX;
    targetRotationOnPointerDown = targetRotation;

    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);
}

function onPointerMove(event) {
    if (event.isPrimary === false) return;

    pointerX = event.clientX - windowHalfX;

    targetRotation = targetRotationOnPointerDown + (pointerX - pointerXOnPointerDown) * 0.02;
}

function onPointerUp(event) {
    if (event.isPrimary === false) return;

    document.removeEventListener('pointermove', onPointerMove);
    document.removeEventListener('pointerup', onPointerUp);
}

function getTime() {
    const date = new Date();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();
    return `${hours < 10 ? '0' + hours : hours}:${minutes < 10 ? '0' + minutes : minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
}

function animate() {
    if (debugMode) {
        stats.begin();
    }

    group.rotation.y += (targetRotation - group.rotation.y) * 0.05;

    camera.lookAt(cameraTarget);

    // Render
    renderer.render(scene, camera);

    if (debugMode) {
        stats.end();
    }
}