// File cleared for new game

// Initialize the scene
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Add a red cube (player)
const geometry = new THREE.BoxGeometry();
const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

// Add a green floor
const floorGeometry = new THREE.BoxGeometry(50, 0.1, 50);
const floorMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.position.set(0, -0.5, 0);
scene.add(floor);

// Add parkour blocks
const parkourBlocks = [];
for (let i = 0; i < 10; i++) {
    const blockGeometry = new THREE.BoxGeometry(1, 1, 1);
    const blockMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff });
    const block = new THREE.Mesh(blockGeometry, blockMaterial);
    block.position.set(i * 2 - 10, Math.random() * 5, Math.random() * 5 - 2.5);
    scene.add(block);
    parkourBlocks.push(block);
}

// Position the camera to follow the cube
camera.position.set(0, 2, 5);
camera.lookAt(cube.position);

// Walking and jumping mechanics with gravity
const speed = 0.2;
const gravity = 0.02;
let isJumping = false;
let jumpSpeed = 0.3;
let velocityY = 0;
let jumpTime = 0;
let keys = {};

document.addEventListener('keydown', (event) => {
    keys[event.key] = true;
});

document.addEventListener('keyup', (event) => {
    keys[event.key] = false;
});

function updateMovement() {
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
        jumpTime = 30; // 0.5 second at 60 FPS
    }
}

// Place a block at the cursor position
function placeBlockAtCursor() {
    const mouse = new THREE.Vector2(
        (event.clientX / window.innerWidth) * 2 - 1,
        -(event.clientY / window.innerHeight) * 2 + 1
    );
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children);
    if (intersects.length > 0) {
        const intersect = intersects[0];
        const blockGeometry = new THREE.BoxGeometry();
        const blockMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        const block = new THREE.Mesh(blockGeometry, blockMaterial);
        block.position.set(
            Math.round(intersect.point.x),
            Math.round(intersect.point.y),
            Math.round(intersect.point.z)
        );
        scene.add(block);
    }
}

// Delete a block at the cursor position
function deleteBlockAtCursor() {
    const mouse = new THREE.Vector2(
        (event.clientX / window.innerWidth) * 2 - 1,
        -(event.clientY / window.innerHeight) * 2 + 1
    );
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children);
    if (intersects.length > 0) {
        const intersect = intersects[0];
        if (intersect.object !== cube && intersect.object !== floor) {
            scene.remove(intersect.object);
        }
    }
}

// Animation loop with gravity and collision detection
function animate() {
    requestAnimationFrame(animate);

    updateMovement();

    // Apply gravity
    if (isJumping) {
        if (jumpTime > 0) {
            cube.position.y += velocityY;
            jumpTime--;
        } else {
            velocityY -= gravity;
            cube.position.y += velocityY;
        }
    }

    // Check for collision with floor or parkour blocks
    let isOnBlock = false;
    if (cube.position.y <= 0) {
        cube.position.y = 0;
        velocityY = 0;
        isJumping = false;
        isOnBlock = true;
    } else {
        parkourBlocks.forEach(block => {
            if (cube.position.y <= block.position.y + 0.5 &&
                cube.position.y >= block.position.y - 0.5 &&
                cube.position.x >= block.position.x - 0.5 &&
                cube.position.x <= block.position.x + 0.5 &&
                cube.position.z >= block.position.z - 0.5 &&
                cube.position.z <= block.position.z + 0.5) {
                if (velocityY < 0) {
                    cube.position.y = block.position.y + 1;
                    velocityY = 0;
                    isJumping = false;
                    isOnBlock = true;
                } else if (velocityY > 0) {
                    cube.position.y = block.position.y - 1;
                    velocityY = 0;
                }
            }
        });
    }

    // If not on any block, apply gravity
    if (!isOnBlock) {
        velocityY -= gravity;
        cube.position.y += velocityY;
    }

    // Update camera position
    camera.position.set(
        cube.position.x - Math.sin(cube.rotation.y) * 5,
        cube.position.y + 2,
        cube.position.z - Math.cos(cube.rotation.y) * 5
    );
    camera.lookAt(cube.position);

    renderer.render(scene, camera);
}

animate();
