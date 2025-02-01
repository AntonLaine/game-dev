// Walking and jumping mechanics with gravity
let speed = 0.2;
const gravity = 0.02;
let isJumping = false;
let jumpSpeed = 0.4;
let velocityY = 0;
let keys = {};

document.addEventListener('keydown', (event) => {
    keys[event.key] = true;
    sendPlayerData();
});

document.addEventListener('keyup', (event) => {
    keys[event.key] = false;
    sendPlayerData();
});

function updateMovement() {
    // Normal controls
    if (keys['w']) {
        cube.position.x += Math.sin(cube.rotation.y) * speed;
        cube.position.z += Math.cos(cube.rotation.y) * speed;
    }
    if (keys['s']) {
        cube.position.x -= Math.sin(cube.rotation.y) * speed;
        cube.position.z -= Math.cos(cube.rotation.y) * speed;
    }
    if (keys['a']) {
        cube.position.x += Math.cos(cube.rotation.y) * speed;
        cube.position.z -= Math.sin(cube.rotation.y) * speed;
    }
    if (keys['d']) {
        cube.position.x -= Math.cos(cube.rotation.y) * speed;
        cube.position.z += Math.sin(cube.rotation.y) * speed;
    }
    if (keys['q']) {
        cube.rotation.y += 0.1;
    }
    if (keys['e']) {
        cube.rotation.y -= 0.1;
    }
    if (keys[' '] && !isJumping) {
        isJumping = true;
        velocityY = jumpSpeed;
    }
    if (flying) {
        if (keys[' ']) {
            cube.position.y += speed;
        }
        if (keys['Shift']) {
            cube.position.y -= speed;
        }
    }
    checkCollisionWithBarriers(cube);
    sendPlayerData();
}
