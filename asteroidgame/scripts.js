document.addEventListener('DOMContentLoaded', () => {
    const gameContainer = document.getElementById('game-container');
    const player = document.getElementById('player');
    const scoreDisplay = document.getElementById('score');
    const gameOverScreen = document.getElementById('game-over');
    const finalScore = document.getElementById('final-score');
    const inventoryDisplay = document.getElementById('inventory-items');
    const upgradeScreen = document.getElementById('upgrade-screen');
    const abilitiesScreen = document.getElementById('abilities-screen');
    let playerPosition = 0;
    let playerSpeed = 10;
    let obstacleSpeed = 5;
    let score = 0;
    let scoreMultiplier = 1;
    let gameInterval;
    let obstacleInterval;
    let powerUpInterval;
    let activePowerUps = [];
    let shieldActive = false;
    let extraLife = false;
    let chosenAbility = null;
    let abilityCooldown = false;

    const powerUpSound = new Audio('https://freesound.org/data/previews/250/250629_4486188-lq.mp3'); // Power-up sound from Freesound.org
    const gameOverSound = new Audio('https://freesound.org/data/previews/250/250630_4486188-lq.mp3'); // Game over sound from Freesound.org
    const upgradeSound = new Audio('https://freesound.org/data/previews/250/250631_4486188-lq.mp3'); // Upgrade sound from Freesound.org

    function movePlayer(event) {
        const rect = gameContainer.getBoundingClientRect();
        playerPosition = event.clientX - rect.left - player.offsetWidth / 2;
        if (playerPosition < 0) playerPosition = 0;
        if (playerPosition > gameContainer.offsetWidth - player.offsetWidth) playerPosition = gameContainer.offsetWidth - player.offsetWidth;
        player.style.left = playerPosition + 'px';
    }

    function createObstacle() {
        const obstacle = document.createElement('div');
        obstacle.classList.add('enemy', 'type1');
        obstacle.style.left = Math.random() * (gameContainer.offsetWidth - 50) + 'px';
        gameContainer.appendChild(obstacle);
        moveObstacle(obstacle);
    }

    function moveObstacle(obstacle) {
        let obstaclePosition = 0;
        const interval = setInterval(() => {
            if (obstaclePosition > gameContainer.offsetHeight) {
                clearInterval(interval);
                gameContainer.removeChild(obstacle);
                updateScore();
            } else {
                obstaclePosition += obstacleSpeed;
                obstacle.style.top = obstaclePosition + 'px';
                checkCollision(obstacle, interval);
            }
        }, 20);
    }

    function createPowerUp() {
        const powerUpTypes = ['speed', 'shield', 'double-points', 'freeze'];
        const powerUpType = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
        const powerUp = document.createElement('div');
        powerUp.classList.add('power-up', powerUpType);
        powerUp.style.left = Math.random() * (gameContainer.offsetWidth - 30) + 'px';
        gameContainer.appendChild(powerUp);
        movePowerUp(powerUp);
    }

    function movePowerUp(powerUp) {
        let powerUpPosition = 0;
        const interval = setInterval(() => {
            if (powerUpPosition > gameContainer.offsetHeight) {
                clearInterval(interval);
                gameContainer.removeChild(powerUp);
            } else {
                powerUpPosition += obstacleSpeed;
                powerUp.style.top = powerUpPosition + 'px';
                checkPowerUpCollision(powerUp, interval);
            }
        }, 20);
    }

    function checkCollision(obstacle, interval) {
        const playerRect = player.getBoundingClientRect();
        const obstacleRect = obstacle.getBoundingClientRect();

        if (
            playerRect.left < obstacleRect.left + obstacleRect.width &&
            playerRect.left + playerRect.width > obstacleRect.left &&
            playerRect.top < obstacleRect.top + obstacleRect.height &&
            playerRect.top + playerRect.height > obstacleRect.top
        ) {
            if (shieldActive) {
                clearInterval(interval);
                gameContainer.removeChild(obstacle);
                deactivateShield();
            } else if (extraLife) {
                clearInterval(interval);
                gameContainer.removeChild(obstacle);
                extraLife = false;
            } else {
                clearInterval(interval);
                gameOver();
            }
        }
    }

    function checkPowerUpCollision(powerUp, interval) {
        const playerRect = player.getBoundingClientRect();
        const powerUpRect = powerUp.getBoundingClientRect();

        if (
            playerRect.left < powerUpRect.left + powerUpRect.width &&
            playerRect.left + playerRect.width > powerUpRect.left &&
            playerRect.top < powerUpRect.top + powerUpRect.height &&
            playerRect.top + playerRect.height > powerUpRect.top
        ) {
            clearInterval(interval);
            gameContainer.removeChild(powerUp);
            powerUpSound.play();
            addPowerUpToInventory(powerUp.classList[1]);
        }
    }

    function addPowerUpToInventory(type) {
        const inventoryItem = document.createElement('div');
        inventoryItem.classList.add('inventory-item', type);
        inventoryItem.setAttribute('data-type', type);
        inventoryItem.addEventListener('click', () => usePowerUp(type, inventoryItem));
        inventoryDisplay.appendChild(inventoryItem);
    }

    function usePowerUp(type, inventoryItem) {
        inventoryDisplay.removeChild(inventoryItem);
        activatePowerUp(type);
    }

    function activatePowerUp(type) {
        activePowerUps.push(type);
        updateInventory();
        switch (type) {
            case 'speed':
                playerSpeed = 20;
                setTimeout(() => {
                    playerSpeed = 10;
                    removePowerUp(type);
                }, 5000);
                break;
            case 'shield':
                activateShield();
                setTimeout(() => {
                    deactivateShield();
                    removePowerUp(type);
                }, 5000);
                break;
            case 'double-points':
                activateDoublePoints();
                setTimeout(() => {
                    deactivateDoublePoints();
                    removePowerUp(type);
                }, 5000);
                break;
            case 'freeze':
                freezeObstacles();
                setTimeout(() => {
                    unfreezeObstacles();
                    removePowerUp(type);
                }, 5000);
                break;
        }
    }

    function activateShield() {
        player.style.backgroundColor = 'blue';
        player.classList.add('shielded');
        shieldActive = true;
    }

    function deactivateShield() {
        player.style.backgroundColor = 'red';
        player.classList.remove('shielded');
        shieldActive = false;
    }

    function activateDoublePoints() {
        scoreMultiplier = 2;
    }

    function deactivateDoublePoints() {
        scoreMultiplier = 1;
    }

    function freezeObstacles() {
        const obstacles = document.querySelectorAll('.enemy');
        obstacles.forEach(obstacle => {
            obstacle.style.animationPlayState = 'paused';
        });
        clearInterval(obstacleInterval);
    }

    function unfreezeObstacles() {
        const obstacles = document.querySelectorAll('.enemy');
        obstacles.forEach(obstacle => {
            obstacle.style.animationPlayState = 'running';
        });
        obstacleInterval = setInterval(createObstacle, 2000);
    }

    function removePowerUp(type) {
        activePowerUps = activePowerUps.filter(powerUp => powerUp !== type);
        updateInventory();
    }

    function updateInventory() {
        inventoryDisplay.textContent = activePowerUps.join(', ');
    }

    function updateScore() {
        score += 10 * scoreMultiplier;
        scoreDisplay.textContent = 'Score: ' + score;
        if (score % 100 === 0) {
            levelUp();
        }
    }

    function levelUp() {
        obstacleSpeed += 2;
        showUpgradeScreen();
    }

    function showUpgradeScreen() {
        clearInterval(gameInterval);
        clearInterval(obstacleInterval);
        clearInterval(powerUpInterval);
        upgradeScreen.style.display = 'block';
        upgradeSound.play();
    }

    function showAbilitiesScreen() {
        upgradeScreen.style.display = 'none';
        abilitiesScreen.style.display = 'block';
    }

    function backToUpgradeScreen() {
        abilitiesScreen.style.display = 'none';
        upgradeScreen.style.display = 'block';
    }

    function chooseUpgrade(upgrade) {
        upgradeScreen.style.display = 'none';
        switch (upgrade) {
            case 'extra-life':
                extraLife = true;
                break;
            case 'shield':
                activateShield();
                break;
            case 'double-points':
                activateDoublePoints();
                break;
        }
        startGame();
    }

    function chooseAbility(ability) {
        abilitiesScreen.style.display = 'none';
        chosenAbility = ability;
        startGame();
    }

    function activateAbility() {
        if (abilityCooldown || !chosenAbility) return;
        abilityCooldown = true;
        switch (chosenAbility) {
            case 'speed':
                playerSpeed = 20;
                setTimeout(() => {
                    playerSpeed = 10;
                    abilityCooldown = false;
                }, 5000);
                break;
            case 'freeze':
                freezeObstacles();
                setTimeout(() => {
                    unfreezeObstacles();
                    abilityCooldown = false;
                }, 5000);
                break;
            case 'invincibility':
                shieldActive = true;
                player.style.backgroundColor = 'gold';
                setTimeout(() => {
                    shieldActive = false;
                    player.style.backgroundColor = 'red';
                    abilityCooldown = false;
                }, 5000);
                break;
        }
    }

    function gameOver() {
        clearInterval(gameInterval);
        clearInterval(obstacleInterval);
        clearInterval(powerUpInterval);
        gameOverSound.play();
        finalScore.textContent = score;
        gameOverScreen.style.display = 'block';
    }

    function restartGame() {
        score = 0;
        scoreMultiplier = 1;
        scoreDisplay.textContent = 'Score: ' + score;
        playerPosition = 0;
        player.style.left = playerPosition + 'px';
        gameOverScreen.style.display = 'none';
        obstacleSpeed = 5;
        playerSpeed = 10;
        activePowerUps = [];
        shieldActive = false;
        extraLife = false;
        chosenAbility = null;
        abilityCooldown = false;
        updateInventory();
        const obstacles = document.querySelectorAll('.enemy');
        obstacles.forEach(obstacle => gameContainer.removeChild(obstacle));
        const powerUps = document.querySelectorAll('.power-up');
        powerUps.forEach(powerUp => gameContainer.removeChild(powerUp));
        startGame();
    }

    function startGame() {
        gameContainer.addEventListener('mousemove', movePlayer);
        document.addEventListener('keydown', (event) => {
            if (event.key === 'e') {
                activateAbility();
            }
        });
        gameInterval = setInterval(createObstacle, 2000);
        powerUpInterval = setInterval(createPowerUp, 10000);
    }

    window.restartGame = restartGame;
    window.chooseUpgrade = chooseUpgrade;
    window.chooseAbility = chooseAbility;
    window.showAbilitiesScreen = showAbilitiesScreen;
    window.backToUpgradeScreen = backToUpgradeScreen;
    startGame();
});
