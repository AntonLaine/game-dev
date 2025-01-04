document.addEventListener('DOMContentLoaded', (event) => {
    const container = document.querySelector('.container');
    const startButton = document.createElement('button');
    startButton.id = 'startButton';
    startButton.textContent = 'Start Game';
    container.appendChild(startButton);

    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    container.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    let gameRunning = false;
    let player, levels, currentLevel, canDoubleJump, goal, player2, canDoubleJump2;
    let player1ReachedGoal = false;
    let player2ReachedGoal = false;

    startButton.addEventListener('click', () => {
        startButton.style.display = 'none';
        gameRunning = true;
        initGame();
        gameLoop();
    });

    function initGame() {
        player = {
            x: 50,
            y: 500,
            width: 50,
            height: 50,
            color: 'red',
            dy: 0,
            dx: 0,
            speed: 5,
            gravity: 0.6,
            jumpPower: -12,
            grounded: false
        };

        player2 = {
            x: 100,
            y: 500,
            width: 50,
            height: 50,
            color: 'blue',
            dy: 0,
            dx: 0,
            speed: 5,
            gravity: 0.6,
            jumpPower: -12,
            grounded: false
        };

        levels = [
            {
                platforms: [
                    { x: 0, y: 550, width: 800, height: 50, color: 'green' },
                    { x: 200, y: 400, width: 100, height: 20, color: 'green' },
                    { x: 400, y: 300, width: 100, height: 20, color: 'green' }
                ],
                goal: { x: 700, y: 250, width: 50, height: 50, color: 'yellow' }
            },
            {
                platforms: [
                    { x: 0, y: 550, width: 800, height: 50, color: 'green' },
                    { x: 300, y: 450, width: 100, height: 20, color: 'green' },
                    { x: 500, y: 350, width: 100, height: 20, color: 'green' }
                ],
                goal: { x: 700, y: 300, width: 50, height: 50, color: 'yellow' }
            },
            // Add more levels with different configurations
            {
                platforms: [
                    { x: 0, y: 550, width: 800, height: 50, color: 'green' },
                    { x: 150, y: 450, width: 100, height: 20, color: 'green' },
                    { x: 350, y: 350, width: 100, height: 20, color: 'green' },
                    { x: 550, y: 250, width: 100, height: 20, color: 'green' }
                ],
                goal: { x: 700, y: 200, width: 50, height: 50, color: 'yellow' }
            },
            {
                platforms: [
                    { x: 0, y: 550, width: 800, height: 50, color: 'green' },
                    { x: 100, y: 500, width: 100, height: 20, color: 'green' },
                    { x: 300, y: 400, width: 100, height: 20, color: 'green' },
                    { x: 500, y: 300, width: 100, height: 20, color: 'green' }
                ],
                goal: { x: 700, y: 250, width: 50, height: 50, color: 'yellow' }
            },
            {
                platforms: [
                    { x: 0, y: 550, width: 800, height: 50, color: 'green' },
                    { x: 250, y: 450, width: 100, height: 20, color: 'green' },
                    { x: 450, y: 350, width: 100, height: 20, color: 'green' },
                    { x: 650, y: 250, width: 100, height: 20, color: 'green' }
                ],
                goal: { x: 700, y: 200, width: 50, height: 50, color: 'yellow' }
            },
            {
                platforms: [
                    { x: 0, y: 550, width: 800, height: 50, color: 'green' },
                    { x: 200, y: 500, width: 100, height: 20, color: 'green' },
                    { x: 400, y: 400, width: 100, height: 20, color: 'green' },
                    { x: 600, y: 300, width: 100, height: 20, color: 'green' }
                ],
                goal: { x: 700, y: 250, width: 50, height: 50, color: 'yellow' }
            },
            {
                platforms: [
                    { x: 0, y: 550, width: 800, height: 50, color: 'green' },
                    { x: 150, y: 500, width: 100, height: 20, color: 'green' },
                    { x: 350, y: 400, width: 100, height: 20, color: 'green' },
                    { x: 550, y: 300, width: 100, height: 20, color: 'green' }
                ],
                goal: { x: 700, y: 200, width: 50, height: 50, color: 'yellow' }
            },
            {
                platforms: [
                    { x: 0, y: 550, width: 800, height: 50, color: 'green' },
                    { x: 100, y: 500, width: 100, height: 20, color: 'green' },
                    { x: 300, y: 400, width: 100, height: 20, color: 'green' },
                    { x: 500, y: 300, width: 100, height: 20, color: 'green' },
                    { x: 700, y: 200, width: 100, height: 20, color: 'green' }
                ],
                goal: { x: 700, y: 150, width: 50, height: 50, color: 'yellow' }
            },
            {
                platforms: [
                    { x: 0, y: 550, width: 800, height: 50, color: 'green' },
                    { x: 250, y: 500, width: 100, height: 20, color: 'green' },
                    { x: 450, y: 400, width: 100, height: 20, color: 'green' },
                    { x: 650, y: 300, width: 100, height: 20, color: 'green' }
                ],
                goal: { x: 700, y: 200, width: 50, height: 50, color: 'yellow' }
            },
            {
                platforms: [
                    { x: 0, y: 550, width: 800, height: 50, color: 'green' },
                    { x: 200, y: 500, width: 100, height: 20, color: 'green' },
                    { x: 400, y: 400, width: 100, height: 20, color: 'green' },
                    { x: 600, y: 300, width: 100, height: 20, color: 'green' },
                    { x: 800, y: 200, width: 100, height: 20, color: 'green' }
                ],
                goal: { x: 700, y: 150, width: 50, height: 50, color: 'yellow' }
            },
            {
                platforms: [
                    { x: 0, y: 550, width: 800, height: 50, color: 'green' },
                    { x: 150, y: 500, width: 100, height: 20, color: 'green' },
                    { x: 350, y: 400, width: 100, height: 20, color: 'green' },
                    { x: 550, y: 300, width: 100, height: 20, color: 'green' },
                    { x: 750, y: 200, width: 100, height: 20, color: 'green' }
                ],
                goal: { x: 700, y: 150, width: 50, height: 50, color: 'yellow' }
            },
            {
                platforms: [
                    { x: 0, y: 550, width: 800, height: 50, color: 'green' },
                    { x: 100, y: 500, width: 100, height: 20, color: 'green' },
                    { x: 300, y: 450, width: 100, height: 20, color: 'green' },
                    { x: 500, y: 400, width: 100, height: 20, color: 'green' },
                    { x: 700, y: 350, width: 100, height: 20, color: 'green' },
                    { x: 500, y: 250, width: 100, height: 20, color: 'green' },
                    { x: 300, y: 150, width: 100, height: 20, color: 'green' }
                ],
                goal: { x: 700, y: 100, width: 50, height: 50, color: 'yellow' }
            },
            {
                platforms: [
                    { x: 0, y: 550, width: 800, height: 50, color: 'green' },
                    { x: 100, y: 500, width: 100, height: 20, color: 'green' },
                    { x: 300, y: 450, width: 100, height: 20, color: 'green' },
                    { x: 500, y: 400, width: 100, height: 20, color: 'green' },
                    { x: 700, y: 350, width: 100, height: 20, color: 'green' },
                    { x: 500, y: 300, width: 100, height: 20, color: 'green' },
                    { x: 300, y: 250, width: 100, height: 20, color: 'green' },
                    { x: 100, y: 200, width: 100, height: 20, color: 'green' }
                ],
                goal: { x: 700, y: 100, width: 50, height: 50, color: 'yellow' }
            }
        ];

        currentLevel = 0;
        canDoubleJump = false;
        canDoubleJump2 = false;
        player1ReachedGoal = false;
        player2ReachedGoal = false;

        document.addEventListener('keydown', (e) => {
            // Player 1 controls
            if (e.code === 'Space') {
                if (player.grounded) {
                    player.dy = player.jumpPower;
                    player.grounded = false;
                    canDoubleJump = true;
                } else if (canDoubleJump) {
                    player.dy = player.jumpPower;
                    canDoubleJump = false;
                }
            }
            if (e.code === 'KeyA') {
                player.dx = -player.speed;
            }
            if (e.code === 'KeyD') {
                player.dx = player.speed;
            }

            // Player 2 controls
            if (e.code === 'ArrowUp') {
                if (player2.grounded) {
                    player2.dy = player2.jumpPower;
                    player2.grounded = false;
                    canDoubleJump2 = true;
                } else if (canDoubleJump2) {
                    player2.dy = player2.jumpPower;
                    canDoubleJump2 = false;
                }
            }
            if (e.code === 'ArrowLeft') {
                player2.dx = -player2.speed;
            }
            if (e.code === 'ArrowRight') {
                player2.dx = player2.speed;
            }
        });

        document.addEventListener('keyup', (e) => {
            // Player 1 controls
            if (e.code === 'KeyA' || e.code === 'KeyD') {
                player.dx = 0;
            }

            // Player 2 controls
            if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') {
                player2.dx = 0;
            }
        });
    }

    function gameLoop() {
        if (!gameRunning) return;

        // Clear the canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Update player 1
        player.dy += player.gravity;
        player.y += player.dy;
        player.x += player.dx;

        // Update player 2
        player2.dy += player2.gravity;
        player2.y += player2.dy;
        player2.x += player2.dx;

        // Prevent player 1 from escaping the game borders
        if (player.x < 0) player.x = 0;
        if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;
        if (player.y < 0) player.y = 0;
        if (player.y + player.height > canvas.height) player.y = canvas.height - player.height;

        // Prevent player 2 from escaping the game borders
        if (player2.x < 0) player2.x = 0;
        if (player2.x + player2.width > canvas.width) player2.x = canvas.width - player2.width;
        if (player2.y < 0) player2.y = 0;
        if (player2.y + player2.height > canvas.height) player2.y = canvas.height - player2.height;

        // Check for collisions with platforms for player 1
        player.grounded = false;
        for (let platform of levels[currentLevel].platforms) {
            if (player.x < platform.x + platform.width &&
                player.x + player.width > platform.x &&
                player.y + player.height > platform.y &&
                player.y + player.height - player.dy <= platform.y) {
                player.y = platform.y - player.height;
                player.dy = 0;
                player.grounded = true;
                canDoubleJump = false;
            }
        }

        // Check for collisions with platforms for player 2
        player2.grounded = false;
        for (let platform of levels[currentLevel].platforms) {
            if (player2.x < platform.x + platform.width &&
                player2.x + player2.width > platform.x &&
                player2.y + player2.height > platform.y &&
                player2.y + player2.height - player2.dy <= platform.y) {
                player2.y = platform.y - player2.height;
                player2.dy = 0;
                player2.grounded = true;
                canDoubleJump2 = false;
            }
        }

        // Check if player 1 reached the goal
        goal = levels[currentLevel].goal;
        if (player.x < goal.x + goal.width &&
            player.x + player.width > goal.x &&
            player.y < goal.y + goal.height &&
            player.y + player.height > goal.y) {
            player1ReachedGoal = true;
        }

        // Check if player 2 reached the goal
        if (player2.x < goal.x + goal.width &&
            player2.x + player2.width > goal.x &&
            player2.y < goal.y + goal.height &&
            player2.y + player2.height > goal.y) {
            player2ReachedGoal = true;
        }

        // Check if both players reached the goal
        if (player1ReachedGoal && player2ReachedGoal) {
            currentLevel++;
            if (currentLevel >= levels.length) {
                gameRunning = false;
                alert('You win!');
                startButton.style.display = 'block';
            } else {
                player.x = 50;
                player.y = 500;
                player2.x = 100;
                player2.y = 500;
                player.gravity += 0.1; // Increase gravity to make it harder
                player.jumpPower -= 1; // Decrease jump power to make it harder
                player2.gravity += 0.1; // Increase gravity to make it harder
                player2.jumpPower -= 1; // Decrease jump power to make it harder
                player1ReachedGoal = false;
                player2ReachedGoal = false;
            }
        }

        // Draw player 1
        ctx.fillStyle = player.color;
        ctx.fillRect(player.x, player.y, player.width, player.height);

        // Draw player 2
        ctx.fillStyle = player2.color;
        ctx.fillRect(player2.x, player2.y, player2.width, player2.height);

        // Draw platforms
        for (let platform of levels[currentLevel].platforms) {
            ctx.fillStyle = platform.color;
            ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
        }

        // Draw goal
        ctx.fillStyle = goal.color;
        ctx.fillRect(goal.x, goal.y, goal.width, goal.height);

        requestAnimationFrame(gameLoop);
    }
});
