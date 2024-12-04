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

// Add a point light
const pointLight = new THREE.PointLight(0xffffff, 1, 100);
pointLight.position.set(5, 5, 5);
scene.add(pointLight);

// Ambient light for softer shadows
const ambientLight = new THREE.AmbientLight(0x404040);
scene.add(ambientLight);

// Move camera back to view the sphere
camera.position.z = 5;

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    // Rotate the sphere
    sphere.rotation.x += 0.01;
    sphere.rotation.y += 0.01;

    // Pulse effect by changing emissive intensity
    material.emissiveIntensity = 1.5 + Math.sin(Date.now() * 0.005) * 0.5;

    renderer.render(scene, camera);
}

animate();

// Adjust canvas size on window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
   
