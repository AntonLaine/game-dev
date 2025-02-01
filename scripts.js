// File cleared for new game

// Hide loading screen when the game is loaded
window.addEventListener('load', () => {
    const loadingScreen = document.getElementById('loadingScreen');
    loadingScreen.style.display = 'none';
});

// Initialize the scene
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

let isPlayingFootball = false;
let originalSpeed = 0.2;
let originalNPCs = [];

// Add a red cube (player)
const geometry = new THREE.BoxGeometry();
const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
const cube = new THREE.Mesh(geometry, material);
cube.position.set(0, 1.05, 0); // Raised the player to stand on the green floor
scene.add(cube);

// Initialize WebSocket for multiplayer
const socket = new WebSocket('ws://localhost:8080');

socket.onopen = () => {
    console.log('Connected to the server');
};

socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'update') {
        updateOtherPlayers(data.players);
    } else if (data.type === 'lobby') {
        updateLobbyList(data.lobbies);
    }
};

socket.onclose = () => {
    console.log('Disconnected from the server');
};

const otherPlayers = {};
const lobbies = {};

function updateOtherPlayers(players) {
    for (const id in players) {
        if (id !== socket.id) {
            if (!otherPlayers[id]) {
                const geometry = new THREE.BoxGeometry();
                const material = new THREE.MeshBasicMaterial({ color: 0x0000ff });
                const player = new THREE.Mesh(geometry, material);
                scene.add(player);
                otherPlayers[id] = player;
            }
            otherPlayers[id].position.set(players[id].x, players[id].y, players[id].z);
        }
    }
}

function sendPlayerData() {
    if (socket.readyState === WebSocket.OPEN) {
        const data = {
            type: 'update',
            id: socket.id,
            x: cube.position.x,
            y: cube.position.y,
            z: cube.position.z
        };
        socket.send(JSON.stringify(data));
    }
}

// Add a green floor
const floorGeometry = new THREE.BoxGeometry(100, 0.1, 100);
const floorMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.position.set(0, 0, 0); // Raised the green area a little bit
scene.add(floor);

// Add barriers around the green area
const barrierMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
const barriers = [];

const barrier1 = new THREE.Mesh(new THREE.BoxGeometry(100, 10, 1), barrierMaterial);
barrier1.position.set(0, 5, -50);
scene.add(barrier1);
barriers.push(barrier1);

const barrier2 = new THREE.Mesh(new THREE.BoxGeometry(100, 10, 1), barrierMaterial);
barrier2.position.set(0, 5, 50);
scene.add(barrier2);
barriers.push(barrier2);

const barrier3 = new THREE.Mesh(new THREE.BoxGeometry(1, 10, 100), barrierMaterial);
barrier3.position.set(-50, 5, 0);
scene.add(barrier3);
barriers.push(barrier3);

const barrier4 = new THREE.Mesh(new THREE.BoxGeometry(1, 10, 100), barrierMaterial);
barrier4.position.set(50, 5, 0);
scene.add(barrier4);
barriers.push(barrier4);

// Add a shop
const shopGeometry = new THREE.BoxGeometry(5, 5, 5);
const shopMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
const shop = new THREE.Mesh(shopGeometry, shopMaterial);
shop.position.set(20, 2.5, 0);
scene.add(shop);

const shopSignGeometry = new THREE.PlaneGeometry(5, 2);
const shopSignMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
const shopSign = new THREE.Mesh(shopSignGeometry, shopSignMaterial);
shopSign.position.set(20, 6, 0);
shopSign.rotation.y = Math.PI / 2;
scene.add(shopSign);

// Add houses
function addHouse(x, z) {
    const houseGeometry = new THREE.BoxGeometry(5, 5, 5);
    const houseMaterial = new THREE.MeshBasicMaterial({ color: 0x8B4513 });
    const house = new THREE.Mesh(houseGeometry, houseMaterial);
    house.position.set(x, 2.5, z);
    scene.add(house);

    const roofGeometry = new THREE.ConeGeometry(3, 2, 4);
    const roofMaterial = new THREE.MeshBasicMaterial({ color: 0x8B0000 });
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.set(x, 6, z);
    scene.add(roof);
}

addHouse(-20, -20);
addHouse(-20, 20);
addHouse(20, -20);
addHouse(20, 20);

// Add trees
function addTree(x, z) {
    const trunkGeometry = new THREE.CylinderGeometry(0.5, 0.5, 3, 32);
    const trunkMaterial = new THREE.MeshBasicMaterial({ color: 0x8B4513 });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.set(x, 1.5, z);
    scene.add(trunk);

    const leavesGeometry = new THREE.SphereGeometry(2, 32, 32);
    const leavesMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
    leaves.position.set(x, 4, z);
    scene.add(leaves);
}

addTree(-10, -10);
addTree(-10, 10);
addTree(10, -10);
addTree(10, 10);

// Add a path
const pathGeometry = new THREE.PlaneGeometry(50, 5);
const pathMaterial = new THREE.MeshBasicMaterial({ color: 0x8B4513 });
const path = new THREE.Mesh(pathGeometry, pathMaterial);
path.rotation.x = -Math.PI / 2;
path.position.set(0, 0, 0);
scene.add(path);

// Add a water fountain to the middle of the map
const fountainBaseGeometry = new THREE.CylinderGeometry(5, 5, 1, 32);
const fountainBaseMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff });
const fountainBase = new THREE.Mesh(fountainBaseGeometry, fountainBaseMaterial);
fountainBase.position.set(0, 0.5, 0);
scene.add(fountainBase);

const fountainTopGeometry = new THREE.CylinderGeometry(2, 2, 3, 32);
const fountainTopMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff });
const fountainTop = new THREE.Mesh(fountainTopGeometry, fountainTopMaterial);
fountainTop.position.set(0, 2.5, 0);
scene.add(fountainTop);

const waterGeometry = new THREE.CylinderGeometry(1.5, 1.5, 2.5, 32);
const waterMaterial = new THREE.MeshBasicMaterial({ color: 0x00ffff, opacity: 0.5, transparent: true });
const water = new THREE.Mesh(waterGeometry, waterMaterial);
water.position.set(0, 2.5, 0);
scene.add(water);

// Add NPCs moving around
const npcs = [];
const npcGeometry = new THREE.BoxGeometry(1, 2, 1);
const npcMaterials = [
    new THREE.MeshBasicMaterial({ color: 0x0000ff }), // Blue
    new THREE.MeshBasicMaterial({ color: 0x00ff00 }), // Green
    new THREE.MeshBasicMaterial({ color: 0xff0000 }), // Red
    new THREE.MeshBasicMaterial({ color: 0xffff00 }), // Yellow
    new THREE.MeshBasicMaterial({ color: 0xff00ff }), // Magenta
];
const npcNames = ["Alice", "Bob", "Charlie", "Diana", "Eve", "Frank", "Grace", "Hank", "Ivy", "Jack"];
const npcDialogues = {
    "Alice": "Hello, I'm Alice. Nice to meet you!",
    "Bob": "Hey there, I'm Bob. How's it going?",
    "Charlie": "Hi, I'm Charlie. What's up?",
    "Diana": "Greetings, I'm Diana. How can I help you?",
    "Eve": "Hello, I'm Eve. Have a great day!",
    "Frank": "Hey, I'm Frank. What's new?",
    "Grace": "Hi, I'm Grace. Nice to see you!",
    "Hank": "Hello, I'm Hank. How are you?",
    "Ivy": "Hey, I'm Ivy. What's happening?",
    "Jack": "Hi, I'm Jack. Good to see you!"
};
const npcAnswers = {
    "Alice": ["Nice to meet you too!", "What are you doing here?", "Goodbye!"],
    "Bob": ["I'm doing well, thanks!", "Not much, you?", "See you later!"],
    "Charlie": ["Just exploring.", "How about you?", "Take care!"],
    "Diana": ["Can you help me?", "What's your story?", "Bye!"],
    "Eve": ["Thanks, you too!", "What are you up to?", "Catch you later!"],
    "Frank": ["Not much, you?", "What's new with you?", "Goodbye!"],
    "Grace": ["Nice to see you too!", "What brings you here?", "See you!"],
    "Hank": ["I'm good, thanks!", "How about you?", "Later!"],
    "Ivy": ["Just hanging out.", "What about you?", "Bye!"],
    "Jack": ["Good to see you too!", "What are you doing?", "Take care!"]
};
const npcResponses = {
    "Alice": ["Nice to meet you too!", "I'm just wandering around.", "Goodbye!"],
    "Bob": ["That's great to hear!", "Same here, just relaxing.", "See you later!"],
    "Charlie": ["Exploring is fun!", "I'm doing well, thanks!", "Take care!"],
    "Diana": ["Sure, what do you need?", "I love helping people.", "Bye!"],
    "Eve": ["Thank you!", "Just enjoying the day.", "Catch you later!"],
    "Frank": ["Not much, just chilling.", "Just the usual stuff.", "Goodbye!"],
    "Grace": ["Nice to see you too!", "I'm here to help.", "See you!"],
    "Hank": ["I'm good, thanks!", "Just hanging out.", "Later!"],
    "Ivy": ["Just hanging out.", "Not much, you?", "Bye!"],
    "Jack": ["Good to see you too!", "Just exploring.", "Take care!"]
};

let coinsCollected = 50;

function spawnNPC() {
    const npc = new THREE.Mesh(npcGeometry, npcMaterials[Math.floor(Math.random() * npcMaterials.length)]);
    npc.position.set(Math.random() * 40 - 20, 1, Math.random() * 40 - 20);
    const name = npcNames[Math.floor(Math.random() * npcNames.length)];
    npc.userData = { direction: Math.random() * Math.PI * 2, name: name, dialogue: npcDialogues[name], answers: npcAnswers[name], responses: npcResponses[name], moving: true };
    scene.add(npc);
    npcs.push(npc);
}

for (let i = 0; i < 10; i++) { // Increased number of NPCs
    spawnNPC();
}

function checkCollisionWithBarriers(object) {
    let escaped = false;
    barriers.forEach(barrier => {
        if (object.position.distanceTo(barrier.position) < 5) {
            object.userData.direction += Math.PI; // Reverse direction
        }
        if (object.position.x < -50 || object.position.x > 50 || object.position.z < -50 || object.position.z > 50) {
            escaped = true;
        }
    });
    return escaped;
}

function moveNPCs() {
    npcs.forEach((npc, index) => {
        if (npc.userData.moving) {
            npc.position.x += Math.sin(npc.userData.direction) * 0.05;
            npc.position.z += Math.cos(npc.userData.direction) * 0.05;
            if (Math.random() < 0.01) {
                npc.userData.direction += (Math.random() - 0.5) * Math.PI / 4;
            }
            if (checkCollisionWithBarriers(npc)) {
                scene.remove(npc);
                npcs.splice(index, 1);
                spawnNPC();
            }
        }
    });
}

function interactWithNPC(npc) {
    npc.userData.moving = false;
    dialogueGUI.innerHTML = `
        <h2>${npc.userData.name}</h2>
        <p>${npc.userData.dialogue}</p>
        ${npc.userData.answers.map((answer, index) => `<button onclick="answerNPC('${npc.userData.name}', '${index}')">${answer}</button>`).join('')}
        <button onclick="closeDialogue()">Close</button>
    `;
    dialogueGUI.style.display = 'block';
}

function answerNPC(name, index) {
    const npc = npcs.find(npc => npc.userData.name === name);
    dialogueGUI.innerHTML = `
        <h2>${npc.userData.name}</h2>
        <p>${npc.userData.responses[index]}</p>
        <button onclick="closeDialogue()">Close</button>
    `;
}

function closeDialogue() {
    dialogueGUI.style.display = 'none';
    npcs.forEach(npc => npc.userData.moving = true);
}

const dialogueGUI = document.createElement('div');
dialogueGUI.style.position = 'absolute';
dialogueGUI.style.top = '50%';
dialogueGUI.style.left = '50%';
dialogueGUI.style.transform = 'translate(-50%, -50%)';
dialogueGUI.style.padding = '20px';
dialogueGUI.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
dialogueGUI.style.color = 'white';
dialogueGUI.style.display = 'none';
document.body.appendChild(dialogueGUI);

document.addEventListener('click', (event) => {
    npcs.forEach(npc => {
        if (cube.position.distanceTo(npc.position) < 2) {
            interactWithNPC(npc);
        }
    });
});

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
    if (!isPlayingFootball) {
        document.getElementById('coinsCollected').innerText = coinsCollected;
        shopGUI.style.display = 'block';
    }
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
    spawnNPC();
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

// Create lobby GUI
const lobbyGUI = document.createElement('div');
lobbyGUI.style.position = 'absolute';
lobbyGUI.style.top = '10px';
lobbyGUI.style.left = '10px';
lobbyGUI.style.padding = '10px';
lobbyGUI.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
lobbyGUI.style.color = 'white';
lobbyGUI.innerHTML = `
    <h2>Lobbies</h2>
    <ul id="lobbyList"></ul>
    <button onclick="createLobby()">Create Lobby</button>
    <button onclick="openJoinLobbyGUI()">Join Lobby</button>
`;
document.body.appendChild(lobbyGUI);

function createLobby() {
    const lobbyName = prompt('Enter lobby name:');
    if (lobbyName) {
        const data = {
            type: 'createLobby',
            lobbyName: lobbyName
        };
        socket.send(JSON.stringify(data));
    }
}

function joinLobby(lobbyName) {
    const data = {
        type: 'joinLobby',
        lobbyName: lobbyName
    };
    socket.send(JSON.stringify(data));
}

function updateLobbyList(lobbies) {
    const lobbyList = document.getElementById('lobbyList');
    lobbyList.innerHTML = '';
    for (const lobbyName in lobbies) {
        const lobbyItem = document.createElement('li');
        lobbyItem.textContent = lobbyName;
        lobbyItem.onclick = () => joinLobby(lobbyName);
        lobbyList.appendChild(lobbyItem);
    }
}

// Create join lobby GUI
const joinLobbyGUI = document.createElement('div');
joinLobbyGUI.style.position = 'absolute';
joinLobbyGUI.style.top = '50%';
joinLobbyGUI.style.left = '50%';
joinLobbyGUI.style.transform = 'translate(-50%, -50%)';
joinLobbyGUI.style.padding = '20px';
joinLobbyGUI.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
joinLobbyGUI.style.color = 'white';
joinLobbyGUI.style.display = 'none';
joinLobbyGUI.innerHTML = `
    <h2>Join Lobby</h2>
    <input type="text" id="lobbySearch" placeholder="Enter lobby name or code">
    <ul id="joinLobbyList"></ul>
    <button onclick="closeJoinLobbyGUI()">Close</button>
`;
document.body.appendChild(joinLobbyGUI);

function openJoinLobbyGUI() {
    joinLobbyGUI.style.display = 'block';
    updateJoinLobbyList();
}

function closeJoinLobbyGUI() {
    joinLobbyGUI.style.display = 'none';
}

function updateJoinLobbyList() {
    const searchQuery = document.getElementById('lobbySearch').value.toLowerCase();
    const joinLobbyList = document.getElementById('joinLobbyList');
    joinLobbyList.innerHTML = '';
    for (const lobbyName in lobbies) {
        if (lobbyName.toLowerCase().includes(searchQuery)) {
            const lobbyItem = document.createElement('li');
            lobbyItem.textContent = lobbyName;
            lobbyItem.onclick = () => joinLobby(lobbyName);
            joinLobbyList.appendChild(lobbyItem);
        }
    }
}

document.getElementById('lobbySearch').addEventListener('input', updateJoinLobbyList);

// Create achievements GUI
const achievementsGUI = document.createElement('div');
achievementsGUI.style.position = 'absolute';
achievementsGUI.style.top = '10px';
achievementsGUI.style.right = '10px';
achievementsGUI.style.padding = '10px';
achievementsGUI.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
achievementsGUI.style.color = 'white';
achievementsGUI.innerHTML = `
    <h2>Achievements</h2>
    <ul id="achievementsList">
        <li>Collect 100 coins</li>
        <li>Talk to 10 NPCs</li>
        <li>Buy 5 items from the shop</li>
    </ul>
`;
document.body.appendChild(achievementsGUI);

// Create stats GUI
const statsGUI = document.createElement('div');
statsGUI.style.position = 'absolute';
statsGUI.style.top = '150px';
statsGUI.style.right = '10px';
statsGUI.style.padding = '10px';
statsGUI.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
statsGUI.style.color = 'white';
statsGUI.innerHTML = `
    <h2>Stats</h2>
    <p>Coins: <span id="coinsCollected">${coinsCollected}</span></p>
`;
document.body.appendChild(statsGUI);

function updateStats() {
    document.getElementById('coinsCollected').innerText = coinsCollected;
}

// Update coins display every second
setInterval(() => {
    document.getElementById('coinsCollected').innerText = coinsCollected;
}, 1000);

// Position the camera to follow the cube
camera.position.set(0, 2, 5);
camera.lookAt(cube.position);

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
    if (isPlayingFootball) {
        // Reversed controls and slower speed for football game
        if (keys['w']) {
            cube.position.z += speed / 2;
        }
        if (keys['s']) {
            cube.position.z -= speed / 2;
        }
        if (keys['a']) {
            cube.position.x += speed / 2;
        }
        if (keys['d']) {
            cube.position.x -= speed / 2;
        }
        if (keys['q']) {
            cube.rotation.y += 0.1;
        }
        if (keys['e']) {
            cube.rotation.y -= 0.1;
        }
    } else {
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
    if (cube.position.y <= 1.05) { // Adjusted to match the raised floor
        cube.position.y = 1.05;
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
