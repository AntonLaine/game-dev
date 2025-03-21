document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const rollButton = document.getElementById('roll-button');
    const sellButton = document.getElementById('sell-button');
    const sellAllBtn = document.getElementById('sell-all-btn');
    const toggleShopBtn = document.getElementById('toggle-shop-btn');
    const gemsValue = document.getElementById('gems-value');
    const itemImage = document.getElementById('item-image');
    const itemName = document.getElementById('item-name');
    const itemRarity = document.getElementById('item-rarity');
    const itemDescription = document.getElementById('item-description');
    const historyList = document.getElementById('history-list');
    const inventoryList = document.getElementById('inventory-list');
    const mythicAnimation = document.getElementById('mythic-animation');
    const shopSection = document.getElementById('shop-section');
    const upgradesList = document.getElementById('upgrades-list');
    const notification = document.getElementById('notification');
    const sellRarityBtns = document.querySelectorAll('.sell-rarity-btn');
    const cosmicAnimation = document.getElementById('cosmic-animation');
    const cheatMenu = document.getElementById('cheat-menu');
    const closeCheatMenuBtn = document.getElementById('close-cheat-menu');
    const addGemsBtn = document.getElementById('add-gems-btn');
    const gemAmountInput = document.getElementById('gem-amount');
    const toggleCooldownBtn = document.getElementById('toggle-cooldown-btn');
    const forceCosmicBtn = document.getElementById('force-cosmic-btn');
    const luckBtns = document.querySelectorAll('.luck-btn');
    const ancientAnimation = document.getElementById('ancient-animation');
    const divineAnimation = document.getElementById('divine-animation');
    const primordialAnimation = document.getElementById('primordial-animation');
    
    // Game state
    let gems = 100;
    const MAX_HISTORY = 20;
    let currentItem = null;
    let inventory = {};
    let rollCooldown = false;
    const ROLL_COOLDOWN_TIME = 1500; // 1.5 seconds cooldown between rolls
    let cheatCooldownDisabled = false;
    let cheatLuckMultiplier = 1;
    
    // Player upgrades
    const upgrades = {
        rollCooldown: {
            name: "Faster Rolling",
            description: "Reduces the cooldown between rolls",
            maxLevel: 5,
            level: 0,
            baseCost: 50,
            costMultiplier: 1.5,
            effect: (level) => `Cooldown: ${(ROLL_COOLDOWN_TIME * (1 - level * 0.15)).toFixed(0)}ms`,
            getValue: (level) => ROLL_COOLDOWN_TIME * (1 - level * 0.15)
        },
        sellBonus: {
            name: "Better Sell Prices",
            description: "Increases the amount of gems received when selling items",
            maxLevel: 5,
            level: 0,
            baseCost: 75,
            costMultiplier: 1.5,
            effect: (level) => `Sell bonus: +${level * 20}%`,
            getValue: (level) => 1 + (level * 0.2)
        },
        rareChance: {
            name: "Rare Item Chance",
            description: "Increases the chance of finding rare, epic, legendary and mythic items",
            maxLevel: 5,
            level: 0,
            baseCost: 100,
            costMultiplier: 2,
            effect: (level) => `Rare chance boost: +${level * 10}%`,
            getValue: (level) => level * 0.1
        },
        luckMultiplier: {
            name: "Luck Multiplier",
            description: "Multiplies your overall luck, improving all rarity chances",
            maxLevel: 3,
            level: 0,
            baseCost: 300,
            costMultiplier: 2.5,
            effect: (level) => `Luck multiplier: x${(1 + level * 0.5).toFixed(1)}`,
            getValue: (level) => 1 + level * 0.5
        },
        bulkRoll: {
            name: "Bulk Rolling",
            description: "Roll multiple items at once",
            maxLevel: 3,
            level: 0,
            baseCost: 200,
            costMultiplier: 2,
            effect: (level) => `Items per roll: ${level + 1}`,
            getValue: (level) => level + 1
        },
        autoSell: {
            name: "Auto-Sell Commons",
            description: "Automatically sells common items when your inventory is full",
            maxLevel: 1,
            level: 0,
            baseCost: 150,
            costMultiplier: 1,
            effect: (level) => level ? "Common items auto-sold" : "Off",
            getValue: (level) => level > 0
        },
        gemBonus: {
            name: "Gem Finder",
            description: "Small chance to find bonus gems when rolling",
            maxLevel: 5,
            level: 0,
            baseCost: 100,
            costMultiplier: 1.8,
            effect: (level) => `Gem find chance: ${level * 5}%`,
            getValue: (level) => level * 0.05
        }
    };
    
    // Sale values based on rarity
    const baseSellValues = {
        common: 5,
        uncommon: 10,
        rare: 25,
        epic: 50,
        legendary: 100,
        mythic: 250,
        cosmic: 1000,
        ancient: 5000,
        divine: 25000,
        primordial: 100000
    };
    
    // Item database
    const items = [
        {
            id: 1,
            name: "Wooden Sword",
            rarity: "common",
            description: "A basic wooden sword. Not very effective.",
            image: "https://via.placeholder.com/150/aaaaaa?text=Wooden+Sword"
        },
        {
            id: 2,
            name: "Iron Dagger",
            rarity: "common",
            description: "A simple iron dagger, slightly sharper than wood.",
            image: "https://via.placeholder.com/150/aaaaaa?text=Iron+Dagger"
        },
        {
            id: 3,
            name: "Steel Axe",
            rarity: "uncommon",
            description: "A sturdy steel axe with decent damage.",
            image: "https://via.placeholder.com/150/1eff00?text=Steel+Axe"
        },
        {
            id: 4,
            name: "Enchanted Bow",
            rarity: "uncommon",
            description: "A bow with magical properties that increases accuracy.",
            image: "https://via.placeholder.com/150/1eff00?text=Enchanted+Bow"
        },
        {
            id: 5,
            name: "Mithril Armor",
            rarity: "rare",
            description: "Lightweight but strong armor made from mithril.",
            image: "https://via.placeholder.com/150/0070dd?text=Mithril+Armor"
        },
        {
            id: 6,
            name: "Frost Staff",
            rarity: "rare",
            description: "A staff that can cast powerful ice spells.",
            image: "https://via.placeholder.com/150/0070dd?text=Frost+Staff"
        },
        {
            id: 7,
            name: "Dragonbone Shield",
            rarity: "epic",
            description: "A shield crafted from dragon bones. Highly resistant to fire.",
            image: "https://via.placeholder.com/150/a335ee?text=Dragonbone+Shield"
        },
        {
            id: 8,
            name: "Shadow Blade",
            rarity: "epic",
            description: "A dark blade that can absorb the souls of its victims.",
            image: "https://via.placeholder.com/150/a335ee?text=Shadow+Blade"
        },
        {
            id: 9,
            name: "Excalibur",
            rarity: "legendary",
            description: "The legendary sword of King Arthur. Ultimate power.",
            image: "https://via.placeholder.com/150/ff8000?text=Excalibur"
        },
        {
            id: 10,
            name: "Philosopher's Stone",
            rarity: "legendary",
            description: "An ancient artifact that grants eternal life and unlimited wealth.",
            image: "https://via.placeholder.com/150/ff8000?text=Philosopher's+Stone"
        },
        {
            id: 11,
            name: "Celestial Crown",
            rarity: "mythic",
            description: "A crown forged from starlight. Grants divine powers to the wearer.",
            image: "https://via.placeholder.com/150/e91e63?text=Celestial+Crown"
        },
        {
            id: 12,
            name: "Void Scepter",
            rarity: "mythic",
            description: "A scepter that can tear holes in reality itself. Handle with extreme caution.",
            image: "https://via.placeholder.com/150/e91e63?text=Void+Scepter"
        },
        {
            id: 13,
            name: "Eternity Gauntlet",
            rarity: "mythic",
            description: "A gauntlet that can control time, space, and reality when adorned with the six cosmic gems.",
            image: "https://via.placeholder.com/150/e91e63?text=Eternity+Gauntlet"
        },
        {
            id: 14,
            name: "Universal Core",
            rarity: "cosmic",
            description: "The fundamental building block of reality itself. Possessing this item grants you immense power over the fabric of the universe.",
            image: "https://via.placeholder.com/150/9400D3?text=Universal+Core"
        },
        {
            id: 15,
            name: "The Architect's Pen",
            rarity: "cosmic",
            description: "A pen used by the Creator to design the cosmos. Every stroke changes the laws of physics.",
            image: "https://via.placeholder.com/150/FF0000?text=Architect's+Pen"
        },
        {
            id: 16,
            name: "Pharaoh's Ankh",
            rarity: "ancient",
            description: "An ankh that once belonged to a powerful Egyptian ruler. It grants eternal life to its bearer.",
            image: "https://via.placeholder.com/150/c19a49?text=Pharaoh's+Ankh"
        },
        {
            id: 17,
            name: "Atlantean Crystal",
            rarity: "ancient",
            description: "A crystal from the lost city of Atlantis, containing knowledge and technology beyond modern comprehension.",
            image: "https://via.placeholder.com/150/c19a49?text=Atlantean+Crystal"
        },
        {
            id: 18,
            name: "Archangel's Halo",
            rarity: "divine",
            description: "The halo of a fallen archangel, radiating pure divine light. It bestows divine protection upon its owner.",
            image: "https://via.placeholder.com/150/ffffff?text=Archangel's+Halo"
        },
        {
            id: 19,
            name: "Chalice of Eternity",
            rarity: "divine",
            description: "The holy grail that grants immortality and infinite wisdom to those worthy enough to drink from it.",
            image: "https://via.placeholder.com/150/ffffff?text=Chalice+of+Eternity"
        },
        {
            id: 20,
            name: "The First Atom",
            rarity: "primordial",
            description: "The very first atom created at the beginning of the universe, containing unlimited energy and the power to create and destroy reality.",
            image: "https://via.placeholder.com/150/000000?text=First+Atom"
        },
        {
            id: 21,
            name: "Singularity Seed",
            rarity: "primordial",
            description: "The compressed seed of a previous universe. If activated, it could birth an entirely new cosmos.",
            image: "https://via.placeholder.com/150/000000?text=Singularity+Seed"
        }
    ];
    
    // Base rarity weights (probability distribution)
    const baseRarityWeights = {
        common: 60,
        uncommon: 25,
        rare: 10,
        epic: 4,
        legendary: 1,
        mythic: 0.1,
        cosmic: 0.0001,
        ancient: 0.00001,
        divine: 0.000001,
        primordial: 0.0000001
    };
    
    // Set up event listeners
    rollButton.addEventListener('click', rollItem);
    sellButton.addEventListener('click', sellItem);
    sellAllBtn.addEventListener('click', sellAllItems);
    toggleShopBtn.addEventListener('click', toggleShop);
    
    // Add event listeners for sell by rarity buttons
    sellRarityBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const rarity = this.dataset.rarity;
            sellItemsByRarity(rarity);
        });
    });
    
    // Add event listeners for the cheat menu
    document.addEventListener('keydown', function(e) {
        if (e.key.toLowerCase() === 'm') {
            toggleCheatMenu();
        }
    });
    
    closeCheatMenuBtn.addEventListener('click', toggleCheatMenu);
    addGemsBtn.addEventListener('click', addGems);
    toggleCooldownBtn.addEventListener('click', toggleCooldown);
    forceCosmicBtn.addEventListener('click', forceCosmicRoll);
    
    luckBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const luckValue = parseFloat(this.dataset.luck);
            setCheatLuck(luckValue);
        });
    });
    
    // Initialize shop
    renderUpgrades();
    
    // Update roll button text to show it's free
    rollButton.textContent = "Roll Item (Free)";
    
    // Notification system
    function showNotification(message, type = 'info') {
        notification.textContent = message;
        notification.className = `${type}`;
        
        // Force a reflow
        notification.offsetHeight;
        
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }
    
    // Shop functions
    function toggleShop() {
        if (shopSection.classList.contains('hidden')) {
            shopSection.classList.remove('hidden');
            toggleShopBtn.textContent = 'Close Shop';
        } else {
            shopSection.classList.add('hidden');
            toggleShopBtn.textContent = 'Shop';
        }
    }
    
    function renderUpgrades() {
        upgradesList.innerHTML = '';
        
        for (const [key, upgrade] of Object.entries(upgrades)) {
            const upgradeEl = document.createElement('div');
            upgradeEl.className = 'upgrade-item';
            
            const upgradeCost = getUpgradeCost(upgrade);
            const isMaxed = upgrade.level >= upgrade.maxLevel;
            
            upgradeEl.innerHTML = `
                <div class="upgrade-header">
                    <span class="upgrade-title">${upgrade.name}</span>
                    <span class="upgrade-cost">${isMaxed ? 'MAXED' : upgradeCost + ' gems'}</span>
                </div>
                <div class="upgrade-description">${upgrade.description}</div>
                <div class="upgrade-level">Level: ${upgrade.level}/${upgrade.maxLevel}</div>
                <div class="upgrade-effect">${upgrade.effect(upgrade.level)}</div>
                <button class="upgrade-button ${isMaxed ? 'upgrade-maxed' : ''}" 
                        data-upgrade="${key}" 
                        ${isMaxed || gems < upgradeCost ? 'disabled' : ''}>
                    ${isMaxed ? 'MAXED' : 'Purchase'}
                </button>
            `;
            
            upgradesList.appendChild(upgradeEl);
        }
        
        // Add event listeners to the purchase buttons
        document.querySelectorAll('.upgrade-button').forEach(button => {
            if (!button.disabled) {
                button.addEventListener('click', purchaseUpgrade);
            }
        });
    }
    
    function purchaseUpgrade(e) {
        const upgradeKey = e.target.dataset.upgrade;
        const upgrade = upgrades[upgradeKey];
        const cost = getUpgradeCost(upgrade);
        
        if (gems >= cost && upgrade.level < upgrade.maxLevel) {
            // Deduct gems
            gems -= cost;
            gemsValue.textContent = gems;
            
            // Increase upgrade level
            upgrade.level++;
            
            // Show notification
            showNotification(`Purchased ${upgrade.name} Level ${upgrade.level}!`, 'success');
            
            // Re-render upgrades
            renderUpgrades();
        } else if (gems < cost) {
            showNotification(`Not enough gems to purchase this upgrade!`, 'error');
        }
    }
    
    function getUpgradeCost(upgrade) {
        return Math.round(upgrade.baseCost * Math.pow(upgrade.costMultiplier, upgrade.level));
    }
    
    // Get current roll cooldown based on upgrades
    function getCurrentRollCooldown() {
        // If cheat is enabled, return 0 cooldown
        if (cheatCooldownDisabled) return 0;
        
        // Otherwise, use the regular cooldown
        return upgrades.rollCooldown.getValue(upgrades.rollCooldown.level);
    }
    
    // Get modified rarity weights based on upgrades
    function getRarityWeights() {
        const rareBoost = upgrades.rareChance.getValue(upgrades.rareChance.level);
        const luckMultiplier = upgrades.luckMultiplier.getValue(upgrades.luckMultiplier.level);
        
        // Apply cheat luck multiplier
        const totalLuckMultiplier = luckMultiplier * cheatLuckMultiplier;
        
        const weights = { ...baseRarityWeights };
        
        if (rareBoost > 0 || totalLuckMultiplier > 1) {
            // Calculate combined boost effect
            const combinedBoost = rareBoost * totalLuckMultiplier;
            
            // Reduce common weight
            weights.common = Math.max(20, weights.common * (1 - combinedBoost * 0.6));
            
            // Boost all other rarities proportionally with the luck multiplier
            weights.uncommon *= (1 + combinedBoost * 0.5);
            weights.rare *= (1 + combinedBoost);
            weights.epic *= (1 + combinedBoost * 1.5);
            weights.legendary *= (1 + combinedBoost * 2);
            weights.mythic *= (1 + combinedBoost * 3);
            weights.cosmic *= (1 + combinedBoost * 5);
            weights.ancient *= (1 + combinedBoost * 7);
            weights.divine *= (1 + combinedBoost * 10);
            weights.primordial *= (1 + combinedBoost * 15);
        }
        
        return weights;
    }
    
    // Calculate sell value based on upgrades
    function calculateSellValue(rarity) {
        const baseValue = baseSellValues[rarity];
        const sellBonus = upgrades.sellBonus.getValue(upgrades.sellBonus.level);
        return Math.round(baseValue * sellBonus);
    }
    
    // Functions
    function rollItem() {
        if (rollCooldown && !cheatCooldownDisabled) {
            showNotification("Rolling too fast! Please wait...", 'error');
            return;
        }
        
        // Set cooldown (unless cheat is active)
        rollCooldown = !cheatCooldownDisabled;
        rollButton.disabled = true;
        
        // Calculate cooldown time based on upgrades
        const cooldownTime = getCurrentRollCooldown();
        
        // Visual feedback for cooldown if it's enabled
        if (!cheatCooldownDisabled) {
            rollButton.classList.add('cooldown');
        }
        rollButton.textContent = "Rolling...";
        
        // Get bulk roll count
        const bulkCount = upgrades.bulkRoll.getValue(upgrades.bulkRoll.level);
        
        // Disable sell button while rolling
        sellButton.disabled = true;
        
        // Start rolling animation
        itemImage.classList.add('rolling');
        itemName.textContent = "Rolling...";
        itemRarity.textContent = "";
        itemRarity.className = "";
        itemDescription.textContent = "";
        
        // Simulate rolling delay
        setTimeout(() => {
            let hasPrimordialItem = false;
            let hasDivineItem = false;
            let hasAncientItem = false;
            let hasCosmicItem = false;
            let hasMythic = false;
            let lastItem = null;
            let gemBonus = 0;
            
            // Roll multiple items if bulk upgrade is purchased
            for (let i = 0; i < bulkCount; i++) {
                // First determine rarity based on weights
                const rarity = determineRarity();
                
                // Filter items by rarity and pick a random one
                const possibleItems = items.filter(item => item.rarity === rarity);
                const item = possibleItems[Math.floor(Math.random() * possibleItems.length)];
                
                // Save the last item to display
                lastItem = item;
                
                // Check for special rarities for animations
                switch(item.rarity) {
                    case "primordial":
                        hasPrimordialItem = true;
                        break;
                    case "divine":
                        hasDivineItem = true;
                        break;
                    case "ancient":
                        hasAncientItem = true;
                        break;
                    case "cosmic":
                        hasCosmicItem = true;
                        break;
                    case "mythic":
                        hasMythic = true;
                        break;
                }
                
                // Check for gem bonus
                const gemChance = upgrades.gemBonus.getValue(upgrades.gemBonus.level);
                if (Math.random() < gemChance) {
                    // Bonus gems based on item rarity
                    const bonusAmount = Math.round(baseSellValues[item.rarity] * 0.5);
                    gemBonus += bonusAmount;
                }
                
                // Add to history
                addToHistory(item);
                
                // Add to inventory or auto-sell
                if (item.rarity === "common" && upgrades.autoSell.getValue(upgrades.autoSell.level)) {
                    // Auto-sell common items
                    const sellValue = calculateSellValue(item.rarity);
                    gems += sellValue;
                    showNotification(`Auto-sold ${item.name} for ${sellValue} gems`, 'info');
                } else {
                    // Add to inventory
                    addToInventory(item);
                }
            }
            
            // Add any gem bonus
            if (gemBonus > 0) {
                gems += gemBonus;
                showNotification(`Found ${gemBonus} bonus gems!`, 'success');
            }
            
            // Update gems display
            gemsValue.textContent = gems;
            
            // Display the last item rolled
            if (lastItem) {
                currentItem = lastItem;
                displayItem(lastItem);
                
                // Enable sell button
                sellButton.disabled = false;
            }
            
            // End rolling animation
            itemImage.classList.remove('rolling');
            
            // Show appropriate animation if a special item was found
            // Only show the highest tier animation
            if (hasPrimordialItem) {
                playPrimordialAnimation();
            } else if (hasDivineItem) {
                playDivineAnimation();
            } else if (hasAncientItem) {
                playAncientAnimation();
            } else if (hasCosmicItem) {
                playCosmicAnimation();
            } else if (hasMythic) {
                playMythicAnimation();
            }
            
            // Update the shop in case player can now afford upgrades
            renderUpgrades();
            
            // Reset roll button after cooldown
            setTimeout(() => {
                rollCooldown = false;
                rollButton.disabled = false;
                rollButton.classList.remove('cooldown');
                rollButton.textContent = "Roll Item (Free)";
            }, cooldownTime);
        }, 1000);
    }
    
    function determineRarity() {
        // Get modified weights based on upgrades
        const rarityWeights = getRarityWeights();
        
        // Calculate total weight
        const totalWeight = Object.values(rarityWeights).reduce((a, b) => a + b, 0);
        
        // Get a random number between 0 and total weight
        const random = Math.random() * totalWeight;
        
        // Determine rarity based on weights
        let weightSum = 0;
        for (const [rarity, weight] of Object.entries(rarityWeights)) {
            weightSum += weight;
            if (random < weightSum) {
                return rarity;
            }
        }
        
        // Fallback (should never happen)
        return "common";
    }
    
    function displayItem(item) {
        itemImage.src = item.image;
        itemName.textContent = item.name;
        
        // Special styling for ultra-rare items
        switch(item.rarity) {
            case "primordial":
                itemRarity.innerHTML = `<span class="primordial">Primordial</span>`;
                itemRarity.className = "";
                break;
            case "divine":
                itemRarity.innerHTML = `<span class="divine">Divine</span>`;
                itemRarity.className = "";
                break;
            case "ancient":
                itemRarity.innerHTML = `<span class="ancient">Ancient</span>`;
                itemRarity.className = "";
                break;
            case "cosmic":
                itemRarity.innerHTML = `<span class="cosmic">Cosmic</span>`;
                itemRarity.className = "";
                break;
            default:
                itemRarity.textContent = capitalizeFirstLetter(item.rarity);
                itemRarity.className = item.rarity;
        }
        
        itemDescription.textContent = item.description;
    }
    
    function addToHistory(item) {
        const historyItem = document.createElement('div');
        historyItem.className = `history-item ${item.rarity}`;
        historyItem.textContent = item.name;
        
        // Add to the beginning of the list
        historyList.insertBefore(historyItem, historyList.firstChild);
        
        // Remove oldest items if exceeding max history
        while (historyList.children.length > MAX_HISTORY) {
            historyList.removeChild(historyList.lastChild);
        }
    }
    
    function addToInventory(item) {
        // Add or increment item in inventory
        if (inventory[item.id]) {
            inventory[item.id].count++;
        } else {
            inventory[item.id] = {
                item: item,
                count: 1
            };
        }
        
        // Update inventory display
        updateInventoryDisplay();
    }
    
    function updateInventoryDisplay() {
        // Clear current inventory display
        inventoryList.innerHTML = '';
        
        // Add each inventory item
        for (const id in inventory) {
            if (inventory[id].count > 0) {
                const invItem = inventory[id];
                
                const inventoryItem = document.createElement('div');
                inventoryItem.className = 'inventory-item';
                inventoryItem.dataset.itemId = id;
                
                const itemImg = document.createElement('img');
                itemImg.src = invItem.item.image;
                itemImg.alt = invItem.item.name;
                
                const itemCount = document.createElement('div');
                itemCount.className = 'item-count';
                itemCount.textContent = invItem.count;
                
                const itemBorder = document.createElement('div');
                itemBorder.className = `item-border ${invItem.item.rarity}-border`;
                
                inventoryItem.appendChild(itemImg);
                inventoryItem.appendChild(itemCount);
                inventoryItem.appendChild(itemBorder);
                
                // Add click event to display item details
                inventoryItem.addEventListener('click', () => {
                    currentItem = invItem.item;
                    displayItem(invItem.item);
                    sellButton.disabled = false;
                });
                
                inventoryList.appendChild(inventoryItem);
            }
        }
    }
    
    function sellItem() {
        if (!currentItem) return;
        
        // Find item in inventory
        if (inventory[currentItem.id] && inventory[currentItem.id].count > 0) {
            // Get sell value based on rarity and upgrades
            const sellValue = calculateSellValue(currentItem.rarity);
            
            // Add gems
            gems += sellValue;
            gemsValue.textContent = gems;
            
            // Decrease inventory count
            inventory[currentItem.id].count--;
            
            // Update inventory display
            updateInventoryDisplay();
            
            // Update shop buttons (in case player can now afford upgrades)
            renderUpgrades();
            
            // Show notification instead of alert
            showNotification(`Sold ${currentItem.name} for ${sellValue} gems!`, 'success');
            
            // If no more of this item, disable sell button
            if (inventory[currentItem.id].count === 0) {
                currentItem = null;
                sellButton.disabled = true;
                
                // Reset item display
                itemImage.src = "https://via.placeholder.com/150";
                itemName.textContent = "Item sold";
                itemRarity.textContent = "-";
                itemRarity.className = "";
                itemDescription.textContent = "Roll again or select an item from your inventory.";
            }
        }
    }
    
    function sellAllItems() {
        let totalValue = 0;
        let itemsSold = 0;
        
        // Go through all inventory items
        for (const id in inventory) {
            if (inventory[id].count > 0) {
                const item = inventory[id].item;
                const count = inventory[id].count;
                const value = calculateSellValue(item.rarity) * count;
                
                totalValue += value;
                itemsSold += count;
                
                // Reset the inventory count
                inventory[id].count = 0;
            }
        }
        
        if (itemsSold > 0) {
            // Add gems
            gems += totalValue;
            gemsValue.textContent = gems;
            
            // Update inventory display
            updateInventoryDisplay();
            
            // Update shop buttons (in case player can now afford upgrades)
            renderUpgrades();
            
            // Show notification
            showNotification(`Sold ${itemsSold} items for ${totalValue} gems!`, 'success');
            
            // Reset current item if it was sold
            if (currentItem && inventory[currentItem.id] && inventory[currentItem.id].count === 0) {
                currentItem = null;
                sellButton.disabled = true;
                
                // Reset item display
                itemImage.src = "https://via.placeholder.com/150";
                itemName.textContent = "All items sold";
                itemRarity.textContent = "-";
                itemRarity.className = "";
                itemDescription.textContent = "Roll again to get more items.";
            }
        } else {
            showNotification("No items to sell!", 'info');
        }
    }
    
    function sellItemsByRarity(rarity) {
        let totalValue = 0;
        let itemsSold = 0;
        
        // Go through inventory items of specified rarity
        for (const id in inventory) {
            if (inventory[id].count > 0 && inventory[id].item.rarity === rarity) {
                const item = inventory[id].item;
                const count = inventory[id].count;
                const value = calculateSellValue(item.rarity) * count;
                
                totalValue += value;
                itemsSold += count;
                
                // Reset the inventory count
                inventory[id].count = 0;
            }
        }
        
        if (itemsSold > 0) {
            // Add gems
            gems += totalValue;
            gemsValue.textContent = gems;
            
            // Update inventory display
            updateInventoryDisplay();
            
            // Update shop buttons (in case player can now afford upgrades)
            renderUpgrades();
            
            // Show notification
            showNotification(`Sold ${itemsSold} ${rarity} items for ${totalValue} gems!`, 'success');
            
            // Reset current item if it was sold
            if (currentItem && currentItem.rarity === rarity) {
                currentItem = null;
                sellButton.disabled = true;
                
                // Reset item display
                itemImage.src = "https://via.placeholder.com/150";
                itemName.textContent = `${capitalizeFirstLetter(rarity)} items sold`;
                itemRarity.textContent = "-";
                itemRarity.className = "";
                itemDescription.textContent = "Roll again or select an item from your inventory.";
            }
        } else {
            showNotification(`No ${rarity} items to sell!`, 'info');
        }
    }
    
    function playCosmicAnimation() {
        // Show cosmic animation
        cosmicAnimation.classList.remove('hidden');
        
        // Hide animation after delay
        setTimeout(() => {
            cosmicAnimation.classList.add('hidden');
        }, 5000);
    }
    
    function playMythicAnimation() {
        // Show mythic animation
        mythicAnimation.classList.remove('hidden');
        
        // Hide animation after delay
        setTimeout(() => {
            mythicAnimation.classList.add('hidden');
        }, 3000);
    }
    
    function playAncientAnimation() {
        ancientAnimation.classList.remove('hidden');
        
        setTimeout(() => {
            ancientAnimation.classList.add('hidden');
        }, 6000);
    }
    
    function playDivineAnimation() {
        divineAnimation.classList.remove('hidden');
        
        setTimeout(() => {
            divineAnimation.classList.add('hidden');
        }, 7000);
    }
    
    function playPrimordialAnimation() {
        primordialAnimation.classList.remove('hidden');
        
        setTimeout(() => {
            primordialAnimation.classList.add('hidden');
        }, 10000);
    }
    
    function toggleCheatMenu() {
        cheatMenu.classList.toggle('hidden');
    }
    
    function addGems() {
        const amount = parseInt(gemAmountInput.value) || 0;
        if (amount > 0) {
            gems += amount;
            gemsValue.textContent = gems;
            showNotification(`Added ${amount} gems!`, 'success');
            renderUpgrades();
        }
    }
    
    function toggleCooldown() {
        cheatCooldownDisabled = !cheatCooldownDisabled;
        toggleCooldownBtn.textContent = cheatCooldownDisabled ? 
            "Enable Cooldown" : "Disable Cooldown";
        toggleCooldownBtn.style.backgroundColor = cheatCooldownDisabled ? 
            "#e74c3c" : "#3d3d5c";
        
        showNotification(`Cooldown ${cheatCooldownDisabled ? 'disabled' : 'enabled'}!`, 'info');
    }
    
    function setCheatLuck(value) {
        cheatLuckMultiplier = value;
        
        // Update active state on buttons
        luckBtns.forEach(btn => {
            const btnValue = parseFloat(btn.dataset.luck);
            if (btnValue === value) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        showNotification(`Luck multiplier set to ${value}x!`, 'info');
    }
    
    function forceCosmicRoll() {
        const rarities = ['cosmic', 'ancient', 'divine', 'primordial'];
        const selectedRarity = rarities[Math.floor(Math.random() * rarities.length)];
        rollWithRarity(selectedRarity);
    }
    
    // Special roll function for forcing specific rarity
    function rollWithRarity(forcedRarity) {
        // Disable buttons during roll
        rollButton.disabled = true;
        sellButton.disabled = true;
        
        // Visual feedback for rolling
        rollButton.textContent = "Rolling...";
        
        // Get bulk roll count
        const bulkCount = upgrades.bulkRoll.getValue(upgrades.bulkRoll.level);
        
        // Start rolling animation
        itemImage.classList.add('rolling');
        itemName.textContent = "Rolling...";
        itemRarity.textContent = "";
        itemRarity.className = "";
        itemDescription.textContent = "";
        
        // Simulate rolling delay
        setTimeout(() => {
            // Filter items by the forced rarity
            const possibleItems = items.filter(item => item.rarity === forcedRarity);
            if (possibleItems.length === 0) {
                showNotification(`No items of ${forcedRarity} rarity found!`, 'error');
                return;
            }
            
            // Pick a random item of the forced rarity
            const item = possibleItems[Math.floor(Math.random() * possibleItems.length)];
            
            // Save as current item
            currentItem = item;
            
            // Display the item
            displayItem(item);
            
            // Add to history
            addToHistory(item);
            
            // Add to inventory
            addToInventory(item);
            
            // Enable sell button
            sellButton.disabled = false;
            
            // End rolling animation
            itemImage.classList.remove('rolling');
            
            // Show appropriate animation
            if (item.rarity === "primordial") {
                playPrimordialAnimation();
            } else if (item.rarity === "divine") {
                playDivineAnimation();
            } else if (item.rarity === "ancient") {
                playAncientAnimation();
            } else if (item.rarity === "cosmic") {
                playCosmicAnimation();
            } else if (item.rarity === "mythic") {
                playMythicAnimation();
            }
            
            // Update the shop in case player can now afford upgrades
            renderUpgrades();
            
            // Reset roll button
            setTimeout(() => {
                rollCooldown = false;
                rollButton.disabled = false;
                rollButton.textContent = "Roll Item (Free)";
            }, 500);
        }, 1000);
    }
    
    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
    
    // Add functions to cheat menu
    const cheatRarityButtons = document.createElement('div');
    cheatRarityButtons.className = 'cheat-section';
    cheatRarityButtons.innerHTML = `
        <h3>Force Rarity</h3>
        <div class="cheat-control">
            <button id="force-ancient-btn">Roll Ancient</button>
            <button id="force-divine-btn">Roll Divine</button>
            <button id="force-primordial-btn">Roll Primordial</button>
        </div>
    `;
    
    document.querySelector('.cheat-content').appendChild(cheatRarityButtons);
    
    document.getElementById('force-ancient-btn').addEventListener('click', () => rollWithRarity('ancient'));
    document.getElementById('force-divine-btn').addEventListener('click', () => rollWithRarity('divine'));
    document.getElementById('force-primordial-btn').addEventListener('click', () => rollWithRarity('primordial'));
});
