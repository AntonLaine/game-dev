// Game variables
let gameRunning = false;
let gameInterval;
let gameTime = 120; // 2 minutes in seconds
let blueScore = 0;
let orangeScore = 0;

// Three.js and Cannon.js variables
let scene, camera, renderer, world;
let playerCar, ball, field, blueGoal, orangeGoal;
let keyStates = {};
let cameraOffset = new THREE.Vector3(0, 50, 100); // 10x larger
let cameraRotation = 0;
let boostPower = 0;
let maxBoostPower = 100;
let boostRecoveryRate = 0.2;
let isOnGround = false; // Track if the car is on the ground

// Wheel variables
let wheels = [];
let wheelMeshes = [];
let wheelRadius = 6; // Visual wheel radius
let wheelSpeed = 0; // Current wheel rotation speed
let wheelBodies = []; // Physics bodies for wheels

// Create alias for CANNON to ensure compatibility
const CANNON = window.CANNON;

// DOM elements
const gameArea = document.getElementById('game-area');
const blueScoreElement = document.getElementById('blue-score');
const orangeScoreElement = document.getElementById('orange-score');
const timerElement = document.getElementById('timer');
const startButton = document.getElementById('start-button');
const gameOverScreen = document.getElementById('game-over');
const finalBlueScoreElement = document.getElementById('final-blue-score');
const finalOrangeScoreElement = document.getElementById('final-orange-score');
const winnerTextElement = document.getElementById('winner-text');
const restartButton = document.getElementById('restart-button');

// Event listeners
startButton.addEventListener('click', startGame);
restartButton.addEventListener('click', startGame);
document.addEventListener('keydown', (event) => keyStates[event.code] = true);
document.addEventListener('keyup', (event) => keyStates[event.code] = false);
window.addEventListener('resize', onWindowResize);

// Initialize Three.js and Cannon.js
function initPhysics() {
    // Initialize Three.js scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); // Sky blue
    
    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(0, 200, 100); // 10x larger
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.left = -200;
    directionalLight.shadow.camera.right = 200;
    directionalLight.shadow.camera.top = 200;
    directionalLight.shadow.camera.bottom = -200;
    directionalLight.shadow.camera.far = 500;
    scene.add(directionalLight);
    
    // Create camera
    camera = new THREE.PerspectiveCamera(75, gameArea.clientWidth / gameArea.clientHeight, 1, 10000); // Adjusted near and far planes
    camera.position.set(0, 50, 100); // 10x larger
    
    // Create renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(gameArea.clientWidth, gameArea.clientHeight);
    renderer.shadowMap.enabled = true;
    gameArea.appendChild(renderer.domElement);
    
    // Initialize Cannon.js world with correct API for cannon.js 
    world = new CANNON.World();
    world.gravity.set(0, -98.2, 0); // 10x stronger gravity to match scale
    
    // Add solver iterations for more stable physics
    world.solver.iterations = 10;
    world.defaultContactMaterial.contactEquationStiffness = 1e7; // Increased stiffness
    world.defaultContactMaterial.contactEquationRelaxation = 3;
    
    // Create contact material for ball and ground
    const groundMaterial = new CANNON.Material('groundMaterial');
    const ballMaterial = new CANNON.Material('ballMaterial');
    const carMaterial = new CANNON.Material('carMaterial');
    
    // Create contact behaviors
    const ballGroundContact = new CANNON.ContactMaterial(
        ballMaterial, groundMaterial, {
            friction: 0.4,
            restitution: 0.6 // Bouncier ball
        }
    );
    
    const carGroundContact = new CANNON.ContactMaterial(
        carMaterial, groundMaterial, {
            friction: 0.7, // More grip
            restitution: 0.1 // Less bouncy car
        }
    );
    
    world.addContactMaterial(ballGroundContact);
    world.addContactMaterial(carGroundContact);
}

function createField() {
    // Create field floor - 10x larger
    const fieldGeometry = new THREE.BoxGeometry(400, 10, 800); // 10x larger
    const fieldMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x3e673c,
        roughness: 0.7 
    });
    
    field = new THREE.Mesh(fieldGeometry, fieldMaterial);
    field.position.y = -5; // 10x larger
    field.receiveShadow = true;
    scene.add(field);
    
    // Add field to physics world - 10x larger
    const fieldShape = new CANNON.Box(new CANNON.Vec3(200, 5, 400)); // 10x larger
    const fieldBody = new CANNON.Body({
        mass: 0, // Static body
        position: new CANNON.Vec3(0, -5, 0), // 10x larger
        material: new CANNON.Material('groundMaterial')
    });
    fieldBody.addShape(fieldShape);
    world.addBody(fieldBody);
    
    // Store reference to the physics body for raycasting
    field.userData.physicsBody = fieldBody;
    
    // Create walls
    createWalls();
    
    // Create goals
    createGoals();
    
    // Add field lines
    createFieldLines();
}

function createWalls() {
    const wallMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x888888,
        transparent: true,
        opacity: 0.3
    });
    
    // Side walls - 10x larger
    const sideWallGeometry = new THREE.BoxGeometry(10, 50, 800); // 10x larger
    
    const leftWall = new THREE.Mesh(sideWallGeometry, wallMaterial);
    leftWall.position.set(-200, 25, 0); // 10x larger
    scene.add(leftWall);
    
    const rightWall = new THREE.Mesh(sideWallGeometry, wallMaterial);
    rightWall.position.set(200, 25, 0); // 10x larger
    scene.add(rightWall);
    
    // End walls (with goal holes) - 10x larger
    const endWallGeometry = new THREE.BoxGeometry(400, 50, 10); // 10x larger
    
    const frontWall = new THREE.Mesh(endWallGeometry, wallMaterial);
    frontWall.position.set(0, 25, 400); // 10x larger
    scene.add(frontWall);
    
    const backWall = new THREE.Mesh(endWallGeometry, wallMaterial);
    backWall.position.set(0, 25, -400); // 10x larger
    scene.add(backWall);
    
    // Add walls to physics world - 10x larger
    const sideWallShape = new CANNON.Box(new CANNON.Vec3(5, 25, 400)); // 10x larger
    
    const leftWallBody = new CANNON.Body({ mass: 0 });
    leftWallBody.addShape(sideWallShape);
    leftWallBody.position.set(-200, 25, 0); // 10x larger
    world.addBody(leftWallBody);
    
    const rightWallBody = new CANNON.Body({ mass: 0 });
    rightWallBody.addShape(sideWallShape);
    rightWallBody.position.set(200, 25, 0); // 10x larger
    world.addBody(rightWallBody);
    
    // End walls excluding goal areas - 10x larger
    const endWallShapeLeft = new CANNON.Box(new CANNON.Vec3(120, 25, 5)); // 10x larger
    const endWallShapeRight = new CANNON.Box(new CANNON.Vec3(120, 25, 5)); // 10x larger
    
    const frontWallBodyLeft = new CANNON.Body({ mass: 0 });
    frontWallBodyLeft.addShape(endWallShapeLeft);
    frontWallBodyLeft.position.set(-140, 25, 400); // 10x larger
    world.addBody(frontWallBodyLeft);
    
    const frontWallBodyRight = new CANNON.Body({ mass: 0 });
    frontWallBodyRight.addShape(endWallShapeRight);
    frontWallBodyRight.position.set(140, 25, 400); // 10x larger
    world.addBody(frontWallBodyRight);
    
    const backWallBodyLeft = new CANNON.Body({ mass: 0 });
    backWallBodyLeft.addShape(endWallShapeLeft);
    backWallBodyLeft.position.set(-140, 25, -400); // 10x larger
    world.addBody(backWallBodyLeft);
    
    const backWallBodyRight = new CANNON.Body({ mass: 0 });
    backWallBodyRight.addShape(endWallShapeRight);
    backWallBodyRight.position.set(140, 25, -400); // 10x larger
    world.addBody(backWallBodyRight);
}

function createGoals() {
    // Create blue goal (back) - 10x larger
    const blueGoalGeometry = new THREE.BoxGeometry(80, 50, 20); // 10x larger
    const blueGoalMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x4285F4,
        transparent: true,
        opacity: 0.5
    });
    
    blueGoal = new THREE.Mesh(blueGoalGeometry, blueGoalMaterial);
    blueGoal.position.set(0, 25, -410); // 10x larger
    scene.add(blueGoal);
    
    // Create orange goal (front) - 10x larger
    const orangeGoalGeometry = new THREE.BoxGeometry(80, 50, 20); // 10x larger
    const orangeGoalMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xFF9800,
        transparent: true,
        opacity: 0.5
    });
    
    orangeGoal = new THREE.Mesh(orangeGoalGeometry, orangeGoalMaterial);
    orangeGoal.position.set(0, 25, 410); // 10x larger
    scene.add(orangeGoal);
}

function createFieldLines() {
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
    
    // Center line - 10x larger
    const centerLinePoints = [];
    centerLinePoints.push(new THREE.Vector3(-200, 0.1, 0)); // 10x larger
    centerLinePoints.push(new THREE.Vector3(200, 0.1, 0)); // 10x larger
    
    const centerLineGeometry = new THREE.BufferGeometry().setFromPoints(centerLinePoints);
    const centerLine = new THREE.Line(centerLineGeometry, lineMaterial);
    scene.add(centerLine);
    
    // Center circle - 10x larger
    const circleGeometry = new THREE.RingGeometry(70, 73, 32); // 10x larger
    const circleMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
    const centerCircle = new THREE.Mesh(circleGeometry, circleMaterial);
    centerCircle.rotation.x = -Math.PI / 2;
    centerCircle.position.y = 0.2; // 10x larger
    scene.add(centerCircle);
}

function createPlayerCar() {
    // Create car chassis - improved appearance
    const carGroup = new THREE.Group();
    
    // Main car body
    const bodyGeometry = new THREE.BoxGeometry(20, 8, 36); // Slightly smaller body
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x4285F4 });
    const carBody = new THREE.Mesh(bodyGeometry, bodyMaterial);
    carBody.position.y = 2; // Raise the body to make room for wheels
    carBody.castShadow = true;
    carGroup.add(carBody);
    
    // Car roof
    const roofGeometry = new THREE.BoxGeometry(18, 6, 24);
    const roofMaterial = new THREE.MeshStandardMaterial({ color: 0x2d62c9 }); // Darker blue
    const carRoof = new THREE.Mesh(roofGeometry, roofMaterial);
    carRoof.position.y = 9; // Position on top of the body
    carRoof.position.z = -2; // Back to original position (front of the car)
    carRoof.castShadow = true;
    carGroup.add(carRoof);
    
    // Car front (nose)
    const noseGeometry = new THREE.BoxGeometry(18, 4, 8);
    const noseMaterial = new THREE.MeshStandardMaterial({ color: 0x4285F4 });
    const carNose = new THREE.Mesh(noseGeometry, noseMaterial);
    carNose.position.y = 2;
    carNose.position.z = 20; // Back to original position (front of the car)
    carNose.castShadow = true;
    carGroup.add(carNose);
    
    // Add a spoiler at the back
    const spoilerStandGeometry = new THREE.BoxGeometry(2, 8, 2);
    const spoilerStandMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
    
    const leftStand = new THREE.Mesh(spoilerStandGeometry, spoilerStandMaterial);
    leftStand.position.set(-7, 6, -18); // Back to original position (back of the car)
    carGroup.add(leftStand);
    
    const rightStand = new THREE.Mesh(spoilerStandGeometry, spoilerStandMaterial);
    rightStand.position.set(7, 6, -18); // Back to original position (back of the car)
    carGroup.add(rightStand);
    
    const spoilerGeometry = new THREE.BoxGeometry(20, 1, 6);
    const spoilerMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
    const spoiler = new THREE.Mesh(spoilerGeometry, spoilerMaterial);
    spoiler.position.set(0, 11, -18); // Back to original position (back of the car)
    carGroup.add(spoiler);
    
    // Position the car group
    carGroup.position.set(0, 8, -100); // Moved to the other side of the field and raised slightly
    scene.add(carGroup);
    
    // Set the car group as our player car
    playerCar = carGroup;
    
    // Add car to physics world - 10x larger, with proper chassis shape
    const carShape = new CANNON.Box(new CANNON.Vec3(10, 4, 18)); // Slightly adjusted to match visual body
    playerCar.userData.physicsBody = new CANNON.Body({
        mass: 800, // Heavier for more momentum
        position: new CANNON.Vec3(0, 8, -100), // Matching visual position
        angularDamping: 0.9,
        linearDamping: 0.3, // Less damping for better movement
        material: new CANNON.Material('carMaterial')
    });
    playerCar.userData.physicsBody.addShape(carShape);
    
    // Lower the center of mass for more stability
    playerCar.userData.physicsBody.shapeOffsets[0].y = -2;
    
    // Limit angular velocity for better control
    playerCar.userData.physicsBody.angularVelocity.set(0, 0, 0);
    playerCar.userData.physicsBody.addEventListener("collide", function() {
        // Reset extreme rotation on collision to prevent flipping
        const rotation = playerCar.userData.physicsBody.quaternion;
        const euler = new CANNON.Vec3();
        rotation.toEuler(euler);
        
        // If the car is too tilted, apply corrective force
        if (Math.abs(euler.z) > Math.PI/4 || Math.abs(euler.x) > Math.PI/4) {
            playerCar.userData.physicsBody.angularVelocity.scale(0.5, playerCar.userData.physicsBody.angularVelocity);
        }
    });
    
    world.addBody(playerCar.userData.physicsBody);
    
    // Add wheels
    createWheels(playerCar);
}

// Create visual and physical wheels for the car
function createWheels(car) {
    // Wheel positions relative to car
    const wheelPositions = [
        { x: -10, y: -4, z: 15 },  // Front left
        { x: 10, y: -4, z: 15 },   // Front right
        { x: -10, y: -4, z: -15 }, // Back left
        { x: 10, y: -4, z: -15 }   // Back right
    ];
    
    // Create wheels for physics
    wheels = [];
    wheelBodies = [];
    
    // Create wheel meshes for visuals
    wheelMeshes = [];
    
    // Wheel material for physics
    const wheelMaterial = new CANNON.Material('wheelMaterial');
    
    // Create contact material for wheels and ground
    const wheelGroundContact = new CANNON.ContactMaterial(
        wheelMaterial, 
        world.defaultMaterial, {
            friction: 0.8, // Higher friction for better grip
            restitution: 0.2, // Some bounce
            contactEquationStiffness: 1000 // Stiffer contact
        }
    );
    
    world.addContactMaterial(wheelGroundContact);
    
    wheelPositions.forEach((pos, index) => {
        // Create visual wheel
        const wheelGeometry = new THREE.CylinderGeometry(wheelRadius, wheelRadius, 4, 24);
        wheelGeometry.rotateZ(Math.PI / 2); // Orient the cylinder to be a wheel
        
        const wheelVisualMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x333333,
            roughness: 0.7
        });
        
        const wheelMesh = new THREE.Mesh(wheelGeometry, wheelVisualMaterial);
        wheelMesh.castShadow = true;
        wheelMesh.position.set(pos.x, pos.y, pos.z);
        car.add(wheelMesh);
        wheelMeshes.push(wheelMesh);
        
        // Create wheel physics
        const wheelShape = new CANNON.Sphere(wheelRadius);
        const wheelBody = new CANNON.Body({
            mass: 50, // Give wheels some mass for better physics
            material: wheelMaterial,
            position: new CANNON.Vec3(
                car.position.x + pos.x,
                car.position.y + pos.y,
                car.position.z + pos.z
            ),
            collisionFilterGroup: 2, // Wheel collision group
            angularDamping: 0.4 // Damping for wheel rotation
        });
        
        wheelBody.addShape(wheelShape);
        world.addBody(wheelBody);
        wheelBodies.push(wheelBody);
        
        // Create a constraint to attach wheel to car
        const constraint = new CANNON.PointToPointConstraint(
            car.userData.physicsBody, 
            new CANNON.Vec3(pos.x, pos.y, pos.z),
            wheelBody,
            new CANNON.Vec3(0, 0, 0)
        );
        
        world.addConstraint(constraint);
        
        // Store wheel info
        wheels.push({
            body: wheelBody,
            constraint: constraint,
            position: new CANNON.Vec3(pos.x, pos.y, pos.z),
            steering: index < 2, // First two wheels are steering wheels
            side: index % 2 === 0 ? -1 : 1 // -1 for left, 1 for right
        });
    });
}

function createBall() {
    // Create ball - 10x larger
    const ballGeometry = new THREE.SphereGeometry(10, 32, 32); // 10x larger
    const ballMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
    
    ball = new THREE.Mesh(ballGeometry, ballMaterial);
    ball.position.set(0, 50, 0); // 10x larger
    ball.castShadow = true;
    scene.add(ball);
    
    // Add ball to physics world - 10x larger
    const ballShape = new CANNON.Sphere(10); // 10x larger
    ball.userData.physicsBody = new CANNON.Body({
        mass: 10, // 10x heavier
        position: new CANNON.Vec3(0, 50, 0), // 10x larger
        linearDamping: 0.3,
        angularDamping: 0.3,
        material: new CANNON.Material('ballMaterial')
    });
    ball.userData.physicsBody.addShape(ballShape);
    world.addBody(ball.userData.physicsBody);
    
    // Make the ball slightly more responsive
    ball.userData.physicsBody.linearDamping = 0.2;
    ball.userData.physicsBody.angularDamping = 0.2;
}

function startGame() {
    // Reset game state
    gameRunning = true;
    gameTime = 120;
    blueScore = 0;
    orangeScore = 0;
    boostPower = maxBoostPower;
    
    // Update DOM
    blueScoreElement.textContent = blueScore;
    orangeScoreElement.textContent = orangeScore;
    updateTimer();
    
    // Hide/show elements
    gameOverScreen.classList.add('hidden');
    startButton.classList.add('hidden');
    
    // Initialize physics if not already
    if (!scene) {
        initPhysics();
        createField();
        createPlayerCar();
        createBall();
        addBoostMeter(); // Add the boost meter
        animate();
    } else {
        // Reset positions
        resetPositions();
    }
    
    // Start game timer
    gameInterval = setInterval(() => {
        if (gameTime > 0) {
            gameTime--;
            updateTimer();
        } else {
            endGame();
        }
    }, 1000);
}

function resetPositions() {
    // Reset ball position - 10x larger
    ball.userData.physicsBody.position.set(0, 50, 0); // 10x larger
    ball.userData.physicsBody.velocity.set(0, 0, 0);
    ball.userData.physicsBody.angularVelocity.set(0, 0, 0);
    
    // Reset player position - 10x larger
    playerCar.userData.physicsBody.position.set(0, 8, -100); // Moved to other side
    playerCar.userData.physicsBody.velocity.set(0, 0, 0);
    playerCar.userData.physicsBody.angularVelocity.set(0, 0, 0);
    playerCar.userData.physicsBody.quaternion.set(0, 0, 0, 1); // Reset rotation
    
    // Reset wheel positions
    if (wheels.length > 0 && wheelBodies.length > 0) {
        const wheelPositions = [
            { x: -10, y: -4, z: 15 },  // Front left
            { x: 10, y: -4, z: 15 },   // Front right
            { x: -10, y: -4, z: -15 }, // Back left
            { x: 10, y: -4, z: -15 }   // Back right
        ];
        
        wheelBodies.forEach((wheelBody, index) => {
            const pos = wheelPositions[index];
            wheelBody.position.set(
                playerCar.userData.physicsBody.position.x + pos.x,
                playerCar.userData.physicsBody.position.y + pos.y,
                playerCar.userData.physicsBody.position.z + pos.z
            );
            wheelBody.velocity.set(0, 0, 0);
            wheelBody.angularVelocity.set(0, 0, 0);
        });
    }
}

function updateTimer() {
    const minutes = Math.floor(gameTime / 60);
    const seconds = gameTime % 60;
    timerElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Check if the car is on the ground - improved detection
function checkGroundContact() {
    isOnGround = false;
    
    // Create multiple rays from the car's position downward for better ground detection
    const carPos = playerCar.userData.physicsBody.position;
    const rayDirections = [
        new CANNON.Vec3(0, -1, 0), // Straight down
        new CANNON.Vec3(-0.5, -1, 0.5), // Front left
        new CANNON.Vec3(0.5, -1, 0.5), // Front right
        new CANNON.Vec3(-0.5, -1, -0.5), // Back left
        new CANNON.Vec3(0.5, -1, -0.5) // Back right
    ];
    
    // Check each ray for ground contact
    for (let dir of rayDirections) {
        // Normalize and scale the direction
        dir.normalize();
        dir.scale(20, dir); // Longer rays for better detection
        
        const ray = new CANNON.Ray(carPos, new CANNON.Vec3(carPos.x + dir.x, carPos.y + dir.y, carPos.z + dir.z));
        ray.mode = CANNON.Ray.CLOSEST;
        
        // Check for intersection with the field
        const result = new CANNON.RaycastResult();
        ray.intersectBody(field.userData.physicsBody, result);
        
        // If any ray hits within 15 units, consider on ground
        if (result.hasHit && result.distance < 15) {
            isOnGround = true;
            break;
        }
    }
}

function handleControls() {
    if (!gameRunning) return;
    
    // Check if we're on the ground
    checkGroundContact();
    
    const body = playerCar.userData.physicsBody;
    const forwardDir = new CANNON.Vec3(0, 0, -1); // Changed back to original
    const rightDir = new CANNON.Vec3(1, 0, 0);
    
    // Rotate forward direction based on car's rotation
    body.quaternion.vmult(forwardDir, forwardDir);
    body.quaternion.vmult(rightDir, rightDir);
    
    // Adjust speed based on whether we're on ground or in air
    const baseSpeed = 180; // Increased speed for better movement
    const airControl = 0.3; // Air control factor
    
    // Apply more dampening when on ground for better control
    if (isOnGround) {
        body.linearDamping = 0.3; // Less damping for smoother movement
        body.angularDamping = 0.7; // Also reduced for better turning
    } else {
        body.linearDamping = 0.1; // Less damping in air
        body.angularDamping = 0.5;
    }
    
    // Apply forces to wheels for movement - this is key for wheel-based movement
    if (keyStates['KeyW']) {
        const speed = isOnGround ? baseSpeed : baseSpeed * airControl;
        
        // Apply force to wheels for more realistic movement
        wheels.forEach((wheel, index) => {
            if (wheelBodies[index]) {
                // Apply rolling force to wheels
                wheelBodies[index].applyImpulse(
                    new CANNON.Vec3(forwardDir.x * speed * 0.25, 0, forwardDir.z * speed * 0.25),
                    new CANNON.Vec3(0, 0, 0)
                );
                // Make wheel spin visually
                wheelSpeed = -0.2; 
            }
        });
    } else if (keyStates['KeyS']) {
        const speed = isOnGround ? baseSpeed : baseSpeed * airControl;
        
        // Apply force to wheels for more realistic movement
        wheels.forEach((wheel, index) => {
            if (wheelBodies[index]) {
                // Apply reverse rolling force to wheels
                wheelBodies[index].applyImpulse(
                    new CANNON.Vec3(-forwardDir.x * speed * 0.25, 0, -forwardDir.z * speed * 0.25),
                    new CANNON.Vec3(0, 0, 0)
                );
                // Make wheel spin visually
                wheelSpeed = 0.2;
            }
        });
    } else {
        // Gradually slow wheel rotation when not accelerating
        wheelSpeed *= 0.95;
    }
    
    // Turning - apply to wheel physics for better turning
    const rotationSpeed = isOnGround ? 0.08 : 0.04; 
    
    if (keyStates['KeyA']) {
        if (isOnGround) {
            body.angularVelocity.y += rotationSpeed;
            
            // Apply lateral force to front wheels
            if (wheelBodies[0] && wheelBodies[1]) {
                wheelBodies[0].applyImpulse(
                    new CANNON.Vec3(rightDir.x * baseSpeed * 0.2, 0, rightDir.z * baseSpeed * 0.2),
                    new CANNON.Vec3(0, 0, 0)
                );
                wheelBodies[1].applyImpulse(
                    new CANNON.Vec3(rightDir.x * baseSpeed * 0.2, 0, rightDir.z * baseSpeed * 0.2),
                    new CANNON.Vec3(0, 0, 0)
                );
            }
        } else {
            // Less effective turning in air
            body.angularVelocity.y += rotationSpeed * 0.5;
        }
        
        // Turn the front wheels for steering visualization
        if (wheelMeshes[0] && wheelMeshes[1]) {
            wheelMeshes[0].rotation.y = 0.4; // Left wheel
            wheelMeshes[1].rotation.y = 0.4; // Right wheel
        }
    } else if (keyStates['KeyD']) {
        if (isOnGround) {
            body.angularVelocity.y -= rotationSpeed;
            
            // Apply lateral force to front wheels
            if (wheelBodies[0] && wheelBodies[1]) {
                wheelBodies[0].applyImpulse(
                    new CANNON.Vec3(-rightDir.x * baseSpeed * 0.2, 0, -rightDir.z * baseSpeed * 0.2),
                    new CANNON.Vec3(0, 0, 0)
                );
                wheelBodies[1].applyImpulse(
                    new CANNON.Vec3(-rightDir.x * baseSpeed * 0.2, 0, -rightDir.z * baseSpeed * 0.2),
                    new CANNON.Vec3(0, 0, 0)
                );
            }
        } else {
            // Less effective turning in air
            body.angularVelocity.y -= rotationSpeed * 0.5;
        }
        
        // Turn the front wheels for steering visualization
        if (wheelMeshes[0] && wheelMeshes[1]) {
            wheelMeshes[0].rotation.y = -0.4; // Left wheel
            wheelMeshes[1].rotation.y = -0.4; // Right wheel
        }
    } else {
        // Return wheels to straight position
        if (wheelMeshes[0] && wheelMeshes[1]) {
            wheelMeshes[0].rotation.y *= 0.9;
            wheelMeshes[1].rotation.y *= 0.9;
        }
    }
    
    // Super powerful jump - only if on ground
    if (keyStates['Space'] && isOnGround) {
        // Apply a massive upward force for dramatic jumping
        body.applyImpulse(new CANNON.Vec3(0, 4000, 0), body.position); // 4x more powerful
        
        // Also add a slight forward boost when jumping
        body.applyImpulse(new CANNON.Vec3(forwardDir.x * baseSpeed * 0.5, 0, forwardDir.z * baseSpeed * 0.5), body.position);
    }
    
    // Boost using Shift - apply to wheels too
    if (keyStates['ShiftLeft'] && boostPower > 0) {
        const boostMultiplier = isOnGround ? 3 : 2; // More effective on ground
        
        // Apply boost to wheels
        wheels.forEach((wheel, index) => {
            if (wheelBodies[index]) {
                // Apply boosted force to wheels
                wheelBodies[index].applyImpulse(
                    new CANNON.Vec3(
                        forwardDir.x * baseSpeed * boostMultiplier * 0.25, 
                        0, 
                        forwardDir.z * baseSpeed * boostMultiplier * 0.25
                    ),
                    new CANNON.Vec3(0, 0, 0)
                );
            }
        });
        
        // Also apply some boost to car body for immediate response
        body.applyImpulse(
            new CANNON.Vec3(
                forwardDir.x * baseSpeed * boostMultiplier * 0.5, 
                0, 
                forwardDir.z * baseSpeed * boostMultiplier * 0.5
            ), 
            body.position
        );
        
        // Use boost power
        boostPower = Math.max(0, boostPower - 1);
        
        // Wheels spin faster when boosting
        wheelSpeed *= 1.5;
    } else if (boostPower < maxBoostPower) {
        // Recover boost power when not using it
        boostPower += boostRecoveryRate;
    }
    
    // Update wheel rotations and positions
    updateWheels();
    
    // Camera controls
    if (keyStates['ArrowLeft']) {
        cameraRotation += 0.03;
    }
    
    if (keyStates['ArrowRight']) {
        cameraRotation -= 0.03;
    }
}

// Update wheel positions and rotations
function updateWheels() {
    // Update wheel visuals to match physics
    for (let i = 0; i < wheelMeshes.length; i++) {
        if (wheelBodies[i] && wheelMeshes[i]) {
            // Update wheel visual positions based on physics
            wheelMeshes[i].position.copy(wheelBodies[i].position.vsub(playerCar.userData.physicsBody.position));
            
            // Apply wheel rotation based on movement
            wheelMeshes[i].rotation.x += wheelSpeed;
        }
    }
}

function updateCameraPosition() {
    // Position camera behind the car with offset - 10x larger offset
    const carPosition = new THREE.Vector3(
        playerCar.position.x,
        playerCar.position.y + 20, // Add height to look down slightly
        playerCar.position.z
    );
    
    // Calculate camera position based on car rotation and offset
    const rotatedOffset = cameraOffset.clone();
    rotatedOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), cameraRotation);
    
    camera.position.copy(carPosition).add(rotatedOffset);
    camera.lookAt(carPosition);
}

function checkGoals() {
    const ballPosition = ball.position;
    
    // Check blue goal (back) - 10x larger
    if (ballPosition.z < -400 && ballPosition.x > -40 && ballPosition.x < 40 && ballPosition.y < 50) { // 10x larger
        orangeScore++;
        orangeScoreElement.textContent = orangeScore;
        resetAfterGoal();
    }
    
    // Check orange goal (front) - 10x larger
    if (ballPosition.z > 400 && ballPosition.x > -40 && ballPosition.x < 40 && ballPosition.y < 50) { // 10x larger
        blueScore++;
        blueScoreElement.textContent = blueScore;
        resetAfterGoal();
    }
}

function resetAfterGoal() {
    setTimeout(() => {
        resetPositions();
    }, 1500);
}

function updatePhysics() {
    // Step the physics world
    world.step(1/60);
    
    // Update Three.js objects with Cannon.js data
    updateObject(playerCar);
    updateObject(ball);
    
    // Keep wheels connected to the car - important for stability
    for (let i = 0; i < wheels.length; i++) {
        if (wheelBodies[i]) {
            // Create a vector from the car to where the wheel should be
            const localWheel = wheels[i].position.clone();
            const globalWheel = new CANNON.Vec3();
            
            // Transform local wheel position to global
            playerCar.userData.physicsBody.quaternion.vmult(localWheel, globalWheel);
            globalWheel.vadd(playerCar.userData.physicsBody.position, globalWheel);
            
            // Apply a spring force to keep wheels in proper position
            const direction = globalWheel.vsub(wheelBodies[i].position);
            const distance = direction.length();
            direction.normalize();
            
            // Spring force proportional to distance
            const force = direction.scale(distance * 200); // Spring stiffness
            wheelBodies[i].applyForce(force, new CANNON.Vec3(0, 0, 0));
        }
    }
}

function updateObject(object) {
    const body = object.userData.physicsBody;
    object.position.copy(body.position);
    object.quaternion.copy(body.quaternion);
}

function endGame() {
    gameRunning = false;
    clearInterval(gameInterval);
    
    // Update final scores
    finalBlueScoreElement.textContent = blueScore;
    finalOrangeScoreElement.textContent = orangeScore;
    
    // Determine winner
    if (blueScore > orangeScore) {
        winnerTextElement.textContent = "Blue team wins!";
        winnerTextElement.style.color = "#4285F4";
    } else if (orangeScore > blueScore) {
        winnerTextElement.textContent = "Orange team wins!";
        winnerTextElement.style.color = "#FF9800";
    } else {
        winnerTextElement.textContent = "It's a tie!";
        winnerTextElement.style.color = "white";
    }
    
    // Show game over screen
    gameOverScreen.classList.remove('hidden');
}

function onWindowResize() {
    if (camera && renderer) {
        camera.aspect = gameArea.clientWidth / gameArea.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(gameArea.clientWidth, gameArea.clientHeight);
    }
}

function animate() {
    requestAnimationFrame(animate);
    
    if (gameRunning) {
        handleControls();
        updatePhysics();
        checkGoals();
        updateCameraPosition();
        updateBoostMeter(); // Update the boost meter in each frame
    }
    
    renderer.render(scene, camera);
}

// Add this function to display a boost meter
function addBoostMeter() {
    // Create a container for the boost meter
    const boostContainer = document.createElement('div');
    boostContainer.id = 'boost-meter-container';
    boostContainer.style.position = 'absolute';
    boostContainer.style.bottom = '20px';
    boostContainer.style.left = '20px';
    boostContainer.style.width = '200px';
    boostContainer.style.height = '20px';
    boostContainer.style.border = '2px solid white';
    boostContainer.style.borderRadius = '10px';
    boostContainer.style.overflow = 'hidden';
    
    // Create the boost meter itself
    const boostMeter = document.createElement('div');
    boostMeter.id = 'boost-meter';
    boostMeter.style.height = '100%';
    boostMeter.style.width = '100%';
    boostMeter.style.backgroundColor = '#ff9800';
    boostMeter.style.transition = 'width 0.2s ease';
    
    boostContainer.appendChild(boostMeter);
    gameArea.appendChild(boostContainer);
}

function updateBoostMeter() {
    const boostMeter = document.getElementById('boost-meter');
    if (boostMeter) {
        boostMeter.style.width = (boostPower / maxBoostPower) * 100 + '%';
    }
}

// Initialize game on start button click
// The game only starts when the start button is clicked
