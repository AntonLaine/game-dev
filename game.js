// Mario Jamboree Board Game

// Game configuration
const config = {
    totalTurns: 20,
    boardSpaces: 40,
    players: ['mario', 'luigi', 'peach', 'yoshi'],
    playerNames: {
        mario: 'Mario',
        luigi: 'Luigi',
        peach: 'Peach',
        yoshi: 'Yoshi'
    },
    specialSpaces: [5, 10, 15, 20, 25, 30, 35],
    starSpaces: [8, 18, 28, 38]
};

// Game state
const gameState = {
    currentTurn: 1,
    currentPlayerIndex: 0,
    gameBoardCreated: false,
    gameActive: false,
    playerPositions: {},
    playerCoins: {},
    playerStars: {},
    diceRolling: false
};

// DOM Elements
const gameBoard = document.getElementById('game-board');
const diceElement = document.getElementById('dice');
const rollDiceButton = document.getElementById('roll-dice');
const startButton = document.getElementById('start-button');
const restartButton = document.getElementById('restart-button');
const gameOverScreen = document.getElementById('game-over');
const currentPlayerDisplay = document.getElementById('current-player');
const coinsDisplay = document.getElementById('coins');
const scoreDisplay = document.getElementById('score');
const finalScoreDisplay = document.getElementById('final-score');
const winnerDisplay = document.getElementById('winner');

// Initialize game
function initGame() {
    // Reset game state
    gameState.currentTurn = 1;
    gameState.currentPlayerIndex = 0;
    gameState.gameActive = true;
    gameState.playerPositions = {};
    gameState.playerCoins = {};
    gameState.playerStars = {};
    
    // Initialize player data
    config.players.forEach(player => {
        gameState.playerPositions[player] = 0;
        gameState.playerCoins[player] = 10;
        gameState.playerStars[player] = 0;
    });
    
    // Create game board if not already created
    if (!gameState.gameBoardCreated) {
        createGameBoard();
        gameState.gameBoardCreated = true;
    }
    
    // Place players at start position
    updatePlayerTokens();
    
    // Update displays
    updateDisplays();
    
    // Hide game over screen
    gameOverScreen.style.display = 'none';
}

// Create the game board
function createGameBoard() {
    gameBoard.innerHTML = '';
    
    // Create board spaces
    for (let i = 0; i < config.boardSpaces; i++) {
        const space = document.createElement('div');
        space.classList.add('board-space');
        space.dataset.index = i;
        
        // Add special styling for special spaces
        if (config.specialSpaces.includes(i)) {
            space.classList.add('special');
            space.textContent = '?';
        } 
        // Add star styling for star spaces
        else if (config.starSpaces.includes(i)) {
            space.classList.add('star');
            space.textContent = '★';
        } else {
            space.textContent = i;
        }
        
        gameBoard.appendChild(space);
    }
}

// Roll the dice
function rollDice() {
    if (!gameState.gameActive || gameState.diceRolling) return;
    
    gameState.diceRolling = true;
    
    // Animate dice roll
    let rollCount = 0;
    const maxRolls = 10;
    const rollInterval = setInterval(() => {
        const randomNumber = Math.floor(Math.random() * 6) + 1;
        diceElement.textContent = randomNumber;
        
        rollCount++;
        if (rollCount >= maxRolls) {
            clearInterval(rollInterval);
            const finalRoll = parseInt(diceElement.textContent);
            movePlayer(finalRoll);
            gameState.diceRolling = false;
        }
    }, 100);
}

// Move the current player
function movePlayer(spaces) {
    const currentPlayer = config.players[gameState.currentPlayerIndex];
    const oldPosition = gameState.playerPositions[currentPlayer];
    let newPosition = oldPosition + spaces;
    
    // Loop around the board if needed
    if (newPosition >= config.boardSpaces) {
        newPosition = newPosition % config.boardSpaces;
        
        // Give coins for completing a lap
        gameState.playerCoins[currentPlayer] += 5;
    }
    
    // Update player position
    gameState.playerPositions[currentPlayer] = newPosition;
    
    // Update player tokens on board
    updatePlayerTokens();
    
    // Check if landed on a special space
    if (config.specialSpaces.includes(newPosition)) {
        triggerSpecialSpace(currentPlayer);
    }
    
    // Check if landed on a star space
    if (config.starSpaces.includes(newPosition) && gameState.playerCoins[currentPlayer] >= 20) {
        gameState.playerCoins[currentPlayer] -= 20;
        gameState.playerStars[currentPlayer] += 1;
    }
    
    // Next player's turn
    nextTurn();
}

// Trigger special space effect
function triggerSpecialSpace(player) {
    // Random event on special space
    const eventType = Math.floor(Math.random() * 5);
    
    switch(eventType) {
        case 0:
            // Gain coins
            gameState.playerCoins[player] += 10;
            break;
        case 1:
            // Lose coins (min 0)
            gameState.playerCoins[player] = Math.max(0, gameState.playerCoins[player] - 5);
            break;
        case 2:
            // Move forward 3 spaces
            gameState.playerPositions[player] = 
                (gameState.playerPositions[player] + 3) % config.boardSpaces;
            break;
        case 3:
            // Move back 2 spaces
            gameState.playerPositions[player] = 
                (gameState.playerPositions[player] - 2 + config.boardSpaces) % config.boardSpaces;
            break;
        case 4:
            // Steal 3 coins from a random player
            const otherPlayers = config.players.filter(p => p !== player);
            if (otherPlayers.length > 0) {
                const randomPlayer = otherPlayers[Math.floor(Math.random() * otherPlayers.length)];
                const stolenCoins = Math.min(3, gameState.playerCoins[randomPlayer]);
                gameState.playerCoins[randomPlayer] -= stolenCoins;
                gameState.playerCoins[player] += stolenCoins;
            }
            break;
    }
    
    // Update player tokens after effects
    updatePlayerTokens();
}

// Proceed to next turn
function nextTurn() {
    // Move to next player
    gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % config.players.length;
    
    // If we've gone through all players, increment turn count
    if (gameState.currentPlayerIndex === 0) {
        gameState.currentTurn++;
        
        // Check if game is over
        if (gameState.currentTurn > config.totalTurns) {
            endGame();
            return;
        }
    }
    
    // Update displays
    updateDisplays();
}

// Update player tokens on the board
function updatePlayerTokens() {
    // Remove existing tokens
    const existingTokens = document.querySelectorAll('.player-token');
    existingTokens.forEach(token => token.remove());
    
    // Add updated tokens
    config.players.forEach(player => {
        const position = gameState.playerPositions[player];
        const space = document.querySelector(`.board-space[data-index="${position}"]`);
        
        if (space) {
            const token = document.createElement('div');
            token.classList.add('player-token', player);
            
            // Calculate offset for multiple players on same space
            const playerIndex = config.players.indexOf(player);
            token.style.left = `${space.offsetLeft + 5 + playerIndex * 8}px`;
            token.style.top = `${space.offsetTop + 5 + playerIndex * 8}px`;
            
            gameBoard.appendChild(token);
        }
    });
}

// Update display elements
function updateDisplays() {
    const currentPlayer = config.players[gameState.currentPlayerIndex];
    currentPlayerDisplay.textContent = config.playerNames[currentPlayer];
    coinsDisplay.textContent = gameState.playerCoins[currentPlayer];
    scoreDisplay.textContent = gameState.playerStars[currentPlayer];
}

// End the game and show results
function endGame() {
    gameState.gameActive = false;
    
    // Find player with most stars
    let maxStars = -1;
    let winner = null;
    
    Object.entries(gameState.playerStars).forEach(([player, stars]) => {
        if (stars > maxStars) {
            maxStars = stars;
            winner = player;
        }
    });
    
    // In case of a tie, player with most coins wins
    const tiedPlayers = Object.entries(gameState.playerStars)
        .filter(([player, stars]) => stars === maxStars)
        .map(([player]) => player);
    
    if (tiedPlayers.length > 1) {
        let maxCoins = -1;
        tiedPlayers.forEach(player => {
            if (gameState.playerCoins[player] > maxCoins) {
                maxCoins = gameState.playerCoins[player];
                winner = player;
            }
        });
    }
    
    // Display winner
    winnerDisplay.textContent = config.playerNames[winner];
    finalScoreDisplay.textContent = gameState.playerStars[winner];
    gameOverScreen.style.display = 'block';
}

// Event listeners
startButton.addEventListener('click', () => {
    initGame();
    startButton.style.display = 'none';
});

restartButton.addEventListener('click', () => {
    initGame();
});

rollDiceButton.addEventListener('click', rollDice);

// Initial setup
window.addEventListener('DOMContentLoaded', () => {
    gameState.gameBoardCreated = false;
    createGameBoard();
});
