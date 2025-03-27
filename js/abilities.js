// Define ability classes
class Ability {
    constructor(name, description, cooldown) {
        this.name = name;
        this.description = description;
        this.cooldown = cooldown; // in seconds
        this.currentCooldown = 0;
    }
    
    use(character, target) {
        if (this.currentCooldown > 0) {
            console.log(`${this.name} is on cooldown for ${this.currentCooldown} seconds`);
            return false;
        }
        
        // Implementation will be in derived classes
        this.currentCooldown = this.cooldown;
        return true;
    }
    
    updateCooldown(deltaTime) {
        if (this.currentCooldown > 0) {
            this.currentCooldown -= deltaTime;
            if (this.currentCooldown < 0) this.currentCooldown = 0;
        }
    }
}

// Common Abilities - Speedster
class AttackDash extends Ability {
    constructor() {
        super("Attack Dash", "Quickly dash towards the enemy and attack", 3);
    }
    
    use(character, target) {
        if (!super.use(character, target)) return false;
        
        console.log(`${character.name} dashes towards the target and attacks!`);
        
        // Create visual effect
        if (window.game && character.model) {
            window.game.createAbilityEffect('dash', character.model.position);
            
            // Move character forward quickly
            if (character === window.game.player) {
                const dashDistance = 5;
                character.model.position.x += Math.sin(character.model.rotation.y) * dashDistance;
                character.model.position.z += Math.cos(character.model.rotation.y) * dashDistance;
            }
        }
        
        return true;
    }
}

class Barrage extends Ability {
    constructor() {
        super("Barrage", "Launch a rapid series of attacks", 5);
    }
    
    use(character, target) {
        if (!super.use(character, target)) return false;
        
        console.log(`${character.name} unleashes a barrage of attacks!`);
        
        // Create multiple visual effects
        if (window.game && character.model) {
            for (let i = 0; i < 10; i++) {
                setTimeout(() => {
                    window.game.createAbilityEffect('barrage', character.model.position);
                }, i * 100); // Spread out over time
            }
        }
        
        return true;
    }
}

// Common Abilities - Predictor
class CounterAttack extends Ability {
    constructor() {
        super("Counter Attack", "Prepare to counter the next enemy attack", 8);
    }
    
    use(character, target) {
        if (!super.use(character, target)) return false;
        
        console.log(`${character.name} prepares to counter the next attack!`);
        
        // Create shield visual effect
        if (window.game && character.model) {
            window.game.createAbilityEffect('counter', character.model.position);
            
            // Set counter flag
            character.isCountering = true;
            setTimeout(() => {
                character.isCountering = false;
            }, 5000); // Counter lasts 5 seconds
        }
        
        return true;
    }
}

class SmartPunch extends Ability {
    constructor() {
        super("Smart Punch", "Analyze and strike the enemy's weak point", 4);
    }
    
    use(character, target) {
        if (!super.use(character, target)) return false;
        
        console.log(`${character.name} analyzes and strikes the weak point!`);
        
        if (window.game && character.model) {
            // Create visual effect
            const punchEffect = window.game.createAbilityEffect('smartpunch', character.model.position);
            
            // Find closest enemy and deal critical damage
            let closestEnemy = null;
            let closestDistance = Infinity;
            
            if (window.game.enemies) {
                window.game.enemies.forEach(enemy => {
                    if (!enemy.model) return;
                    
                    const distance = window.game.calculateDistance(
                        character.model.position,
                        enemy.model.position
                    );
                    
                    if (distance < closestDistance && distance < 4) {
                        closestEnemy = enemy;
                        closestDistance = distance;
                    }
                });
                
                if (closestEnemy) {
                    // Critical hit (double damage)
                    const damage = character.attackPower * 2;
                    closestEnemy.takeDamage(damage, character);
                    
                    // Create critical hit effect
                    window.game.createAbilityEffect('critical', closestEnemy.model.position);
                }
            }
        }
        
        return true;
    }
}

// Rare Abilities - Gun Manipulator
class FastShot extends Ability {
    constructor() {
        super("Fast Shot", "Fire a quick projectile at the enemy", 2);
    }
    
    use(character, target) {
        if (!super.use(character, target)) return false;
        
        console.log(`${character.name} fires a quick shot!`);
        
        if (window.game && character.model) {
            // Create projectile
            const projectilePosition = character.model.position.clone();
            projectilePosition.y += 1; // Adjust to be at weapon height
            
            const projectile = window.game.createAbilityEffect('projectile', projectilePosition);
            
            // Calculate direction vector (forward from character)
            const direction = new THREE.Vector3(
                Math.sin(character.model.rotation.y),
                0,
                Math.cos(character.model.rotation.y)
            );
            
            // Store projectile data
            projectile.userData.direction = direction;
            projectile.userData.speed = 15;
            projectile.userData.damage = character.attackPower * 0.8;
            projectile.userData.owner = character;
            projectile.userData.range = 20;
            projectile.userData.distanceTraveled = 0;
            
            // Add to projectiles array for updating
            if (!window.game.projectiles) window.game.projectiles = [];
            window.game.projectiles.push(projectile);
        }
        
        return true;
    }
}

class Sentry extends Ability {
    constructor() {
        super("Sentry", "Place a sentry gun that fires at nearby enemies", 15);
    }
    
    use(character, target) {
        if (!super.use(character, target)) return false;
        
        console.log(`${character.name} deploys a sentry gun!`);
        
        if (window.game && character.model) {
            // Create sentry model
            const sentryPosition = character.model.position.clone();
            sentryPosition.x += Math.sin(character.model.rotation.y + Math.PI/2) * 2; // Place to the side
            sentryPosition.z += Math.cos(character.model.rotation.y + Math.PI/2) * 2;
            
            const sentry = window.game.createAbilityEffect('sentry', sentryPosition);
            
            // Sentry properties
            sentry.userData.owner = character;
            sentry.userData.damage = character.attackPower * 0.5;
            sentry.userData.range = 10;
            sentry.userData.fireRate = 1; // Shots per second
            sentry.userData.cooldown = 0;
            sentry.userData.health = 30;
            sentry.userData.lifetime = 20; // Lasts 20 seconds
            
            // Add to sentries array for updating
            if (!window.game.sentries) window.game.sentries = [];
            window.game.sentries.push(sentry);
        }
        
        return true;
    }
}

class Explosion extends Ability {
    constructor() {
        super("Explosion", "Create an explosion that damages all nearby enemies", 12);
    }
    
    use(character, target) {
        if (!super.use(character, target)) return false;
        
        console.log(`${character.name} creates a powerful explosion!`);
        
        // Create explosion visual effect
        if (window.game && character.model) {
            const explosion = window.game.createAbilityEffect('explosion', character.model.position);
            
            // Damage nearby enemies
            if (window.game.enemies) {
                window.game.enemies.forEach(enemy => {
                    const distance = window.game.calculateDistance(
                        enemy.model.position,
                        character.model.position
                    );
                    
                    if (distance < 4) { // Explosion radius
                        enemy.takeDamage(30); // Explosion damage
                        console.log(`Enemy ${enemy.name} takes explosion damage!`);
                    }
                });
            }
        }
        
        return true;
    }
}

// Rare Abilities - Cloner
class AttackClone extends Ability {
    constructor() {
        super("Attack Clone", "Create a clone that attacks enemies", 10);
    }
    
    use(character, target) {
        if (!super.use(character, target)) return false;
        
        console.log(`${character.name} creates an attack clone!`);
        
        if (window.game && character.model) {
            // Create clone
            const clonePosition = character.model.position.clone();
            clonePosition.x += Math.sin(character.model.rotation.y) * 2; // Position in front
            clonePosition.z += Math.cos(character.model.rotation.y) * 2;
            
            const clone = window.game.createAbilityEffect('clone', clonePosition);
            
            // Match color to character
            clone.traverse(child => {
                if (child instanceof THREE.Mesh) {
                    if (character.model.children[0] && character.model.children[0].material) {
                        child.material = character.model.children[0].material.clone();
                        child.material.transparent = true;
                        child.material.opacity = 0.7;
                    }
                }
            });
            
            // Clone properties
            clone.userData.owner = character;
            clone.userData.damage = character.attackPower * 0.7;
            clone.userData.health = character.maxHealth * 0.3;
            clone.userData.lifetime = 15; // Lasts 15 seconds
            clone.userData.attackCooldown = 0;
            clone.userData.attackRange = 3;
            
            // Add to clones array for updating
            if (!window.game.clones) window.game.clones = [];
            window.game.clones.push(clone);
        }
        
        return true;
    }
}

class CloneCombo extends Ability {
    constructor() {
        super("Clone Combo", "Use clones to perform a combo attack", 14);
    }
    
    use(character, target) {
        if (!super.use(character, target)) return false;
        
        console.log(`${character.name} performs a clone combo attack!`);
        
        if (window.game && character.model) {
            // Create multiple clones in a circle
            const cloneCount = 5;
            
            for (let i = 0; i < cloneCount; i++) {
                const angle = (i / cloneCount) * Math.PI * 2;
                
                const clonePosition = character.model.position.clone();
                const distance = 3;
                clonePosition.x += Math.sin(angle) * distance;
                clonePosition.z += Math.cos(angle) * distance;
                
                const clone = window.game.createAbilityEffect('clone', clonePosition);
                
                // Match color
                clone.traverse(child => {
                    if (child instanceof THREE.Mesh) {
                        if (character.model.children[0] && character.model.children[0].material) {
                            child.material = character.model.children[0].material.clone();
                            child.material.transparent = true;
                            child.material.opacity = 0.7;
                        }
                    }
                });
                
                // Rotate to face center
                clone.lookAt(character.model.position);
                
                // Short lifetime for combo attack
                clone.userData.lifetime = 2;
            }
            
            // Deal damage to nearby enemies
            if (window.game.enemies) {
                window.game.enemies.forEach(enemy => {
                    if (!enemy.model) return;
                    
                    const distance = window.game.calculateDistance(
                        character.model.position,
                        enemy.model.position
                    );
                    
                    if (distance < 5) { // Effect radius
                        enemy.takeDamage(character.attackPower * 2, character);
                    }
                });
            }
        }
        
        return true;
    }
}

class Mutation extends Ability {
    constructor() {
        super("Mutation", "Mutate yourself for enhanced abilities", 20);
    }
    
    use(character, target) {
        if (!super.use(character, target)) return false;
        
        console.log(`${character.name} mutates for enhanced abilities!`);
        
        if (window.game && character.model) {
            // Visual effect
            const mutationEffect = window.game.createAbilityEffect('mutation', character.model.position);
            mutationEffect.userData.lifetime = 5;
            
            // Scale up the character
            character.model.scale.set(1.5, 1.5, 1.5);
            
            // Color change
            character.model.traverse(child => {
                if (child instanceof THREE.Mesh && child.material) {
                    child.userData.originalColor = child.material.color.clone();
                    child.material.color.set(0x00ff99);
                }
            });
            
            // Stat boost
            character.originalAttackPower = character.attackPower;
            character.originalDefense = character.defense;
            character.attackPower *= 2;
            character.defense *= 1.5;
            
            // Reset after duration
            setTimeout(() => {
                if (character.model) {
                    // Return to normal size
                    character.model.scale.set(1, 1, 1);
                    
                    // Reset color
                    character.model.traverse(child => {
                        if (child instanceof THREE.Mesh && child.material && child.userData.originalColor) {
                            child.material.color = child.userData.originalColor;
                            delete child.userData.originalColor;
                        }
                    });
                    
                    // Reset stats
                    if (character.originalAttackPower) {
                        character.attackPower = character.originalAttackPower;
                        delete character.originalAttackPower;
                    }
                    if (character.originalDefense) {
                        character.defense = character.originalDefense;
                        delete character.originalDefense;
                    }
                }
            }, 10000); // 10 second duration
        }
        
        return true;
    }
}

// Epic Abilities - Necromancer
class ZombieHorde extends Ability {
    constructor() {
        super("Zombie Horde", "Summon a horde of zombies to attack enemies", 25);
    }
    
    use(character, target) {
        if (!super.use(character, target)) return false;
        
        console.log(`${character.name} summons a zombie horde!`);
        
        // Create multiple zombie visual effects
        if (window.game && character.model) {
            const zombieCount = 5;
            for (let i = 0; i < zombieCount; i++) {
                const zombie = window.game.createAbilityEffect('zombie', character.model.position);
                zombie.userData.target = target;
                zombie.userData.lifetime = 10; // Zombies last longer
                
                // Make zombies move and attack
                const moveInterval = setInterval(() => {
                    if (!zombie || !window.game) {
                        clearInterval(moveInterval);
                        return;
                    }
                    
                    // Move towards random enemy
                    if (window.game.enemies && window.game.enemies.length > 0) {
                        const randomEnemy = window.game.enemies[Math.floor(Math.random() * window.game.enemies.length)];
                        if (randomEnemy && randomEnemy.model) {
                            const direction = new THREE.Vector3(
                                randomEnemy.model.position.x - zombie.position.x,
                                0,
                                randomEnemy.model.position.z - zombie.position.z
                            ).normalize();
                            
                            zombie.position.x += direction.x * 0.05;
                            zombie.position.z += direction.z * 0.05;
                            
                            // Rotate to face direction
                            zombie.rotation.y = Math.atan2(direction.x, direction.z);
                            
                            // Attack if close enough
                            const distance = window.game.calculateDistance(
                                zombie.position,
                                randomEnemy.model.position
                            );
                            
                            if (distance < 1) {
                                randomEnemy.takeDamage(5);
                                console.log(`Zombie attacks enemy ${randomEnemy.name}!`);
                            }
                        }
                    }
                }, 100);
            }
        }
        
        return true;
    }
}

class GiantZombie extends Ability {
    constructor() {
        super("Giant Zombie", "Summon a powerful giant zombie", 30);
    }
    
    use(character, target) {
        if (!super.use(character, target)) return false;
        
        console.log(`${character.name} summons a giant zombie!`);
        
        if (window.game && character.model) {
            // Create giant zombie
            const zombiePosition = character.model.position.clone();
            zombiePosition.x += Math.sin(character.model.rotation.y) * 3; // In front of player
            zombiePosition.z += Math.cos(character.model.rotation.y) * 3;
            
            const zombie = window.game.createAbilityEffect('zombie', zombiePosition);
            
            // Make it giant
            zombie.scale.set(3, 3, 3);
            
            // Zombie properties
            zombie.userData.owner = character;
            zombie.userData.damage = character.attackPower * 2;
            zombie.userData.health = character.maxHealth * 0.7;
            zombie.userData.lifetime = 20; // Lasts 20 seconds
            zombie.userData.attackCooldown = 0;
            zombie.userData.attackRange = 3;
            zombie.userData.isGiant = true;
            
            // Add to zombies array for updating
            if (!window.game.zombies) window.game.zombies = [];
            window.game.zombies.push(zombie);
        }
        
        return true;
    }
}

class Lifesteal extends Ability {
    constructor() {
        super("Lifesteal", "Drain life from enemies to heal yourself", 8);
    }
    
    use(character, target) {
        if (!super.use(character, target)) return false;
        
        console.log(`${character.name} drains life from enemies!`);
        
        if (window.game && character.model) {
            // Visual effect
            const lifestealEffect = window.game.createAbilityEffect('lifesteal', character.model.position);
            lifestealEffect.userData.lifetime = 3;
            
            // Find all nearby enemies
            let totalDamage = 0;
            let enemiesHit = 0;
            
            if (window.game.enemies) {
                window.game.enemies.forEach(enemy => {
                    if (!enemy.model) return;
                    
                    const distance = window.game.calculateDistance(
                        character.model.position,
                        enemy.model.position
                    );
                    
                    if (distance < 8) { // Effect radius
                        const damage = character.attackPower * 0.6;
                        enemy.takeDamage(damage, character);
                        totalDamage += damage;
                        enemiesHit++;
                        
                        // Create visual connection between enemy and player
                        window.game.createLifestealBeam(enemy.model.position, character.model.position);
                    }
                });
            }
            
            // Heal based on damage and enemies hit
            const healing = totalDamage * 0.8 + enemiesHit * 5;
            if (healing > 0) {
                character.heal(healing);
            }
        }
        
        return true;
    }
}

class SoulRelease extends Ability {
    constructor() {
        super("Soul Release", "Release stored souls for a powerful attack", 18);
    }
    
    use(character, target) {
        if (!super.use(character, target)) return false;
        
        console.log(`${character.name} releases stolen souls for a powerful attack!`);
        
        if (window.game && character.model) {
            // Visual effect
            const soulEffect = window.game.createAbilityEffect('soulrelease', character.model.position);
            soulEffect.userData.lifetime = 3;
            
            // Calculate souls based on enemies defeated (placeholder logic)
            const soulCount = Math.min(10, window.game.enemiesDefeated || 3);
            
            // Deal damage based on soul count
            if (window.game.enemies) {
                window.game.enemies.forEach(enemy => {
                    if (!enemy.model) return;
                    
                    const distance = window.game.calculateDistance(
                        character.model.position,
                        enemy.model.position
                    );
                    
                    if (distance < 10) { // Effect radius
                        const damage = character.attackPower * (1 + soulCount * 0.5);
                        enemy.takeDamage(damage, character);
                    }
                });
            }
            
            // Create visual soul spirits
            for (let i = 0; i < soulCount; i++) {
                setTimeout(() => {
                    const angle = (i / soulCount) * Math.PI * 2;
                    const distance = 3;
                    
                    const soulPosition = character.model.position.clone();
                    soulPosition.x += Math.sin(angle) * distance;
                    soulPosition.z += Math.cos(angle) * distance;
                    soulPosition.y += 1;
                    
                    const soul = window.game.createAbilityEffect('soul', soulPosition);
                    
                    // Make soul move outward
                    soul.userData.direction = new THREE.Vector3(
                        Math.sin(angle),
                        0,
                        Math.cos(angle)
                    );
                    soul.userData.speed = 5;
                }, i * 100);
            }
        }
        
        return true;
    }
}

// Epic Abilities - Magnet
class MetalWall extends Ability {
    constructor() {
        super("Metal Wall", "Create a metal wall for protection", 12);
    }
    
    use(character, target) {
        if (!super.use(character, target)) return false;
        
        console.log(`${character.name} creates a metal wall!`);
        
        if (window.game && character.model) {
            // Create wall in front of character
            const wallPosition = character.model.position.clone();
            wallPosition.x += Math.sin(character.model.rotation.y) * 2; // In front
            wallPosition.z += Math.cos(character.model.rotation.y) * 2;
            
            const wall = window.game.createAbilityEffect('metalwall', wallPosition);
            
            // Rotate wall perpendicular to character's facing direction
            wall.rotation.y = character.model.rotation.y + Math.PI / 2;
            
            // Wall properties
            wall.userData.owner = character;
            wall.userData.health = character.maxHealth * 0.5;
            wall.userData.lifetime = 15; // Lasts 15 seconds
            
            // Add to walls array for collision
            if (!window.game.walls) window.game.walls = [];
            window.game.walls.push(wall);
        }
        
        return true;
    }
}

class MetalPunch extends Ability {
    constructor() {
        super("Metal Punch", "Enhance your punch with metal for high damage", 6);
    }
    
    use(character, target) {
        if (!super.use(character, target)) return false;
        
        console.log(`${character.name} throws a metal-enhanced punch!`);
        
        if (window.game && character.model) {
            // Create punch effect
            const punchPosition = character.model.position.clone();
            punchPosition.x += Math.sin(character.model.rotation.y) * 2; // In front
            punchPosition.z += Math.cos(character.model.rotation.y) * 2;
            punchPosition.y += 1;
            
            const punch = window.game.createAbilityEffect('metalpunch', punchPosition);
            
            // Damage enemies in front
            if (window.game.enemies) {
                window.game.enemies.forEach(enemy => {
                    if (!enemy.model) return;
                    
                    // Check if enemy is in front of character
                    const toEnemy = new THREE.Vector3(
                        enemy.model.position.x - character.model.position.x,
                        0,
                        enemy.model.position.z - character.model.position.z
                    ).normalize();
                    
                    const forward = new THREE.Vector3(
                        Math.sin(character.model.rotation.y),
                        0,
                        Math.cos(character.model.rotation.y)
                    );
                    
                    const dot = toEnemy.dot(forward);
                    const distance = window.game.calculateDistance(
                        character.model.position,
                        enemy.model.position
                    );
                    
                    if (dot > 0.7 && distance < 4) { // In front and close
                        enemy.takeDamage(character.attackPower * 2.5, character);
                        
                        // Knockback
                        if (enemy.model) {
                            enemy.model.position.x += forward.x * 3;
                            enemy.model.position.z += forward.z * 3;
                        }
                    }
                });
            }
        }
        
        return true;
    }
}

class MetalArmor extends Ability {
    constructor() {
        super("Metal Armor", "Cover yourself with metal armor for protection", 15);
    }
    
    use(character, target) {
        if (!super.use(character, target)) return false;
        
        console.log(`${character.name} creates metal armor!`);
        
        if (window.game && character.model) {
            // Visual effect
            const armorEffect = window.game.createAbilityEffect('metalarmor', character.model.position);
            
            // Make it follow the character
            armorEffect.userData.followTarget = character.model;
            armorEffect.userData.lifetime = 15; // 15 seconds duration
            
            // Increase defense
            character.originalDefense = character.defense;
            character.defense *= 3;
            
            // Reset after duration
            setTimeout(() => {
                if (character.originalDefense) {
                    character.defense = character.originalDefense;
                    delete character.originalDefense;
                }
            }, 15000);
        }
        
        return true;
    }
}

class Overheat extends Ability {
    constructor() {
        super("Overheat", "Overheat your metal to boost all abilities", 35);
    }
    
    use(character, target) {
        if (!super.use(character, target)) return false;
        
        console.log(`${character.name} overheats all metal abilities!`);
        
        if (window.game && character.model) {
            // Visual effect
            const heatEffect = window.game.createAbilityEffect('overheat', character.model.position);
            heatEffect.userData.followTarget = character.model;
            heatEffect.userData.lifetime = 20; // 20 seconds duration
            
            // Reset all ability cooldowns
            character.abilities.forEach(ability => {
                if (ability !== this) {
                    ability.currentCooldown = 0;
                }
            });
            
            // Boost all stats
            character.originalAttackPower = character.attackPower;
            character.originalDefense = character.defense;
            character.attackPower *= 1.5;
            character.defense *= 1.5;
            
            // Allow instant ability use for duration
            character.abilitySpeedMultiplier = 1.5;
            
            // Reset after duration
            setTimeout(() => {
                if (character.originalAttackPower) {
                    character.attackPower = character.originalAttackPower;
                    delete character.originalAttackPower;
                }
                if (character.originalDefense) {
                    character.defense = character.originalDefense;
                    delete character.originalDefense;
                }
                delete character.abilitySpeedMultiplier;
            }, 20000);
        }
        
        return true;
    }
}

// Legendary Abilities - Reality Controller
class RealityDragon extends Ability {
    constructor() {
        super("Reality Dragon", "Summon a dragon from another reality", 30);
    }
    
    use(character, target) {
        if (!super.use(character, target)) return false;
        
        console.log(`${character.name} summons a reality dragon!`);
        
        if (window.game && character.model) {
            // Create portal first
            const portalEffect = window.game.createAbilityEffect('portal', character.model.position);
            portalEffect.position.z += 5; // Place in front
            
            // Create dragon after portal animation
            setTimeout(() => {
                const dragonPosition = portalEffect.position.clone();
                const dragon = window.game.createAbilityEffect('dragon', dragonPosition);
                
                // Dragon properties
                dragon.userData.owner = character;
                dragon.userData.damage = character.attackPower * 3;
                dragon.userData.health = character.maxHealth * 1.5;
                dragon.userData.lifetime = 25; // Lasts 25 seconds
                dragon.userData.attackCooldown = 0;
                dragon.userData.attackRange = 15;
                dragon.userData.fireBreathCooldown = 5;
                
                // Add to dragons array for updating
                if (!window.game.dragons) window.game.dragons = [];
                window.game.dragons.push(dragon);
                
                // Remove portal
                window.game.world.scene.remove(portalEffect);
            }, 2000);
        }
        
        return true;
    }
}

class StatsBoost extends Ability {
    constructor() {
        super("Stats Boost", "Boost all your stats temporarily", 25);
    }
    
    use(character, target) {
        if (!super.use(character, target)) return false;
        
        console.log(`${character.name} boosts all stats!`);
        
        if (window.game && character.model) {
            // Visual effect
            const boostEffect = window.game.createAbilityEffect('statsboost', character.model.position);
            boostEffect.userData.followTarget = character.model;
            boostEffect.userData.lifetime = 15; // 15 seconds duration
            
            // Boost all stats
            character.originalAttackPower = character.attackPower;
            character.originalDefense = character.defense;
            character.originalMaxHealth = character.maxHealth;
            
            character.attackPower *= 2;
            character.defense *= 2;
            character.maxHealth *= 1.5;
            character.health = Math.min(character.health * 1.5, character.maxHealth);
            
            // Reset after duration
            setTimeout(() => {
                if (character.originalAttackPower) {
                    character.attackPower = character.originalAttackPower;
                    delete character.originalAttackPower;
                }
                if (character.originalDefense) {
                    character.defense = character.originalDefense;
                    delete character.originalDefense;
                }
                if (character.originalMaxHealth) {
                    character.maxHealth = character.originalMaxHealth;
                    character.health = Math.min(character.health, character.maxHealth);
                    delete character.originalMaxHealth;
                }
            }, 15000); // 15 second duration
        }
        
        return true;
    }
}

class Teleport extends Ability {
    constructor() {
        super("Teleport", "Teleport to a different location", 8);
    }
    
    use(character, target) {
        if (!super.use(character, target)) return false;
        
        console.log(`${character.name} teleports!`);
        
        if (window.game && character.model) {
            // Visual effect at original position
            const teleportEffect1 = window.game.createAbilityEffect('teleport', character.model.position.clone());
            
            // Teleport distance and direction (forward)
            const distance = 10;
            const direction = new THREE.Vector3(
                Math.sin(character.model.rotation.y),
                0,
                Math.cos(character.model.rotation.y)
            );
            
            // New position
            const newPosition = character.model.position.clone().addScaledVector(direction, distance);
            
            // Teleport
            character.model.position.copy(newPosition);
            
            // Visual effect at new position
            const teleportEffect2 = window.game.createAbilityEffect('teleport', character.model.position.clone());
        }
        
        return true;
    }
}

class PowerCopy extends Ability {
    constructor() {
        super("Power Copy", "Copy an enemy's power for a short time", 20);
    }
    
    use(character, target) {
        if (!super.use(character, target)) return false;
        
        console.log(`${character.name} copies the enemy's power!`);
        
        if (window.game && character.model) {
            // Visual effect
            const copyEffect = window.game.createAbilityEffect('powercopy', character.model.position);
            
            // Find closest enemy
            let closestEnemy = null;
            let closestDistance = Infinity;
            
            if (window.game.enemies) {
                window.game.enemies.forEach(enemy => {
                    if (!enemy.model) return;
                    
                    const distance = window.game.calculateDistance(
                        character.model.position,
                        enemy.model.position
                    );
                    
                    if (distance < closestDistance && distance < 8) {
                        closestEnemy = enemy;
                        closestDistance = distance;
                    }
                });
                
                if (closestEnemy && closestEnemy.abilities && closestEnemy.abilities.length > 0) {
                    // Copy first ability from enemy
                    const copiedAbility = closestEnemy.abilities[0];
                    
                    console.log(`${character.name} copies ${copiedAbility.name} from ${closestEnemy.name}!`);
                    
                    // Create beam connection between player and enemy
                    window.game.createBeamEffect(
                        character.model.position,
                        closestEnemy.model.position,
                        0x00ffff
                    );
                    
                    // Store original ability
                    character.originalAbility = character.abilities[4]; // Store in last slot
                    
                    // Replace with copied ability (temporarily)
                    character.abilities[4] = copiedAbility;
                    
                    // Update UI
                    if (window.game.updateCharacterUI) {
                        window.game.updateCharacterUI();
                    }
                    
                    // Reset after duration
                    setTimeout(() => {
                        if (character.originalAbility) {
                            character.abilities[4] = character.originalAbility;
                            delete character.originalAbility;
                            
                            if (window.game.updateCharacterUI) {
                                window.game.updateCharacterUI();
                            }
                        }
                    }, 15000); // 15 second duration
                }
            }
        }
        
        return true;
    }
}

class Domain extends Ability {
    constructor() {
        super("Domain (Ultimate)", "Trap enemies in your reality where you're 10x stronger", 60);
    }
    
    use(character, target) {
        if (!super.use(character, target)) return false;
        
        console.log(`${character.name} traps enemies in a different reality!`);
        
        if (window.game) {
            // Create portal effect
            const portalEffect = window.game.createAbilityEffect('portal', character.model.position);
            portalEffect.scale.set(10, 10, 10);
            
            // Enter alternate reality
            setTimeout(() => {
                window.game.enterAlternateReality(20); // Last for 20 seconds
            }, 1000);
        }
        
        return true;
    }
}

// Legendary Abilities - Chrono
class FastforwardPunches extends Ability {
    constructor() {
        super("Fastforward Punches", "Accelerate your punches through time", 10);
    }
    
    use(character, target) {
        if (!super.use(character, target)) return false;
        
        console.log(`${character.name} accelerates punches through time!`);
        
        if (window.game && character.model) {
            // Visual effects
            for (let i = 0; i < 8; i++) {
                setTimeout(() => {
                    const punchPosition = character.model.position.clone();
                    // Calculate position in front of character
                    punchPosition.x += Math.sin(character.model.rotation.y) * (i * 0.5 + 2);
                    punchPosition.z += Math.cos(character.model.rotation.y) * (i * 0.5 + 2);
                    punchPosition.y += 1;
                    
                    const punchEffect = window.game.createAbilityEffect('fastpunch', punchPosition);
                    punchEffect.userData.lifetime = 0.5;
                }, i * 100);
            }
            
            // Damage enemies in a line in front
            if (window.game.enemies) {
                window.game.enemies.forEach(enemy => {
                    if (!enemy.model) return;
                    
                    // Check if enemy is in front
                    const toEnemy = new THREE.Vector3(
                        enemy.model.position.x - character.model.position.x,
                        0,
                        enemy.model.position.z - character.model.position.z
                    ).normalize();
                    
                    const forward = new THREE.Vector3(
                        Math.sin(character.model.rotation.y),
                        0,
                        Math.cos(character.model.rotation.y)
                    );
                    
                    const dot = toEnemy.dot(forward);
                    const distance = window.game.calculateDistance(
                        character.model.position,
                        enemy.model.position
                    );
                    
                    if (dot > 0.7 && distance < 6) {
                        // Multiple hits
                        for (let i = 0; i < 5; i++) {
                            setTimeout(() => {
                                enemy.takeDamage(character.attackPower * 0.4, character);
                            }, i * 200);
                        }
                    }
                });
            }
        }
        
        return true;
    }
}

class TimeTravel extends Ability {
    constructor() {
        super("Time Travel", "Travel a few seconds back in time", 30);
    }
    
    use(character, target) {
        if (!super.use(character, target)) return false;
        
        console.log(`${character.name} travels back in time!`);
        
        if (window.game && character.model) {
            // Store current position and rotation
            if (!character.timeTravelPoints) {
                character.timeTravelPoints = [];
            }
            
            // If we have stored points, travel back to the oldest one
            if (character.timeTravelPoints.length > 0) {
                // Visual effect at current position
                const effectCurrent = window.game.createAbilityEffect('teleport', character.model.position.clone());
                
                // Get the oldest point (5 seconds back)
                const oldPoint = character.timeTravelPoints[0];
                
                // Teleport back
                character.model.position.copy(oldPoint.position);
                character.model.rotation.copy(oldPoint.rotation);
                
                // Heal to previous health state
                const healthDiff = oldPoint.health - character.health;
                if (healthDiff > 0) {
                    character.heal(healthDiff);
                }
                
                // Visual effect at new position
                const effectNew = window.game.createAbilityEffect('teleport', character.model.position.clone());
                
                // Clear time travel points
                character.timeTravelPoints = [];
            }
        }
        
        return true;
    }
    
    // Additional function to record position over time
    recordPosition(character, deltaTime) {
        if (!character || !character.model) return;
        
        // Initialize time travel points array if needed
        if (!character.timeTravelPoints) {
            character.timeTravelPoints = [];
        }
        
        // Record new point every second
        if (!character.recordTimer) character.recordTimer = 0;
        character.recordTimer += deltaTime;
        
        if (character.recordTimer >= 1) {
            character.recordTimer = 0;
            
            // Add current position, rotation, and health
            character.timeTravelPoints.push({
                position: character.model.position.clone(),
                rotation: character.model.rotation.clone(),
                health: character.health
            });
            
            // Keep only the last 5 seconds
            if (character.timeTravelPoints.length > 5) {
                character.timeTravelPoints.shift();
            }
        }
    }
}

class PerfectKick extends Ability {
    constructor() {
        super("Perfect Kick", "Perform a perfectly timed kick", 15);
    }
    
    use(character, target) {
        if (!super.use(character, target)) return false;
        
        console.log(`${character.name} performs a perfect kick!`);
        
        if (window.game && character.model) {
            // Visual effect
            const kickPosition = character.model.position.clone();
            kickPosition.x += Math.sin(character.model.rotation.y) * 2;
            kickPosition.z += Math.cos(character.model.rotation.y) * 2;
            kickPosition.y += 0.5;
            
            const kickEffect = window.game.createAbilityEffect('perfectkick', kickPosition);
            
            // Find enemies in front
            if (window.game.enemies) {
                window.game.enemies.forEach(enemy => {
                    if (!enemy.model) return;
                    
                    // Check if enemy is in front
                    const toEnemy = new THREE.Vector3(
                        enemy.model.position.x - character.model.position.x,
                        0,
                        enemy.model.position.z - character.model.position.z
                    ).normalize();
                    
                    const forward = new THREE.Vector3(
                        Math.sin(character.model.rotation.y),
                        0,
                        Math.cos(character.model.rotation.y)
                    );
                    
                    const dot = toEnemy.dot(forward);
                    const distance = window.game.calculateDistance(
                        character.model.position,
                        enemy.model.position
                    );
                    
                    if (dot > 0.7 && distance < 3) {
                        // Strong damage and knockback
                        enemy.takeDamage(character.attackPower * 3, character);
                        
                        // Knockback
                        enemy.model.position.x += forward.x * 5;
                        enemy.model.position.z += forward.z * 5;
                        
                        // Stun effect
                        enemy.stunned = true;
                        
                        // Remove stun after delay
                        setTimeout(() => {
                            enemy.stunned = false;
                        }, 3000);
                    }
                });
            }
        }
        
        return true;
    }
}

class FutureGun extends Ability {
    constructor() {
        super("Future Gun", "Use a weapon from the future", 20);
    }
    
    use(character, target) {
        if (!super.use(character, target)) return false;
        
        console.log(`${character.name} fires a weapon from the future!`);
        
        if (window.game && character.model) {
            // Create multiple laser beams in a cone pattern
            const beamCount = 5;
            const spreadAngle = Math.PI / 6; // 30 degree spread
            const baseDirection = new THREE.Vector3(
                Math.sin(character.model.rotation.y),
                0,
                Math.cos(character.model.rotation.y)
            );
            
            // Spawn point for beams
            const startPosition = character.model.position.clone();
            startPosition.y += 1;
            
            // Create each beam
            for (let i = 0; i < beamCount; i++) {
                // Calculate angle offset (-spreadAngle/2 to spreadAngle/2)
                const angleOffset = spreadAngle * (i / (beamCount - 1) - 0.5);
                
                // Rotate base direction by angle offset
                const direction = baseDirection.clone();
                direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), angleOffset);
                
                // End position for beam (20 units away)
                const endPosition = startPosition.clone().addScaledVector(direction, 20);
                
                // Create beam effect
                const beam = window.game.createBeamEffect(
                    startPosition,
                    endPosition,
                    0x00ffff
                );
                
                // Check for enemies hit by this beam
                if (window.game.enemies) {
                    window.game.enemies.forEach(enemy => {
                        if (!enemy.model) return;
                        
                        // Simple check: is enemy close to beam line?
                        const enemyPosition = enemy.model.position.clone();
                        
                        // Project enemy position onto beam line
                        const beamDirection = new THREE.Vector3().subVectors(endPosition, startPosition).normalize();
                        const enemyDirection = new THREE.Vector3().subVectors(enemyPosition, startPosition);
                        const projection = beamDirection.dot(enemyDirection);
                        
                        if (projection > 0 && projection < 20) { // Within beam length
                            const projectedPoint = startPosition.clone().addScaledVector(beamDirection, projection);
                            const distanceFromBeam = new THREE.Vector3().subVectors(enemyPosition, projectedPoint).length();
                            
                            if (distanceFromBeam < 1) { // Close enough to beam
                                enemy.takeDamage(character.attackPower * 1.5, character);
                            }
                        }
                    });
                }
            }
        }
        
        return true;
    }
}

class TimeStop extends Ability {
    constructor() {
        super("Time Stop (Ultimate)", "Stop time for everyone except yourself", 60);
    }
    
    use(character, target) {
        if (!super.use(character, target)) return false;
        
        console.log(`${character.name} stops time!`);
        
        // Create time stop visual effect
        if (window.game && character.model) {
            const effect = window.game.createAbilityEffect('timestop', character.model.position);
            effect.userData.lifetime = 5; // Time stop lasts 5 seconds
            
            // Freeze enemies
            if (window.game.enemies) {
                window.game.enemies.forEach(enemy => {
                    enemy.timeStopFrozen = true;
                    
                    // Store original material for later restoration
                    if (enemy.model) {
                        enemy.model.traverse(child => {
                            if (child instanceof THREE.Mesh) {
                                child.userData.originalMaterial = child.material;
                                child.material = new THREE.MeshBasicMaterial({
                                    color: 0x88ccff,
                                    transparent: true,
                                    opacity: 0.7
                                });
                            }
                        });
                    }
                });
                
                // Unfreeze after effect ends
                setTimeout(() => {
                    window.game.enemies.forEach(enemy => {
                        enemy.timeStopFrozen = false;
                        
                        // Restore original materials
                        if (enemy.model) {
                            enemy.model.traverse(child => {
                                if (child instanceof THREE.Mesh && child.userData.originalMaterial) {
                                    child.material = child.userData.originalMaterial;
                                }
                            });
                        }
                    });
                    console.log("Time resumes flowing normally.");
                }, 5000);
            }
        }
        
        return true;
    }
}