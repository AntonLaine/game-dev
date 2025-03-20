// IMPORTANT: NO IMPORT STATEMENTS SHOULD BE HERE
// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

// Camera setup
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 5, 10);
camera.lookAt(0, 0, 0);

// Renderer setup
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// Create human character
const human = createHuman();
scene.add(human);

// Add ground - ENLARGED
const groundGeometry = new THREE.PlaneGeometry(200, 200); // Increased from 100x100
const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x33aa33 });
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -1;
ground.receiveShadow = true;
scene.add(ground);

// Add lights
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(10, 20, 10);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 1024;
directionalLight.shadow.mapSize.height = 1024;
scene.add(directionalLight);

// Initialize game state manager
game = new Game(scene);

// Set AI base to a good location away from player start
game.ai.baseLocation = new THREE.Vector3(80, 0, 80);

// Add keyboard shortcuts for unit control and debug
window.addEventListener('keydown', function(event) {
    // Check if we have units selected
    if (game.selectedUnits.length > 0) {
        // M key for move
        if (event.key === 'm' || event.key === 'M') {
            moveSelectedUnits();
        }
        
        // Escape key to deselect units
        if (event.key === 'Escape') {
            game.clearUnitSelection();
        }
    }
    
    // P key to toggle debug panel
    if (event.key === 'p' || event.key === 'P') {
        game.toggleDebugPanel();
    }
});

// Setup controls
const controls = new CharacterControls(human, camera);

// Prevent context menu on right-click
renderer.domElement.addEventListener('contextmenu', (event) => {
    event.preventDefault();
});

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    controls.update();
    
    renderer.render(scene, camera);
}

animate();
