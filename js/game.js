class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.lastTime = 0;
        this.gameTime = 0;
        this.accumulator = 0;
        this.timeStep = 1000 / 60; // 60 FPS
        
        this.isRunning = false;
        this.score = 0;
        this.wave = 1;
        this.zombiesKilled = 0;
        this.zombiesPerWave = 10;
        
        this.player = null;
        this.zombies = [];
        this.bullets = [];
        this.particles = [];
        this.powerUps = [];
        
        this.mouse = { x: 0, y: 0 };
        this.keys = {};
        
        this.setupEventListeners();
        this.resizeCanvas();
        
        // UI elements
        this.ui = new UI(this);
        
        // Asset loading
        this.assets = new AssetLoader();
        this.assets.loadAll(() => {
            this.init();
        });
    }
    
    init() {
        this.player = new Player(this, this.canvas.width / 2, this.canvas.height / 2);
        this.setupGame();
        
        document.getElementById('start-button').addEventListener('click', () => {
            document.getElementById('start-screen').classList.add('hidden');
            document.getElementById('game-screen').classList.remove('hidden');
            this.start();
        });
        
        document.getElementById('restart-button').addEventListener('click', () => {
            document.getElementById('game-over-screen').classList.add('hidden');
            document.getElementById('game-screen').classList.remove('hidden');
            this.reset();
            this.start();
        });
    }
    
    setupGame() {
        this.score = 0;
        this.wave = 1;
        this.zombiesKilled = 0;
        this.zombies = [];
        this.bullets = [];
        this.particles = [];
        this.powerUps = [];
        
        this.player = new Player(this, this.canvas.width / 2, this.canvas.height / 2);
        this.spawnZombieWave();
    }
    
    reset() {
        this.setupGame();
    }
    
    start() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.lastTime = performance.now();
            requestAnimationFrame(this.gameLoop.bind(this));
        }
    }
    
    gameLoop(currentTime) {
        if (!this.isRunning) return;
        
        // Calculate time delta
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        this.gameTime += deltaTime;
        
        // Fixed time step for updates
        this.accumulator += deltaTime;
        while (this.accumulator >= this.timeStep) {
            this.update(this.timeStep);
            this.accumulator -= this.timeStep;
        }
        
        this.render();
        requestAnimationFrame(this.gameLoop.bind(this));
    }
    
    update(deltaTime) {
        // Update player
        this.player.update(deltaTime);
        
        // Update zombies
        for (let i = this.zombies.length - 1; i >= 0; i--) {
            this.zombies[i].update(deltaTime);
            
            // Check for collision with player
            if (this.zombies[i].isCollidingWith(this.player) && !this.player.isInvulnerable) {
                this.player.takeDamage(this.zombies[i].damage);
                this.zombies[i].attack();
            }
            
            if (this.zombies[i].isDead) {
                this.createBloodSplatter(this.zombies[i].x, this.zombies[i].y);
                const zombieX = this.zombies[i].x;
                const zombieY = this.zombies[i].y;
                this.zombies.splice(i, 1);
                this.zombiesKilled++;
                this.score += 100;
                
                // Increased chance to drop power-up to 50%
                if (Math.random() < 0.5) {
                    this.spawnPowerUp(zombieX, zombieY);
                }
            }
        }
        
        // Update bullets
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            this.bullets[i].update(deltaTime);
            
            // Check for collisions with zombies
            for (let j = this.zombies.length - 1; j >= 0; j--) {
                if (this.bullets[i] && this.bullets[i].isCollidingWith(this.zombies[j])) {
                    this.zombies[j].takeDamage(this.bullets[i].damage);
                    this.createHitEffect(this.bullets[i].x, this.bullets[i].y);
                    this.bullets.splice(i, 1);
                    break;
                }
            }
            
            // Remove bullets that are out of bounds
            if (this.bullets[i] && (
                this.bullets[i].x < 0 || 
                this.bullets[i].x > this.canvas.width || 
                this.bullets[i].y < 0 || 
                this.bullets[i].y > this.canvas.height
            )) {
                this.bullets.splice(i, 1);
            }
        }
        
        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].update(deltaTime);
            if (this.particles[i].isDead) {
                this.particles.splice(i, 1);
            }
        }
        
        // Update power-ups
        for (let i = this.powerUps.length - 1; i >= 0; i--) {
            if (i >= this.powerUps.length) continue; // Safety check
            
            this.powerUps[i].update(deltaTime);
            
            // Check for collision with player
            if (this.powerUps[i] && this.powerUps[i].isCollidingWith(this.player)) {
                this.powerUps[i].apply(this.player);
                this.powerUps.splice(i, 1);
                continue; // Skip the rest of the loop for this item
            }
            
            // Check if power-up is dead
            if (this.powerUps[i] && this.powerUps[i].isDead) {
                this.powerUps.splice(i, 1);
            }
        }
        
        // Check for next wave
        if (this.zombies.length === 0 && this.zombiesKilled >= this.zombiesPerWave) {
            this.wave++;
            this.zombiesKilled = 0;
            this.zombiesPerWave = Math.floor(this.zombiesPerWave * 1.5);
            this.spawnZombieWave();
        }
        
        // Spawn zombies gradually if needed
        if (this.zombies.length < this.wave * 3 && this.zombies.length < this.zombiesPerWave) {
            if (Math.random() < 0.02) {
                this.spawnZombie();
            }
        }
        
        // Update UI
        this.ui.update();
        
        // Check game over
        if (this.player.health <= 0) {
            this.gameOver();
        }
    }
    
    render() {
        // Clear canvas
        this.ctx.fillStyle = '#222';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw grid for better depth perception
        this.drawGrid();
        
        // Draw all game elements
        this.drawParticles();
        this.drawPowerUps();
        this.drawZombies();
        this.drawBullets();
        this.player.draw(this.ctx);
    }
    
    drawGrid() {
        const gridSize = 50;
        this.ctx.strokeStyle = 'rgba(50, 50, 50, 0.3)';
        this.ctx.lineWidth = 1;
        
        // Draw vertical lines
        for (let x = 0; x < this.canvas.width; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        
        // Draw horizontal lines
        for (let y = 0; y < this.canvas.height; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }
    
    drawZombies() {
        this.zombies.forEach(zombie => zombie.draw(this.ctx));
    }
    
    drawBullets() {
        this.bullets.forEach(bullet => bullet.draw(this.ctx));
    }
    
    drawParticles() {
        this.particles.forEach(particle => particle.draw(this.ctx));
    }
    
    drawPowerUps() {
        this.powerUps.forEach(powerUp => powerUp.draw(this.ctx));
    }
    
    spawnZombieWave() {
        const zombiesToSpawn = Math.min(this.zombiesPerWave, 10); // Spawn in batches
        
        for (let i = 0; i < zombiesToSpawn; i++) {
            this.spawnZombie();
        }
    }
    
    spawnZombie() {
        // Spawn zombies outside the screen
        let x, y;
        const side = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left
        
        switch (side) {
            case 0: // top
                x = Math.random() * this.canvas.width;
                y = -50;
                break;
            case 1: // right
                x = this.canvas.width + 50;
                y = Math.random() * this.canvas.height;
                break;
            case 2: // bottom
                x = Math.random() * this.canvas.width;
                y = this.canvas.height + 50;
                break;
            case 3: // left
                x = -50;
                y = Math.random() * this.canvas.height;
                break;
        }
        
        // Randomized zombie types
        const zombieType = Math.random();
        if (zombieType < 0.7) {
            this.zombies.push(new Zombie(this, x, y, this.wave));
        } else if (zombieType < 0.9) {
            this.zombies.push(new FastZombie(this, x, y, this.wave));
        } else {
            this.zombies.push(new TankZombie(this, x, y, this.wave));
        }
    }
    
    spawnPowerUp(x, y) {
        const type = Math.random();
        
        // Distribute the 90% chance among health, ammo and speed boosts
        // Keep weapon upgrades at exactly 10%
        if (type < 0.3) {
            this.powerUps.push(new HealthPack(this, x, y));
        } else if (type < 0.6) {
            this.powerUps.push(new AmmoPack(this, x, y));
        } else if (type < 0.9) {
            this.powerUps.push(new SpeedBoost(this, x, y));
        } else {
            // 10% chance for weapon upgrade
            this.powerUps.push(new WeaponUpgrade(this, x, y));
        }
    }
    
    addBullet(bullet) {
        this.bullets.push(bullet);
    }
    
    createHitEffect(x, y) {
        for (let i = 0; i < 8; i++) {
            this.particles.push(new HitParticle(this, x, y));
        }
    }
    
    createBloodSplatter(x, y) {
        for (let i = 0; i < 20; i++) {
            this.particles.push(new BloodParticle(this, x, y));
        }
    }
    
    createShellCasing(x, y, angle) {
        this.particles.push(new ShellCasingParticle(this, x, y, angle));
    }
    
    gameOver() {
        this.isRunning = false;
        document.getElementById('final-score').textContent = `Your score: ${this.score}`;
        document.getElementById('game-screen').classList.add('hidden');
        document.getElementById('game-over-screen').classList.remove('hidden');
    }
    
    setupEventListeners() {
        // Mouse movement
        window.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        });
        
        // Mouse click (shooting)
        window.addEventListener('mousedown', (e) => {
            if (e.button === 0 && this.isRunning) { // Left click
                this.player.shoot();
            }
        });
        
        // Keyboard controls
        window.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            
            // Reload with R key
            if (e.key.toLowerCase() === 'r' && this.isRunning) {
                this.player.reload();
            }
        });
        
        window.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });
        
        // Handle window resize
        window.addEventListener('resize', this.resizeCanvas.bind(this));
    }
    
    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
}

// Initialize the game when the DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
});
