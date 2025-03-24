class App {
    constructor() {
        // Initialize application
        this.initializeApp();
    }

    initializeApp() {
        // The app is already initialized by other components
        console.log('2D Animator initialized');
        
        // Handle fullscreen toggle
        document.getElementById('toggle-fullscreen').addEventListener('click', this.toggleFullscreen.bind(this));
        
        // Add any global shortcuts or additional functionality here
        document.addEventListener('keydown', (e) => {
            // Prevent shortcuts when input elements are focused
            if (e.target.tagName === 'INPUT') return;
            
            // Play/Stop - Space
            if (e.key === ' ') {
                if (window.timeline.animationInterval) {
                    window.timeline.stopAnimation();
                } else {
                    window.timeline.playAnimation();
                }
                e.preventDefault();
            }
            
            // New frame - N
            if (e.key === 'n') {
                window.timeline.addFrame();
                e.preventDefault();
            }
            
            // Delete frame - Delete or Backspace
            if (e.key === 'Delete' || e.key === 'Backspace') {
                window.timeline.deleteFrame();
                e.preventDefault();
            }
            
            // Duplicate frame - D
            if (e.key === 'd') {
                window.timeline.duplicateFrame();
                e.preventDefault();
            }
            
            // Export video - E
            if (e.key === 'e') {
                window.exporter.exportVideo();
                e.preventDefault();
            }
            
            // Escape key to exit fullscreen/overlay
            if (e.key === 'Escape') {
                if (document.getElementById('animation-overlay').classList.contains('visible')) {
                    document.getElementById('animation-overlay').classList.remove('visible');
                    window.timeline.stopAnimation();
                }
                
                if (document.fullscreenElement) {
                    document.exitFullscreen();
                }
            }
        });
        
        // Show keyboard shortcuts on startup
        this.showKeyboardShortcuts();
    }
    
    showKeyboardShortcuts() {
        // Create a tooltip that shows keyboard shortcuts
        const shortcuts = document.createElement('div');
        shortcuts.className = 'shortcuts-tooltip';
        shortcuts.innerHTML = `
            <h3>Keyboard Shortcuts</h3>
            <ul>
                <li><strong>Space</strong> - Play/Stop animation</li>
                <li><strong>N</strong> - New frame</li>
                <li><strong>D</strong> - Duplicate current frame</li>
                <li><strong>Delete/Backspace</strong> - Delete current frame</li>
                <li><strong>E</strong> - Export video</li>
                <li><strong>Esc</strong> - Close overlay/Exit fullscreen</li>
            </ul>
            <button id="close-shortcuts">Got it!</button>
        `;
        
        shortcuts.style.position = 'fixed';
        shortcuts.style.bottom = '20px';
        shortcuts.style.right = '20px';
        shortcuts.style.backgroundColor = 'rgba(0,0,0,0.8)';
        shortcuts.style.color = 'white';
        shortcuts.style.padding = '15px';
        shortcuts.style.borderRadius = '5px';
        shortcuts.style.zIndex = '999';
        shortcuts.style.maxWidth = '300px';
        shortcuts.style.boxShadow = '0 0 10px rgba(0,0,0,0.5)';
        
        document.body.appendChild(shortcuts);
        
        document.getElementById('close-shortcuts').addEventListener('click', () => {
            document.body.removeChild(shortcuts);
        });
        
        // Auto-hide after 10 seconds
        setTimeout(() => {
            if (document.body.contains(shortcuts)) {
                document.body.removeChild(shortcuts);
            }
        }, 10000);
    }
    
    toggleFullscreen() {
        const appContainer = document.querySelector('.app-container');
        
        if (!document.fullscreenElement) {
            appContainer.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable fullscreen: ${err.message}`);
                alert(`Could not enter fullscreen mode: ${err.message}`);
            });
            appContainer.classList.add('fullscreen');
        } else {
            document.exitFullscreen();
            appContainer.classList.remove('fullscreen');
        }
    }
}

// Initialize the app when the page is loaded
window.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});
