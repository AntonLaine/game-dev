// Add a green floor
const floorGeometry = new THREE.BoxGeometry(100, 0.1, 100);
const floorMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.position.set(0, 0, 0); // Raised the green area a little bit
scene.add(floor);

// Add barriers around the green area
const barrierMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
const barriers = [];

const barrier1 = new THREE.Mesh(new THREE.BoxGeometry(100, 10, 1), barrierMaterial);
barrier1.position.set(0, 5, -50);
scene.add(barrier1);
barriers.push(barrier1);

const barrier2 = new THREE.Mesh(new THREE.BoxGeometry(100, 10, 1), barrierMaterial);
barrier2.position.set(0, 5, 50);
scene.add(barrier2);
barriers.push(barrier2);

const barrier3 = new THREE.Mesh(new THREE.BoxGeometry(1, 10, 100), barrierMaterial);
barrier3.position.set(-50, 5, 0);
scene.add(barrier3);
barriers.push(barrier3);

const barrier4 = new THREE.Mesh(new THREE.BoxGeometry(1, 10, 100), barrierMaterial);
barrier4.position.set(50, 5, 0);
scene.add(barrier4);
barriers.push(barrier4);

// Add a shop
const shopGeometry = new THREE.BoxGeometry(5, 5, 5);
const shopMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
const shop = new THREE.Mesh(shopGeometry, shopMaterial);
shop.position.set(20, 2.5, 0);
scene.add(shop);

const shopSignGeometry = new THREE.PlaneGeometry(5, 2);
const shopSignMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
const shopSign = new THREE.Mesh(shopSignGeometry, shopSignMaterial);
shopSign.position.set(20, 6, 0);
shopSign.rotation.y = Math.PI / 2;
scene.add(shopSign);

// Add houses
function addHouse(x, z) {
    const houseGeometry = new THREE.BoxGeometry(5, 5, 5);
    const houseMaterial = new THREE.MeshBasicMaterial({ color: 0x8B4513 });
    const house = new THREE.Mesh(houseGeometry, houseMaterial);
    house.position.set(x, 2.5, z);
    scene.add(house);

    const roofGeometry = new THREE.ConeGeometry(3, 2, 4);
    const roofMaterial = new THREE.MeshBasicMaterial({ color: 0x8B0000 });
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.set(x, 6, z);
    scene.add(roof);
}

addHouse(-20, -20);
addHouse(-20, 20);
addHouse(20, -20);
addHouse(20, 20);

// Add trees
function addTree(x, z) {
    const trunkGeometry = new THREE.CylinderGeometry(0.5, 0.5, 3, 32);
    const trunkMaterial = new THREE.MeshBasicMaterial({ color: 0x8B4513 });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.set(x, 1.5, z);
    scene.add(trunk);

    const leavesGeometry = new THREE.SphereGeometry(2, 32, 32);
    const leavesMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
    leaves.position.set(x, 4, z);
    scene.add(leaves);
}

addTree(-10, -10);
addTree(-10, 10);
addTree(10, -10);
addTree(10, 10);

// Add a path
const pathGeometry = new THREE.PlaneGeometry(50, 5);
const pathMaterial = new THREE.MeshBasicMaterial({ color: 0x8B4513 });
const path = new THREE.Mesh(pathGeometry, pathMaterial);
path.rotation.x = -Math.PI / 2;
path.position.set(0, 0, 0);
scene.add(path);

// Add a water fountain to the middle of the map
const fountainBaseGeometry = new THREE.CylinderGeometry(5, 5, 1, 32);
const fountainBaseMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff });
const fountainBase = new THREE.Mesh(fountainBaseGeometry, fountainBaseMaterial);
fountainBase.position.set(0, 0.5, 0);
scene.add(fountainBase);

const fountainTopGeometry = new THREE.CylinderGeometry(2, 2, 3, 32);
const fountainTopMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff });
const fountainTop = new THREE.Mesh(fountainTopGeometry, fountainTopMaterial);
fountainTop.position.set(0, 2.5, 0);
scene.add(fountainTop);

const waterGeometry = new THREE.CylinderGeometry(1.5, 1.5, 2.5, 32);
const waterMaterial = new THREE.MeshBasicMaterial({ color: 0x00ffff, opacity: 0.5, transparent: true });
const water = new THREE.Mesh(waterGeometry, waterMaterial);
water.position.set(0, 2.5, 0);
scene.add(water);

// Teleport to a box-like place when walking into the door
const boxGeometry = new THREE.BoxGeometry(20, 20, 20); // Made the box larger
const boxMaterial = new THREE.MeshBasicMaterial({ color: 0x808080, side: THREE.BackSide });
const box = new THREE.Mesh(boxGeometry, boxMaterial);
box.position.set(1000, 10, 1000);
scene.add(box);

const boxFloorGeometry = new THREE.BoxGeometry(20, 0.1, 20);
const boxFloorMaterial = new THREE.MeshBasicMaterial({ color: 0x808080 });
const boxFloor = new THREE.Mesh(boxFloorGeometry, boxFloorMaterial);
boxFloor.position.set(1000, -0.5, 1000);
scene.add(boxFloor);

const boxDoorGeometry = new THREE.BoxGeometry(2, 4, 0.1);
const boxDoorMaterial = new THREE.MeshBasicMaterial({ color: 0x654321 });
const boxDoor = new THREE.Mesh(boxDoorGeometry, boxDoorMaterial);
boxDoor.position.set(1000, 2, 995.05);
scene.add(boxDoor);

function teleportInsideBox() {
    cube.position.set(1000, 1, 1000);
}

function teleportOutsideBox() {
    cube.position.set(30, 1, 0);
}
