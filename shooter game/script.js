// 3D First Person Battle Royale Game

// Game variables
let scene, camera, renderer;
let player = {
    health: 100,
    ammo: 30,
    spareAmmo: 90,
    kills: 0
};
let gameActive = false;
let playerCount = 100;
let zoneTimer = 120; // seconds
let enemies = [];

// Initialize the game
function init() {
    // Create Three.js scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb); // Sky blue
    
    // Create camera (player view)
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.y = 1.6; // Player height
    
    // Create renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('game-container').appendChild(renderer.domElement);
    
    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);
    
    // Create ground
    const groundGeometry = new THREE.PlaneGeometry(1000, 1000);
    const groundMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x3a6d35,  // Green
        roughness: 0.8
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2; // Rotate to horizontal
    ground.position.y = 0;
    scene.add(ground);
    
    // Add environment (trees, rocks, buildings)
    createEnvironment();
    
    // Create enemy bots
    createEnemies();
    
    // Setup event listeners for player controls
    setupControls();
    
    // Start the game
    gameActive = true;
    
    // Start game loop
    animate();
    
    // Start zone timer countdown
    startZoneTimer();
}

function createEnvironment() {
    // Create trees, buildings, and cover objects
    for (let i = 0; i < 100; i++) {
        // Trees
        const treeHeight = 5 + Math.random() * 5;
        const treeGeo = new THREE.CylinderGeometry(0, 1, treeHeight, 8);
        const treeMat = new THREE.MeshStandardMaterial({ color: 0x2d4c1e });
        const tree = new THREE.Mesh(treeGeo, treeMat);
        
        // Position randomly but away from center (player spawn)
        const distance = 20 + Math.random() * 400;
        const angle = Math.random() * Math.PI * 2;
        tree.position.set(
            Math.cos(angle) * distance,
            treeHeight / 2,
            Math.sin(angle) * distance
        );
        
        scene.add(tree);
        
        // Tree trunk
        const trunkGeo = new THREE.CylinderGeometry(0.3, 0.3, treeHeight / 2);
        const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5c4033 });
        const trunk = new THREE.Mesh(trunkGeo, trunkMat);
        trunk.position.set(
            tree.position.x,
            treeHeight / 4 - 0.5,
            tree.position.z
        );
        scene.add(trunk);
    }
    
    // Add buildings
    for (let i = 0; i < 20; i++) {
        const buildingSize = 5 + Math.random() * 10;
        const buildingHeight = 3 + Math.random() * 15;
        const buildingGeo = new THREE.BoxGeometry(buildingSize, buildingHeight, buildingSize);
        const buildingMat = new THREE.MeshStandardMaterial({ 
            color: Math.random() > 0.5 ? 0xaaaaaa : 0x888888
        });
        const building = new THREE.Mesh(buildingGeo, buildingMat);
        
        const distance = 50 + Math.random() * 350;
        const angle = Math.random() * Math.PI * 2;
        building.position.set(
            Math.cos(angle) * distance,
            buildingHeight / 2,
            Math.sin(angle) * distance
        );
        
        scene.add(building);
    }
}

function createEnemies() {
    // Create AI opponents
    for (let i = 0; i < playerCount - 1; i++) {
        // Simplified enemy representation (would be more complex in a real game)
        const enemyGeo = new THREE.CapsuleGeometry(0.5, 1.5, 4, 8);
        const enemyMat = new THREE.MeshStandardMaterial({ color: 0xff0000 });
        const enemy = new THREE.Mesh(enemyGeo, enemyMat);
        
        const distance = 30 + Math.random() * 400;
        const angle = Math.random() * Math.PI * 2;
        enemy.position.set(
            Math.cos(angle) * distance,
            1.25,
            Math.sin(angle) * distance
        );
        
        scene.add(enemy);
        enemies.push({
            mesh: enemy,
            health: 100,
            state: 'patrolling' // or 'attacking', 'hiding'
        });
    }
}

function setupControls() {
    document.addEventListener('mousemove', (event) => {
        // Would implement camera rotation based on mouse movement
        // For a full implementation, you'd use PointerLock controls
    });
    
    document.addEventListener('click', shoot);
    
    document.addEventListener('keydown', (event) => {
        // Handle WASD movement, sprint, crouch, etc.
        // Would translate to camera position changes
    });
    
    // Add reload, weapon swap, etc.
    document.addEventListener('keypress', (event) => {
        if(event.key.toLowerCase() === 'r') {
            reload();
        }
    });
    
    // Restart button
    document.getElementById('restart').addEventListener('click', restartGame);
}

function shoot() {
    if (!gameActive || player.ammo <= 0) return;
    
    player.ammo--;
    updateAmmoDisplay();
    
    // Implement raycast to check for hits
    // If enemy hit, reduce health and possibly eliminate them
}

function reload() {
    if (player.spareAmmo > 0) {
        const ammoNeeded = 30 - player.ammo;
        const ammoToLoad = Math.min(ammoNeeded, player.spareAmmo);
        
        player.ammo += ammoToLoad;
        player.spareAmmo -= ammoToLoad;
        
        updateAmmoDisplay();
    }
}

function updateAmmoDisplay() {
    document.getElementById('ammo').textContent = `AMMO: ${player.ammo}/${player.spareAmmo}`;
}

function startZoneTimer() {
    const interval = setInterval(() => {
        zoneTimer--;
        
        const minutes = Math.floor(zoneTimer / 60);
        const seconds = zoneTimer % 60;
        document.getElementById('zone-timer').textContent = 
            `ZONE: ${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        if (zoneTimer <= 0) {
            clearInterval(interval);
            shrinkPlayZone();
        }
        
        // Simulate random enemy deaths to simulate battle royale progression
        if (Math.random() < 0.1 && playerCount > 10) {
            playerCount--;
            updatePlayerCount();
        }
    }, 1000);
}

function shrinkPlayZone() {
    // In a full implementation, this would move the safe zone boundaries
    // and apply damage to players outside the zone
    
    // Reset timer for next zone shrink
    zoneTimer = 120;
    startZoneTimer();
}

function updatePlayerCount() {
    document.getElementById('players-left').textContent = `PLAYERS: ${playerCount}`;
}

function updateHealth(value) {
    player.health = Math.max(0, Math.min(100, player.health + value));
    document.getElementById('health-fill').style.width = player.health + '%';
    
    if (player.health <= 0) {
        gameOver();
    }
}

function gameOver() {
    gameActive = false;
    document.getElementById('game-over').classList.remove('hidden');
    document.getElementById('final-rank').textContent = `#${getPlayerRank()}`;
    document.getElementById('final-kills').textContent = player.kills;
}

function getPlayerRank() {
    return Math.floor(Math.random() * playerCount) + 1;
}

function restartGame() {
    // Reset all game variables and restart
    document.getElementById('game-over').classList.add('hidden');
    
    player.health = 100;
    player.ammo = 30;
    player.spareAmmo = 90;
    player.kills = 0;
    
    playerCount = 100;
    zoneTimer = 120;
    
    // Clear and recreate scene
    while(scene.children.length > 0){ 
        scene.remove(scene.children[0]); 
    }
    
    enemies = [];
    init();
}

function animate() {
    if (!gameActive) return;
    
    requestAnimationFrame(animate);
    
    // Update enemy AI and movements
    updateEnemies();
    
    // Update zone effects
    
    // Render scene
    renderer.render(scene, camera);
}

function updateEnemies() {
    // This would contain AI logic for enemies
    // Moving, attacking, etc.
    
    // Simplified implementation
    enemies.forEach(enemy => {
        if (enemy.state === 'patrolling') {
            // Random movement
            if (Math.random() < 0.01) {
                enemy.mesh.position.x += (Math.random() - 0.5) * 2;
                enemy.mesh.position.z += (Math.random() - 0.5) * 2;
            }
        }
    });
}

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Initialize the game when page loads
window.addEventListener('load', init);
