window.onload = function() {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');

    const width = canvas.width;
    const height = canvas.height;

    class Creature {
        constructor(x, y, size, color) {
            this.x = x;
            this.y = y;
            this.size = size;
            this.color = color;
        }

        draw() {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }

        move() {
            this.x += Math.random() * 4 - 2;
            this.y += Math.random() * 4 - 2;
        }

        isCollidingWith(other) {
            const dx = this.x - other.x;
            const dy = this.y - other.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            return distance < this.size + other.size;
        }

        mergeWith(other) {
            this.size += other.size * 0.5;
            other.size = 0;
        }
    }

    const creatures = [];
    for (let i = 0; i < 10; i++) {
        creatures.push(new Creature(Math.random() * width, Math.random() * height, 10, 'blue'));
    }

    function spawnCreature() {
        creatures.push(new Creature(Math.random() * width, Math.random() * height, 10, 'blue'));
    }

    setInterval(spawnCreature, 3000);

    function gameLoop() {
        ctx.clearRect(0, 0, width, height);
        creatures.forEach(creature => {
            creature.move();
            creature.draw();
        });

        for (let i = 0; i < creatures.length; i++) {
            for (let j = i + 1; j < creatures.length; j++) {
                if (creatures[i].isCollidingWith(creatures[j])) {
                    creatures[i].mergeWith(creatures[j]);
                }
            }
        }

        creatures = creatures.filter(creature => creature.size > 0);

        requestAnimationFrame(gameLoop);
    }

    gameLoop();
};
