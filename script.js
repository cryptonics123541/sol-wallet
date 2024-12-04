// Select the canvas
const canvas = document.querySelector('#bg');

// Scene, Camera, Renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

// Room (A large box surrounding the scene)
const roomGeometry = new THREE.BoxGeometry(50, 50, 50); // Large box for the room
const roomMaterial = new THREE.MeshStandardMaterial({
    color: 0x808080,  // Gray color for the room
    side: THREE.BackSide, // Render the inside of the box
});
const room = new THREE.Mesh(roomGeometry, roomMaterial);
scene.add(room); // Add the room to the scene

// Cube (Larger and centered)
const cubeGeometry = new THREE.BoxGeometry(5, 5, 5); // Larger cube
const cubeMaterial = new THREE.MeshStandardMaterial({
    color: 0xffa500, // Orange base color
    roughness: 0.5,  // Adjust reflectivity
    metalness: 0.5,  // Simulate metal-like reflections
});
const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
cube.position.set(0, 0, 0); // Center the cube in the room
scene.add(cube); // Add cube to the scene

// Lighting
const pointLight = new THREE.PointLight(0xffffff, 1.5, 100); // Bright white light
pointLight.position.set(0, 20, 0); // Position the light above the cube
scene.add(pointLight);

const ambientLight = new THREE.AmbientLight(0x404040); // Soft background lighting
scene.add(ambientLight);

// Camera Position
camera.position.set(10, 10, 30); // Position the camera off-center and slightly above
camera.lookAt(0, 5, 0); // Look at the center of the room (slightly above cube)

// GUI Parameters
const guiParams = {
    rotationSpeed: 1, // Default rotation speed
};

// Create GUI
const gui = new dat.GUI();
gui.add(guiParams, 'rotationSpeed', 1, 100, 1).name('Rotation Speed');

// Animation Loop
function animate() {
    requestAnimationFrame(animate);

    // Rotate the cube based on GUI control
    const speedFactor = guiParams.rotationSpeed / 100; // Scale speed to 0.01 - 1
    cube.rotation.x += speedFactor; // X-axis rotation
    cube.rotation.y += speedFactor; // Y-axis rotation

    renderer.render(scene, camera); // Render the scene
}

animate(); // Start animation

// Adjust canvas size and aspect ratio dynamically
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
