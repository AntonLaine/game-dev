class UpgradeSystem {
    constructor(game) {
        this.game = game;
        this.availableUpgrades = [
            {
                id: 'spread',
                title: 'Tri-Shot',
                description: 'Fire 3 bullets in a spread pattern with each shot',
                icon: '⍉',
                rarity: 'uncommon',
                apply: (player) => {
                    player.weaponUpgrades.spread = true;
                    player.weaponUpgrades.spreadCount = 3;
                }
            },
            {
                id: 'rapid',
                title: 'Rapid Fire',
                description: 'Fire 3 shots in quick succession with each trigger pull',
                icon: '⚡',
                rarity: 'rare',
                apply: (player) => {
                    player.weaponUpgrades.rapid = true;
                    player.weaponUpgrades.rapidCount = 3;
                }
            },
            {
                id: 'ammo',
                title: 'Extended Mags',
                description: 'Increase magazine capacity by 50%',
                icon: '🔄',
                rarity: 'common',
                apply: (player) => {
                    for (const weapon of player.weapons) {
                        weapon.maxAmmo = Math.floor(weapon.maxAmmo * 1.5);
                        weapon.maxTotalAmmo = Math.floor(weapon.maxTotalAmmo * 1.5);
                        weapon.totalAmmo += Math.floor(weapon.maxAmmo * 0.5);
                    }
                }
            },
            {
                id: 'laser',
                title: 'Laser Rounds',
                description: 'Bullets travel faster and pierce through zombies',
                icon: '⬸',
                rarity: 'epic',
                apply: (player) => {
                    player.weaponUpgrades.laser = true;
                    player.weaponUpgrades.pierceCount = 2;
                }
            },
            {
                id: 'sentry',
                title: 'Deployable Sentry',
                description: 'Press Q to deploy a sentry gun that attacks nearby zombies',
                icon: '⌬',
                rarity: 'legendary',
                apply: (player) => {
                    player.abilities.sentry = true;
                    player.abilities.sentryCount = 1;
                    player.abilities.sentryCooldown = 30000; // 30 seconds
                    player.abilities.sentryCurrentCooldown = 0;
                }
            },
            {
                id: 'blade',
                title: 'Combat Knife',
                description: 'Press F to quickly slash in front of you, damaging zombies',
                icon: '⚔',
                rarity: 'uncommon',
                apply: (player) => {
                    player.abilities.blade = true;
                    player.abilities.bladeCooldown = 5000; // 5 seconds
                    player.abilities.bladeCurrentCooldown = 0;
                }
            },
            {
                id: 'explosive',
                title: 'Explosive Rounds',
                description: 'Bullets create small explosions on impact',
                icon: '✺',
                rarity: 'epic',
                apply: (player) => {
                    player.weaponUpgrades.explosive = true;
                    player.weaponUpgrades.explosionRadius = 50;
                }
            },
            {
                id: 'healing',
                title: 'Regeneration',
                description: 'Slowly regenerate health over time',
                icon: '❤',
                rarity: 'rare',
                apply: (player) => {
                    player.abilities.regeneration = true;
                    player.abilities.regenAmount = 1;
                    player.abilities.regenInterval = 1000; // 1 second
                }
            },
            {
                id: 'dash',
                title: 'Tactical Dash',
                description: 'Press Space to quickly dash in your movement direction',
                icon: '⇨',
                rarity: 'uncommon',
                apply: (player) => {
                    player.abilities.dash = true;
                    player.abilities.dashCooldown = 3000; // 3 seconds
                    player.abilities.dashCurrentCooldown = 0;
                }
            },
            {
                id: 'aura',
                title: 'Damage Aura',
                description: 'Create a field around you that damages zombies slowly',
                icon: '☣',
                rarity: 'legendary',
                apply: (player) => {
                    player.abilities.aura = true;
                    player.abilities.auraRadius = 100;
                    player.abilities.auraDamage = 5;
                }
            }
        ];
        
        this.upgradeCardsContainer = document.getElementById('upgrade-cards');
    }
    
    showUpgradeSelection(count = 3) {
        // Pause the game
        this.game.isPaused = true;
        
        // Clear any existing cards
        this.upgradeCardsContainer.innerHTML = '';
        
        // Choose random upgrades
        const upgrades = this.getRandomUpgrades(count);
        
        // Create cards for each upgrade
        upgrades.forEach(upgrade => {
            const card = this.createUpgradeCard(upgrade);
            this.upgradeCardsContainer.appendChild(card);
        });
        
        // Show the upgrade screen
        document.getElementById('upgrade-screen').classList.remove('hidden');
    }
    
    getRandomUpgrades(count) {
        const availableUpgrades = [...this.availableUpgrades];
        const selectedUpgrades = [];
        
        // Ensure we don't try to pick more upgrades than available
        count = Math.min(count, availableUpgrades.length);
        
        for (let i = 0; i < count; i++) {
            if (availableUpgrades.length === 0) break;
            
            const randomIndex = Math.floor(Math.random() * availableUpgrades.length);
            selectedUpgrades.push(availableUpgrades[randomIndex]);
            availableUpgrades.splice(randomIndex, 1);
        }
        
        return selectedUpgrades;
    }
    
    createUpgradeCard(upgrade) {
        const card = document.createElement('div');
        card.className = `upgrade-card rarity-${upgrade.rarity}`;
        
        card.innerHTML = `
            <div class="upgrade-card-title">${upgrade.title}</div>
            <div class="upgrade-card-icon">${upgrade.icon}</div>
            <div class="upgrade-card-description">${upgrade.description}</div>
            <div class="upgrade-card-rarity">${upgrade.rarity}</div>
        `;
        
        card.addEventListener('click', () => {
            this.applyUpgrade(upgrade);
            document.getElementById('upgrade-screen').classList.add('hidden');
            this.game.isPaused = false;
        });
        
        return card;
    }
    
    applyUpgrade(upgrade) {
        // Apply the upgrade to the player
        upgrade.apply(this.game.player);
        
        // Remove the upgrade from available options if it shouldn't be stackable
        if (!this.isUpgradeStackable(upgrade.id)) {
            this.availableUpgrades = this.availableUpgrades.filter(u => u.id !== upgrade.id);
        }
        
        // Show a notification
        this.game.ui.showNotification(`Upgrade acquired: ${upgrade.title}!`);
    }
    
    isUpgradeStackable(upgradeId) {
        // Define which upgrades can be taken multiple times
        const stackableUpgrades = ['ammo', 'explosive', 'healing'];
        return stackableUpgrades.includes(upgradeId);
    }
}
