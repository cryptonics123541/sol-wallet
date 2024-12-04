const canvas = document.querySelector('#bg');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// Color schemes
const colorSchemes = {
    cyber: { main: 0x00ff88, glow: 0x00ff88 },
    fire: { main: 0xff4400, glow: 0xff8800 },
    ice: { main: 0x00ffff, glow: 0x88ffff }
};
let currentScheme = colorSchemes.cyber;
const roomColor = 0x001a0d;

scene.fog = new THREE.Fog(0x000000, 20, 100);

const room = new THREE.Mesh(
    new THREE.BoxGeometry(50, 50, 50),
    new THREE.MeshStandardMaterial({
        color: roomColor,
        roughness: 0.9,
        metalness: 0.1,
        side: THREE.BackSide
    })
);
room.receiveShadow = true;
scene.add(room);

// Enhanced particle system
const particlesGeometry = new THREE.BufferGeometry();
const particlesCount = 2000;
const posArray = new Float32Array(particlesCount * 3);
for(let i = 0; i < particlesCount * 3; i++) {
    posArray[i] = (Math.random() - 0.5) * 50;
}
particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
const particlesMaterial = new THREE.PointsMaterial({
    size: 0.1,
    color: currentScheme.main,
    transparent: true,
    opacity: 0.5,
    blending: THREE.AdditiveBlending
});
const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(particlesMesh);

const cubeGeometry = new THREE.BoxGeometry(5, 5, 5);
const cubeMaterial = new THREE.MeshStandardMaterial({
    color: currentScheme.main,
    emissive: currentScheme.glow,
    emissiveIntensity: 3,
    roughness: 0.4,
    metalness: 0.1,
    transparent: true,
    opacity: 0.9
});
const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);

const edges = new THREE.EdgesGeometry(cubeGeometry);
const edgesMaterial = new THREE.LineBasicMaterial({ 
    color: 0xffffff, 
    transparent: true,
    opacity: 0.5,
    linewidth: 3
});
const edgeLines = new THREE.LineSegments(edges, edgesMaterial);

for(let i = 0; i < 4; i++) {
    const edgeCopy = edgeLines.clone();
    edgeCopy.scale.multiplyScalar(1 + (i * 0.01));
    cube.add(edgeCopy);
}

cube.position.set(0, 0, 10);
cube.castShadow = false;
scene.add(cube);

const ambientLight = new THREE.AmbientLight(currentScheme.main, 0.5);
scene.add(ambientLight);

const cubeLight = new THREE.PointLight(currentScheme.glow, 5, 50);
cubeLight.position.set(0, 6, 0);
cubeLight.castShadow = true;
cubeLight.shadow.bias = -0.003;
cubeLight.shadow.mapSize.width = 2048;
cubeLight.shadow.mapSize.height = 2048;
cube.add(cubeLight);

camera.position.set(0, 0, 30);
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

const guiParams = {
    brightness: cubeLight.intensity,
    rotationSpeed: 0.01,
    particleSpeed: 0.001,
    colorScheme: 'cyber',
    pulseSpeed: 0.003,
    pulseIntensity: 0.1,
    autoRotate: true,
    explosionEffect: false
};

const gui = new dat.GUI();
gui.add(guiParams, 'brightness', 0, 30, 0.1)
   .name('Cube Brightness')
   .onChange(value => cubeLight.intensity = value);
gui.add(guiParams, 'rotationSpeed', 0, 0.1, 0.001)
   .name('Rotation Speed');
gui.add(guiParams, 'particleSpeed', 0, 0.01, 0.001)
   .name('Particle Speed');
gui.add(guiParams, 'colorScheme', ['cyber', 'fire', 'ice'])
   .onChange(updateColorScheme);
gui.add(guiParams, 'pulseSpeed', 0, 0.01, 0.001)
   .name('Pulse Speed');
gui.add(guiParams, 'pulseIntensity', 0, 0.5, 0.01)
   .name('Pulse Intensity');
gui.add(guiParams, 'autoRotate')
   .name('Auto Rotate');
gui.add(guiParams, 'explosionEffect')
   .name('Explosion Effect');

function updateColorScheme(scheme) {
    currentScheme = colorSchemes[scheme];
    cube.material.color.setHex(currentScheme.main);
    cube.material.emissive.setHex(currentScheme.glow);
    particlesMesh.material.color.setHex(currentScheme.main);
    cubeLight.color.setHex(currentScheme.glow);
}

function animate() {
    requestAnimationFrame(animate);

    if (guiParams.autoRotate) {
        cube.rotation.x += guiParams.rotationSpeed;
        cube.rotation.y += guiParams.rotationSpeed;
    }

    particlesMesh.rotation.x += guiParams.particleSpeed;
    particlesMesh.rotation.y += guiParams.particleSpeed;

    if (guiParams.explosionEffect) {
        const positions = particlesMesh.geometry.attributes.position.array;
        for(let i = 0; i < positions.length; i += 3) {
            positions[i] *= 1.01;
            positions[i + 1] *= 1.01;
            positions[i + 2] *= 1.01;
        }
        particlesMesh.geometry.attributes.position.needsUpdate = true;
    }

    const pulseScale = 1 + Math.sin(Date.now() * guiParams.pulseSpeed) * guiParams.pulseIntensity;
    cube.scale.set(pulseScale, pulseScale, pulseScale);
    
    controls.update();
    renderer.render(scene, camera);
}

animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});