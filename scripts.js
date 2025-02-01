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
const floorGeometry = new THREE.BoxGeometry(100, 0.1, 100);
const floorMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.position.set(0, -0.5, 0);
scene.add(floor);

// Add a town with a shop and a house
const shopGeometry = new THREE.BoxGeometry(3, 3, 3);
const shopMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
const shop = new THREE.Mesh(shopGeometry, shopMaterial);
shop.position.set(20, 1.5, 0);
scene.add(shop);

const houseGeometry = new THREE.BoxGeometry(10, 10, 10);
const houseMaterial = new THREE.MeshBasicMaterial({ color: 0x8B4513 });
const house = new THREE.Mesh(houseGeometry, houseMaterial);
house.position.set(30, 5, 0);
scene.add(house);

const doorGeometry = new THREE.BoxGeometry(2, 4, 0.1);
const doorMaterial = new THREE.MeshBasicMaterial({ color: 0x654321 });
const door = new THREE.Mesh(doorGeometry, doorMaterial);
door.position.set(30, 2, 5.05);
scene.add(door);

const houseFloorGeometry = new THREE.BoxGeometry(10, 0.1, 10);
const houseFloorMaterial = new THREE.MeshBasicMaterial({ color: 0x8B4513 });
const houseFloor = new THREE.Mesh(houseFloorGeometry, houseFloorMaterial);
houseFloor.position.set(30, 0, 0);
scene.add(houseFloor);

// Add NPCs moving around
const npcs = [];
const npcGeometry = new THREE.BoxGeometry(1, 2, 1);
const npcMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff });

for (let i = 0; i < 10; i++) { // Increased number of NPCs
    const npc = new THREE.Mesh(npcGeometry, npcMaterial);
    npc.position.set(Math.random() * 40 - 20, 1, Math.random() * 40 - 20);
    npc.userData = { direction: Math.random() * Math.PI * 2 };
    scene.add(npc);
    npcs.push(npc);
}

function moveNPCs() {
    npcs.forEach(npc => {
        npc.position.x += Math.sin(npc.userData.direction) * 0.05;
        npc.position.z += Math.cos(npc.userData.direction) * 0.05;
        if (Math.random() < 0.01) {
            npc.userData.direction += (Math.random() - 0.5) * Math.PI / 4;
        }
    });
}

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

// Teleport to a box-like place when walking into the door
const boxGeometry = new THREE.BoxGeometry(20, 20, 20); // Made the box larger
const boxMaterial = new THREE.MeshBasicMaterial({ color: 0x808080, side: THREE.BackSide });
const box = new THREE.Mesh(boxGeometry, boxMaterial);
box.position.set(1000, 10, 1000);
scene.add(box);

const boxFloorGeometry = new THREE.BoxGeometry(20, 0.1, 20);
const boxFloorMaterial = new THREE.MeshBasicMaterial({ color: 0x808080 });
const boxFloor = new THREE.Mesh(boxFloorGeometry, boxFloorMaterial);
boxFloor.position.set(1000, -0.5, 1000);
scene.add(boxFloor);

const boxDoorGeometry = new THREE.BoxGeometry(2, 4, 0.1);
const boxDoorMaterial = new THREE.MeshBasicMaterial({ color: 0x654321 });
const boxDoor = new THREE.Mesh(boxDoorGeometry, boxDoorMaterial);
boxDoor.position.set(1000, 2, 995.05);
scene.add(boxDoor);

function teleportInsideBox() {
    cube.position.set(1000, 1, 1000);
}

function teleportOutsideBox() {
    cube.position.set(30, 1, 0);
}

// Add control panel with passcode
const controlPanel = document.createElement('div');
controlPanel.style.position = 'absolute';
controlPanel.style.top = '50%';
controlPanel.style.left = '50%';
controlPanel.style.transform = 'translate(-50%, -50%)';
controlPanel.style.padding = '20px';
controlPanel.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
controlPanel.style.color = 'white';
controlPanel.style.display = 'none';
controlPanel.innerHTML = `
    <h2>Control Panel</h2>
    <p>Enter passcode: <input type="text" id="passcode" /></p>
    <button onclick="checkPasscode()">Submit</button>
    <div id="controlOptions" style="display: none;">
        <button onclick="toggleFlying()">Toggle Flying</button>
        <button onclick="addNPC()">Add NPC</button>
        <button onclick="removeNPC()">Remove NPC</button>
    </div>
`;
document.body.appendChild(controlPanel);

let flying = false;

function checkPasscode() {
    const passcode = document.getElementById('passcode').value;
    if (passcode === '9999') {
        document.getElementById('controlOptions').style.display = 'block';
    } else {
        alert('Incorrect passcode');
    }
}

function toggleFlying() {
    flying = !flying;
    console.log(`Flying ${flying ? 'enabled' : 'disabled'}`);
}

function addNPC() {
    const npc = new THREE.Mesh(npcGeometry, npcMaterial);
    npc.position.set(Math.random() * 40 - 20, 1, Math.random() * 40 - 20);
    npc.userData = { direction: Math.random() * Math.PI * 2 };
    scene.add(npc);
    npcs.push(npc);
}

function removeNPC() {
    if (npcs.length > 0) {
        const npc = npcs.pop();
        scene.remove(npc);
    }
}

document.addEventListener('keydown', (event) => {
    if (event.key === 'p') {
        controlPanel.style.display = 'block';
    }
});

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
    if (flying) {
        if (keys[' ']) {
            cube.position.y += speed;
        }
        if (keys['Shift']) {
            cube.position.y -= speed;
        }
    }
}

// Animation loop with gravity and collision detection
function animate() {
    requestAnimationFrame(animate);

    updateMovement();
    moveNPCs();

    // Apply gravity
    if (isJumping && !flying) {
        velocityY -= gravity;
        cube.position.y += velocityY;
    }

    // Check for collision with floor
    let isOnPlatform = false;
    if (cube.position.y <= 0) {
        cube.position.y = 0;
        velocityY = 0;
        isJumping = false;
        isOnPlatform = true;
    }

    // If not on any platform, apply gravity
    if (!isOnPlatform && !flying) {
        velocityY -= gravity;
        cube.position.y += velocityY;
    }

    // Check for collision with shop
    if (cube.position.distanceTo(shop.position) < 2) {
        openShop();
    }

    // Check for collision with house door
    if (cube.position.distanceTo(door.position) < 2) {
        teleportInsideBox();
    }

    // Check for collision with box door
    if (cube.position.distanceTo(boxDoor.position) < 2) {
        teleportOutsideBox();
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
