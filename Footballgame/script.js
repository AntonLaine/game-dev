// Initialize the score variable at the very top of the file
let score = 0;
const scoreDisplay = document.createElement('div');
scoreDisplay.style.cssText = `
    position: absolute;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0,0,0,0.7);
    color: white;
    padding: 10px 20px;
    border-radius: 5px;
    font-family: Arial, sans-serif;
    font-size: 24px;
    font-weight: bold;
    z-index: 100;
`;
scoreDisplay.textContent = "SCORE: 0";
document.body.appendChild(scoreDisplay);

// Set up scene, camera, and renderer
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// Add lights
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(5, 10, 7);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 1024;
directionalLight.shadow.mapSize.height = 1024;
scene.add(directionalLight);

// Pointer lock controls setup
const blocker = document.getElementById('blocker');
const instructions = document.getElementById('instructions');
let isPointerLocked = false;

// Setup pointer lock functionality
const pointerLockChange = function() {
    if (document.pointerLockElement === document.body || 
        document.mozPointerLockElement === document.body || 
        document.webkitPointerLockElement === document.body) {
        isPointerLocked = true;
        blocker.style.display = 'none';
        // Start idle animation when game starts
        createIdleAnimation();
        
        // Make sure UI elements are visible when game is active
        showGameUI();
    } else {
        isPointerLocked = false;
        blocker.style.display = 'flex';
        // Pause animations when game is stopped
        pauseAnimation();
        
        // Hide certain UI elements when game is inactive
        hideGameUI(false); // false = don't remove elements, just hide them
    }
};

// Hook pointer lock state change events
document.addEventListener('pointerlockchange', pointerLockChange, false);
document.addEventListener('mozpointerlockchange', pointerLockChange, false);
document.addEventListener('webkitpointerlockchange', pointerLockChange, false);

// Hook pointer lock error events
document.addEventListener('pointerlockerror', function() {
    console.error('Pointer lock error');
}, false);

// Click to start pointer lock
instructions.addEventListener('click', function(event) {
    // Prevent any default behavior
    event.preventDefault();
    
    // Request pointer lock with broader browser support
    if (document.body.requestPointerLock) {
        document.body.requestPointerLock();
    } else if (document.body.mozRequestPointerLock) {
        document.body.mozRequestPointerLock();
    } else if (document.body.webkitRequestPointerLock) {
        document.body.webkitRequestPointerLock();
    }
}, false);

// Movement and look variables
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
const speed = 4.0; // Movement speed
let yawObject, pitchObject; // For camera rotation

// Mouse movement handler
const onMouseMove = function(event) {
    if (isPointerLocked) {
        const movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
        const movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;
        
        // Invert vertical look for more natural control from front view
        pitchObject.rotation.x += movementY * 0.002;
        
        // Limit the vertical camera rotation to prevent flipping
        pitchObject.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, pitchObject.rotation.x));
        
        // Invert horizontal rotation for more natural control from front view
        human.rotation.y -= movementX * 0.002;
    }
};

// Key down handler
const onKeyDown = function(event) {
    switch (event.code) {
        case 'KeyW':
            moveForward = true;
            break;
        case 'KeyS':
            moveBackward = true;
            break;
        case 'KeyA':
            moveLeft = true;
            break;
        case 'KeyD':
            moveRight = true;
            break;
    }
};

// Key up handler
const onKeyUp = function(event) {
    switch (event.code) {
        case 'KeyW':
            moveForward = false;
            break;
        case 'KeyS':
            moveBackward = false;
            break;
        case 'KeyA':
            moveLeft = false;
            break;
        case 'KeyD':
            moveRight = false;
            break;
    }
};

document.addEventListener('mousemove', onMouseMove, false);
document.addEventListener('keydown', onKeyDown, false);
document.addEventListener('keyup', onKeyUp, false);

// Create a human figure
function createHuman() {
    const human = new THREE.Group();
    human.position.y = 0.3; // Lift the entire human up a bit
    
    // Rotate the character by 130 degrees around the Y axis
    human.rotation.y = (130 * Math.PI / 180);
    
    // Materials
    const skinMaterial = new THREE.MeshPhongMaterial({ color: 0xe0ac7e, flatShading: false });
    const clothesMaterial = new THREE.MeshPhongMaterial({ color: 0x3366ff, flatShading: false });
    const eyeMaterial = new THREE.MeshPhongMaterial({ color: 0x222222 });
    const mouthMaterial = new THREE.MeshPhongMaterial({ color: 0xcc6666 });
    
    // Head
    const headGroup = new THREE.Group();
    headGroup.position.y = 1.8; // Adjusted for taller body
    
    const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.4, 32, 32),
        skinMaterial
    );
    head.castShadow = true;
    headGroup.add(head);
    
    // Eyes
    const leftEye = new THREE.Mesh(
        new THREE.SphereGeometry(0.05, 16, 16),
        eyeMaterial
    );
    leftEye.position.set(-0.15, 0.1, 0.35);
    headGroup.add(leftEye);
    
    const rightEye = new THREE.Mesh(
        new THREE.SphereGeometry(0.05, 16, 16),
        eyeMaterial
    );
    rightEye.position.set(0.15, 0.1, 0.35);
    headGroup.add(rightEye);
    
    // Mouth
    const mouth = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 0.03, 0.1),
        mouthMaterial
    );
    mouth.position.set(0, -0.1, 0.38);
    headGroup.add(mouth);
    
    // Neck
    const neck = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.15, 0.3, 16),
        skinMaterial
    );
    neck.position.y = -0.35;
    neck.castShadow = true;
    headGroup.add(neck);
    
    human.add(headGroup);
    
    // Torso
    const torso = new THREE.Group();
    
    // Upper body (chest)
    const chest = new THREE.Mesh(
        new THREE.BoxGeometry(0.85, 0.6, 0.45),
        clothesMaterial
    );
    chest.position.y = 1.1;
    chest.castShadow = true;
    torso.add(chest);
    
    // Lower body (abdomen)
    const abdomen = new THREE.Mesh(
        new THREE.BoxGeometry(0.8, 0.5, 0.4),
        clothesMaterial
    );
    abdomen.position.y = 0.55;
    abdomen.castShadow = true;
    torso.add(abdomen);
    
    // Hip
    const hip = new THREE.Mesh(
        new THREE.BoxGeometry(0.85, 0.3, 0.45),
        clothesMaterial
    );
    hip.position.y = 0.15;
    hip.castShadow = true;
    torso.add(hip);
    
    human.add(torso);
    
    // Arms - properly extended for T-pose
    
    // Right arm
    const rightArm = createArm(skinMaterial, clothesMaterial);
    rightArm.position.set(0.425, 1.4, 0); // Lowered shoulder position (from 1.55 to 1.4)
    rightArm.name = "rightArm"; // Add name for animation targeting
    human.add(rightArm);
    
    // Left arm
    const leftArm = createArm(skinMaterial, clothesMaterial);
    leftArm.position.set(-0.425, 1.4, 0); // Lowered shoulder position (from 1.55 to 1.4)
    // No z-rotation for left arm, we'll mirror it directly in the createArm function
    leftArm.scale.x = -1; // Mirror the arm components horizontally
    leftArm.name = "leftArm"; // Add name for animation targeting
    human.add(leftArm);
    
    // Legs - now with joints for hips and knees
    
    // Right leg
    const rightLeg = createLeg(skinMaterial, clothesMaterial);
    rightLeg.position.set(0.25, 0.15, 0);
    rightLeg.name = "rightLeg"; // Add name for animation targeting
    human.add(rightLeg);
    
    // Left leg
    const leftLeg = createLeg(skinMaterial, clothesMaterial);
    leftLeg.position.set(-0.25, 0.15, 0);
    leftLeg.name = "leftLeg"; // Add name for animation targeting
    human.add(leftLeg);
    
    return human;
}

// Helper function to create an arm with hands hanging down
function createArm(skinMaterial, clothesMaterial) {
    const arm = new THREE.Group();
    
    // Upper arm (biceps) - pointing down
    const upperArm = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.1, 0.6, 16),
        clothesMaterial
    );
    upperArm.position.y = -0.35; // Position slightly more downward (from -0.3 to -0.35)
    // Fix rotation to align with Y-axis
    upperArm.rotation.x = 0;
    upperArm.castShadow = true;
    arm.add(upperArm);
    
    // Lower arm (forearm) - continuing down
    const lowerArm = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.08, 0.6, 16),
        skinMaterial
    );
    lowerArm.position.y = -0.95; // Position more downward (from -0.9 to -0.95)
    // Fix rotation to align with Y-axis
    lowerArm.rotation.x = 0;
    lowerArm.castShadow = true;
    arm.add(lowerArm);
    
    // Hand
    const hand = new THREE.Mesh(
        new THREE.SphereGeometry(0.1, 16, 16),
        skinMaterial
    );
    hand.scale.set(0.8, 1.2, 0.6); // Adjust hand proportions
    hand.position.y = -1.4; // Place at the end of the forearm (from -1.35 to -1.4)
    hand.castShadow = true;
    arm.add(hand);
    
    return arm;
}

// Helper function to create a leg with hip and knee
function createLeg(skinMaterial, clothesMaterial) {
    const leg = new THREE.Group();
    
    // Upper leg (thigh)
    const upperLeg = new THREE.Mesh(
        new THREE.CylinderGeometry(0.18, 0.14, 0.8, 16), // Increased height from 0.6 to 0.8
        clothesMaterial
    );
    upperLeg.position.y = -0.4; // Adjusted position for longer leg
    upperLeg.castShadow = true;
    upperLeg.name = "upperLeg";
    leg.add(upperLeg);
    
    // Knee joint
    const knee = new THREE.Group();
    knee.position.y = -0.8; // Adjusted for longer upper leg
    knee.name = "knee";
    leg.add(knee);
    
    // Lower leg (calf)
    const lowerLeg = new THREE.Mesh(
        new THREE.CylinderGeometry(0.14, 0.1, 0.8, 16), // Increased height from 0.6 to 0.8
        clothesMaterial
    );
    lowerLeg.position.y = -0.4; // Adjusted position for longer leg
    lowerLeg.castShadow = true;
    lowerLeg.name = "lowerLeg";
    knee.add(lowerLeg);
    
    // Foot - Keep the original position (facing forward)
    const foot = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 0.1, 0.3),
        skinMaterial
    );
    foot.position.set(0, -0.85, 0.1); // Original position with foot pointing forward
    foot.castShadow = true;
    foot.name = "foot";
    knee.add(foot);
    
    return leg;
}

// Add human to the scene
const human = createHuman();

// Set up camera hierarchy differently - position at eye level
yawObject = human; // The human itself will act as the yaw object
pitchObject = new THREE.Object3D(); // Vertical rotation only

// Position the pitch object at the head/eye level
pitchObject.position.y = 1.8; // Eye height

// Add camera to pitch object
pitchObject.add(camera);

// Position camera in front of the character
camera.position.set(0, 0, 2); // 2 units in front of the character (positive Z)
camera.rotation.y = Math.PI; // Rotate camera 180 degrees to face the character

// Add pitch object to human
human.add(pitchObject);

// Keep head visible since we're viewing from the front
const head = human.children.find(child => child.position.y === 1.8);
head.visible = true;

scene.add(human);

// Create floor
const floorGeometry = new THREE.PlaneGeometry(50, 50);
const floorMaterial = new THREE.MeshPhongMaterial({
    color: 0x999999,
    side: THREE.DoubleSide
});

const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -1.6;
floor.receiveShadow = true;
scene.add(floor);

// Add grid for reference
const gridHelper = new THREE.GridHelper(50, 50);
gridHelper.position.y = -1.59;
scene.add(gridHelper);

// Create a football-like ball with patterns
const ballRadius = 0.3;
const ballGeometry = new THREE.SphereGeometry(ballRadius, 32, 32);
const ballMaterial = new THREE.MeshPhongMaterial({ 
    color: 0xffffff,
    shininess: 50
});
const ball = new THREE.Mesh(ballGeometry, ballMaterial);

// Add black pentagon patterns to the ball
const patternMaterial = new THREE.MeshPhongMaterial({ color: 0x000000 });
const pentagonGeometry = new THREE.CircleGeometry(ballRadius * 0.2, 5);
const patterns = [];
for (let i = 0; i < 12; i++) {
    const pattern = new THREE.Mesh(pentagonGeometry, patternMaterial);
    pattern.position.setFromSphericalCoords(
        ballRadius,
        Math.random() * Math.PI,
        Math.random() * Math.PI * 2
    );
    pattern.lookAt(0, 0, 0);
    ball.add(pattern);
    patterns.push(pattern);
}

ball.position.set(0, -1.3, -5);
ball.castShadow = true;
ball.receiveShadow = true;

// Physics properties
ball.userData.velocity = new THREE.Vector3();
ball.userData.isMoving = false;
ball.userData.friction = 0.995; // Less friction
ball.userData.minSpeed = 0.01; // Minimum speed before stopping

// After the ball creation, add position history tracking
ball.userData.positionHistory = [];
ball.userData.maxHistoryLength = 60; // At 60fps, this stores 1 second of history

scene.add(ball);

// Define goal dimensions
const goalWidth = 7;
const goalHeight = 3;
const goalDepth = 2;
const poleRadius = 0.1;

// Replace goal creation with reusable function
function createGoal(x, z, rotation = 0) {
    const goalGroup = new THREE.Group();
    
    // Goal posts (white poles)
    const poleGeometry = new THREE.CylinderGeometry(poleRadius, poleRadius, goalHeight);
    const poleMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff });

    const leftPost = new THREE.Mesh(poleGeometry, poleMaterial);
    leftPost.position.set(-goalWidth/2, goalHeight/2 - 1.6, 0);
    leftPost.castShadow = true;
    goalGroup.add(leftPost);

    const rightPost = new THREE.Mesh(poleGeometry, poleMaterial);
    rightPost.position.set(goalWidth/2, goalHeight/2 - 1.6, 0);
    rightPost.castShadow = true;
    goalGroup.add(rightPost);

    const crossbar = new THREE.Mesh(
        new THREE.CylinderGeometry(poleRadius, poleRadius, goalWidth),
        poleMaterial
    );
    crossbar.rotation.z = Math.PI/2;
    crossbar.position.set(0, goalHeight - 1.6, 0);
    crossbar.castShadow = true;
    goalGroup.add(crossbar);
    
    // Add net
    const netMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xffffff, 
        transparent: true, 
        opacity: 0.5,
        side: THREE.DoubleSide 
    });
    
    // Back net
    const backNet = new THREE.Mesh(
        new THREE.PlaneGeometry(goalWidth, goalHeight),
        netMaterial
    );
    backNet.position.set(0, goalHeight/2 - 1.6, -goalDepth);
    goalGroup.add(backNet);
    
    // Top net
    const topNet = new THREE.Mesh(
        new THREE.PlaneGeometry(goalWidth, goalDepth),
        netMaterial
    );
    topNet.rotation.x = Math.PI/2;
    topNet.position.set(0, goalHeight - 1.6, -goalDepth/2);
    goalGroup.add(topNet);
    
    // Side nets
    const leftNet = new THREE.Mesh(
        new THREE.PlaneGeometry(goalDepth, goalHeight),
        netMaterial
    );
    leftNet.rotation.y = Math.PI/2;
    leftNet.position.set(-goalWidth/2, goalHeight/2 - 1.6, -goalDepth/2);
    goalGroup.add(leftNet);
    
    const rightNet = new THREE.Mesh(
        new THREE.PlaneGeometry(goalDepth, goalHeight),
        netMaterial
    );
    rightNet.rotation.y = Math.PI/2;
    rightNet.position.set(goalWidth/2, goalHeight/2 - 1.6, -goalDepth/2);
    goalGroup.add(rightNet);
    
    // Position and rotate goal
    goalGroup.position.set(x, 0, z);
    goalGroup.rotation.y = rotation;
    
    return goalGroup;
}

// Shot types with different abilities - Increase curved shot curve value
const shotTypes = {
    'power': { curve: 0, power: 1.5, name: 'Power Shot', helper: false, control: 0.2 },
    'finesse': { curve: 0.2, power: 0.7, name: 'Finesse Shot', spin: 2, helper: false, control: 0.8 },
    'curved': { curve: 5, power: 1.1, name: 'Curved Shot', spin: 3, helper: false, control: 0.6 }, // Increased curve from 0.4 to 0.8
    'lob': { curve: 0, power: 0.6, upward: 1.5, name: 'Lob Shot', helper: true, control: 0.4 }
};

let currentShotIndex = 0;
const shotTypeKeys = Object.keys(shotTypes);

// Add ability selection UI
const abilityUI = document.createElement('div');
abilityUI.style.cssText = `
    position: absolute;
    bottom: 20px;
    right: 20px;
    background: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 10px;
    border-radius: 5px;
    font-family: Arial;
`;
abilityUI.innerHTML = `Current Ability: ${shotTypes[shotTypeKeys[currentShotIndex]].name} (Press E to change)`;
document.body.appendChild(abilityUI);

// Add key handler for ability switching
document.addEventListener('keydown', (event) => {
    if (event.code === 'KeyE') {
        currentShotIndex = (currentShotIndex + 1) % shotTypeKeys.length;
        shotType = shotTypeKeys[currentShotIndex];
        abilityUI.innerHTML = `Current Ability: ${shotTypes[shotType].name} (Press E to change)`;
    }
});

// Shot type selection
let shotType = 'power'; // Change from 'direct' to 'power' to match shotTypes

// Add shot type selection to HTML
document.getElementById('controls').innerHTML += `
    <select id="shot-type">
        <option value="power">Power Shot</option>
        <option value="finesse">Finesse Shot</option>
        <option value="curved">Curved Shot</option>
        <option value="lob">Lob Shot</option>
    </select>
`;

document.getElementById('shot-type').addEventListener('change', (e) => {
    shotType = e.target.value;
});

// Animation system variables
let currentAnimation = null;
let isAnimating = true;
let isRunning = false;
let isCharging = false;
let chargeStartTime = 0;
let kickStrength = 0;
let keysPressed = {};

// Create the breathing/idle animation
function createIdleAnimation() {
    // Get body parts
    const rightArm = human.getObjectByName("rightArm");
    const leftArm = human.getObjectByName("leftArm");
    const rightLeg = human.getObjectByName("rightLeg");
    const leftLeg = human.getObjectByName("leftLeg");
    const rightKnee = rightLeg.getObjectByName("knee");
    const leftKnee = leftLeg.getObjectByName("knee");
    
    // Cancel any existing animation
    if (currentAnimation) {
        currentAnimation.kill();
    }
    
    // Create a looping breathing animation (our main idle animation)
    const timeline = gsap.timeline({
        repeat: -1, // Infinite loop
        yoyo: true, // Play backwards on alternate cycles
        repeatDelay: 0.5 // Small delay between loops
    });
    
    // Subtle breathing movement
    timeline.to(human.position, {
        y: 0.35, // Slight up and down movement
        duration: 1.5,
        ease: "sine.inOut"
    }, 0);
    
    // Very subtle leg/knee adjustments for weight shifting
    timeline.to(rightLeg.rotation, {
        x: 0.02,
        duration: 1.5,
        ease: "sine.inOut"
    }, 0.5);
    
    timeline.to(leftLeg.rotation, {
        x: -0.02,
        duration: 1.5,
        ease: "sine.inOut"
    }, 0);
    
    // Save the animation
    currentAnimation = timeline;
    
    return timeline;
}

// Reset to neutral pose (no breathing)
function pauseAnimation() {
    // Cancel any ongoing animation
    if (currentAnimation) {
        currentAnimation.kill();
        currentAnimation = null;
    }
    
    const rightLeg = human.getObjectByName("rightLeg");
    const leftLeg = human.getObjectByName("leftLeg");
    const rightArm = human.getObjectByName("rightArm");
    const leftArm = human.getObjectByName("leftArm");
    
    // Reset all rotations to neutral pose 
    gsap.to(rightLeg.rotation, { x: 0, y: 0, z: 0, duration: 0.5 });
    gsap.to(leftLeg.rotation, { x: 0, y: 0, z: 0, duration: 0.5 });
    gsap.to(rightArm.rotation, { x: 0, y: 0, z: 0, duration: 0.5 });
    gsap.to(leftArm.rotation, { x: 0, y: 0, z: 0, duration: 0.5 }); // Left arm now uses zero rotation too
    
    // Reset knee rotations
    const rightKnee = rightLeg.getObjectByName("knee");
    const leftKnee = leftLeg.getObjectByName("knee");
    gsap.to(rightKnee.rotation, { x: 0, y: 0, z: 0, duration: 0.5 });
    gsap.to(leftKnee.rotation, { x: 0, y: 0, z: 0, duration: 0.5 });
    
    // Reset human position
    gsap.to(human.position, { y: 0.3, duration: 0.5 });
}

// Create a running animation with improved smoothness
function createRunAnimation() {
    // Get body parts
    const rightArm = human.getObjectByName("rightArm");
    const leftArm = human.getObjectByName("leftArm");
    const rightLeg = human.getObjectByName("rightLeg");
    const leftLeg = human.getObjectByName("leftLeg");
    const rightKnee = rightLeg.getObjectByName("knee");
    const leftKnee = leftLeg.getObjectByName("knee");
    
    // Cancel any existing animation
    if (currentAnimation) {
        currentAnimation.kill();
    }
    
    // Create a looping running animation with smoother transitions
    const timeline = gsap.timeline({
        repeat: -1,
        repeatDelay: 0
    });
    
    // Full run cycle duration (in seconds)
    const cycleDuration = 0.6; // Slightly longer for smoother motion
    const halfCycle = cycleDuration / 2;
    
    // Arms swing - use ease functions for more natural movement
    timeline.to(rightArm.rotation, { 
        x: 0.9,  // Forward swing
        duration: halfCycle,
        ease: "sine.inOut"
    }, 0);
    
    timeline.to(leftArm.rotation, { 
        x: -0.9, // Backward swing
        duration: halfCycle,
        ease: "sine.inOut"
    }, 0);
    
    timeline.to(rightArm.rotation, { 
        x: -0.9, // Complete cycle
        duration: halfCycle,
        ease: "sine.inOut"
    }, halfCycle);
    
    timeline.to(leftArm.rotation, { 
        x: 0.9,  // Complete cycle
        duration: halfCycle,
        ease: "sine.inOut"
    }, halfCycle);
    
    // Leg movement with smoother transitions
    timeline.to(rightLeg.rotation, { 
        x: -0.6,  // Leg back
        duration: halfCycle,
        ease: "sine.inOut"
    }, 0);
    
    timeline.to(leftLeg.rotation, { 
        x: 0.8,   // Leg forward
        duration: halfCycle,
        ease: "sine.inOut"
    }, 0);
    
    timeline.to(rightKnee.rotation, { 
        x: 0.4,   // Knee bend
        duration: halfCycle,
        ease: "sine.inOut" 
    }, 0);
    
    timeline.to(leftKnee.rotation, { 
        x: 0.8,   // More knee bend when forward
        duration: halfCycle,
        ease: "power1.inOut"
    }, 0);
    
    // Complete cycle - switch positions
    timeline.to(rightLeg.rotation, { 
        x: 0.8,   // Leg forward
        duration: halfCycle,
        ease: "sine.inOut"
    }, halfCycle);
    
    timeline.to(leftLeg.rotation, { 
        x: -0.6,  // Leg back
        duration: halfCycle,
        ease: "sine.inOut"
    }, halfCycle);
    
    timeline.to(rightKnee.rotation, { 
        x: 0.8,   // More knee bend when forward
        duration: halfCycle,
        ease: "power1.inOut"
    }, halfCycle);
    
    timeline.to(leftKnee.rotation, { 
        x: 0.4,   // Knee bend
        duration: halfCycle,
        ease: "sine.inOut"
    }, halfCycle);
    
    // Vertical movement with smoother bounce
    timeline.to(human.position, {
        y: 0.45,  // Up position - higher for more pronounced bounce
        duration: halfCycle / 2,
        ease: "sine.out"
    }, 0);
    
    timeline.to(human.position, {
        y: 0.25,  // Down position
        duration: halfCycle / 2,
        ease: "sine.in"
    }, halfCycle / 2);
    
    timeline.to(human.position, {
        y: 0.45,  // Up position again
        duration: halfCycle / 2,
        ease: "sine.out"
    }, halfCycle);
    
    timeline.to(human.position, {
        y: 0.25,  // Down position again
        duration: halfCycle / 2,
        ease: "sine.in"
    }, halfCycle * 1.5);
    
    // Save the animation
    currentAnimation = timeline;
    
    return timeline;
}

// Create a transition from running to idle
function transitionToIdle() {
    // Get body parts
    const rightArm = human.getObjectByName("rightArm");
    const leftArm = human.getObjectByName("leftArm");
    const rightLeg = human.getObjectByName("rightLeg");
    const leftLeg = human.getObjectByName("leftLeg");
    const rightKnee = rightLeg.getObjectByName("knee");
    const leftKnee = leftLeg.getObjectByName("knee");
    
    // Cancel any existing animation
    if (currentAnimation) {
        currentAnimation.kill();
    }
    
    // Create a transition animation
    const timeline = gsap.timeline({
        onComplete: function() {
            // Start idle animation when transition completes
            if (isAnimating) {
                createIdleAnimation();
                document.getElementById('animation-status').textContent = 'Idle';
            } else {
                pauseAnimation();
            }
        }
    });
    
    // Gradually slow down and return to neutral
    timeline.to([rightArm.rotation, leftArm.rotation], { 
        x: 0,
        duration: 0.7,
        ease: "power2.out"
    }, 0);
    
    timeline.to([rightLeg.rotation, leftLeg.rotation], { 
        x: 0,
        duration: 0.7,
        ease: "power2.out" 
    }, 0);
    
    timeline.to([rightKnee.rotation, leftKnee.rotation], { 
        x: 0,
        duration: 0.7,
        ease: "power2.out"
    }, 0);
    
    // Adjust height smoothly
    timeline.to(human.position, {
        y: 0.3,
        duration: 0.7,
        ease: "power2.out"
    }, 0);
    
    // Save the animation
    currentAnimation = timeline;
    
    return timeline;
}

// Create a kick charging animation
function createChargingAnimation() {
    // Get body parts
    const rightArm = human.getObjectByName("rightArm");
    const leftArm = human.getObjectByName("leftArm");
    const rightLeg = human.getObjectByName("rightLeg");
    const leftLeg = human.getObjectByName("leftLeg");
    const rightKnee = rightLeg.getObjectByName("knee");
    const leftKnee = leftLeg.getObjectByName("knee");
    
    // Cancel any existing animation
    if (currentAnimation) {
        currentAnimation.kill();
    }
    
    // Create charging animation - the leg pulls back in preparation
    const timeline = gsap.timeline();
    
    // Right leg pulls back for the kick
    timeline.to(rightLeg.rotation, { 
        x: -0.7, // Pull back
        duration: 0.5,
        ease: "power2.out"
    }, 0);
    
    // Bend knee while charging
    timeline.to(rightKnee.rotation, { 
        x: 0.9, // Significant bend
        duration: 0.5,
        ease: "power2.out"
    }, 0);
    
    // Shift weight to other leg
    timeline.to(leftLeg.rotation, { 
        x: 0.2, // Slight forward lean
        duration: 0.5,
        ease: "power2.out"
    }, 0);    
    
    // Arms adjust for balance
    timeline.to(leftArm.rotation, { 
        x: 0.3, // Slight forward
        duration: 0.5,
        ease: "power2.out"
    }, 0);    
    
    timeline.to(rightArm.rotation, { 
        x: -0.3, // Slight backward
        duration: 0.5,
        ease: "power2.out"
    }, 0);
    
    // Slight crouch to prepare for force
    timeline.to(human.position, { 
        y: 0.2, // Lower position
        duration: 0.5,
        ease: "power2.out"
    }, 0);
    
    // Add pulsating effect to indicate charging
    timeline.to(rightLeg.rotation, {
        x: -0.75, // Subtle pulsing movement
        duration: 0.4,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
    }, 0.5);
    
    // Save the animation
    currentAnimation = timeline;
    
    return timeline;
}

// Execute the kick with strength based on charge time
function executeKick() {
    // Get body parts
    const rightArm = human.getObjectByName("rightArm");
    const leftArm = human.getObjectByName("leftArm");
    const rightLeg = human.getObjectByName("rightLeg");
    const leftLeg = human.getObjectByName("leftLeg");
    const rightKnee = rightLeg.getObjectByName("knee");
    const leftKnee = leftLeg.getObjectByName("knee");
    
    // Cancel any existing animation
    if (currentAnimation) {
        currentAnimation.kill();
    }
    
    // Calculate kick strength based on charge time (max 1.5 seconds)
    const chargeTime = Math.min((Date.now() - chargeStartTime) / 1500, 1);
    kickStrength = chargeTime;
    
    // Create kick animation
    const timeline = gsap.timeline({
        onComplete: function() {
            // Return to idle when kick completes
            if (isRunning) {
                createRunAnimation();
            } else if (isAnimating) {
                createIdleAnimation();
                document.getElementById('animation-status').textContent = 'Idle';
            } else {
                pauseAnimation();
            }
        }
    });
    
    // Kick velocity depends on charge strength (0.15-0.3 seconds)
    const kickSpeed = 0.3 - (0.15 * kickStrength);
    // Kick height/angle depends on strength
    const kickHeight = 0.9 + (kickStrength * 0.6);  // 0.9 to 1.5
    
    // Forward kick motion - use left leg for kicking
    timeline.to(leftLeg.rotation, { 
        x: -kickHeight,
        duration: kickSpeed,
        ease: "power3.out"
    }, 0);
    
    // Straighten knee during kick
    timeline.to(leftKnee.rotation, { 
        x: 0, // Fully extended during kick
        duration: kickSpeed,
        ease: "power3.out"
    }, 0);
    
    // Follow through
    timeline.to(leftLeg.rotation, { 
        x: 0.4, // Return partway
        duration: 0.3,
        ease: "power2.in"
    }, kickSpeed);
    
    timeline.to(leftKnee.rotation, { 
        x: 0.4, // Slight bend during follow-through
        duration: 0.3,
        ease: "power2.in"
    }, kickSpeed);
    
    // Return to neutral
    timeline.to(leftLeg.rotation, { 
        x: 0, // Back to normal
        duration: 0.4,
        ease: "power1.inOut"
    }, kickSpeed + 0.3);
    
    timeline.to(leftKnee.rotation, { 
        x: 0, // Back to normal
        duration: 0.4,
        ease: "power1.inOut"
    }, kickSpeed + 0.3);
    
    // Right leg provides balance
    timeline.to(rightLeg.rotation, { 
        x: 0.2,
        duration: kickSpeed,
        ease: "power2.out"
    }, 0);
    
    // Arms return to normal
    timeline.to([rightArm.rotation, leftArm.rotation], { 
        x: 0,
        duration: 0.7,
        ease: "power1.inOut"
    }, 0);
    
    // Body rises during kick and returns to normal
    timeline.to(human.position, { 
        y: 0.3 + (0.1 * kickStrength), // Rise slightly with kick
        duration: kickSpeed,
        ease: "power1.out"
    }, 0);
    
    timeline.to(human.position, { 
        y: 0.3, // Return to normal
        duration: 0.5,
        ease: "power1.inOut"
    }, kickSpeed + 0.2);
    
    // Add ball kicking physics
    if (canKickBall()) {
        const kickDirection = new THREE.Vector3();
        const footPos = new THREE.Vector3();
        const ballPos = new THREE.Vector3();
        
        const leftFoot = leftKnee.getObjectByName("foot");
        leftFoot.getWorldPosition(footPos);
        ball.getWorldPosition(ballPos);
        
        kickDirection.subVectors(ballPos, footPos).normalize();
        
        // Get current shot type configuration
        const shot = shotTypes[shotType] || shotTypes.power; // Fallback to power shot
        
        // Apply shot type effects
        if (shot.upward) {
            kickDirection.y = shot.upward;
        } else {
            kickDirection.y = 0.3 * shot.power;
        }
        
        kickDirection.normalize();
        const kickForce = (20 * kickStrength + 10) * shot.power;
        ball.userData.velocity.copy(kickDirection).multiplyScalar(kickForce);
        
        if (shot.spin) {
            ball.userData.spin = shot.spin * kickStrength;
        }
        
        ball.userData.isMoving = true;
    }
    
    // Save the animation
    currentAnimation = timeline;
    
    // Update status - show kick strength as percentage
    const strengthPercent = Math.round(kickStrength * 100);
    document.getElementById('animation-status').textContent = `Kicking (${strengthPercent}%)`;
    
    return timeline;
}

// Check if the ball can be kicked (is close enough)
function canKickBall() {
    const leftLeg = human.getObjectByName("leftLeg");
    const leftKnee = leftLeg.getObjectByName("knee");
    const leftFoot = leftKnee.getObjectByName("foot");
    
    // Get the foot's world position and direction
    const footPos = new THREE.Vector3();
    const humanForward = new THREE.Vector3(0, 0, 1);
    humanForward.applyQuaternion(human.quaternion);
    
    leftFoot.getWorldPosition(footPos);
    
    // Extend the kick detection area in front of the foot
    footPos.add(humanForward.multiplyScalar(0.8));
    
    const ballPos = new THREE.Vector3();
    ball.getWorldPosition(ballPos);
    
    // Calculate distance between extended foot position and ball
    const distance = footPos.distanceTo(ballPos);
    
    // Also check if the ball is in front of the foot
    const footToBall = ballPos.clone().sub(footPos);
    const angleToball = footToBall.angleTo(humanForward);
    
    // Return true if ball is within range and roughly in front of foot
    return distance < 2.0 && angleToball < Math.PI * 0.75;
}

// Modify the updateBallPhysics function
function updateBallPhysics(delta) {
    // Save current position to history if ball is moving
    if (ball.userData.isMoving) {
        // Store a clone of the current position and velocity
        ball.userData.positionHistory.push({
            position: ball.position.clone(),
            velocity: ball.userData.velocity.clone(),
            spin: ball.userData.spin
        });
        
        // Keep only 1 second worth of history
        if (ball.userData.positionHistory.length > ball.userData.maxHistoryLength) {
            ball.userData.positionHistory.shift();
        }
    }
    
    // Check if ball is close enough to control directly
    const isInControlRange = checkBallInControlRange();

    // If ball is in control range, make it move with the player
    if (isInControlRange && isPointerLocked && !isCharging) {
        const moveDirection = new THREE.Vector3();
        
        if (moveForward) moveDirection.z += 1;
        if (moveBackward) moveDirection.z -= 1;
        if (moveLeft) moveDirection.x += 1;
        if (moveRight) moveDirection.x -= 1;
        
        if (moveDirection.length() > 0) {
            moveDirection.normalize();
            moveDirection.applyAxisAngle(new THREE.Vector3(0, 1, 0), human.rotation.y);
            
            // Make ball roll in the direction of movement
            const ballSpeed = 3.0; // Ball control speed
            ball.userData.velocity.x = moveDirection.x * ballSpeed;
            ball.userData.velocity.z = moveDirection.z * ballSpeed;
            ball.userData.isMoving = true;
            
            // Apply slight upward force to prevent sticking to ground
            ball.userData.velocity.y = 0.05;
        }
    }
    
    // Rest of the existing ball physics update
    if (ball.userData.isMoving) {
        // Apply gravity
        ball.userData.velocity.y -= 9.8 * delta;
        
        // Apply shot effects for curved shots (increased effect)
        if (shotType === 'curved' && ball.userData.velocity.length() > 1) {
            const spinForce = shotTypes.curved.curve * delta * 2; // Double the effect
            ball.userData.velocity.x += spinForce * Math.sign(ball.userData.velocity.z);
        } else if (shotType === 'finesse' && ball.userData.velocity.length() > 1) {
            const spinForce = shotTypes.finesse.curve * delta;
            ball.userData.velocity.x += spinForce * Math.sign(ball.userData.velocity.z);
        }
        
        // Update position
        ball.position.x += ball.userData.velocity.x * delta;
        ball.position.y += ball.userData.velocity.y * delta;
        ball.position.z += ball.userData.velocity.z * delta;
        
        // Ball rotation based on velocity and spin
        const speed = ball.userData.velocity.length();
        const rotationAxis = new THREE.Vector3(-ball.userData.velocity.z, 
            ball.userData.spin || 0, 
            ball.userData.velocity.x).normalize();
        ball.rotateOnAxis(rotationAxis, speed * delta * 3);
        
        // Floor bounce with improved physics
        if (ball.position.y - ballRadius < -1.6) {
            ball.position.y = -1.6 + ballRadius;
            ball.userData.velocity.y *= -0.7;
            ball.userData.velocity.multiplyScalar(0.95); // Additional friction on bounce
            
            // Reduce spin on bounce
            if (ball.userData.spin) {
                ball.userData.spin *= 0.8;
            }
        }
        
        // Check for stadium boundary collision
        const stadiumWidth = 95; // Slightly less than actual size to account for ball radius
        const stadiumDepth = 60; // Slightly less than actual size to account for ball radius
        
        let hitBoundary = false;
        
        // Check X boundaries (side lines)
        if (Math.abs(ball.position.x) > stadiumWidth / 2) {
            hitBoundary = true;
        }
        
        // Check Z boundaries (goal lines, except goal areas)
        if (Math.abs(ball.position.z) > stadiumDepth / 2) {
            // Check if it's in either goal area
            const northGoalArea = (
                ball.position.z > stadiumDepth/2 && 
                Math.abs(ball.position.x) < goalWidth/2 && 
                ball.position.y < goalHeight - 1.6
            );
            
            const southGoalArea = (
                ball.position.z < -stadiumDepth/2 && 
                Math.abs(ball.position.x) < goalWidth/2 && 
                ball.position.y < goalHeight - 1.6
            );
            
            // Hit boundary only if not in either goal area
            if (!northGoalArea && !southGoalArea) {
                hitBoundary = true;
            }
        }
        
        // Rewind the ball if it hit a boundary and has history
        if (hitBoundary && ball.userData.positionHistory.length > 0) {
            // Get the oldest position in our history (approximately 1 second ago)
            const rewindData = ball.userData.positionHistory[0];
            
            // Show a visual effect to indicate boundary hit
            createBoundaryHitEffect(ball.position.clone());
            
            // Rewind ball position and properties
            ball.position.copy(rewindData.position);
            ball.userData.velocity.copy(rewindData.velocity);
            ball.userData.velocity.multiplyScalar(0.5); // Reduce speed after rewind
            ball.userData.spin = rewindData.spin;
            
            // Clear position history
            ball.userData.positionHistory = [];
        }
        
        // Apply air resistance
        ball.userData.velocity.multiplyScalar(0.995);
        
        // Stop ball when it's moving too slow
        if (ball.userData.velocity.length() < 0.1) {
            ball.userData.velocity.multiplyScalar(0.95);
            if (ball.userData.velocity.length() < 0.01) {
                ball.userData.isMoving = false;
                ball.userData.velocity.set(0, 0, 0);
                ball.userData.spin = 0;
            }
        }
        
        // Add control effect based on shot type
        if (ball.userData.velocity.length() > 1) {
            const shot = shotTypes[shotType];
            if (shot.control) {
                // Calculate movement direction
                const moveDir = new THREE.Vector3();
                if (moveForward) moveDir.z += 1;
                if (moveBackward) moveDir.z -= 1;
                if (moveLeft) moveDir.x += 1;
                if (moveRight) moveDir.x -= 1;

                if (moveDir.length() > 0) {
                    moveDir.normalize();
                    moveDir.applyAxisAngle(new THREE.Vector3(0, 1, 0), human.rotation.y);
                    // Apply subtle control to ball direction
                    ball.userData.velocity.lerp(moveDir.multiplyScalar(ball.userData.velocity.length()), shot.control * delta);
                }
            }
        }
    }
    
    // Check for collision with human
    const humanPos = new THREE.Vector3();
    human.getWorldPosition(humanPos);
    const distance = humanPos.distanceTo(ball.position);
    const minDistance = 1.0 + ballRadius; // Human radius + ball radius
    
    if (distance < minDistance && ball.userData.isMoving) {
        // Calculate reflection vector
        const normal = new THREE.Vector3()
            .subVectors(ball.position, humanPos)
            .normalize();
            
        // Reflect velocity around normal
        ball.userData.velocity.reflect(normal);
        
        // Move ball outside collision radius
        const pushOutDistance = minDistance - distance;
        ball.position.x += normal.x * pushOutDistance;
        ball.position.z += normal.z * pushOutDistance;
        
        // Reduce velocity slightly during collision
        ball.userData.velocity.multiplyScalar(0.8);
    }
}

// Add function to check if ball is in player's control range
function checkBallInControlRange() {
    // Get player position
    const playerPos = new THREE.Vector3();
    human.getWorldPosition(playerPos);
    
    // Get ball position
    const ballPos = new THREE.Vector3();
    ball.getWorldPosition(ballPos);
    
    // Calculate distance
    const distance = playerPos.distanceTo(ballPos);
    
    // Control range (slightly wider than kick range)
    const controlRange = 2.2;
    
    return distance < controlRange;
}

// Add a visual effect for boundary hits
function createBoundaryHitEffect(position) {
    // Create a visual indicator for the boundary hit
    const indicatorGeometry = new THREE.SphereGeometry(0.5, 16, 16);
    const indicatorMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xff3300,
        transparent: true,
        opacity: 0.8
    });
    
    const indicator = new THREE.Mesh(indicatorGeometry, indicatorMaterial);
    indicator.position.copy(position);
    scene.add(indicator);
    
    // Animate the indicator
    gsap.to(indicator.scale, {
        x: 3,
        y: 3,
        z: 3,
        duration: 0.5,
        ease: "power2.out"
    });
    
    gsap.to(indicatorMaterial, {
        opacity: 0,
        duration: 0.5,
        onComplete: () => {
            scene.remove(indicator);
        }
    });
    
    // Display a message
    const boundaryMessage = document.createElement('div');
    boundaryMessage.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(255, 51, 0, 0.7);
        color: white;
        padding: 10px 20px;
        border-radius: 5px;
        font-family: Arial, sans-serif;
        font-size: 20px;
        font-weight: bold;
        z-index: 1000;
        opacity: 0;
        pointer-events: none;
    `;
    boundaryMessage.textContent = "OUT OF BOUNDS!";
    document.body.appendChild(boundaryMessage);
    
    // Animate the message
    gsap.to(boundaryMessage, {
        opacity: 1,
        duration: 0.3,
        onComplete: () => {
            gsap.to(boundaryMessage, {
                opacity: 0,
                delay: 0.7,
                duration: 0.3,
                onComplete: () => {
                    document.body.removeChild(boundaryMessage);
                }
            });
        }
    });
}

// Check collision with goal posts
function checkGoalCollision(ball) {
    const posts = [leftPost, rightPost, crossbar];
    for (const post of posts) {
        const postPos = new THREE.Vector3();
        post.getWorldPosition(postPos);
        
        if (ball.position.distanceTo(postPos) < (ballRadius + poleRadius)) {
            return post;
        }
    }
    return null;
}

// Handle collision with goal
function handleGoalCollision(ball, post) {
    const normal = new THREE.Vector3().subVectors(ball.position, post.position).normalize();
    ball.userData.velocity.reflect(normal);
    ball.userData.velocity.multiplyScalar(0.7); // Reduce velocity on collision
}

// Update animation state based on user inputs
function updateAnimationState() {
    // Only run when pressing W and not charging kick
    if (moveForward && !isRunning && !isCharging) {
        isRunning = true;
        createRunAnimation();
        document.getElementById('animation-status').textContent = 'Running';
    } else if (!moveForward && isRunning && !isCharging) {
        isRunning = false;
        createIdleAnimation();
        document.getElementById('animation-status').textContent = 'Idle';
    }
}

// Toggle the idle animation
function toggleAnimation() {
    isAnimating = !isAnimating;
    if (isAnimating) {
        if (isRunning) return;    // Don't change animation if running
        createIdleAnimation();
        document.getElementById('animation-status').textContent = 'Idle';
        document.getElementById('toggle-anim-btn').textContent = 'Stop Animation';
    } else {
        pauseAnimation();
        document.getElementById('animation-status').textContent = 'Stopped';
        document.getElementById('toggle-anim-btn').textContent = 'Start Animation';
    }
}

// Handle mouse down - start charging kick
function handleMouseDown(event) {
    if (event.button === 0 && isPointerLocked) { // Left mouse button
        if (isCharging) return;
        isCharging = true;
        chargeStartTime = Date.now();
        kickStrength = 0;
        createChargingAnimation();
        
        // Show charge meter
        const chargeMeter = document.getElementById('charge-meter');
        chargeMeter.style.opacity = '1';
        
        document.getElementById('animation-status').textContent = 'Charging Kick';
    }
}

// Handle mouse up - execute the kick
function handleMouseUp(event) {
    if (event.button === 0 && isPointerLocked) { // Left mouse button
        if (!isCharging) return;
        isCharging = false;
        curveHelper.visible = false; // Add this line
        executeKick();
        
        // Hide charge meter
        const chargeMeter = document.getElementById('charge-meter');
        chargeMeter.style.opacity = '0';
        document.getElementById('charge-level').style.width = '0%';
    }
}

// Update charge meter display
function updateChargeMeter() {
    if (isCharging) {
        const chargeLevel = document.getElementById('charge-level');
        const currentCharge = Math.min((Date.now() - chargeStartTime) / 1500, 1) * 100;
        chargeLevel.style.width = `${currentCharge}%`;
    }
}

// Update player movement
function updatePlayerMovement(delta) {
    if (isPointerLocked) {
        // Calculate movement based on keys pressed
        const moveDirection = new THREE.Vector3();
        
        // Reverse W/S controls (swap moveForward/moveBackward flags)
        if (moveForward) moveDirection.z += 1;  // W now moves forward
        if (moveBackward) moveDirection.z -= 1;  // S now moves backward
        if (moveLeft) moveDirection.x += 1;  // Keep A/D reversed
        if (moveRight) moveDirection.x -= 1;  // Keep A/D reversed
        
        // Use modified speed with multiplier instead of changing the constant
        // Apply half speed when charging
        const speedMultiplier = isCharging ? 0.5 : 1.0;
        const modifiedSpeed = speed * speedMultiplier;
        
        // Apply movement
        if (moveDirection.length() > 0) {
            moveDirection.normalize();
            moveDirection.applyAxisAngle(new THREE.Vector3(0, 1, 0), human.rotation.y);
            human.position.x += moveDirection.x * modifiedSpeed * delta;
            human.position.z += moveDirection.z * modifiedSpeed * delta;
            
            // Only update animation if not charging
            if (!isCharging && !isRunning) {
                isRunning = true;
                createRunAnimation();
                document.getElementById('animation-status').textContent = 'Running';
            }
        } else if (isRunning && !isCharging) {
            isRunning = false;
            createIdleAnimation();
            document.getElementById('animation-status').textContent = 'Idle';
        }
    }
}

// Replace the existing curveHelper setup with an improved version
const curveHelper = new THREE.Group();
const curvePoints = [];
const curveGeometry = new THREE.BufferGeometry();
const curveMaterial = new THREE.LineBasicMaterial({ 
    color: 0xff0000, 
    opacity: 0.7, 
    transparent: true,
    linewidth: 2 // Make the line more visible
});
const curveLine = new THREE.Line(curveGeometry, curveMaterial);

// Add small spheres to mark points along the trajectory
const markerGeometry = new THREE.SphereGeometry(0.1, 8, 8);
const markerMaterial = new THREE.MeshBasicMaterial({ 
    color: 0xffff00, 
    opacity: 0.8,
    transparent: true 
});

const trajectoryMarkers = [];
const markerCount = 5; // Number of markers to show trajectory points

for (let i = 0; i < markerCount; i++) {
    const marker = new THREE.Mesh(markerGeometry, markerMaterial.clone());
    marker.visible = false;
    trajectoryMarkers.push(marker);
    curveHelper.add(marker);
}

curveHelper.add(curveLine);
curveHelper.visible = false;
scene.add(curveHelper);

// Improve the updateCurveHelper function to work with all shot types
function updateCurveHelper() {
    if (isCharging) {
        // Get foot and ball positions
        const footPos = new THREE.Vector3();
        const ballPos = new THREE.Vector3();
        const leftFoot = human.getObjectByName("leftLeg").getObjectByName("knee").getObjectByName("foot");
        leftFoot.getWorldPosition(footPos);
        ball.getWorldPosition(ballPos);

        // Calculate initial direction
        const direction = ballPos.clone().sub(footPos).normalize();
        
        // Get current shot type configuration
        const shot = shotTypes[shotType];
        
        // Apply shot type effects to direction
        if (shot.upward) {
            direction.y = shot.upward;
        } else {
            direction.y = 0.3 * shot.power;
        }
        direction.normalize();

        // Generate curve points
        curvePoints.length = 0;
        const tempVel = new THREE.Vector3();
        const tempPos = ballPos.clone();
        const steps = 80; // More steps for better accuracy
        const timeStep = 0.05; // Smaller time step for smoother curve

        // Current charge determines initial velocity
        const currentCharge = Math.min((Date.now() - chargeStartTime) / 1500, 1);
        const kickStrength = currentCharge;
        const kickForce = (20 * kickStrength + 10) * shot.power;
        
        // Set initial velocity based on kick direction and force
        tempVel.copy(direction).multiplyScalar(kickForce);
        
        // Start simulation from ball position
        curvePoints.push(tempPos.clone());
        
        // Simulate physics
        for (let i = 0; i < steps; i++) {
            // Apply gravity
            tempVel.y -= 9.8 * timeStep;
            
            // Apply shot-specific effects
            if (shotType === 'curved') {
                tempVel.x += shot.curve * timeStep * Math.sign(tempVel.z) * 2;
            } else if (shotType === 'finesse') {
                tempVel.x += shot.curve * timeStep * Math.sign(tempVel.z);
            }
            
            // Update position
            tempPos.add(tempVel.clone().multiplyScalar(timeStep));
            curvePoints.push(tempPos.clone());
            
            // Stop if ball would hit ground
            if (tempPos.y - ballRadius < -1.6) {
                // Add one more point at ground level
                const groundPos = tempPos.clone();
                groundPos.y = -1.6 + ballRadius;
                curvePoints.push(groundPos);
                break;
            }
        }

        // Update curve geometry
        curveGeometry.setFromPoints(curvePoints);
        
        // Update marker positions at evenly spaced intervals
        if (curvePoints.length > 2) {
            const interval = Math.max(1, Math.floor(curvePoints.length / (markerCount + 1)));
            
            for (let i = 0; i < markerCount; i++) {
                const pointIndex = interval * (i + 1);
                if (pointIndex < curvePoints.length) {
                    trajectoryMarkers[i].position.copy(curvePoints[pointIndex]);
                    trajectoryMarkers[i].visible = true;
                } else {
                    trajectoryMarkers[i].visible = false;
                }
            }
        }
        
        // Show curve helper with color based on shot type
        switch(shotType) {
            case 'power':
                curveMaterial.color.set(0xff0000); // Red
                break;
            case 'finesse':
                curveMaterial.color.set(0x00ffff); // Cyan
                break;
            case 'curved':
                curveMaterial.color.set(0xff00ff); // Magenta
                break;
            case 'lob':
                curveMaterial.color.set(0xffff00); // Yellow
                break;
        }
        
        curveHelper.visible = true;
    } else {
        curveHelper.visible = false;
        trajectoryMarkers.forEach(marker => marker.visible = false);
    }
}

// Update the checkGoal function to respawn the ball after scoring
function checkGoal() {
    // Define both goals with positions and directions
    const goals = [
        { x: 0, z: -30, dir: 1 },  // South goal at z=-30, facing north 
        { x: 0, z: 30, dir: -1 }   // North goal at z=30, facing south
    ];
    
    // Check both goals
    for (const goal of goals) {
        // Goal area boundaries
        const goalLeft = goal.x - goalWidth / 2;
        const goalRight = goal.x + goalWidth / 2;
        const goalTop = goalHeight - 1.6;
        
        // Check if ball is between posts horizontally and vertically
        const inPosts = 
            ball.position.x > goalLeft && 
            ball.position.x < goalRight && 
            ball.position.y < goalTop && 
            ball.position.y > -1.6;
        
        // Check if ball is in the net (between goal line and back of net)
        let inNet = false;
        if (goal.dir > 0) { // South goal (facing north)
            inNet = ball.position.z > goal.z && ball.position.z < goal.z + goalDepth;
        } else { // North goal (facing south)
            inNet = ball.position.z < goal.z && ball.position.z > goal.z - goalDepth;
        }
        
        // Goal scored if ball is between posts and in net
        if (inPosts && inNet && !ball.userData.goalScored) {
            ball.userData.goalScored = true;
            
            // Increase score and show which goal was scored in
            score += 10;
            const goalName = goal.dir > 0 ? "South" : "North";
            scoreDisplay.textContent = `SCORE: ${score}`;
            
            // Create goal animation
            const goalAlert = document.createElement('div');
            goalAlert.style.cssText = `
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%) scale(0);
                font-size: 60px;
                font-weight: bold;
                color: #ffcc00;
                text-shadow: 0 0 20px rgba(255, 204, 0, 0.7);
                font-family: 'Arial', sans-serif;
                z-index: 1000;
                pointer-events: none;
            `;
            goalAlert.textContent = `GOAL! (${goalName})`;
            document.body.appendChild(goalAlert);
            
            // Animate goal text
            gsap.to(goalAlert, {
                scale: 1,
                duration: 0.5,
                ease: "back.out",
                onComplete: () => {
                    gsap.to(goalAlert, {
                        scale: 1.5,
                        opacity: 0,
                        y: -50,
                        duration: 1,
                        delay: 1,
                        onComplete: () => document.body.removeChild(goalAlert)
                    });
                }
            });
            
            // Respawn ball in the center of the field
            setTimeout(() => {
                // Stop ball movement
                ball.userData.velocity.set(0, 0, 0);
                ball.userData.spin = 0;
                
                // Reset position to center field with small height
                gsap.to(ball.position, {
                    x: 0,
                    y: 0,  // Will be adjusted with physics to bounce
                    z: 0,
                    duration: 0.8,
                    ease: "power2.inOut",
                    onComplete: () => {
                        // Give it a small bounce
                        ball.userData.velocity.y = 5;
                        ball.userData.isMoving = true;
                        
                        // Reset goal scored flag
                        ball.userData.goalScored = false;
                    }
                });
            }, 2000); // Delay respawn for 2 seconds after goal celebration starts
            
            // Exit after scoring one goal
            return;
        }
    }
}

// Main animation and update loop
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    
    if (isPointerLocked) {
        updatePlayerMovement(delta);
    }
    
    updateBallPhysics(delta);
    updateChargeMeter();
    updateCurveHelper();
    checkGoal(); // Now this call is safe since checkGoal is defined above
    
    renderer.render(scene, camera);
}

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Add mouse event listeners for kick
document.addEventListener('mousedown', handleMouseDown);
document.addEventListener('mouseup', handleMouseUp);

// Start with idle animation by default
createIdleAnimation();

animate();

// Add after scene setup - Stadium creation
function createStadium() {
    const stadium = new THREE.Group();
    
    // UPGRADE 1: Improved field texture and markings
    const fieldSize = { width: 100, length: 64 };
    
    // Create grass texture
    const grassCanvas = document.createElement('canvas');
    grassCanvas.width = 512;
    grassCanvas.height = 512;
    const ctx = grassCanvas.getContext('2d');
    
    // Base green color
    ctx.fillStyle = '#4CAF50';
    ctx.fillRect(0, 0, grassCanvas.width, grassCanvas.height);
    
    // Add stripes
    ctx.fillStyle = '#66BB6A';
    for (let i = 0; i < 10; i++) {
        ctx.fillRect(0, i * grassCanvas.height/5, grassCanvas.width, grassCanvas.height/10);
    }
    
    // Add texture noise
    for (let i = 0; i < 20000; i++) {
        const x = Math.random() * grassCanvas.width;
        const y = Math.random() * grassCanvas.height;
        ctx.fillStyle = Math.random() > 0.5 ? '#43A047' : '#2E7D32';
        ctx.fillRect(x, y, Math.random() * 2 + 1, Math.random() * 2 + 1);
    }
    
    const grassTexture = new THREE.CanvasTexture(grassCanvas);
    grassTexture.wrapS = THREE.RepeatWrapping;
    grassTexture.wrapT = THREE.RepeatWrapping;
    grassTexture.repeat.set(4, 4);
    
    // Create field
    const fieldGeometry = new THREE.PlaneGeometry(fieldSize.width, fieldSize.length);
    const fieldMaterial = new THREE.MeshPhongMaterial({
        map: grassTexture,
        side: THREE.DoubleSide
    });
    
    const field = new THREE.Mesh(fieldGeometry, fieldMaterial);
    field.rotation.x = -Math.PI / 2;
    field.position.y = -1.6;
    field.receiveShadow = true;
    stadium.add(field);
    
    // UPGRADE 2: Enhanced field markings
    const markingsGroup = new THREE.Group();
    const lineMaterial = new THREE.MeshBasicMaterial({color: 0xffffff, side: THREE.DoubleSide});
    
    // Field outline
    const outlineGeometry = new THREE.BoxGeometry(90, 0.05, 60);
    const outline = new THREE.Mesh(outlineGeometry, lineMaterial);
    outline.position.y = -1.57;
    markingsGroup.add(outline);
    
    // Center line
    const centerLineGeometry = new THREE.BoxGeometry(0.1, 0.05, 60);
    const centerLine = new THREE.Mesh(centerLineGeometry, lineMaterial);
    centerLine.position.y = -1.57;
    markingsGroup.add(centerLine);
    
    // Center circle
    const centerCircleGeometry = new THREE.RingGeometry(9, 9.2, 64);
    const centerCircle = new THREE.Mesh(centerCircleGeometry, lineMaterial);
    centerCircle.position.y = -1.57;
    centerCircle.rotation.x = -Math.PI / 2;
    markingsGroup.add(centerCircle);
    
    // Center spot
    const centerSpotGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.05, 16);
    const centerSpot = new THREE.Mesh(centerSpotGeometry, lineMaterial);
    centerSpot.position.y = -1.57;
    centerSpot.rotation.x = Math.PI / 2;
    markingsGroup.add(centerSpot);
    
    // Penalty areas for both sides
    [-1, 1].forEach(dir => {
        // Create box outlines
        const createBoxOutline = (width, height, z, y = -1.57) => {
            const edges = [
                new THREE.Mesh(new THREE.BoxGeometry(width, 0.05, 0.1), lineMaterial),  // Top
                new THREE.Mesh(new THREE.BoxGeometry(width, 0.05, 0.1), lineMaterial),  // Bottom
                new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.05, height), lineMaterial), // Left
                new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.05, height), lineMaterial)  // Right
            ];
            
            edges[0].position.set(0, y, z - height/2);
            edges[1].position.set(0, y, z + height/2);
            edges[2].position.set(-width/2, y, z);
            edges[3].position.set(width/2, y, z);
            
            const group = new THREE.Group();
            edges.forEach(edge => group.add(edge));
            return group;
        };
        
        // Penalty box
        markingsGroup.add(createBoxOutline(40, 16, dir * 22));
        
        // Goal area
        markingsGroup.add(createBoxOutline(18, 6, dir * 27));
        
        // Penalty spot
        const penaltySpot = new THREE.Mesh(
            new THREE.CylinderGeometry(0.15, 0.15, 0.05, 16),
            lineMaterial
        );
        penaltySpot.position.set(0, -1.57, dir * 20);
        penaltySpot.rotation.x = Math.PI / 2;
        markingsGroup.add(penaltySpot);
        
        // Penalty arc
        const arcPoints = [];
        const arcRadius = 9.15;
        const arcSegments = 32;
        const arcStart = Math.PI * 0.75;
        const arcEnd = Math.PI * 1.25;
        
        for (let i = 0; i <= arcSegments; i++) {
            const angle = dir > 0 
                ? Math.PI * 2 - arcStart - (arcEnd - arcStart) * (i / arcSegments)
                : arcStart + (arcEnd - arcStart) * (i / arcSegments);
            
            arcPoints.push(new THREE.Vector3(
                Math.cos(angle) * arcRadius,
                0,
                dir * 20 + Math.sin(angle) * arcRadius
            ));
        }
        
        const arcGeometry = new THREE.BufferGeometry().setFromPoints(arcPoints);
        const arcLine = new THREE.Line(arcGeometry, new THREE.LineBasicMaterial({color: 0xffffff}));
        arcLine.position.y = -1.57;
        markingsGroup.add(arcLine);
    });
    
    // Corner arcs
    [[-45, -30], [-45, 30], [45, -30], [45, 30]].forEach((pos, i) => {
        const cornerArc = new THREE.Mesh(
            new THREE.RingGeometry(0.9, 1, 32, 1, 0, Math.PI/2),
            lineMaterial
        );
        cornerArc.position.set(pos[0], -1.57, pos[1]);
        cornerArc.rotation.x = -Math.PI / 2;
        cornerArc.rotation.z = i * Math.PI/2;
        markingsGroup.add(cornerArc);
    });
    
    stadium.add(markingsGroup);
    
    // UPGRADE 3: Two goals (north and south)
    
    // Create two goals
    stadium.add(createGoal(0, 30, Math.PI)); // North goal (facing south)
    stadium.add(createGoal(0, -30, 0));      // South goal (facing north)
    
    // UPGRADE 4: Stadium floodlights
    const lightsGroup = new THREE.Group();
    
    // Create a floodlight tower function
    const createFloodlightTower = (x, z) => {
        const tower = new THREE.Group();
        
        // Tower base
        tower.add(new THREE.Mesh(
            new THREE.BoxGeometry(3, 1, 3),
            new THREE.MeshPhongMaterial({color: 0x555555})
        )).position.y = -1.1;
        
        // Tower pole
        const pole = new THREE.Mesh(
            new THREE.CylinderGeometry(0.5, 0.7, 25, 8),
            new THREE.MeshPhongMaterial({color: 0x777777})
        );
        pole.position.y = 10;
        pole.castShadow = true;
        tower.add(pole);
        
        // Light fixtures bar
        const bar = new THREE.Mesh(
            new THREE.BoxGeometry(10, 0.5, 1),
            new THREE.MeshPhongMaterial({color: 0x333333})
        );
        bar.position.y = 22;
        tower.add(bar);
        
        // Add lights
        for (let i = -4; i <= 4; i += 2) {
            // Light housing
            const housing = new THREE.Mesh(
                new THREE.BoxGeometry(1.5, 1, 1),
                new THREE.MeshPhongMaterial({color: 0x222222})
            );
            housing.position.set(i, 22, 0.5);
            tower.add(housing);
            
            // Light emitter (glowing part)
            const emitter = new THREE.Mesh(
                new THREE.PlaneGeometry(1, 0.7),
                new THREE.MeshBasicMaterial({
                    color: 0xffffdd,
                    emissive: 0xffffaa,
                    emissiveIntensity: 1
                })
            );
            emitter.position.set(i, 22, 1.01);
            tower.add(emitter);
            
            // Actual light
            const spotlight = new THREE.SpotLight(0xffffee, 0.7);
            spotlight.position.set(i, 22, 0.5);
            spotlight.target.position.set(i * 3, -1.6, -i * 2);
            spotlight.angle = 0.3;
            spotlight.penumbra = 0.3;
            spotlight.distance = 100;
            
            // Only some lights cast shadows (for performance)
            if (i === 0) {
                spotlight.castShadow = true;
                spotlight.shadow.mapSize.width = 1024;
                spotlight.shadow.mapSize.height = 1024;
            }
            
            tower.add(spotlight);
            tower.add(spotlight.target);
        }
        
        tower.position.set(x, 0, z);
        return tower;
    };
    
    // Add four towers at corners
    lightsGroup.add(createFloodlightTower(-45, -30));
    lightsGroup.add(createFloodlightTower(-45, 30));
    lightsGroup.add(createFloodlightTower(45, -30));
    lightsGroup.add(createFloodlightTower(45, 30));
    stadium.add(lightsGroup);
    
    // UPGRADE 5: Enhanced stands with animated crowd
    const standsGroup = new THREE.Group();
    
    const createEnhancedStand = (x, z, width, depth, height, rotation = 0) => {
        const standGroup = new THREE.Group();
        
        // Main structure
        const stand = new THREE.Mesh(
            new THREE.BoxGeometry(width, height, depth),
            new THREE.MeshPhongMaterial({ color: 0x444444 })
        );
        stand.position.y = height/2 - 1.6;
        stand.castShadow = true;
        standGroup.add(stand);
        
        // Create seating rows
        for (let i = 0; i < 15; i++) {
            const step = new THREE.Mesh(
                new THREE.BoxGeometry(width, 0.2, depth * 0.8),
                new THREE.MeshPhongMaterial({color: 0x666666})
            );
            step.position.y = i * (height * 0.8 / 15) - 1.2;
            standGroup.add(step);
        }
        
        // Create crowd - use instanced mesh for better performance
        const crowdCount = Math.floor((width/1.2) * 10);
        const crowdGeometry = new THREE.SphereGeometry(0.3, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2);
        const crowdMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000 });
        const instancedMesh = new THREE.InstancedMesh(crowdGeometry, crowdMaterial, crowdCount);
        
        // Team colors
        const colors = [
            new THREE.Color(0xff0000), // Red
            new THREE.Color(0x0000ff), // Blue
            new THREE.Color(0xffff00)  // Yellow
        ];
        
        // Position spectators
        const dummy = new THREE.Object3D();
        let instanceId = 0;
        
        for (let row = 0; row < 10; row++) {
            for (let col = 0; col < Math.floor(width/1.2); col++) {
                if (instanceId < crowdCount && Math.random() > 0.2) {
                    dummy.position.set(
                        -width/2 + col * (width/(Math.floor(width/1.2))) + (width/(Math.floor(width/1.2)))/2,
                        row * (height/10) - 0.5,
                        depth/2 - row * (depth/10) - 0.7
                    );
                    
                    dummy.rotation.y = Math.PI + (Math.random() * 0.4 - 0.2);
                    
                    // Set color by section
                    const section = Math.floor(col / (Math.floor(width/1.2) / 3));
                    instancedMesh.setColorAt(instanceId, colors[section % colors.length]);
                    
                    // Apply matrix
                    dummy.updateMatrix();
                    instancedMesh.setMatrixAt(instanceId, dummy.matrix);
                    
                    // Set up animation for the wave
                    if (row % 3 === 0 || Math.random() > 0.7) {
                        if (!instancedMesh.userData) instancedMesh.userData = {};
                        if (!instancedMesh.userData.animations) instancedMesh.userData.animations = [];
                        
                        instancedMesh.userData.animations.push({
                            id: instanceId,
                            initialY: dummy.position.y,
                            phase: col * 0.1 + Math.random() * 0.5,
                            speed: 1 + Math.random() * 0.5,
                            amplitude: 0.15 + Math.random() * 0.1
                        });
                    }
                    
                    instanceId++;
                }
            }
        }
        
        instancedMesh.instanceMatrix.needsUpdate = true;
        standGroup.add(instancedMesh);
        
        // Position the stand
        standGroup.position.set(x, 0, z);
        standGroup.rotation.y = rotation;
        return standGroup;
    };
    
    // Add stands on all sides
    standsGroup.add(createEnhancedStand(0, 40, 100, 15, 15));
    standsGroup.add(createEnhancedStand(0, -40, 100, 15, 15));
    standsGroup.add(createEnhancedStand(52, 0, 15, 70, 20, Math.PI/2));
    standsGroup.add(createEnhancedStand(-52, 0, 15, 70, 20, Math.PI/2));
    
    // Corner stands
    standsGroup.add(createEnhancedStand(40, 30, 25, 25, 15, Math.PI/4));
    standsGroup.add(createEnhancedStand(-40, 30, 25, 25, 15, -Math.PI/4));
    standsGroup.add(createEnhancedStand(40, -30, 25, 25, 15, -Math.PI/4));
    standsGroup.add(createEnhancedStand(-40, -30, 25, 25, 15, Math.PI/4));
    
    stadium.add(standsGroup);
    
    // UPGRADE 6: Stadium features - corner flags, benches, etc.
    const featuresGroup = new THREE.Group();
    
    // Create corner flags
    const createCornerFlag = (x, z) => {
        const flagGroup = new THREE.Group();
        
        // Flag pole
        const pole = new THREE.Mesh(
            new THREE.CylinderGeometry(0.03, 0.03, 1.8, 8),
            new THREE.MeshPhongMaterial({color: 0xdddddd})
        );
        pole.position.y = -0.7;
        flagGroup.add(pole);
        
        // Flag cloth
        const flag = new THREE.Mesh(
            new THREE.PlaneGeometry(0.6, 0.4),
            new THREE.MeshPhongMaterial({
                color: 0xff0000, 
                side: THREE.DoubleSide
            })
        );
        flag.position.set(0.3, 0.4, 0);
        flag.rotation.z = -Math.PI/10;
        pole.add(flag);
        
        // Animate flag waving
        gsap.to(flag.rotation, {
            z: -Math.PI/8,
            duration: 1.5,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut"
        });
        
        flagGroup.position.set(x, -1.6, z);
        return flagGroup;
    };
    
    // Add corner flags
    featuresGroup.add(createCornerFlag(45, 30));
    featuresGroup.add(createCornerFlag(-45, 30));
    featuresGroup.add(createCornerFlag(45, -30));
    featuresGroup.add(createCornerFlag(-45, -30));
    
    // Team benches
    const createTeamBench = (x, z, teamColor) => {
        const benchGroup = new THREE.Group();
        
        // Bench structure
        const base = new THREE.Mesh(
            new THREE.BoxGeometry(10, 0.5, 2),
            new THREE.MeshPhongMaterial({color: 0x333333})
        );
        base.position.y = -1.35;
        benchGroup.add(base);
        
        // Bench back
        const back = new THREE.Mesh(
            new THREE.BoxGeometry(10, 2, 0.3),
            new THREE.MeshPhongMaterial({color: teamColor})
        );
        back.position.set(0, -0.35, -0.85);
        benchGroup.add(back);
        
        // Roof
        const roof = new THREE.Mesh(
            new THREE.BoxGeometry(10, 0.2, 3),
            new THREE.MeshPhongMaterial({
                color: 0xaaaaaa,
                transparent: true,
                opacity: 0.7
            })
        );
        roof.position.y = 1.5;
        benchGroup.add(roof);
        
        // Add players on bench
        for (let i = 0; i < 6; i++) {
            // Player body - replace CapsuleGeometry with CylinderGeometry
            const bodyGeometry = new THREE.CylinderGeometry(0.25, 0.25, 0.8, 8);
            bodyGeometry.rotateX(Math.PI/6); // Rotate to sitting position
            
            const body = new THREE.Mesh(
                bodyGeometry,
                new THREE.MeshPhongMaterial({ color: teamColor })
            );
            body.position.set(-4 + i * 1.6, -0.8, -0.3);
            benchGroup.add(body);
            
            // Player head
            const head = new THREE.Mesh(
                new THREE.SphereGeometry(0.25, 16, 16),
                new THREE.MeshPhongMaterial({ color: teamColor })
            );
            head.position.set(-4 + i * 1.6, -0.25, -0.3);
            benchGroup.add(head);
        }
        
        benchGroup.position.set(x, 0, z);
        return benchGroup;
    };
    
    // Add team benches
    featuresGroup.add(createTeamBench(-15, -33, 0xff0000)); // Home (red)
    featuresGroup.add(createTeamBench(15, -33, 0x0000ff));  // Away (blue)
    
    // Add advertising boards
    const createAdBoards = () => {
        const boardsGroup = new THREE.Group();
        const adTexts = ['SPORTS', 'SPONSOR', 'TEAM', 'BRAND', 'COMPANY'];
        const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#00ffff'];
        
        // Create boards along the sidelines
        for (let i = 0; i < 15; i++) {
            const boardCanvas = document.createElement('canvas');
            boardCanvas.width = 512;
            boardCanvas.height = 128;
            const ctx = boardCanvas.getContext('2d');
            
            // Background color
            const bgColor = colors[i % colors.length];
            ctx.fillStyle = bgColor;
            ctx.fillRect(0, 0, boardCanvas.width, boardCanvas.height);
            
            // Ad text
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 60px Arial';
            ctx.textAlign = 'center'; 
            ctx.fillText(adTexts[i % adTexts.length], boardCanvas.width/2, boardCanvas.height/2 + 20);
            
            const texture = new THREE.CanvasTexture(boardCanvas);
            const material = new THREE.MeshPhongMaterial({
                map: texture,
                side: THREE.DoubleSide
            });
            
            // North side board
            const northBoard = new THREE.Mesh(
                new THREE.BoxGeometry(6, 1, 0.1),
                material
            );
            northBoard.position.set(-42 + i * 6, -1.1, 30.5);
            boardsGroup.add(northBoard);
            
            // South side board (flipped)
            const southBoard = new THREE.Mesh(
                new THREE.BoxGeometry(6, 1, 0.1),
                material.clone()
            );
            southBoard.position.set(-42 + i * 6, -1.1, -30.5);
            southBoard.rotation.y = Math.PI;
            boardsGroup.add(southBoard);
        }
        
        return boardsGroup;
    };
    
    featuresGroup.add(createAdBoards());
    
    // Add scoreboard
    const scoreboard = new THREE.Group();
    const boardGeometry = new THREE.BoxGeometry(10, 6, 1);
    const boardMaterial = new THREE.MeshPhongMaterial({color: 0x222222});
    const board = new THREE.Mesh(boardGeometry, boardMaterial);
    board.position.y = 8;
    scoreboard.add(board);
    
    // Score display screen
    const screenCanvas = document.createElement('canvas');
    screenCanvas.width = 512;
    screenCanvas.height = 256;
    const screenCtx = screenCanvas.getContext('2d');
    
    // Initial screen content
    screenCtx.fillStyle = '#000000';
    screenCtx.fillRect(0, 0, screenCanvas.width, screenCanvas.height);
    
    screenCtx.fillStyle = '#ffffff';
    screenCtx.font = 'bold 50px Arial';
    screenCtx.textAlign = 'center';
    screenCtx.fillText('SCORE', screenCanvas.width/2, 50);
    
    screenCtx.font = 'bold 120px Arial';
    screenCtx.fillText('0', screenCanvas.width/2, 170);
    
    const screenTexture = new THREE.CanvasTexture(screenCanvas);
    const screenMaterial = new THREE.MeshBasicMaterial({ 
        map: screenTexture,
        emissive: 0xffffff
    });
    
    const screen = new THREE.Mesh(
        new THREE.PlaneGeometry(9, 5),
        screenMaterial
    );
    screen.position.set(0, 8, 0.51);
    scoreboard.add(screen);
    
    scoreboard.position.set(0, 0, -40);
    featuresGroup.add(scoreboard);
    
    // Update scoreboard when score changes
    const originalCheckGoal = checkGoal;
    checkGoal = function() {
        const prevScore = score;
        originalCheckGoal.apply(this, arguments);
        
        // If score changed, update scoreboard
        if (score !== prevScore) {
            screenCtx.fillStyle = '#000000';
            screenCtx.fillRect(0, 0, screenCanvas.width, screenCanvas.height);
            
            screenCtx.fillStyle = '#ffffff';
            screenCtx.font = 'bold 50px Arial';
            screenCtx.textAlign = 'center';
            screenCtx.fillText('SCORE', screenCanvas.width/2, 50);
            
            screenCtx.font = 'bold 120px Arial';
            screenCtx.fillText(score.toString(), screenCanvas.width/2, 170);
            
            screenTexture.needsUpdate = true;
        }
    };
    
    stadium.add(featuresGroup);

    return stadium;
}

// Add stadium to the scene
const stadium = createStadium();
scene.add(stadium);

// Replace existing floor with stadium's field
scene.remove(floor);
scene.remove(gridHelper);

// Fix the player movement function to avoid modifying a constant
const originalUpdatePlayerMovement = updatePlayerMovement;
updatePlayerMovement = function(delta) {
    if (isPointerLocked && !isCharging) {
        // Calculate movement based on keys pressed
        const moveDirection = new THREE.Vector3();
        
        // Reverse W/S controls (swap moveForward/moveBackward flags)
        if (moveForward) moveDirection.z += 1;  // W now moves forward
        if (moveBackward) moveDirection.z -= 1;  // S now moves backward
        if (moveLeft) moveDirection.x += 1;  // Keep A/D reversed
        if (moveRight) moveDirection.x -= 1;  // Keep A/D reversed
        
        // Use modified speed with multiplier instead of changing the constant
        const modifiedSpeed = speed;
        
        // Apply movement
        if (moveDirection.length() > 0) {
            moveDirection.normalize();
            moveDirection.applyAxisAngle(new THREE.Vector3(0, 1, 0), human.rotation.y);
            human.position.x += moveDirection.x * modifiedSpeed * delta;
            human.position.z += moveDirection.z * modifiedSpeed * delta;
            
            if (!isRunning) {
                isRunning = true;
                createRunAnimation();
                document.getElementById('animation-status').textContent = 'Running';
            }
        } else if (isRunning) {
            isRunning = false;
            createIdleAnimation();
            document.getElementById('animation-status').textContent = 'Idle';
        }
    }
};

// Remove ultimate abilities system - keep only the speed multiplier variable
let speedMultiplier = 1;

// Modify the pointer lock event to remove ultimate UI references
document.addEventListener('pointerlockchange', (event) => {
    if (document.pointerLockElement === document.body || 
        document.mozPointerLockElement === document.body || 
        document.webkitPointerLockElement === document.body) {
        
        isPointerLocked = true;
        blocker.style.display = 'none';
        
        // Start idle animation when game starts
        createIdleAnimation();
        
        // Make sure play controls are visible when game is active
        showGameUI();
        
    } else {
        isPointerLocked = false;
        blocker.style.display = 'flex';
        pauseAnimation();
        hideGameUI(false);
    }
}, false);

// Update show/hide game UI functions to remove ultimate references
function showGameUI() {
    // Create play controls if they don't exist
    if (!document.getElementById('play-controls')) {
        createPlayButton();
    }
    
    // Make sure UI elements are visible
    const playControls = document.getElementById('play-controls');
    const ultimatesContainer = document.getElementById('ultimates-container');
    
    if (playControls) playControls.style.display = 'flex';
    if (ultimatesContainer) playControls.style.display = 'flex';
}

function hideGameUI(removeElements = false) {
    const elements = [
        document.getElementById('play-controls'),
        document.getElementById('ultimates-container')
    ];
    
    elements.forEach(element => {
        if (element) {
            if (removeElements) {
                element.remove();
            } else {
                element.style.display = 'none';
            }
        }
    });
}

// Initialize play button when game starts and pointer lock is acquired
document.addEventListener('pointerlockchange', pointerLockChange, false);

// Add keyboard shortcut for pause/play (Space key)
document.addEventListener('keydown', function(event) {
    if (event.code === 'Space' && isPointerLocked) {
        const playButton = document.getElementById('play-button');
        if (playButton) {
            playButton.click(); // Simulate click on play/pause button
        }
    }
});

// Add ultimate ability system
let ultimateCharge = 0;
const ultimateMaxCharge = 100;
let ultimateActive = false;
let ultimateCooldown = false;
const ultimateDuration = 5000; // 5 seconds
const ultimateCooldownTime = 10000; // 10 seconds

// After key up/down handlers, add M key for controls and F key for ultimate
document.addEventListener('keydown', (event) => {
    // Existing E key handler for shot type switching
    if (event.code === 'KeyE') {
        currentShotIndex = (currentShotIndex + 1) % shotTypeKeys.length;
        shotType = shotTypeKeys[currentShotIndex];
        abilityUI.innerHTML = `Current Ability: ${shotTypes[shotType].name} (Press E to change)`;
    }
    
    // Add M key to toggle controls overlay
    if (event.code === 'KeyM') {
        toggleControlsOverlay();
    }
    
    // Add F key to activate ultimate ability
    if (event.code === 'KeyF' && isPointerLocked) {
        activateUltimate();
    }
});

// Toggle controls overlay visibility
function toggleControlsOverlay() {
    const overlay = document.getElementById('controls-overlay');
    if (overlay.style.display === 'block') {
        overlay.style.display = 'none';
    } else {
        overlay.style.display = 'block';
    }
}

// Ultimate ability activation
function activateUltimate() {
    if (ultimateCharge >= ultimateMaxCharge && !ultimateActive && !ultimateCooldown) {
        ultimateActive = true;
        ultimateCharge = 0;
        updateUltimateUI();
        
        // Apply ultimate effects
        const ultimateSpeedBoost = 3;
        speedMultiplier = ultimateSpeedBoost;
        
        // Create visual effects for ultimate
        createUltimateEffect();
        
        // Show ultimate active message
        showUltimateMessage('ULTIMATE ACTIVE!', '#ffcc00');
        
        // End ultimate after duration
        setTimeout(() => {
            ultimateActive = false;
            speedMultiplier = 1;
            ultimateCooldown = true;
            
            // Show cooldown message
            showUltimateMessage('ULTIMATE COOLDOWN', '#3366ff');
            
            // Reset cooldown after time
            setTimeout(() => {
                ultimateCooldown = false;
                updateUltimateUI();
            }, ultimateCooldownTime);
            
        }, ultimateDuration);
    } else if (ultimateActive) {
        showUltimateMessage('ULTIMATE ALREADY ACTIVE', '#ffcc00');
    } else if (ultimateCooldown) {
        showUltimateMessage('ULTIMATE ON COOLDOWN', '#ff3366');
    } else {
        showUltimateMessage('ULTIMATE NOT READY', '#ff3366');
    }
}

// Update ultimate UI
function updateUltimateUI() {
    const ultimateFill = document.getElementById('ultimate-fill');
    const ultimateText = document.getElementById('ultimate-text');
    const ultimateContainer = document.getElementById('ultimate-container');
    
    // Update fill percentage
    ultimateFill.style.width = `${ultimateCharge}%`;
    
    // Update text content
    if (ultimateActive) {
        ultimateText.textContent = 'ULTIMATE ACTIVE!';
        ultimateContainer.classList.add('ultimate-ready');
    } else if (ultimateCooldown) {
        ultimateText.textContent = 'COOLDOWN';
        ultimateContainer.classList.remove('ultimate-ready');
    } else if (ultimateCharge >= ultimateMaxCharge) {
        ultimateText.textContent = 'ULTIMATE READY!';
        ultimateContainer.classList.add('ultimate-ready');
    } else {
        ultimateText.textContent = `ULTIMATE: ${Math.round(ultimateCharge)}%`;
        ultimateContainer.classList.remove('ultimate-ready');
    }
}

// Display ultimate messages
function showUltimateMessage(message, color) {
    const ultimateMessage = document.createElement('div');
    ultimateMessage.style.cssText = `
        position: absolute;
        top: 40%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.7);
        color: ${color};
        padding: 15px 30px;
        border-radius: 5px;
        font-family: Arial, sans-serif;
        font-size: 28px;
        font-weight: bold;
        z-index: 1000;
        text-shadow: 0 0 10px rgba(0, 0, 0, 0.7);
        opacity: 0;
    `;
    ultimateMessage.textContent = message;
    document.body.appendChild(ultimateMessage);
    
    // Animation
    gsap.to(ultimateMessage, {
        opacity: 1,
        duration: 0.3,
        onComplete: () => {
            gsap.to(ultimateMessage, {
                opacity: 0,
                delay: 1,
                duration: 0.5,
                onComplete: () => {
                    document.body.removeChild(ultimateMessage);
                }
            });
        }
    });
}

// Create visual effects for ultimate ability
function createUltimateEffect() {
    // Create trail effect behind player
    const trailInterval = setInterval(() => {
        if (!ultimateActive) {
            clearInterval(trailInterval);
            return;
        }
        
        const trailGeometry = new THREE.SphereGeometry(0.3, 8, 8);
        const trailMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xffcc00,
            transparent: true,
            opacity: 0.7
        });
        
        const trailParticle = new THREE.Mesh(trailGeometry, trailMaterial);
        trailParticle.position.copy(human.position);
        trailParticle.position.y -= 0.5; // Slightly below player
        scene.add(trailParticle);
        
        // Animate and remove the particle
        gsap.to(trailParticle.scale, {
            x: 0,
            y: 0,
            z: 0,
            duration: 0.8,
            ease: "power2.in"
        });
        
        gsap.to(trailMaterial, {
            opacity: 0,
            duration: 0.8,
            ease: "power2.in",
            onComplete: () => {
                scene.remove(trailParticle);
            }
        });
    }, 100);
    
    // Create glow effect around player
    const glowGeometry = new THREE.SphereGeometry(1.2, 32, 32);
    const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0xffcc00,
        transparent: true,
        opacity: 0.3,
        side: THREE.BackSide
    });
    
    const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
    human.add(glowMesh);
    
    // Animate glow
    const glowAnimation = gsap.to(glowMaterial, {
        opacity: 0.5,
        duration: 0.8,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
    });
    
    // Remove glow when ultimate ends
    setTimeout(() => {
        glowAnimation.kill();
        gsap.to(glowMaterial, {
            opacity: 0,
            duration: 0.5,
            onComplete: () => {
                human.remove(glowMesh);
            }
        });
    }, ultimateDuration);
}

// Add ultimate charge mechanism - increment when scoring goals or kicking the ball
function incrementUltimateCharge(amount) {
    if (!ultimateActive && !ultimateCooldown) {
        ultimateCharge = Math.min(ultimateCharge + amount, ultimateMaxCharge);
        updateUltimateUI();
    }
}

// Modify executeKick to increase ultimate charge when kicking
const originalExecuteKick = executeKick;
executeKick = function() {
    const result = originalExecuteKick.apply(this, arguments);
    
    // Add ultimate charge when kicking the ball
    if (canKickBall()) {
        incrementUltimateCharge(5);
    }
    
    return result;
};

// Modify checkGoal to increment ultimate charge on successful goal
const originalCheckGoal = checkGoal;
checkGoal = function() {
    // Save the previous score to check if it changed
    const previousScore = score;
    
    // Call the original function
    originalCheckGoal.apply(this, arguments);
    
    // If score increased, add ultimate charge
    if (score > previousScore) {
        incrementUltimateCharge(25); // Big charge for scoring a goal
    }
};

// Add close button functionality for controls overlay
document.addEventListener('DOMContentLoaded', function() {
    // Setup controls overlay close button
    const closeButton = document.querySelector('#controls-overlay .close-button');
    if (closeButton) {
        closeButton.addEventListener('click', () => {
            document.getElementById('controls-overlay').style.display = 'none';
        });
    }
    
    // Initialize ultimate UI
    updateUltimateUI();
});

// Add call to update ultimate UI in animation loop
const originalAnimateFunction = animate;
animate = function() {
    originalAnimateFunction.apply(this, arguments);
    
    // Naturally regenerate ultimate charge over time (slow)
    if (!ultimateActive && !ultimateCooldown && ultimateCharge < ultimateMaxCharge) {
        ultimateCharge += 0.02;
        if (ultimateCharge >= ultimateMaxCharge || ultimateCharge % 5 < 0.02) {
            updateUltimateUI();
        }
    }
};

// Replace ultimate ability system with the heel flick ability
let heelFlickCooldown = false;
const heelFlickCooldownTime = 3000; // 3 seconds cooldown

// Create a UI indicator for the heel flick ability
const heelFlickUI = document.createElement('div');
heelFlickUI.style.cssText = `
    position: absolute;
    bottom: 60px;
    right: 20px;
    background: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 10px 15px;
    border-radius: 5px;
    font-family: Arial;
    display: flex;
    align-items: center;
    gap: 10px;
`;

const heelFlickIcon = document.createElement('div');
heelFlickIcon.style.cssText = `
    width: 20px;
    height: 20px;
    background: #ffcc00;
    border-radius: 50%;
    box-shadow: 0 0 10px #ffcc00;
    transition: all 0.3s ease;
`;

const heelFlickText = document.createElement('div');
heelFlickText.textContent = "Heel Flick: Ready (F)";

heelFlickUI.appendChild(heelFlickIcon);
heelFlickUI.appendChild(heelFlickText);
document.body.appendChild(heelFlickUI);

// Update F key handler to use heel flick instead of ultimate
document.addEventListener('keydown', (event) => {
    // Existing E key handler for shot type switching
    if (event.code === 'KeyE') {
        currentShotIndex = (currentShotIndex + 1) % shotTypeKeys.length;
        shotType = shotTypeKeys[currentShotIndex];
        abilityUI.innerHTML = `Current Ability: ${shotTypes[shotType].name} (Press E to change)`;
    }
    
    // M key to toggle controls overlay
    if (event.code === 'KeyM') {
        toggleControlsOverlay();
    }
    
    // F key to activate heel flick dash ability
    if (event.code === 'KeyF' && isPointerLocked && !heelFlickCooldown && !isCharging) {
        performHeelFlick();
    }
});

// Heel flick ability function
function performHeelFlick() {
    // Check if ball is in control range
    if (!checkBallInControlRange()) {
        showHeelFlickMessage('Ball not in control range!', '#ff3366');
        return;
    }
    
    // Set cooldown
    heelFlickCooldown = true;
    updateHeelFlickUI();
    
    // Get direction vector (facing direction)
    const direction = new THREE.Vector3(0, 0, 1);
    direction.applyQuaternion(human.quaternion);
    
    // Calculate dash distance and speed
    const dashDistance = 5; // 5 units
    const dashDuration = 0.5; // 0.5 seconds
    
    // Create heel flick animation
    createHeelFlickAnimation();
    
    // Create visual effects
    createHeelFlickEffects(direction);
    
    // Move player in facing direction
    const targetPosition = human.position.clone().add(
        direction.clone().multiplyScalar(dashDistance)
    );
    
    // Make sure the ball follows along
    const ballOffset = ball.position.clone().sub(human.position);
    
    // Animate the dash movement
    gsap.to(human.position, {
        x: targetPosition.x,
        z: targetPosition.z,
        duration: dashDuration,
        ease: "power2.inOut",
        onUpdate: function() {
            // Bring the ball along with a slight delay
            ball.userData.velocity.set(
                (human.position.x + ballOffset.x - ball.position.x) * 5,
                ball.userData.velocity.y + 0.5, // Add a small upward force
                (human.position.z + ballOffset.z - ball.position.z) * 5
            );
            ball.userData.isMoving = true;
            
            // Add some spin to the ball during the heel flick
            ball.userData.spin = 3;
        }
    });
    
    // Show message
    showHeelFlickMessage('Heel Flick!', '#ffcc00');
    
    // Reset cooldown after delay
    setTimeout(() => {
        heelFlickCooldown = false;
        updateHeelFlickUI();
        
        // Play a sound when ability is ready again
        playAbilityReadySound();
    }, heelFlickCooldownTime);
}

// Create heel flick animation
function createHeelFlickAnimation() {
    // Get body parts
    const leftLeg = human.getObjectByName("leftLeg");
    const rightLeg = human.getObjectByName("rightLeg");
    const leftKnee = leftLeg.getObjectByName("knee");
    const rightKnee = rightLeg.getObjectByName("knee");
    
    // Cancel any existing animation
    if (currentAnimation) {
        currentAnimation.kill();
    }
    
    // Create animation timeline
    const timeline = gsap.timeline({
        onComplete: function() {
            // Return to running or idle animation when finished
            if (isRunning) {
                createRunAnimation();
            } else {
                createIdleAnimation();
            }
        }
    });
    
    // Heel flick animation - quick and fancy footwork
    timeline.to(rightLeg.rotation, { 
        x: 0.3, 
        y: 0.2,
        duration: 0.2,
        ease: "power2.in" 
    }, 0);
    
    timeline.to(rightKnee.rotation, { 
        x: 0.8, 
        duration: 0.2,
        ease: "power2.in" 
    }, 0);
    
    // Left leg stays planted
    timeline.to(leftLeg.rotation, { 
        x: 0, 
        duration: 0.2,
        ease: "power2.in" 
    }, 0);
    
    // Quick flick motion
    timeline.to(rightLeg.rotation, { 
        x: -0.5, 
        y: -0.2,
        duration: 0.15,
        ease: "power3.out" 
    }, 0.2);
    
    timeline.to(rightKnee.rotation, { 
        x: 0.3, 
        duration: 0.15,
        ease: "power3.out" 
    }, 0.2);
    
    // Return to position
    timeline.to([rightLeg.rotation, leftLeg.rotation, rightKnee.rotation, leftKnee.rotation], {
        x: 0,
        y: 0,
        duration: 0.15,
        ease: "power1.inOut"
    }, 0.35);
    
    // Save the animation
    currentAnimation = timeline;
    
    return timeline;
}

// Create visual effects for heel flick
function createHeelFlickEffects(direction) {
    // Create a trail effect behind the player
    for (let i = 0; i < 15; i++) {
        // Wait a bit between particles
        setTimeout(() => {
            // Trail particle
            const trailGeometry = new THREE.SphereGeometry(0.2, 8, 8);
            const trailMaterial = new THREE.MeshBasicMaterial({
                color: 0x3366ff,
                transparent: true,
                opacity: 0.7
            });
            
            const trailParticle = new THREE.Mesh(trailGeometry, trailMaterial);
            
            // Position slightly behind player with some randomness
            const offset = direction.clone().negate().multiplyScalar(0.5 + Math.random() * 0.5);
            offset.x += (Math.random() - 0.5) * 0.5;
            offset.y += Math.random() * 0.3;
            
            trailParticle.position.copy(human.position.clone().add(offset));
            scene.add(trailParticle);
            
            // Animate and remove
            gsap.to(trailParticle.scale, {
                x: 0,
                y: 0,
                z: 0,
                duration: 0.7,
                ease: "power3.out"
            });
            
            gsap.to(trailMaterial, {
                opacity: 0,
                duration: 0.7,
                ease: "power3.out",
                onComplete: () => {
                    scene.remove(trailParticle);
                }
            });
        }, i * 30); // Staggered timing
    }
    
    // Add a speed line effect
    const speedLineGeometry = new THREE.PlaneGeometry(5, 0.1);
    const speedLineMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.6,
        side: THREE.DoubleSide
    });
    
    // Create several speed lines
    for (let i = 0; i < 10; i++) {
        const speedLine = new THREE.Mesh(speedLineGeometry, speedLineMaterial.clone());
        
        // Position around the player
        const yOffset = (Math.random() - 0.5) * 1.5;
        speedLine.position.copy(human.position.clone());
        speedLine.position.y += yOffset;
        
        // Align with movement direction
        speedLine.lookAt(human.position.clone().add(direction));
        speedLine.rotateX(Math.PI / 2);
        
        scene.add(speedLine);
        
        // Animate speed lines
        gsap.to(speedLine.scale, {
            x: 0,
            duration: 0.5,
            ease: "power2.in",
            delay: Math.random() * 0.2,
            onComplete: () => {
                scene.remove(speedLine);
            }
        });
    }
}

// Update heel flick UI
function updateHeelFlickUI() {
    if (heelFlickCooldown) {
        heelFlickIcon.style.background = "#555555";
        heelFlickIcon.style.boxShadow = "none";
        heelFlickText.textContent = "Heel Flick: Cooldown (F)";
    } else {
        heelFlickIcon.style.background = "#ffcc00";
        heelFlickIcon.style.boxShadow = "0 0 10px #ffcc00";
        heelFlickText.textContent = "Heel Flick: Ready (F)";
    }
}

// Show heel flick message
function showHeelFlickMessage(message, color) {
    const heelFlickMessage = document.createElement('div');
    heelFlickMessage.style.cssText = `
        position: absolute;
        top: 40%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.7);
        color: ${color};
        padding: 15px 30px;
        border-radius: 5px;
        font-family: Arial, sans-serif;
        font-size: 28px;
        font-weight: bold;
        z-index: 1000;
        text-shadow: 0 0 10px rgba(0, 0, 0, 0.7);
        opacity: 0;
    `;
    heelFlickMessage.textContent = message;
    document.body.appendChild(heelFlickMessage);
    
    // Animation
    gsap.to(heelFlickMessage, {
        opacity: 1,
        duration: 0.3,
        onComplete: () => {
            gsap.to(heelFlickMessage, {
                opacity: 0,
                delay: 1,
                duration: 0.5,
                onComplete: () => {
                    document.body.removeChild(heelFlickMessage);
                }
            });
        }
    });
}

// Play a sound when ability is ready
function playAbilityReadySound() {
    // Create an audio context and oscillator for a simple sound effect
    // This is a simple approach that works without external audio files
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Create oscillator for beep sound
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(660, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(880, audioContext.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + 0.01);
        gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.3);
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.3);
    } catch(e) {
        console.warn("Audio not supported:", e);
    }
}

// Update show/hide game UI functions to include heel flick UI
function showGameUI() {
    // Create play controls if they don't exist
    if (!document.getElementById('play-controls')) {
        createPlayButton();
    }
    
    // Make sure UI elements are visible
    const playControls = document.getElementById('play-controls');
    if (playControls) playControls.style.display = 'flex';
    
    // Show heel flick UI
    heelFlickUI.style.display = 'flex';
}

function hideGameUI(removeElements = false) {
    const playControls = document.getElementById('play-controls');
    
    if (playControls) {
        if (removeElements) {
            playControls.remove();
        } else {
            playControls.style.display = 'none';
        }
    }
    
    // Hide heel flick UI
    heelFlickUI.style.display = 'none';
}

// Remove ultimate ability functions and variables
// (The code from lines ultimate* variable declarations to updateUltimateUI functions can be removed)
// Since we've replaced them with the heel flick ability

// Update controls overlay to include heel flick
// ...existing code...
