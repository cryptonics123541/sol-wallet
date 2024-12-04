// Select the canvas
const canvas = document.querySelector('#bg');

// Scene, Camera, Renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true; // Enable shadows
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Softer shadow edges

// Room (A large box surrounding the scene)
const roomGeometry = new THREE.BoxGeometry(50, 50, 50); // Large box for the room
const roomMaterial = new THREE.MeshStandardMaterial({
    color: 0x505050,  // Medium gray color for the room
    roughness: 0.9,   // Matte finish
    metalness: 0.1,   // Slight metallic effect
    side: THREE.BackSide, // Render the inside of the box
});
const room = new THREE.Mesh(roomGeometry, roomMaterial);
room.receiveShadow = true; // Room receives shadows
scene.add(room); // Add the room to the scene

// Glowing Cube (Uniform Glow Across All Sides)
const cubeGeometry = new THREE.BoxGeometry(5, 5, 5); // Larger cube
const cubeMaterial = new THREE.MeshStandardMaterial({
    color: 0xffa500,       // Orange base color
    emissive: 0xff4500,    // Uniform emissive glow (orange-red)
    emissiveIntensity: 2,  // Glow intensity
    roughness: 0.4,        // Reflectivity
    metalness: 0.1,        // Slight metallic effect
    flatShading: true,     // Ensures uniform appearance across sides
});
const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
cube.position.set(0, 5, 0); // Centered and elevated
cube.castShadow = false; // Prevent cube from casting shadows on itself
scene.add(cube); // Add cube to the scene

// Light Source
const cubeLight = new THREE.PointLight(0xffa500, 15, 50); // Strong orange light
cubeLight.position.set(0, 6, 0); // Move the light slightly above the cube
cubeLight.castShadow = true; // Light casts shadows
cubeLight.shadow.bias = -0.003; // Fine-tuned to reduce shadow artifacts
cubeLight.shadow.mapSize.width = 2048; // High-quality shadow resolution
cubeLight.shadow.mapSize.height = 2048; // High-quality shadow resolution
cube.add(cubeLight); // Attach the light to the cube

// Camera Position
camera.position.set(0, 10, 30); // Place the camera slightly above floor level and further back
camera.lookAt(0, 5, 0); // Focus on the cube

// GUI Parameters
const guiParams = {
    brightness: cubeLight.intensity, // Initial brightness
};

// GUI Setup
const gui = new dat.GUI();
gui.add(guiParams, 'brightness', 0, 30, 0.1).name('Cube Brightness').onChange((value) => {
    cubeLight.intensity = value; // Dynamically adjust light intensity
});

// Animation Loop
function animate() {
    requestAnimationFrame(animate);

    // Rotate the cube and its light source
    cube.rotation.x += 0.01; // X-axis rotation
    cube.rotation.y += 0.01; // Y-axis rotation

    renderer.render(scene, camera); // Render the scene
}

animate(); // Start animation

// Adjust canvas size dynamically
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
