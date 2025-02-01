function startFootballGame() {
    isPlayingFootball = true;

    // Save and remove existing NPCs
    originalNPCs = npcs.slice();
    npcs.forEach(npc => scene.remove(npc));
    npcs.length = 0;

    // Clear the scene
    while (scene.children.length > 0) {
        scene.remove(scene.children[0]);
    }

    // Create the football field
    const fieldGeometry = new THREE.PlaneGeometry(100, 50);
    const fieldMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const field = new THREE.Mesh(fieldGeometry, fieldMaterial);
    field.rotation.x = -Math.PI / 2;
    scene.add(field);

    // Create goals
    const goalGeometry = new THREE.BoxGeometry(10, 5, 1);
    const goalMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const goal1 = new THREE.Mesh(goalGeometry, goalMaterial);
    goal1.position.set(0, 2.5, 25);
    scene.add(goal1);

    const goal2 = new THREE.Mesh(goalGeometry, goalMaterial);
    goal2.position.set(0, 2.5, -25);
    scene.add(goal2);

    // Create the football
    const ballGeometry = new THREE.SphereGeometry(1, 32, 32);
    const ballMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const ball = new THREE.Mesh(ballGeometry, ballMaterial);
    ball.position.set(0, 1, 0);
    scene.add(ball);

    // Create players
    const playerGeometry = new THREE.BoxGeometry(1, 2, 1);
    const playerMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const player = new THREE.Mesh(playerGeometry, playerMaterial);
    player.position.set(0, 1, -20);
    scene.add(player);

    const opponentMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff });
    const opponent = new THREE.Mesh(playerGeometry, opponentMaterial);
    opponent.position.set(0, 1, 20);
    scene.add(opponent);

    // Create teammates
    const teammate1 = new THREE.Mesh(playerGeometry, playerMaterial);
    teammate1.position.set(-10, 1, -10);
    scene.add(teammate1);

    const teammate2 = new THREE.Mesh(playerGeometry, playerMaterial);
    teammate2.position.set(10, 1, -10);
    scene.add(teammate2);

    const teammates = [teammate1, teammate2];

    // Create opponent teammates
    const opponentTeammate1 = new THREE.Mesh(playerGeometry, opponentMaterial);
    opponentTeammate1.position.set(-10, 1, 10);
    scene.add(opponentTeammate1);

    const opponentTeammate2 = new THREE.Mesh(playerGeometry, opponentMaterial);
    opponentTeammate2.position.set(10, 1, 10);
    scene.add(opponentTeammate2);

    const opponentTeammates = [opponentTeammate1, opponentTeammate2];

    // Add movement for the football game
    let ballVelocity = new THREE.Vector3();
    let playerVelocity = new THREE.Vector3();
    let opponentVelocity = new THREE.Vector3();
    let playerGoals = 0;
    let opponentGoals = 0;

    function updateFootballGame() {
        // Player movement with rotation affecting direction
        if (keys['w']) {
            playerVelocity.x = Math.sin(player.rotation.y) * speed;
            playerVelocity.z = Math.cos(player.rotation.y) * speed;
        } else if (keys['s']) {
            playerVelocity.x = -Math.sin(player.rotation.y) * speed;
            playerVelocity.z = -Math.cos(player.rotation.y) * speed;
        } else {
            playerVelocity.x = 0;
            playerVelocity.z = 0;
        }
        if (keys['a']) {
            playerVelocity.x += Math.cos(player.rotation.y) * speed;
            playerVelocity.z -= Math.sin(player.rotation.y) * speed;
        } else if (keys['d']) {
            playerVelocity.x -= Math.cos(player.rotation.y) * speed;
            playerVelocity.z += Math.sin(player.rotation.y) * speed;
        }
        player.position.add(playerVelocity);

        // Kick the ball if close enough
        if (keys['f'] && ball.position.distanceTo(player.position) < 2) {
            ballVelocity.add(playerVelocity.clone().multiplyScalar(2));
        }

        // Opponent AI movement
        opponentVelocity.x = (ball.position.x - opponent.position.x) * 0.02;
        opponentVelocity.z = (ball.position.z - opponent.position.z) * 0.02;
        opponent.position.add(opponentVelocity);

        // Opponent kicks the ball if close enough
        if (ball.position.distanceTo(opponent.position) < 2) {
            ballVelocity.add(opponentVelocity.clone().multiplyScalar(2));
        }

        // Teammates AI movement
        teammates.forEach(teammate => {
            const teammateVelocity = new THREE.Vector3();
            teammateVelocity.x = (ball.position.x - teammate.position.x) * 0.02;
            teammateVelocity.z = (ball.position.z - teammate.position.z) * 0.02;
            teammate.position.add(teammateVelocity);

            // Teammate passes the ball if close enough
            if (ball.position.distanceTo(teammate.position) < 2) {
                ballVelocity.add(teammateVelocity.clone().multiplyScalar(2));
            }
        });

        // Opponent teammates AI movement
        opponentTeammates.forEach(teammate => {
            const teammateVelocity = new THREE.Vector3();
            teammateVelocity.x = (ball.position.x - teammate.position.x) * 0.02;
            teammateVelocity.z = (ball.position.z - teammate.position.z) * 0.02;
            teammate.position.add(teammateVelocity);

            // Opponent teammate kicks the ball if close enough
            if (ball.position.distanceTo(teammate.position) < 2) {
                ballVelocity.add(teammateVelocity.clone().multiplyScalar(2));
            }
        });

        // Ball movement
        ball.position.add(ballVelocity);
        ballVelocity.multiplyScalar(0.95); // Friction

        // Check for goals
        if (ball.position.z > 24 && Math.abs(ball.position.x) < 5) {
            opponentGoals++;
            alert('Goal for Opponent!');
            ball.position.set(0, 1, 0);
            ballVelocity.set(0, 0, 0);
        }
        if (ball.position.z < -24 && Math.abs(ball.position.x) < 5) {
            playerGoals++;
            alert('Goal for Player!');
            ball.position.set(0, 1, 0);
            ballVelocity.set(0, 0, 0);
        }

        // Prevent players and ball from escaping the stadium
        player.position.x = Math.max(Math.min(player.position.x, 49), -49);
        player.position.z = Math.max(Math.min(player.position.z, 24), -24);
        opponent.position.x = Math.max(Math.min(opponent.position.x, 49), -49);
        opponent.position.z = Math.max(Math.min(opponent.position.z, 24), -24);
        ball.position.x = Math.max(Math.min(ball.position.x, 49), -49);
        ball.position.z = Math.max(Math.min(ball.position.z, 24), -24);

        // Update camera position to follow the player from above
        camera.position.set(
            player.position.x,
            player.position.y + 10,
            player.position.z
        );
        camera.lookAt(player.position);

        // Check for match end
        if (playerGoals >= 5) {
            alert('Player wins the match!');
            stopFootballGame();
        } else if (opponentGoals >= 5) {
            alert('Opponent wins the match!');
            stopFootballGame();
        }
    }

    function animateFootballGame() {
        if (isPlayingFootball) {
            requestAnimationFrame(animateFootballGame);
            updateFootballGame();
            renderer.render(scene, camera);
        }
    }

    openFootballControls();
    animateFootballGame();
}

function stopFootballGame() {
    isPlayingFootball = false;

    // Clear the scene
    while (scene.children.length > 0) {
        scene.remove(scene.children[0]);
    }

    // Restore original NPCs
    originalNPCs.forEach(npc => {
        scene.add(npc);
        npcs.push(npc);
    });

    // Restore original scene elements
    scene.add(cube);
    scene.add(floor);
    barriers.forEach(barrier => scene.add(barrier));
    scene.add(shop);
    scene.add(shopSign);
    addHouse(-20, -20);
    addHouse(-20, 20);
    addHouse(20, -20);
    addHouse(20, 20);
    addTree(-10, -10);
    addTree(-10, 10);
    addTree(10, -10);
    addTree(10, 10);
    scene.add(path);
    scene.add(fountainBase);
    scene.add(fountainTop);
    scene.add(water);
    scene.add(box);
    scene.add(boxFloor);
    scene.add(boxDoor);
}
