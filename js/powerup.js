class PowerUp {
    constructor(game, x, y) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.radius = 10;
        this.lifeTime = 10000; // 10 seconds
        this.timeLeft = this.lifeTime;
        this.isDead = false;
        this.color = '#fff';
        this.pulseRate = 0.05;
        this.pulsePhase = 0;
    }
    
    update(deltaTime) {
        this.timeLeft -= deltaTime;
        if (this.timeLeft <= 0) {
            this.isDead = true;
        }
        
        // Pulsing animation
        this.pulsePhase += this.pulseRate;
        if (this.pulsePhase > Math.PI * 2) {
            this.pulsePhase -= Math.PI * 2;
        }
    }
    
    draw(ctx) {
        ctx.save();
        
        // Fade out when close to expiry
        const alpha = Math.min(1, this.timeLeft / 2000);
        ctx.globalAlpha = alpha;
        
        // Pulsing effect
        const pulse = Math.sin(this.pulsePhase) * 0.2 + 0.8;
        const currentRadius = this.radius * pulse;
        
        // Draw glow
        const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, currentRadius * 2);
        gradient.addColorStop(0, this.color);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, currentRadius * 2, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Draw power-up
        ctx.beginPath();
        ctx.arc(this.x, this.y, currentRadius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        
        ctx.restore();
    }
    
    apply(player) {
        // Override in subclasses
    }
    
    isCollidingWith(entity) {
        const dx = this.x - entity.x;
        const dy = this.y - entity.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < this.radius + entity.radius;
    }
}

class HealthPack extends PowerUp {
    constructor(game, x, y) {
        super(game, x, y);
        this.color = '#2ecc71'; // Green
        this.healAmount = 25 + Math.floor(Math.random() * 25); // 25-50 health
    }
    
    draw(ctx) {
        super.draw(ctx);
        
        // Draw health cross
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.fillStyle = '#fff';
        
        const crossSize = this.radius * 0.6;
        ctx.fillRect(-crossSize / 4, -crossSize / 2, crossSize / 2, crossSize);
        ctx.fillRect(-crossSize / 2, -crossSize / 4, crossSize, crossSize / 2);
        
        ctx.restore();
    }
    
    apply(player) {
        player.heal(this.healAmount);
    }
}

class AmmoPack extends PowerUp {
    constructor(game, x, y) {
        super(game, x, y);
        this.color = '#3498db'; // Blue
        this.ammoAmount = 30 + Math.floor(Math.random() * 30); // 30-60 ammo
    }
    
    draw(ctx) {
        super.draw(ctx);
        
        // Draw ammo icon
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.fillStyle = '#fff';
        
        const size = this.radius * 0.6;
        // Draw bullet shape
        ctx.fillRect(-size/2, -size/4, size, size/2);
        ctx.beginPath();
        ctx.arc(-size/2, 0, size/4, Math.PI/2, Math.PI*3/2);
        ctx.fill();
        
        ctx.restore();
    }
    
    apply(player) {
        player.weapon.addAmmo(this.ammoAmount);
    }
}

class SpeedBoost extends PowerUp {
    constructor(game, x, y) {
        super(game, x, y);
        this.color = '#f1c40f'; // Yellow
        this.speedMultiplier = 1.5;
        this.duration = 5000; // 5 seconds
    }
    
    draw(ctx) {
        super.draw(ctx);
        
        // Draw lightning bolt
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.fillStyle = '#fff';
        
        const size = this.radius * 0.7;
        ctx.beginPath();
        ctx.moveTo(-size/3, -size/2);
        ctx.lineTo(0, 0);
        ctx.lineTo(-size/3, size/2);
        ctx.lineTo(size/3, -size/4);
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
    }
    
    apply(player) {
        const originalSpeed = player.speed;
        player.speed *= this.speedMultiplier;
        
        // Reset speed after duration
        setTimeout(() => {
            player.speed = originalSpeed;
        }, this.duration);
    }
}

class WeaponUpgrade extends PowerUp {
    constructor(game, x, y) {
        super(game, x, y);
        this.color = '#e74c3c'; // Red
    }
    
    draw(ctx) {
        super.draw(ctx);
        
        // Draw weapon icon
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.fillStyle = '#fff';
        
        const size = this.radius * 0.6;
        // Draw gun shape
        ctx.fillRect(-size/2, -size/6, size, size/3);
        ctx.fillRect(-size/3, 0, size/4, size/2);
        
        ctx.restore();
    }
    
    apply(player) {
        // Cycle to next weapon
        player.nextWeapon();
    }
}
