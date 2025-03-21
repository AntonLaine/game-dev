// Utility functions for the game

// Random number between min and max (inclusive)
function randomRange(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Lerp (Linear Interpolation)
function lerp(start, end, amt) {
    return (1 - amt) * start + amt * end;
}

// Distance between two points
function distance(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
}

// Create array of evenly spaced values
function linspace(start, end, num) {
    const result = [];
    const step = (end - start) / (num - 1);
    for (let i = 0; i < num; i++) {
        result.push(start + (step * i));
    }
    return result;
}

// Clamp a value between min and max
function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}
