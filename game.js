// Game state management
class Game {
    constructor(scene) {
        this.scene = scene;
        this.money = 100;
        this.buildings = [];
        this.soldiers = [];
        this.projectiles = []; // NEW: Array to track all projectiles
        this.lastMoneyUpdate = Date.now();
        this.selectedBarracks = null;
        this.aiUpdateInterval = 10000; // AI makes decisions every 10 seconds
        this.lastAiUpdate = Date.now();
        this.researchPoints = 0;
        this.researching = false;
        this.currentResearch = null;
        this.unlockedTechnologies = [];
        this.instantResearchEnabled = false; // Add property for instant research
        
        // Building properties (increased sizes)
        this.buildingTypes = {
            farm: {
                cost: 50,
                income: 10,
                color: 0xA52A2A, // Brown
                width: 4,
                height: 3,
                depth: 4,
                unlocked: true
            },
            wall: {
                cost: 30,
                income: 0,
                color: 0x808080, // Gray
                width: 6,
                height: 4,
                depth: 1,
                unlocked: true
            },
            barracks: {
                cost: 100,
                income: 5,
                color: 0x8B0000, // Dark red
                width: 6,
                height: 4,
                depth: 6,
                unlocked: true
            },
            researchLab: {
                cost: 150,
                income: 0,
                color: 0x00008B, // Dark blue
                width: 5,
                height: 5,
                depth: 5,
                unlocked: true,
                researchBonus: 2
            },
            market: {
                cost: 120,
                income: 20,
                color: 0xDAA520, // Goldenrod
                width: 7,
                height: 3,
                depth: 7,
                unlocked: true
            },
            tower: {
                cost: 80,
                income: 0,
                color: 0x708090, // Slate gray
                width: 3,
                height: 8,
                depth: 3,
                unlocked: true
            }
        };
        
        // Technology tree with prerequisites and hierarchy - now with tier 4
        this.technologies = {
            basicResearch: {
                name: "Basic Research",
                cost: 50,
                description: "Foundation of all technologies",
                researchTime: 15, // seconds
                prerequisites: [],
                tier: 1,
                effect: () => {
                    console.log("Basic Research completed - enabling tier 1 technologies");
                    // No direct effect, just unlocks other technologies
                }
            },
            improvedFarming: {
                name: "Improved Farming",
                cost: 100,
                description: "Increases farm income by 50%",
                researchTime: 30,
                prerequisites: ["basicResearch"],
                tier: 2,
                effect: () => {
                    // Apply effect when researched
                    this.buildings.forEach(building => {
                        if (building.type === 'farm') {
                            building.income = Math.floor(building.income * 1.5);
                        }
                    });
                }
            },
            advancedAgriculture: {
                name: "Advanced Agriculture",
                cost: 180,
                description: "Farms generate double income",
                researchTime: 45,
                prerequisites: ["improvedFarming"],
                tier: 3,
                effect: () => {
                    // Apply effect when researched
                    this.buildings.forEach(building => {
                        if (building.type === 'farm') {
                            building.income = Math.floor(building.income * 1.3); // 50% + 30% = 195% total
                        }
                    });
                }
            },
            militaryTraining: {
                name: "Military Training",
                cost: 80,
                description: "Soldiers have 20% more health",
                researchTime: 25,
                prerequisites: ["basicResearch"],
                tier: 2,
                effect: () => {
                    // Apply to existing soldiers
                    this.soldiers.forEach(soldier => {
                        soldier.health = Math.floor(soldier.health * 1.2);
                    });
                    // Will also apply to new soldiers in createSoldier method
                }
            },
            advancedWeaponry: {
                name: "Advanced Weaponry",
                cost: 150,
                description: "Unlocks advanced soldier types",
                researchTime: 45,
                prerequisites: ["militaryTraining"],
                tier: 3,
                effect: () => {
                    // Unlock new soldier types
                    this.soldierTypes.heavyKnight = {
                        cost: 120,
                        color: 0xB8860B, // Dark goldenrod
                        height: 2.2,
                        width: 0.8
                    };
                    
                    // Make the advanced unit button visible
                    const advancedUnits = document.getElementById('advanced-units');
                    if (advancedUnits) {
                        advancedUnits.style.display = 'block';
                    }
                }
            },
            reinforcedStructures: {
                name: "Reinforced Structures",
                cost: 120,
                description: "Buildings have increased durability",
                researchTime: 40,
                prerequisites: ["basicResearch"],
                tier: 2,
                effect: () => {
                    // Apply to existing buildings
                    this.buildings.forEach(building => {
                        building.health = (building.health || 100) + 50;
                    });
                }
            },
            advancedEngineering: {
                name: "Advanced Engineering",
                cost: 200,
                description: "Allows constructing advanced buildings",
                researchTime: 60,
                prerequisites: ["reinforcedStructures"],
                tier: 3,
                effect: () => {
                    // Will unlock new building types
                    this.buildingTypes.fortress = {
                        cost: 300,
                        income: 0,
                        color: 0x404040,
                        width: 10,
                        height: 6,
                        depth: 10,
                        unlocked: true
                    };
                    
                    // Add fortress button to create panel
                    this.addBuildingButton('fortress', 'Fortress ($300)<br><small>Powerful defensive structure</small>');
                }
            },
            // NEW TIER 4 TECHNOLOGIES
            eliteArchers: {
                name: "Elite Archery",
                cost: 250,
                description: "Unlock powerful longbowmen with extended range",
                researchTime: 60,
                prerequisites: ["advancedWeaponry"],
                tier: 4,
                effect: () => {
                    // Add new archer unit
                    this.soldierTypes.longbowman = {
                        cost: 80,
                        color: 0x006400, // Dark green
                        height: 2.0,
                        width: 0.6,
                        range: 12, // Extended range
                        damage: 15,
                        attackSpeed: 2 // Shots per second
                    };
                    
                    // Make available in the UI
                    const advancedUnits = document.getElementById('advanced-units');
                    if (advancedUnits) {
                        const button = document.createElement('button');
                        button.className = 'create-button premium';
                        button.onclick = () => this.createSoldier('longbowman');
                        button.innerHTML = 'Longbowman ($80)<br><small>Elite ranged unit</small>';
                        advancedUnits.appendChild(button);
                    }
                }
            },
            siegeEngineering: {
                name: "Siege Engineering",
                cost: 300,
                description: "Unlock siege weapons to attack buildings",
                researchTime: 75,
                prerequisites: ["advancedEngineering"],
                tier: 4,
                effect: () => {
                    // Add new siege unit
                    this.soldierTypes.catapult = {
                        cost: 200,
                        color: 0x8B4513, // Brown
                        height: 2.5,
                        width: 2.0,
                        range: 15,
                        damage: 30,
                        attackSpeed: 0.5, // Shots per second
                        areaOfEffect: 3 // Damage radius
                    };
                    
                    // Make available in the UI
                    const advancedUnits = document.getElementById('advanced-units');
                    if (advancedUnits) {
                        const button = document.createElement('button');
                        button.className = 'create-button premium';
                        button.onclick = () => this.createSoldier('catapult');
                        button.innerHTML = 'Catapult ($200)<br><small>Siege weapon</small>';
                        advancedUnits.appendChild(button);
                    }
                }
            },
            imperialAge: {
                name: "Imperial Age",
                cost: 500,
                description: "Enter the final age of development",
                researchTime: 120,
                prerequisites: ["eliteArchers", "siegeEngineering"],
                tier: 4,
                effect: () => {
                    // Unlock most powerful unit
                    this.soldierTypes.paladin = {
                        cost: 150,
                        color: 0xE6E6FA, // Light purple
                        height: 2.3,
                        width: 0.9,
                        range: 1.5,
                        damage: 25,
                        health: 250,
                        attackSpeed: 1.2
                    };
                    
                    // Make available in the UI
                    const advancedUnits = document.getElementById('advanced-units');
                    if (advancedUnits) {
                        const button = document.createElement('button');
                        button.className = 'create-button premium supreme';
                        button.onclick = () => this.createSoldier('paladin');
                        button.innerHTML = 'Paladin ($150)<br><small>Elite heavy cavalry</small>';
                        advancedUnits.appendChild(button);
                    }
                    
                    // Improve all existing units and buildings
                    this.buildings.forEach(building => {
                        if (building.income) building.income = Math.floor(building.income * 1.2);
                        if (building.health) building.health = Math.floor(building.health * 1.5);
                    });
                    
                    // Improve towers with additional range
                    this.buildings.forEach(building => {
                        if (building.type === 'tower') {
                            building.range = (building.range || 10) + 5;
                            building.damage = (building.damage || 10) + 5;
                        }
                    });
                }
            }
        };
        
        // Soldier properties - expanded with combat stats
        this.soldierTypes = {
            swordsman: {
                cost: 25,
                color: 0x0000FF, // Blue
                height: 1.8,
                width: 0.6,
                range: 1.2, // Melee range
                damage: 10,
                attackSpeed: 1, // Attacks per second
                health: 100
            },
            archer: {
                cost: 40,
                color: 0x008000, // Green
                height: 1.8,
                width: 0.6,
                range: 8, // Ranged unit
                damage: 8,
                attackSpeed: 0.8, // Attacks per second
                health: 80
            },
            knight: {
                cost: 75,
                color: 0xFFD700, // Gold
                height: 2,
                width: 0.7,
                range: 1.5, // Melee range
                damage: 15,
                attackSpeed: 0.7, // Attacks per second
                health: 150
            }
        };
        
        // AI properties with enhanced army building capabilities
        this.ai = {
            money: 150,
            buildings: [],
            soldiers: [],
            color: 0xFF0000, // Red for enemy units
            baseLocation: new THREE.Vector3(40, 0, 40), // Far corner of the map
            spawnInterval: 30000, // AI spawns units every 30 seconds
            lastSpawn: Date.now(),
            aggressive: false, // Becomes true after building certain number of units
            buildQueue: [],
            strategy: 'balanced', // Can be 'balanced', 'rush', or 'defensive'
            phase: 'economy', // Starts with economy focus, then transitions to military
            threatLevel: 0, // Increases when player builds military units
            lastThreatCheck: Date.now()
        };
        
        // Set up click event for selecting barracks
        window.addEventListener('click', (event) => this.handleClick(event));
        
        // Add new properties for unit selection and control
        this.selectedUnits = [];
        this.isUnitSelectionActive = false;
        this.selectionStart = new THREE.Vector2();
        this.selectionBox = null;
        this.preventDeselection = false; // Flag to prevent deselection when needed
        
        // Set up click event for selecting units
        window.addEventListener('mousedown', (event) => this.handleMouseDown(event));
        window.addEventListener('mousemove', (event) => this.handleMouseMove(event));
        window.addEventListener('mouseup', (event) => this.handleMouseUp(event));
        
        // Update money display
        this.updateMoneyDisplay();
        this.updateResearchDisplay();
        
        // Start game loop
        this.gameLoop();
    }
    
    // Update money value in the UI
    updateMoneyDisplay() {
        document.getElementById('money-value').textContent = this.money;
        
        // Also update the research points display
        if (document.getElementById('research-points-display')) {
            document.getElementById('research-points-display').textContent = this.researchPoints;
        }
    }
    
    // Update research points in the UI
    updateResearchDisplay() {
        if (document.getElementById('research-points')) {
            document.getElementById('research-points').textContent = this.researchPoints;
        }
    }
    
    // Handle click events to select barracks or research lab
    handleClick(event) {
        // Skip if we're in movement selection mode
        if (this.isSettingMoveTarget) return;
        
        // Handle right-click for unit movement
        if (event.button === 2 && this.selectedUnits.length > 0) {
            // Convert mouse position to normalized device coordinates
            const mouse = new THREE.Vector2();
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
            
            // Raycasting to find the ground position
            const raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(mouse, camera);
            
            // Cast ray to ground plane
            const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
            const targetPoint = new THREE.Vector3();
            
            if (raycaster.ray.intersectPlane(groundPlane, targetPoint)) {
                // Move units to target location
                this.moveUnitsTo(targetPoint.x, targetPoint.z);
            }
            return;
        }
        
        // Handle left-click for building selection
        // Convert mouse position to normalized device coordinates
        const mouse = new THREE.Vector2();
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        
        // Raycasting to detect clicks on buildings
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, camera); // Using global camera
        
        // Get all buildings to check for intersection
        const buildingMeshes = this.buildings.map(building => building.mesh);
        const intersects = raycaster.intersectObjects(buildingMeshes);
        
        if (intersects.length > 0) {
            // Find which building was clicked
            const clickedMesh = intersects[0].object;
            const clickedBuilding = this.buildings.find(building => building.mesh === clickedMesh);
            
            // Handle different building types
            if (clickedBuilding && clickedBuilding.type === 'barracks') {
                this.selectedBarracks = clickedBuilding;
                this.openSoldierPanel();
                this.preventDeselection = true; // Don't deselect units when clicking UI
            } 
            else if (clickedBuilding && clickedBuilding.type === 'researchLab') {
                this.openResearchPanel(clickedBuilding);
                this.preventDeselection = true;
            }
        }
    }
    
    // Open research panel with improved upgrade tree visualization
    openResearchPanel(lab) {
        const panel = document.getElementById('research-panel');
        panel.style.display = 'flex';
        
        // Clear previous options
        const techList = document.getElementById('technology-list');
        techList.innerHTML = '';
        
        // Add upgrade tree visualization
        const treeContainer = document.createElement('div');
        treeContainer.className = 'tech-tree-container';
        techList.appendChild(treeContainer);
        
        // Create tiers for technologies
        const maxTier = Math.max(...Object.values(this.technologies).map(tech => tech.tier));
        const tierContainers = [];
        
        for (let i = 1; i <= maxTier; i++) {
            const tierDiv = document.createElement('div');
            tierDiv.className = 'tech-tier';
            tierDiv.dataset.tier = i;
            treeContainer.appendChild(tierDiv);
            tierContainers[i] = tierDiv;
        }
        
        // Add each technology to its tier
        Object.entries(this.technologies).forEach(([techId, tech]) => {
            // Skip already researched technologies
            const isResearched = this.unlockedTechnologies.includes(techId);
            
            // Create tech card
            const techItem = document.createElement('div');
            techItem.className = 'tech-item' + 
                (isResearched ? ' researched' : '') + 
                (this.canResearch(techId) ? ' available' : ' locked');
            
            // Add tech info
            const techButton = document.createElement('button');
            techButton.className = 'tech-button';
            techButton.disabled = isResearched || 
                !this.canResearch(techId) || 
                this.researchPoints < tech.cost || 
                this.researching;
            
            techButton.onclick = () => this.startResearch(techId, lab);
            
            techButton.innerHTML = `
                ${tech.name} (${tech.cost} RP)<br>
                <small>${tech.description}</small><br>
                <small>Research time: ${tech.researchTime}s</small>
                ${tech.prerequisites.length > 0 ? `<br><small>Requires: ${tech.prerequisites.map(p => this.technologies[p].name).join(', ')}</small>` : ''}
            `;
            
            techItem.appendChild(techButton);
            
            // Add to appropriate tier
            if (tierContainers[tech.tier]) {
                tierContainers[tech.tier].appendChild(techItem);
            }
        });
        
        // Update research points display
        if (document.getElementById('research-points-display')) {
            document.getElementById('research-points-display').textContent = this.researchPoints;
        }
    }
    
    // Check if a technology can be researched (prerequisites met)
    canResearch(techId) {
        const tech = this.technologies[techId];
        if (!tech) return false;
        
        // If already researched, can't research again
        if (this.unlockedTechnologies.includes(techId)) return false;
        
        // Check if all prerequisites are researched
        return tech.prerequisites.every(prereq => this.unlockedTechnologies.includes(prereq));
    }
    
    // Start researching a technology with fixed startTime initialization
    startResearch(techId, lab) {
        const tech = this.technologies[techId];
        if (!tech || this.researchPoints < tech.cost || this.researching) return;
        
        // Check if prerequisites are met
        if (!this.canResearch(techId)) {
            alert("You must research the prerequisites first!");
            return;
        }
        
        // Deduct cost
        this.researchPoints -= tech.cost;
        this.updateResearchDisplay();
        
        // If instant research is enabled, complete immediately
        if (this.instantResearchEnabled) {
            // Apply technology effect immediately
            tech.effect();
            
            // Add to unlocked technologies
            this.unlockedTechnologies.push(techId);
            
            // Notification
            console.log(`Research completed instantly: ${tech.name}`);
            alert(`Research completed: ${tech.name}`);
            
            // Close the panel
            document.getElementById('research-panel').style.display = 'none';
            return;
        }
        
        // Normal research process (if instant research is disabled)
        this.researching = true;
        this.currentResearch = {
            techId,
            startTime: Date.now(), // FIX: Initialize startTime
            timeNeeded: tech.researchTime,
            lab
        };
        
        // Update UI
        this.updateResearchProgress(0);
        document.getElementById('research-status').style.display = 'block';
        document.getElementById('current-research-name').textContent = tech.name;
        
        // Close the panel
        document.getElementById('research-panel').style.display = 'none';
    }
    
    // Update research progress
    updateResearchProgress(percent) {
        const progressBar = document.getElementById('research-progress');
        if (progressBar) {
            progressBar.style.width = `${percent}%`;
        }
        
        const progressText = document.getElementById('research-progress-text');
        if (progressText) {
            progressText.textContent = `${Math.floor(percent)}%`;
        }
        
        if (percent >= 100) {
            // Research completed
            const tech = this.technologies[this.currentResearch.techId];
            
            // Apply the technology effect
            tech.effect();
            
            // Add to unlocked technologies
            this.unlockedTechnologies.push(this.currentResearch.techId);
            
            // Reset research state
            this.researching = false;
            this.currentResearch = null;
            
            // Update UI
            document.getElementById('research-status').style.display = 'none';
            
            // Notification
            alert(`Research completed: ${tech.name}`);
        }
    }
    
    // Close research panel
    closeResearchPanel() {
        const panel = document.getElementById('research-panel');
        panel.style.display = 'none';
    }
    
    // Open soldier creation panel
    openSoldierPanel() {
        const panel = document.getElementById('soldier-panel');
        panel.style.display = 'flex';
    }
    
    // Close soldier creation panel
    closeSoldierPanel() {
        const panel = document.getElementById('soldier-panel');
        panel.style.display = 'none';
        this.selectedBarracks = null;
    }
    
    // Create a new building
    createBuilding(type, isAiBuilding = false) {
        const buildingInfo = this.buildingTypes[type];
        
        // Player building creation
        if (!isAiBuilding) {
            // Check if player has enough money
            if (this.money < buildingInfo.cost) {
                alert("Not enough money to create " + type);
                return;
            }
            
            // Deduct cost
            this.money -= buildingInfo.cost;
            this.updateMoneyDisplay();
        }
        
        // Create the building
        const geometry = new THREE.BoxGeometry(
            buildingInfo.width, 
            buildingInfo.height, 
            buildingInfo.depth
        );
        
        // Different color for AI buildings
        const color = isAiBuilding ? this.ai.color : buildingInfo.color;
        const material = new THREE.MeshStandardMaterial({ color: color });
        const building = new THREE.Mesh(geometry, material);
        
        // Get player reference outside of conditional blocks to avoid scope issues
        const playerCharacter = human; // Global human reference
        
        // Position the building
        if (isAiBuilding) {
            // Position near AI base
            const offset = new THREE.Vector3(
                (Math.random() - 0.5) * 20,
                0,
                (Math.random() - 0.5) * 20
            );
            
            building.position.set(
                this.ai.baseLocation.x + offset.x,
                buildingInfo.height / 2 - 1, // Adjust to sit on ground plane
                this.ai.baseLocation.z + offset.z
            );
        } else {
            // Position in front of the character
            const direction = new THREE.Vector3(0, 0, -8).applyAxisAngle(
                new THREE.Vector3(0, 1, 0), 
                playerCharacter.rotation.y
            );
            
            building.position.set(
                playerCharacter.position.x + direction.x,
                buildingInfo.height / 2 - 1, // Adjust to sit on ground plane
                playerCharacter.position.z + direction.z
            );
            
            // Rotate to face the same direction as the character
            building.rotation.y = playerCharacter.rotation.y;
        }
        
        // Add to scene
        this.scene.add(building);
        
        // Create building data object with explicit income value
        const buildingObject = {
            type: type,
            mesh: building,
            income: buildingInfo.income,
            owner: isAiBuilding ? 'ai' : 'player'
        };
        
        // Ensure farms provide income by logging
        if (type === 'farm') {
            console.log(`Created ${isAiBuilding ? 'AI' : 'Player'} farm with income: ${buildingObject.income}`);
        }
        
        // Add to appropriate buildings array
        if (isAiBuilding) {
            this.ai.buildings.push(buildingObject);
        } else {
            this.buildings.push(buildingObject);
        }
        
        // Add a roof for certain building types
        if (type === 'farm' || type === 'barracks' || type === 'market') {
            const roofGeometry = new THREE.ConeGeometry(
                Math.max(buildingInfo.width, buildingInfo.depth) / Math.sqrt(2) * 1.2, 
                3, 
                4
            );
            
            const roofMaterial = new THREE.MeshStandardMaterial({ 
                color: isAiBuilding ? 0x8B0000 : (type === 'farm' ? 0x8B4513 : 0x8B0000)
            });
            
            const roof = new THREE.Mesh(roofGeometry, roofMaterial);
            
            // Position on top of building
            roof.position.set(
                building.position.x,
                building.position.y + buildingInfo.height / 2 + 1.5,
                building.position.z
            );
            
            // Rotate roof 45 degrees to align with building
            // Fixed: Use playerCharacter when not AI, which is accessible in this scope
            roof.rotation.y = (isAiBuilding ? 0 : playerCharacter.rotation.y) + Math.PI / 4;
            
            this.scene.add(roof);
        }
        
        // Add special features for certain building types
        if (type === 'tower') {
            // Add tower cap
            const capGeometry = new THREE.ConeGeometry(buildingInfo.width/2 * 1.2, 2, 4);
            const capMaterial = new THREE.MeshStandardMaterial({ 
                color: isAiBuilding ? 0x8B0000 : 0x708090
            });
            const cap = new THREE.Mesh(capGeometry, capMaterial);
            
            cap.position.set(
                building.position.x,
                building.position.y + buildingInfo.height / 2 + 1,
                building.position.z
            );
            
            this.scene.add(cap);
        } 
        else if (type === 'researchLab') {
            // Add research lab dome
            const domeGeometry = new THREE.SphereGeometry(buildingInfo.width/2, 16, 16, 0, Math.PI * 2, 0, Math.PI/2);
            const domeMaterial = new THREE.MeshStandardMaterial({ 
                color: isAiBuilding ? 0x8B0000 : 0x87CEEB,
                transparent: true,
                opacity: 0.7
            });
            const dome = new THREE.Mesh(domeGeometry, domeMaterial);
            
            dome.position.set(
                building.position.x,
                building.position.y + buildingInfo.height / 2,
                building.position.z
            );
            
            this.scene.add(dome);
            
            // Add research equipment
            const pillarGeometry = new THREE.CylinderGeometry(0.2, 0.2, 2, 8);
            const pillarMaterial = new THREE.MeshStandardMaterial({ color: 0xC0C0C0 });
            const pillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
            
            pillar.position.set(
                building.position.x,
                building.position.y + buildingInfo.height / 2 + 1,
                building.position.z
            );
            
            this.scene.add(pillar);
        }
        
        return buildingObject;
    }
    
    // Create a new soldier - enhanced with combat capabilities
    createSoldier(type, owner = 'player', spawnPosition = null) {
        // Make sure parameters are correct
        let barracks = this.selectedBarracks;
        const isAiSoldier = owner === 'ai';
        
        // For player soldiers, validate barracks selection unless a position is provided
        if (owner === 'player' && !spawnPosition) {
            if (!barracks) {
                alert("You must select a barracks first");
                return;
            }
        }
        
        const soldierInfo = this.soldierTypes[type];
        
        // Check if player has enough money (AI always has enough)
        if (owner === 'player' && this.money < soldierInfo.cost) {
            alert("Not enough money to create " + type);
            return;
        } else if (isAiSoldier && this.ai.money < soldierInfo.cost) {
            return; // AI can't afford it
        }
        
        // Deduct cost
        if (owner === 'player') {
            this.money -= soldierInfo.cost;
            this.updateMoneyDisplay();
        } else {
            this.ai.money -= soldierInfo.cost;
        }
        
        // Create the soldier (simple representation)
        const soldierGroup = new THREE.Group();
        
        // Body - different color based on owner
        const color = isAiSoldier ? this.ai.color : soldierInfo.color;
        const bodyGeometry = new THREE.CylinderGeometry(
            soldierInfo.width / 2,
            soldierInfo.width / 2,
            soldierInfo.height * 0.6,
            8
        );
        const bodyMaterial = new THREE.MeshStandardMaterial({ color: color });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = soldierInfo.height * 0.3;
        soldierGroup.add(body);
        
        // Head
        const headGeometry = new THREE.SphereGeometry(soldierInfo.width / 2, 16, 16);
        const headMaterial = new THREE.MeshStandardMaterial({ 
            color: isAiSoldier ? 0xE0E0E0 : 0xffcc99
        });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = soldierInfo.height * 0.6 + soldierInfo.width / 2;
        soldierGroup.add(head);
        
        // Position the soldier
        if (spawnPosition) {
            // Use provided position if available
            soldierGroup.position.copy(spawnPosition);
        } else if (isAiSoldier) {
            // Find a random AI barracks if available
            const aiBarracks = this.ai.buildings.filter(b => b.type === 'barracks');
            
            if (aiBarracks.length > 0) {
                // Choose a random barracks
                barracks = aiBarracks[Math.floor(Math.random() * aiBarracks.length)];
                
                // Spawn near that barracks
                const spawnOffset = new THREE.Vector3(
                    (Math.random() - 0.5) * 8,
                    0,
                    (Math.random() - 0.5) * 8
                );
                
                soldierGroup.position.set(
                    barracks.mesh.position.x + spawnOffset.x,
                    0,
                    barracks.mesh.position.z + spawnOffset.z
                );
            } else {
                // Spawn near AI base if no barracks
                const spawnOffset = new THREE.Vector3(
                    (Math.random() - 0.5) * 15,
                    0,
                    (Math.random() - 0.5) * 15
                );
                
                soldierGroup.position.set(
                    this.ai.baseLocation.x + spawnOffset.x,
                    0,
                    this.ai.baseLocation.z + spawnOffset.z
                );
            }
        } else {
            // Player soldier near selected barracks
            const spawnOffset = new THREE.Vector3(
                (Math.random() - 0.5) * 8,
                0,
                (Math.random() - 0.5) * 8
            );
            
            soldierGroup.position.set(
                barracks.mesh.position.x + spawnOffset.x,
                0,
                barracks.mesh.position.z + spawnOffset.z
            );
        }
        
        // Add to scene
        this.scene.add(soldierGroup);
        
        // Create soldier data object with enhanced combat properties
        const baseHealth = soldierInfo.health || (type === 'knight' ? 150 : (type === 'archer' ? 80 : 100));
        const healthBonus = this.unlockedTechnologies.includes('militaryTraining') ? 1.2 : 1.0;
        
        const soldier = {
            type: type,
            mesh: soldierGroup,
            owner: owner,
            health: Math.floor(baseHealth * healthBonus),
            maxHealth: Math.floor(baseHealth * healthBonus),
            selected: false,
            
            // Combat properties
            range: soldierInfo.range || 1.2,
            damage: soldierInfo.damage || 8,
            attackSpeed: soldierInfo.attackSpeed || 1,
            lastAttackTime: 0,
            currentTarget: null,
            isRanged: (type === 'archer' || type === 'longbowman' || type === 'catapult')
        };
        
        // Add weapons and special features - enhance for new unit types
        if (type === 'swordsman') {
            const swordGeometry = new THREE.BoxGeometry(0.1, 1, 0.1);
            const swordMaterial = new THREE.MeshStandardMaterial({ color: 0xC0C0C0 });
            const sword = new THREE.Mesh(swordGeometry, swordMaterial);
            sword.position.set(soldierInfo.width, soldierInfo.height * 0.4, 0);
            soldierGroup.add(sword);
        } else if (type === 'archer' || type === 'longbowman') {
            // Determine if it's a regular archer or advanced longbowman
            const isLongbowman = type === 'longbowman';
            const bowScale = isLongbowman ? 1.3 : 1.0;
            const bowColor = isLongbowman ? 0x654321 : 0x8B4513;
            
            // Create bow group
            const bowGroup = new THREE.Group();
            
            // Create bow arc with better shape (recurve bow)
            const bowCurve = new THREE.QuadraticBezierCurve3(
                new THREE.Vector3(-0.5 * bowScale, 0, 0),
                new THREE.Vector3(0, -0.3 * bowScale, 0),
                new THREE.Vector3(0.5 * bowScale, 0, 0)
            );
            
            const bowPoints = bowCurve.getPoints(20);
            const bowGeometry = new THREE.BufferGeometry().setFromPoints(bowPoints);
            const bowMaterial = new THREE.LineBasicMaterial({ color: bowColor, linewidth: 3 });
            const bowLine = new THREE.Line(bowGeometry, bowMaterial);
            
            // Add bowstring
            const stringGeometry = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(-0.5 * bowScale, 0, 0),
                new THREE.Vector3(0, 0.05 * bowScale, 0),
                new THREE.Vector3(0.5 * bowScale, 0, 0)
            ]);
            const stringMaterial = new THREE.LineBasicMaterial({ color: 0xFFFFFF });
            const bowString = new THREE.Line(stringGeometry, stringMaterial);
            
            // Add bow grips/details
            const gripGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.2 * bowScale, 8);
            const gripMaterial = new THREE.MeshStandardMaterial({ color: 0x5C4033 });
            const grip = new THREE.Mesh(gripGeometry, gripMaterial);
            grip.rotation.x = Math.PI / 2;
            
            bowGroup.add(bowLine);
            bowGroup.add(bowString);
            bowGroup.add(grip);
            
            // Add arrow - longbowman has a bigger arrow
            const arrowShaftGeometry = new THREE.CylinderGeometry(0.01, 0.01, 0.7 * bowScale, 8);
            const arrowShaftMaterial = new THREE.MeshStandardMaterial({ color: 0xA0522D });
            const arrowShaft = new THREE.Mesh(arrowShaftGeometry, arrowShaftMaterial);
            arrowShaft.rotation.z = Math.PI / 2;
            arrowShaft.position.x = 0.1;
            
            const arrowHeadGeometry = new THREE.ConeGeometry(0.03, 0.1, 8);
            const arrowHeadMaterial = new THREE.MeshStandardMaterial({ 
                color: isLongbowman ? 0xA9A9A9 : 0xC0C0C0
            });
            const arrowHead = new THREE.Mesh(arrowHeadGeometry, arrowHeadMaterial);
            arrowHead.rotation.z = Math.PI / 2;
            arrowHead.position.x = 0.45 * bowScale;
            
            bowGroup.add(arrowShaft);
            bowGroup.add(arrowHead);
            
            // Position the entire bow group
            bowGroup.rotation.y = Math.PI / 2;
            bowGroup.position.set(soldierInfo.width * 0.7, soldierInfo.height * 0.4, 0);
            
            soldierGroup.add(bowGroup);
            
            // For longbowman, add special features
            if (isLongbowman) {
                // Add a hood or special helmet
                const hoodGeometry = new THREE.SphereGeometry(soldierInfo.width / 2 * 1.1, 16, 16);
                const hoodMaterial = new THREE.MeshStandardMaterial({ 
                    color: 0x355E3B // Forest green for hood
                });
                const hood = new THREE.Mesh(hoodGeometry, hoodMaterial);
                hood.scale.set(1, 1.2, 1);
                hood.position.y = soldierInfo.height * 0.6 + soldierInfo.width / 2;
                soldierGroup.add(hood);
                
                // Add quiver of arrows on back
                const quiverGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.7, 8);
                const quiverMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
                const quiver = new THREE.Mesh(quiverGeometry, quiverMaterial);
                quiver.rotation.x = Math.PI / 2;
                quiver.position.set(-0.2, soldierInfo.height * 0.4, 0);
                soldierGroup.add(quiver);
                
                // Add some arrows in quiver
                for (let i = 0; i < 3; i++) {
                    const arrowGeometry = new THREE.CylinderGeometry(0.01, 0.01, 0.4, 4);
                    const arrowMaterial = new THREE.MeshStandardMaterial({ color: 0xA0522D });
                    const arrow = new THREE.Mesh(arrowGeometry, arrowMaterial);
                    arrow.position.set(-0.2, soldierInfo.height * 0.4, 0.05 * (i - 1));
                    soldierGroup.add(arrow);
                }
            }
        } else if (type === 'knight') {
            // Add helmet
            const helmetGeometry = new THREE.ConeGeometry(soldierInfo.width / 2 * 1.1, soldierInfo.width / 2, 8);
            const helmetMaterial = new THREE.MeshStandardMaterial({ color: 0x808080 });
            const helmet = new THREE.Mesh(helmetGeometry, helmetMaterial);
            helmet.position.y = soldierInfo.height * 0.6 + soldierInfo.width / 2 + 0.2;
            soldierGroup.add(helmet);
            
            // Add shield
            const shieldGeometry = new THREE.BoxGeometry(0.1, 0.8, 0.6);
            const shieldMaterial = new THREE.MeshStandardMaterial({ color: 0xC0C0C0 });
            const shield = new THREE.Mesh(shieldGeometry, shieldMaterial);
            shield.position.set(soldierInfo.width, soldierInfo.height * 0.4, 0);
            soldierGroup.add(shield);
        } else if (type === 'heavyKnight' && this.unlockedTechnologies.includes('advancedWeaponry')) {
            // Heavy knight equipment (only if technology is unlocked)
            const helmetGeometry = new THREE.ConeGeometry(soldierInfo.width / 2 * 1.2, soldierInfo.width / 2, 8);
            const helmetMaterial = new THREE.MeshStandardMaterial({ color: 0x505050 });
            const helmet = new THREE.Mesh(helmetGeometry, helmetMaterial);
            helmet.position.y = soldierInfo.height * 0.6 + soldierInfo.width / 2 + 0.2;
            soldierGroup.add(helmet);
            
            // Add large shield
            const shieldGeometry = new THREE.BoxGeometry(0.15, 1.2, 0.8);
            const shieldMaterial = new THREE.MeshStandardMaterial({ color: 0x909090 });
            const shield = new THREE.Mesh(shieldGeometry, shieldMaterial);
            shield.position.set(soldierInfo.width, soldierInfo.height * 0.4, 0);
            soldierGroup.add(shield);
            
            // Add heavy weapon
            const weaponGeometry = new THREE.CylinderGeometry(0.1, 0.3, 1.5, 8);
            const weaponMaterial = new THREE.MeshStandardMaterial({ color: 0x505050 });
            const weapon = new THREE.Mesh(weaponGeometry, weaponMaterial);
            weapon.position.set(-soldierInfo.width, soldierInfo.height * 0.4, 0);
            weapon.rotation.z = Math.PI / 2;
            soldierGroup.add(weapon);
        } else if (type === 'catapult') {
            // Catapult base
            const baseGeometry = new THREE.BoxGeometry(1.8, 0.4, 1.0);
            const baseMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
            const base = new THREE.Mesh(baseGeometry, baseMaterial);
            base.position.y = 0.2;
            soldierGroup.add(base);
            
            // Catapult arm
            const armGeometry = new THREE.BoxGeometry(0.2, 2.0, 0.2);
            const armMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
            const arm = new THREE.Mesh(armGeometry, armMaterial);
            arm.position.set(0, 1.0, 0);
            arm.rotation.z = Math.PI / 4; // Angled position
            soldierGroup.add(arm);
            
            // Catapult bucket/sling
            const bucketGeometry = new THREE.BoxGeometry(0.4, 0.2, 0.4);
            const bucketMaterial = new THREE.MeshStandardMaterial({ color: 0x5C4033 });
            const bucket = new THREE.Mesh(bucketGeometry, bucketMaterial);
            bucket.position.set(arm.position.x + 0.8, arm.position.y + 0.8, 0);
            soldierGroup.add(bucket);
            
            // Add wheels
            const wheelGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.1, 16);
            const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x5C4033 });
            
            const wheel1 = new THREE.Mesh(wheelGeometry, wheelMaterial);
            wheel1.rotation.z = Math.PI / 2;
            wheel1.position.set(0.6, 0.3, 0.6);
            soldierGroup.add(wheel1);
            
            const wheel2 = new THREE.Mesh(wheelGeometry, wheelMaterial);
            wheel2.rotation.z = Math.PI / 2;
            wheel2.position.set(0.6, 0.3, -0.6);
            soldierGroup.add(wheel2);
            
            const wheel3 = new THREE.Mesh(wheelGeometry, wheelMaterial);
            wheel3.rotation.z = Math.PI / 2;
            wheel3.position.set(-0.6, 0.3, 0.6);
            soldierGroup.add(wheel3);
            
            const wheel4 = new THREE.Mesh(wheelGeometry, wheelMaterial);
            wheel4.rotation.z = Math.PI / 2;
            wheel4.position.set(-0.6, 0.3, -0.6);
            soldierGroup.add(wheel4);
            
            // Store animation reference
            soldier.catapultArm = arm;
            soldier.catapultBucket = bucket;
        } else if (type === 'paladin') {
            // Superior knight with special armor and weapons
            
            // Add decorative helmet
            const helmetGeometry = new THREE.ConeGeometry(soldierInfo.width / 2 * 1.3, soldierInfo.width, 8);
            const helmetMaterial = new THREE.MeshStandardMaterial({ color: 0xE6E6FA });
            const helmet = new THREE.Mesh(helmetGeometry, helmetMaterial);
            helmet.position.y = soldierInfo.height * 0.6 + soldierInfo.width / 2 + 0.2;
            soldierGroup.add(helmet);
            
            // Add plume on helmet
            const plumeGeometry = new THREE.ConeGeometry(0.1, 0.3, 8);
            const plumeMaterial = new THREE.MeshStandardMaterial({ color: 0xFF0000 });
            const plume = new THREE.Mesh(plumeGeometry, plumeMaterial);
            plume.position.set(0, soldierInfo.height * 0.6 + soldierInfo.width / 2 + 0.6, 0);
            soldierGroup.add(plume);
            
            // Add decorated shield
            const shieldGeometry = new THREE.BoxGeometry(0.15, 1.0, 0.8);
            const shieldMaterial = new THREE.MeshStandardMaterial({ color: 0xFFD700 });
            const shield = new THREE.Mesh(shieldGeometry, shieldMaterial);
            shield.position.set(soldierInfo.width, soldierInfo.height * 0.4, 0);
            soldierGroup.add(shield);
            
            // Add emblem on shield
            const emblemGeometry = new THREE.BoxGeometry(0.16, 0.6, 0.5);
            const emblemMaterial = new THREE.MeshStandardMaterial({ color: 0x4169E1 });
            const emblem = new THREE.Mesh(emblemGeometry, emblemMaterial);
            emblem.position.set(soldierInfo.width + 0.08, soldierInfo.height * 0.4, 0);
            soldierGroup.add(emblem);
            
            // Add special sword
            const swordGeometry = new THREE.BoxGeometry(0.15, 1.5, 0.1);
            const swordMaterial = new THREE.MeshStandardMaterial({ color: 0xC0C0C0 });
            const sword = new THREE.Mesh(swordGeometry, swordMaterial);
            sword.position.set(-soldierInfo.width, soldierInfo.height * 0.4, 0);
            soldierGroup.add(sword);
            
            // Add sword handle
            const handleGeometry = new THREE.BoxGeometry(0.25, 0.2, 0.2);
            const handleMaterial = new THREE.MeshStandardMaterial({ color: 0xDAA520 });
            const handle = new THREE.Mesh(handleGeometry, handleMaterial);
            handle.position.set(-soldierInfo.width, soldierInfo.height * 0.4 - 0.8, 0);
            soldierGroup.add(handle);
            
            // Add shoulder armor pieces
            const shoulderGeometry = new THREE.SphereGeometry(0.3, 16, 16);
            const shoulderMaterial = new THREE.MeshStandardMaterial({ color: 0xE6E6FA });
            
            const leftShoulder = new THREE.Mesh(shoulderGeometry, shoulderMaterial);
            leftShoulder.position.set(-0.5, soldierInfo.height * 0.5, 0);
            soldierGroup.add(leftShoulder);
            
            const rightShoulder = new THREE.Mesh(shoulderGeometry, shoulderMaterial);
            rightShoulder.position.set(0.5, soldierInfo.height * 0.5, 0);
            soldierGroup.add(rightShoulder);
        }
        
        // Add selection indicator (initially invisible)
        if (!isAiSoldier) { // Only player units get selection rings
            const selectionRingGeometry = new THREE.RingGeometry(soldierInfo.width * 0.8, soldierInfo.width, 16);
            const selectionRingMaterial = new THREE.MeshBasicMaterial({ 
                color: 0x00FFFF, 
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.7,
                visible: false
            });
            const selectionRing = new THREE.Mesh(selectionRingGeometry, selectionRingMaterial);
            selectionRing.rotation.x = -Math.PI / 2;
            selectionRing.position.y = 0.05;
            soldierGroup.add(selectionRing);
            
            soldier.selectionRing = selectionRing;
        }
        
        // Add to appropriate soldiers array
        if (isAiSoldier) {
            this.ai.soldiers.push(soldier);
        } else {
            this.soldiers.push(soldier);
        }
        
        return soldier;
    }
    
    // Create a projectile for ranged attacks
    createProjectile(source, target, type = 'arrow') {
        let geometry, material;
        
        if (type === 'arrow') {
            geometry = new THREE.CylinderGeometry(0.03, 0.03, 0.5, 4);
            material = new THREE.MeshBasicMaterial({ color: 0x8B4513 });
        } else if (type === 'catapult') {
            geometry = new THREE.SphereGeometry(0.2, 8, 8);
            material = new THREE.MeshBasicMaterial({ color: 0x696969 });
        } else if (type === 'tower') {
            geometry = new THREE.SphereGeometry(0.1, 8, 8);
            material = new THREE.MeshBasicMaterial({ color: 0x4B0082 });
        }
        
        const projectile = new THREE.Mesh(geometry, material);
        
        // Set initial position at source
        const sourcePos = new THREE.Vector3();
        if (source.mesh) {
            source.mesh.getWorldPosition(sourcePos);
            sourcePos.y += 1.5; // Adjust to shoot from appropriate height
        } else {
            source.getWorldPosition(sourcePos);
            sourcePos.y += 4; // Tower shoots from top
        }
        
        projectile.position.copy(sourcePos);
        
        // Calculate target position
        const targetPos = new THREE.Vector3();
        if (target.mesh) {
            target.mesh.getWorldPosition(targetPos);
            targetPos.y += 1.0; // Aim for center mass
        } else {
            target.getWorldPosition(targetPos);
        }
        
        // Calculate direction and normalize
        const direction = new THREE.Vector3().subVectors(targetPos, sourcePos).normalize();
        
        // Rotate arrow to point in direction of travel
        if (type === 'arrow') {
            projectile.quaternion.setFromUnitVectors(
                new THREE.Vector3(0, 1, 0), // Arrow cylinder is aligned with Y axis by default
                direction
            );
        }
        
        // Add to scene
        this.scene.add(projectile);
        
        // Add to projectiles array for animation
        const projectileObj = {
            mesh: projectile,
            direction: direction,
            source: source,
            target: target,
            type: type,
            speed: type === 'catapult' ? 0.3 : 0.6,
            damage: source.damage || 10,
            distanceTraveled: 0,
            maxDistance: type === 'catapult' ? 25 : 15,
            areaOfEffect: type === 'catapult' ? (source.areaOfEffect || 3) : 0
        };
        
        this.projectiles.push(projectileObj);
        
        // If it's a catapult, animate the arm
        if (source.catapultArm && source.catapultBucket) {
            // Store original rotation
            if (!source.originalArmRotation) {
                source.originalArmRotation = source.catapultArm.rotation.z;
            }
            
            // Animate firing sequence
            source.catapultArm.rotation.z = -Math.PI / 6; // Pulled back
            
            setTimeout(() => {
                if (source.catapultArm) {
                    source.catapultArm.rotation.z = source.originalArmRotation; // Return to original position
                }
            }, 500);
        }
        
        return projectileObj;
    }
    
    // Update projectiles in the game loop
    updateProjectiles(deltaTime) {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];
            
            // Move projectile along its direction
            const movement = projectile.direction.clone().multiplyScalar(projectile.speed);
            projectile.mesh.position.add(movement);
            
            // Track distance traveled
            projectile.distanceTraveled += projectile.speed;
            
            // Check if projectile hit something
            let hit = false;
            
            // Check if target is still valid
            const targetExists = projectile.target && 
                ((projectile.target.mesh && this.scene.getObjectById(projectile.target.mesh.id)) ||
                 (this.scene.getObjectById(projectile.target.id)));
            
            if (targetExists) {
                // Calculate distance to target
                const targetPos = new THREE.Vector3();
                if (projectile.target.mesh) {
                    projectile.target.mesh.getWorldPosition(targetPos);
                } else {
                    projectile.target.getWorldPosition(targetPos);
                }
                
                const distance = projectile.mesh.position.distanceTo(targetPos);
                
                // If close enough, consider it a hit
                if (distance < 1.0) {
                    hit = true;
                    
                    // Deal damage to the target
                    this.dealDamage(projectile);
                    
                    // Create impact effect
                    this.createImpactEffect(projectile.mesh.position.clone(), projectile.type);
                }
            }
            
            // Check if projectile has traveled too far or hit something
            if (projectile.distanceTraveled > projectile.maxDistance || hit) {
                // Remove from scene
                this.scene.remove(projectile.mesh);
                
                // Remove from array
                this.projectiles.splice(i, 1);
            }
        }
    }
    
    // Create impact effect at location
    createImpactEffect(position, type) {
        let geometry, material;
        
        if (type === 'arrow') {
            geometry = new THREE.SphereGeometry(0.1, 8, 8);
            material = new THREE.MeshBasicMaterial({ color: 0xFFD700, transparent: true, opacity: 0.7 });
        } else if (type === 'catapult') {
            geometry = new THREE.SphereGeometry(0.5, 16, 16);
            material = new THREE.MeshBasicMaterial({ color: 0xFF0000, transparent: true, opacity: 0.5 });
        } else {
            geometry = new THREE.SphereGeometry(0.2, 8, 8);
            material = new THREE.MeshBasicMaterial({ color: 0x4B0082, transparent: true, opacity: 0.5 });
        }
        
        const impact = new THREE.Mesh(geometry, material);
        impact.position.copy(position);
        this.scene.add(impact);
        
        // Animate expansion and fade
        let size = 1;
        const expandAndFade = () => {
            size *= 1.1;
            impact.scale.set(size, size, size);
            impact.material.opacity -= 0.05;
            
            if (impact.material.opacity > 0) {
                requestAnimationFrame(expandAndFade);
            } else {
                this.scene.remove(impact);
            }
        };
        
        expandAndFade();
    }
    
    // Deal damage to a target from a projectile hit
    dealDamage(projectile) {
        if (!projectile.target) return;
        
        // If target is a unit
        if (projectile.target.health !== undefined) {
            projectile.target.health -= projectile.damage;
            
            // If this kills the target
            if (projectile.target.health <= 0) {
                this.removeUnit(
                    projectile.target, 
                    projectile.target.owner === 'player' ? 'player' : 'ai'
                );
            }
        }
        
        // If target is a building
        if (projectile.target.type !== undefined) {
            // Initialize health if not already set
            if (projectile.target.health === undefined) {
                projectile.target.health = 200;
            }
            
            projectile.target.health -= projectile.damage;
            
            // If this destroys the building
            if (projectile.target.health <= 0) {
                this.removeBuilding(projectile.target);
            }
        }
        
        // If projectile has area of effect, damage nearby units
        if (projectile.areaOfEffect > 0) {
            const hitPos = projectile.mesh.position.clone();
            const radius = projectile.areaOfEffect;
            
            // Check all units in range
            const checkUnits = (units, owner) => {
                units.forEach(unit => {
                    if (unit === projectile.target) return; // Already dealt damage to the target
                    
                    const unitPos = new THREE.Vector3();
                    unit.mesh.getWorldPosition(unitPos);
                    
                    const distance = hitPos.distanceTo(unitPos);
                    
                    if (distance <= radius) {
                        // Deal reduced damage based on distance from center
                        const damageFactor = 1 - (distance / radius);
                        const aoeDamage = Math.floor(projectile.damage * damageFactor);
                        
                        unit.health -= aoeDamage;
                        
                        // If this kills the unit
                        if (unit.health <= 0) {
                            this.removeUnit(unit, owner);
                        }
                    }
                });
            };
            
            // Check player and AI units
            checkUnits(this.soldiers, 'player');
            checkUnits(this.ai.soldiers, 'ai');
        }
    }
    
    // Check if a unit can attack (in range and cooldown passed)
    canAttack(unit, now) {
        // Check if attack cooldown has passed
        if (now - unit.lastAttackTime < 1000 / unit.attackSpeed) {
            return false;
        }
        
        // Find potential targets
        const targets = unit.owner === 'player' ? this.ai.soldiers : this.soldiers;
        
        // Find closest target within range
        let closestTarget = null;
        let closestDistance = Infinity;
        
        targets.forEach(target => {
            const distance = unit.mesh.position.distanceTo(target.mesh.position);
            
            if (distance <= unit.range && distance < closestDistance) {
                closestTarget = target;
                closestDistance = distance;
            }
        });
        
        // If a target was found, attack it
        if (closestTarget) {
            unit.currentTarget = closestTarget;
            return true;
        }
        
        // If unit is a siege weapon, consider attacking buildings
        if (unit.type === 'catapult') {
            const buildingTargets = unit.owner === 'player' ? this.ai.buildings : this.buildings;
            
            buildingTargets.forEach(target => {
                const distance = unit.mesh.position.distanceTo(target.mesh.position);
                
                if (distance <= unit.range && distance < closestDistance) {
                    closestTarget = target;
                    closestDistance = distance;
                }
            });
            
            // If a building target was found, attack it
            if (closestTarget) {
                unit.currentTarget = closestTarget;
                return true;
            }
        }
        
        return false;
    }
    
    // Remove a building when destroyed
    removeBuilding(building) {
        // Remove from scene
        this.scene.remove(building.mesh);
        
        // Find and remove from the appropriate array
        let index;
        if (building.owner === 'player') {
            index = this.buildings.indexOf(building);
            if (index !== -1) {
                this.buildings.splice(index, 1);
            }
        } else {
            index = this.ai.buildings.indexOf(building);
            if (index !== -1) {
                this.ai.buildings.splice(index, 1);
            }
        }
    }
    
    // Enhanced AI behavior system with better army building
    updateAI() {
        const now = Date.now();
        
        // Give AI initial starting money
        if (!this.ai.hasInitialMoney) {
            this.ai.money = 500;
            this.ai.hasInitialMoney = true;
        }
        
        // Generate AI income from buildings
        let aiIncome = 0;
        this.ai.buildings.forEach(building => {
            if (building.type === 'farm') {
                aiIncome += this.buildingTypes.farm.income;
            } else if (building.type === 'market') {
                aiIncome += this.buildingTypes.market.income;
            } else {
                aiIncome += building.income || 0;
            }
        });
        
        this.ai.money += aiIncome;
        
        // Update AI threat assessment every 10 seconds
        if (now - this.ai.lastThreatCheck > 10000) {
            // Count player military units
            const playerMilitaryCount = this.soldiers.length;
            
            // Update threat level
            this.ai.threatLevel = Math.min(10, Math.max(0, playerMilitaryCount / 5));
            
            // Update AI strategy based on threat and game phase
            if (this.ai.threatLevel > 7) {
                this.ai.strategy = 'defensive';
            } else if (this.ai.buildings.length > 12) {
                this.ai.strategy = 'rush';
            } else {
                this.ai.strategy = 'balanced';
            }
            
            // Transition from economy to military phase
            if (this.ai.buildings.length >= 8 && this.ai.phase === 'economy') {
                this.ai.phase = 'military';
            }
            
            this.ai.lastThreatCheck = now;
        }
        
        // AI building creation - enhanced for city building
        if (this.ai.money >= 50 && this.ai.buildings.length < 25) {
            // Count different building types
            const farmCount = this.ai.buildings.filter(b => b.type === 'farm').length;
            const barracksCount = this.ai.buildings.filter(b => b.type === 'barracks').length;
            const towerCount = this.ai.buildings.filter(b => b.type === 'tower').length;
            const marketCount = this.ai.buildings.filter(b => b.type === 'market').length;
            
            let buildingTypeOption;
            
            // Different building strategies based on phase and strategy
            if (this.ai.phase === 'economy') {
                // Economy phase prioritizes farms and resource buildings
                if (farmCount < 5) {
                    buildingTypeOption = 'farm';
                } else if (marketCount < 2) {
                    buildingTypeOption = 'market';
                } else if (barracksCount < 1) {
                    buildingTypeOption = 'barracks';
                } else if (towerCount < 2) {
                    buildingTypeOption = 'tower';
                } else {
                    const options = ['farm', 'wall', 'market'];
                    buildingTypeOption = options[Math.floor(Math.random() * options.length)];
                }
            } else {
                // Military phase prioritizes barracks and defensive structures
                if (barracksCount < 3) {
                    buildingTypeOption = 'barracks';
                } else if (towerCount < 4) {
                    buildingTypeOption = 'tower';
                } else if (farmCount < 8) {
                    buildingTypeOption = 'farm';
                } else {
                    // Based on strategy
                    if (this.ai.strategy === 'defensive') {
                        const options = ['tower', 'wall', 'tower'];
                        buildingTypeOption = options[Math.floor(Math.random() * options.length)];
                    } else if (this.ai.strategy === 'rush') {
                        const options = ['barracks', 'barracks', 'tower'];
                        buildingTypeOption = options[Math.floor(Math.random() * options.length)];
                    } else {
                        const options = ['barracks', 'farm', 'tower', 'market'];
                        buildingTypeOption = options[Math.floor(Math.random() * options.length)];
                    }
                }
            }
            
            // Check if AI can afford it
            if (this.ai.money >= this.buildingTypes[buildingTypeOption].cost) {
                // Create building
                const building = this.createBuilding(buildingTypeOption, true);
                console.log(`AI built a ${buildingTypeOption}, has ${this.ai.money} money`);
            }
        }
        
        // AI unit creation - improved to create balanced armies
        if (now - this.ai.lastSpawn >= this.ai.spawnInterval && this.ai.buildings.some(b => b.type === 'barracks')) {
            // Count existing unit types
            const swordsmenCount = this.ai.soldiers.filter(s => s.type === 'swordsman').length;
            const archerCount = this.ai.soldiers.filter(s => s.type === 'archer').length;
            const knightCount = this.ai.soldiers.filter(s => s.type === 'knight').length;
            
            let typeToSpawn;
            
            // Create balanced army based on strategy
            if (this.ai.strategy === 'defensive') {
                // Defensive strategy prefers archers and some melee units
                if (archerCount < swordsmenCount + knightCount) {
                    typeToSpawn = 'archer';
                } else if (swordsmenCount < knightCount * 2) {
                    typeToSpawn = 'swordsman';
                } else {
                    typeToSpawn = 'knight';
                }
            } else if (this.ai.strategy === 'rush') {
                // Rush strategy prefers knights and swordsmen
                if (knightCount < this.ai.soldiers.length * 0.4) {
                    typeToSpawn = 'knight';
                } else if (swordsmenCount < this.ai.soldiers.length * 0.4) {
                    typeToSpawn = 'swordsman';
                } else {
                    typeToSpawn = 'archer';
                }
            } else {
                // Balanced strategy
                if (swordsmenCount < this.ai.soldiers.length * 0.4) {
                    typeToSpawn = 'swordsman';
                } else if (archerCount < this.ai.soldiers.length * 0.3) {
                    typeToSpawn = 'archer';
                } else if (knightCount < this.ai.soldiers.length * 0.3) {
                    typeToSpawn = 'knight';
                } else {
                    const options = ['swordsman', 'archer', 'knight'];
                    typeToSpawn = options[Math.floor(Math.random() * options.length)];
                }
            }
            
            // Check affordability
            if (this.ai.money >= this.soldierTypes[typeToSpawn].cost) {
                this.createSoldier(typeToSpawn, 'ai');
                this.ai.lastSpawn = now;
                
                // Reduce spawn interval as game progresses and army grows
                this.ai.spawnInterval = Math.max(
                    5000, // Minimum 5 seconds between spawns
                    30000 - (this.ai.soldiers.length * 1000) // Reduces by 1 second per soldier
                );
                
                // When AI has a large enough army, it becomes aggressive
                if (this.ai.soldiers.length >= 5) {
                    this.ai.aggressive = true;
                }
            }
        }
        
        // AI attack behavior - enhanced with tower shooting and unit combat
        if (this.ai.aggressive) {
            // Towers attack nearby enemies
            this.ai.buildings.forEach(building => {
                if (building.type === 'tower') {
                    // Initialize tower combat properties if not already set
                    if (building.lastAttackTime === undefined) {
                        building.range = 15;
                        building.damage = 12;
                        building.attackSpeed = 0.5;
                        building.lastAttackTime = 0;
                    }
                    
                    // Check if tower can attack
                    if (now - building.lastAttackTime >= 1000 / building.attackSpeed) {
                        // Find closest player unit in range
                        let closestUnit = null;
                        let closestDistance = Infinity;
                        
                        this.soldiers.forEach(soldier => {
                            const distance = building.mesh.position.distanceTo(soldier.mesh.position);
                            
                            if (distance <= building.range && distance < closestDistance) {
                                closestUnit = soldier;
                                closestDistance = distance;
                            }
                        });
                        
                        // If a target is found, shoot at it
                        if (closestUnit) {
                            this.createProjectile(building.mesh, closestUnit, 'tower');
                            building.lastAttackTime = now;
                        }
                    }
                }
            });
            
            // Squad-based movement for AI units
            if (this.ai.soldiers.length > 0) {
                // Split soldiers into squads (up to 3 units per squad)
                const squadSize = 3;
                const squads = [];
                
                for (let i = 0; i < this.ai.soldiers.length; i += squadSize) {
                    squads.push(this.ai.soldiers.slice(i, i + squadSize));
                }
                
                // For each squad, find a suitable target
                squads.forEach(squad => {
                    // Different targets based on unit types in squad
                    const hasRanged = squad.some(s => s.isRanged);
                    
                    // Find target - players units, buildings, or player character
                    let target;
                    let targetType;
                    
                    // Prioritize based on squad composition
                    if (hasRanged) {
                        // Ranged units prefer attacking buildings or other stationary targets
                        if (this.buildings.length > 0) {
                            target = this.buildings[Math.floor(Math.random() * this.buildings.length)].mesh.position;
                            targetType = 'building';
                        } else if (this.soldiers.length > 0) {
                            target = this.soldiers[Math.floor(Math.random() * this.soldiers.length)].mesh.position;
                            targetType = 'unit';
                        } else {
                            target = human.position;
                            targetType = 'player';
                        }
                    } else {
                        // Melee squads prefer attacking units and the player
                        if (this.soldiers.length > 0) {
                            target = this.soldiers[Math.floor(Math.random() * this.soldiers.length)].mesh.position;
                            targetType = 'unit';
                        } else if (this.buildings.length > 0) {
                            target = this.buildings[Math.floor(Math.random() * this.buildings.length)].mesh.position;
                            targetType = 'building';
                        } else {
                            target = human.position;
                            targetType = 'player';
                        }
                    }
                    
                    // Move squad to target with formation
                    squad.forEach((soldier, index) => {
                        // Calculate formation position
                        const angle = (index / squad.length) * Math.PI * 2;
                        const radius = 2;
                        
                        const offset = new THREE.Vector3(
                            Math.cos(angle) * radius,
                            0,
                            Math.sin(angle) * radius
                        );
                        
                        // Set target position
                        soldier.targetPosition = new THREE.Vector3(
                            target.x + offset.x,
                            0,
                            target.z + offset.z
                        );
                        
                        // Set rotation to face target
                        const direction = new THREE.Vector3(
                            target.x - soldier.mesh.position.x,
                            0,
                            target.z - soldier.mesh.position.z
                        ).normalize();
                        
                        soldier.targetRotation = Math.atan2(direction.x, direction.z);
                    });
                });
            }
        }
    }
    
    // Attack command for selected units
    attackTarget(target) {
        if (this.selectedUnits.length === 0) return;
        
        this.selectedUnits.forEach((unit) => {
            unit.attackTarget = target;
        });
    }
    
    // Generate income and research points - fixed farm income
    generateIncome() {
        const now = Date.now();
        const timeDiff = now - this.lastMoneyUpdate;
        
        // Generate income every 5 seconds
        if (timeDiff >= 5000) {
            let income = 0;
            let researchIncome = 0;
            
            // Calculate income from all buildings
            for (const building of this.buildings) {
                if (building.type === 'farm') {
                    income += this.buildingTypes.farm.income;
                } else if (building.type === 'market') {
                    income += this.buildingTypes.market.income;
                } else {
                    income += building.income || 0;
                }
                
                // Research labs generate research points
                if (building.type === 'researchLab') {
                    researchIncome += this.buildingTypes.researchLab.researchBonus || 1;
                }
            }
            
            // Log income for debugging
            if (income > 0) {
                console.log(`Generated ${income} money from buildings`);
            }
            
            this.money += income;
            this.researchPoints += researchIncome;
            
            this.updateMoneyDisplay();
            this.updateResearchDisplay();
            
            this.lastMoneyUpdate = now;
            
            // Update AI as well
            this.updateAI();
        }
        
        // Update research progress if something is being researched
        if (this.researching && this.currentResearch) {
            const researchDuration = this.currentResearch.timeNeeded * 1000; // convert to ms
            const elapsedTime = now - this.currentResearch.startTime;
            
            if (elapsedTime >= researchDuration) {
                // Research completed
                this.updateResearchProgress(100);
            } else {
                // Research in progress
                const progressPercent = (elapsedTime / researchDuration) * 100;
                this.updateResearchProgress(progressPercent);
            }
        }
    }
    
    // Enhanced Game Loop with combat mechanics
    gameLoop() {
        const now = Date.now();
        const deltaTime = (now - this.lastGameLoopTime) / 1000 || 0.016;
        this.lastGameLoopTime = now;
        
        this.generateIncome();
        
        // Update projectiles
        this.updateProjectiles(deltaTime);
        
        // Check for combat opportunities
        // Player units
        this.soldiers.forEach(soldier => {
            // Check if unit can attack
            if (this.canAttack(soldier, now)) {
                // Perform attack
                soldier.lastAttackTime = now;
                
                if (soldier.isRanged) {
                    // Ranged attack - create projectile
                    this.createProjectile(soldier, soldier.currentTarget, 
                        soldier.type === 'catapult' ? 'catapult' : 'arrow');
                } else {
                    // Melee attack - directly damage target
                    if (soldier.currentTarget && soldier.currentTarget.health) {
                        soldier.currentTarget.health -= soldier.damage;
                        
                        // Check if target is defeated
                        if (soldier.currentTarget.health <= 0) {
                            this.removeUnit(
                                soldier.currentTarget,
                                soldier.currentTarget.owner === 'player' ? 'player' : 'ai'
                            );
                            soldier.currentTarget = null;
                        }
                    }
                }
            }
        });
        
        // AI units
        this.ai.soldiers.forEach(soldier => {
            // Check if unit can attack
            if (this.canAttack(soldier, now)) {
                // Perform attack
                soldier.lastAttackTime = now;
                
                if (soldier.isRanged) {
                    // Ranged attack - create projectile
                    this.createProjectile(soldier, soldier.currentTarget,
                        soldier.type === 'catapult' ? 'catapult' : 'arrow');
                } else {
                    // Melee attack - directly damage target
                    if (soldier.currentTarget && soldier.currentTarget.health) {
                        soldier.currentTarget.health -= soldier.damage;
                        
                        // Check if target is defeated
                        if (soldier.currentTarget.health <= 0) {
                            this.removeUnit(
                                soldier.currentTarget,
                                soldier.currentTarget.owner === 'player' ? 'player' : 'ai'
                            );
                            soldier.currentTarget = null;
                        }
                    }
                }
            }
        });
        
        // Update unit movement
        const updateUnit = (unit) => {
            if (unit.targetPosition) {
                const direction = new THREE.Vector3().subVectors(unit.targetPosition, unit.mesh.position);
                
                // If close enough to target, stop moving
                if (direction.length() < 0.1) {
                    unit.targetPosition = null;
                    return;
                }
                
                // Normalize and scale by speed
                direction.normalize().multiplyScalar(0.05);
                
                // Move toward target
                unit.mesh.position.add(direction);
                
                // Smoothly rotate to face movement direction
                if (unit.targetRotation !== undefined) {
                    const currentRotation = unit.mesh.rotation.y;
                    let rotDiff = unit.targetRotation - currentRotation;
                    
                    // Normalize to shortest path
                    if (rotDiff > Math.PI) rotDiff -= Math.PI * 2;
                    if (rotDiff < -Math.PI) rotDiff += Math.PI * 2;
                    
                    // Apply smooth rotation
                    unit.mesh.rotation.y += rotDiff * 0.1;
                }
            }
        };
        
        // Update player units
        this.soldiers.forEach(updateUnit);
        
        // Update AI units
        this.ai.soldiers.forEach(updateUnit);
        
        // Continue loop
        requestAnimationFrame(() => this.gameLoop());
    }
    
    // Check for combat between player and AI units
    checkCombat() {
        // Simple distance-based combat
        this.soldiers.forEach(playerUnit => {
            this.ai.soldiers.forEach(aiUnit => {
                const distance = playerUnit.mesh.position.distanceTo(aiUnit.mesh.position);
                
                // If units are close enough, they battle
                if (distance < 1.5) {
                    // Simple damage calculation
                    const playerDamage = Math.floor(Math.random() * 10) + 5;
                    const aiDamage = Math.floor(Math.random() * 10) + 5;
                    
                    // Apply damage
                    aiUnit.health -= playerDamage;
                    playerUnit.health -= aiDamage;
                    
                    // Check for defeated units
                    if (aiUnit.health <= 0) {
                        this.removeUnit(aiUnit, 'ai');
                    }
                    
                    if (playerUnit.health <= 0) {
                        this.removeUnit(playerUnit, 'player');
                    }
                }
            });
        });
    }
    
    // Remove a defeated unit
    removeUnit(unit, owner) {
        // Remove from scene
        this.scene.remove(unit.mesh);
        
        // Remove from appropriate array
        if (owner === 'player') {
            const index = this.soldiers.indexOf(unit);
            if (index !== -1) {
                this.soldiers.splice(index, 1);
            }
            
            // Also remove from selected units if necessary
            const selectedIndex = this.selectedUnits.indexOf(unit);
            if (selectedIndex !== -1) {
                this.selectedUnits.splice(selectedIndex, 1);
                this.updateUnitControlPanel();
            }
        } else {
            const index = this.ai.soldiers.indexOf(unit);
            if (index !== -1) {
                this.ai.soldiers.splice(index, 1);
            }
        }
    }
    
    // Helper method to add new building buttons after research
    addBuildingButton(type, description) {
        const createPanel = document.getElementById('create-panel');
        if (!createPanel) return;
        
        const button = document.createElement('button');
        button.className = 'create-button premium';
        button.onclick = () => this.createBuilding(type);
        button.innerHTML = description;
        
        createPanel.appendChild(button);
    }
    
    // Handle mouse down for unit selection - fixed to prevent accidental deselection
    handleMouseDown(event) {
        // Only handle left-click for unit selection
        if (event.button !== 0) return;
        
        // Skip if we've clicked on a UI element
        if (event.target.tagName === 'BUTTON' || event.target.closest('.ui-panel')) {
            return;
        }
        
        // Start unit selection
        this.isUnitSelectionActive = true;
        this.selectionStart = {
            x: event.clientX,
            y: event.clientY
        };
        
        // Create selection box if it doesn't exist
        if (!this.selectionBox) {
            this.selectionBox = document.createElement('div');
            this.selectionBox.className = 'selection-box';
            this.selectionBox.style.border = '1px dashed #00FFFF';
            this.selectionBox.style.backgroundColor = 'rgba(0, 255, 255, 0.1)';
            document.body.appendChild(this.selectionBox);
        }
        
        // Position the selection box
        this.selectionBox.style.display = 'block';
        this.selectionBox.style.left = `${event.clientX}px`;
        this.selectionBox.style.top = `${event.clientY}px`;
        this.selectionBox.style.width = '0px';
        this.selectionBox.style.height = '0px';
    }
    
    // Handle mouse move for unit selection box
    handleMouseMove(event) {
        if (!this.isUnitSelectionActive || !this.selectionBox) return;
        
        const width = event.clientX - this.selectionStart.x;
        const height = event.clientY - this.selectionStart.y;
        
        // Update selection box size and position
        if (width >= 0) {
            this.selectionBox.style.width = `${width}px`;
        } else {
            this.selectionBox.style.left = `${event.clientX}px`;
            this.selectionBox.style.width = `${-width}px`;
        }
        
        if (height >= 0) {
            this.selectionBox.style.height = `${height}px`;
        } else {
            this.selectionBox.style.top = `${event.clientY}px`;
            this.selectionBox.style.height = `${-height}px`;
        }
    }
    
    // Handle mouse up to complete unit selection
    handleMouseUp(event) {
        // Only handle left-click for unit selection
        if (event.button !== 0 || !this.isUnitSelectionActive) return;
        
        // Cancel selection if preventDeselection flag is set
        if (this.preventDeselection) {
            this.preventDeselection = false;
            this.isUnitSelectionActive = false;
            if (this.selectionBox) {
                this.selectionBox.style.display = 'none';
            }
            return;
        }
        
        // Get selection box dimensions
        const selectionRect = this.selectionBox.getBoundingClientRect();
        
        // Check if click was merely a tiny movement (single click)
        const isSmallSelection = selectionRect.width < 5 && selectionRect.height < 5;
        
        // Get mouse position for single click selection
        const mouse = new THREE.Vector2();
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, camera); // Using global camera
        
        // Clear previous selection if not holding Shift
        if (!event.shiftKey) {
            this.clearUnitSelection();
        }
        
        if (isSmallSelection) {
            // Single click - select one unit
            const soldierMeshes = this.soldiers.map(soldier => soldier.mesh);
            const intersects = raycaster.intersectObjects(soldierMeshes, true);
            
            if (intersects.length > 0) {
                // Find soldier object from mesh
                let selectedObject = intersects[0].object;
                // Go up to find the Group that contains this mesh
                while (selectedObject.parent && !selectedObject.parent.isScene) {
                    selectedObject = selectedObject.parent;
                }
                
                const selectedSoldier = this.soldiers.find(s => s.mesh === selectedObject);
                
                if (selectedSoldier) {
                    selectedSoldier.selected = true;
                    this.selectedUnits.push(selectedSoldier);
                    
                    // Show selection ring
                    if (selectedSoldier.selectionRing) {
                        selectedSoldier.selectionRing.material.visible = true;
                    }
                }
            }
        } else {
            // Selection box - select multiple units
            this.soldiers.forEach(soldier => {
                // Get screen position of soldier
                const soldierPos = new THREE.Vector3();
                soldier.mesh.getWorldPosition(soldierPos);
                
                // Project to screen coordinates
                const screenPos = soldierPos.project(camera);
                
                // Convert to viewport coordinates
                const x = (screenPos.x + 1) * window.innerWidth / 2;
                const y = (-screenPos.y + 1) * window.innerHeight / 2;
                
                // Check if soldier is inside selection box
                if (x >= selectionRect.left && x <= selectionRect.right &&
                    y >= selectionRect.top && y <= selectionRect.bottom) {
                    // Select this soldier
                    soldier.selected = true;
                    this.selectedUnits.push(soldier);
                    
                    // Show selection ring
                    if (soldier.selectionRing) {
                        soldier.selectionRing.material.visible = true;
                    }
                }
            });
        }
        
        // Update unit control panel if units are selected
        if (this.selectedUnits.length > 0) {
            this.updateUnitControlPanel();
        }
        
        // Clean up
        this.isUnitSelectionActive = false;
        if (this.selectionBox) {
            this.selectionBox.style.display = 'none';
        }
    }
    
    // Clear all unit selections
    clearUnitSelection() {
        this.selectedUnits.forEach(unit => {
            unit.selected = false;
            if (unit.selectionRing) {
                unit.selectionRing.material.visible = false;
            }
        });
        
        this.selectedUnits = [];
        
        // Hide unit control panel
        const panel = document.getElementById('unit-control-panel');
        if (panel) {
            panel.style.display = 'none';
        }
    }
    
    // Update the unit control panel with information about selected units
    updateUnitControlPanel() {
        const panel = document.getElementById('unit-control-panel');
        if (!panel) return;
        
        // Show panel
        panel.style.display = 'flex';
        
        // Update unit count
        const countElement = document.getElementById('selected-unit-count');
        if (countElement) {
            countElement.textContent = this.selectedUnits.length;
        }
        
        // Update unit type breakdown
        const breakdownElement = document.getElementById('unit-type-breakdown');
        if (breakdownElement) {
            const types = {};
            this.selectedUnits.forEach(unit => {
                types[unit.type] = (types[unit.type] || 0) + 1;
            });
            
            let breakdownHTML = '';
            for (const [type, count] of Object.entries(types)) {
                breakdownHTML += `<div>${count}x ${type}</div>`;
            }
            
            breakdownElement.innerHTML = breakdownHTML;
        }
        
        // Update health info - shows average health of selected units
        const healthElement = document.getElementById('unit-health');
        if (healthElement && this.selectedUnits.length > 0) {
            const totalHealth = this.selectedUnits.reduce((sum, unit) => sum + unit.health, 0);
            const avgHealth = Math.floor(totalHealth / this.selectedUnits.length);
            healthElement.textContent = avgHealth;
        }
    }
    
    // Move units to a target location
    moveUnitsTo(x, z) {
        if (this.selectedUnits.length === 0) return;
        
        // Get the target position
        const targetPos = new THREE.Vector3(x, 0, z);
        
        // For formation movement, calculate positions in a grid or circle
        const unitCount = this.selectedUnits.length;
        const gridSize = Math.ceil(Math.sqrt(unitCount));
        const spacing = 1.5; // Space between units
        
        this.selectedUnits.forEach((unit, index) => {
            // Calculate grid position
            const row = Math.floor(index / gridSize);
            const col = index % gridSize;
            
            // Center the formation on the target point
            const offsetX = (col - (gridSize - 1) / 2) * spacing;
            const offsetZ = (row - (Math.ceil(unitCount / gridSize) - 1) / 2) * spacing;
            
            // Set the target position for this unit
            unit.targetPosition = new THREE.Vector3(
                targetPos.x + offsetX,
                0,
                targetPos.z + offsetZ
            );
            
            // Calculate direction to face
            const direction = new THREE.Vector3(
                unit.targetPosition.x - unit.mesh.position.x,
                0,
                unit.targetPosition.z - unit.mesh.position.z
            ).normalize();
            
            // Set the target rotation
            unit.targetRotation = Math.atan2(direction.x, direction.z);
        });
    }

    // Toggle debug panel visibility
    toggleDebugPanel() {
        const panel = document.getElementById('debug-panel');
        if (panel.style.display === 'none') {
            panel.style.display = 'flex';
        } else {
            panel.style.display = 'none';
        }
    }

    // Close debug panel
    closeDebugPanel() {
        document.getElementById('debug-panel').style.display = 'none';
    }

    // Add money from debug panel
    addMoney(amount) {
        amount = parseInt(amount);
        if (!isNaN(amount) && amount > 0) {
            this.money += amount;
            this.updateMoneyDisplay();
            console.log(`Added ${amount} money. New total: ${this.money}`);
        }
    }

    // Add research points from debug panel
    addResearchPoints(amount) {
        amount = parseInt(amount);
        if (!isNaN(amount) && amount > 0) {
            this.researchPoints += amount;
            this.updateResearchDisplay();
            console.log(`Added ${amount} research points. New total: ${this.researchPoints}`);
        }
    }

    // Toggle instant research feature
    toggleInstantResearch(enabled) {
        this.instantResearchEnabled = enabled;
        console.log(`Instant research ${enabled ? 'enabled' : 'disabled'}`);
        
        // If we're currently researching something and instant research was just enabled,
        // complete the current research immediately
        if (enabled && this.researching && this.currentResearch) {
            const tech = this.technologies[this.currentResearch.techId];
            
            // Apply the technology effect
            tech.effect();
            
            // Add to unlocked technologies
            this.unlockedTechnologies.push(this.currentResearch.techId);
            
            // Reset research state
            this.researching = false;
            this.currentResearch = null;
            
            // Update UI
            document.getElementById('research-status').style.display = 'none';
            
            // Notification
            console.log(`Current research "${tech.name}" completed instantly`);
            alert(`Research completed: ${tech.name}`);
        }
    }
}

// Handle move command from UI
function moveSelectedUnits() {
    if (!game.selectedUnits.length) return;
    
    // Set flag that next click is for movement
    game.isSettingMoveTarget = true;
    
    // Change cursor to indicate target selection
    document.body.style.cursor = 'crosshair';
    
    // Add one-time click handler for target selection
    const moveTargetHandler = function(event) {
        // Ignore if clicked on UI
        if (event.target.tagName === 'BUTTON' || event.target.closest('.ui-panel')) {
            return;
        }
        
        // Get click position in 3D space
        const mouse = new THREE.Vector2();
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, camera);
        
        // Cast ray to ground plane
        const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        const targetPoint = new THREE.Vector3();
        raycaster.ray.intersectPlane(groundPlane, targetPoint);
        
        // Move units to target
        game.moveUnitsTo(targetPoint.x, targetPoint.z);
        
        // Reset cursor and remove event listener
        document.body.style.cursor = 'default';
        document.removeEventListener('click', moveTargetHandler);
        game.isSettingMoveTarget = false;
    };
    
    document.addEventListener('click', moveTargetHandler);
}

// Global game object - will be initialized in main.js
let game = null;