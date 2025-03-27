class GameControls {
    constructor(world, player) {
        this.world = world;
        this.player = player;
        this.keys = {};
        this.mousePosition = { x: 0, y: 0 };
        this.isMouseDown = false;
        
        // Set up key event listeners
        window.addEventListener('keydown', (e) => this.onKeyDown(e));
        window.addEventListener('keyup', (e) => this.onKeyUp(e));
        window.addEventListener('mousemove', (e) => this.onMouseMove(e));
        window.addEventListener('mousedown', (e) => this.onMouseDown(e));
        window.addEventListener('mouseup', (e) => this.onMouseUp(e));
        
        // UI Controls
        document.getElementById('roll-character').addEventListener('click', () => {
            game.rollNewCharacter();
        });
        
        document.getElementById('toggle-map').addEventListener('click', () => {
            const mapOverlay = document.getElementById('map-overlay');
            if (mapOverlay.classList.contains('hidden')) {
                mapOverlay.classList.remove('hidden');
                const mapContainer = document.getElementById('map-container');
                this.world.createMiniMap(mapContainer);
            } else {
                mapOverlay.classList.add('hidden');
            }
        });
        
        document.getElementById('close-map').addEventListener('click', () => {
            document.getElementById('map-overlay').classList.add('hidden');
        });
    }
    
    onKeyDown(event) {
        this.keys[event.code] = true;
        
        // Use ability keys (1-5)
        if (event.code.startsWith('Digit') && this.player) {
            const abilityIndex = parseInt(event.code.replace('Digit', '')) - 1;
            if (abilityIndex >= 0 && abilityIndex < this.player.abilities.length) {
                this.player.useAbility(abilityIndex, null);
            }
        }
    }
    
    onKeyUp(event) {
        this.keys[event.code] = false;
    }
    
    onMouseMove(event) {
        this.mousePosition.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mousePosition.y = -(event.clientY / window.innerHeight) * 2 + 1;
    }
    
    onMouseDown(event) {
        this.isMouseDown = true;
    }
    
    onMouseUp(event) {
        this.isMouseDown = false;
    }
    
    update(deltaTime) {
        if (!this.player || !this.player.model) return;
        
        const moveSpeed = 10 * deltaTime; // Units per second
        const rotateSpeed = 2 * deltaTime; // Radians per second
        
        // Tank-like rotation controls
        if (this.keys['KeyA']) {
            // Rotate tank left
            this.player.model.rotation.y += rotateSpeed * 2;
        }
        if (this.keys['KeyD']) {
            // Rotate tank right
            this.player.model.rotation.y -= rotateSpeed * 2;
        }
        
        // Tank-like forward/backward movement with W and S reversed
        if (this.keys['KeyW']) {
            // Move backward (W now moves backward)
            this.player.model.position.x -= Math.sin(this.player.model.rotation.y) * moveSpeed;
            this.player.model.position.z -= Math.cos(this.player.model.rotation.y) * moveSpeed;
        }
        if (this.keys['KeyS']) {
            // Move forward (S now moves forward)
            this.player.model.position.x += Math.sin(this.player.model.rotation.y) * moveSpeed;
            this.player.model.position.z += Math.cos(this.player.model.rotation.y) * moveSpeed;
        }
        
        // Rotation controls with mouse
        if (this.isMouseDown) {
            this.player.model.rotation.y -= this.mousePosition.x * rotateSpeed;
        }
        
        // Update camera to follow player
        if (this.player.model) {
            // Position camera behind player
            const cameraDistance = 5;
            const cameraHeight = 2;
            
            this.world.camera.position.x = this.player.model.position.x - Math.sin(this.player.model.rotation.y) * cameraDistance;
            this.world.camera.position.z = this.player.model.position.z - Math.cos(this.player.model.rotation.y) * cameraDistance;
            this.world.camera.position.y = this.player.model.position.y + cameraHeight;
            
            // Look at player
            this.world.camera.lookAt(
                this.player.model.position.x,
                this.player.model.position.y + 1,
                this.player.model.position.z
            );
        }
    }
}
