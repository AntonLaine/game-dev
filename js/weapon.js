class Weapon {
    constructor(game, owner) {
        this.game = game;
        this.owner = owner;
        this.name = 'Weapon';
        this.damage = 10;
        this.fireRate = 500; // ms between shots
        this.reloadTime = 2000; // ms to reload
        this.ammo = 10;
        this.maxAmmo = 10;
        this.totalAmmo = 50;
        this.maxTotalAmmo = 100;
        this.spread = 0.05; // bullet spread in radians
        this.bulletSpeed = 15;
        this.automatic = false;
        this.reloading = false;
        this.lastFireTime = 0;
        this.reloadTimer = 0;
    }
    
    update(deltaTime) {
        // Handle reload timer
        if (this.reloading) {
            this.reloadTimer -= deltaTime;
            if (this.reloadTimer <= 0) {
                this.completeReload();
            }
        }
    }
    
    draw(ctx) {
        // Draw the weapon
        ctx.fillStyle = '#333';
        ctx.fillRect(10, -5, 25, 10);
    }
    
    canShoot() {
        const currentTime = performance.now();
        return !this.reloading && this.ammo > 0 && (currentTime - this.lastFireTime) >= this.fireRate;
    }
    
    shoot() {
        if (!this.canShoot()) {
            if (this.ammo === 0) {
                this.reload();
            }
            return false;
        }
        
        const currentTime = performance.now();
        this.lastFireTime = currentTime;
        this.ammo--;
        
        // Create a bullet
        const angle = this.owner.angle + (Math.random() - 0.5) * this.spread;
        const bullet = new Bullet(
            this.game,
            this.owner.x + Math.cos(this.owner.angle) * 30,
            this.owner.y + Math.sin(this.owner.angle) * 30,
            angle,
            this.bulletSpeed,
            this.damage
        );
        
        this.game.addBullet(bullet);
        
        // Create shell casing
        this.game.createShellCasing(
            this.owner.x + Math.cos(this.owner.angle) * 10,
            this.owner.y + Math.sin(this.owner.angle) * 10,
            this.owner.angle + Math.PI / 2
        );
        
        return true;
    }
    
    reload() {
        if (this.reloading || this.ammo === this.maxAmmo || this.totalAmmo <= 0) return;
        
        this.reloading = true;
        this.reloadTimer = this.reloadTime;
    }
    
    completeReload() {
        const ammoNeeded = this.maxAmmo - this.ammo;
        const ammoToLoad = Math.min(ammoNeeded, this.totalAmmo);
        
        this.ammo += ammoToLoad;
        this.totalAmmo -= ammoToLoad;
        
        this.reloading = false;
    }
    
    addAmmo(amount) {
        this.totalAmmo += amount;
        this.totalAmmo = Math.min(this.totalAmmo, this.maxTotalAmmo);
    }
}

class Pistol extends Weapon {
    constructor(game, owner) {
        super(game, owner);
        this.name = 'Pistol';
        this.damage = 25;
        this.fireRate = 300;
        this.reloadTime = 1000;
        this.ammo = 12;
        this.maxAmmo = 12;
        this.totalAmmo = 60;
        this.maxTotalAmmo = 120;
        this.spread = 0.03;
        this.bulletSpeed = 20;
    }
    
    draw(ctx) {
        // Draw pistol
        ctx.fillStyle = '#333';
        ctx.fillRect(15, -3, 20, 6);
        ctx.fillRect(12, -2, 5, 8);
    }
}

class Shotgun extends Weapon {
    constructor(game, owner) {
        super(game, owner);
        this.name = 'Shotgun';
        this.damage = 15;
        this.fireRate = 800;
        this.reloadTime = 2000;
        this.ammo = 8;
        this.maxAmmo = 8;
        this.totalAmmo = 32;
        this.maxTotalAmmo = 64;
        this.spread = 0.2;
        this.bulletSpeed = 18;
        this.pellets = 8;
    }
    
    draw(ctx) {
        // Draw shotgun
        ctx.fillStyle = '#333';
        ctx.fillRect(15, -4, 25, 8);
        ctx.fillRect(12, -2, 5, 10);
    }
    
    shoot() {
        if (!this.canShoot()) {
            if (this.ammo === 0) {
                this.reload();
            }
            return false;
        }
        
        const currentTime = performance.now();
        this.lastFireTime = currentTime;
        this.ammo--;
        
        // Create multiple pellets
        for (let i = 0; i < this.pellets; i++) {
            const angle = this.owner.angle + (Math.random() - 0.5) * this.spread;
            const bullet = new Bullet(
                this.game,
                this.owner.x + Math.cos(this.owner.angle) * 30,
                this.owner.y + Math.sin(this.owner.angle) * 30,
                angle,
                this.bulletSpeed * (0.9 + Math.random() * 0.2),
                this.damage
            );
            
            this.game.addBullet(bullet);
        }
        
        // Create shell casing
        this.game.createShellCasing(
            this.owner.x + Math.cos(this.owner.angle) * 10,
            this.owner.y + Math.sin(this.owner.angle) * 10,
            this.owner.angle + Math.PI / 2
        );
        
        return true;
    }
}

class AssaultRifle extends Weapon {
    constructor(game, owner) {
        super(game, owner);
        this.name = 'Assault Rifle';
        this.damage = 20;
        this.fireRate = 100;
        this.reloadTime = 1500;
        this.ammo = 30;
        this.maxAmmo = 30;
        this.totalAmmo = 120;
        this.maxTotalAmmo = 300;
        this.spread = 0.07;
        this.bulletSpeed = 25;
        this.automatic = true;
    }
    
    draw(ctx) {
        // Draw assault rifle
        ctx.fillStyle = '#333';
        ctx.fillRect(15, -3, 30, 6);
        ctx.fillRect(12, -2, 5, 10);
        ctx.fillRect(35, -5, 10, 2);
    }
}

class Bullet {
    constructor(game, x, y, angle, speed, damage) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.speed = speed;
        this.damage = damage;
        this.radius = 3;
        
        // Upgrade properties
        this.isPiercing = false;
        this.pierceCount = 0;
        this.pierceTarget = []; // Keep track of zombies hit for piercing
        
        this.isExplosive = false;
        this.explosionRadius = 0;
        
        // Trail effect for laser upgrade
        this.trail = [];
        this.maxTrailLength = 10;
    }
    
    update(deltaTime) {
        // Move the bullet
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;
        
        // Update trail
        if (this.isPiercing) {
            this.trail.unshift({ x: this.x, y: this.y });
            if (this.trail.length > this.maxTrailLength) {
                this.trail.pop();
            }
        }
    }
    
    draw(ctx) {
        ctx.save();
        
        // Draw trail for laser bullets
        if (this.isPiercing && this.trail.length > 0) {
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            
            for (let i = 0; i < this.trail.length; i++) {
                ctx.lineTo(this.trail[i].x, this.trail[i].y);
            }
            
            ctx.strokeStyle = 'rgba(255, 50, 50, 0.7)';
            ctx.lineWidth = 2;
            ctx.stroke();
        } else {
            // Draw regular bullet trail
            ctx.translate(this.x, this.y);
            ctx.rotate(this.angle);
            
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(-10, 0);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
        
        // Draw bullet
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        
        if (this.isPiercing) {
            ctx.fillStyle = '#ff3333';
        } else if (this.isExplosive) {
            ctx.fillStyle = '#f39c12';
        } else {
            ctx.fillStyle = '#FFA500';
        }
        
        ctx.fill();
        
        ctx.restore();
    }
    
    explode() {
        if (!this.isExplosive) return;
        
        // Create explosion particles
        for (let i = 0; i < 15; i++) {
            this.game.particles.push(new ExplosionParticle(this.game, this.x, this.y));
        }
        
        // Damage zombies within radius
        for (const zombie of this.game.zombies) {
            const dx = zombie.x - this.x;
            const dy = zombie.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance <= this.explosionRadius) {
                // Damage falls off with distance
                const damageRatio = 1 - (distance / this.explosionRadius);
                const explosionDamage = this.damage * damageRatio;
                zombie.takeDamage(explosionDamage);
            }
        }
    }
    
    isCollidingWith(entity) {
        // If we've already hit this zombie with a piercing bullet, ignore it
        if (this.isPiercing && this.pierceTarget.includes(entity)) {
            return false;
        }
        
        const dx = this.x - entity.x;
        const dy = this.y - entity.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < this.radius + entity.radius;
    }
    
    handleZombieHit(zombie) {
        if (this.isPiercing) {
            // Add this zombie to the piercing targets
            this.pierceTarget.push(zombie);
            
            // Decrement pierce count
            this.pierceCount--;
            
            // Remove bullet if it's pierced enough targets
            return this.pierceCount <= 0;
        }
        
        if (this.isExplosive) {
            this.explode();
        }
        
        // Normal bullets are removed after hitting
        return true;
    }
}
