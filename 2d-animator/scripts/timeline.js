class Timeline {
    constructor() {
        this.frames = [];
        this.currentFrameIndex = -1;
        this.timelineElement = document.getElementById('timeline');
        this.previewCanvas = document.getElementById('preview-canvas');
        this.previewCtx = this.previewCanvas.getContext('2d');
        this.animationInterval = null;
        this.fps = 12;

        // Overlay elements
        this.overlay = document.getElementById('animation-overlay');
        this.overlayCanvas = document.getElementById('overlay-canvas');
        this.overlayCtx = this.overlayCanvas.getContext('2d');

        this.initEvents();
        this.addFrame(); // Start with one frame
    }

    initEvents() {
        document.getElementById('new-frame').addEventListener('click', () => this.addFrame());
        document.getElementById('duplicate-frame').addEventListener('click', () => this.duplicateFrame());
        document.getElementById('delete-frame').addEventListener('click', () => this.deleteFrame());
        document.getElementById('play').addEventListener('click', () => this.playAnimation());
        document.getElementById('stop').addEventListener('click', () => this.stopAnimation());
        document.getElementById('fps').addEventListener('change', (e) => {
            this.fps = parseInt(e.target.value);
            // Update animation if it's playing
            if (this.animationInterval) {
                this.stopAnimation();
                this.playAnimation();
            }
        });

        // Close overlay button
        document.getElementById('close-overlay').addEventListener('click', () => {
            this.overlay.classList.remove('visible');
            this.stopAnimation();
        });

        // Handle window resize for responsive overlay canvas
        window.addEventListener('resize', () => {
            if (this.overlay.classList.contains('visible')) {
                this.resizeOverlayCanvas();
            }
        });
    }

    resizeOverlayCanvas() {
        if (!this.frames.length) return;
        
        // Calculate the best size to maintain aspect ratio
        const sourceWidth = this.frames[0].canvas.width;
        const sourceHeight = this.frames[0].canvas.height;
        const aspectRatio = sourceWidth / sourceHeight;
        
        let targetWidth = window.innerWidth * 0.8;
        let targetHeight = targetWidth / aspectRatio;
        
        if (targetHeight > window.innerHeight * 0.8) {
            targetHeight = window.innerHeight * 0.8;
            targetWidth = targetHeight * aspectRatio;
        }
        
        this.overlayCanvas.width = targetWidth;
        this.overlayCanvas.height = targetHeight;
    }

    addFrame() {
        const canvas = document.createElement('canvas');
        canvas.width = window.canvas.canvas.width;
        canvas.height = window.canvas.canvas.height;
        const ctx = canvas.getContext('2d');
        
        // Create a blank frame
        const frame = {
            canvas: canvas,
            ctx: ctx,
            thumbnail: document.createElement('canvas')
        };

        // Add frame to array
        this.frames.push(frame);
        this.createFrameElement(this.frames.length - 1);
        this.selectFrame(this.frames.length - 1);
    }

    createFrameElement(index) {
        const frame = document.createElement('div');
        frame.className = 'frame';
        frame.dataset.index = index;
        
        // Create thumbnail
        const thumbnail = document.createElement('canvas');
        thumbnail.width = 80;
        thumbnail.height = 80;
        this.frames[index].thumbnail = thumbnail;
        
        frame.appendChild(thumbnail);
        frame.addEventListener('click', () => this.selectFrame(index));
        
        this.timelineElement.appendChild(frame);
        this.updateThumbnail(index);
    }

    selectFrame(index) {
        if (index < 0 || index >= this.frames.length) return;
        
        // Deselect current frame in UI
        const activeFrame = document.querySelector('.frame.active');
        if (activeFrame) {
            activeFrame.classList.remove('active');
        }
        
        // Update current frame index
        this.currentFrameIndex = index;
        
        // Select new frame in UI
        document.querySelectorAll('.frame')[index].classList.add('active');
        
        // Display the frame content on the main canvas
        window.canvas.clear();
        window.canvas.ctx.drawImage(this.frames[index].canvas, 0, 0);
        
        // Also update the preview
        this.previewCtx.clearRect(0, 0, this.previewCanvas.width, this.previewCanvas.height);
        this.previewCtx.drawImage(
            this.frames[index].canvas,
            0, 0, this.frames[index].canvas.width, this.frames[index].canvas.height,
            0, 0, this.previewCanvas.width, this.previewCanvas.height
        );
    }

    updateCurrentFrame() {
        if (this.currentFrameIndex === -1) return;
        
        // Copy main canvas to current frame
        const frame = this.frames[this.currentFrameIndex];
        frame.ctx.clearRect(0, 0, frame.canvas.width, frame.canvas.height);
        frame.ctx.drawImage(window.canvas.canvas, 0, 0);
        
        this.updateThumbnail(this.currentFrameIndex);
    }

    updateThumbnail(index) {
        const frame = this.frames[index];
        const thumbCtx = frame.thumbnail.getContext('2d');
        
        // Clear and draw scaled version
        thumbCtx.clearRect(0, 0, frame.thumbnail.width, frame.thumbnail.height);
        thumbCtx.drawImage(
            frame.canvas, 
            0, 0, frame.canvas.width, frame.canvas.height,
            0, 0, frame.thumbnail.width, frame.thumbnail.height
        );
        
        // Update the actual thumbnail in the DOM
        const frameElement = document.querySelectorAll('.frame')[index];
        if (frameElement) {
            // Remove old thumbnail
            while (frameElement.firstChild) {
                frameElement.removeChild(frameElement.firstChild);
            }
            // Add new thumbnail
            frameElement.appendChild(frame.thumbnail);
        }
    }

    duplicateFrame() {
        if (this.currentFrameIndex === -1) return;
        
        const newCanvas = document.createElement('canvas');
        newCanvas.width = window.canvas.canvas.width;
        newCanvas.height = window.canvas.canvas.height;
        const newCtx = newCanvas.getContext('2d');
        
        // Copy current frame to new frame
        newCtx.drawImage(this.frames[this.currentFrameIndex].canvas, 0, 0);
        
        // Add new frame
        const frame = {
            canvas: newCanvas,
            ctx: newCtx,
            thumbnail: document.createElement('canvas')
        };
        
        this.frames.splice(this.currentFrameIndex + 1, 0, frame);
        
        // Rebuild timeline UI
        this.rebuildTimelineUI();
        this.selectFrame(this.currentFrameIndex + 1);
    }

    deleteFrame() {
        if (this.currentFrameIndex === -1 || this.frames.length <= 1) return;
        
        // Remove frame
        this.frames.splice(this.currentFrameIndex, 1);
        
        // Rebuild timeline UI
        this.rebuildTimelineUI();
        
        // Select appropriate frame
        if (this.currentFrameIndex >= this.frames.length) {
            this.selectFrame(this.frames.length - 1);
        } else {
            this.selectFrame(this.currentFrameIndex);
        }
    }

    rebuildTimelineUI() {
        // Clear timeline
        while (this.timelineElement.firstChild) {
            this.timelineElement.removeChild(this.timelineElement.firstChild);
        }
        
        // Add frames back
        for (let i = 0; i < this.frames.length; i++) {
            this.createFrameElement(i);
        }
    }

    playAnimation() {
        this.stopAnimation();
        if (this.frames.length <= 1) {
            alert('You need at least 2 frames to play an animation!');
            return;
        }
        
        // Setup overlay canvas size to be as large as possible while maintaining aspect ratio
        this.resizeOverlayCanvas();
        
        // Ensure the overlay is visible and centered
        this.overlay.classList.add('visible');
        
        // Make sure the overlay canvas is visible and properly sized
        this.overlayCanvas.style.display = 'block';
        
        let frameIndex = 0;
        const frameDelay = 1000 / this.fps;
        
        // Use requestAnimationFrame for smoother animation
        let lastTime = 0;
        const animate = (timestamp) => {
            if (!this.animationInterval) return; // Stop animation if interval is cleared
            
            const elapsed = timestamp - lastTime;
            
            if (elapsed > frameDelay) {
                lastTime = timestamp - (elapsed % frameDelay); // Adjust for timing drift
                
                // Draw to both overlay and preview canvases
                this.overlayCtx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);
                this.overlayCtx.drawImage(
                    this.frames[frameIndex].canvas,
                    0, 0, this.frames[frameIndex].canvas.width, this.frames[frameIndex].canvas.height,
                    0, 0, this.overlayCanvas.width, this.overlayCanvas.height
                );
                
                this.previewCtx.clearRect(0, 0, this.previewCanvas.width, this.previewCanvas.height);
                this.previewCtx.drawImage(
                    this.frames[frameIndex].canvas,
                    0, 0, this.frames[frameIndex].canvas.width, this.frames[frameIndex].canvas.height,
                    0, 0, this.previewCanvas.width, this.previewCanvas.height
                );
                
                frameIndex = (frameIndex + 1) % this.frames.length;
            }
            
            requestAnimationFrame(animate);
        };
        
        // Store the animation frame request ID for stopping later
        this.animationInterval = true;
        requestAnimationFrame(animate);
    }

    stopAnimation() {
        this.animationInterval = null;
    }

    getAllFrames() {
        return this.frames;
    }
}

window.timeline = new Timeline();
