class Particle {
    constructor(game, x, y) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.size = 5;
        this.speed = 2;
        this.angle = Math.random() * Math.PI * 2;
        this.vx = Math.cos(this.angle) * this.speed;
        this.vy = Math.sin(this.angle) * this.speed;
        this.lifeTime = 1000;
        this.timeLeft = this.lifeTime;
        this.color = '#fff';
        this.gravity = 0;
        this.isDead = false;
    }
    
    update(deltaTime) {
        this.timeLeft -= deltaTime;
        if (this.timeLeft <= 0) {
            this.isDead = true;
            return;
        }
        
        this.x += this.vx;
        this.y += this.vy;
        this.vy += this.gravity;
        
        // Fade out
        this.alpha = this.timeLeft / this.lifeTime;
    }
    
    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.restore();
    }
}

class HitParticle extends Particle {
    constructor(game, x, y) {
        super(game, x, y);
        this.size = 2 + Math.random() * 3;
        this.speed = 1 + Math.random() * 3;
        this.angle = Math.random() * Math.PI * 2;
        this.vx = Math.cos(this.angle) * this.speed;
        this.vy = Math.sin(this.angle) * this.speed;
        this.lifeTime = 300 + Math.random() * 200;
        this.timeLeft = this.lifeTime;
        this.color = '#FFA500';
    }
}

class BloodParticle extends Particle {
    constructor(game, x, y) {
        super(game, x, y);
        this.size = 2 + Math.random() * 4;
        this.speed = 2 + Math.random() * 4;
        this.angle = Math.random() * Math.PI * 2;
        this.vx = Math.cos(this.angle) * this.speed;
        this.vy = Math.sin(this.angle) * this.speed;
        this.lifeTime = 1000 + Math.random() * 500;
        this.timeLeft = this.lifeTime;
        this.color = '#8B0000';
        this.gravity = 0.01;
    }
    
    update(deltaTime) {
        super.update(deltaTime);
        
        // Slow down over time
        this.vx *= 0.98;
        this.vy *= 0.98;
    }
    
    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        // Sometimes draw as a circle, sometimes as a splatter
        if (this.size > 4) {
            ctx.beginPath();
            ctx.ellipse(this.x, this.y, this.size, this.size / 2, this.angle, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
        } else {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
        }
        ctx.restore();
    }
}

class ShellCasingParticle extends Particle {
    constructor(game, x, y, angle) {
        super(game, x, y);
        this.size = 2;
        this.width = 5;
        this.height = 2;
        this.speed = 3 + Math.random() * 2;
        // Eject to the right of the gun
        this.angle = angle + (Math.random() * 0.5 - 0.25);
        this.vx = Math.cos(this.angle) * this.speed;
        this.vy = Math.sin(this.angle) * this.speed;
        this.lifeTime = 1000 + Math.random() * 500;
        this.timeLeft = this.lifeTime;
        this.color = '#FFC107';
        this.gravity = 0.2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.2;
        this.rotation = Math.random() * Math.PI * 2;
        this.bounceCount = 0;
        this.maxBounces = 2;
    }
    
    update(deltaTime) {
        super.update(deltaTime);
        
        // Rotate the casing
        this.rotation += this.rotationSpeed;
        
        // Bounce off the ground
        if (this.y > this.game.canvas.height - 10 && this.vy > 0 && this.bounceCount < this.maxBounces) {
            this.vy = -this.vy * 0.6;
            this.vx *= 0.8;
            this.bounceCount++;
        }
    }
    
    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        // Draw shell casing
        ctx.beginPath();
        ctx.rect(-this.width / 2, -this.height / 2, this.width, this.height);
        ctx.fillStyle = this.color;
        ctx.fill();
        
        ctx.restore();
    }
}
