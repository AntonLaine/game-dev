class Car {
    constructor(scene) {
        this.scene = scene;
        this.speed = 0;
        this.acceleration = 0;
        this.maxSpeed = 1.5; // Halved from 3
        this.friction = 0.01; // Lower friction for easier movement
        this.steeringAngle = 0;
        this.maxSteeringAngle = Math.PI / 6; // 30 degrees
        this.position = new THREE.Vector3(0, 0.5, 0);
        this.rotation = 0;
        
        // Drift mechanics
        this.isDrifting = false;
        this.driftFactor = 0;
        this.maxDriftFactor = 0.8;
        this.driftRecoveryRate = 0.05;
        this.lateralVelocity = new THREE.Vector2(0, 0);
        this.forwardDir = new THREE.Vector2(0, 1);
        
        // Track wheel rotations
        this.wheelRotation = 0;
        
        // Add particle system for drift smoke
        this.createDriftParticles();
        this.createCarModel();
    }

    createDriftParticles() {
        // Create particle geometry
        const particleCount = 200;
        const particles = new THREE.BufferGeometry();
        
        const positions = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        
        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = 0;
            positions[i * 3 + 1] = 0;
            positions[i * 3 + 2] = 0;
            sizes[i] = 0;
        }
        
        particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particles.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        // Create particle material
        const particleMaterial = new THREE.PointsMaterial({
            color: 0xeeeeee,
            size: 0.5,
            transparent: true,
            opacity: 0.6,
            sizeAttenuation: true
        });
        
        // Create particle system
        this.driftParticles = new THREE.Points(particles, particleMaterial);
        this.scene.add(this.driftParticles);
        
        // Store particle data
        this.particlePositions = positions;
        this.particleSizes = sizes;
        this.particleCount = particleCount;
        this.particleLifetimes = new Float32Array(particleCount);
        this.particleActive = new Uint8Array(particleCount);
    }

    createCarModel() {
        // Car body
        const carGeometry = new THREE.BoxGeometry(2, 1, 4);
        const carMaterial = new THREE.MeshPhongMaterial({ color: 0x3333ff });
        this.carBody = new THREE.Mesh(carGeometry, carMaterial);
        this.carBody.position.copy(this.position);
        this.carBody.castShadow = true;
        this.carBody.receiveShadow = true;
        this.scene.add(this.carBody);

        // Wheels - Changed wheel orientation
        const wheelGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.4, 32);
        // Correctly rotate to make wheels face the right direction
        // Original rotation was only PI/2 which wasn't enough
        wheelGeometry.rotateZ(Math.PI / 2);
        const wheelMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
        
        // Front left wheel
        this.frontLeftWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        this.frontLeftWheel.position.set(this.position.x + 1.1, this.position.y - 0.25, this.position.z + 1.3);
        this.frontLeftWheel.castShadow = true;
        this.scene.add(this.frontLeftWheel);
        
        // Front right wheel
        this.frontRightWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        this.frontRightWheel.position.set(this.position.x - 1.1, this.position.y - 0.25, this.position.z + 1.3);
        this.frontRightWheel.castShadow = true;
        this.scene.add(this.frontRightWheel);
        
        // Rear left wheel
        this.rearLeftWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        this.rearLeftWheel.position.set(this.position.x + 1.1, this.position.y - 0.25, this.position.z - 1.3);
        this.rearLeftWheel.castShadow = true;
        this.scene.add(this.rearLeftWheel);
        
        // Rear right wheel
        this.rearRightWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        this.rearRightWheel.position.set(this.position.x - 1.1, this.position.y - 0.25, this.position.z - 1.3);
        this.rearRightWheel.castShadow = true;
        this.scene.add(this.rearRightWheel);
    }

    update() {
        // Apply acceleration
        this.speed += this.acceleration;
        
        // Apply friction
        if (this.speed > 0) {
            this.speed -= this.friction;
        } else if (this.speed < 0) {
            this.speed += this.friction;
        }
        
        // Clamp speed
        if (Math.abs(this.speed) < 0.05) {
            this.speed = 0;
        }
        this.speed = Math.max(-this.maxSpeed / 2, Math.min(this.maxSpeed, this.speed));
        
        // Check for drift conditions
        this.checkDrift();
        
        // Update rotation based on steering and speed, with drift
        if (Math.abs(this.speed) > 0.1) {
            const steeringFactor = Math.min(1.0, Math.abs(this.speed) / (this.maxSpeed * 0.4));
            
            // Apply drift effect
            let driftModifier = 1.0;
            if (this.isDrifting) {
                // Increase rotation effect during drift
                driftModifier = 1.5;
                
                // Update drift particles
                this.updateDriftParticles();
            }
            
            this.rotation += this.steeringAngle * this.speed / this.maxSpeed * steeringFactor * driftModifier;
        }
        
        // Calculate movement direction with drift
        let movementAngle = this.rotation;
        if (this.isDrifting) {
            // During drift, the car slides at an angle between its rotation and its previous direction
            movementAngle = this.rotation - (this.steeringAngle * this.driftFactor);
        }
        
        // Update position
        this.position.x += Math.sin(movementAngle) * this.speed;
        this.position.z += Math.cos(movementAngle) * this.speed;
        
        // Update wheel rotation based on speed (rolling)
        this.wheelRotation += this.speed * 0.5;
        
        // Update car body
        this.carBody.position.copy(this.position);
        this.carBody.rotation.y = this.rotation;
        
        // Update wheels with fixed rotation
        this.updateWheels();
        
        // Return current speed in km/h for UI (reduced display factor)
        return Math.abs(this.speed) * 8; // Reduced from 15 to make display values more reasonable
    }
    
    checkDrift() {
        // Detect conditions for drifting
        // Drift happens when car is turning at high speed
        const isHighSpeed = Math.abs(this.speed) > this.maxSpeed * 0.5; // Adjusted threshold for lower max speed
        const isTurningHard = Math.abs(this.steeringAngle) > this.maxSteeringAngle * 0.7; // Changed from 0.7 to 0.6
        
        if (isHighSpeed && isTurningHard) {
            this.isDrifting = true;
            
            // Increase drift factor gradually
            this.driftFactor = Math.min(this.maxDriftFactor, this.driftFactor + 0.02);
        } else {
            // Recover from drift gradually
            this.driftFactor = Math.max(0, this.driftFactor - this.driftRecoveryRate);
            
            if (this.driftFactor === 0) {
                this.isDrifting = false;
            }
        }
    }
    
    updateDriftParticles() {
        // Only emit particles if car is moving fast enough
        if (Math.abs(this.speed) < 1) return; // Reduced from 2 to accommodate lower max speed
        
        // Emit new particles from rear wheels
        const positions = this.particlePositions;
        const sizes = this.particleSizes;
        const lifetimes = this.particleLifetimes;
        const active = this.particleActive;
        
        // Get wheel positions (rear wheels)
        const wheelPositions = [
            { wheel: this.rearLeftWheel, x: 1.1, z: -1.3 },
            { wheel: this.rearRightWheel, x: -1.1, z: -1.3 }
        ];
        
        // Update existing particles
        for (let i = 0; i < this.particleCount; i++) {
            if (active[i] > 0) {
                // Decrease lifetime
                lifetimes[i] -= 0.02;
                
                if (lifetimes[i] <= 0) {
                    // Deactivate particle
                    active[i] = 0;
                    sizes[i] = 0;
                } else {
                    // Particle still active, update size based on lifetime
                    sizes[i] = 0.8 * lifetimes[i];
                    
                    // Make particles rise and spread
                    positions[i * 3 + 1] += 0.05; // Rise up
                    
                    // Random spread
                    positions[i * 3] += (Math.random() - 0.5) * 0.05;
                    positions[i * 3 + 2] += (Math.random() - 0.5) * 0.05;
                }
            }
        }
        
        // Emit new particles from each wheel if drifting
        if (this.isDrifting) {
            for (const { wheel } of wheelPositions) {
                // Find inactive particles to reuse
                for (let i = 0; i < 4; i++) {
                    const index = Math.floor(Math.random() * this.particleCount);
                    
                    if (active[index] === 0) {
                        // Activate particle at wheel position
                        active[index] = 1;
                        lifetimes[index] = 1.0;
                        sizes[index] = 0.8;
                        
                        // Position at wheel
                        positions[index * 3] = wheel.position.x;
                        positions[index * 3 + 1] = 0.1;
                        positions[index * 3 + 2] = wheel.position.z;
                    }
                }
            }
        }
        
        // Update buffers
        this.driftParticles.geometry.attributes.position.needsUpdate = true;
        this.driftParticles.geometry.attributes.size.needsUpdate = true;
    }
    
    updateWheels() {
        const wheelConfigs = [
            { name: 'frontLeft', wheel: this.frontLeftWheel, x: 1.1, z: 1.3, isFront: true },
            { name: 'frontRight', wheel: this.frontRightWheel, x: -1.1, z: 1.3, isFront: true },
            { name: 'rearLeft', wheel: this.rearLeftWheel, x: 1.1, z: -1.3, isFront: false },
            { name: 'rearRight', wheel: this.rearRightWheel, x: -1.1, z: -1.3, isFront: false }
        ];
        
        for (const config of wheelConfigs) {
            // Position the wheel
            const rotatedX = config.x * Math.cos(this.rotation) - config.z * Math.sin(this.rotation);
            const rotatedZ = config.x * Math.sin(this.rotation) + config.z * Math.cos(this.rotation);
            
            config.wheel.position.set(
                this.position.x + rotatedX, 
                this.position.y - 0.25,
                this.position.z + rotatedZ
            );
            
            // Reset rotation and set proper wheel orientation
            config.wheel.rotation.set(0, 0, 0);
            
            // Apply car rotation first
            config.wheel.rotation.y = this.rotation;
            
            // Add steering angle for front wheels
            if (config.isFront) {
                config.wheel.rotation.y += this.steeringAngle;
            }
            
            // Apply rolling rotation using the correct axis
            // Since we rotated the wheel geometry around Z, we need to use Z axis for rolling
            const rollAxis = new THREE.Vector3(0, 0, 1);
            config.wheel.rotateOnAxis(rollAxis, this.wheelRotation);
        }
    }
}
