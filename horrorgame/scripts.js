document.addEventListener('DOMContentLoaded', (event) => {
    const player = document.getElementById('player');
    const enemy = document.getElementById('enemy');
    const walls = document.querySelectorAll('.wall');
    const gameOverScreen = document.getElementById('game-over');
    const scoreDisplay = document.getElementById('score');
    let playerPosition = { top: window.innerHeight / 2 - 25, left: window.innerWidth / 2 - 25 };
    let score = 0;
    let gameInterval;

    document.addEventListener('keydown', (e) => {
        let newPosition = { ...playerPosition };
        switch (e.key) {
            case 'ArrowUp':
                newPosition.top -= 10;
                break;
            case 'ArrowDown':
                newPosition.top += 10;
                break;
            case 'ArrowLeft':
                newPosition.left -= 10;
                break;
            case 'ArrowRight':
                newPosition.left += 10;
                break;
        }
        if (!checkWallCollision(newPosition)) {
            playerPosition = newPosition;
            updatePlayerPosition();
            checkCollision();
        }
    });

    function updatePlayerPosition() {
        player.style.top = playerPosition.top + 'px';
        player.style.left = playerPosition.left + 'px';
    }

    function moveEnemy() {
        const enemyPosition = {
            top: parseInt(enemy.style.top) || 0,
            left: parseInt(enemy.style.left) || 0
        };

        if (Math.random() > 0.5) {
            if (enemyPosition.top < playerPosition.top) {
                enemyPosition.top += 5;
            } else {
                enemyPosition.top -= 5;
            }
        } else {
            if (enemyPosition.left < playerPosition.left) {
                enemyPosition.left += 5;
            } else {
                enemyPosition.left -= 5;
            }
        }

        enemy.style.top = enemyPosition.top + 'px';
        enemy.style.left = enemyPosition.left + 'px';
    }

    function checkCollision() {
        const playerRect = player.getBoundingClientRect();
        const enemyRect = enemy.getBoundingClientRect();

        if (
            playerRect.top < enemyRect.bottom &&
            playerRect.bottom > enemyRect.top &&
            playerRect.left < enemyRect.right &&
            playerRect.right > enemyRect.left
        ) {
            endGame();
        }
    }

    function checkWallCollision(position) {
        const playerRect = {
            top: position.top,
            left: position.left,
            bottom: position.top + 50,
            right: position.left + 50
        };

        for (let wall of walls) {
            const wallRect = wall.getBoundingClientRect();
            if (
                playerRect.top < wallRect.bottom &&
                playerRect.bottom > wallRect.top &&
                playerRect.left < wallRect.right &&
                playerRect.right > wallRect.left
            ) {
                return true;
            }
        }
        return false;
    }

    function resetGame() {
        playerPosition = { top: window.innerHeight / 2 - 25, left: window.innerWidth / 2 - 25 };
        updatePlayerPosition();
        enemy.style.top = '0px';
        enemy.style.left = '0px';
        score = 0;
        scoreDisplay.textContent = `Score: ${score}`;
        gameOverScreen.style.display = 'none';
        gameInterval = setInterval(() => {
            moveEnemy();
            score++;
            scoreDisplay.textContent = `Score: ${score}`;
        }, 100);
    }

    function endGame() {
        clearInterval(gameInterval);
        gameOverScreen.style.display = 'block';
    }

    updatePlayerPosition();
    resetGame();
});
