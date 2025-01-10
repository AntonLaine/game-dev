const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const player = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    size: 20,
    color: 'blue',
    speed: 5,
    direction: 'up',
    health: 100,
    lastHitTime: 0
};

const resources = {
    wood: 30,
    stone: 30
};

const buildings = [];
const enemies = [];
const bullets = [];
const trees = [];
const rocks = [];

const zombieTypes = {
    normal: { color: 'red', speed: 2, health: 20 },
    speed: { color: 'blue', speed: 4, health: 20 },
    giant: { color: 'darkred', speed: 1, health: 100 },
    mini: { color: 'purple', speed: 2, health: 10 }
};

const resourceGenerators = [];
const attackRobots = [];

let preparationTime = 30000; // 30 seconds in milliseconds
let gameStartTime = Date.now();

function drawPlayer() {
    if (player.health <= 0) {
        alert("Game Over!");
        document.location.reload();
    }
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.size, player.size);
    ctx.fillStyle = 'black';
    ctx.font = '12px Arial';
    ctx.fillText(`HP: ${player.health}`, player.x, player.y - 10);
}

function drawResources() {
    ctx.fillStyle = 'black';
    ctx.font = '20px Arial';
    ctx.fillText(`Wood: ${resources.wood}`, 10, 20);
    ctx.fillText(`Stone: ${resources.stone}`, 10, 40);
}

function drawBuildings() {
    buildings.forEach(building => {
        if (building.type === 'wall') {
            ctx.fillStyle = building.color;
            ctx.fillRect(building.x, building.y, building.size, building.size);
            ctx.fillStyle = 'black';
            ctx.font = '12px Arial';
            ctx.fillText(`HP: ${building.health}`, building.x, building.y - 10);
        } else if (building.type === 'sentry') {
            ctx.fillStyle = building.color;
            ctx.beginPath();
            ctx.arc(building.x + building.size / 2, building.y + building.size / 2, building.size / 2, 0, 2 * Math.PI);
            ctx.fill();
        } else if (building.type === 'robotSpawner') {
            ctx.fillStyle = 'yellow';
            ctx.fillRect(building.x, building.y, building.size, building.size);
        }
    });
}

function drawEnemies() {
    enemies.forEach(enemy => {
        ctx.fillStyle = enemy.color;
        ctx.fillRect(enemy.x, enemy.y, enemy.size, enemy.size);
    });
}

function drawBullets() {
    bullets.forEach(bullet => {
        ctx.fillStyle = bullet.color;
        ctx.fillRect(bullet.x, bullet.y, bullet.size, bullet.size);
    });
}

function drawTrees() {
    trees.forEach(tree => {
        ctx.fillStyle = 'green';
        ctx.fillRect(tree.x, tree.y, tree.size, tree.size);
    });
}

function drawRocks() {
    rocks.forEach(rock => {
        ctx.fillStyle = 'gray';
        ctx.fillRect(rock.x, rock.y, rock.size, rock.size);
    });
}

function drawResourceGenerators() {
    resourceGenerators.forEach(generator => {
        ctx.fillStyle = 'orange';
        ctx.fillRect(generator.x, generator.y, generator.size, generator.size);
    });
}

function drawAttackRobots() {
    attackRobots.forEach(robot => {
        ctx.fillStyle = 'blue';
        ctx.fillRect(robot.x, robot.y, robot.size, robot.size);
    });
}

function spawnEnemy() {
    if (Date.now() - gameStartTime < preparationTime) return; // Don't spawn enemies during preparation time
    const rand = Math.random();
    let type;
    if (rand < 0.5) {
        type = 'normal';
    } else if (rand < 0.9) {
        type = Math.random() < 0.5 ? 'speed' : 'mini';
    } else {
        type = 'giant';
    }
    const zombie = zombieTypes[type];
    enemies.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: 20,
        color: zombie.color,
        speed: zombie.speed,
        health: zombie.health,
        lastAttackTime: 0
    });
}

function spawnTree() {
    trees.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: 20
    });
}

function spawnRock() {
    rocks.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: 20
    });
}

function shootBullet(x, y, direction) {
    bullets.push({
        x: x,
        y: y,
        size: 5,
        color: 'black',
        speed: 10,
        direction: direction,
        fromSentry: false
    });
}

function shootSentryBullet(x, y, direction) {
    bullets.push({
        x: x,
        y: y,
        size: 5,
        color: 'black',
        speed: 10,
        direction: direction,
        fromSentry: true
    });
}

function handleInput() {
    document.addEventListener('keydown', (event) => {
        switch (event.key) {
            case 'ArrowUp':
                player.y = Math.max(0, player.y - player.speed);
                player.direction = 'up';
                break;
            case 'ArrowDown':
                player.y = Math.min(canvas.height - player.size, player.y + player.speed);
                player.direction = 'down';
                break;
            case 'ArrowLeft':
                player.x = Math.max(0, player.x - player.speed);
                player.direction = 'left';
                break;
            case 'ArrowRight':
                player.x = Math.min(canvas.width - player.size, player.x + player.speed);
                player.direction = 'right';
                break;
            case 'b': // Build a wall
                if (resources.wood >= 1) {
                    resources.wood -= 1;
                    buildings.push({
                        x: player.x,
                        y: player.y,
                        size: 30,
                        color: 'brown',
                        type: 'wall',
                        health: 100
                    });
                }
                break;
            case 's': // Build a sentry
                if (resources.wood >= 10 && resources.stone >= 30) {
                    resources.wood -= 10;
                    resources.stone -= 30;
                    buildings.push({
                        x: player.x,
                        y: player.y,
                        size: 30,
                        color: 'gray',
                        type: 'sentry'
                    });
                }
                break;
            case ' ': // Shoot bullet
                let direction;
                switch (player.direction) {
                    case 'up':
                        direction = Math.PI * 1.5;
                        break;
                    case 'down':
                        direction = Math.PI / 2;
                        break;
                    case 'left':
                        direction = Math.PI;
                        break;
                    case 'right':
                        direction = 0;
                        break;
                }
                shootBullet(player.x + player.size / 2, player.y + player.size / 2, direction);
                break;
            case 'e': // Gather resources
                trees.forEach((tree, index) => {
                    if (player.x < tree.x + tree.size &&
                        player.x + player.size > tree.x &&
                        player.y < tree.y + tree.size &&
                        player.y + player.size > tree.y) {
                        resources.wood += 10;
                        trees.splice(index, 1);
                    }
                });
                rocks.forEach((rock, index) => {
                    if (player.x < rock.x + rock.size &&
                        player.x + player.size > rock.x &&
                        player.y < rock.y + rock.size &&
                        player.y + player.size > rock.y) {
                        resources.stone += 10;
                        rocks.splice(index, 1);
                    }
                });
                break;
            case 'r': // Build a resource generator
                if (resources.wood >= 30 && resources.stone >= 30) {
                    resources.wood -= 30;
                    resources.stone -= 30;
                    resourceGenerators.push({
                        x: player.x,
                        y: player.y,
                        size: 20,
                        color: 'orange'
                    });
                }
                break;
            case 'g': // Build a robot spawner
                if (resources.wood >= 30 && resources.stone >= 30) {
                    resources.wood -= 30;
                    resources.stone -= 30;
                    buildings.push({
                        x: player.x,
                        y: player.y,
                        size: 30,
                        color: 'yellow',
                        type: 'robotSpawner'
                    });
                }
                break;
        }
    });
}

function init() {
    // Initialize game state
    console.log('Game initialized');
    handleInput();
    for (let i = 0; i < 10; i++) {
        spawnTree();
        spawnRock();
    }
    buildings.forEach(building => {
        if (building.type === 'sentry') {
            building.lastShotTime = 0;
        }
    });
}

function update() {
    const currentTime = Date.now();

    // Update game state

    // Move enemies and check for collisions with walls
    enemies.forEach((enemy, enemyIndex) => {
        let canMoveX = true;
        let canMoveY = true;

        buildings.forEach((building, buildingIndex) => {
            if (building.type === 'wall' || building.type === 'sentry') {
                if (enemy.x < building.x + building.size &&
                    enemy.x + enemy.size > building.x &&
                    enemy.y < building.y + building.size &&
                    enemy.y + enemy.size > building.y) {
                    canMoveX = false;
                    canMoveY = false;
                    if (currentTime - enemy.lastAttackTime > 1000) {
                        building.health -= 10;
                        enemy.lastAttackTime = currentTime;
                        if (building.health <= 0) {
                            buildings.splice(buildingIndex, 1);
                        }
                    }
                }
            }
        });

        if (canMoveX) {
            if (enemy.x < player.x) enemy.x += enemy.speed;
            if (enemy.x > player.x) enemy.x -= enemy.speed;
        }
        if (canMoveY) {
            if (enemy.y < player.y) enemy.y += enemy.speed;
            if (enemy.y > player.y) enemy.y -= enemy.speed;
        }

        // Check for collisions with player
        if (enemy.x < player.x + player.size &&
            enemy.x + enemy.size > player.x &&
            enemy.y < player.y + player.size &&
            enemy.y + player.size > player.y) {
            if (currentTime - player.lastHitTime > 3000) {
                player.health -= 10;
                player.lastHitTime = currentTime;
            }
        }
    });

    // Check for bullet collisions with walls
    bullets.forEach((bullet, bulletIndex) => {
        if (!bullet.fromSentry) {
            buildings.forEach((building, buildingIndex) => {
                if (building.type === 'wall' &&
                    bullet.x < building.x + building.size &&
                    bullet.x + bullet.size > building.x &&
                    bullet.y < building.y + building.size &&
                    bullet.y + bullet.size > building.y) {
                    building.health -= 10;
                    bullets.splice(bulletIndex, 1);
                    if (building.health <= 0) {
                        buildings.splice(buildingIndex, 1);
                    }
                }
            });
        }
    });

    // Sentry shooting
    buildings.forEach(building => {
        if (building.type === 'sentry') {
            if (!building.lastShotTime || currentTime - building.lastShotTime > 1000) {
                let nearestEnemy = null;
                let nearestDistance = Infinity;
                enemies.forEach(enemy => {
                    const distance = Math.hypot(enemy.x - building.x, enemy.y - building.y);
                    if (distance < nearestDistance) {
                        nearestDistance = distance;
                        nearestEnemy = enemy;
                    }
                });
                if (nearestEnemy) {
                    const direction = Math.atan2(nearestEnemy.y - building.y, nearestEnemy.x - building.x);
                    shootSentryBullet(building.x + building.size / 2, building.y + building.size / 2, direction);
                    building.lastShotTime = currentTime;
                }
            }
        }
    });

    // Move bullets
    bullets.forEach((bullet, index) => {
        bullet.x += bullet.speed * Math.cos(bullet.direction);
        bullet.y += bullet.speed * Math.sin(bullet.direction);
        // Remove bullets that go off screen
        if (bullet.x < 0 || bullet.x > canvas.width || bullet.y < 0 || bullet.y > canvas.height) {
            bullets.splice(index, 1);
        }
    });

    // Check for bullet collisions with enemies
    bullets.forEach((bullet, bulletIndex) => {
        enemies.forEach((enemy, enemyIndex) => {
            if (bullet.x < enemy.x + enemy.size &&
                bullet.x + bullet.size > enemy.x &&
                bullet.y < enemy.y + enemy.size &&
                bullet.y + bullet.size > enemy.y) {
                // Remove enemy and bullet on collision
                enemy.health -= 10;
                bullets.splice(bulletIndex, 1);
                if (enemy.health <= 0) {
                    enemies.splice(enemyIndex, 1);
                }
            }
        });
    });

    // Spawn enemies periodically
    if (Math.random() < 0.01 && currentTime - gameStartTime > preparationTime) {
        spawnEnemy();
    }

    // Resource generators gathering resources
    resourceGenerators.forEach(generator => {
        if (Math.random() < 0.01) {
            resources.wood += 1;
            resources.stone += 1;
        }
    });

    // Robot spawners spawning attack robots
    buildings.forEach(building => {
        if (building.type === 'robotSpawner' && (!building.lastSpawnTime || currentTime - building.lastSpawnTime > 5000)) {
            attackRobots.push({
                x: building.x,
                y: building.y,
                size: 20,
                color: 'blue',
                speed: 3,
                target: null
            });
            building.lastSpawnTime = currentTime;
        }
    });

    // Move attack robots towards nearest enemy
    attackRobots.forEach((robot, robotIndex) => {
        if (!robot.target || enemies.indexOf(robot.target) === -1) {
            let nearestEnemy = null;
            let nearestDistance = Infinity;
            enemies.forEach(enemy => {
                const distance = Math.hypot(enemy.x - robot.x, enemy.y - robot.y);
                if (distance < nearestDistance) {
                    nearestDistance = distance;
                    nearestEnemy = enemy;
                }
            });
            robot.target = nearestEnemy;
        }
        if (robot.target) {
            if (robot.x < robot.target.x) robot.x += robot.speed;
            if (robot.x > robot.target.x) robot.x -= robot.speed;
            if (robot.y < robot.target.y) robot.y += robot.speed;
            if (robot.y > robot.target.y) robot.y -= robot.speed;

            // Check for collisions with target
            if (robot.x < robot.target.x + robot.target.size &&
                robot.x + robot.size > robot.target.x &&
                robot.y < robot.target.y + robot.target.size &&
                robot.y + robot.size > robot.target.y) {
                robot.target.health -= 10;
                if (robot.target.health <= 0) {
                    enemies.splice(enemies.indexOf(robot.target), 1);
                }
                attackRobots.splice(robotIndex, 1); // Remove robot after attack
            }
        }
    });
}

function drawInstructions() {
    ctx.fillStyle = 'black';
    ctx.font = '16px Arial';
    ctx.fillText('Press "B" to build a wall at the player\'s location.', 10, canvas.height - 90);
    ctx.fillText('Press "S" to build a sentry at the player\'s location.', 10, canvas.height - 70);
    ctx.fillText('Press "R" to build a resource generator at the player\'s location.', 10, canvas.height - 50);
    ctx.fillText('Press "G" to build a robot spawner at the player\'s location.', 10, canvas.height - 30);
    ctx.fillText('Press "Space" to shoot.', 10, canvas.height - 110);
    ctx.fillText('Press "E" to gather resources.', 10, canvas.height - 10);
    const remainingTime = Math.max(0, Math.ceil((preparationTime - (Date.now() - gameStartTime)) / 1000));
    ctx.fillText(`Preparation Time: ${remainingTime} seconds`, 10, canvas.height - 130);
}

function draw() {
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Draw game elements
    drawPlayer();
    drawResources();
    drawBuildings();
    drawEnemies();
    drawBullets();
    drawTrees();
    drawRocks();
    drawResourceGenerators();
    drawAttackRobots();
    drawInstructions();
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

init();
gameLoop();
