import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
import { createFBMTerrain } from './terrain.js';

// Scene, Camera, Renderer
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 90, -40);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Pointer Lock Controls (First-Person Camera)
const controls = new PointerLockControls(camera, document.body);
document.body.addEventListener('click', () => {
    controls.lock();
    console.log("Pointer Lock Activated");
});

// Global Terrain Size
const TERRAIN_WIDTH = 150;
const TERRAIN_LENGTH = 200;

// Terrain Noise Settings
let octaves = 5;
let persistence = 0.5;
let lacunarity = 2.0;

// Global Gravity Toggle
let gravityEnabled = false;

// Movement & Physics Variables
const movementSpeed = 0.5;
const verticalSpeed = 0.3;
const gravity = 0.2;
const maxFallSpeed = -1.5;
let velocity = new THREE.Vector3();
let isGrounded = true;

// Key Handling
const keys = {};
document.addEventListener('keydown', (event) => {
    keys[event.code] = true;
    if (event.code === "KeyG") {
        gravityEnabled = !gravityEnabled;
        console.log(`Gravity Mode: ${gravityEnabled ? "Walking (Gravity ON)" : "Flying (Gravity OFF)"}`);
        if (!gravityEnabled) velocity.y = 0;
    }
});
document.addEventListener('keyup', (event) => keys[event.code] = false);

// **Load Textures Function**
const textureLoader = new THREE.TextureLoader();
function loadTextures(folder, texture_name) {
    return {
        map: textureLoader.load(`../${folder}/${texture_name}_basecolor.png`),
        normalMap: textureLoader.load(`../${folder}/${texture_name}_normal.png`),
        metalnessMap: textureLoader.load(`../${folder}/${texture_name}_metallic.png`),
        emissiveMap: textureLoader.load(`../${folder}/${texture_name}_emissive.png`)
    };
}

// **Apply Texture Wrapping & Tiling**
function configureTextures(textures, repeat = 5) {
    Object.values(textures).forEach(texture => {
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(repeat, repeat);
    });
}

// **Load Textures for Open Box (RockLava) & Terrain (RockDark)**
const openBoxTextures = loadTextures('RockLava', 'SuperheatedRockLavaSurface');
const terrainTextures = loadTextures('RockDark', 'FracturedCliff6Dark');
configureTextures(openBoxTextures);
configureTextures(terrainTextures);

// **Create Open Box (Lava)**
function createOpenBox(width, height, depth) {
    const material = new THREE.MeshStandardMaterial({ color: 0x000000, side: THREE.DoubleSide });
    const group = new THREE.Group();

    // Walls
    const createWall = (w, h, x, y, z, ry = 0) => {
        const wall = new THREE.Mesh(new THREE.PlaneGeometry(w, h), material);
        wall.position.set(x, y, z);
        wall.rotation.y = ry;
        group.add(wall);
    };
    createWall(depth, height, -width / 2, height / 2, 0, Math.PI / 2);
    createWall(depth, height, width / 2, height / 2, 0, -Math.PI / 2);
    createWall(width, height, 0, height / 2, -depth / 2);

    // Floor (Emissive Lava)
    const bottomMaterial = new THREE.MeshStandardMaterial({
        ...openBoxTextures,
        metalness: 0.5,
        roughness: 0.8,
        emissive: new THREE.Color(0xffa500),
        emissiveIntensity: 3.0
    });

    const bottom = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), bottomMaterial);
    bottom.position.set(0, 0, 0);
    bottom.rotation.x = -Math.PI / 2;
    group.add(bottom);

    return group;
}

// **Create Procedural Terrain with Textures**
function createTexturedTerrain(width, length, segments, scale) {
    let terrain = createFBMTerrain(width, length, segments, scale, octaves, persistence, lacunarity);
    
    const terrainMaterial = new THREE.MeshStandardMaterial({
        ...terrainTextures,
        metalness: 0.4,
        roughness: 0.9,
        emissive: new THREE.Color(0x222222),
        emissiveIntensity: 1.0
    });

    terrain.material = terrainMaterial;
    return terrain;
}

// **Initialize Terrain & Open Box**
let terrain_list = [];
let box_list = [];
let currentMaxZ = 0;
let currentMinY = 0;
let updatingTerrain = false;

let terrain = createTexturedTerrain(TERRAIN_WIDTH, TERRAIN_LENGTH, 256, 100);
terrain.position.set(0, 0, 0);
terrain.rotation.x = -Math.PI / 2;
terrain_list.push(terrain);
scene.add(terrain);

let openBox = createOpenBox(TERRAIN_WIDTH, 50, TERRAIN_LENGTH);
openBox.position.set(0, 0, 0);
box_list.push(openBox);
scene.add(openBox);

currentMaxZ = terrain.position.z + TERRAIN_LENGTH;
currentMinY = terrain.position.y;
camera.lookAt(terrain.position);

// **Lighting**
const pointLight = new THREE.PointLight(0xffffff, 4000, 1000);
pointLight.position.set(0, 100, 0);
scene.add(pointLight);
scene.add(new THREE.AmbientLight(0x404040, 10));

// **Terrain Generation**
function updateTerrain() {
    if (updatingTerrain) return;
    updatingTerrain = true;

    let lastTerrain = terrain_list[terrain_list.length - 1];
    let lastTerrainMaxZ = lastTerrain.position.z + TERRAIN_LENGTH;

    if (camera.position.z > lastTerrain.position.z + TERRAIN_LENGTH / 2) {  
        let newTerrainY = currentMinY - 200;
        let newTerrainZ = lastTerrainMaxZ;

        let new_scale = Math.floor(Math.random() * 10) * 10 + 10;
        let new_terrain = createTexturedTerrain(TERRAIN_WIDTH, TERRAIN_LENGTH, 256, new_scale);
        new_terrain.position.set(0, newTerrainY, newTerrainZ);
        new_terrain.rotation.x = -Math.PI / 2;
        terrain_list.push(new_terrain);
        scene.add(new_terrain);

        let new_openBox = createOpenBox(TERRAIN_WIDTH, 50, TERRAIN_LENGTH);
        new_openBox.position.set(0, newTerrainY, newTerrainZ);
        box_list.push(new_openBox);
        scene.add(new_openBox);

        currentMaxZ = new_terrain.position.z + TERRAIN_LENGTH;
        currentMinY = new_terrain.position.y;
    }

    updatingTerrain = false;
}

// **Animation Loop**
function animate() {
    requestAnimationFrame(animate);
    updateTerrain();

    if (controls.isLocked) {
        const direction = new THREE.Vector3();
        camera.getWorldDirection(direction);
        const right = new THREE.Vector3();
        camera.getWorldDirection(right);
        right.cross(camera.up).normalize();

        if (keys['KeyW']) camera.position.addScaledVector(direction, movementSpeed);
        if (keys['KeyS']) camera.position.addScaledVector(direction, -movementSpeed);
        if (keys['KeyA']) camera.position.addScaledVector(right, -movementSpeed);
        if (keys['KeyD']) camera.position.addScaledVector(right, movementSpeed);

        if (gravityEnabled) {
            velocity.y = isGrounded ? (keys['Space'] ? 2.5 : 0) : Math.max(velocity.y - gravity, maxFallSpeed);
            camera.position.y += velocity.y;
        } else {
            if (keys['Space']) camera.position.y += verticalSpeed;
            if (keys['ShiftLeft']) camera.position.y -= verticalSpeed;
        }
    }

    renderer.render(scene, camera);
}

// **Start Animation**
animate();
