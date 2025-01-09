document.addEventListener('DOMContentLoaded', () => {
    const cards = document.querySelectorAll('.card');
    let hasFlippedCard = false;
    let lockBoard = false;
    let firstCard, secondCard;
    let player1Health = 100;
    let player2Health = 100;
    let enemyHealth = 100;
    let currentPlayer = 1;
    let playerBallHealth = 100;
    let enemyBallHealth = 100;
    let fireballEffect = false;

    function flipCard() {
        if (lockBoard) return;
        if (this === firstCard) return;

        this.classList.add('flipped');

        if (!hasFlippedCard) {
            hasFlippedCard = true;
            firstCard = this;
            return;
        }

        secondCard = this;
        checkForMatch();
    }

    function checkForMatch() {
        let isMatch = firstCard.dataset.framework === secondCard.dataset.framework;
        if (isMatch) {
            applyCardEffect(firstCard.dataset.framework);
            disableCards();
        } else {
            unflipCards();
        }
    }

    function applyCardEffect(cardType) {
        switch (cardType) {
            case 'fireball':
                dealDamage(15);
                fireballEffect = true;
                break;
            case 'shield':
                shieldPlayer(10);
                break;
            case 'lightning':
                dealDamage(20);
                break;
            case 'heal':
                healPlayer(20);
                break;
            default:
                break;
        }
        switchPlayer();
    }

    function dealDamage(amount) {
        if (currentPlayer === 1) {
            enemyBallHealth -= amount;
        } else {
            playerBallHealth -= amount;
        }
        updateHealthDisplay();
    }

    function healPlayer(amount) {
        if (currentPlayer === 1) {
            playerBallHealth += amount;
        } else {
            enemyBallHealth += amount;
        }
        updateHealthDisplay();
    }

    function shieldPlayer(amount) {
        if (currentPlayer === 1) {
            playerBallHealth += amount;
        } else {
            enemyBallHealth += amount;
        }
        updateHealthDisplay();
    }

    function updateHealthDisplay() {
        document.getElementById('player1-health').textContent = `Player 1 Health: ${player1Health}`;
        document.getElementById('player2-health').textContent = `Player 2 Health: ${player2Health}`;
        document.getElementById('enemy-health').textContent = `Enemy Health: ${enemyHealth}`;
        document.getElementById('player-ball').textContent = playerBallHealth;
        document.getElementById('enemy-ball').textContent = enemyBallHealth;
    }

    function switchPlayer() {
        if (fireballEffect && currentPlayer === 2) {
            playerBallHealth -= 5;
            fireballEffect = false;
        }
        currentPlayer = currentPlayer === 1 ? 2 : 1;
    }

    function disableCards() {
        firstCard.removeEventListener('click', flipCard);
        secondCard.removeEventListener('click', flipCard);

        resetBoard();
    }

    function unflipCards() {
        lockBoard = true;

        setTimeout(() => {
            firstCard.classList.remove('flipped');
            secondCard.classList.remove('flipped');

            resetBoard();
        }, 1500);
    }

    function resetBoard() {
        [hasFlippedCard, lockBoard] = [false, false];
        [firstCard, secondCard] = [null, null];
    }

    function distributeCards() {
        const cardTypes = ['fireball', 'shield', 'lightning', 'heal'];
        const playerCards = [];
        const enemyCards = [];

        for (let i = 0; i < 4; i++) {
            const randomCard = cardTypes[Math.floor(Math.random() * cardTypes.length)];
            playerCards.push(randomCard);
        }

        for (let i = 0; i < 4; i++) {
            const randomCard = cardTypes[Math.floor(Math.random() * cardTypes.length)];
            enemyCards.push(randomCard);
        }

        return { playerCards, enemyCards };
    }

    function initializeGame() {
        const { playerCards, enemyCards } = distributeCards();

        const playerCardElements = document.querySelectorAll('.player-card');
        const enemyCardElements = document.querySelectorAll('.enemy-card');

        playerCardElements.forEach((card, index) => {
            if (playerCards[index]) {
                card.dataset.framework = playerCards[index];
                card.querySelector('.card-front').textContent = playerCards[index];
                card.classList.remove('hidden');
            } else {
                card.classList.add('hidden');
            }
        });

        enemyCardElements.forEach((card, index) => {
            if (enemyCards[index]) {
                card.dataset.framework = enemyCards[index];
                card.querySelector('.card-front').textContent = enemyCards[index];
                card.classList.remove('hidden');
            } else {
                card.classList.add('hidden');
            }
        });
    }

    function handleCardClick(e) {
        const card = e.target.closest('.card');
        if (card) {
            card.classList.add('dragging');
            setTimeout(() => {
                card.classList.remove('dragging');
                card.remove();
                applyCardEffect(card.dataset.framework);
            }, 500);
        }
    }

    (function shuffle() {
        cards.forEach(card => {
            let randomPos = Math.floor(Math.random() * 12);
            card.style.order = randomPos;
        });
    })();

    cards.forEach(card => {
        card.addEventListener('click', handleCardClick);
    });

    const gameBoard = document.querySelector('.game-board');
    gameBoard.addEventListener('dragover', handleDragOver);
    gameBoard.addEventListener('drop', handleDrop);

    initializeGame();

    // Display card descriptions on hover
    cards.forEach(card => {
        card.addEventListener('mouseover', () => {
            const description = card.dataset.description;
            const descriptionElement = document.createElement('div');
            descriptionElement.classList.add('card-description');
            descriptionElement.textContent = description;
            card.appendChild(descriptionElement);
        });

        card.addEventListener('mouseout', () => {
            const descriptionElement = card.querySelector('.card-description');
            if (descriptionElement) {
                card.removeChild(descriptionElement);
            }
        });
    });
});
