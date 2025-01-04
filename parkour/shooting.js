document.addEventListener('DOMContentLoaded', (event) => {
    const bullets = [];
    const bulletSpeed = 10;
    let mouseX = 0;
    let mouseY = 0;

    document.addEventListener('keydown', (e) => {
        if (e.code === 'KeyE') {
            shootBullet();
        }
    });

    document.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        mouseX = e.clientX - rect.left;
        mouseY = e.clientY - rect.top;
    });

    function shootBullet() {
        const angle = Math.atan2(mouseY - (player.y + player.height / 2), mouseX - (player.x + player.width / 2));
        const bullet = {
            x: player.x + player.width / 2,
            y: player.y + player.height / 2,
            width: 5,
            height: 5,
            color: 'black',
            dx: bulletSpeed * Math.cos(angle),
            dy: bulletSpeed * Math.sin(angle)
        };
        bullets.push(bullet);
    }

    function updateBullets() {
        for (let i = bullets.length - 1; i >= 0; i--) {
            bullets[i].x += bullets[i].dx;
            bullets[i].y += bullets[i].dy;
            if (bullets[i].x + bullets[i].width < 0 || bullets[i].x > canvas.width ||
                bullets[i].y + bullets[i].height < 0 || bullets[i].y > canvas.height) {
                bullets.splice(i, 1);
            }
        }
    }

    function drawBullets(ctx) {
        for (let bullet of bullets) {
            ctx.fillStyle = bullet.color;
            ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
        }
    }

    function checkBulletCollisions() {
        for (let i = bullets.length - 1; i >= 0; i--) {
            if (bullets[i].x < enemy.x + enemy.width &&
                bullets[i].x + bullets[i].width > enemy.x &&
                bullets[i].y < enemy.y + enemy.height &&
                bullets[i].y + bullets[i].height > enemy.y) {
                bullets.splice(i, 1);
                // Handle enemy hit logic here
                console.log('Enemy hit!');
            }
        }
    }

    function gameLoop() {
        if (!gameRunning) return;

        updateBullets();
        checkBulletCollisions();
        drawBullets(ctx);

        requestAnimationFrame(gameLoop);
    }

    gameLoop();
});
