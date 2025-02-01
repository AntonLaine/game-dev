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
        <li>Score 5 goals in football</li>
        <li>Win 3 football matches</li>
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
