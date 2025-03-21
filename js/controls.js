class Controls {
    constructor(car) {
        this.car = car;
        this.keys = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            handbrake: false
        };
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        document.addEventListener('keyup', this.handleKeyUp.bind(this));
    }
    
    handleKeyDown(event) {
        switch(event.key) {
            case 'ArrowUp':
            case 'w':
            case 'W':
                this.keys.forward = true;
                break;
                
            case 'ArrowDown':
            case 's':
            case 'S':
                this.keys.backward = true;
                break;
                
            case 'ArrowLeft':
            case 'a':
            case 'A':
                this.keys.left = true;
                break;
                
            case 'ArrowRight':
            case 'd':
            case 'D':
                this.keys.right = true;
                break;
                
            case ' ': // Space bar for handbrake/drift
                this.keys.handbrake = true;
                event.preventDefault(); // Prevent page scrolling
                break;
        }
    }
    
    handleKeyUp(event) {
        switch(event.key) {
            case 'ArrowUp':
            case 'w':
            case 'W':
                this.keys.forward = false;
                break;
                
            case 'ArrowDown':
            case 's':
            case 'S':
                this.keys.backward = false;
                break;
                
            case 'ArrowLeft':
            case 'a':
            case 'A':
                this.keys.left = false;
                break;
                
            case 'ArrowRight':
            case 'd':
            case 'D':
                this.keys.right = false;
                break;
                
            case ' ': // Space bar for handbrake/drift
                this.keys.handbrake = false;
                break;
        }
    }
    
    update() {
        // Reset acceleration and steering
        this.car.acceleration = 0;
        this.car.steeringAngle = 0;
        
        // Apply acceleration based on key inputs - Halved for slower movement
        if (this.keys.forward) {
            this.car.acceleration = this.keys.handbrake ? 0.02 : 0.04; // Halved from 0.04/0.08
        }
        if (this.keys.backward) {
            this.car.acceleration = -0.04; // Halved from -0.08
        }
        
        // Apply steering based on key inputs
        if (this.keys.left) {
            this.car.steeringAngle = this.car.maxSteeringAngle * 0.8; // Added 0.8 multiplier for less sensitive steering
        }
        if (this.keys.right) {
            this.car.steeringAngle = -this.car.maxSteeringAngle * 0.8; // Added 0.8 multiplier for less sensitive steering
        }
        
        // Apply handbrake effect
        if (this.keys.handbrake && Math.abs(this.car.speed) > 0.75) { // Halved from 1.5
            // Increase friction to simulate braking
            this.car.friction = 0.08; // Increased from 0.05
            
            // Enforce drifting
            this.car.isDrifting = true;
            this.car.driftFactor = Math.min(this.car.maxDriftFactor, this.car.driftFactor + 0.05);
        } else {
            // Normal friction
            this.car.friction = 0.03; // Increased from 0.02
        }
    }
}
