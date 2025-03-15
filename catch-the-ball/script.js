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
let playerCount = 30; // Reduced from 100 to 30 enemies
let zoneTimer = 120; // seconds
let enemies = [];

// Add global variables for pause and spectate functionality
let isPaused = false;
let isSpectating = false;
let spectateIndex = 0;
let spectateTargets = [];

// Initialize the game
function init() {
    console.log("Initializing game with improved world generation");
    
    // Create Three.js scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb); // Sky blue
    
    // Create camera (player view) with better positioning
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 5, 10); // Position camera higher and back to see the scene
    camera.lookAt(0, 0, 0); // Look at the center
    
    // Create renderer with proper settings
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x87ceeb); // Set clear color explicitly
    renderer.shadowMap.enabled = true; // Enable shadows
    document.getElementById('game-container').appendChild(renderer.domElement);
    
    // Enhanced lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7); // Brighter ambient light
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(50, 100, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);
    
    // Add debugging helpers
    const axesHelper = new THREE.AxesHelper(10);
    scene.add(axesHelper);
    
    // Create ground with improved terrain
    createTerrain();
    
    // Add environment with improved generation
    createEnvironment();
    
    // Create enemy bots
    createEnemies();
    
    // Setup event listeners for player controls
    setupControls();
    
    // Initialize spectate targets
    setupSpectateTargets();
    
    // Start the game
    gameActive = true;
    
    // Start game loop
    animate();
    
    // Start zone timer countdown
    startZoneTimer();
    
    // Update initial UI
    updatePlayerCount();
    updateAmmoDisplay();
    
    // Print camera position to console for debugging
    console.log("Camera position:", camera.position);
    console.log("Scene contains:", scene.children.length, "objects");
}

function createTerrain() {
    // Create a more interesting terrain with hills and valleys
    const size = 1000;
    const resolution = 128;
    const segmentSize = size / resolution;
    
    const geometry = new THREE.PlaneGeometry(size, size, resolution - 1, resolution - 1);
    const material = new THREE.MeshStandardMaterial({
        color: 0x3a6d35,
        roughness: 0.8,
        metalness: 0.1,
        flatShading: true
    });
    
    // Add height variation for terrain
    const vertices = geometry.attributes.position.array;
    for (let i = 0; i < vertices.length; i += 3) {
        // Skip edge vertices to create a flat boundary
        const x = Math.floor((i / 3) % resolution);
        const z = Math.floor((i / 3) / resolution);
        
        if (x > 5 && x < resolution - 5 && z > 5 && z < resolution - 5) {
            // Create hills with simplex noise (approximated with sin/cos)
            const distance = Math.sqrt(Math.pow(x - resolution/2, 2) + Math.pow(z - resolution/2, 2));
            const heightScale = Math.max(0, 1 - distance / (resolution/2)) * 15;
            
            const xCoord = x / resolution * 10;
            const zCoord = z / resolution * 10;
            
            // Create rolling hills effect
            const height = Math.sin(xCoord) * Math.cos(zCoord) * heightScale;
            vertices[i + 1] = height; // Y coordinate
        }
    }
    geometry.computeVertexNormals();
    
    const terrain = new THREE.Mesh(geometry, material);
    terrain.rotation.x = -Math.PI / 2; // Rotate to horizontal
    terrain.position.y = -2; // Lower the terrain slightly
    scene.add(terrain);
    
    // Add water at the edges
    const waterGeometry = new THREE.PlaneGeometry(size * 3, size * 3);
    const waterMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x2389da,
        transparent: true,
        opacity: 0.7
    });
    const water = new THREE.Mesh(waterGeometry, waterMaterial);
    water.rotation.x = -Math.PI / 2;
    water.position.y = -3;
    scene.add(water);
}

function createEnvironment() {
    // Create biomes for different areas
    createForestBiome();
    createUrbanBiome();
    createDesertBiome();
    
    // Add scattered rocks and details
    for (let i = 0; i < 200; i++) {
        // Small rocks
        const scale = 0.5 + Math.random() * 1.5;
        const rockGeo = new THREE.DodecahedronGeometry(scale, 0);
        const rockMat = new THREE.MeshStandardMaterial({
            color: 0x888888,
            roughness: 0.9
        });
        const rock = new THREE.Mesh(rockGeo, rockMat);
        
        // Position randomly
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * 400;
        rock.position.set(
            Math.cos(angle) * distance,
            -1 + Math.random() * 2, // Partially embed in ground
            Math.sin(angle) * distance
        );
        rock.rotation.set(
            Math.random() * Math.PI,
            Math.random() * Math.PI,
            Math.random() * Math.PI
        );
        scene.add(rock);
    }
}

function createForestBiome() {
    // Create forest in the northern part of the map
    for (let i = 0; i < 150; i++) {
        const treeHeight = 5 + Math.random() * 7;
        const treeGeo = new THREE.CylinderGeometry(0, 1.5, treeHeight, 8);
        const treeMat = new THREE.MeshStandardMaterial({ color: 0x2d4c1e });
        const tree = new THREE.Mesh(treeGeo, treeMat);
        
        // Position in northern area
        const angle = Math.random() * Math.PI * 0.8 - Math.PI * 0.4; // -45° to +45°
        const distance = 50 + Math.random() * 350;
        tree.position.set(
            Math.cos(angle) * distance,
            treeHeight / 2,
            Math.sin(angle) * distance - 100 // Push north
        );
        
        scene.add(tree);
        
        // Tree trunk
        const trunkGeo = new THREE.CylinderGeometry(0.5, 0.5, treeHeight / 2);
        const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5c4033 });
        const trunk = new THREE.Mesh(trunkGeo, trunkMat);
        trunk.position.set(
            tree.position.x,
            treeHeight / 4 - 0.5,
            tree.position.z
        );
        scene.add(trunk);
    }
}

function createUrbanBiome() {
    // Create urban area in the center
    
    // Central buildings (larger, more dense)
    for (let i = 0; i < 25; i++) {
        const buildingSize = 8 + Math.random() * 15;
        const buildingHeight = 10 + Math.random() * 30;
        const buildingGeo = new THREE.BoxGeometry(buildingSize, buildingHeight, buildingSize);
        const buildingMat = new THREE.MeshStandardMaterial({ 
            color: Math.random() > 0.5 ? 0xaaaaaa : 0x888888
        });
        const building = new THREE.Mesh(buildingGeo, buildingMat);
        
        // Position in central area
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * 100;
        building.position.set(
            Math.cos(angle) * distance,
            buildingHeight / 2,
            Math.sin(angle) * distance
        );
        
        scene.add(building);
        
        // Add windows
        addBuildingWindows(building, buildingSize, buildingHeight);
    }
    
    // Roads
    createRoads();
}

function addBuildingWindows(building, width, height) {
    // Add windows to building faces
    const windowSize = 1;
    const windowSpacing = 2;
    
    // Calculate number of windows per row/column
    const windowsPerRow = Math.floor(width / windowSpacing) - 1;
    const windowsPerColumn = Math.floor(height / windowSpacing) - 1;
    
    for (let face = 0; face < 4; face++) {
        for (let row = 1; row < windowsPerColumn; row++) {
            for (let col = 1; col < windowsPerRow; col++) {
                // Skip some windows randomly
                if (Math.random() > 0.7) continue;
                
                const windowGeo = new THREE.PlaneGeometry(windowSize, windowSize);
                const windowMat = new THREE.MeshBasicMaterial({ 
                    color: Math.random() > 0.5 ? 0xffffaa : 0x000000
                });
                const windowMesh = new THREE.Mesh(windowGeo, windowMat);
                
                // Position on building face
                const x = (col * windowSpacing) - (width/2 - windowSize/2);
                const y = (row * windowSpacing) - (height/2 - windowSize/2);
                
                switch(face) {
                    case 0: // Front
                        windowMesh.position.set(0, y, width/2 + 0.1);
                        break;
                    case 1: // Right
                        windowMesh.position.set(width/2 + 0.1, y, 0);
                        windowMesh.rotation.y = Math.PI/2;
                        break;
                    case 2: // Back
                        windowMesh.position.set(0, y, -width/2 - 0.1);
                        windowMesh.rotation.y = Math.PI;
                        break;
                    case 3: // Left
                        windowMesh.position.set(-width/2 - 0.1, y, 0);
                        windowMesh.rotation.y = -Math.PI/2;
                        break;
                }
                
                building.add(windowMesh);
            }
        }
    }
}

function createRoads() {
    // Create cross-shaped roads
    const roadWidth = 10;
    const roadLength = 500;
    
    // Road material
    const roadMat = new THREE.MeshBasicMaterial({ color: 0x333333 });
    
    // East-West road
    const roadEWGeo = new THREE.PlaneGeometry(roadLength, roadWidth);
    const roadEW = new THREE.Mesh(roadEWGeo, roadMat);
    roadEW.rotation.x = -Math.PI/2;
    roadEW.position.y = 0.1; // Slightly above ground
    scene.add(roadEW);
    
    // North-South road
    const roadNSGeo = new THREE.PlaneGeometry(roadWidth, roadLength);
    const roadNS = new THREE.Mesh(roadNSGeo, roadMat);
    roadNS.rotation.x = -Math.PI/2;
    roadNS.position.y = 0.1; // Slightly above ground
    scene.add(roadNS);
    
    // Road markings
    addRoadMarkings(roadEW, roadLength, roadWidth, true);
    addRoadMarkings(roadNS, roadLength, roadWidth, false);
}

function addRoadMarkings(road, length, width, isHorizontal) {
    const markerMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const markerWidth = 0.5;
    const markerLength = 5;
    const spacing = 10;
    
    const numMarkers = Math.floor(length / spacing) - 1;
    
    for (let i = 0; i < numMarkers; i++) {
        const markerGeo = isHorizontal 
            ? new THREE.PlaneGeometry(markerLength, markerWidth) 
            : new THREE.PlaneGeometry(markerWidth, markerLength);
        
        const marker = new THREE.Mesh(markerGeo, markerMat);
        marker.rotation.x = -Math.PI/2;
        
        const offset = (i * spacing) - (length/2 - spacing/2);
        if (isHorizontal) {
            marker.position.set(offset, 0.2, 0); // Y slightly above road
        } else {
            marker.position.set(0, 0.2, offset); // Y slightly above road
        }
        
        road.add(marker);
    }
}

function createDesertBiome() {
    // Create desert area in the southern part
    
    // Add cactuses
    for (let i = 0; i < 50; i++) {
        const cactusHeight = 3 + Math.random() * 4;
        const cactusGeo = new THREE.CylinderGeometry(0.5, 0.6, cactusHeight, 8);
        const cactusMat = new THREE.MeshStandardMaterial({ color: 0x2d7d3a });
        const cactus = new THREE.Mesh(cactusGeo, cactusMat);
        
        // Position in southern area
        const angle = Math.PI + Math.random() * Math.PI * 0.8 - Math.PI * 0.4; // 135° to 225°
        const distance = 50 + Math.random() * 350;
        cactus.position.set(
            Math.cos(angle) * distance,
            cactusHeight / 2,
            Math.sin(angle) * distance + 100 // Push south
        );
        
        scene.add(cactus);
        
        // Add arms to some cacti
        if (Math.random() > 0.6) {
            const armHeight = 1 + Math.random() * 2;
            const armGeo = new THREE.CylinderGeometry(0.3, 0.3, armHeight, 8);
            const arm = new THREE.Mesh(armGeo, cactusMat);
            
            // Position arm on cactus
            arm.position.y = Math.random() * (cactusHeight/2);
            arm.position.x = 0.8;
            arm.rotation.z = Math.PI/2;
            
            cactus.add(arm);
            
            // Sometimes add a second arm
            if (Math.random() > 0.5) {
                const arm2 = arm.clone();
                arm2.position.x = -0.8;
                arm2.rotation.z = -Math.PI/2;
                cactus.add(arm2);
            }
        }
    }
    
    // Add some rocks and sand mounds
    for (let i = 0; i < 120; i++) {
        const rockSize = 1 + Math.random() * 4;
        const rockGeo = new THREE.DodecahedronGeometry(rockSize, 1);
        const rockMat = new THREE.MeshStandardMaterial({
            color: 0xd2b48c,
            roughness: 1.0
        });
        const rock = new THREE.Mesh(rockGeo, rockMat);
        
        // Position in southern area
        const angle = Math.PI + Math.random() * Math.PI * 0.8 - Math.PI * 0.4; // 135° to 225°
        const distance = 100 + Math.random() * 300;
        rock.position.set(
            Math.cos(angle) * distance,
            rockSize/3, // Partially embed in sand
            Math.sin(angle) * distance + 150 // Push south
        );
        
        rock.rotation.set(
            Math.random() * Math.PI,
            Math.random() * Math.PI,
            Math.random() * Math.PI
        );
        
        scene.add(rock);
    }
}

function createEnemies() {
    // Create AI opponents - fewer than before (30 instead of 100)
    console.log("Creating enemies with cylinder & sphere");
    
    for (let i = 0; i < playerCount - 1; i++) {
        try {
            // Body (cylinder)
            const bodyGeo = new THREE.CylinderGeometry(0.5, 0.5, 1.5, 8);
            const bodyMat = new THREE.MeshStandardMaterial({ color: 0xff0000 });
            const body = new THREE.Mesh(bodyGeo, bodyMat);
            
            // Head (sphere)
            const headGeo = new THREE.SphereGeometry(0.5, 16, 16);
            const headMat = new THREE.MeshStandardMaterial({ color: 0xff0000 });
            const head = new THREE.Mesh(headGeo, headMat);
            head.position.y = 1.0; // Position above body
            
            // Add weapon
            const weaponGeo = new THREE.BoxGeometry(0.2, 0.2, 1.5);
            const weaponMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
            const weapon = new THREE.Mesh(weaponGeo, weaponMat);
            weapon.position.set(0.6, 0.5, 0.5);
            weapon.rotation.set(0, Math.PI/6, 0);
            
            // Group everything together
            const enemy = new THREE.Group();
            enemy.add(body);
            enemy.add(head);
            enemy.add(weapon);
            
            // Distribute enemies to different biomes
            let distance, angle;
            const biomeChoice = Math.random();
            
            if (biomeChoice < 0.33) {
                // Forest (north)
                angle = Math.random() * Math.PI * 0.8 - Math.PI * 0.4; // -45° to +45°
                distance = 50 + Math.random() * 300;
                enemy.position.z -= 100;
            } else if (biomeChoice < 0.66) {
                // Urban (center)
                angle = Math.random() * Math.PI * 2;
                distance = 10 + Math.random() * 80;
            } else {
                // Desert (south)
                angle = Math.PI + Math.random() * Math.PI * 0.8 - Math.PI * 0.4; // 135° to 225°
                distance = 50 + Math.random() * 300;
                enemy.position.z += 100;
            }
            
            enemy.position.x = Math.cos(angle) * distance;
            enemy.position.y = 1.25;
            enemy.position.z += Math.sin(angle) * distance;
            
            scene.add(enemy);
            enemies.push({
                mesh: enemy,
                health: 100,
                state: 'patrolling', // or 'attacking', 'hiding'
                biome: biomeChoice < 0.33 ? 'forest' : (biomeChoice < 0.66 ? 'urban' : 'desert')
            });
        } catch (error) {
            console.error("Error creating enemy:", error);
        }
    }
    
    console.log(`Created ${enemies.length} enemies`);
}

function setupSpectateTargets() {
    // Reset spectate targets
    spectateTargets = [];
    
    // Add all enemies as potential spectate targets
    enemies.forEach((enemy, index) => {
        spectateTargets.push({
            name: `Enemy ${index + 1}`,
            mesh: enemy.mesh,
            health: enemy.health,
            type: 'enemy'
        });
    });
    
    // Add player as spectate target
    spectateTargets.push({
        name: 'Player',
        mesh: camera,
        health: player.health,
        type: 'player'
    });
    
    // Shuffle array for random spectating
    spectateTargets.sort(() => Math.random() - 0.5);
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
    
    // Add pause menu control
    document.addEventListener('keydown', (event) => {
        if (event.key.toLowerCase() === 'p') {
            togglePauseMenu();
        }
        
        // Add spectate navigation controls
        if (isSpectating) {
            if (event.key === 'ArrowLeft' || event.key === 'a') {
                changeSpectateTarget(-1);
            } else if (event.key === 'ArrowRight' || event.key === 'd') {
                changeSpectateTarget(1);
            }
        }
    });
    
    // Setup pause menu buttons
    document.getElementById('resume-button').addEventListener('click', togglePauseMenu);
    document.getElementById('spectate-button').addEventListener('click', toggleSpectateMode);
    document.getElementById('options-button').addEventListener('click', showOptions);
    document.getElementById('quit-button').addEventListener('click', quitGame);
    
    // Restart button
    document.getElementById('restart').addEventListener('click', restartGame);
}

function togglePauseMenu() {
    isPaused = !isPaused;
    
    const pauseMenu = document.getElementById('pause-menu');
    
    if (isPaused) {
        pauseMenu.classList.add('active');
    } else {
        pauseMenu.classList.remove('active');
        
        // If exiting pause while in spectate mode, exit spectate mode too
        if (isSpectating) {
            toggleSpectateMode();
        }
    }
}

function toggleSpectateMode() {
    isSpectating = !isSpectating;
    
    if (isSpectating) {
        // Enter spectate mode
        document.getElementById('spectate-indicator').classList.add('active');
        document.getElementById('spectate-button').textContent = 'Exit Spectate Mode';
        
        // Store original camera position and rotation
        camera.userData.originalPosition = {
            x: camera.position.x,
            y: camera.position.y,
            z: camera.position.z
        };
        
        // Start spectating first target
        spectateIndex = 0;
        updateSpectateView();
    } else {
        // Exit spectate mode
        document.getElementById('spectate-indicator').classList.remove('active');
        document.getElementById('spectate-button').textContent = 'Spectate Mode';
        
        // Return to original camera position
        if (camera.userData.originalPosition) {
            camera.position.set(
                camera.userData.originalPosition.x,
                camera.userData.originalPosition.y,
                camera.userData.originalPosition.z
            );
        }
    }
}

function changeSpectateTarget(direction) {
    spectateIndex = (spectateIndex + direction + spectateTargets.length) % spectateTargets.length;
    updateSpectateView();
}

function updateSpectateView() {
    // Get current spectate target
    const target = spectateTargets[spectateIndex];
    
    // Update indicator
    document.getElementById('spectate-target').textContent = target.name;
    
    // If it's not the player (since player is the camera itself)
    if (target.type !== 'player') {
        // Position camera near the target
        const targetPosition = target.mesh.position.clone();
        
        // Position camera slightly behind and above the target
        camera.position.set(
            targetPosition.x - 3,
            targetPosition.y + 2,
            targetPosition.z - 3
        );
        
        // Look at the target
        camera.lookAt(targetPosition);
    }
}

function showOptions() {
    // In a full implementation, this would show a detailed options menu
    alert('Options menu would appear here in a full implementation.');
}

function quitGame() {
    if (confirm('Are you sure you want to quit the game?')) {
        // In a real game, this might return to a main menu
        // For this demo, we'll just restart
        restartGame();
        togglePauseMenu();
    }
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
    requestAnimationFrame(animate);
    
    // Always render even if paused to show the scene
    renderer.render(scene, camera);
    
    // Debug information
    if (gameActive && scene.children.length > 0 && scene.children.length < 10) {
        console.log("Warning: Not many objects in scene:", scene.children.length);
    }
    
    // Don't update game logic if paused
    if (!isPaused && gameActive) {
        // Update enemy AI and movements
        updateEnemies();
        
        // Update zone effects
    }
    
    // Update spectate view if in spectate mode
    if (isSpectating) {
        updateSpectateView();
    }
    
    // Render scene
    renderer.render(scene, camera);
}

function updateEnemies() {
    // More sophisticated enemy AI based on biomes
    enemies.forEach(enemy => {
        if (enemy.state === 'patrolling') {
            // Different movement patterns based on biome
            if (Math.random() < 0.02) { // Reduced movement frequency
                const moveAmount = (Math.random() - 0.5) * 2;
                
                switch(enemy.biome) {
                    case 'forest':
                        // Forest enemies move more stealthily
                        enemy.mesh.position.x += moveAmount * 0.7;
                        enemy.mesh.position.z += moveAmount * 0.7;
                        break;
                    case 'urban':
                        // Urban enemies follow roads/structures
                        if (Math.random() > 0.5) {
                            enemy.mesh.position.x += moveAmount;
                        } else {
                            enemy.mesh.position.z += moveAmount;
                        }
                        break;
                    case 'desert':
                        // Desert enemies move faster but less frequently
                        if (Math.random() > 0.7) {
                            enemy.mesh.position.x += moveAmount * 1.5;
                            enemy.mesh.position.z += moveAmount * 1.5;
                        }
                        break;
                }
                
                // Update enemy rotation to face movement direction
                if (moveAmount !== 0) {
                    enemy.mesh.rotation.y = Math.atan2(moveAmount, moveAmount) + Math.PI;
                }
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

// Debugging function to toggle camera position for better visibility
function debugCameraView() {
    camera.position.set(0, 50, 0); // Bird's eye view
    camera.lookAt(0, 0, 0);
    console.log("Debug camera active, moved to overhead position");
}

// Add debug button functionality
window.addEventListener('keydown', function(e) {
    if (e.key === 'd') {
        debugCameraView();
    }
});

// Initialize the game when page loads - with error handling
window.addEventListener('load', function() {
    try {
        init();
        console.log("Game initialized successfully");
    } catch (e) {
        console.error("Error initializing game:", e);
        alert("There was an error loading the game. Check the console for details.");
    }
});
