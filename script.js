// Select the canvas
const canvas = document.querySelector('#bg');

// Scene, Camera, Renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

// Glowing Sphere
const geometry = new THREE.SphereGeometry(1, 32, 32); // Sphere geometry
const material = new THREE.MeshPhongMaterial({
    color: 0x44aa88,          // Base color of the sphere
    emissive: 0x229977,       // Glow color
    emissiveIntensity: 1,     // Initial glow strength
    shininess: 100,           // Reflectiveness
});
const sphere = new THREE.Mesh(geometry, material);
scene.add(sphere); // Add sphere to the scene

// Lighting
const pointLight = new THREE.PointLight(0xffffff, 1, 100); // Strong light source
pointLight.position.set(5, 5, 5); // Position the light
scene.add(pointLight);

const ambientLight = new THREE.AmbientLight(0x404040); // Soft background lighting
scene.add(ambientLight);

// Camera Position
camera.position.z = 5;

// Animation Loop
function animate() {
    requestAnimationFrame(animate);

    // Rotate the sphere
    sphere.rotation.x += 0.01; // Slow X-axis rotation
    sphere.rotation.y += 0.01; // Slow Y-axis rotation

    // Pulse the glow (sinusoidal intensity change)
    material.emissiveIntensity = 1.5 + Mat
