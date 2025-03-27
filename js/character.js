// Character class definition
class Character {
    constructor(id, name, rarity, abilities = []) {
        this.id = id;
        this.name = name;
        this.rarity = rarity; // common, rare, epic, legendary
        this.abilities = abilities;
        
        // Health and combat attributes
        this.maxHealth = this.calculateMaxHealth(rarity);
        this.health = this.maxHealth;
        this.attackPower = this.calculateAttackPower(rarity);
        this.defense = this.calculateDefense(rarity);
        this.level = 1;
        
        // Status effects
        this.isCountering = false;
        
        // Position and model
        this.position = { x: 0, y: 0, z: 0 };
        this.rotation = { x: 0, y: 0, z: 0 };
        this.model = null; // 3D model reference
    }
    
    calculateMaxHealth(rarity) {
        switch(rarity) {
            case 'common': return 100;
            case 'rare': return 150;
            case 'epic': return 200;
            case 'legendary': return 250;
            default: return 100;
        }
    }
    
    calculateAttackPower(rarity) {
        switch(rarity) {
            case 'common': return 10;
            case 'rare': return 15;
            case 'epic': return 20;
            case 'legendary': return 25;
            default: return 10;
        }
    }
    
    calculateDefense(rarity) {
        switch(rarity) {
            case 'common': return 5;
            case 'rare': return 8;
            case 'epic': return 12;
            case 'legendary': return 15;
            default: return 5;
        }
    }
    
    useAbility(abilityIndex, target) {
        if (abilityIndex >= 0 && abilityIndex < this.abilities.length) {
            return this.abilities[abilityIndex].use(this, target);
        }
        return false;
    }
    
    update(deltaTime) {
        // Update ability cooldowns
        for (const ability of this.abilities) {
            ability.updateCooldown(deltaTime);
        }
        
        // Handle health regeneration
        if (this.health < this.maxHealth) {
            this.health += (0.5 * deltaTime); // Regenerate 0.5 health per second
            if (this.health > this.maxHealth) {
                this.health = this.maxHealth;
            }
        }
    }
    
    takeDamage(amount, attacker = null) {
        // Apply defense reduction
        let damage = Math.max(1, amount - this.defense * 0.5);
        
        // Check for counter
        if (this.isCountering && attacker) {
            console.log(`${this.name} counters the attack!`);
            this.isCountering = false; // Counter used up
            
            // Reflect damage back to attacker
            if (attacker) {
                attacker.takeDamage(damage * 1.5);
                
                // Create counter effect
                if (window.game) {
                    window.game.createAbilityEffect('counter', this.model.position);
                }
            }
            
            return; // No damage taken
        }
        
        this.health -= damage;
        
        if (this.health < 0) {
            this.health = 0;
            this.onDeath();
        }
        
        // Add damage number effect
        if (window.game && this.model) {
            window.game.createDamageNumber(damage, this.model.position);
        }
        
        return damage;
    }
    
    heal(amount) {
        const oldHealth = this.health;
        this.health += amount;
        if (this.health > this.maxHealth) this.health = this.maxHealth;
        
        // Add healing number effect
        if (window.game && this.model) {
            const healingAmount = this.health - oldHealth;
            window.game.createHealingNumber(healingAmount, this.model.position);
        }
        
        return this.health - oldHealth;
    }
    
    onDeath() {
        console.log(`${this.name} has been defeated!`);
        
        // If enemy, remove from game
        if (window.game && this !== window.game.player) {
            const index = window.game.enemies.indexOf(this);
            if (index >= 0) {
                window.game.enemies.splice(index, 1);
                
                // Remove from scene
                if (this.model) {
                    window.game.world.scene.remove(this.model);
                }
            }
        }
    }
    
    attack(target) {
        // Only attack occasionally to prevent constant damage
        if (Math.random() < 0.01) {
            console.log(`${this.name} attacks ${target.name}!`);
            
            // Calculate damage based on attack power and some randomness
            const damage = this.attackPower * (0.8 + Math.random() * 0.4);
            target.takeDamage(Math.round(damage), this);
            
            // Simple attack animation - a small forward lunge
            if (this.model && target.model) {
                const originalPosition = this.model.position.clone();
                const direction = new THREE.Vector3(
                    target.model.position.x - this.model.position.x,
                    0,
                    target.model.position.z - this.model.position.z
                ).normalize();
                
                // Lunge forward
                this.model.position.add(direction.multiplyScalar(0.5));
                
                // Return to original position
                setTimeout(() => {
                    if (this.model) {
                        this.model.position.copy(originalPosition);
                    }
                }, 200);
            }
        }
    }
}

// Character factory for creating characters of different rarities
class CharacterFactory {
    static createCharacter(type) {
        switch (type) {
            case 'speedster':
                return new Character(
                    Date.now(),
                    'Speedster',
                    'common',
                    [new AttackDash(), new Barrage()]
                );
            
            case 'predictor':
                return new Character(
                    Date.now(),
                    'Predictor',
                    'common',
                    [new CounterAttack(), new SmartPunch()]
                );
            
            case 'gunManipulator':
                return new Character(
                    Date.now(),
                    'Gun Manipulator',
                    'rare',
                    [new FastShot(), new Sentry(), new Explosion()]
                );
            
            case 'cloner':
                return new Character(
                    Date.now(),
                    'Cloner',
                    'rare',
                    [new AttackClone(), new CloneCombo(), new Mutation()]
                );
            
            case 'necromancer':
                return new Character(
                    Date.now(),
                    'Necromancer',
                    'epic',
                    [new ZombieHorde(), new GiantZombie(), new Lifesteal(), new SoulRelease()]
                );
            
            case 'magnet':
                return new Character(
                    Date.now(),
                    'Magnet',
                    'epic',
                    [new MetalWall(), new MetalPunch(), new MetalArmor(), new Overheat()]
                );
            
            case 'realityController':
                return new Character(
                    Date.now(),
                    'Reality Controller',
                    'legendary',
                    [new RealityDragon(), new StatsBoost(), new Teleport(), new PowerCopy(), new Domain()]
                );
            
            case 'chrono':
                return new Character(
                    Date.now(),
                    'Chrono',
                    'legendary',
                    [new FastforwardPunches(), new TimeTravel(), new PerfectKick(), new FutureGun(), new TimeStop()]
                );
            
            default:
                throw new Error(`Unknown character type: ${type}`);
        }
    }
    
    static rollCharacter() {
        // Probability: common 60%, rare 25%, epic 10%, legendary 5%
        const roll = Math.random() * 100;
        let type;
        
        if (roll < 60) {
            // Common - 60%
            type = Math.random() < 0.5 ? 'speedster' : 'predictor';
        } else if (roll < 85) {
            // Rare - 25%
            type = Math.random() < 0.5 ? 'gunManipulator' : 'cloner';
        } else if (roll < 95) {
            // Epic - 10%
            type = Math.random() < 0.5 ? 'necromancer' : 'magnet';
        } else {
            // Legendary - 5%
            type = Math.random() < 0.5 ? 'realityController' : 'chrono';
        }
        
        return CharacterFactory.createCharacter(type);
    }
}
