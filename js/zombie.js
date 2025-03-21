class Zombie {
    constructor(game, x, y, level = 1) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.level = level;
        
        this.radius = 18;
        this.speed = 2 + (level * 0.1);
        this.health = 100 + (level * 10);
        this.maxHealth = this.health;
        this.damage = 10 + (level * 2);
        
        this.angle = 0;
        this.targetX = 0;
        this.targetY = 0;
        
        this.attackCooldown = 0;
        this.attackRate = 1000; // milliseconds
        
        this.walkFrame = 0;
        this.walkFrameTime = 0;
        
        this.isDead = false;
        this.isAttacking = false;
        this.attackAnimTime = 0;
        
        // Visual variety
        this.color = `hsl(${Math.random() * 30 + 80}, 70%, 30%)`;
        this.scale = 0.9 + Math.random() * 0.2;
    }
    
    update(deltaTime) {
        if (this.isDead) return;
        
        // Update cooldowns
        if (this.attackCooldown > 0) {
            this.attackCooldown -= deltaTime;
        }
        
        if (this.isAttacking) {
            this.attackAnimTime -= deltaTime;
            if (this.attackAnimTime <= 0) {
                this.isAttacking = false;
            }
        }
        
        // Update walk animation
        this.walkFrameTime += deltaTime;
        if (this.walkFrameTime > 150) {
            this.walkFrame = (this.walkFrame + 1) % 6;
            this.walkFrameTime = 0;
        }
        
        // Target the player
        this.targetX = this.game.player.x;
        this.targetY = this.game.player.y;
        
        // Calculate angle to player
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        this.angle = Math.atan2(dy, dx);
        
        // Move towards player unless attacking
        if (!this.isAttacking) {
            const distanceToPlayer = Math.sqrt(dx * dx + dy * dy);
            
            if (distanceToPlayer > this.radius + this.game.player.radius) {
                this.x += Math.cos(this.angle) * this.speed;
                this.y += Math.sin(this.angle) * this.speed;
            }
        }
    }
    
    draw(ctx) {
        // Draw shadow
        ctx.beginPath();
        ctx.ellipse(this.x, this.y + 10, this.radius, this.radius / 2, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fill();
        
        // Draw zombie
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        ctx.scale(this.scale, this.scale);
        
        // Draw body
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Draw face
        ctx.fillStyle = '#222';
        
        // Eyes
        const eyeOffset = this.isAttacking ? 3 : 5;
        ctx.beginPath();
        ctx.arc(-5, -eyeOffset, 3, 0, Math.PI * 2);
        ctx.arc(5, -eyeOffset, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Mouth
        ctx.beginPath();
        if (this.isAttacking) {
            ctx.arc(0, 7, 5, 0, Math.PI);
        } else {
            ctx.rect(-7, 5, 14, 2);
        }
        ctx.fill();
        
        // Draw health bar if damaged
        if (this.health < this.maxHealth) {
            ctx.fillStyle = '#222';
            ctx.fillRect(-15, -25, 30, 5);
            
            const healthPercent = this.health / this.maxHealth;
            ctx.fillStyle = healthPercent > 0.5 ? '#2ecc71' : '#e74c3c';
            ctx.fillRect(-15, -25, 30 * healthPercent, 5);
        }
        
        ctx.restore();
    }
    
    attack() {
        if (this.attackCooldown <= 0) {
            this.isAttacking = true;
            this.attackAnimTime = 300;
            this.attackCooldown = this.attackRate;
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
        this.game.score += 100;
    }
    
    isCollidingWith(entity) {
        const dx = this.x - entity.x;
        const dy = this.y - entity.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < this.radius + entity.radius;
    }
}

class FastZombie extends Zombie {
    constructor(game, x, y, level) {
        super(game, x, y, level);
        this.speed = 3.5 + (level * 0.2);
        this.health = 60 + (level * 5);
        this.maxHealth = this.health;
        this.damage = 5 + (level * 1);
        this.radius = 15;
        this.color = `hsl(${Math.random() * 20 + 40}, 70%, 40%)`;
        this.attackRate = 800;
    }
}

class TankZombie extends Zombie {
    constructor(game, x, y, level) {
        super(game, x, y, level);
        this.speed = 1.2 + (level * 0.05);
        this.health = 200 + (level * 20);
        this.maxHealth = this.health;
        this.damage = 20 + (level * 3);
        this.radius = 25;
        this.color = `hsl(${Math.random() * 20 + 100}, 70%, 20%)`;
        this.attackRate = 1500;
    }
}
