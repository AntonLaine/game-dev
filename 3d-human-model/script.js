// Set up scene, camera, and renderer
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 1.7, 7); // Position camera at human eye level

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// Add orbit controls
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.target.set(0, 1, 0); // Look at the center of the human

// Add lights
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(5, 10, 7);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 1024;
directionalLight.shadow.mapSize.height = 1024;
scene.add(directionalLight);

// Create a human figure
function createHuman() {
    const human = new THREE.Group();
    human.position.y = 0.3; // Lift the entire human up a bit
    
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
    rightArm.position.set(0.425, 1.55, 0); // Position at shoulder
    rightArm.name = "rightArm"; // Add name for animation targeting
    human.add(rightArm);
    
    // Left arm
    const leftArm = createArm(skinMaterial, clothesMaterial);
    leftArm.position.set(-0.425, 1.55, 0); // Position at shoulder
    leftArm.rotation.z = Math.PI; // Rotate to point left instead of right
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

// Helper function to create an arm for T-pose
function createArm(skinMaterial, clothesMaterial) {
    const arm = new THREE.Group();
    
    // Upper arm (biceps) - pointing directly right
    const upperArm = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.1, 0.6, 16),
        clothesMaterial
    );
    upperArm.rotation.z = Math.PI / 2; // Make horizontal
    upperArm.position.x = 0.3; // Center the arm at shoulder
    upperArm.castShadow = true;
    arm.add(upperArm);
    
    // Lower arm (forearm) - continuing from upper arm
    const lowerArm = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.08, 0.6, 16),
        skinMaterial
    );
    lowerArm.rotation.z = Math.PI / 2; // Make horizontal
    lowerArm.position.x = 0.9; // Position after the upper arm
    lowerArm.castShadow = true;
    arm.add(lowerArm);
    
    // Hand
    const hand = new THREE.Mesh(
        new THREE.SphereGeometry(0.1, 16, 16),
        skinMaterial
    );
    hand.scale.set(1.2, 0.6, 0.8); // Adjust hand proportions
    hand.position.x = 1.35; // Place at the end of the forearm
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
    
    // Foot
    const foot = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 0.1, 0.3),
        skinMaterial
    );
    foot.position.set(0, -0.85, 0.1); // Adjusted for longer lower leg
    foot.castShadow = true;
    foot.name = "foot";
    knee.add(foot);
    
    return leg;
}

// Add human to the scene
const human = createHuman();
scene.add(human);

// Create floor
const floorGeometry = new THREE.PlaneGeometry(20, 20);
const floorMaterial = new THREE.MeshPhongMaterial({
    color: 0x999999,
    side: THREE.DoubleSide
});

const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -1.6; // Lowered to be under the human's feet
floor.receiveShadow = true;
scene.add(floor);

// Add grid for reference (positioned at floor level)
const gridHelper = new THREE.GridHelper(20, 20);
gridHelper.position.y = -1.59; // Slightly above the floor, also lowered
scene.add(gridHelper);

// Animation system
let currentAnimation = null;
const keyframes = [];
let isPlaying = false;

// Reset to T-pose
function resetToTPose() {
    // Cancel any ongoing animation
    if (currentAnimation) {
        currentAnimation.kill();
    }
    
    const rightLeg = human.getObjectByName("rightLeg");
    const leftLeg = human.getObjectByName("leftLeg");
    const rightArm = human.getObjectByName("rightArm");
    const leftArm = human.getObjectByName("leftArm");
    
    // Reset all rotations
    gsap.to(rightLeg.rotation, { x: 0, y: 0, z: 0, duration: 0.5 });
    gsap.to(leftLeg.rotation, { x: 0, y: 0, z: 0, duration: 0.5 });
    gsap.to(rightArm.rotation, { x: 0, y: 0, z: 0, duration: 0.5 });
    gsap.to(leftArm.rotation, { x: 0, y: 0, z: Math.PI, duration: 0.5 });
    
    // Reset knee rotations
    const rightKnee = rightLeg.getObjectByName("knee");
    const leftKnee = leftLeg.getObjectByName("knee");
    gsap.to(rightKnee.rotation, { x: 0, y: 0, z: 0, duration: 0.5 });
    gsap.to(leftKnee.rotation, { x: 0, y: 0, z: 0, duration: 0.5 });
    
    // Reset human position
    gsap.to(human.position, { y: 0.3, duration: 0.5 });
    
    // Reset sliders
    updateSlidersFromModel();
}

// Update model based on slider values
function updateModelFromSliders() {
    // Get parts
    const rightArm = human.getObjectByName("rightArm");
    const leftArm = human.getObjectByName("leftArm");
    const rightLeg = human.getObjectByName("rightLeg");
    const leftLeg = human.getObjectByName("leftLeg");
    const rightKnee = rightLeg.getObjectByName("knee");
    const leftKnee = leftLeg.getObjectByName("knee");
    
    // Update based on slider values
    rightArm.rotation.x = degToRad(document.getElementById('right-arm-x').value);
    rightArm.rotation.y = degToRad(document.getElementById('right-arm-y').value);
    rightArm.rotation.z = degToRad(document.getElementById('right-arm-z').value);
    
    leftArm.rotation.x = degToRad(document.getElementById('left-arm-x').value);
    leftArm.rotation.y = degToRad(document.getElementById('left-arm-y').value);
    leftArm.rotation.z = degToRad(document.getElementById('left-arm-z').value);
    
    rightLeg.rotation.x = degToRad(document.getElementById('right-leg-x').value);
    rightLeg.rotation.y = degToRad(document.getElementById('right-leg-y').value);
    rightLeg.rotation.z = degToRad(document.getElementById('right-leg-z').value);
    
    leftLeg.rotation.x = degToRad(document.getElementById('left-leg-x').value);
    leftLeg.rotation.y = degToRad(document.getElementById('left-leg-y').value);
    leftLeg.rotation.z = degToRad(document.getElementById('left-leg-z').value);
    
    rightKnee.rotation.x = degToRad(document.getElementById('right-knee-x').value);
    leftKnee.rotation.x = degToRad(document.getElementById('left-knee-x').value);
}

// Update sliders based on model's current position
function updateSlidersFromModel() {
    // Get parts
    const rightArm = human.getObjectByName("rightArm");
    const leftArm = human.getObjectByName("leftArm");
    const rightLeg = human.getObjectByName("rightLeg");
    const leftLeg = human.getObjectByName("leftLeg");
    const rightKnee = rightLeg.getObjectByName("knee");
    const leftKnee = leftLeg.getObjectByName("knee");
    
    // Update slider values
    document.getElementById('right-arm-x').value = radToDeg(rightArm.rotation.x);
    document.getElementById('right-arm-y').value = radToDeg(rightArm.rotation.y);
    document.getElementById('right-arm-z').value = radToDeg(rightArm.rotation.z);
    
    document.getElementById('left-arm-x').value = radToDeg(leftArm.rotation.x);
    document.getElementById('left-arm-y').value = radToDeg(leftArm.rotation.y);
    document.getElementById('left-arm-z').value = radToDeg(leftArm.rotation.z);
    
    document.getElementById('right-leg-x').value = radToDeg(rightLeg.rotation.x);
    document.getElementById('right-leg-y').value = radToDeg(rightLeg.rotation.y);
    document.getElementById('right-leg-z').value = radToDeg(rightLeg.rotation.z);
    
    document.getElementById('left-leg-x').value = radToDeg(leftLeg.rotation.x);
    document.getElementById('left-leg-y').value = radToDeg(leftLeg.rotation.y);
    document.getElementById('left-leg-z').value = radToDeg(leftLeg.rotation.z);
    
    document.getElementById('right-knee-x').value = radToDeg(rightKnee.rotation.x);
    document.getElementById('left-knee-x').value = radToDeg(leftKnee.rotation.x);
}

// Helper function to convert degrees to radians
function degToRad(degrees) {
    return degrees * Math.PI / 180;
}

// Helper function to convert radians to degrees
function radToDeg(radians) {
    return radians * 180 / Math.PI;
}

// Capture current pose as a keyframe
function captureKeyframe() {
    const duration = parseFloat(document.getElementById('keyframe-duration').value) || 1.0;
    
    const rightArm = human.getObjectByName("rightArm");
    const leftArm = human.getObjectByName("leftArm");
    const rightLeg = human.getObjectByName("rightLeg");
    const leftLeg = human.getObjectByName("leftLeg");
    const rightKnee = rightLeg.getObjectByName("knee");
    const leftKnee = leftLeg.getObjectByName("knee");
    
    // Store the current pose
    const keyframe = {
        duration: duration,
        pose: {
            rightArm: {
                x: rightArm.rotation.x,
                y: rightArm.rotation.y,
                z: rightArm.rotation.z
            },
            leftArm: {
                x: leftArm.rotation.x,
                y: leftArm.rotation.y,
                z: leftArm.rotation.z
            },
            rightLeg: {
                x: rightLeg.rotation.x,
                y: rightLeg.rotation.y,
                z: rightLeg.rotation.z
            },
            leftLeg: {
                x: leftLeg.rotation.x,
                y: leftLeg.rotation.y,
                z: leftLeg.rotation.z
            },
            rightKnee: {
                x: rightKnee.rotation.x
            },
            leftKnee: {
                x: leftKnee.rotation.x
            }
        }
    };
    
    keyframes.push(keyframe);
    updateKeyframeList();
}

// Update keyframe list in UI
function updateKeyframeList() {
    const keyframeList = document.getElementById('keyframe-list');
    keyframeList.innerHTML = '';
    
    if (keyframes.length === 0) {
        keyframeList.innerHTML = '<div class="keyframe-item">No keyframes captured</div>';
        return;
    }
    
    keyframes.forEach((keyframe, index) => {
        const keyframeEl = document.createElement('div');
        keyframeEl.className = 'keyframe-item';
        
        const frameText = document.createElement('span');
        frameText.textContent = `Frame ${index + 1} (${keyframe.duration}s)`;
        keyframeEl.appendChild(frameText);
        
        const buttonGroup = document.createElement('div');
        
        // Apply button
        const applyBtn = document.createElement('button');
        applyBtn.textContent = 'Apply';
        applyBtn.title = 'Apply this pose';
        applyBtn.onclick = () => applyKeyframe(index);
        buttonGroup.appendChild(applyBtn);
        
        // Move up button (if not first)
        if (index > 0) {
            const moveUpBtn = document.createElement('button');
            moveUpBtn.textContent = '↑';
            moveUpBtn.title = 'Move up';
            moveUpBtn.onclick = () => moveKeyframe(index, index - 1);
            buttonGroup.appendChild(moveUpBtn);
        }
        
        // Move down button (if not last)
        if (index < keyframes.length - 1) {
            const moveDownBtn = document.createElement('button');
            moveDownBtn.textContent = '↓';
            moveDownBtn.title = 'Move down';
            moveDownBtn.onclick = () => moveKeyframe(index, index + 1);
            buttonGroup.appendChild(moveDownBtn);
        }
        
        // Delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = '✕';
        deleteBtn.title = 'Delete';
        deleteBtn.onclick = () => deleteKeyframe(index);
        buttonGroup.appendChild(deleteBtn);
        
        keyframeEl.appendChild(buttonGroup);
        keyframeList.appendChild(keyframeEl);
    });
}

// Apply a specific keyframe
function applyKeyframe(index) {
    if (index >= 0 && index < keyframes.length) {
        const keyframe = keyframes[index];
        const pose = keyframe.pose;
        
        const rightArm = human.getObjectByName("rightArm");
        const leftArm = human.getObjectByName("leftArm");
        const rightLeg = human.getObjectByName("rightLeg");
        const leftLeg = human.getObjectByName("leftLeg");
        const rightKnee = rightLeg.getObjectByName("knee");
        const leftKnee = leftLeg.getObjectByName("knee");
        
        // Apply the pose
        gsap.to(rightArm.rotation, { 
            x: pose.rightArm.x, 
            y: pose.rightArm.y, 
            z: pose.rightArm.z, 
            duration: 0.5 
        });
        gsap.to(leftArm.rotation, { 
            x: pose.leftArm.x, 
            y: pose.leftArm.y, 
            z: pose.leftArm.z, 
            duration: 0.5 
        });
        gsap.to(rightLeg.rotation, { 
            x: pose.rightLeg.x, 
            y: pose.rightLeg.y, 
            z: pose.rightLeg.z, 
            duration: 0.5 
        });
        gsap.to(leftLeg.rotation, { 
            x: pose.leftLeg.x, 
            y: pose.leftLeg.y, 
            z: pose.leftLeg.z, 
            duration: 0.5 
        });
        gsap.to(rightKnee.rotation, { x: pose.rightKnee.x, duration: 0.5 });
        gsap.to(leftKnee.rotation, { x: pose.leftKnee.x, duration: 0.5 });
        
        // Update sliders after a short delay to let animation happen
        setTimeout(updateSlidersFromModel, 600);
    }
}

// Move keyframe order
function moveKeyframe(fromIndex, toIndex) {
    if (fromIndex >= 0 && fromIndex < keyframes.length && 
        toIndex >= 0 && toIndex < keyframes.length) {
        const frame = keyframes.splice(fromIndex, 1)[0];
        keyframes.splice(toIndex, 0, frame);
        updateKeyframeList();
    }
}

// Delete a keyframe
function deleteKeyframe(index) {
    if (index >= 0 && index < keyframes.length) {
        keyframes.splice(index, 1);
        updateKeyframeList();
    }
}

// Play the entire animation sequence
function playAnimation() {
    if (keyframes.length === 0) {
        alert('No keyframes to animate! Capture some poses first.');
        return;
    }
    
    if (isPlaying) {
        // Stop the animation if already playing
        if (currentAnimation) {
            currentAnimation.kill();
        }
        isPlaying = false;
        document.getElementById('play-animation-btn').textContent = 'Play Animation';
        return;
    }
    
    // Start playing
    isPlaying = true;
    document.getElementById('play-animation-btn').textContent = 'Stop Animation';
    
    // Create timeline for animation
    const timeline = gsap.timeline({
        onComplete: () => {
            isPlaying = false;
            document.getElementById('play-animation-btn').textContent = 'Play Animation';
            updateSlidersFromModel();
        }
    });
    
    // Add each keyframe to the timeline
    let position = 0;
    keyframes.forEach((keyframe, index) => {
        const pose = keyframe.pose;
        const duration = keyframe.duration;
        
        // Target parts
        const rightArm = human.getObjectByName("rightArm");
        const leftArm = human.getObjectByName("leftArm");
        const rightLeg = human.getObjectByName("rightLeg");
        const leftLeg = human.getObjectByName("leftLeg");
        const rightKnee = rightLeg.getObjectByName("knee");
        const leftKnee = leftLeg.getObjectByName("knee");
        
        // Animate to this pose
        timeline.to(rightArm.rotation, {
            x: pose.rightArm.x,
            y: pose.rightArm.y,
            z: pose.rightArm.z,
            duration: duration
        }, position);
        
        timeline.to(leftArm.rotation, {
            x: pose.leftArm.x,
            y: pose.leftArm.y,
            z: pose.leftArm.z,
            duration: duration
        }, position);
        
        timeline.to(rightLeg.rotation, {
            x: pose.rightLeg.x,
            y: pose.rightLeg.y,
            z: pose.rightLeg.z,
            duration: duration
        }, position);
        
        timeline.to(leftLeg.rotation, {
            x: pose.leftLeg.x,
            y: pose.leftLeg.y,
            z: pose.leftLeg.z,
            duration: duration
        }, position);
        
        timeline.to(rightKnee.rotation, {
            x: pose.rightKnee.x,
            duration: duration
        }, position);
        
        timeline.to(leftKnee.rotation, {
            x: pose.leftKnee.x,
            duration: duration
        }, position);
        
        position += duration;
    });
    
    currentAnimation = timeline;
}

// Clear all keyframes
function clearKeyframes() {
    if (confirm('Are you sure you want to clear all keyframes?')) {
        keyframes.length = 0;
        updateKeyframeList();
    }
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Initialize
updateSlidersFromModel();
updateKeyframeList();

// Add input event listeners for all sliders
const sliders = document.querySelectorAll('input[type="range"]');
sliders.forEach(slider => {
    slider.addEventListener('input', updateModelFromSliders);
});

// Add button event listeners
document.getElementById('tpose-btn').addEventListener('click', resetToTPose);
document.getElementById('capture-btn').addEventListener('click', captureKeyframe);
document.getElementById('play-animation-btn').addEventListener('click', playAnimation);
document.getElementById('clear-frames-btn').addEventListener('click', clearKeyframes);

animate();
