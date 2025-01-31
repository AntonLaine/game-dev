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

// Add parkour platforms
const parkourPlatforms = [];
const platformPositions = [
    { x: -8, y: 1, z: 0 },
    { x: -6, y: 2, z: 0 },
    { x: -4, y: 3, z: 0 },
    { x: -2, y: 4, z: 0 },
    { x: 0, y: 5, z: 0 },
    { x: 2, y: 4, z: 0 },
    { x: 4, y: 3, z: 0 },
    { x: 6, y: 2, z: 0 },
    { x: 8, y: 1, z: 0 },
    { x: 10, y: 0, z: 0 },
    { x: 12, y: 1, z: 0 },
    { x: 14, y: 2, z: 0 },
    { x: 16, y: 3, z: 0 }
];
platformPositions.forEach(pos => {
    const platformGeometry = new THREE.BoxGeometry(2, 0.1, 2);
    const platformMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff });
    const platform = new THREE.Mesh(platformGeometry, platformMaterial);
    platform.position.set(pos.x, pos.y, pos.z);
    scene.add(platform);
    parkourPlatforms.push(platform);
});

// Add collectible coins
const collectibleItems = [];
const itemPositions = [
    { x: -6, y: 2.5, z: 0 },
    { x: 0, y: 5.5, z: 0 },
    { x: 6, y: 2.5, z: 0 },
    { x: 12, y: 1.5, z: 0 },
    { x: 16, y: 3.5, z: 0 }
];
itemPositions.forEach(pos => {
    const itemGeometry = new THREE.SphereGeometry(0.5, 32, 32);
    const itemMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    const collectibleItem = new THREE.Mesh(itemGeometry, itemMaterial);
    collectibleItem.position.set(pos.x, pos.y, pos.z);
    scene.add(collectibleItem);
    collectibleItems.push(collectibleItem);
});

// Add a shop
const shopGeometry = new THREE.BoxGeometry(3, 3, 3);
const shopMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const shop = new THREE.Mesh(shopGeometry, shopMaterial);
shop.position.set(20, 1.5, 0);
scene.add(shop);

// Create shop GUI
const shopGUI = document.createElement('div');
shopGUI.style.position = 'absolute';
shopGUI.style.top = '50%';
shopGUI.style.left = '50%';
shopGUI.style.transform = 'translate(-50%, -50%)';
shopGUI.style.padding = '20px';
shopGUI.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
shopGUI.style.color = 'white';
shopGUI.style.display = 'none';
shopGUI.innerHTML = `
    <h2>Shop</h2>
    <p>Coins collected: <span id="coinsCollected">0</span></p>
    <button onclick="buyItem('Speed Boost')">Buy Speed Boost (5 coins)</button>
    <button onclick="buyItem('Jump Boost')">Buy Jump Boost (5 coins)</button>
    <button onclick="closeShop()">Close</button>
`;
document.body.appendChild(shopGUI);

function openShop() {
    document.getElementById('coinsCollected').innerText = coinsCollected;
    shopGUI.style.display = 'block';
}

function closeShop() {
    shopGUI.style.display = 'none';
}

function buyItem(item) {
    if (coinsCollected >= 5) {
        coinsCollected -= 5;
        if (item === 'Speed Boost') {
            speed += 0.1;
        } else if (item === 'Jump Boost') {
            jumpSpeed += 0.1;
        }
        document.getElementById('coinsCollected').innerText = coinsCollected;
        console.log(`Bought ${item}`);
    } else {
        console.log('Not enough coins');
    }
}

// Position the camera to follow the cube
camera.position.set(0, 2, 5);
camera.lookAt(cube.position);

// Walking and jumping mechanics with gravity
const speed = 0.2;
const gravity = 0.02;
let isJumping = false;
let jumpSpeed = 0.4;
let velocityY = 0;
let keys = {};
let coinsCollected = 0;

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
    }
}

// Animation loop with gravity and collision detection
function animate() {
    requestAnimationFrame(animate);

    updateMovement();

    // Apply gravity
    if (isJumping) {
        velocityY -= gravity;
        cube.position.y += velocityY;
    }

    // Check for collision with floor or parkour platforms
    let isOnPlatform = false;
    if (cube.position.y <= 0) {
        cube.position.y = 0;
        velocityY = 0;
        isJumping = false;
        isOnPlatform = true;
    } else {
        parkourPlatforms.forEach(platform => {
            if (cube.position.y <= platform.position.y + 0.5 &&
                cube.position.y >= platform.position.y - 0.5 &&
                cube.position.x >= platform.position.x - 1 &&
                cube.position.x <= platform.position.x + 1 &&
                cube.position.z >= platform.position.z - 1 &&
                cube.position.z <= platform.position.z + 1) {
                if (velocityY < 0) {
                    cube.position.y = platform.position.y + 0.5;
                    velocityY = 0;
                    isJumping = false;
                    isOnPlatform = true;
                } else if (velocityY > 0) {
                    cube.position.y = platform.position.y - 0.5;
                    velocityY = 0;
                }
            }
        });
    }

    // If not on any platform, apply gravity
    if (!isOnPlatform) {
        velocityY -= gravity;
        cube.position.y += velocityY;
    }

    // Check for collision with collectible items
    collectibleItems.forEach((item, index) => {
        if (cube.position.distanceTo(item.position) < 1) {
            scene.remove(item);
            collectibleItems.splice(index, 1);
            coinsCollected++;
            console.log(`Coins collected: ${coinsCollected}`);
        }
    });

    // Check for collision with shop
    if (cube.position.distanceTo(shop.position) < 2) {
        openShop();
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
