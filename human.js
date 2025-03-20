// Define function globally
function createHuman() {
    // Create a group to hold all parts of the human
    const human = new THREE.Group();
    
    // Create body (cylinder)
    const bodyGeometry = new THREE.CylinderGeometry(0.5, 0.5, 2, 16);
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x0088ff });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 1;
    human.add(body);
    
    // Create head (sphere)
    const headGeometry = new THREE.SphereGeometry(0.5, 32, 32);
    const headMaterial = new THREE.MeshStandardMaterial({ color: 0xffcc99 });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 2.5;
    human.add(head);
    
    // Create legs (without feet)
    const legGeometry = new THREE.CylinderGeometry(0.15, 0.15, 1.5, 16);
    const legMaterial = new THREE.MeshStandardMaterial({ color: 0x003366 });
    
    // Left leg
    const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
    leftLeg.position.set(-0.3, -0.25, 0);
    human.add(leftLeg);
    
    // Right leg
    const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
    rightLeg.position.set(0.3, -0.25, 0);
    human.add(rightLeg);
    
    // Create crown (simplified - no gems)
    const crownBaseGeometry = new THREE.CylinderGeometry(0.4, 0.5, 0.3, 16);
    const crownMaterial = new THREE.MeshStandardMaterial({ color: 0xffd700 }); // Golden color
    const crownBase = new THREE.Mesh(crownBaseGeometry, crownMaterial);
    crownBase.position.y = 2.9;
    human.add(crownBase);
    
    // Create crown points
    const pointGeometry = new THREE.ConeGeometry(0.1, 0.3, 8);
    const pointMaterial = new THREE.MeshStandardMaterial({ color: 0xffd700 });
    
    for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 2;
        
        // Crown point
        const point = new THREE.Mesh(pointGeometry, pointMaterial);
        point.position.set(
            0.3 * Math.cos(angle),
            3.1,
            0.3 * Math.sin(angle)
        );
        human.add(point);
    }
    
    return human;
}
