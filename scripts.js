// File cleared for new game

document.addEventListener('keydown', (event) => {
    if (event.key === 'j' || event.key === 'J') {
        document.getElementById('lightJ').style.backgroundColor = 'blue';
        setTimeout(() => {
            document.getElementById('lightJ').style.backgroundColor = 'grey';
        }, 5000);
        simulateKeyPress('1');
        setTimeout(() => {
            simulateMouseClick();
            moveMouseLeft();
            setTimeout(() => {
                simulateKeyPress('d', true);
                simulateKeyPress('q');
                simulateKeyPress('2');
                simulateKeyPress('d', false);
            }, 100);
        }, 100);
    }
    document.getElementById('keyStatus').textContent = `Key "${event.key}" pressed down: ${JSON.stringify(event)}`;
});

document.addEventListener('keyup', (event) => {
    document.getElementById('keyStatus').textContent = 'No key pressed';
});

function simulateKeyPress(key, isKeyDown = true) {
    const event = new KeyboardEvent(isKeyDown ? 'keydown' : 'keyup', { key: key, bubbles: true, cancelable: true });
    document.body.dispatchEvent(event);
}

function simulateMouseClick() {
    const event = new MouseEvent('mousedown', { button: 0, bubbles: true, cancelable: true });
    document.body.dispatchEvent(event);
    setTimeout(() => {
        const event = new MouseEvent('mouseup', { button: 0, bubbles: true, cancelable: true });
        document.body.dispatchEvent(event);
    }, 100);
}

function moveMouseLeft() {
    // Simulate mouse movement to the left
    console.log('Mouse moved left');
}

document.addEventListener('keydown', (event) => {
    if (event.key === '1') {
        console.log('Key "1" pressed');
        document.getElementById('light1').style.backgroundColor = 'green';
        setTimeout(() => {
            document.getElementById('light1').style.backgroundColor = 'grey';
        }, 500);
    }
    if (event.key === 'd') {
        console.log('Key "D" pressed');
        document.getElementById('lightD').style.backgroundColor = 'green';
        setTimeout(() => {
            document.getElementById('lightD').style.backgroundColor = 'grey';
        }, 500);
    }
    if (event.key === 'q') {
        console.log('Key "Q" pressed');
        document.getElementById('lightQ').style.backgroundColor = 'green';
        setTimeout(() => {
            document.getElementById('lightQ').style.backgroundColor = 'grey';
        }, 500);
    }
    if (event.key === '2') {
        console.log('Key "2" pressed');
        document.getElementById('light2').style.backgroundColor = 'green';
        setTimeout(() => {
            document.getElementById('light2').style.backgroundColor = 'grey';
        }, 500);
    }
});
