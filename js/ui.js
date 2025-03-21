class UI {
    constructor(game) {
        this.game = game;
        this.healthBar = document.getElementById('health-fill');
        this.ammoCounter = document.getElementById('ammo-counter');
        this.scoreDisplay = document.getElementById('score');
        this.waveDisplay = document.getElementById('wave');
        
        // Notifications
        this.notifications = [];
        this.notificationDuration = 3000; // 3 seconds
        
        // Ability cooldown indicators
        this.cooldownIndicators = [];
    }
    
    update() {
        // Update health bar
        const healthPercent = (this.game.player.health / this.game.player.maxHealth) * 100;
        this.healthBar.style.width = `${healthPercent}%`;
        
        // Change color based on health
        if (healthPercent > 60) {
            this.healthBar.style.backgroundColor = '#2ecc71';
        } else if (healthPercent > 30) {
            this.healthBar.style.backgroundColor = '#f39c12';
        } else {
            this.healthBar.style.backgroundColor = '#e74c3c';
        }
        
        // Update ammo counter
        const weapon = this.game.player.weapon;
        this.ammoCounter.textContent = `${weapon.ammo}/${weapon.totalAmmo}`;
        
        if (weapon.reloading) {
            this.ammoCounter.textContent = 'RELOADING...';
        }
        
        // Update score
        this.scoreDisplay.textContent = `Score: ${this.game.score}`;
        
        // Update wave
        this.waveDisplay.textContent = `Wave: ${this.game.wave}`;
        
        // Update notifications
        this.updateNotifications();
    }
    
    draw(ctx) {
        // Draw notifications
        this.drawNotifications(ctx);
        
        // Draw ability cooldowns
        this.drawCooldowns(ctx);
    }
    
    drawNotifications(ctx) {
        const startY = 100;
        const padding = 10;
        
        for (let i = 0; i < this.notifications.length; i++) {
            const notification = this.notifications[i];
            
            // Calculate opacity based on remaining time
            const alpha = Math.min(1, notification.timeLeft / 500);
            
            ctx.save();
            ctx.globalAlpha = alpha;
            
            // Draw background
            const textWidth = ctx.measureText(notification.text).width;
            const bgWidth = textWidth + padding * 2;
            const bgHeight = 30;
            const bgX = this.game.canvas.width / 2 - bgWidth / 2;
            const bgY = startY + i * 40;
            
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(bgX, bgY, bgWidth, bgHeight);
            
            // Draw text
            ctx.fillStyle = notification.color;
            ctx.font = '16px "Courier New", Courier, monospace';
            ctx.textAlign = 'center';
            ctx.fillText(notification.text, this.game.canvas.width / 2, bgY + 20);
            
            ctx.restore();
        }
    }
    
    drawCooldowns(ctx) {
        const player = this.game.player;
        const abilities = player.abilities;
        const startX = 20;
        const startY = this.game.canvas.height - 70;
        const size = 50;
        const gap = 10;
        
        let index = 0;
        
        // Draw sentry cooldown if player has the ability
        if (abilities.sentry) {
            this.drawCooldownIndicator(
                ctx, 
                startX + index * (size + gap), 
                startY, 
                size, 
                'Q', 
                '⌬', 
                abilities.sentryCurrentCooldown / abilities.sentryCooldown
            );
            index++;
        }
        
        // Draw blade cooldown if player has the ability
        if (abilities.blade) {
            this.drawCooldownIndicator(
                ctx, 
                startX + index * (size + gap), 
                startY, 
                size, 
                'F', 
                '⚔', 
                abilities.bladeCurrentCooldown / abilities.bladeCooldown
            );
            index++;
        }
        
        // Draw dash cooldown if player has the ability
        if (abilities.dash) {
            this.drawCooldownIndicator(
                ctx, 
                startX + index * (size + gap), 
                startY, 
                size, 
                'SPACE', 
                '⇨', 
                abilities.dashCurrentCooldown / abilities.dashCooldown
            );
            index++;
        }
    }
    
    drawCooldownIndicator(ctx, x, y, size, key, icon, cooldownPercent) {
        ctx.save();
        
        // Draw background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(x, y, size, size);
        
        // Draw icon
        ctx.fillStyle = cooldownPercent > 0 ? '#95a5a6' : '#ecf0f1';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(icon, x + size / 2, y + size / 2);
        
        // Draw key binding
        ctx.font = '12px Arial';
        ctx.fillText(key, x + size / 2, y + size - 10);
        
        // Draw cooldown overlay
        if (cooldownPercent > 0) {
            ctx.beginPath();
            ctx.moveTo(x + size / 2, y + size / 2);
            ctx.arc(
                x + size / 2, 
                y + size / 2, 
                size / 2, 
                -Math.PI / 2, 
                -Math.PI / 2 + cooldownPercent * Math.PI * 2, 
                false
            );
            ctx.closePath();
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fill();
        }
        
        // Draw border
        ctx.strokeStyle = '#34495e';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, size, size);
        
        ctx.restore();
    }
    
    updateNotifications() {
        // Update notification timers
        for (let i = this.notifications.length - 1; i >= 0; i--) {
            this.notifications[i].timeLeft -= 16.67; // Approximately 60 fps
            
            if (this.notifications[i].timeLeft <= 0) {
                this.notifications.splice(i, 1);
            }
        }
    }
    
    showNotification(text, color = '#ffffff') {
        this.notifications.push({
            text: text,
            color: color,
            timeLeft: this.notificationDuration
        });
        
        // Limit the number of notifications
        if (this.notifications.length > 5) {
            this.notifications.shift();
        }
    }
    
    showWaveTransition(waveNumber, bonus = null) {
        document.getElementById('next-wave-number').textContent = waveNumber;
        
        // Show bonus reward if applicable
        const bonusElement = document.getElementById('wave-bonus-reward');
        if (bonus) {
            bonusElement.textContent = bonus;
            bonusElement.style.display = 'block';
        } else {
            bonusElement.style.display = 'none';
        }
        
        // Show the transition screen
        document.getElementById('wave-transition').classList.remove('hidden');
        
        // Hide after a delay
        setTimeout(() => {
            document.getElementById('wave-transition').classList.add('hidden');
        }, 3000);
    }
}
