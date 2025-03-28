// Audio setup
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
let isPlaying = false;
let currentBeat = 0;
let tempo = 120;
let intervalId = null;
let waveType = 'sine';
let volume = 0.5;
let currentInstrument = 'synth';
let currentBarStart = 0; // Starting bar for viewing
let totalBars = 4; // Default number of bars

// Instruments configuration
const instruments = {
    'synth': {
        type: 'oscillator',
        waveform: 'sine',
        color: '#1db954',
        notes: [
            'A5', 'G5', 'E5', 'D5', 'C5',
            'A4', 'G4', 'E4', 'D4', 'C4', 
            'A3', 'G3', 'E3', 'D3', 'C3'
        ]
    },
    'piano': {
        type: 'oscillator',
        waveform: 'triangle',
        color: '#1e88e5',
        notes: [
            'C6', 'B5', 'A5', 'G5', 'F5', 'E5', 'D5', 'C5',
            'B4', 'A4', 'G4', 'F4', 'E4', 'D4', 'C4',
            'B3', 'A3', 'G3', 'F3', 'E3', 'D3', 'C3'
        ]
    },
    'bass': {
        type: 'oscillator',
        waveform: 'sawtooth',
        color: '#d81b60',
        notes: [
            'E3', 'D3', 'C3', 'B2', 'A2', 'G2', 'F2', 'E2', 'D2', 'C2', 'B1', 'A1'
        ]
    }
};

// Convert note names to frequencies (expanded range)
const noteFrequencies = {
    'A1': 55.00, 'B1': 61.74,
    'C2': 65.41, 'D2': 73.42, 'E2': 82.41, 'F2': 87.31, 'G2': 98.00, 'A2': 110.00, 'B2': 123.47,
    'C3': 130.81, 'D3': 146.83, 'E3': 164.81, 'F3': 174.61, 'G3': 196.00, 'A3': 220.00, 'B3': 246.94,
    'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23, 'G4': 392.00, 'A4': 440.00, 'B4': 493.88,
    'C5': 523.25, 'D5': 587.33, 'E5': 659.25, 'F5': 698.46, 'G5': 783.99, 'A5': 880.00, 'B5': 987.77,
    'C6': 1046.50
};

// Number of beats per bar
const beatsPerBar = 16;

// DOM Elements
const musicGrid = document.getElementById('music-grid');
const noteLabelsContainer = document.querySelector('.note-labels');
const beatNumbersContainer = document.querySelector('.beat-numbers');
const playBtn = document.getElementById('play-btn');
const stopBtn = document.getElementById('stop-btn');
const clearBtn = document.getElementById('clear-btn');
const saveBtn = document.getElementById('save-btn');
const loadBtn = document.getElementById('load-btn');
const addBarsBtn = document.getElementById('add-bars-btn');
const patternNameInput = document.getElementById('pattern-name');
const tempoSlider = document.getElementById('tempo');
const tempoValue = document.getElementById('tempo-value');
const waveTypeSelect = document.getElementById('wave-type');
const volumeSlider = document.getElementById('volume');
const scrollLeftBtn = document.getElementById('scroll-left');
const scrollRightBtn = document.getElementById('scroll-right');
const currentBarDisplay = document.getElementById('current-bar');
const instrumentSelectors = document.querySelectorAll('.instrument');

// Update grid columns based on total bars
function updateGridColumns() {
    const totalBeats = totalBars * beatsPerBar;
    musicGrid.style.gridTemplateColumns = `repeat(${totalBeats}, 40px)`;
}

// Create beat indicators
function createBeatIndicators() {
    beatNumbersContainer.innerHTML = '';
    for (let i = 0; i < totalBars * beatsPerBar; i++) {
        const beatNumber = document.createElement('div');
        beatNumber.classList.add('beat-number');
        beatNumber.textContent = (i % beatsPerBar) + 1;
        beatNumber.dataset.beat = i;
        
        // Mark the start of each bar
        if (i % beatsPerBar === 0) {
            beatNumber.classList.add('bar-start');
        }
        
        beatNumbersContainer.appendChild(beatNumber);
    }
}

// Update visible beat range
function updateVisibleBeats() {
    const startBeat = currentBarStart * beatsPerBar;
    const endBeat = startBeat + (beatsPerBar * 4); // Show 4 bars at a time
    
    // Update beat numbers visibility
    document.querySelectorAll('.beat-number').forEach(beatNum => {
        const beat = parseInt(beatNum.dataset.beat);
        beatNum.style.display = (beat >= startBeat && beat < endBeat) ? 'flex' : 'none';
    });
    
    // Update grid cells visibility
    document.querySelectorAll('.cell').forEach(cell => {
        const beat = parseInt(cell.dataset.beat);
        cell.style.display = (beat >= startBeat && beat < endBeat) ? 'block' : 'none';
    });
    
    // Update current bar display
    currentBarDisplay.textContent = currentBarStart + 1;
}

// Create the grid
function createGrid() {
    // Create note labels for all instruments
    const activeNotes = instruments[currentInstrument].notes;
    noteLabelsContainer.innerHTML = '';
    
    activeNotes.forEach(note => {
        const noteLabel = document.createElement('div');
        noteLabel.classList.add('note-label');
        noteLabel.textContent = note;
        noteLabelsContainer.appendChild(noteLabel);
    });
    
    // Create beat indicators
    createBeatIndicators();
    
    // Clear existing grid
    musicGrid.innerHTML = '';
    
    // Create the cells
    for (let i = 0; i < activeNotes.length; i++) {
        for (let j = 0; j < totalBars * beatsPerBar; j++) {
            const cell = document.createElement('div');
            cell.classList.add('cell', currentInstrument);
            cell.dataset.note = activeNotes[i];
            cell.dataset.beat = j;
            cell.dataset.instrument = currentInstrument;
            
            // Add drag functionality
            cell.addEventListener('mousedown', handleCellClick);
            cell.addEventListener('mouseover', handleCellDrag);
            
            musicGrid.appendChild(cell);
        }
    }
    
    // Set initial visible range
    updateVisibleBeats();
    
    // Initialize drag state
    document.addEventListener('mouseup', () => isDragging = false);
}

// Drag state
let isDragging = false;
let isActivating = false;

function handleCellClick(e) {
    isDragging = true;
    isActivating = !e.target.classList.contains('active');
    e.target.classList.toggle('active');
}

function handleCellDrag(e) {
    if (!isDragging) return;
    
    // If we're activating cells, only make them active.
    // If we're deactivating, only make them inactive.
    if (isActivating && !e.target.classList.contains('active')) {
        e.target.classList.add('active');
    } else if (!isActivating && e.target.classList.contains('active')) {
        e.target.classList.remove('active');
    }
}

// Piano sound (uses more complex envelope for better piano sound)
function playPianoNote(note) {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.type = 'triangle';
    oscillator.frequency.value = noteFrequencies[note];
    
    // Quick attack, slower decay for piano-like sound
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 0.005);
    gainNode.gain.linearRampToValueAtTime(volume * 0.6, audioContext.currentTime + 0.1);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 1.5);
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 1.5);
}

// Bass sound (uses lower notes and longer sustain)
function playBassNote(note) {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    const filter = audioContext.createBiquadFilter();
    
    oscillator.type = 'sawtooth';
    oscillator.frequency.value = noteFrequencies[note];
    
    filter.type = 'lowpass';
    filter.frequency.value = 1000;
    filter.Q.value = 5;
    
    // Slower attack, longer sustain for bass-like sound
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 0.02);
    gainNode.gain.linearRampToValueAtTime(volume * 0.8, audioContext.currentTime + 0.3);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 2.0);
    
    oscillator.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 2.0);
}

// Synth sound (original implementation)
function playSynthNote(note) {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.type = waveType;
    oscillator.frequency.value = noteFrequencies[note];
    
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 0.01);
    gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.3);
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.3);
}

// Play note based on instrument type
function playNote(note, instrumentType) {
    switch(instrumentType) {
        case 'piano':
            playPianoNote(note);
            break;
        case 'bass':
            playBassNote(note);
            break;
        default:
            playSynthNote(note);
    }
}

// Play a beat
function playBeat() {
    // Reset previous beat
    document.querySelectorAll(`.cell.playing`).forEach(cell => {
        cell.classList.remove('playing');
    });
    
    document.querySelectorAll(`.beat-number`).forEach(beat => {
        beat.classList.remove('active');
    });
    
    // Highlight current beat number
    const beatNumber = document.querySelector(`.beat-number[data-beat="${currentBeat}"]`);
    if (beatNumber) beatNumber.classList.add('active');
    
    // Make sure visible area follows playback
    if (currentBeat >= (currentBarStart + 4) * beatsPerBar || currentBeat < currentBarStart * beatsPerBar) {
        currentBarStart = Math.floor(currentBeat / beatsPerBar);
        updateVisibleBeats();
    }
    
    // Play current beat for all instruments
    const activeCells = document.querySelectorAll(`.cell[data-beat="${currentBeat}"].active`);
    activeCells.forEach(cell => {
        cell.classList.add('playing');
        playNote(cell.dataset.note, cell.dataset.instrument);
    });
    
    currentBeat = (currentBeat + 1) % (totalBars * beatsPerBar);
}

// Start playing
function startPlaying() {
    if (isPlaying) return;
    
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
    
    isPlaying = true;
    
    // Calculate interval in milliseconds based on tempo (BPM)
    const interval = (60 / tempo) * 1000 / 4; // Sixteenth notes
    
    intervalId = setInterval(playBeat, interval);
    
    // Change play button to pause
    playBtn.innerHTML = '⏸ Pause';
}

// Stop playing
function stopPlaying() {
    if (!isPlaying) return;
    
    clearInterval(intervalId);
    isPlaying = false;
    
    // Reset UI
    document.querySelectorAll('.cell.playing').forEach(cell => {
        cell.classList.remove('playing');
    });
    
    document.querySelectorAll('.beat-number.active').forEach(beat => {
        beat.classList.remove('active');
    });
    
    // Change button back to play
    playBtn.innerHTML = '▶ Play';
}

// Clear the grid
function clearGrid() {
    if (confirm('Are you sure you want to clear all notes?')) {
        document.querySelectorAll('.cell.active').forEach(cell => {
            cell.classList.remove('active');
        });
    }
}

// Add 4 more bars
function addBars() {
    totalBars += 4;
    updateGridColumns();
    createBeatIndicators();
    
    // Add new cells for added beats
    const activeNotes = instruments[currentInstrument].notes;
    const currentBeatCount = musicGrid.querySelectorAll(`.cell[data-note="${activeNotes[0]}"]`).length;
    const newBeatsNeeded = totalBars * beatsPerBar - currentBeatCount;
    
    if (newBeatsNeeded > 0) {
        for (let i = 0; i < activeNotes.length; i++) {
            for (let j = currentBeatCount; j < totalBars * beatsPerBar; j++) {
                const cell = document.createElement('div');
                cell.classList.add('cell', currentInstrument);
                cell.dataset.note = activeNotes[i];
                cell.dataset.beat = j;
                cell.dataset.instrument = currentInstrument;
                
                cell.addEventListener('mousedown', handleCellClick);
                cell.addEventListener('mouseover', handleCellDrag);
                
                musicGrid.appendChild(cell);
            }
        }
    }
    
    updateVisibleBeats();
}

// Save pattern to localStorage
function savePattern() {
    const name = patternNameInput.value.trim() || `Pattern ${Date.now()}`;
    const pattern = [];
    
    document.querySelectorAll('.cell.active').forEach(cell => {
        pattern.push({
            note: cell.dataset.note,
            beat: parseInt(cell.dataset.beat),
            instrument: cell.dataset.instrument
        });
    });
    
    const savedPatterns = JSON.parse(localStorage.getItem('musicMakerPatterns') || '{}');
    savedPatterns[name] = {
        pattern,
        tempo,
        waveType,
        totalBars
    };
    
    localStorage.setItem('musicMakerPatterns', JSON.stringify(savedPatterns));
    
    alert(`Pattern "${name}" saved!`);
}

// Load pattern from localStorage
function loadPattern() {
    const savedPatterns = JSON.parse(localStorage.getItem('musicMakerPatterns') || '{}');
    const name = patternNameInput.value.trim();
    
    if (!name || !savedPatterns[name]) {
        const patterns = Object.keys(savedPatterns);
        if (patterns.length === 0) {
            alert('No saved patterns found.');
            return;
        }
        
        const patternList = patterns.join('\n');
        const selectedPattern = prompt(`Enter the name of the pattern to load:\n\nAvailable patterns:\n${patternList}`);
        
        if (!selectedPattern || !savedPatterns[selectedPattern]) {
            alert('Pattern not found.');
            return;
        }
        
        loadPatternData(savedPatterns[selectedPattern], selectedPattern);
    } else {
        loadPatternData(savedPatterns[name], name);
    }
}

// Load pattern data
function loadPatternData(patternData, name) {
    // Clear current pattern
    clearGrid();
    
    // Set tempo and wave type
    tempo = patternData.tempo || 120;
    tempoSlider.value = tempo;
    tempoValue.textContent = tempo;
    
    waveType = patternData.waveType || 'sine';
    waveTypeSelect.value = waveType;
    
    // Set total bars
    totalBars = patternData.totalBars || 4;
    updateGridColumns();
    createBeatIndicators();
    
    // Ensure we have enough cells for all instruments
    setupAllInstruments();
    
    // Load pattern
    patternData.pattern.forEach(note => {
        const cell = document.querySelector(`.cell[data-note="${note.note}"][data-beat="${note.beat}"][data-instrument="${note.instrument || 'synth'}"]`);
        if (cell) {
            cell.classList.add('active');
        }
    });
    
    patternNameInput.value = name;
    updateVisibleBeats();
    alert(`Pattern "${name}" loaded!`);
}

// Change instrument
function changeInstrument(instrumentName) {
    currentInstrument = instrumentName;
    
    // Update UI
    instrumentSelectors.forEach(selector => {
        if (selector.dataset.instrument === instrumentName) {
            selector.classList.add('active');
        } else {
            selector.classList.remove('active');
        }
    });
    
    // Set up the grid for the new instrument
    setupCurrentInstrument();
    updateVisibleBeats();
}

// Make sure grid is set up for all instruments
function setupAllInstruments() {
    Object.keys(instruments).forEach(instrumentName => {
        const activeNotes = instruments[instrumentName].notes;
        
        // Create the cells
        for (let i = 0; i < activeNotes.length; i++) {
            for (let j = 0; j < totalBars * beatsPerBar; j++) {
                // Check if this cell already exists
                const existingCell = document.querySelector(`.cell[data-note="${activeNotes[i]}"][data-beat="${j}"][data-instrument="${instrumentName}"]`);
                
                if (!existingCell) {
                    const cell = document.createElement('div');
                    cell.classList.add('cell', instrumentName);
                    cell.dataset.note = activeNotes[i];
                    cell.dataset.beat = j;
                    cell.dataset.instrument = instrumentName;
                    
                    cell.addEventListener('mousedown', handleCellClick);
                    cell.addEventListener('mouseover', handleCellDrag);
                    
                    cell.style.display = instrumentName === currentInstrument ? 'block' : 'none';
                    musicGrid.appendChild(cell);
                }
            }
        }
    });
}

// Setup grid for current instrument
function setupCurrentInstrument() {
    noteLabelsContainer.innerHTML = '';
    
    const activeNotes = instruments[currentInstrument].notes;
    
    // Create note labels
    activeNotes.forEach(note => {
        const noteLabel = document.createElement('div');
        noteLabel.classList.add('note-label');
        noteLabel.textContent = note;
        noteLabelsContainer.appendChild(noteLabel);
    });
    
    // Hide all instrument cells, then show only the current instrument
    document.querySelectorAll('.cell').forEach(cell => {
        if (cell.dataset.instrument === currentInstrument) {
            const noteIndex = activeNotes.indexOf(cell.dataset.note);
            if (noteIndex !== -1) {
                cell.style.display = 'block';
            } else {
                cell.style.display = 'none';
            }
        } else {
            cell.style.display = 'none';
        }
    });
}

// Event listeners
playBtn.addEventListener('click', () => {
    if (isPlaying) {
        stopPlaying();
    } else {
        startPlaying();
    }
});

stopBtn.addEventListener('click', stopPlaying);
clearBtn.addEventListener('click', clearGrid);
saveBtn.addEventListener('click', savePattern);
loadBtn.addEventListener('click', loadPattern);
addBarsBtn.addEventListener('click', addBars);

// Timeline navigation
scrollLeftBtn.addEventListener('click', () => {
    if (currentBarStart > 0) {
        currentBarStart--;
        updateVisibleBeats();
    }
});

scrollRightBtn.addEventListener('click', () => {
    if (currentBarStart < totalBars - 4) {
        currentBarStart++;
        updateVisibleBeats();
    }
});

// Instrument selectors
instrumentSelectors.forEach(selector => {
    selector.addEventListener('click', () => {
        changeInstrument(selector.dataset.instrument);
    });
});

tempoSlider.addEventListener('input', (e) => {
    tempo = parseInt(e.target.value);
    tempoValue.textContent = tempo;
    
    if (isPlaying) {
        stopPlaying();
        startPlaying();
    }
});

waveTypeSelect.addEventListener('change', (e) => {
    waveType = e.target.value;
});

volumeSlider.addEventListener('input', (e) => {
    volume = parseInt(e.target.value) / 100;
});

// Handle keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Space bar to play/pause
    if (e.code === 'Space') {
        e.preventDefault();
        if (isPlaying) {
            stopPlaying();
        } else {
            startPlaying();
        }
    }
    
    // Escape key to stop
    if (e.key === 'Escape') {
        stopPlaying();
    }
    
    // Left/Right arrows to navigate timeline
    if (e.key === 'ArrowLeft' && !e.ctrlKey) {
        if (currentBarStart > 0) {
            currentBarStart--;
            updateVisibleBeats();
        }
    }
    
    if (e.key === 'ArrowRight' && !e.ctrlKey) {
        if (currentBarStart < totalBars - 4) {
            currentBarStart++;
            updateVisibleBeats();
        }
    }
    
    // Number keys 1-3 to select instruments
    if (e.key === '1') changeInstrument('synth');
    if (e.key === '2') changeInstrument('piano');
    if (e.key === '3') changeInstrument('bass');
});

// Initialize the grid when the page loads
window.addEventListener('load', () => {
    updateGridColumns();
    createGrid();
    setupAllInstruments();
});
