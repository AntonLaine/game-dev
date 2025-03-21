class Track {
    constructor(scene) {
        this.scene = scene;
        this.obstacles = [];
        this.createTrack();
    }

    createTrack() {
        // Create ground
        const groundGeometry = new THREE.PlaneGeometry(200, 200);
        const groundMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x33AA33,
            side: THREE.DoubleSide
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);

        // Add road
        const roadGeometry = new THREE.PlaneGeometry(10, 200);
        const roadMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x555555,
            side: THREE.DoubleSide
        });
        const road = new THREE.Mesh(roadGeometry, roadMaterial);
        road.rotation.x = Math.PI / 2;
        road.position.y = 0.01; // Slightly above ground to prevent z-fighting
        this.scene.add(road);

        // Add circular road
        const circleRadius = 30;
        const circleThickness = 10;
        const circleSegments = 64;
        
        const circleGeometry = new THREE.RingGeometry(
            circleRadius - circleThickness/2, 
            circleRadius + circleThickness/2, 
            circleSegments
        );
        const circleMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x555555,
            side: THREE.DoubleSide
        });
        const circleRoad = new THREE.Mesh(circleGeometry, circleMaterial);
        circleRoad.rotation.x = Math.PI / 2;
        circleRoad.position.set(50, 0.01, 0);
        this.scene.add(circleRoad);
        
        // Add obstacles
        this.addObstacles();
    }

    addObstacles() {
        const obstaclePositions = [
            { x: 15, z: 10 },
            { x: -15, z: -20 },
            { x: 25, z: -15 },
            { x: 40, z: 30 },
            { x: -20, z: 40 }
        ];
        
        const obstacleGeometry = new THREE.BoxGeometry(3, 2, 3);
        const obstacleMaterial = new THREE.MeshPhongMaterial({ color: 0xFF5533 });
        
        obstaclePositions.forEach(pos => {
            const obstacle = new THREE.Mesh(obstacleGeometry, obstacleMaterial);
            obstacle.position.set(pos.x, 1, pos.z);
            obstacle.castShadow = true;
            obstacle.receiveShadow = true;
            this.scene.add(obstacle);
            
            // Store obstacle for collision detection
            this.obstacles.push({
                mesh: obstacle,
                width: 3,
                depth: 3
            });
        });
        
        // Add trees
        for (let i = 0; i < 30; i++) {
            this.addTree(
                Math.random() * 180 - 90,
                Math.random() * 180 - 90
            );
        }
    }
    
    addTree(x, z) {
        // Tree trunk
        const trunkGeometry = new THREE.CylinderGeometry(0.5, 0.7, 4);
        const trunkMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513 });
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.set(x, 2, z);
        trunk.castShadow = true;
        this.scene.add(trunk);
        
        // Tree foliage
        const foliageGeometry = new THREE.ConeGeometry(2, 4, 8);
        const foliageMaterial = new THREE.MeshPhongMaterial({ color: 0x115511 });
        const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
        foliage.position.set(x, 5, z);
        foliage.castShadow = true;
        this.scene.add(foliage);
    }
    
    checkCollisions(carPosition, carWidth, carDepth) {
        for (const obstacle of this.obstacles) {
            const dx = Math.abs(carPosition.x - obstacle.mesh.position.x);
            const dz = Math.abs(carPosition.z - obstacle.mesh.position.z);
            
            // Add a small buffer (0.9) to prevent over-sensitive collisions
            if (dx < (carWidth + obstacle.width) * 0.45 && 
                dz < (carDepth + obstacle.depth) * 0.45) {
                return true; // Collision detected
            }
        }
        return false; // No collision
    }
}
