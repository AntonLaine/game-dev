class Game {
    constructor() {
        this.container = document.getElementById('game-container');
        this.speedDisplay = document.getElementById('speed');
        
        this.setupScene();
        this.setupLights();
        this.setupCamera();
        this.createMiniMap();
        
        this.track = new Track(this.scene);
        this.car = new Car(this.scene);
        this.controls = new Controls(this.car);
        this.collectibles = [];
        this.score = 0;
        
        // Create collectibles
        this.createCollectibles();
        
        // Camera smoothing
        this.cameraTargetPosition = new THREE.Vector3();
        this.cameraTargetLookAt = new THREE.Vector3();
        this.cameraSmoothFactor = 0.1;
        
        this.isGameOver = false;
        
        this.animate();
        
        // Add fps counter
        this.fpsCounter = document.createElement('div');
        this.fpsCounter.id = 'fps-counter';
        this.fpsCounter.style.position = 'absolute';
        this.fpsCounter.style.top = '10px';
        this.fpsCounter.style.right = '10px';
        this.fpsCounter.style.color = 'white';
        this.fpsCounter.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        this.fpsCounter.style.padding = '5px';
        this.fpsCounter.style.borderRadius = '3px';
        document.body.appendChild(this.fpsCounter);
        
        this.lastFrameTime = performance.now();
        this.frameCount = 0;
        this.fpsUpdateInterval = 500; // Update FPS display every 500ms
        this.lastFpsUpdate = this.lastFrameTime;
    }
    
    setupScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB); // Sky blue
        
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.container.appendChild(this.renderer.domElement);
        
        // Handle window resize
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }
    
    setupLights() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        this.scene.add(ambientLight);
        
        // Directional light (sun)
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(100, 100, 50);
        dirLight.castShadow = true;
        
        // Configure shadow properties
        dirLight.shadow.mapSize.width = 2048;
        dirLight.shadow.mapSize.height = 2048;
        dirLight.shadow.camera.left = -100;
        dirLight.shadow.camera.right = 100;
        dirLight.shadow.camera.top = 100;
        dirLight.shadow.camera.bottom = -100;
        
        this.scene.add(dirLight);
    }
    
    setupCamera() {
        this.camera = new THREE.PerspectiveCamera(
            75, 
            window.innerWidth / window.innerHeight, 
            0.1, 
            1000
        );
        this.camera.position.set(0, 10, -10);
        this.camera.lookAt(0, 0, 0);
    }
    
    createMiniMap() {
        // Create mini-map scene and camera
        this.miniMapScene = new THREE.Scene();
        this.miniMapScene.background = new THREE.Color(0x333333);
        
        this.miniMapCamera = new THREE.OrthographicCamera(
            -50, 50, 50, -50, 1, 1000
        );
        this.miniMapCamera.position.set(0, 100, 0);
        this.miniMapCamera.lookAt(0, 0, 0);
        this.miniMapCamera.rotation.z = Math.PI; // Flip map to match real world
        
        // Create mini-map renderer
        this.miniMapRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.miniMapRenderer.setSize(150, 150);
        this.miniMapRenderer.domElement.style.position = 'absolute';
        this.miniMapRenderer.domElement.style.bottom = '20px';
        this.miniMapRenderer.domElement.style.right = '20px';
        this.miniMapRenderer.domElement.style.border = '2px solid white';
        this.miniMapRenderer.domElement.style.borderRadius = '50%';
        document.body.appendChild(this.miniMapRenderer.domElement);
        
        // Car indicator for mini-map
        const carIndicator = new THREE.Mesh(
            new THREE.CircleGeometry(2, 16),
            new THREE.MeshBasicMaterial({ color: 0xff0000 })
        );
        carIndicator.rotation.x = -Math.PI / 2;
        this.miniMapCarIndicator = carIndicator;
        this.miniMapScene.add(carIndicator);
        
        // Ground plane for mini-map
        const groundGeometry = new THREE.PlaneGeometry(200, 200);
        const groundMaterial = new THREE.MeshBasicMaterial({ color: 0x228833 });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        this.miniMapScene.add(ground);
        
        // Roads for mini-map
        const roadMaterial = new THREE.MeshBasicMaterial({ color: 0x444444 });
        
        // Straight road
        const roadGeometry = new THREE.PlaneGeometry(10, 200);
        const road = new THREE.Mesh(roadGeometry, roadMaterial);
        road.rotation.x = -Math.PI / 2;
        road.position.y = 0.1;
        this.miniMapScene.add(road);
        
        // Circular road
        const circleGeometry = new THREE.RingGeometry(25, 35, 64);
        const circleRoad = new THREE.Mesh(circleGeometry, roadMaterial);
        circleRoad.rotation.x = -Math.PI / 2;
        circleRoad.position.set(50, 0.1, 0);
        this.miniMapScene.add(circleRoad);
    }
    
    createCollectibles() {
        const collectiblePositions = [
            { x: 0, z: 20 },
            { x: 0, z: 40 },
            { x: 20, z: 40 },
            { x: 40, z: 20 },
            { x: 60, z: 0 },
            { x: 50, z: -30 }
        ];
        
        const collectibleGeometry = new THREE.TorusGeometry(1, 0.3, 16, 32);
        const collectibleMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xFFFF00,
            emissive: 0x888800
        });
        
        collectiblePositions.forEach(pos => {
            const collectible = new THREE.Mesh(collectibleGeometry, collectibleMaterial);
            collectible.position.set(pos.x, 1.5, pos.z);
            collectible.rotation.x = Math.PI / 2;
            collectible.userData.isCollected = false;
            this.scene.add(collectible);
            
            // Add to collectibles array
            this.collectibles.push(collectible);
            
            // Also add to mini-map
            const mapCollectible = new THREE.Mesh(
                new THREE.CircleGeometry(1, 8),
                new THREE.MeshBasicMaterial({ color: 0xFFFF00 })
            );
            mapCollectible.position.set(pos.x, 0.2, pos.z);
            mapCollectible.rotation.x = -Math.PI / 2;
            this.miniMapScene.add(mapCollectible);
        });
    }
    
    updateCamera() {
        // Calculate ideal camera position (smoothly follow car)
        const idealOffset = new THREE.Vector3(
            -10 * Math.sin(this.car.rotation), // Reduced from -12
            7, // Reduced from 8
            -10 * Math.cos(this.car.rotation) // Reduced from -12
        );
        
        // Calculate target position with smoothing
        this.cameraTargetPosition.copy(this.car.position).add(idealOffset);
        
        // Smoothly update camera position (increased smoothness)
        this.camera.position.lerp(this.cameraTargetPosition, this.cameraSmoothFactor);
        
        // Calculate target look at point
        this.cameraTargetLookAt.set(
            this.car.position.x,
            this.car.position.y + 1,
            this.car.position.z
        );
        
        // Look at the car
        this.camera.lookAt(this.cameraTargetLookAt);
        
        // Update mini-map
        this.updateMiniMap();
    }
    
    updateMiniMap() {
        // Update car indicator position on mini-map
        this.miniMapCarIndicator.position.x = this.car.position.x;
        this.miniMapCarIndicator.position.z = this.car.position.z;
        
        // Rotate indicator to match car rotation
        this.miniMapCarIndicator.rotation.y = this.car.rotation;
        
        // Render mini-map
        this.miniMapRenderer.render(this.miniMapScene, this.miniMapCamera);
    }
    
    checkCollisions() {
        // Check obstacle collisions
        if (this.track.checkCollisions(this.car.position, 2, 4)) {
            // Reduce speed instead of completely stopping
            this.car.speed *= 0.5;
            // Add a small bounce effect - adjusted for lower speeds
            this.car.position.x -= Math.sin(this.car.rotation) * this.car.speed * 1.2; // Reduced from 1.5
            this.car.position.z -= Math.cos(this.car.rotation) * this.car.speed * 1.2; // Reduced from 1.5
        }
        
        // Check collectible collisions
        this.collectibles.forEach(collectible => {
            if (!collectible.userData.isCollected) {
                const distance = collectible.position.distanceTo(this.car.position);
                if (distance < 3) {
                    // Collect the item
                    collectible.userData.isCollected = true;
                    collectible.visible = false;
                    this.score += 100;
                    
                    // Add score popup
                    this.showScorePopup('+100', collectible.position);
                }
            }
        });
    }
    
    showScorePopup(text, position) {
        // Create popup element
        const popup = document.createElement('div');
        popup.textContent = text;
        popup.style.position = 'absolute';
        popup.style.color = 'yellow';
        popup.style.fontWeight = 'bold';
        popup.style.fontSize = '20px';
        popup.style.textShadow = '2px 2px 2px black';
        document.body.appendChild(popup);
        
        // Convert 3D position to screen position
        const screenPosition = new THREE.Vector3(position.x, position.y, position.z);
        screenPosition.project(this.camera);
        
        const x = (screenPosition.x * 0.5 + 0.5) * window.innerWidth;
        const y = (-(screenPosition.y * 0.5) + 0.5) * window.innerHeight;
        
        popup.style.left = `${x}px`;
        popup.style.top = `${y}px`;
        
        // Animate and remove
        let opacity = 1;
        let yPos = y;
        
        const animatePopup = () => {
            opacity -= 0.02;
            yPos -= 1;
            
            popup.style.opacity = opacity;
            popup.style.top = `${yPos}px`;
            
            if (opacity > 0) {
                requestAnimationFrame(animatePopup);
            } else {
                document.body.removeChild(popup);
            }
        };
        
        requestAnimationFrame(animatePopup);
    }
    
    animate(currentTime) {
        requestAnimationFrame(this.animate.bind(this));
        
        if (!this.isGameOver) {
            this.controls.update();
            const speed = this.car.update();
            this.updateCamera();
            this.checkCollisions();
            
            // Update speed display with more info (round to 1 decimal place for better readability)
            this.speedDisplay.textContent = `Speed: ${speed.toFixed(1)} km/h | Score: ${this.score} | Controls: WASD/Arrows`;
            
            // Calculate and update FPS
            this.frameCount++;
            if (currentTime - this.lastFpsUpdate > this.fpsUpdateInterval) {
                const fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastFpsUpdate));
                this.fpsCounter.textContent = `FPS: ${fps}`;
                
                this.frameCount = 0;
                this.lastFpsUpdate = currentTime;
            }
        }
        
        this.renderer.render(this.scene, this.camera);
    }
}

// Start the game when the page is loaded
window.onload = () => {
    new Game();
};
