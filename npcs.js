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
