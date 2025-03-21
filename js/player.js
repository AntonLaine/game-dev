class Player {
    constructor(game, x, y) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.radius = 20;
        this.speed = 5;
        this.angle = 0;
        
        this.health = 100;
        this.maxHealth = 100;
        this.isInvulnerable = false;
        this.invulnerableTime = 0;
        
        this.weapon = new Pistol(this.game, this);
        this.weapons = [
            new Pistol(this.game, this),
            new Shotgun(this.game, this),
            new AssaultRifle(this.game, this)
        ];
        this.currentWeaponIndex = 0;
        
        // Weapon upgrade properties
        this.weaponUpgrades = {
            spread: false,
            spreadCount: 0,
            rapid: false,
            rapidCount: 0,
            laser: false,
            pierceCount: 0,
            explosive: false,
            explosionRadius: 0
        };
        
        // Special abilities
        this.abilities = {
            sentry: false,
            sentryCount: 0,
            sentryCooldown: 0,
            sentryCurrentCooldown: 0,
            
            blade: false,
            bladeDamage: 50,
            bladeRange: 100,
            bladeCooldown: 0,
            bladeCurrentCooldown: 0,
            bladeActive: false,
            bladeAnimTime: 0,
            
            regeneration: false,
            regenAmount: 0,
            regenInterval: 0,
            regenTimer: 0,
            
            dash: false,
            dashSpeed: 15,
            dashDuration: 200,
            dashCooldown: 0,
            dashCurrentCooldown: 0,
            dashActive: false,
            dashTimer: 0,
            dashDirection: { x: 0, y: 0 },
            
            aura: false,
            auraRadius: 0,
            auraDamage: 0,
            auraDamageInterval: 500,
            auraTimer: 0
        };
        
        // Movement animation
        this.walkFrame = 0;
        this.walkFrameTime = 0;
        
        // Muzzle flash
        this.muzzleFlash = false;
        this.muzzleFlashDuration = 50;
        this.muzzleFlashTime = 0;
    }
    
    update(deltaTime) {
        // Update invulnerability
        if (this.isInvulnerable) {
            this.invulnerableTime -= deltaTime;
            if (this.invulnerableTime <= 0) {
                this.isInvulnerable = false;
            }
        }
        
        // Update weapon
        this.weapon = this.weapons[this.currentWeaponIndex];
        this.weapon.update(deltaTime);
        
        // Update muzzle flash
        if (this.muzzleFlash) {
            this.muzzleFlashTime -= deltaTime;
            if (this.muzzleFlashTime <= 0) {
                this.muzzleFlash = false;
            }
        }
        
        // Update special abilities
        this.updateAbilities(deltaTime);
        
        // Update walk animation
        let moving = false;
        if (this.game.keys['w'] || this.game.keys['a'] || this.game.keys['s'] || this.game.keys['d']) {
            this.walkFrameTime += deltaTime;
            if (this.walkFrameTime > 100) {
                this.walkFrame = (this.walkFrame + 1) % 8;
                this.walkFrameTime = 0;
            }
            moving = true;
        }
        
        if (!moving) {
            this.walkFrame = 0;
        }
        
        // Calculate angle based on mouse position
        const dx = this.game.mouse.x - this.x;
        const dy = this.game.mouse.y - this.y;
        this.angle = Math.atan2(dy, dx);
        
        // Movement
        if (!this.abilities.dashActive) {
            let vx = 0;
            let vy = 0;
            
            if (this.game.keys['w']) vy -= this.speed;
            if (this.game.keys['s']) vy += this.speed;
            if (this.game.keys['a']) vx -= this.speed;
            if (this.game.keys['d']) vx += this.speed;
            
            // Normalize diagonal movement
            if (vx !== 0 && vy !== 0) {
                const magnitude = Math.sqrt(vx * vx + vy * vy);
                vx = (vx / magnitude) * this.speed;
                vy = (vy / magnitude) * this.speed;
            }
            
            // Apply movement
            this.x += vx;
            this.y += vy;
            
            // Store movement direction for dash
            if (vx !== 0 || vy !== 0) {
                this.abilities.dashDirection = { x: vx, y: vy };
            }
        } else {
            // Apply dash movement
            this.x += this.abilities.dashDirection.x;
            this.y += this.abilities.dashDirection.y;
        }
        
        // Keep player within bounds
        if (this.x < this.radius) this.x = this.radius;
        if (this.x > this.game.canvas.width - this.radius) this.x = this.game.canvas.width - this.radius;
        if (this.y < this.radius) this.y = this.radius;
        if (this.y > this.game.canvas.height - this.radius) this.y = this.game.canvas.height - this.radius;
    }
    
    updateAbilities(deltaTime) {
        // Update sentry cooldown
        if (this.abilities.sentry && this.abilities.sentryCurrentCooldown > 0) {
            this.abilities.sentryCurrentCooldown -= deltaTime;
        }
        
        // Update blade cooldown and animation
        if (this.abilities.blade) {
            if (this.abilities.bladeCurrentCooldown > 0) {
                this.abilities.bladeCurrentCooldown -= deltaTime;
            }
            
            if (this.abilities.bladeActive) {
                this.abilities.bladeAnimTime -= deltaTime;
                if (this.abilities.bladeAnimTime <= 0) {
                    this.abilities.bladeActive = false;
                }
            }
        }
        
        // Update regeneration
        if (this.abilities.regeneration) {
            this.abilities.regenTimer += deltaTime;
            if (this.abilities.regenTimer >= this.abilities.regenInterval) {
                this.heal(this.abilities.regenAmount);
                this.abilities.regenTimer = 0;
            }
        }
        
        // Update dash
        if (this.abilities.dash) {
            if (this.abilities.dashCurrentCooldown > 0) {
                this.abilities.dashCurrentCooldown -= deltaTime;
            }
            
            if (this.abilities.dashActive) {
                this.abilities.dashTimer -= deltaTime;
                if (this.abilities.dashTimer <= 0) {
                    this.abilities.dashActive = false;
                }
            }
        }
        
        // Update damage aura
        if (this.abilities.aura) {
            this.abilities.auraTimer += deltaTime;
            if (this.abilities.auraTimer >= this.abilities.auraDamageInterval) {
                this.applyAuraDamage();
                this.abilities.auraTimer = 0;
            }
        }
    }
    
    applyAuraDamage() {
        if (!this.abilities.aura) return;
        
        for (const zombie of this.game.zombies) {
            const dx = zombie.x - this.x;
            const dy = zombie.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance <= this.abilities.auraRadius) {
                zombie.takeDamage(this.abilities.auraDamage);
                
                // Create particle effect
                for (let i = 0; i < 2; i++) {
                    this.game.particles.push(
                        new AuraParticle(
                            this.game,
                            zombie.x + (Math.random() - 0.5) * 20,
                            zombie.y + (Math.random() - 0.5) * 20
                        )
                    );
                }
            }
        }
    }
    
    draw(ctx) {
        // Draw shadow
        ctx.beginPath();
        ctx.ellipse(this.x, this.y + 15, this.radius, this.radius / 2, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fill();
        
        // Draw damage aura if active
        if (this.abilities.aura) {
            const gradient = ctx.createRadialGradient(
                this.x, this.y, 0,
                this.x, this.y, this.abilities.auraRadius
            );
            gradient.addColorStop(0, 'rgba(255, 100, 100, 0.1)');
            gradient.addColorStop(0.7, 'rgba(255, 50, 50, 0.05)');
            gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
            
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.abilities.auraRadius, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();
        }
        
        // Draw player body
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        
        // Flash when invulnerable
        if (this.isInvulnerable && Math.floor(this.invulnerableTime / 100) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }
        
        // Draw body
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#3498db';
        ctx.fill();
        ctx.strokeStyle = '#2980b9';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Draw weapon
        this.weapon.draw(ctx);
        
        // Draw muzzle flash
        if (this.muzzleFlash) {
            const flashSize = this.radius * 0.8;
            ctx.beginPath();
            ctx.arc(this.radius + 15, 0, flashSize, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 200, 50, 0.8)';
            ctx.fill();
        }
        
        // Draw blade attack if active
        if (this.abilities.bladeActive) {
            const progress = this.abilities.bladeAnimTime / 300; // Animation time
            const swipeAngle = Math.PI / 2 * progress;
            
            ctx.beginPath();
            ctx.arc(0, 0, this.abilities.bladeRange, -swipeAngle, swipeAngle);
            ctx.lineTo(0, 0);
            ctx.closePath();
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.fill();
            
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(this.abilities.bladeRange * Math.cos(swipeAngle), this.abilities.bladeRange * Math.sin(swipeAngle));
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.lineWidth = 3;
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(this.abilities.bladeRange * Math.cos(-swipeAngle), this.abilities.bladeRange * Math.sin(-swipeAngle));
            ctx.stroke();
        }
        
        ctx.restore();
        
        // Draw dash effect
        if (this.abilities.dashActive) {
            ctx.save();
            ctx.globalAlpha = this.abilities.dashTimer / this.abilities.dashDuration;
            
            // Draw trail effect
            for (let i = 0; i < 5; i++) {
                const trailDistance = i * 10;
                const trailX = this.x - this.abilities.dashDirection.x * trailDistance;
                const trailY = this.y - this.abilities.dashDirection.y * trailDistance;
                
                ctx.beginPath();
                ctx.arc(trailX, trailY, this.radius * (1 - i * 0.15), 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(52, 152, 219, 0.3)';
                ctx.fill();
            }
            
            ctx.restore();
        }
    }
    
    shoot() {
        if (this.weapon.canShoot()) {
            if (this.weaponUpgrades.spread) {
                this.shootSpread();
            } else if (this.weaponUpgrades.rapid) {
                this.shootRapid();
            } else {
                this.shootNormal();
            }
            
            this.muzzleFlash = true;
            this.muzzleFlashTime = this.muzzleFlashDuration;
        }
    }
    
    shootNormal() {
        const angle = this.angle + (Math.random() - 0.5) * this.weapon.spread;
        const bullet = this.createBullet(angle);
        this.game.addBullet(bullet);
        
        // Create shell casing
        this.game.createShellCasing(
            this.x + Math.cos(this.angle) * 10,
            this.y + Math.sin(this.angle) * 10,
            this.angle + Math.PI / 2
        );
        
        this.weapon.ammo--;
    }
    
    shootSpread() {
        const spreadAngle = 0.2; // Total angle of spread in radians
        
        for (let i = 0; i < this.weaponUpgrades.spreadCount; i++) {
            const angleOffset = spreadAngle * (i / (this.weaponUpgrades.spreadCount - 1) - 0.5);
            const angle = this.angle + angleOffset + (Math.random() - 0.5) * this.weapon.spread * 0.5;
            const bullet = this.createBullet(angle);
            this.game.addBullet(bullet);
        }
        
        // Create shell casing
        this.game.createShellCasing(
            this.x + Math.cos(this.angle) * 10,
            this.y + Math.sin(this.angle) * 10,
            this.angle + Math.PI / 2
        );
        
        this.weapon.ammo--;
    }
    
    shootRapid() {
        const bullet = this.createBullet(this.angle + (Math.random() - 0.5) * this.weapon.spread);
        this.game.addBullet(bullet);
        
        // Create shell casing
        this.game.createShellCasing(
            this.x + Math.cos(this.angle) * 10,
            this.y + Math.sin(this.angle) * 10,
            this.angle + Math.PI / 2
        );
        
        this.weapon.ammo--;
        
        // Schedule additional shots
        for (let i = 1; i < this.weaponUpgrades.rapidCount; i++) {
            setTimeout(() => {
                if (!this.game.isRunning || this.game.isPaused) return;
                
                const bullet = this.createBullet(this.angle + (Math.random() - 0.5) * this.weapon.spread);
                this.game.addBullet(bullet);
                
                // Create shell casing
                this.game.createShellCasing(
                    this.x + Math.cos(this.angle) * 10,
                    this.y + Math.sin(this.angle) * 10,
                    this.angle + Math.PI / 2
                );
            }, i * 60); // 60ms between each shot
        }
    }
    
    createBullet(angle) {
        const bullet = new Bullet(
            this.game,
            this.x + Math.cos(this.angle) * 30,
            this.y + Math.sin(this.angle) * 30,
            angle,
            this.weapon.bulletSpeed * (this.weaponUpgrades.laser ? 1.5 : 1),
            this.weapon.damage
        );
        
        // Apply bullet upgrades
        if (this.weaponUpgrades.laser) {
            bullet.isPiercing = true;
            bullet.pierceCount = this.weaponUpgrades.pierceCount;
        }
        
        if (this.weaponUpgrades.explosive) {
            bullet.isExplosive = true;
            bullet.explosionRadius = this.weaponUpgrades.explosionRadius;
        }
        
        return bullet;
    }
    
    reload() {
        this.weapon.reload();
    }
    
    switchWeapon(index) {
        if (index >= 0 && index < this.weapons.length) {
            this.currentWeaponIndex = index;
        }
    }
    
    nextWeapon() {
        this.currentWeaponIndex = (this.currentWeaponIndex + 1) % this.weapons.length;
    }
    
    deploySentry() {
        if (!this.abilities.sentry || this.abilities.sentryCurrentCooldown > 0) return;
        
        const sentry = new Sentry(
            this.game,
            this.x + Math.cos(this.angle) * 50,
            this.y + Math.sin(this.angle) * 50
        );
        
        this.game.sentries.push(sentry);
        this.abilities.sentryCurrentCooldown = this.abilities.sentryCooldown;
        
        // Show notification
        this.game.ui.showNotification("Sentry deployed!");
    }
    
    useBladeAttack() {
        if (!this.abilities.blade || this.abilities.bladeCurrentCooldown > 0) return;
        
        this.abilities.bladeActive = true;
        this.abilities.bladeAnimTime = 300; // 300ms animation
        this.abilities.bladeCurrentCooldown = this.abilities.bladeCooldown;
        
        // Check for zombies in blade range
        for (const zombie of this.game.zombies) {
            const dx = zombie.x - this.x;
            const dy = zombie.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Check if zombie is in front of player within the blade arc
            if (distance <= this.abilities.bladeRange) {
                const zombieAngle = Math.atan2(dy, dx);
                const angleDiff = Math.abs(normalizeAngle(zombieAngle - this.angle));
                
                if (angleDiff <= Math.PI / 2) {
                    zombie.takeDamage(this.abilities.bladeDamage);
                    
                    // Create blood effect
                    this.game.createBloodSplatter(zombie.x, zombie.y);
                }
            }
        }
        
        // Show notification
        this.game.ui.showNotification("Blade attack!");
    }
    
    dash() {
        if (!this.abilities.dash || this.abilities.dashCurrentCooldown > 0) return;
        if (this.abilities.dashDirection.x === 0 && this.abilities.dashDirection.y === 0) return;
        
        this.abilities.dashActive = true;
        this.abilities.dashTimer = this.abilities.dashDuration;
        this.abilities.dashCurrentCooldown = this.abilities.dashCooldown;
        
        // Make the dash direction use the dash speed
        const magnitude = Math.sqrt(
            this.abilities.dashDirection.x * this.abilities.dashDirection.x + 
            this.abilities.dashDirection.y * this.abilities.dashDirection.y
        );
        
        this.abilities.dashDirection = {
            x: (this.abilities.dashDirection.x / magnitude) * this.abilities.dashSpeed,
            y: (this.abilities.dashDirection.y / magnitude) * this.abilities.dashSpeed
        };
        
        // Brief invulnerability during dash
        this.isInvulnerable = true;
        this.invulnerableTime = this.abilities.dashDuration;
        
        // Show notification
        this.game.ui.showNotification("Dash!");
    }
    
    takeDamage(amount) {
        if (!this.isInvulnerable) {
            this.health -= amount;
            this.health = Math.max(0, this.health);
            
            // Temporary invulnerability
            this.isInvulnerable = true;
            this.invulnerableTime = 1000;
        }
    }
    
    heal(amount) {
        this.health += amount;
        this.health = Math.min(this.maxHealth, this.health);
    }
    
    isCollidingWith(entity) {
        const dx = this.x - entity.x;
        const dy = this.y - entity.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < this.radius + entity.radius;
    }
}

// Helper function to normalize angle to [-PI, PI]
function normalizeAngle(angle) {
    while (angle > Math.PI) angle -= 2 * Math.PI;
    while (angle < -Math.PI) angle += 2 * Math.PI;
    return angle;
}

// New class for Sentry Gun
class Sentry {
    constructor(game, x, y) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.radius = 15;
        this.health = 100;
        this.maxHealth = 100;
        this.angle = 0;
        
        this.fireRate = 500;
        this.lastFireTime = 0;
        this.range = 300;
        this.damage = 15;
        this.bulletSpeed = 15;
        
        this.rotationSpeed = 0.1;
        this.targetAngle = 0;
        
        this.isDead = false;
    }
    
    update(deltaTime) {
        if (this.isDead) return;
        
        // Find nearest zombie
        let nearestZombie = null;
        let minDistance = this.range;
        
        for (const zombie of this.game.zombies) {
            const dx = zombie.x - this.x;
            const dy = zombie.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < minDistance) {
                nearestZombie = zombie;
                minDistance = distance;
            }
        }
        
        // Rotate towards nearest zombie
        if (nearestZombie) {
            const dx = nearestZombie.x - this.x;
            const dy = nearestZombie.y - this.y;
            this.targetAngle = Math.atan2(dy, dx);
            
            // Smoothly rotate towards target
            const angleDiff = normalizeAngle(this.targetAngle - this.angle);
            this.angle += Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), this.rotationSpeed);
            
            // Shoot if zombie in range and we've cooled down
            const currentTime = performance.now();
            if (currentTime - this.lastFireTime >= this.fireRate) {
                // Only shoot if we're facing close enough to the target
                if (Math.abs(angleDiff) < 0.2) {
                    this.shoot();
                    this.lastFireTime = currentTime;
                }
            }
        }
    }
    
    draw(ctx) {
        // Draw shadow
        ctx.beginPath();
        ctx.ellipse(this.x, this.y + 10, this.radius, this.radius / 2, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fill();
        
        // Draw base
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#7f8c8d';
        ctx.fill();
        ctx.strokeStyle = '#2c3e50';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Draw gun
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        
        ctx.beginPath();
        ctx.rect(0, -3, 25, 6);
        ctx.fillStyle = '#2c3e50';
        ctx.fill();
        
        ctx.restore();
        
        // Draw health bar if damaged
        if (this.health < this.maxHealth) {
            ctx.fillStyle = '#333';
            ctx.fillRect(this.x - 15, this.y - 25, 30, 5);
            
            const healthPercent = this.health / this.maxHealth;
            ctx.fillStyle = healthPercent > 0.5 ? '#2ecc71' : '#e74c3c';
            ctx.fillRect(this.x - 15, this.y - 25, 30 * healthPercent, 5);
        }
    }
    
    shoot() {
        const bullet = new Bullet(
            this.game,
            this.x + Math.cos(this.angle) * 25,
            this.y + Math.sin(this.angle) * 25,
            this.angle,
            this.bulletSpeed,
            this.damage
        );
        
        this.game.addBullet(bullet);
        
        // Visual effect
        for (let i = 0; i < 3; i++) {
            this.game.particles.push(new HitParticle(
                this.game,
                this.x + Math.cos(this.angle) * 25,
                this.y + Math.sin(this.angle) * 25
            ));
        }
    }
    
    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.die();
        }
    }
    
    die() {
        this.isDead = true;
        
        // Create explosion effect
        for (let i = 0; i < 20; i++) {
            this.game.particles.push(new ExplosionParticle(this.game, this.x, this.y));
        }
    }
    
    isCollidingWith(entity) {
        const dx = this.x - entity.x;
        const dy = this.y - entity.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < this.radius + entity.radius;
    }
}

// New particle for aura damage visualization
class AuraParticle extends Particle {
    constructor(game, x, y) {
        super(game, x, y);
        this.size = 3 + Math.random() * 3;
        this.speed = 0.5 + Math.random() * 1;
        this.angle = Math.random() * Math.PI * 2;
        this.vx = Math.cos(this.angle) * this.speed;
        this.vy = Math.sin(this.angle) * this.speed;
        this.lifeTime = 500 + Math.random() * 300;
        this.timeLeft = this.lifeTime;
        this.color = '#e74c3c';
    }
    
    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.alpha * 0.7;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.restore();
    }
}

// New particle for explosions
class ExplosionParticle extends Particle {
    constructor(game, x, y) {
        super(game, x, y);
        this.size = 3 + Math.random() * 5;
        this.speed = 2 + Math.random() * 5;
        this.angle = Math.random() * Math.PI * 2;
        this.vx = Math.cos(this.angle) * this.speed;
        this.vy = Math.sin(this.angle) * this.speed;
        this.lifeTime = 500 + Math.random() * 300;
        this.timeLeft = this.lifeTime;
        this.color = Math.random() < 0.7 ? '#e67e22' : '#f1c40f';
        this.gravity = 0.05;
    }
    
    update(deltaTime) {
        super.update(deltaTime);
        
        // Slow down over time
        this.vx *= 0.95;
        this.vy *= 0.95;
    }
}
