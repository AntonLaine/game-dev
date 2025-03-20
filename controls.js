// Define class globally
class CharacterControls {
    constructor(character, camera) {
        this.character = character;
        this.camera = camera;
        this.moveSpeed = 0.1;
        this.rotationSpeed = 0.05; // Speed of rotation
        this.cameraDistance = 10;
        this.cameraHeight = 5;
        
        // Renamed keys to better reflect their function
        this.keysPressed = {
            moveForward: false,
            moveBackward: false,
            rotateLeft: false,
            rotateRight: false
        };
        
        // Set up event listeners
        document.addEventListener('keydown', (e) => this.onKeyDown(e));
        document.addEventListener('keyup', (e) => this.onKeyUp(e));
    }
    
    onKeyDown(event) {
        switch (event.key.toLowerCase()) {
            case 'w':
            case 'arrowup':
                this.keysPressed.moveForward = true;
                break;
            case 's':
            case 'arrowdown':
                this.keysPressed.moveBackward = true;
                break;
            case 'a':
            case 'arrowleft':
                this.keysPressed.rotateLeft = true;
                break;
            case 'd':
            case 'arrowright':
                this.keysPressed.rotateRight = true;
                break;
        }
    }
    
    onKeyUp(event) {
        switch (event.key.toLowerCase()) {
            case 'w':
            case 'arrowup':
                this.keysPressed.moveForward = false;
                break;
            case 's':
            case 'arrowdown':
                this.keysPressed.moveBackward = false;
                break;
            case 'a':
            case 'arrowleft':
                this.keysPressed.rotateLeft = false;
                break;
            case 'd':
            case 'arrowright':
                this.keysPressed.rotateRight = false;
                break;
        }
    }
    
    update() {
        // Handle rotation - now A/D keys rotate the character
        if (this.keysPressed.rotateLeft) {
            this.character.rotation.y += this.rotationSpeed;
        }
        if (this.keysPressed.rotateRight) {
            this.character.rotation.y -= this.rotationSpeed;
        }
        
        // Handle forward/backward movement along the direction the character is facing
        if (this.keysPressed.moveForward || this.keysPressed.moveBackward) {
            // Calculate movement direction based on character's facing direction
            const direction = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.character.rotation.y);
            
            // Set movement speed and direction
            const speed = this.keysPressed.moveForward ? this.moveSpeed : -this.moveSpeed;
            
            // Apply movement
            this.character.position.x += direction.x * speed;
            this.character.position.z += direction.z * speed;
        }
        
        // Calculate camera position based on character's orientation
        const cameraOffset = new THREE.Vector3(0, this.cameraHeight, this.cameraDistance);
        cameraOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.character.rotation.y);
        
        const targetCameraPos = new THREE.Vector3().copy(this.character.position).add(cameraOffset);
        
        // Smooth camera movement
        this.camera.position.lerp(targetCameraPos, 0.1);
        
        // Look at character
        this.camera.lookAt(
            this.character.position.x,
            this.character.position.y + 1.5,
            this.character.position.z
        );
    }
}
