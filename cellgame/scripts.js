const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const cellSize = 20;
const rows = Math.floor(canvas.height / cellSize);
const cols = Math.floor(canvas.width / cellSize);

let movingCells = [{ x: Math.floor(cols / 2), y: Math.floor(rows / 2), direction: 'right', speed: 1, size: cellSize, frozen: false, gravity: false, repel: false, attract: false }];
let duplicators = [];
let rotators = [];
let blockers = [];
let deleterCells = [];
let pushableBlocks = [];
let teleporters = [];
let speedReducers = [];
let speedBoosters = [];
let shrinkCells = [];
let growCells = [];
let freezeCells = [];
let heatCells = [];
let gravityCells = [];
let repelCells = [];
let attractCells = [];
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
        ctx.fillRect(cell.x * cellSize, cell.y * cellSize, cell.size, cell.size);
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

function drawDeleterCells() {
    ctx.fillStyle = 'purple';
    deleterCells.forEach(cell => {
        ctx.fillRect(cell.x * cellSize, cell.y * cellSize, cellSize, cellSize);
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.moveTo((cell.x + 0.25) * cellSize, (cell.y + 0.25) * cellSize);
        ctx.lineTo((cell.x + 0.75) * cellSize, (cell.y + 0.75) * cellSize);
        ctx.moveTo((cell.x + 0.75) * cellSize, (cell.y + 0.25) * cellSize);
        ctx.lineTo((cell.x + 0.25) * cellSize, (cell.y + 0.75) * cellSize);
        ctx.stroke();
    });
}

function drawPushableBlocks() {
    ctx.fillStyle = 'orange';
    pushableBlocks.forEach(block => {
        ctx.fillRect(block.x * cellSize, block.y * cellSize, cellSize, cellSize);
    });
}

function drawTeleporters() {
    ctx.fillStyle = 'cyan';
    teleporters.forEach(cell => {
        ctx.fillRect(cell.x * cellSize, cell.y * cellSize, cellSize, cellSize);
    });
}

function drawSpeedReducers() {
    ctx.fillStyle = 'magenta';
    speedReducers.forEach(cell => {
        ctx.fillRect(cell.x * cellSize, cell.y * cellSize, cellSize, cellSize);
    });
}

function drawSpeedBoosters() {
    ctx.fillStyle = 'yellow';
    speedBoosters.forEach(cell => {
        ctx.fillRect(cell.x * cellSize, cell.y * cellSize, cellSize, cellSize);
    });
}

function drawShrinkCells() {
    ctx.fillStyle = 'lime';
    shrinkCells.forEach(cell => {
        ctx.fillRect(cell.x * cellSize, cell.y * cellSize, cellSize, cellSize);
    });
}

function drawGrowCells() {
    ctx.fillStyle = 'pink';
    growCells.forEach(cell => {
        ctx.fillRect(cell.x * cellSize, cell.y * cellSize, cellSize, cellSize);
    });
}

function drawFreezeCells() {
    ctx.fillStyle = 'brown';
    freezeCells.forEach(cell => {
        ctx.fillRect(cell.x * cellSize, cell.y * cellSize, cellSize, cellSize);
    });
}

function drawHeatCells() {
    ctx.fillStyle = 'gray';
    heatCells.forEach(cell => {
        ctx.fillRect(cell.x * cellSize, cell.y * cellSize, cellSize, cellSize);
    });
}

function drawGravityCells() {
    ctx.fillStyle = 'navy';
    gravityCells.forEach(cell => {
        ctx.fillRect(cell.x * cellSize, cell.y * cellSize, cellSize, cellSize);
    });
}

function drawRepelCells() {
    ctx.fillStyle = 'olive';
    repelCells.forEach(cell => {
        ctx.fillRect(cell.x * cellSize, cell.y * cellSize, cellSize, cellSize);
    });
}

function drawAttractCells() {
    ctx.fillStyle = 'teal';
    attractCells.forEach(cell => {
        ctx.fillRect(cell.x * cellSize, cell.y * cellSize, cellSize, cellSize);
    });
}

function drawPreviewCell() {
    ctx.fillStyle = 'rgba(0, 0, 255, 0.5)';
    ctx.fillRect(previewCell.x * cellSize, previewCell.y * cellSize, cellSize, cellSize);
}

function moveCells() {
    movingCells.forEach(cell => {
        if (cell.frozen) return;
        switch (cell.direction) {
            case 'up':
                cell.y = Math.max(0, cell.y - cell.speed);
                break;
            case 'down':
                cell.y = Math.min(rows - 1, cell.y + cell.speed);
                break;
            case 'left':
                cell.x = Math.max(0, cell.x - cell.speed);
                break;
            case 'right':
                cell.x = Math.min(cols - 1, cell.x + cell.speed);
                break;
        }
    });
}

function checkInteractions() {
    movingCells.forEach(cell => {
        duplicators.forEach(dup => {
            if (Math.abs(dup.x - cell.x) <= 1 && Math.abs(dup.y - cell.y) <= 1) {
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
                movingCells.push({ x: cell.x, y: cell.y, direction: oppositeDirection, speed: cell.speed, size: cell.size, frozen: cell.frozen, gravity: cell.gravity, repel: cell.repel, attract: cell.attract });
            }
        });

        rotators.forEach(rot => {
            if (Math.abs(rot.x - cell.x) <= 1 && Math.abs(rot.y - cell.y) <= 1) {
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

        deleterCells.forEach(del => {
            if (Math.abs(del.x - cell.x) <= 1 && Math.abs(del.y - cell.y) <= 1) {
                movingCells = movingCells.filter(c => c !== cell);
            }
        });

        blockers.forEach(block => {
            if (Math.abs(block.x - cell.x) <= 1 && Math.abs(block.y - cell.y) <= 1) {
                isRunning = false;
            }
        });

        pushableBlocks.forEach(block => {
            if (Math.abs(block.x - cell.x) <= 1 && Math.abs(block.y - cell.y) <= 1) {
                switch (cell.direction) {
                    case 'up':
                        block.y = Math.max(0, block.y - 1);
                        break;
                    case 'down':
                        block.y = Math.min(rows - 1, block.y + 1);
                        break;
                    case 'left':
                        block.x = Math.max(0, block.x - 1);
                        break;
                    case 'right':
                        block.x = Math.min(cols - 1, block.x + 1);
                        break;
                }
            }
        });

        teleporters.forEach(tele => {
            if (Math.abs(tele.x - cell.x) <= 1 && Math.abs(tele.y - cell.y) <= 1) {
                cell.x = Math.floor(Math.random() * cols);
                cell.y = Math.floor(Math.random() * rows);
            }
        });

        speedReducers.forEach(speedReducer => {
            if (Math.abs(speedReducer.x - cell.x) <= 1 && Math.abs(speedReducer.y - cell.y) <= 1) {
                cell.speed = 0.5;
            }
        });

        speedBoosters.forEach(speedBooster => {
            if (Math.abs(speedBooster.x - cell.x) <= 1 && Math.abs(speedBooster.y - cell.y) <= 1) {
                cell.speed = 2;
            }
        });

        shrinkCells.forEach(shrinkCell => {
            if (Math.abs(shrinkCell.x - cell.x) <= 1 && Math.abs(shrinkCell.y - cell.y) <= 1) {
                cell.size = Math.max(10, cell.size - 5);
            }
        });

        growCells.forEach(growCell => {
            if (Math.abs(growCell.x - cell.x) <= 1 && Math.abs(growCell.y - cell.y) <= 1) {
                cell.size = Math.min(30, cell.size + 5);
            }
        });

        freezeCells.forEach(freezeCell => {
            if (Math.abs(freezeCell.x - cell.x) <= 1 && Math.abs(freezeCell.y - cell.y) <= 1) {
                cell.frozen = true;
            }
        });

        heatCells.forEach(heatCell => {
            if (Math.abs(heatCell.x - cell.x) <= 1 && Math.abs(heatCell.y - cell.y) <= 1) {
                cell.frozen = false;
            }
        });

        gravityCells.forEach(gravityCell => {
            if (Math.abs(gravityCell.x - cell.x) <= 1 && Math.abs(gravityCell.y - cell.y) <= 1) {
                cell.gravity = true;
            }
        });

        repelCells.forEach(repelCell => {
            if (Math.abs(repelCell.x - cell.x) <= 1 && Math.abs(repelCell.y - cell.y) <= 1) {
                cell.repel = true;
            }
        });

        attractCells.forEach(attractCell => {
            if (Math.abs(attractCell.x - cell.x) <= 1 && Math.abs(attractCell.y - cell.y) <= 1) {
                cell.attract = true;
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
    drawDeleterCells();
    drawPushableBlocks();
    drawTeleporters();
    drawSpeedReducers();
    drawSpeedBoosters();
    drawShrinkCells();
    drawGrowCells();
    drawFreezeCells();
    drawHeatCells();
    drawGravityCells();
    drawRepelCells();
    drawAttractCells();
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
        deleterCells = deleterCells.filter(del => !(del.x === x && del.y === y));
        pushableBlocks = pushableBlocks.filter(block => !(block.x === x && block.y === y));
        teleporters = teleporters.filter(tele => !(tele.x === x && tele.y === y));
        speedReducers = speedReducers.filter(speedReducer => !(speedReducer.x === x && speedReducer.y === y));
        speedBoosters = speedBoosters.filter(speedBooster => !(speedBooster.x === x && speedBooster.y === y));
        shrinkCells = shrinkCells.filter(shrinkCell => !(shrinkCell.x === x && shrinkCell.y === y));
        growCells = growCells.filter(growCell => !(growCell.x === x && growCell.y === y));
        freezeCells = freezeCells.filter(freezeCell => !(freezeCell.x === x && freezeCell.y === y));
        heatCells = heatCells.filter(heatCell => !(heatCell.x === x && heatCell.y === y));
        gravityCells = gravityCells.filter(gravityCell => !(gravityCell.x === x && gravityCell.y === y));
        repelCells = repelCells.filter(repelCell => !(repelCell.x === x && repelCell.y === y));
        attractCells = attractCells.filter(attractCell => !(attractCell.x === x && attractCell.y === y));
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
});

document.getElementById('stopButton').addEventListener('click', () => {
    isRunning = false;
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
        movingCells.push({ x, y, direction: 'right', speed: 1, size: cellSize, frozen: false, gravity: false, repel: false, attract: false });
    } else if (selectedCellType === 'duplicator') {
        duplicators.push({ x, y });
    } else if (selectedCellType === 'rotator') {
        rotators.push({ x, y });
    } else if (selectedCellType === 'blocker') {
        blockers.push({ x, y });
    } else if (selectedCellType === 'deleterCell') {
        deleterCells.push({ x, y });
    } else if (selectedCellType === 'pushableBlock') {
        pushableBlocks.push({ x, y });
    } else if (selectedCellType === 'teleporter') {
        teleporters.push({ x, y });
    } else if (selectedCellType === 'speedReducer') {
        speedReducers.push({ x, y });
    } else if (selectedCellType === 'speedBooster') {
        speedBoosters.push({ x, y });
    } else if (selectedCellType === 'shrinkCell') {
        shrinkCells.push({ x, y });
    } else if (selectedCellType === 'growCell') {
        growCells.push({ x, y });
    } else if (selectedCellType === 'freezeCell') {
        freezeCells.push({ x, y });
    } else if (selectedCellType === 'heatCell') {
        heatCells.push({ x, y });
    } else if (selectedCellType === 'gravityCell') {
        gravityCells.push({ x, y });
    } else if (selectedCellType === 'repelCell') {
        repelCells.push({ x, y });
    } else if (selectedCellType === 'attractCell') {
        attractCells.push({ x, y });
    }
    drawGrid();
    drawMovingCells();
    drawDuplicators();
    drawRotators();
    drawBlockers();
    drawDeleterCells();
    drawPushableBlocks();
    drawTeleporters();
    drawSpeedReducers();
    drawSpeedBoosters();
    drawShrinkCells();
    drawGrowCells();
    drawFreezeCells();
    drawHeatCells();
    drawGravityCells();
    drawRepelCells();
    drawAttractCells();
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
    deleterCells = deleterCells.filter(del => !(del.x === x && del.y === y));
    pushableBlocks = pushableBlocks.filter(block => !(block.x === x && block.y === y));
    teleporters = teleporters.filter(tele => !(tele.x === x && tele.y === y));
    speedReducers = speedReducers.filter(speedReducer => !(speedReducer.x === x && speedReducer.y === y));
    speedBoosters = speedBoosters.filter(speedBooster => !(speedBooster.x === x && speedBooster.y === y));
    shrinkCells = shrinkCells.filter(shrinkCell => !(shrinkCell.x === x && shrinkCell.y === y));
    growCells = growCells.filter(growCell => !(growCell.x === x && growCell.y === y));
    freezeCells = freezeCells.filter(freezeCell => !(freezeCell.x === x && freezeCell.y === y));
    heatCells = heatCells.filter(heatCell => !(heatCell.x === x && heatCell.y === y));
    gravityCells = gravityCells.filter(gravityCell => !(gravityCell.x === x && gravityCell.y === y));
    repelCells = repelCells.filter(repelCell => !(repelCell.x === x && repelCell.y === y));
    attractCells = attractCells.filter(attractCell => !(attractCell.x === x && attractCell.y === y));
    movingCells = movingCells.filter(cell => !(cell.x === x && cell.y === y));
    drawGrid();
    drawMovingCells();
    drawDuplicators();
    drawRotators();
    drawBlockers();
    drawDeleterCells();
    drawPushableBlocks();
    drawTeleporters();
    drawSpeedReducers();
    drawSpeedBoosters();
    drawShrinkCells();
    drawGrowCells();
    drawFreezeCells();
    drawHeatCells();
    drawGravityCells();
    drawRepelCells();
    drawAttractCells();
    drawPreviewCell();
});

duplicators.push({ x: Math.floor(Math.random() * cols), y: Math.floor(Math.random() * rows) });
rotators.push({ x: Math.floor(Math.random() * cols), y: Math.floor(Math.random() * rows) });

gameLoop();
