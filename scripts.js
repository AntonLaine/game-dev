document.addEventListener('DOMContentLoaded', () => {
    const gameContainer = document.getElementById('game-container');
    const player = document.getElementById('player');
    const scoreDisplay = document.getElementById('score');
    const gameOverScreen = document.getElementById('game-over');
    const finalScore = document.getElementById('final-score');
    const inventoryDisplay = document.getElementById('inventory-items');
    let playerPosition = 0;
    const playerSpeed = 10;
    let obstacleSpeed = 5;
    let score = 0;
    let gameInterval;
    let obstacleInterval;
    let powerUpInterval;
    let activePowerUps = [];

    const powerUpSound = new Audio('power-up.mp3');
    const gameOverSound = new Audio('game-over.mp3');

    function movePlayer(event) {
        const rect = gameContainer.getBoundingClientRect();
        playerPosition = event.clientX - rect.left - player.offsetWidth / 2;
        if (playerPosition < 0) playerPosition = 0;
        if (playerPosition > gameContainer.offsetWidth - player.offsetWidth) playerPosition = gameContainer.offsetWidth - player.offsetWidth;
        player.style.left = playerPosition + 'px';
    }

    function createObstacle() {
        const obstacle = document.createElement('div');
        obstacle.classList.add('obstacle');
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
            clearInterval(interval);
            gameOver();
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
            activatePowerUp(powerUp.classList[1]);
        }
    }

    function activatePowerUp(type) {
        activePowerUps.push(type);
        updateInventory();
        switch (type) {
            case 'speed':
                obstacleSpeed = 2;
                setTimeout(() => {
                    obstacleSpeed = 5;
                    removePowerUp(type);
                }, 5000);
                break;
            case 'shield':
                // Implement shield logic
                break;
            case 'double-points':
                // Implement double points logic
                break;
            case 'freeze':
                // Implement freeze logic
                break;
        }
    }

    function removePowerUp(type) {
        activePowerUps = activePowerUps.filter(powerUp => powerUp !== type);
        updateInventory();
    }

    function updateInventory() {
        inventoryDisplay.textContent = activePowerUps.join(', ');
    }

    function updateScore() {
        score += 10;
        scoreDisplay.textContent = 'Score: ' + score;
        if (score % 100 === 0) {
            levelUp();
        }
    }

    function levelUp() {
        obstacleSpeed += 2;
        alert('Level Up! Speed increased.');
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
        scoreDisplay.textContent = 'Score: ' + score;
        playerPosition = 0;
        player.style.left = playerPosition + 'px';
        gameOverScreen.style.display = 'none';
        obstacleSpeed = 5;
        activePowerUps = [];
        updateInventory();
        const obstacles = document.querySelectorAll('.obstacle');
        obstacles.forEach(obstacle => gameContainer.removeChild(obstacle));
        const powerUps = document.querySelectorAll('.power-up');
        powerUps.forEach(powerUp => gameContainer.removeChild(powerUp));
        startGame();
    }

    function startGame() {
        gameContainer.addEventListener('mousemove', movePlayer);
        gameInterval = setInterval(createObstacle, 2000);
        powerUpInterval = setInterval(createPowerUp, 10000);
    }

    window.restartGame = restartGame;
    startGame();
});
