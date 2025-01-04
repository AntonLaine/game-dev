let population = 10;
let resources = 100;
let soldiers = 0;
let food = 0;
let money = 0;
const maxResources = 500;

function updateStatus() {
    document.getElementById('population').innerText = population;
    document.getElementById('resources').innerText = resources;
    document.getElementById('soldiers').innerText = soldiers;
    document.getElementById('food').innerText = food;
    document.getElementById('money').innerText = money;
}

function gatherResources() {
    resources += Math.min(10 + population, maxResources - resources);
    updateStatus();
}

function buildHouse() {
    if (resources >= 50) {
        resources -= 50;
        population += 5;
        const house = document.createElement('div');
        house.className = 'house';
        const village = document.getElementById('village');
        const x = Math.random() * (village.clientWidth - 50);
        const y = Math.random() * (village.clientHeight - 50);
        house.style.left = `${x}px`;
        house.style.top = `${y}px`;
        house.style.position = 'absolute';
        village.appendChild(house);
        const human = createHuman();
        village.appendChild(human);
        updateStatus();
    } else {
        alert('Not enough resources to build a house!');
    }
}

function createHuman(isSoldier = false) {
    const human = document.createElement('div');
    human.className = 'human';
    const leftHand = document.createElement('div');
    leftHand.className = 'left-hand';
    const rightHand = document.createElement('div');
    rightHand.className = 'right-hand';
    human.appendChild(leftHand);
    human.appendChild(rightHand);
    if (isSoldier) {
        const sword = document.createElement('div');
        sword.className = 'sword';
        leftHand.appendChild(sword);
    }
    return human;
}

function trainSoldier() {
    if (resources >= 20 && food >= 10) {
        resources -= 20;
        food -= 10;
        soldiers += 1;
        const soldier = createHuman(true);
        soldier.classList.add('soldier');
        const village = document.getElementById('village');
        const castle = document.querySelector('.castle');
        if (castle) {
            const castleRect = castle.getBoundingClientRect();
            const villageRect = village.getBoundingClientRect();
            const x = Math.random() * (villageRect.width - castleRect.width) + castleRect.width / 2;
            const y = Math.random() * (villageRect.height - castleRect.height) + castleRect.height / 2;
            soldier.style.left = `${x}px`;
            soldier.style.top = `${y}px`;
            soldier.style.position = 'absolute';
        }
        village.appendChild(soldier);
        updateStatus();
    } else {
        alert('Not enough resources or food to train a soldier!');
    }
}

function harvestCrops() {
    food += 20;
    updateStatus();
}

function sellFood() {
    if (food >= 10) {
        food -= 10;
        money += 5;
        updateStatus();
    } else {
        alert('Not enough food to sell!');
    }
}

function wander() {
    const humans = document.querySelectorAll('.human:not(.soldier)');
    humans.forEach(human => {
        const action = Math.random();
        if (action < 0.7) {
            // Wander around within the green box
            const x = Math.random() * 80 + 10;
            const y = Math.random() * 80 + 10;
            human.style.transition = 'transform 2s';
            human.style.transform = `translate(${x}%, ${y}%)`;
            setTimeout(() => {
                human.style.transition = '';
            }, 2000);
        } else if (action < 0.9) {
            // Interact with another human
            const otherHumans = Array.from(humans).filter(h => h !== human);
            if (otherHumans.length > 0) {
                const otherHuman = otherHumans[Math.floor(Math.random() * otherHumans.length)];
                const actions = ['waves at', 'dances with'];
                const interaction = actions[Math.floor(Math.random() * actions.length)];
                if (interaction === 'waves at') {
                    human.classList.add('waving');
                    setTimeout(() => human.classList.remove('waving'), 2000);
                } else {
                    human.classList.add('dancing');
                    setTimeout(() => human.classList.remove('dancing'), 2000);
                }
            }
        } else {
            // Walk to their house
            const house = document.querySelector('.house');
            if (house) {
                const houseRect = house.getBoundingClientRect();
                const humanRect = human.getBoundingClientRect();
                const x = houseRect.left - humanRect.left;
                const y = houseRect.top - humanRect.top;
                human.style.transition = 'transform 2s';
                human.style.transform = `translate(${x}px, ${y}px)`;
                setTimeout(() => {
                    human.style.transition = '';
                }, 2000);
            }
        }
    });
}

function buildCastle() {
    const castle = document.createElement('div');
    castle.className = 'castle';
    document.getElementById('village').appendChild(castle);
}

function createAttacker() {
    const attacker = document.createElement('div');
    attacker.className = 'attacker';
    const leftHand = document.createElement('div');
    leftHand.className = 'left-hand';
    const rightHand = document.createElement('div');
    rightHand.className = 'right-hand';
    attacker.appendChild(leftHand);
    attacker.appendChild(rightHand);
    return attacker;
}

function spawnAttackers() {
    const village = document.getElementById('village');
    for (let i = 0; i < 3; i++) {
        const attacker = createAttacker();
        const x = Math.random() * (village.clientWidth - 20);
        const y = Math.random() * (village.clientHeight - 20);
        attacker.style.left = `${x}px`;
        attacker.style.top = `${y}px`;
        attacker.style.position = 'absolute';
        village.appendChild(attacker);
    }
}

function attack() {
    const soldiers = document.querySelectorAll('.soldier');
    const attackers = document.querySelectorAll('.attacker');
    
    soldiers.forEach(soldier => {
        let closestAttacker = null;
        let minDistance = Infinity;
        attackers.forEach(attacker => {
            const soldierRect = soldier.getBoundingClientRect();
            const attackerRect = attacker.getBoundingClientRect();
            const distance = Math.hypot(soldierRect.left - attackerRect.left, soldierRect.top - attackerRect.top);
            if (distance < minDistance) {
                minDistance = distance;
                closestAttacker = attacker;
            }
        });
        if (closestAttacker) {
            const attackerRect = closestAttacker.getBoundingClientRect();
            const soldierRect = soldier.getBoundingClientRect();
            const x = attackerRect.left - soldierRect.left;
            const y = attackerRect.top - soldierRect.top;
            soldier.style.transition = 'transform 2s';
            soldier.style.transform = `translate(${x}px, ${y}px)`;
            setTimeout(() => {
                soldier.classList.add('attacking');
                closestAttacker.remove();
                soldier.classList.remove('attacking');
                soldier.style.transition = '';
                soldier.style.transform = '';
            }, 2000);
        }
    });

    attackers.forEach(attacker => {
        let closestTarget = null;
        let minDistance = Infinity;
        const targets = document.querySelectorAll('.house, .human, .soldier');
        targets.forEach(target => {
            const targetRect = target.getBoundingClientRect();
            const attackerRect = attacker.getBoundingClientRect();
            const distance = Math.hypot(targetRect.left - attackerRect.left, targetRect.top - attackerRect.top);
            if (distance < minDistance) {
                minDistance = distance;
                closestTarget = target;
            }
        });
        if (closestTarget) {
            const targetRect = closestTarget.getBoundingClientRect();
            const attackerRect = attacker.getBoundingClientRect();
            const x = targetRect.left - attackerRect.left;
            const y = targetRect.top - attackerRect.top;
            attacker.style.transition = 'transform 2s';
            attacker.style.transform = `translate(${x}px, ${y}px)`;
            setTimeout(() => {
                if (closestTarget.classList.contains('house')) {
                    closestTarget.classList.add('on-fire');
                    closestTarget.addEventListener('click', () => {
                        closestTarget.classList.remove('on-fire');
                    });
                    setTimeout(() => {
                        if (closestTarget.classList.contains('on-fire')) {
                            closestTarget.remove();
                        }
                    }, 5000);
                } else if (closestTarget.classList.contains('soldier')) {
                    closestTarget.remove();
                    soldiers -= 1;
                    updateStatus();
                } else {
                    closestTarget.remove();
                }
                attacker.remove();
            }, 2000);
        }
    });

    // Set two houses on fire
    const houses = document.querySelectorAll('.house');
    for (let i = 0; i < 2; i++) {
        if (houses[i]) {
            houses[i].classList.add('on-fire');
            houses[i].addEventListener('click', () => {
                houses[i].classList.remove('on-fire');
            });
            setTimeout(() => {
                if (houses[i].classList.contains('on-fire')) {
                    houses[i].remove();
                }
            }, 5000);
        }
    }
}

function startCountdown() {
    let timeLeft = 60;
    const countdownElement = document.createElement('div');
    countdownElement.id = 'countdown';
    countdownElement.style.position = 'absolute';
    countdownElement.style.top = '10px';
    countdownElement.style.left = '50%';
    countdownElement.style.transform = 'translateX(-50%)';
    countdownElement.style.fontSize = '24px';
    countdownElement.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
    countdownElement.style.padding = '10px';
    countdownElement.style.borderRadius = '5px';
    countdownElement.style.zIndex = '1';
    document.body.appendChild(countdownElement);

    const interval = setInterval(() => {
        timeLeft--;
        countdownElement.innerText = `Time until attack: ${timeLeft}s`;
        if (timeLeft <= 0) {
            clearInterval(interval);
            countdownElement.remove();
            spawnAttackers();
            setInterval(attack, 1000);
        }
    }, 1000);
}

document.addEventListener('DOMContentLoaded', () => {
    buildCastle();
    startCountdown();
});

setInterval(wander, 3000);

function interact() {
    const humans = document.querySelectorAll('.human');
    humans.forEach(human => {
        human.addEventListener('click', () => {
            const actions = ['says hi', 'dances'];
            const action = actions[Math.floor(Math.random() * actions.length)];
            alert(`A human ${action}!`);
        });
    });
}

interact();
