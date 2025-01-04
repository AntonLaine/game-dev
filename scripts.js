const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const cellSize = 20;
const rows = Math.floor(canvas.height / cellSize);
const cols = Math.floor(canvas.width / cellSize);

let movingCells = [{ x: Math.floor(cols / 2), y: Math.floor(rows / 2), direction: 'right' }];
let duplicators = [];
let rotators = [];
let blockers = [];
let selectedCellType = 'movingCell';
let isRunning = false;
let previewCell = { x: 0, y: 0 };

function drawGrid() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#ddd';
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            ctx.strokeRect(col * cellSize, row * cellSize, cellSize, cellSize);
        }
    }
}

function drawMovingCells() {
    movingCells.forEach(cell => {
        ctx.fillStyle = 'blue';
        ctx.fillRect(cell.x * cellSize, cell.y * cellSize, cellSize, cellSize);
        ctx.fillStyle = 'white';
        ctx.beginPath();
        switch (cell.direction) {
            case 'up':
                ctx.moveTo((cell.x + 0.5) * cellSize, cell.y * cellSize);
                ctx.lineTo((cell.x + 0.25) * cellSize, (cell.y + 0.5) * cellSize);
                ctx.lineTo((cell.x + 0.75) * cellSize, (cell.y + 0.5) * cellSize);
                break;
            case 'down':
                ctx.moveTo((cell.x + 0.5) * cellSize, (cell.y + 1) * cellSize);
                ctx.lineTo((cell.x + 0.25) * cellSize, (cell.y + 0.5) * cellSize);
                ctx.lineTo((cell.x + 0.75) * cellSize, (cell.y + 0.5) * cellSize);
                break;
            case 'left':
                ctx.moveTo(cell.x * cellSize, (cell.y + 0.5) * cellSize);
                ctx.lineTo((cell.x + 0.5) * cellSize, (cell.y + 0.25) * cellSize);
                ctx.lineTo((cell.x + 0.5) * cellSize, (cell.y + 0.75) * cellSize);
                break;
            case 'right':
                ctx.moveTo((cell.x + 1) * cellSize, (cell.y + 0.5) * cellSize);
                ctx.lineTo((cell.x + 0.5) * cellSize, (cell.y + 0.25) * cellSize);
                ctx.lineTo((cell.x + 0.5) * cellSize, (cell.y + 0.75) * cellSize);
                break;
        }
        ctx.fill();
    });
}

function drawDuplicators() {
    ctx.fillStyle = 'green';
    duplicators.forEach(dup => {
        ctx.fillRect(dup.x * cellSize, dup.y * cellSize, cellSize, cellSize);
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc((dup.x + 0.5) * cellSize, (dup.y + 0.5) * cellSize, cellSize / 4, 0, 2 * Math.PI);
        ctx.fill();
    });
}

function drawRotators() {
    ctx.fillStyle = 'red';
    rotators.forEach(rot => {
        ctx.fillRect(rot.x * cellSize, rot.y * cellSize, cellSize, cellSize);
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc((rot.x + 0.5) * cellSize, (rot.y + 0.5) * cellSize, cellSize / 4, 0, 2 * Math.PI);
        ctx.stroke();
    });
}

function drawBlockers() {
    ctx.fillStyle = 'black';
    blockers.forEach(block => {
        ctx.fillRect(block.x * cellSize, block.y * cellSize, cellSize, cellSize);
    });
}

function drawPreviewCell() {
    ctx.fillStyle = 'rgba(0, 0, 255, 0.5)';
    ctx.fillRect(previewCell.x * cellSize, previewCell.y * cellSize, cellSize, cellSize);
}

function moveCells() {
    movingCells.forEach(cell => {
        switch (cell.direction) {
            case 'up':
                cell.y = Math.max(0, cell.y - 1);
                break;
            case 'down':
                cell.y = Math.min(rows - 1, cell.y + 1);
                break;
            case 'left':
                cell.x = Math.max(0, cell.x - 1);
                break;
            case 'right':
                cell.x = Math.min(cols - 1, cell.x + 1);
                break;
        }
    });
}

function checkInteractions() {
    movingCells.forEach(cell => {
        duplicators.forEach(dup => {
            if (dup.x === cell.x && dup.y === cell.y) {
                let oppositeDirection;
                switch (cell.direction) {
                    case 'up':
                        oppositeDirection = 'down';
                        break;
                    case 'down':
                        oppositeDirection = 'up';
                        break;
                    case 'left':
                        oppositeDirection = 'right';
                        break;
                    case 'right':
                        oppositeDirection = 'left';
                        break;
                }
                movingCells.push({ x: cell.x, y: cell.y, direction: oppositeDirection });
            }
        });

        rotators.forEach(rot => {
            if (rot.x === cell.x && rot.y === cell.y) {
                switch (cell.direction) {
                    case 'up':
                        cell.direction = 'right';
                        break;
                    case 'right':
                        cell.direction = 'down';
                        break;
                    case 'down':
                        cell.direction = 'left';
                        break;
                    case 'left':
                        cell.direction = 'up';
                        break;
                }
            }
        });

        blockers.forEach(block => {
            if (block.x === cell.x && block.y === cell.y) {
                isRunning = false;
            }
        });
    });
}

function gameLoop() {
    drawGrid();
    drawMovingCells();
    drawDuplicators();
    drawRotators();
    drawBlockers();
    drawPreviewCell();
    if (isRunning) {
        moveCells();
        checkInteractions();
    }
    requestAnimationFrame(gameLoop);
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'r' || e.key === 'R') {
        movingCells.forEach(cell => {
            switch (cell.direction) {
                case 'up':
                    cell.direction = 'right';
                    break;
                case 'right':
                    cell.direction = 'down';
                    break;
                case 'down':
                    cell.direction = 'left';
                    break;
                case 'left':
                    cell.direction = 'up';
                    break;
            }
        });
    }
    if (e.key === 'e' || e.key === 'E') {
        const x = previewCell.x;
        const y = previewCell.y;
        duplicators = duplicators.filter(dup => !(dup.x === x && dup.y === y));
        rotators = rotators.filter(rot => !(rot.x === x && rot.y === y));
        blockers = blockers.filter(block => !(block.x === x && block.y === y));
        movingCells = movingCells.filter(cell => !(cell.x === x && cell.y === y));
    }
});

document.getElementById('menu').addEventListener('click', (e) => {
    if (e.target.classList.contains('menu-item')) {
        selectedCellType = e.target.getAttribute('data-type');
    }
});

document.getElementById('startButton').addEventListener('click', () => {
    isRunning = true;
    drawGrid();
    drawMovingCells();
    drawDuplicators();
    drawRotators();
    drawBlockers();
    drawPreviewCell();
});

document.getElementById('stopButton').addEventListener('click', () => {
    isRunning = false;
    drawGrid();
    drawMovingCells();
    drawDuplicators();
    drawRotators();
    drawBlockers();
    drawPreviewCell();
});

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    previewCell.x = Math.floor((e.clientX - rect.left) / cellSize);
    previewCell.y = Math.floor((e.clientY - rect.top) / cellSize);
});

canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / cellSize);
    const y = Math.floor((e.clientY - rect.top) / cellSize);

    if (selectedCellType === 'movingCell') {
        movingCells.push({ x, y, direction: 'right' });
    } else if (selectedCellType === 'duplicator') {
        duplicators.push({ x, y });
    } else if (selectedCellType === 'rotator') {
        rotators.push({ x, y });
    } else if (selectedCellType === 'blocker') {
        blockers.push({ x, y });
    } else if (selectedCellType === 'eraser') {
        duplicators = duplicators.filter(dup => !(dup.x === x && dup.y === y));
        rotators = rotators.filter(rot => !(rot.x === x && rot.y === y));
        blockers = blockers.filter(block => !(block.x === x && block.y === y));
        movingCells = movingCells.filter(cell => !(cell.x === x && cell.y === y));
    }
    drawGrid();
    drawMovingCells();
    drawDuplicators();
    drawRotators();
    drawBlockers();
    drawPreviewCell();
});

canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / cellSize);
    const y = Math.floor((e.clientY - rect.top) / cellSize);

    duplicators = duplicators.filter(dup => !(dup.x === x && dup.y === y));
    rotators = rotators.filter(rot => !(rot.x === x && rot.y === y));
    blockers = blockers.filter(block => !(block.x === x && block.y === y));
    movingCells = movingCells.filter(cell => !(cell.x === x && cell.y === y));
    drawGrid();
    drawMovingCells();
    drawDuplicators();
    drawRotators();
    drawBlockers();
    drawPreviewCell();
});

duplicators.push({ x: Math.floor(Math.random() * cols), y: Math.floor(Math.random() * rows) });
rotators.push({ x: Math.floor(Math.random() * cols), y: Math.floor(Math.random() * rows) });

gameLoop();
