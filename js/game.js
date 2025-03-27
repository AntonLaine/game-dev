class Game {
    constructor() {
        this.world = null;
        this.player = null;
        this.controls = null;
        this.lastTime = 0;
        this.enemies = [];
        this.npcs = [];
        this.isRunning = false;
        this.enemiesDefeated = 0;
        this.projectiles = [];
        this.sentries = [];
        this.clones = [];
        this.zombies = [];
        this.walls = [];
        this.inAlternateReality = false;
        this.alternateRealityTimer = 0;
        this.normalReality = null;
        this.alternateReality = null;
        
        // DOM elements
        this.characterNameEl = document.getElementById('character-name');
        this.characterRarityEl = document.getElementById('character-rarity');
        this.abilitiesListEl = document.getElementById('abilities-list');
        this.playerHealthBarEl = null;
        this.playerHealthTextEl = null;
        
        // Menu system
        this.menuActive = false;
        this.menuEl = null;
    }
    
    initialize() {
        // Create game world
        this.world = new GameWorld();
        
        // Make game globally accessible
        window.game = this;
        
        // Start with a random character
        this.rollNewCharacter();
        
        // Set up controls
        this.controls = new GameControls(this.world, this.player);
        
        // Add some enemies for testing
        this.addTestEnemies();
        
        // Set up health UI
        this.setupHealthUI();
        
        // Create alternate reality scene
        this.setupAlternateReality();
        
        // Set up game menu
        this.setupGameMenu();
        
        // Add key listener for menu
        window.addEventListener('keydown', (e) => {
            if (e.code === 'KeyM') {
                this.toggleMenu();
            }
        });
        
        // Start the game loop
        this.isRunning = true;
        this.gameLoop();
    }
    
    gameLoop(timestamp = 0) {
        if (!this.isRunning) return;
        
        // Calculate time delta
        const deltaTime = (timestamp - this.lastTime) / 1000;
        this.lastTime = timestamp;
        
        // Update game logic
        this.update(deltaTime);
        
        // Render the scene
        this.world.render();
        
        // Schedule next frame
        requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    update(deltaTime) {
        // Update player
        if (this.player) {
            this.player.update(deltaTime);
            
            // Update ability effects
            if (this.player.abilityEffects) {
                // Handle special animations for certain effects
                this.player.abilityEffects.forEach(effect => {
                    if (effect.mesh && effect.mesh.userData && effect.mesh.userData.animate) {
                        effect.mesh.userData.animate(deltaTime);
                    }
                });
                
                // Remove expired effects
                this.player.abilityEffects = this.player.abilityEffects.filter(effect => {
                    effect.lifetime -= deltaTime;
                    
                    // Scale down effect as it expires
                    if (effect.lifetime < 0.5) {
                        effect.mesh.scale.multiplyScalar(0.95);
                    }
                    
                    // Remove if expired
                    if (effect.lifetime <= 0) {
                        this.world.scene.remove(effect.mesh);
                        return false;
                    }
                    return true;
                });
            }
            
            // Update health UI
            this.updateHealthUI();
        }
        
        // Update controls
        if (this.controls) {
            this.controls.update(deltaTime);
        }
        
        // Update enemies
        this.enemies.forEach(enemy => {
            // Skip update if enemy is frozen by time stop
            if (enemy.timeStopFrozen) return;
            
            enemy.update(deltaTime);
            
            // Simple AI - move towards player if close enough
            if (this.player && this.player.model) {
                const distanceToPlayer = this.calculateDistance(
                    enemy.model.position, 
                    this.player.model.position
                );
                
                if (distanceToPlayer < 20) {
                    // Move towards player
                    const direction = {
                        x: this.player.model.position.x - enemy.model.position.x,
                        z: this.player.model.position.z - enemy.model.position.z
                    };
                    
                    // Normalize
                    const length = Math.sqrt(direction.x * direction.x + direction.z * direction.z);
                    direction.x /= length;
                    direction.z /= length;
                    
                    // Move enemy
                    const enemySpeed = 2 * deltaTime;
                    enemy.model.position.x += direction.x * enemySpeed;
                    enemy.model.position.z += direction.z * enemySpeed;
                    
                    // Rotate to face player
                    enemy.model.rotation.y = Math.atan2(direction.x, direction.z);
                    
                    // Attack if very close
                    if (distanceToPlayer < 2) {
                        enemy.attack(this.player);
                    }
                }
            }
        });
        
        // Update projectiles
        if (this.projectiles) {
            this.projectiles = this.projectiles.filter(projectile => {
                // Move projectile
                projectile.position.addScaledVector(
                    projectile.userData.direction,
                    projectile.userData.speed * deltaTime
                );
                
                // Track distance traveled
                projectile.userData.distanceTraveled += 
                    projectile.userData.speed * deltaTime;
                
                // Check for hitting enemies
                let hit = false;
                
                this.enemies.forEach(enemy => {
                    if (hit || !enemy.model) return;
                    
                    const distance = this.calculateDistance(
                        projectile.position,
                        enemy.model.position
                    );
                    
                    if (distance < 1) { // Hit radius
                        enemy.takeDamage(projectile.userData.damage, projectile.userData.owner);
                        hit = true;
                        this.world.scene.remove(projectile);
                    }
                });
                
                // Remove if max range reached
                if (projectile.userData.distanceTraveled > projectile.userData.range) {
                    this.world.scene.remove(projectile);
                    return false;
                }
                
                return !hit;
            });
        }
        
        // Update sentries
        if (this.sentries) {
            this.sentries = this.sentries.filter(sentry => {
                // Decrease lifetime
                sentry.userData.lifetime -= deltaTime;
                
                // Update cooldown
                sentry.userData.cooldown -= deltaTime;
                
                // Find target and shoot
                if (sentry.userData.cooldown <= 0) {
                    let nearestEnemy = null;
                    let nearestDistance = Infinity;
                    
                    this.enemies.forEach(enemy => {
                        if (!enemy.model) return;
                        
                        const distance = this.calculateDistance(
                            sentry.position,
                            enemy.model.position
                        );
                        
                        if (distance < sentry.userData.range && distance < nearestDistance) {
                            nearestEnemy = enemy;
                            nearestDistance = distance;
                        }
                    });
                    
                    if (nearestEnemy) {
                        // Face enemy
                        sentry.lookAt(nearestEnemy.model.position);
                        
                        // Create projectile
                        const projectile = this.createAbilityEffect('projectile', sentry.position);
                        
                        // Set direction toward enemy
                        const direction = new THREE.Vector3().subVectors(
                            nearestEnemy.model.position,
                            sentry.position
                        ).normalize();
                        
                        // Set projectile data
                        projectile.userData.direction = direction;
                        projectile.userData.speed = 15;
                        projectile.userData.damage = sentry.userData.damage;
                        projectile.userData.owner = sentry.userData.owner;
                        projectile.userData.range = sentry.userData.range;
                        projectile.userData.distanceTraveled = 0;
                        
                        // Add to projectiles
                        if (!this.projectiles) this.projectiles = [];
                        this.projectiles.push(projectile);
                        
                        // Reset cooldown
                        sentry.userData.cooldown = 1 / sentry.userData.fireRate;
                    }
                }
                
                // Remove if expired
                if (sentry.userData.lifetime <= 0) {
                    this.world.scene.remove(sentry);
                    return false;
                }
                
                return true;
            });
        }
        
        // Update alternate reality timer
        if (this.inAlternateReality) {
            this.alternateRealityTimer -= deltaTime;
            
            if (this.alternateRealityTimer <= 0) {
                this.exitAlternateReality();
            }
        }
    }
    
    calculateDistance(pos1, pos2) {
        const dx = pos1.x - pos2.x;
        const dz = pos1.z - pos2.z;
        return Math.sqrt(dx * dx + dz * dz);
    }
    
    addTestEnemies() {
        // Add a few enemies for testing
        for (let i = 0; i < 5; i++) {
            const enemy = CharacterFactory.createCharacter('predictor');
            enemy.name = `Enemy ${i + 1}`;
            
            // Create a simple model for the enemy using cylinder and sphere instead of CapsuleGeometry
            const enemyGroup = new THREE.Group();
            
            // Body
            const bodyGeometry = new THREE.CylinderGeometry(0.5, 0.5, 1.5, 8);
            const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
            const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
            body.position.y = 0.75;
            enemyGroup.add(body);
            
            // Head
            const headGeometry = new THREE.SphereGeometry(0.35, 8, 8);
            const headMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
            const head = new THREE.Mesh(headGeometry, headMaterial);
            head.position.y = 1.75;
            enemyGroup.add(head);
            
            // Position randomly
            const x = (Math.random() - 0.5) * 40;
            const z = (Math.random() - 0.5) * 40;
            enemyGroup.position.set(x, 0, z);
            
            // Add to scene
            this.world.scene.add(enemyGroup);
            enemy.model = enemyGroup;
            
            this.enemies.push(enemy);
        }
    }
    
    rollNewCharacter() {
        const oldPlayer = this.player;
        
        // Create a new random character
        this.player = CharacterFactory.rollCharacter();
        
        // Create a 3D model for the player
        const playerGroup = new THREE.Group();
        
        // Body (cylinder)
        const bodyGeometry = new THREE.CylinderGeometry(0.5, 0.5, 1.5, 8);
        
        // Color based on rarity
        let color;
        switch(this.player.rarity) {
            case 'common': color = 0xb0b0b0; break;
            case 'rare': color = 0x4a90e2; break;
            case 'epic': color = 0x9b59b6; break;
            case 'legendary': color = 0xf1c40f; break;
            default: color = 0xffffff;
        }
        
        const bodyMaterial = new THREE.MeshStandardMaterial({ color: color });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.75; // Center the cylinder
        playerGroup.add(body);
        
        // Head (sphere)
        const headGeometry = new THREE.SphereGeometry(0.35, 8, 8);
        const headMaterial = new THREE.MeshStandardMaterial({ color: color });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 1.75; // Position on top of the body
        playerGroup.add(head);
        
        // Position the player
        if (oldPlayer && oldPlayer.model) {
            // Keep the same position as the previous character
            playerGroup.position.copy(oldPlayer.model.position);
            playerGroup.rotation.copy(oldPlayer.model.rotation);
            this.world.scene.remove(oldPlayer.model);
        } else {
            // Initial position
            playerGroup.position.set(0, 0, 0);
        }
        
        // Add to scene
        this.world.scene.add(playerGroup);
        this.player.model = playerGroup;
        
        // Add ability effects container
        this.player.abilityEffects = [];
        
        // Update controls to use the new player
        if (this.controls) {
            this.controls.player = this.player;
        }
        
        // Update UI
        this.updateCharacterUI();
    }
    
    setupHealthUI() {
        // Create health bar container
        const healthContainer = document.createElement('div');
        healthContainer.style.position = 'absolute';
        healthContainer.style.bottom = '20px';
        healthContainer.style.left = '20px';
        healthContainer.style.width = '200px';
        healthContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        healthContainer.style.borderRadius = '5px';
        healthContainer.style.padding = '5px';
        
        // Create health bar
        this.playerHealthBarEl = document.createElement('div');
        this.playerHealthBarEl.style.width = '100%';
        this.playerHealthBarEl.style.height = '20px';
        this.playerHealthBarEl.style.backgroundColor = '#2ecc71';
        
        // Create health text
        this.playerHealthTextEl = document.createElement('div');
        this.playerHealthTextEl.style.position = 'absolute';
        this.playerHealthTextEl.style.top = '50%';
        this.playerHealthTextEl.style.left = '50%';
        this.playerHealthTextEl.style.transform = 'translate(-50%, -50%)';
        this.playerHealthTextEl.style.color = 'white';
        this.playerHealthTextEl.style.fontWeight = 'bold';
        this.playerHealthTextEl.style.textShadow = '1px 1px 1px black';
        
        healthContainer.appendChild(this.playerHealthBarEl);
        healthContainer.appendChild(this.playerHealthTextEl);
        document.getElementById('game-container').appendChild(healthContainer);
    }
    
    updateHealthUI() {
        if (!this.player || !this.playerHealthBarEl || !this.playerHealthTextEl) return;
        
        // Update health bar width
        const healthPercent = Math.max(0, Math.min(100, (this.player.health / this.player.maxHealth) * 100));
        this.playerHealthBarEl.style.width = `${healthPercent}%`;
        
        // Update bar color based on health
        let backgroundColor;
        if (healthPercent > 60) {
            backgroundColor = '#2ecc71'; // Green
        } else if (healthPercent > 30) {
            backgroundColor = '#f39c12'; // Orange
        } else {
            backgroundColor = '#e74c3c'; // Red
        }
        this.playerHealthBarEl.style.backgroundColor = backgroundColor;
        
        // Update text
        this.playerHealthTextEl.textContent = `${Math.ceil(this.player.health)}/${this.player.maxHealth}`;
    }
    
    updateCharacterUI() {
        if (!this.player) return;
        
        // Update name and rarity
        this.characterNameEl.textContent = this.player.name;
        this.characterRarityEl.textContent = `Rarity: ${this.player.rarity.charAt(0).toUpperCase() + this.player.rarity.slice(1)}`;
        this.characterRarityEl.className = `rarity-${this.player.rarity}`;
        
        // Clear and update abilities list
        this.abilitiesListEl.innerHTML = '';
        this.player.abilities.forEach(ability => {
            const li = document.createElement('li');
            li.textContent = `${ability.name}: ${ability.description} (Cooldown: ${ability.cooldown}s)`;
            this.abilitiesListEl.appendChild(li);
        });
    }
    
    setupAlternateReality() {
        // Store reference to normal reality
        this.normalReality = {
            scene: this.world.scene,
            skyColor: 0x87ceeb // Normal sky blue
        };
        
        // Create alternate scene
        const alternateScene = new THREE.Scene();
        
        // Lighting for alternate reality
        const ambientLight = new THREE.AmbientLight(0x662222);
        alternateScene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xff7777, 1);
        directionalLight.position.set(1, 1, 1);
        alternateScene.add(directionalLight);
        
        // Create ground (purple)
        const groundGeometry = new THREE.PlaneGeometry(100, 100);
        const groundMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x550055,
            side: THREE.DoubleSide
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        alternateScene.add(ground);
        
        // Add distorted trees
        for (let i = 0; i < 30; i++) {
            const x = (Math.random() - 0.5) * 90;
            const z = (Math.random() - 0.5) * 90;
            
            // Distorted tree
            const trunk = new THREE.Mesh(
                new THREE.CylinderGeometry(0.3, 0.3, 3, true),
                new THREE.MeshStandardMaterial({ color: 0x441100 })
            );
            
            // Distort trunk
            const trunkGeometry = trunk.geometry;
            const trunkVertices = trunkGeometry.attributes.position.array;
            
            for (let i = 0; i < trunkVertices.length; i += 3) {
                const xDisplacement = (Math.random() - 0.5) * 0.2;
                const zDisplacement = (Math.random() - 0.5) * 0.2;
                trunkVertices[i] += xDisplacement;
                trunkVertices[i+2] += zDisplacement;
            }
            
            // Strange foliage
            const foliage = new THREE.Mesh(
                new THREE.ConeGeometry(1, 1.5, 8),
                new THREE.MeshStandardMaterial({ color: 0x990066 })
            );
            foliage.position.y = 1.5;
            trunk.add(foliage);
            trunk.position.set(x, 1.5, z);
            
            alternateScene.add(trunk);
        }
        
        // Store reference to alternate reality
        this.alternateReality = {
            scene: alternateScene,
            skyColor: 0x330011 // Dark red sky
        };
    }
    
    enterAlternateReality(duration = 10) {
        if (this.inAlternateReality) return;
        
        console.log("Entering alternate reality...");
        this.inAlternateReality = true;
        this.alternateRealityTimer = duration;
        
        // Save player and enemies from normal reality
        const playerModel = this.player.model;
        this.normalReality.scene.remove(playerModel);
        this.alternateReality.scene.add(playerModel);
        
        // Transfer needed objects from normal to alternate reality
        this.enemies.forEach(enemy => {
            if (enemy.model) {
                const enemyPosition = enemy.model.position.clone();
                const distanceToPlayer = this.calculateDistance(
                    this.player.model.position, 
                    enemyPosition
                );
                
                // Only bring enemies within a certain range
                if (distanceToPlayer < 15) {
                    enemy.inAlternateReality = true;
                    this.normalReality.scene.remove(enemy.model);
                    this.alternateReality.scene.add(enemy.model);
                    
                    // Weaken enemies in alternate reality
                    enemy.originalHealth = enemy.health;
                    enemy.health = Math.floor(enemy.health * 0.5);
                }
            }
        });
        
        // Swap scenes
        this.world.scene = this.alternateReality.scene;
        this.world.renderer.setClearColor(this.alternateReality.skyColor);
        
        // Visual effect for entering alternate reality
        const portalEffect = this.createAbilityEffect('portal', this.player.model.position);
        portalEffect.scale.set(5, 5, 5);
        
        // Boost player stats in alternate reality
        this.player.originalAttackPower = this.player.attackPower || 1;
        this.player.originalDefense = this.player.defense || 1;
        this.player.attackPower = this.player.attackPower * 10 || 10;
        this.player.defense = this.player.defense * 5 || 5;
    }
    
    exitAlternateReality() {
        if (!this.inAlternateReality) return;
        
        console.log("Exiting alternate reality...");
        this.inAlternateReality = false;
        
        // Transfer player back to normal reality
        const playerModel = this.player.model;
        this.alternateReality.scene.remove(playerModel);
        this.normalReality.scene.add(playerModel);
        
        // Return enemies that were brought to alternate reality
        this.enemies.forEach(enemy => {
            if (enemy.inAlternateReality && enemy.model) {
                this.alternateReality.scene.remove(enemy.model);
                this.normalReality.scene.add(enemy.model);
                enemy.inAlternateReality = false;
                
                // Restore original health
                if (enemy.originalHealth) {
                    enemy.health = enemy.originalHealth;
                    delete enemy.originalHealth;
                }
            }
        });
        
        // Swap scenes back
        this.world.scene = this.normalReality.scene;
        this.world.renderer.setClearColor(this.normalReality.skyColor);
        
        // Reset player stats
        if (this.player.originalAttackPower) {
            this.player.attackPower = this.player.originalAttackPower;
            delete this.player.originalAttackPower;
        }
        if (this.player.originalDefense) {
            this.player.defense = this.player.originalDefense;
            delete this.player.originalDefense;
        }
        
        // Visual effect for exiting alternate reality
        const portalEffect = this.createAbilityEffect('portal', this.player.model.position);
        portalEffect.scale.set(5, 5, 5);
    }

    setupGameMenu() {
        // Create menu container
        const menuContainer = document.createElement('div');
        menuContainer.id = 'game-menu';
        menuContainer.className = 'hidden';
        menuContainer.style.position = 'absolute';
        menuContainer.style.top = '50%';
        menuContainer.style.left = '50%';
        menuContainer.style.transform = 'translate(-50%, -50%)';
        menuContainer.style.width = '400px';
        menuContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        menuContainer.style.borderRadius = '10px';
        menuContainer.style.padding = '20px';
        menuContainer.style.color = 'white';
        menuContainer.style.zIndex = '1000';
        
        // Create menu title
        const menuTitle = document.createElement('h2');
        menuTitle.textContent = 'Game Menu';
        menuTitle.style.textAlign = 'center';
        menuTitle.style.marginBottom = '20px';
        menuContainer.appendChild(menuTitle);
        
        // Create character selection section
        const characterSection = document.createElement('div');
        characterSection.style.marginBottom = '20px';
        
        const characterTitle = document.createElement('h3');
        characterTitle.textContent = 'Select Character';
        characterSection.appendChild(characterTitle);
        
        const characterButtonContainer = document.createElement('div');
        characterButtonContainer.style.display = 'grid';
        characterButtonContainer.style.gridTemplateColumns = 'repeat(2, 1fr)';
        characterButtonContainer.style.gap = '10px';
        
        // Add character buttons
        const characters = [
            { name: 'Speedster', type: 'speedster', rarity: 'common' },
            { name: 'Predictor', type: 'predictor', rarity: 'common' },
            { name: 'Gun Manipulator', type: 'gunManipulator', rarity: 'rare' },
            { name: 'Cloner', type: 'cloner', rarity: 'rare' },
            { name: 'Necromancer', type: 'necromancer', rarity: 'epic' },
            { name: 'Magnet', type: 'magnet', rarity: 'epic' },
            { name: 'Reality Controller', type: 'realityController', rarity: 'legendary' },
            { name: 'Chrono', type: 'chrono', rarity: 'legendary' }
        ];
        
        characters.forEach(char => {
            const button = document.createElement('button');
            button.textContent = char.name;
            button.className = `rarity-${char.rarity}`;
            button.style.padding = '8px';
            button.style.border = 'none';
            button.style.borderRadius = '5px';
            button.style.backgroundColor = '#4a6fa5';
            button.style.color = 'white';
            button.style.cursor = 'pointer';
            
            button.addEventListener('click', () => {
                this.selectCharacter(char.type);
                this.toggleMenu();
            });
            
            characterButtonContainer.appendChild(button);
        });
        
        characterSection.appendChild(characterButtonContainer);
        menuContainer.appendChild(characterSection);
        
        // Create enemy spawning section
        const enemySection = document.createElement('div');
        
        const enemyTitle = document.createElement('h3');
        enemyTitle.textContent = 'Spawn Enemy';
        enemySection.appendChild(enemyTitle);
        
        const enemyButtonContainer = document.createElement('div');
        enemyButtonContainer.style.display = 'grid';
        enemyButtonContainer.style.gridTemplateColumns = 'repeat(2, 1fr)';
        enemyButtonContainer.style.gap = '10px';
        
        // Add enemy buttons (using same types as characters)
        characters.forEach(char => {
            const button = document.createElement('button');
            button.textContent = `Spawn ${char.name}`;
            button.className = `rarity-${char.rarity}`;
            button.style.padding = '8px';
            button.style.border = 'none';
            button.style.borderRadius = '5px';
            button.style.backgroundColor = '#a54a4a';
            button.style.color = 'white';
            button.style.cursor = 'pointer';
            
            button.addEventListener('click', () => {
                this.spawnEnemy(char.type);
            });
            
            enemyButtonContainer.appendChild(button);
        });
        
        enemySection.appendChild(enemyButtonContainer);
        menuContainer.appendChild(enemySection);
        
        // Create close button
        const closeButton = document.createElement('button');
        closeButton.textContent = 'Close Menu';
        closeButton.style.display = 'block';
        closeButton.style.margin = '20px auto 0';
        closeButton.style.padding = '10px 20px';
        closeButton.style.backgroundColor = '#555';
        closeButton.style.color = 'white';
        closeButton.style.border = 'none';
        closeButton.style.borderRadius = '5px';
        closeButton.style.cursor = 'pointer';
        
        closeButton.addEventListener('click', () => {
            this.toggleMenu();
        });
        
        menuContainer.appendChild(closeButton);
        
        // Add menu to DOM
        document.getElementById('game-container').appendChild(menuContainer);
        
        // Store reference to menu element
        this.menuEl = menuContainer;
    }
    
    toggleMenu() {
        if (this.menuActive) {
            // Hide menu
            this.menuEl.classList.add('hidden');
            this.menuActive = false;
            this.isRunning = true; // Resume game
        } else {
            // Show menu
            this.menuEl.classList.remove('hidden');
            this.menuActive = true;
            this.isRunning = false; // Pause game while in menu
        }
    }
    
    selectCharacter(type) {
        const oldPlayer = this.player;
        
        // Create new character of specified type
        this.player = CharacterFactory.createCharacter(type);
        
        // Create a 3D model for the player (same as in rollNewCharacter method)
        const playerGroup = new THREE.Group();
        
        // Body (cylinder)
        const bodyGeometry = new THREE.CylinderGeometry(0.5, 0.5, 1.5, 8);
        
        // Color based on rarity
        let color;
        switch(this.player.rarity) {
            case 'common': color = 0xb0b0b0; break;
            case 'rare': color = 0x4a90e2; break;
            case 'epic': color = 0x9b59b6; break;
            case 'legendary': color = 0xf1c40f; break;
            default: color = 0xffffff;
        }
        
        const bodyMaterial = new THREE.MeshStandardMaterial({ color: color });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.75; // Center the cylinder
        playerGroup.add(body);
        
        // Head (sphere)
        const headGeometry = new THREE.SphereGeometry(0.35, 8, 8);
        const headMaterial = new THREE.MeshStandardMaterial({ color: color });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 1.75; // Position on top of the body
        playerGroup.add(head);
        
        // Position the player
        if (oldPlayer && oldPlayer.model) {
            // Keep the same position as the previous character
            playerGroup.position.copy(oldPlayer.model.position);
            playerGroup.rotation.copy(oldPlayer.model.rotation);
            this.world.scene.remove(oldPlayer.model);
        } else {
            // Initial position
            playerGroup.position.set(0, 0, 0);
        }
        
        // Add to scene
        this.world.scene.add(playerGroup);
        this.player.model = playerGroup;
        
        // Add ability effects container
        this.player.abilityEffects = [];
        
        // Update controls to use the new player
        if (this.controls) {
            this.controls.player = this.player;
        }
        
        // Update UI
        this.updateCharacterUI();
    }
    
    spawnEnemy(type) {
        // Create enemy
        const enemy = CharacterFactory.createCharacter(type);
        enemy.name = `${type.charAt(0).toUpperCase() + type.slice(1)} Enemy`;
        
        // Create model based on same code from addTestEnemies
        const enemyGroup = new THREE.Group();
        
        // Color based on rarity
        let color;
        switch(enemy.rarity) {
            case 'common': color = 0xff6666; break; // Red
            case 'rare': color = 0x6666ff; break; // Blue
            case 'epic': color = 0xcc66ff; break; // Purple
            case 'legendary': color = 0xffcc00; break; // Gold
            default: color = 0xff0000;
        }
        
        // Body
        const bodyGeometry = new THREE.CylinderGeometry(0.5, 0.5, 1.5, 8);
        const bodyMaterial = new THREE.MeshStandardMaterial({ color });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.75;
        enemyGroup.add(body);
        
        // Head
        const headGeometry = new THREE.SphereGeometry(0.35, 8, 8);
        const headMaterial = new THREE.MeshStandardMaterial({ color });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 1.75;
        enemyGroup.add(head);
        
        // Position near player
        if (this.player && this.player.model) {
            const distance = 10; // 10 units away from player
            const angle = Math.random() * Math.PI * 2; // Random angle
            
            const x = this.player.model.position.x + Math.sin(angle) * distance;
            const z = this.player.model.position.z + Math.cos(angle) * distance;
            
            enemyGroup.position.set(x, 0, z);
            
            // Make enemy face player
            enemyGroup.lookAt(this.player.model.position);
        } else {
            // Random position if no player
            const x = (Math.random() - 0.5) * 40;
            const z = (Math.random() - 0.5) * 40;
            enemyGroup.position.set(x, 0, z);
        }
        
        // Add to scene
        this.world.scene.add(enemyGroup);
        enemy.model = enemyGroup;
        
        // Add to enemies array
        this.enemies.push(enemy);
    }
    
    worldToScreen(worldPosition) {
        // Convert a 3D world position to 2D screen coordinates
        const vector = new THREE.Vector3(worldPosition.x, worldPosition.y, worldPosition.z);
        vector.project(this.world.camera);
        
        const widthHalf = window.innerWidth / 2;
        const heightHalf = window.innerHeight / 2;
        
        return {
            x: (vector.x * widthHalf) + widthHalf,
            y: -(vector.y * heightHalf) + heightHalf
        };
    }
    
    createDamageNumber(amount, position) {
        // Create a div for the damage number
        const damageEl = document.createElement('div');
        damageEl.textContent = Math.ceil(amount);
        damageEl.style.position = 'absolute';
        damageEl.style.color = '#ff3333';
        damageEl.style.fontWeight = 'bold';
        damageEl.style.fontSize = '24px';
        damageEl.style.textShadow = '2px 2px 2px #000';
        damageEl.style.pointerEvents = 'none';
        
        // Convert 3D position to screen position
        const screenPos = this.worldToScreen(position);
        damageEl.style.left = `${screenPos.x}px`;
        damageEl.style.top = `${screenPos.y}px`;
        
        // Add to DOM
        document.body.appendChild(damageEl);
        
        // Animate
        let offset = 0;
        const interval = setInterval(() => {
            offset -= 1;
            damageEl.style.top = `${screenPos.y + offset}px`;
            damageEl.style.opacity = (1 + offset / 50).toString();
            
            if (offset < -50) {
                clearInterval(interval);
                document.body.removeChild(damageEl);
            }
        }, 20);
    }
    
    createHealingNumber(amount, position) {
        // Similar to damage number but green
        const healEl = document.createElement('div');
        healEl.textContent = `+${Math.ceil(amount)}`;
        healEl.style.position = 'absolute';
        healEl.style.color = '#33ff33';
        healEl.style.fontWeight = 'bold';
        healEl.style.fontSize = '24px';
        healEl.style.textShadow = '2px 2px 2px #000';
        healEl.style.pointerEvents = 'none';
        
        // Convert 3D position to screen position
        const screenPos = this.worldToScreen(position);
        healEl.style.left = `${screenPos.x}px`;
        healEl.style.top = `${screenPos.y}px`;
        
        // Add to DOM
        document.body.appendChild(healEl);
        
        // Animate
        let offset = 0;
        const interval = setInterval(() => {
            offset -= 1;
            healEl.style.top = `${screenPos.y + offset}px`;
            healEl.style.opacity = (1 + offset / 50).toString();
            
            if (offset < -50) {
                clearInterval(interval);
                document.body.removeChild(healEl);
            }
        }, 20);
    }
    
    createBeamEffect(startPosition, endPosition, color = 0xffffff) {
        // Create a beam connecting two points
        const direction = new THREE.Vector3().subVectors(endPosition, startPosition);
        const distance = direction.length();
        direction.normalize();
        
        const beamGeometry = new THREE.CylinderGeometry(0.1, 0.1, distance, 8);
        beamGeometry.applyMatrix4(new THREE.Matrix4().makeRotationX(Math.PI / 2));
        
        const beamMaterial = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.7
        });
        
        const beam = new THREE.Mesh(beamGeometry, beamMaterial);
        
        // Position and orient
        beam.position.copy(startPosition);
        beam.position.addScaledVector(direction, distance / 2);
        beam.lookAt(endPosition);
        
        // Add to scene
        this.world.scene.add(beam);
        
        // Auto-remove after delay
        setTimeout(() => {
            this.world.scene.remove(beam);
        }, 1000);
        
        return beam;
    }
    
    createLifestealBeam(startPosition, endPosition) {
        // Similar to beam but with red particles
        const beam = this.createBeamEffect(startPosition, endPosition, 0xff3333);
        
        // Add particles
        const particleCount = 20;
        const particleGeometry = new THREE.SphereGeometry(0.1, 8, 8);
        const particleMaterial = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            transparent: true,
            opacity: 0.8
        });
        
        for (let i = 0; i < particleCount; i++) {
            // Position along the beam
            const t = Math.random();
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            particle.position.copy(startPosition);
            particle.position.lerp(endPosition, t);
            
            // Add some randomness
            particle.position.x += (Math.random() - 0.5) * 0.5;
            particle.position.y += (Math.random() - 0.5) * 0.5;
            particle.position.z += (Math.random() - 0.5) * 0.5;
            
            // Add to scene
            this.world.scene.add(particle);
            
            // Animate toward the end position
            const animateParticle = () => {
                particle.position.lerp(endPosition, 0.1);
                
                if (this.calculateDistance(particle.position, endPosition) > 0.2) {
                    requestAnimationFrame(animateParticle);
                } else {
                    this.world.scene.remove(particle);
                }
            };
            
            animateParticle();
        }
        
        return beam;
    }
    
    createAbilityEffect(type, position) {
        let geometry, material, mesh;
        
        switch(type) {
            case 'dash':
                // Create a trail effect for dash
                geometry = new THREE.ConeGeometry(0.2, 2, 8);
                material = new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.6 });
                mesh = new THREE.Mesh(geometry, material);
                mesh.position.copy(position);
                mesh.rotation.x = Math.PI / 2;
                break;
                
            case 'barrage':
                // Create multiple small spheres for barrage
                geometry = new THREE.SphereGeometry(0.15, 8, 8);
                material = new THREE.MeshBasicMaterial({ color: 0xff6600, transparent: true, opacity: 0.8 });
                mesh = new THREE.Mesh(geometry, material);
                
                // Random position near the player
                mesh.position.set(
                    position.x + (Math.random() - 0.5) * 2,
                    position.y + Math.random() * 1.5,
                    position.z + (Math.random() - 0.5) * 2
                );
                break;
                
            case 'counter':
                // Shield effect for counter
                geometry = new THREE.SphereGeometry(1.2, 16, 16);
                material = new THREE.MeshBasicMaterial({ 
                    color: 0x0088ff, 
                    transparent: true, 
                    opacity: 0.4,
                    wireframe: true
                });
                mesh = new THREE.Mesh(geometry, material);
                mesh.position.copy(position);
                mesh.position.y += 1;
                break;
                
            case 'explosion':
                // Explosion effect
                geometry = new THREE.SphereGeometry(2, 16, 16);
                material = new THREE.MeshBasicMaterial({ 
                    color: 0xff4400, 
                    transparent: true, 
                    opacity: 0.7
                });
                mesh = new THREE.Mesh(geometry, material);
                mesh.position.copy(position);
                mesh.position.y += 0.5;
                break;
                
            case 'zombie':
                // Simple zombie figure
                const zombieGroup = new THREE.Group();
                
                // Body
                const bodyGeom = new THREE.CylinderGeometry(0.3, 0.3, 1.2, 8);
                const bodyMat = new THREE.MeshBasicMaterial({ color: 0x669966 });
                const body = new THREE.Mesh(bodyGeom, bodyMat);
                body.position.y = 0.6;
                zombieGroup.add(body);
                
                // Head
                const headGeom = new THREE.SphereGeometry(0.25, 8, 8);
                const headMat = new THREE.MeshBasicMaterial({ color: 0x669966 });
                const head = new THREE.Mesh(headGeom, headMat);
                head.position.y = 1.3;
                zombieGroup.add(head);
                
                mesh = zombieGroup;
                
                // Position zombie
                mesh.position.set(
                    position.x + (Math.random() - 0.5) * 5,
                    position.y,
                    position.z + (Math.random() - 0.5) * 5
                );
                break;
                
            case 'teleport':
                // Teleport effect (particle burst)
                geometry = new THREE.RingGeometry(0.5, 2, 16);
                material = new THREE.MeshBasicMaterial({ 
                    color: 0x8800ff, 
                    transparent: true, 
                    opacity: 0.8,
                    side: THREE.DoubleSide
                });
                mesh = new THREE.Mesh(geometry, material);
                mesh.position.copy(position);
                mesh.rotation.x = Math.PI / 2;
                break;
                
            case 'timestop':
                // Time stop effect (large sphere)
                geometry = new THREE.SphereGeometry(8, 32, 32);
                material = new THREE.MeshBasicMaterial({ 
                    color: 0xaaffff, 
                    transparent: true, 
                    opacity: 0.15,
                    wireframe: true
                });
                mesh = new THREE.Mesh(geometry, material);
                mesh.position.copy(position);
                break;
                
            case 'portal':
                // Portal effect for alternate reality
                const portalGroup = new THREE.Group();
                
                // Outer ring
                const outerRing = new THREE.Mesh(
                    new THREE.RingGeometry(3, 3.5, 32),
                    new THREE.MeshBasicMaterial({
                        color: 0xff00ff,
                        side: THREE.DoubleSide,
                        transparent: true,
                        opacity: 0.7
                    })
                );
                outerRing.rotation.x = Math.PI / 2;
                portalGroup.add(outerRing);
                
                // Inner spiral
                const spiralGeometry = new THREE.BufferGeometry();
                const spiralVertices = [];
                const spiralColors = [];
                
                const spiralColor1 = new THREE.Color(0xff00ff);
                const spiralColor2 = new THREE.Color(0x00ffff);
                
                for (let i = 0; i < 500; i++) {
                    const t = i / 500;
                    const angle = t * Math.PI * 20;
                    const radius = 3 * (1 - t);
                    
                    const x = radius * Math.cos(angle);
                    const y = (t - 0.5) * 2;
                    const z = radius * Math.sin(angle);
                    
                    spiralVertices.push(x, y, z);
                    
                    const color = new THREE.Color().lerpColors(spiralColor1, spiralColor2, t);
                    spiralColors.push(color.r, color.g, color.b);
                }
                
                spiralGeometry.setAttribute('position', new THREE.Float32BufferAttribute(spiralVertices, 3));
                spiralGeometry.setAttribute('color', new THREE.Float32BufferAttribute(spiralColors, 3));
                
                const spiralMaterial = new THREE.PointsMaterial({
                    size: 0.1,
                    vertexColors: true,
                    transparent: true,
                    opacity: 0.8
                });
                
                const spiral = new THREE.Points(spiralGeometry, spiralMaterial);
                portalGroup.add(spiral);
                
                mesh = portalGroup;
                mesh.position.copy(position);
                mesh.position.y += 1;
                break;
                
            case 'projectile':
                // Projectile effect
                geometry = new THREE.SphereGeometry(0.2, 8, 8);
                material = new THREE.MeshBasicMaterial({ 
                    color: 0x00ffaa, 
                    transparent: true, 
                    opacity: 0.8
                });
                mesh = new THREE.Mesh(geometry, material);
                mesh.position.copy(position);
                break;
                
            case 'sentry':
                // Sentry gun
                const sentryGroup = new THREE.Group();
                
                // Base
                const baseGeom = new THREE.CylinderGeometry(0.5, 0.5, 0.2, 8);
                const baseMat = new THREE.MeshBasicMaterial({ color: 0x444444 });
                const base = new THREE.Mesh(baseGeom, baseMat);
                sentryGroup.add(base);
                
                // Turret
                const turretGeom = new THREE.BoxGeometry(0.3, 0.3, 0.8);
                const turretMat = new THREE.MeshBasicMaterial({ color: 0x666666 });
                const turret = new THREE.Mesh(turretGeom, turretMat);
                turret.position.y = 0.3;
                sentryGroup.add(turret);
                
                // Gun barrel
                const barrelGeom = new THREE.CylinderGeometry(0.05, 0.05, 0.5, 8);
                const barrelMat = new THREE.MeshBasicMaterial({ color: 0x222222 });
                const barrel = new THREE.Mesh(barrelGeom, barrelMat);
                barrel.rotation.x = Math.PI / 2;
                barrel.position.set(0, 0.3, 0.5);
                sentryGroup.add(barrel);
                
                mesh = sentryGroup;
                mesh.position.copy(position);
                break;
                
            case 'clone':
                // Clone - similar to player but transparent
                const cloneGroup = new THREE.Group();
                
                // Body
                const cloneBodyGeom = new THREE.CylinderGeometry(0.5, 0.5, 1.5, 8);
                const cloneBodyMat = new THREE.MeshBasicMaterial({ 
                    color: 0xaaaaff,
                    transparent: true,
                    opacity: 0.7
                });
                const cloneBody = new THREE.Mesh(cloneBodyGeom, cloneBodyMat);
                cloneBody.position.y = 0.75;
                cloneGroup.add(cloneBody);
                
                // Head
                const cloneHeadGeom = new THREE.SphereGeometry(0.35, 8, 8);
                const cloneHeadMat = new THREE.MeshBasicMaterial({ 
                    color: 0xaaaaff,
                    transparent: true,
                    opacity: 0.7
                });
                const cloneHead = new THREE.Mesh(cloneHeadGeom, cloneHeadMat);
                cloneHead.position.y = 1.75;
                cloneGroup.add(cloneHead);
                
                mesh = cloneGroup;
                mesh.position.copy(position);
                break;
                
            case 'metalwall':
                // Metal wall
                const wallGeom = new THREE.BoxGeometry(5, 3, 0.3);
                const wallMat = new THREE.MeshBasicMaterial({ 
                    color: 0x888888,
                    transparent: false,
                    metalness: 0.8,       
                    roughness: 0.2
                });
                mesh = new THREE.Mesh(wallGeom, wallMat);
                mesh.position.copy(position);
                mesh.position.y = 1.5;
                break;
                
            case 'dragon':
                // Improved Reality Dragon
                const dragonGroup = new THREE.Group();
                
                // Dragon body
                const dragonBodyGeometry = new THREE.CylinderGeometry(1, 0.7, 5, 8);
                const dragonBodyMaterial = new THREE.MeshStandardMaterial({ 
                    color: 0x220066,
                    emissive: 0x110033,
                    metalness: 0.7,
                    roughness: 0.3
                });
                const dragonBody = new THREE.Mesh(dragonBodyGeometry, dragonBodyMaterial);
                dragonBody.rotation.x = Math.PI / 2; // Horizontal orientation
                dragonGroup.add(dragonBody);
                
                // Dragon head
                const dragonHeadGeometry = new THREE.ConeGeometry(1.2, 2.5, 8);
                const dragonHeadMaterial = new THREE.MeshStandardMaterial({ 
                    color: 0x330099,
                    emissive: 0x220066,
                    metalness: 0.7,
                    roughness: 0.3
                });
                const dragonHead = new THREE.Mesh(dragonHeadGeometry, dragonHeadMaterial);
                dragonHead.position.set(0, 0, -3.5); // Position at front of body
                dragonHead.rotation.x = -Math.PI / 2; // Orient correctly
                dragonGroup.add(dragonHead);
                
                // Dragon eyes (glowing)
                const eyeGeometry = new THREE.SphereGeometry(0.2, 8, 8);
                const eyeMaterial = new THREE.MeshBasicMaterial({ 
                    color: 0xff0000,
                    emissive: 0xff0000
                });
                const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
                leftEye.position.set(0.4, 0.5, -4);
                dragonGroup.add(leftEye);
                
                const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
                rightEye.position.set(-0.4, 0.5, -4);
                dragonGroup.add(rightEye);
                
                // Dragon wings
                const wingGeometry = new THREE.BufferGeometry();
                const wingPoints = [
                    new THREE.Vector3(0, 0, -2),    // Wing base
                    new THREE.Vector3(3, 0, -1),    // Wing tip
                    new THREE.Vector3(2, 0, -3),    // Back edge
                    new THREE.Vector3(1.5, 0, -1.5) // Extra point for shape
                ];
                wingGeometry.setFromPoints(wingPoints);
                wingGeometry.setIndex([0, 1, 3, 0, 3, 2, 1, 2, 3]); // Triangulate
                
                const wingMaterial = new THREE.MeshStandardMaterial({
                    color: 0x6600ff,
                    side: THREE.DoubleSide,
                    transparent: true,
                    opacity: 0.7
                });
                
                const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
                rightWing.position.y = 0.5;
                dragonGroup.add(rightWing);
                
                const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
                leftWing.scale.x = -1; // Mirror for left side
                leftWing.position.y = 0.5;
                dragonGroup.add(leftWing);
                
                // Dragon tail
                const tailGeometry = new THREE.CylinderGeometry(0.4, 0.1, 4, 8);
                const tailMaterial = new THREE.MeshStandardMaterial({ 
                    color: 0x220066,
                    emissive: 0x110033,
                });
                const tail = new THREE.Mesh(tailGeometry, tailMaterial);
                tail.position.set(0, 0, 3); // Back of body
                tail.rotation.x = Math.PI / 2;
                dragonGroup.add(tail);
                
                // Energy aura effect
                const auraGeometry = new THREE.SphereGeometry(3, 16, 16);
                const auraMaterial = new THREE.MeshBasicMaterial({
                    color: 0x6600ff,
                    transparent: true,
                    opacity: 0.2,
                    wireframe: true
                });
                const aura = new THREE.Mesh(auraGeometry, auraMaterial);
                dragonGroup.add(aura);
                
                // Add some particles for magical effect
                const particlesGeometry = new THREE.BufferGeometry();
                const particleCount = 100;
                const particlePositions = new Float32Array(particleCount * 3);
                const particleColors = new Float32Array(particleCount * 3);
                
                for (let i = 0; i < particleCount; i++) {
                    // Random position around dragon
                    const radius = 2 + Math.random() * 2;
                    const theta = Math.random() * Math.PI * 2;
                    const phi = Math.random() * Math.PI;
                    
                    particlePositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
                    particlePositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
                    particlePositions[i * 3 + 2] = radius * Math.cos(phi);
                    
                    // Random color between purple and blue
                    const t = Math.random();
                    particleColors[i * 3] = 0.4 + 0.2 * t; // Red
                    particleColors[i * 3 + 1] = 0; // Green
                    particleColors[i * 3 + 2] = 0.8 + 0.2 * t; // Blue
                }
                
                particlesGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
                particlesGeometry.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));
                
                const particlesMaterial = new THREE.PointsMaterial({
                    size: 0.1,
                    vertexColors: true,
                    transparent: true,
                    opacity: 0.8
                });
                
                const particles = new THREE.Points(particlesGeometry, particlesMaterial);
                dragonGroup.add(particles);
                
                // Animation function for dragon
                dragonGroup.userData.animate = (deltaTime) => {
                    // Wing flapping
                    const time = Date.now() * 0.001;
                    rightWing.rotation.z = Math.sin(time * 2) * 0.2;
                    leftWing.rotation.z = -Math.sin(time * 2) * 0.2;
                    
                    // Body hovering
                    dragonGroup.position.y = Math.sin(time) * 0.2 + 3;
                    
                    // Tail swaying
                    tail.rotation.z = Math.sin(time * 0.5) * 0.2;
                    
                    // Rotate aura
                    aura.rotation.y += deltaTime * 0.5;
                    aura.rotation.z += deltaTime * 0.3;
                };
                
                mesh = dragonGroup;
                mesh.position.copy(position);
                mesh.position.y = 3; // Hover above ground
                break;
                
            default:
                // Default effect (simple sphere)
                geometry = new THREE.SphereGeometry(0.5, 8, 8);
                material = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 });
                mesh = new THREE.Mesh(geometry, material);
                mesh.position.copy(position);
        }
        
        // Add the effect to the scene
        this.world.scene.add(mesh);
        
        // Add to active effects
        if (this.player) {
            this.player.abilityEffects.push({
                mesh: mesh,
                lifetime: 2.0, // Effect lasts 2 seconds by default
                type: type
            });
        }
        
        return mesh;
    }
}

// Create and initialize the game when the page loads
let game;
window.addEventListener('load', () => {
    game = new Game();
    game.initialize();
});