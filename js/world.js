class GameWorld {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({
            canvas: document.getElementById('game-canvas'),
            antialias: true
        });
        
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x87ceeb); // Sky blue
        
        this.camera.position.set(0, 5, 10);
        this.camera.lookAt(0, 0, 0);
        
        // Add lights
        const ambientLight = new THREE.AmbientLight(0x404040);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(1, 1, 1);
        this.scene.add(directionalLight);
        
        this.setupWorld();
        
        // Handle window resize
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }
    
    setupWorld() {
        // Create ground
        const groundGeometry = new THREE.PlaneGeometry(100, 100);
        const groundMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x33aa33,
            side: THREE.DoubleSide
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        this.scene.add(ground);
        
        // Add some trees and rocks for environment
        this.addEnvironmentObjects();
        
        // Add buildings
        this.addBuildings();
    }
    
    addEnvironmentObjects() {
        // Add trees
        for (let i = 0; i < 50; i++) {
            const x = (Math.random() - 0.5) * 90;
            const z = (Math.random() - 0.5) * 90;
            
            // Simple tree with trunk and foliage
            const trunk = new THREE.Mesh(
                new THREE.CylinderGeometry(0.2, 0.3, 1.5, 8),
                new THREE.MeshStandardMaterial({ color: 0x8B4513 })
            );
            
            const foliage = new THREE.Mesh(
                new THREE.ConeGeometry(1, 2, 8),
                new THREE.MeshStandardMaterial({ color: 0x00AA00 })
            );
            
            foliage.position.y = 1.5;
            trunk.add(foliage);
            trunk.position.set(x, 0.75, z);
            
            this.scene.add(trunk);
        }
        
        // Add rocks
        for (let i = 0; i < 30; i++) {
            const x = (Math.random() - 0.5) * 90;
            const z = (Math.random() - 0.5) * 90;
            const scale = 0.2 + Math.random() * 0.8;
            
            const rock = new THREE.Mesh(
                new THREE.DodecahedronGeometry(scale, 0),
                new THREE.MeshStandardMaterial({ color: 0x888888 })
            );
            
            rock.position.set(x, scale / 2, z);
            this.scene.add(rock);
        }
    }
    
    addBuildings() {
        // Add a few buildings to create a small town
        const buildingPositions = [
            { x: 10, z: 10 },
            { x: 15, z: 10 },
            { x: 10, z: 15 },
            { x: -10, z: -10 },
            { x: -15, z: -10 },
            { x: -10, z: -15 }
        ];
        
        buildingPositions.forEach(pos => {
            const width = 2 + Math.random() * 3;
            const height = 3 + Math.random() * 6;
            const depth = 2 + Math.random() * 3;
            
            const building = new THREE.Mesh(
                new THREE.BoxGeometry(width, height, depth),
                new THREE.MeshStandardMaterial({ color: 0xCCCCCC })
            );
            
            building.position.set(pos.x, height / 2, pos.z);
            this.scene.add(building);
        });
    }
    
    render() {
        this.renderer.render(this.scene, this.camera);
    }
    
    // Method to create a mini-map
    createMiniMap(mapElement) {
        const mapSize = mapElement.clientWidth;
        
        // Create a 2D canvas for the map
        const mapCanvas = document.createElement('canvas');
        mapCanvas.width = mapSize;
        mapCanvas.height = mapSize;
        mapElement.appendChild(mapCanvas);
        
        const ctx = mapCanvas.getContext('2d');
        
        // Draw map background
        ctx.fillStyle = '#2a3a4a';
        ctx.fillRect(0, 0, mapSize, mapSize);
        
        // Draw player position (center)
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.arc(mapSize / 2, mapSize / 2, 5, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw environment objects (simplified)
        ctx.fillStyle = '#00aa00'; // Trees
        this.scene.children.forEach(child => {
            if (child.children.length > 0 && child.children[0].geometry instanceof THREE.ConeGeometry) {
                const x = ((child.position.x / 90) * 0.5 + 0.5) * mapSize;
                const y = ((child.position.z / 90) * 0.5 + 0.5) * mapSize;
                ctx.beginPath();
                ctx.arc(x, y, 2, 0, Math.PI * 2);
                ctx.fill();
            }
        });
        
        // Draw buildings
        ctx.fillStyle = '#aaaaaa'; // Buildings
        this.scene.children.forEach(child => {
            if (child.geometry instanceof THREE.BoxGeometry && child.geometry.parameters.width > 1) {
                const x = ((child.position.x / 90) * 0.5 + 0.5) * mapSize;
                const y = ((child.position.z / 90) * 0.5 + 0.5) * mapSize;
                const bWidth = (child.geometry.parameters.width / 90) * mapSize;
                const bDepth = (child.geometry.parameters.depth / 90) * mapSize;
                ctx.fillRect(x - bWidth/2, y - bDepth/2, bWidth, bDepth);
            }
        });
    }
}
