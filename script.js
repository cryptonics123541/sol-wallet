// Select the canvas
const canvas = document.querySelector('#bg');

// Scene, Camera, Renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas });

// Set renderer size
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

// Glowing Sphere
const geometry = new THREE.SphereGeometry(1, 32, 32);

// Material with emissive glow
const material = new THREE.MeshPhongMaterial({
    color: 0x44aa88,
    emissive: 0x229977,
    emissiveIntensity: 1,
    shininess: 100
});

// Create sphere mesh
const sphere = new THREE.Mesh(geometry, material);
scene.add(sphere);

// Ad
