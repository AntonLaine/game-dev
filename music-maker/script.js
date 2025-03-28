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

// Audio processing (for piano reverb)
let masterGain = audioContext.createGain();
let reverbNode = null;

// Creates a convolver node for piano reverb
async function setupReverb() {
    reverbNode = audioContext.createConvolver();
    try {
        // Fetch a reverb impulse response
        const response = await fetch('https://www.mediafire.com/file/ameenw9a8jnk29l/impulse.mp3/file');
        const arrayBuffer = await response.arrayBuffer();
        reverbNode.buffer = await audioContext.decodeAudioData(arrayBuffer);
        
        masterGain.connect(reverbNode);
        reverbNode.connect(audioContext.destination);
        masterGain.connect(audioContext.destination); // Direct connection for dry signal
    } catch (e) {
        console.error("Could not load reverb:", e);
        // Fallback to direct output if loading reverb fails
        masterGain.connect(audioContext.destination);
    }
}

// Initialize audio processing
masterGain.gain.value = 1.0;
masterGain.connect(audioContext.destination);
setupReverb().catch(e => console.error("Failed to set up reverb:", e));

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

// Music theory data for text-to-music conversion
const scales = {
    'major': ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
    'minor': ['C', 'D', 'Eb', 'F', 'G', 'Ab', 'Bb'],
    'pentatonic': ['C', 'D', 'E', 'G', 'A'],
    'blues': ['C', 'Eb', 'F', 'F#', 'G', 'Bb']
};

// Store lyrics data
const lyrics = [];

// Convert note names to frequencies (expanded range)
const noteFrequencies = {
    'A1': 55.00, 'Bb1': 58.27, 'B1': 61.74,
    'C2': 65.41, 'C#2': 69.30, 'D2': 73.42, 'Eb2': 77.78, 'E2': 82.41, 
    'F2': 87.31, 'F#2': 92.50, 'G2': 98.00, 'G#2': 103.83, 'A2': 110.00, 
    'Bb2': 116.54, 'B2': 123.47,
    'C3': 130.81, 'C#3': 138.59, 'D3': 146.83, 'Eb3': 155.56, 'E3': 164.81, 
    'F3': 174.61, 'F#3': 185.00, 'G3': 196.00, 'G#3': 207.65, 'A3': 220.00, 
    'Bb3': 233.08, 'B3': 246.94,
    'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'Eb4': 311.13, 'E4': 329.63, 
    'F4': 349.23, 'F#4': 369.99, 'G4': 392.00, 'G#4': 415.30, 'A4': 440.00, 
    'Bb4': 466.16, 'B4': 493.88,
    'C5': 523.25, 'C#5': 554.37, 'D5': 587.33, 'Eb5': 622.25, 'E5': 659.25, 
    'F5': 698.46, 'F#5': 739.99, 'G5': 783.99, 'G#5': 830.61, 'A5': 880.00, 
    'Bb5': 932.33, 'B5': 987.77,
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

// New UI elements
const melodyText = document.getElementById('melody-text');
const melodyScale = document.getElementById('melody-scale');
const melodyInstrument = document.getElementById('melody-instrument');
const generateMelodyBtn = document.getElementById('generate-melody-btn');
const lyricsText = document.getElementById('lyrics-text');
const voiceSelect = document.getElementById('voice-select');
const addLyricsBtn = document.getElementById('add-lyrics-btn');
const lyricsMarkers = document.getElementById('lyrics-markers');

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
    document.querySelectorAll(`.cell[data-instrument="${currentInstrument}"]`).forEach(cell => {
        const beat = parseInt(cell.dataset.beat);
        const noteIndex = instruments[currentInstrument].notes.indexOf(cell.dataset.note);
        
        // Only show cells that are in the visible range and belong to the current instrument
        if (beat >= startBeat && beat < endBeat && noteIndex !== -1) {
            cell.style.display = 'block';
        } else {
            cell.style.display = 'none';
        }
    });

    // Update lyrics markers visibility
    updateLyricsMarkersVisibility(startBeat, endBeat);
    
    // Update current bar display
    currentBarDisplay.textContent = currentBarStart + 1;
}

// Update lyrics markers visibility
function updateLyricsMarkersVisibility(startBeat, endBeat) {
    document.querySelectorAll('.lyric-marker-timeline').forEach(marker => {
        const beat = parseInt(marker.dataset.beat);
        marker.style.display = (beat >= startBeat && beat < endBeat) ? 'block' : 'none';
        
        // Position the marker horizontally based on its beat
        if (marker.style.display !== 'none') {
            const beatNumber = document.querySelector(`.beat-number[data-beat="${beat}"]`);
            if (beatNumber) {
                const rect = beatNumber.getBoundingClientRect();
                const gridRect = beatNumbersContainer.getBoundingClientRect();
                const offsetLeft = rect.left - gridRect.left + rect.width / 2;
                marker.style.left = `${offsetLeft}px`;
            }
        }
    });
}

// Create the grid for a specific instrument
function createInstrumentGrid(instrumentName) {
    const notes = instruments[instrumentName].notes;
    
    // Create the cells for this instrument
    for (let i = 0; i < notes.length; i++) {
        for (let j = 0; j < totalBars * beatsPerBar; j++) {
            // Check if this cell already exists
            const existingCell = document.querySelector(`.cell[data-note="${notes[i]}"][data-beat="${j}"][data-instrument="${instrumentName}"]`);
            
            if (!existingCell) {
                const cell = document.createElement('div');
                cell.classList.add('cell', instrumentName);
                cell.dataset.note = notes[i];
                cell.dataset.beat = j;
                cell.dataset.instrument = instrumentName;
                
                // Add drag functionality
                cell.addEventListener('mousedown', handleCellClick);
                cell.addEventListener('mouseover', handleCellDrag);
                
                // Hide cells that are not for the current instrument
                cell.style.display = instrumentName === currentInstrument ? 'block' : 'none';
                musicGrid.appendChild(cell);
            }
        }
    }
}

// Create all instruments' grids
function setupAllInstruments() {
    // Create grids for all instruments
    Object.keys(instruments).forEach(instrumentName => {
        createInstrumentGrid(instrumentName);
    });
}

// Create the note labels for the current instrument
function createNoteLabels() {
    noteLabelsContainer.innerHTML = '';
    const notes = instruments[currentInstrument].notes;
    
    notes.forEach(note => {
        const noteLabel = document.createElement('div');
        noteLabel.classList.add('note-label');
        noteLabel.textContent = note;
        noteLabelsContainer.appendChild(noteLabel);
    });
}

// Initialize the app with the appropriate grids and UI
function initializeApp() {
    // Create beat indicators
    createBeatIndicators();
    
    // Create initial grid for the current instrument (synth)
    createNoteLabels();
    updateGridColumns();
    
    // Create grids for all instruments
    setupAllInstruments();
    
    // Set the visible range
    updateVisibleBeats();

    // Populate voice options for text-to-speech
    populateVoiceList();
}

// Populate voice list for text-to-speech
function populateVoiceList() {
    // Clear existing options
    voiceSelect.innerHTML = '';
    
    // Check if browser supports Speech Synthesis
    if ('speechSynthesis' in window) {
        const voices = window.speechSynthesis.getVoices();
        
        // Add default option
        const defaultOption = document.createElement('option');
        defaultOption.value = 'default';
        defaultOption.textContent = 'Default Voice';
        voiceSelect.appendChild(defaultOption);
        
        // Add available voices
        voices.forEach((voice, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = `${voice.name} (${voice.lang})`;
            voiceSelect.appendChild(option);
        });
        
        // If no voices are initially available, listen for voiceschanged event
        if (voices.length === 0) {
            speechSynthesis.addEventListener('voiceschanged', () => {
                const updatedVoices = speechSynthesis.getVoices();
                updatedVoices.forEach((voice, index) => {
                    const option = document.createElement('option');
                    option.value = index;
                    option.textContent = `${voice.name} (${voice.lang})`;
                    voiceSelect.appendChild(option);
                });
            });
        }
    } else {
        // Browser doesn't support speech synthesis
        const option = document.createElement('option');
        option.value = 'not-supported';
        option.textContent = 'Text-to-Speech not supported';
        option.disabled = true;
        voiceSelect.appendChild(option);
        
        // Disable the add lyrics button
        addLyricsBtn.disabled = true;
    }
}

// Drag state
let isDragging = false;
let isActivating = false;

function handleCellClick(e) {
    isDragging = true;
    isActivating = !e.target.classList.contains('active');
    e.target.classList.toggle('active');
    
    // Ensure AudioContext is running (needed for Safari/iOS)
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
    
    // Play the note when clicked
    if (isActivating) {
        playNote(e.target.dataset.note, e.target.dataset.instrument);
    }
}

function handleCellDrag(e) {
    if (!isDragging) return;
    
    // If we're activating cells, only make them active.
    // If we're deactivating, only make them inactive.
    if (isActivating && !e.target.classList.contains('active')) {
        e.target.classList.add('active');
        // Play the note when drawing
        playNote(e.target.dataset.note, e.target.dataset.instrument);
    } else if (!isActivating && e.target.classList.contains('active')) {
        e.target.classList.remove('active');
    }
}

// Enhanced piano sound with layered oscillators and better envelope
function playPianoNote(note) {
    // Create nodes for a more complex piano sound
    const fundamental = audioContext.createOscillator();
    const overtone1 = audioContext.createOscillator();
    const overtone2 = audioContext.createOscillator();
    
    // Main gain node
    const gainNode = audioContext.createGain();
    
    // Filter for warm piano sound
    const filter = audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 5000;
    filter.Q.value = 1;
    
    // Set oscillator frequencies
    const baseFreq = noteFrequencies[note];
    fundamental.type = 'triangle';
    fundamental.frequency.value = baseFreq;
    
    overtone1.type = 'sine';
    overtone1.frequency.value = baseFreq * 2.0; // One octave up
    
    overtone2.type = 'sine';
    overtone2.frequency.value = baseFreq * 1.01; // Slight detuning for chorus effect
    
    // Set relative volumes
    const fundamentalGain = audioContext.createGain();
    const overtone1Gain = audioContext.createGain();
    const overtone2Gain = audioContext.createGain();
    
    fundamentalGain.gain.value = 0.6 * volume;
    overtone1Gain.gain.value = 0.2 * volume;
    overtone2Gain.gain.value = 0.15 * volume;
    
    // Piano-like envelope
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 0.004);
    gainNode.gain.linearRampToValueAtTime(volume * 0.8, audioContext.currentTime + 0.1);
    gainNode.gain.setValueAtTime(volume * 0.8, audioContext.currentTime + 0.2);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 1.5);
    
    // Connect oscillators to individual gain nodes
    fundamental.connect(fundamentalGain);
    overtone1.connect(overtone1Gain);
    overtone2.connect(overtone2Gain);
    
    // Connect all gain nodes to the filter
    fundamentalGain.connect(filter);
    overtone1Gain.connect(filter);
    overtone2Gain.connect(filter);
    
    // Connect filter to main gain node
    filter.connect(gainNode);
    
    // Connect to master gain (which handles reverb)
    gainNode.connect(masterGain);
    
    // Start oscillators
    fundamental.start();
    overtone1.start();
    overtone2.start();
    
    fundamental.stop(audioContext.currentTime + 1.5);
    overtone1.stop(audioContext.currentTime + 1.5);
    overtone2.stop(audioContext.currentTime + 1.5);
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
    // Check if the note frequency exists
    if (!noteFrequencies[note]) {
        console.error(`Note frequency not found for: ${note}`);
        return;
    }
    
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

// Speak lyrics at the given beat
function speakLyric(text, voiceIndex) {
    if (!('speechSynthesis' in window)) {
        console.error("Speech synthesis not supported");
        return;
    }
    
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Set voice if specified
    if (voiceIndex !== 'default') {
        const voices = speechSynthesis.getVoices();
        if (voices[voiceIndex]) {
            utterance.voice = voices[voiceIndex];
        }
    }
    
    speechSynthesis.speak(utterance);
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
    
    // Check for lyrics at this beat
    const lyricMarkers = document.querySelectorAll(`.lyric-marker-timeline[data-beat="${currentBeat}"]`);
    lyricMarkers.forEach(marker => {
        speakLyric(marker.textContent, marker.dataset.voice);
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
    
    // Stop any speech synthesis
    if ('speechSynthesis' in window) {
        speechSynthesis.cancel();
    }
    
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
    
    // Add new cells for all instruments
    Object.keys(instruments).forEach(instrumentName => {
        const notes = instruments[instrumentName].notes;
        const currentBeatCount = document.querySelectorAll(`.cell[data-instrument="${instrumentName}"][data-note="${notes[0]}"]`).length;
        
        // Only add new cells if needed
        if (currentBeatCount < totalBars * beatsPerBar) {
            for (let i = 0; i < notes.length; i++) {
                for (let j = currentBeatCount / notes.length; j < totalBars * beatsPerBar; j++) {
                    const cell = document.createElement('div');
                    cell.classList.add('cell', instrumentName);
                    cell.dataset.note = notes[i];
                    cell.dataset.beat = j;
                    cell.dataset.instrument = instrumentName;
                    
                    cell.addEventListener('mousedown', handleCellClick);
                    cell.addEventListener('mouseover', handleCellDrag);
                    
                    cell.style.display = (instrumentName === currentInstrument) ? 'block' : 'none';
                    musicGrid.appendChild(cell);
                }
            }
        }
    });
    
    updateVisibleBeats();
}

// Generate melody from text
function generateMelodyFromText() {
    const text = melodyText.value.trim();
    if (!text) {
        alert("Please enter some text to convert to melody.");
        return;
    }
    
    const selectedScale = melodyScale.value;
    const selectedInstrument = melodyInstrument.value;
    
    // Change to the selected instrument
    changeInstrument(selectedInstrument);
    
    // Get available notes for the selected instrument
    const availableNotes = instruments[selectedInstrument].notes;
    
    // Set some melody generation parameters
    const scaleNotes = scales[selectedScale];
    
    // Convert text to a sequence of numbers
    const charCodes = Array.from(text.replace(/\s+/g, ' ')).map(char => char.charCodeAt(0));
    
    // Clear existing notes (optionally)
    if (confirm("Clear existing notes before generating melody?")) {
        clearGrid();
    }
    
    // Create array of start positions for words
    const words = text.split(/\s+/);
    let beatPosition = currentBarStart * beatsPerBar;
    
    // Generate melody from character codes
    words.forEach((word) => {
        const wordChars = Array.from(word);
        
        // For each character in the word, place a note
        wordChars.forEach((char, index) => {
            const charCode = char.charCodeAt(0);
            
            // Map char code to scale note (using modulo to stay within scale)
            const noteIndex = charCode % scaleNotes.length;
            const scaleDegree = scaleNotes[noteIndex];
            
            // Map scale note to available instrument notes
            // Find notes containing the scale degree
            const matchingNotes = availableNotes.filter(note => note.startsWith(scaleDegree));
            
            if (matchingNotes.length > 0) {
                // Pick a note based on the character's position in the word
                const selectedNote = matchingNotes[index % matchingNotes.length];
                
                // Find the cell for this note and beat
                const cell = document.querySelector(
                    `.cell[data-note="${selectedNote}"][data-beat="${beatPosition}"][data-instrument="${selectedInstrument}"]`
                );
                
                // If cell exists, activate it
                if (cell) {
                    cell.classList.add('active');
                    beatPosition++;
                    
                    // Don't go beyond grid bounds
                    if (beatPosition >= totalBars * beatsPerBar) {
                        // Add more bars if we need them
                        addBars();
                    }
                }
            } else {
                // No matching note found, just advance the beat
                beatPosition++;
            }
        });
        
        // Add a small gap between words
        beatPosition++;
    });
    
    // Update the view to show the newly created melody
    updateVisibleBeats();
    
    alert("Melody generated from text! Press Play to hear it.");
}

// Add lyrics from text
function addLyricsFromText() {
    const lyricsStr = lyricsText.value.trim();
    if (!lyricsStr) {
        alert("Please enter some lyrics text.");
        return;
    }
    
    // Get selected voice
    const selectedVoice = voiceSelect.value;
    
    // Split lyrics into words/phrases
    const lyricPhrases = lyricsStr.split(/[.,;:!?]|\n/).filter(phrase => phrase.trim().length > 0);
    
    // Create UI elements for each phrase
    lyricsMarkers.innerHTML = ''; // Clear existing markers
    
    lyricPhrases.forEach((phrase, index) => {
        phrase = phrase.trim();
        if (phrase.length === 0) return;
        
        const markerEl = document.createElement('div');
        markerEl.classList.add('lyric-marker');
        markerEl.textContent = phrase;
        markerEl.dataset.index = index;
        markerEl.dataset.voice = selectedVoice;
        
        // Make the marker draggable onto the timeline
        markerEl.draggable = true;
        
        markerEl.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', JSON.stringify({
                text: phrase,
                voice: selectedVoice
            }));
        });
        
        lyricsMarkers.appendChild(markerEl);
    });
    
    // Make the beat indicator area a drop target
    makeBeatIndicatorDropTarget();
}

// Set up beat indicator as a drop target for lyrics
function makeBeatIndicatorDropTarget() {
    const beatIndicator = document.querySelector('.beat-indicator');
    
    beatIndicator.addEventListener('dragover', (e) => {
        e.preventDefault(); // Allow drop
    });
    
    beatIndicator.addEventListener('drop', (e) => {
        e.preventDefault();
        
        // Get the lyric data
        const data = JSON.parse(e.dataTransfer.getData('text/plain'));
        
        // Calculate which beat was the drop target
        const beatIndicatorRect = beatIndicator.getBoundingClientRect();
        const dropX = e.clientX - beatIndicatorRect.left;
        
        // Find the closest beat number
        let closestBeat = null;
        let minDistance = Infinity;
        
        document.querySelectorAll('.beat-number').forEach(beatEl => {
            if (beatEl.style.display !== 'none') {
                const rect = beatEl.getBoundingClientRect();
                const beatCenterX = rect.left + rect.width / 2 - beatIndicatorRect.left;
                const distance = Math.abs(dropX - beatCenterX);
                
                if (distance < minDistance) {
                    minDistance = distance;
                    closestBeat = parseInt(beatEl.dataset.beat);
                }
            }
        });
        
        if (closestBeat !== null) {
            // Create a lyric marker on the timeline
            createLyricTimelineMarker(data.text, closestBeat, data.voice);
        }
    });
}

// Create a lyric marker on the timeline
function createLyricTimelineMarker(text, beat, voice) {
    // Check if there's already a marker at this beat
    const existingMarker = document.querySelector(`.lyric-marker-timeline[data-beat="${beat}"]`);
    if (existingMarker) {
        // Update the existing marker
        existingMarker.textContent = text;
        existingMarker.dataset.voice = voice;
        return;
    }
    
    // Create a new marker
    const marker = document.createElement('div');
    marker.classList.add('lyric-marker-timeline');
    marker.textContent = text;
    marker.dataset.beat = beat;
    marker.dataset.voice = voice;
    
    // Make it removable with a click
    marker.addEventListener('click', () => {
        if (confirm(`Remove lyric "${text}"?`)) {
            marker.remove();
        }
    });
    
    // Add the marker to the beat indicator
    document.querySelector('.beat-indicator').appendChild(marker);
    
    // Position the marker
    const beatElement = document.querySelector(`.beat-number[data-beat="${beat}"]`);
    if (beatElement) {
        const rect = beatElement.getBoundingClientRect();
        const beatIndicatorRect = document.querySelector('.beat-indicator').getBoundingClientRect();
        const offsetLeft = rect.left - beatIndicatorRect.left + rect.width / 2;
        marker.style.left = `${offsetLeft}px`;
    }
    
    // Store the lyric in our data model
    lyrics.push({
        text: text,
        beat: beat,
        voice: voice
    });
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
    
    // Collect lyrics data
    const savedLyrics = [];
    document.querySelectorAll('.lyric-marker-timeline').forEach(marker => {
        savedLyrics.push({
            text: marker.textContent,
            beat: parseInt(marker.dataset.beat),
            voice: marker.dataset.voice
        });
    });
    
    const savedPatterns = JSON.parse(localStorage.getItem('musicMakerPatterns') || '{}');
    savedPatterns[name] = {
        pattern,
        tempo,
        waveType,
        totalBars,
        currentInstrument,
        lyrics: savedLyrics
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
    document.querySelectorAll('.cell.active').forEach(cell => {
        cell.classList.remove('active');
    });
    
    // Clear current lyrics
    document.querySelectorAll('.lyric-marker-timeline').forEach(marker => {
        marker.remove();
    });
    
    // Set tempo and wave type
    tempo = patternData.tempo || 120;
    tempoSlider.value = tempo;
    tempoValue.textContent = tempo;
    
    waveType = patternData.waveType || 'sine';
    waveTypeSelect.value = waveType;
    
    // Set total bars
    totalBars = patternData.totalBars || 4;
    updateGridColumns();
    
    // Switch to saved instrument if available
    if (patternData.currentInstrument) {
        changeInstrument(patternData.currentInstrument);
    }
    
    // Create required beat indicators
    createBeatIndicators();
    
    // Ensure we have enough cells for all instruments
    setupAllInstruments();
    
    // Load pattern
    patternData.pattern.forEach(note => {
        // Find the cell that matches this note
        const cell = document.querySelector(
            `.cell[data-note="${note.note}"][data-beat="${note.beat}"][data-instrument="${note.instrument || 'synth'}"]`
        );
        
        // If found, activate it
        if (cell) {
            cell.classList.add('active');
        }
    });
    
    // Load lyrics if they exist
    if (patternData.lyrics && Array.isArray(patternData.lyrics)) {
        patternData.lyrics.forEach(lyric => {
            createLyricTimelineMarker(lyric.text, lyric.beat, lyric.voice);
        });
    }
    
    patternNameInput.value = name;
    updateVisibleBeats();
    alert(`Pattern "${name}" loaded!`);
}

// Change instrument
function changeInstrument(instrumentName) {
    if (!instruments[instrumentName]) {
        console.error(`Instrument ${instrumentName} not found`);
        return;
    }
    
    currentInstrument = instrumentName;
    
    // Update UI
    instrumentSelectors.forEach(selector => {
        if (selector.dataset.instrument === instrumentName) {
            selector.classList.add('active');
        } else {
            selector.classList.remove('active');
        }
    });
    
    // Update note labels for the new instrument
    createNoteLabels();
    
    // Hide all cells, then show only those for the current instrument
    document.querySelectorAll('.cell').forEach(cell => {
        if (cell.dataset.instrument === currentInstrument) {
            const noteIndex = instruments[currentInstrument].notes.indexOf(cell.dataset.note);
            const beatIndex = parseInt(cell.dataset.beat);
            const startBeat = currentBarStart * beatsPerBar;
            const endBeat = startBeat + (beatsPerBar * 4);
            
            // Only show notes that exist in the current instrument and are in the visible range
            if (noteIndex !== -1 && beatIndex >= startBeat && beatIndex < endBeat) {
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
generateMelodyBtn.addEventListener('click', generateMelodyFromText);
addLyricsBtn.addEventListener('click', addLyricsFromText);

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

// Initialize the document when it's ready
document.addEventListener('DOMContentLoaded', () => {
    // Initialize everything
    initializeApp();
    
    // Add mouseup listener to document for drag operations
    document.addEventListener('mouseup', () => {
        isDragging = false;
    });
});
