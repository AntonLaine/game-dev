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
    let player, levels, currentLevel, canDoubleJump, goal;

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
            gravity: 0.5,
            jumpPower: -10,
            grounded: false
        };

        levels = [
            {
                platforms: [
                    { x: 0, y: 550, width: 800, height: 50, color: 'green' },
                    { x: 200, y: 400, width: 100, height: 20, color: 'green' },
                    { x: 400, y: 300, width: 100, height: 20, color: 'green' }
                ],
                goal: { x: 700, y: 250, width: 50, height: 50, color: 'yellow' },
                lavaSpikes: []
            },
            {
                platforms: [
                    { x: 0, y: 550, width: 800, height: 50, color: 'green' },
                    { x: 300, y: 450, width: 100, height: 20, color: 'green' },
                    { x: 500, y: 350, width: 100, height: 20, color: 'green' }
                ],
                goal: { x: 700, y: 300, width: 50, height: 50, color: 'yellow' },
                lavaSpikes: []
            },
            // Add more levels with different configurations
            {
                platforms: [
                    { x: 0, y: 550, width: 800, height: 50, color: 'green' },
                    { x: 150, y: 450, width: 100, height: 20, color: 'green' },
                    { x: 350, y: 350, width: 100, height: 20, color: 'green' },
                    { x: 550, y: 250, width: 100, height: 20, color: 'green' }
                ],
                goal: { x: 700, y: 200, width: 50, height: 50, color: 'yellow' },
                lavaSpikes: []
            },
            {
                platforms: [
                    { x: 0, y: 550, width: 800, height: 50, color: 'green' },
                    { x: 100, y: 500, width: 100, height: 20, color: 'green' },
                    { x: 300, y: 400, width: 100, height: 20, color: 'green' },
                    { x: 500, y: 300, width: 100, height: 20, color: 'green' }
                ],
                goal: { x: 700, y: 250, width: 50, height: 50, color: 'yellow' },
                lavaSpikes: []
            },
            {
                platforms: [
                    { x: 0, y: 550, width: 800, height: 50, color: 'green' },
                    { x: 250, y: 450, width: 100, height: 20, color: 'green' },
                    { x: 450, y: 350, width: 100, height: 20, color: 'green' },
                    { x: 650, y: 250, width: 100, height: 20, color: 'green' }
                ],
                goal: { x: 700, y: 200, width: 50, height: 50, color: 'yellow' },
                lavaSpikes: []
            },
            {
                platforms: [
                    { x: 0, y: 550, width: 800, height: 50, color: 'green' },
                    { x: 200, y: 500, width: 100, height: 20, color: 'green' },
                    { x: 400, y: 400, width: 100, height: 20, color: 'green' },
                    { x: 600, y: 300, width: 100, height: 20, color: 'green' }
                ],
                goal: { x: 700, y: 250, width: 50, height: 50, color: 'yellow' },
                lavaSpikes: []
            },
            {
                platforms: [
                    { x: 0, y: 550, width: 800, height: 50, color: 'green' },
                    { x: 150, y: 500, width: 100, height: 20, color: 'green' },
                    { x: 350, y: 400, width: 100, height: 20, color: 'green' },
                    { x: 550, y: 300, width: 100, height: 20, color: 'green' }
                ],
                goal: { x: 700, y: 200, width: 50, height: 50, color: 'yellow' },
                lavaSpikes: []
            },
            {
                platforms: [
                    { x: 0, y: 550, width: 800, height: 50, color: 'green' },
                    { x: 100, y: 500, width: 100, height: 20, color: 'green' },
                    { x: 300, y: 400, width: 100, height: 20, color: 'green' },
                    { x: 500, y: 300, width: 100, height: 20, color: 'green' },
                    { x: 700, y: 200, width: 100, height: 20, color: 'green' }
                ],
                goal: { x: 700, y: 150, width: 50, height: 50, color: 'yellow' },
                lavaSpikes: []
            },
            {
                platforms: [
                    { x: 0, y: 550, width: 800, height: 50, color: 'green' },
                    { x: 250, y: 500, width: 100, height: 20, color: 'green' },
                    { x: 450, y: 400, width: 100, height: 20, color: 'green' },
                    { x: 650, y: 300, width: 100, height: 20, color: 'green' }
                ],
                goal: { x: 700, y: 200, width: 50, height: 50, color: 'yellow' },
                lavaSpikes: []
            },
            {
                platforms: [
                    { x: 0, y: 550, width: 800, height: 50, color: 'green' },
                    { x: 200, y: 500, width: 100, height: 20, color: 'green' },
                    { x: 400, y: 400, width: 100, height: 20, color: 'green' },
                    { x: 600, y: 300, width: 100, height: 20, color: 'green' },
                    { x: 800, y: 200, width: 100, height: 20, color: 'green' }
                ],
                goal: { x: 700, y: 150, width: 50, height: 50, color: 'yellow' },
                lavaSpikes: []
            },
            {
                platforms: [
                    { x: 0, y: 550, width: 800, height: 50, color: 'green' },
                    { x: 150, y: 500, width: 100, height: 20, color: 'green' },
                    { x: 350, y: 400, width: 100, height: 20, color: 'green' },
                    { x: 550, y: 300, width: 100, height: 20, color: 'green' },
                    { x: 750, y: 200, width: 100, height: 20, color: 'green' }
                ],
                goal: { x: 700, y: 150, width: 50, height: 50, color: 'yellow' },
                lavaSpikes: []
            }
        ];

        currentLevel = 0;
        canDoubleJump = false;

        document.addEventListener('keydown', (e) => {
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
        });

        document.addEventListener('keyup', (e) => {
            if (e.code === 'KeyA' || e.code === 'KeyD') {
                player.dx = 0;
            }
        });
    }

    function gameLoop() {
        if (!gameRunning) return;

        // Clear the canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Update player
        player.dy += player.gravity;
        player.y += player.dy;
        player.x += player.dx;

        // Prevent player from escaping the game borders
        if (player.x < 0) player.x = 0;
        if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;
        if (player.y < 0) player.y = 0;
        if (player.y + player.height > canvas.height) player.y = canvas.height - player.height;

        // Check for collisions with platforms
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

        // Check if player reached the goal
        goal = levels[currentLevel].goal;
        if (player.x < goal.x + goal.width &&
            player.x + player.width > goal.x &&
            player.y < goal.y + goal.height &&
            player.y + player.height > goal.y) {
            currentLevel++;
            if (currentLevel >= levels.length) {
                gameRunning = false;
                alert('You win!');
                startButton.style.display = 'block';
            } else {
                player.x = 50;
                player.y = 500;
                player.gravity += 0.1; // Increase gravity to make it harder
                player.jumpPower -= 1; // Decrease jump power to make it harder
            }
        }

        // Draw player
        ctx.fillStyle = player.color;
        ctx.fillRect(player.x, player.y, player.width, player.height);

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
