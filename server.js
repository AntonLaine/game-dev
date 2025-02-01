const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });

const players = {};
const lobbies = {};

wss.on('connection', (ws) => {
    ws.id = Math.random().toString(36).substr(2, 9);
    players[ws.id] = { x: 0, y: 0, z: 0, lobby: null };

    ws.on('message', (message) => {
        const data = JSON.parse(message);
        if (data.type === 'update') {
            players[data.id] = { x: data.x, y: data.y, z: data.z, lobby: players[data.id].lobby };
            broadcastPlayers(players[data.id].lobby);
        } else if (data.type === 'createLobby') {
            lobbies[data.lobbyName] = { players: [ws.id] };
            players[ws.id].lobby = data.lobbyName;
            broadcastLobbies();
        } else if (data.type === 'joinLobby') {
            if (lobbies[data.lobbyName]) {
                lobbies[data.lobbyName].players.push(ws.id);
                players[ws.id].lobby = data.lobbyName;
                broadcastPlayers(data.lobbyName);
            }
        }
    });

    ws.on('close', () => {
        const lobby = players[ws.id].lobby;
        if (lobby) {
            lobbies[lobby].players = lobbies[lobby].players.filter(id => id !== ws.id);
            if (lobbies[lobby].players.length === 0) {
                delete lobbies[lobby];
            }
        }
        delete players[ws.id];
        broadcastPlayers(lobby);
        broadcastLobbies();
    });

    function broadcastPlayers(lobby) {
        if (lobby) {
            const data = JSON.stringify({ type: 'update', players: Object.fromEntries(Object.entries(players).filter(([id, player]) => player.lobby === lobby)) });
            wss.clients.forEach((client) => {
                if (client.readyState === WebSocket.OPEN && players[client.id].lobby === lobby) {
                    client.send(data);
                }
            });
        }
    }

    function broadcastLobbies() {
        const data = JSON.stringify({ type: 'lobby', lobbies });
        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(data);
            }
        });
    }
});

console.log('WebSocket server is running on ws://localhost:8080');
