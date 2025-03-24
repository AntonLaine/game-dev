class Exporter {
    constructor() {
        // Only keep reference to the export-video button that exists
        const exportVideoButton = document.getElementById('export-video');
        if (exportVideoButton) {
            exportVideoButton.addEventListener('click', () => this.exportVideo());
        }
        
        this.recorder = null;
        this.chunks = [];
        this.recordingCanvas = document.createElement('canvas');
        this.recordingCtx = this.recordingCanvas.getContext('2d');
    }

    isEdgeBrowser() {
        // Check if the browser is Edge
        return navigator.userAgent.indexOf("Edg") !== -1;
    }

    exportVideo() {
        const frames = window.timeline.getAllFrames();
        if (frames.length <= 1) {
            alert('You need at least 2 frames to create a video!');
            return;
        }

        // Set up recording canvas with the same dimensions as the animation
        this.recordingCanvas.width = frames[0].canvas.width;
        this.recordingCanvas.height = frames[0].canvas.height;
        
        // Check if MediaRecorder is supported
        if (!window.MediaRecorder) {
            alert('Your browser does not support video recording. Please try Chrome or Firefox.');
            return;
        }
        
        // Edge-optimized MIME types - use a more conservative list for Edge
        const edgeMimeTypes = [
            'video/webm;codecs=vp8',    // Best compatibility for Edge
            'video/webm'                // Fallback
        ];
        
        // Standard MIME types for other browsers
        const standardMimeTypes = [
            'video/webm',
            'video/webm;codecs=vp8',
            'video/webm;codecs=vp9',
            'video/mp4'
        ];
        
        // Use the appropriate list based on browser
        const mimeTypes = this.isEdgeBrowser() ? edgeMimeTypes : standardMimeTypes;
        
        let mimeType = '';
        for (let type of mimeTypes) {
            try {
                if (MediaRecorder.isTypeSupported(type)) {
                    mimeType = type;
                    break;
                }
            } catch (e) {
                console.warn('Error checking MIME type support:', e);
                continue;
            }
        }
        
        if (!mimeType) {
            alert('Your browser does not support any of the video formats. Please try Chrome or Firefox.');
            return;
        }
        
        // Create progress UI
        const progressContainer = document.createElement('div');
        progressContainer.style.position = 'fixed';
        progressContainer.style.top = '0';
        progressContainer.style.left = '0';
        progressContainer.style.width = '100%';
        progressContainer.style.height = '100%';
        progressContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        progressContainer.style.display = 'flex';
        progressContainer.style.flexDirection = 'column';
        progressContainer.style.justifyContent = 'center';
        progressContainer.style.alignItems = 'center';
        progressContainer.style.zIndex = '2000';
        
        const progressBox = document.createElement('div');
        progressBox.style.backgroundColor = 'white';
        progressBox.style.padding = '30px';
        progressBox.style.borderRadius = '8px';
        progressBox.style.textAlign = 'center';
        progressBox.style.maxWidth = '400px';
        
        const progressTitle = document.createElement('h3');
        progressTitle.textContent = 'Creating Video';
        progressTitle.style.marginBottom = '15px';
        
        const progressText = document.createElement('div');
        progressText.textContent = 'Preparing frames...';
        progressText.style.marginBottom = '15px';
        
        const progressBar = document.createElement('div');
        progressBar.style.width = '100%';
        progressBar.style.height = '10px';
        progressBar.style.backgroundColor = '#eee';
        progressBar.style.borderRadius = '5px';
        progressBar.style.overflow = 'hidden';
        
        const progressFill = document.createElement('div');
        progressFill.style.width = '0%';
        progressFill.style.height = '100%';
        progressFill.style.backgroundColor = '#4CAF50';
        progressFill.style.transition = 'width 0.2s ease';
        
        progressBar.appendChild(progressFill);
        progressBox.appendChild(progressTitle);
        progressBox.appendChild(progressText);
        progressBox.appendChild(progressBar);
        progressContainer.appendChild(progressBox);
        document.body.appendChild(progressContainer);
        
        // Prepare frames for recording
        this.chunks = [];
        let preparedFrames = [];
        
        // Pre-render all frames
        for (let i = 0; i < frames.length; i++) {
            const offscreenCanvas = document.createElement('canvas');
            offscreenCanvas.width = frames[i].canvas.width;
            offscreenCanvas.height = frames[i].canvas.height;
            const offscreenCtx = offscreenCanvas.getContext('2d');
            offscreenCtx.drawImage(frames[i].canvas, 0, 0);
            preparedFrames.push(offscreenCanvas);
            
            // Update progress
            progressFill.style.width = `${Math.floor((i / frames.length) * 30)}%`;
        }
        
        progressText.textContent = 'Starting recording...';
        
        // Draw the first frame to the recording canvas
        this.recordingCtx.clearRect(0, 0, this.recordingCanvas.width, this.recordingCanvas.height);
        this.recordingCtx.drawImage(preparedFrames[0], 0, 0);
        
        try {
            // Edge-friendly approach
            setTimeout(() => {
                progressText.textContent = 'Recording frames...';
                
                // Extra-conservative settings for Edge
                let recorderOptions = {
                    mimeType: mimeType,
                    videoBitsPerSecond: this.isEdgeBrowser() ? 1000000 : 2500000 // Lower for Edge
                };
                
                // Different approach for Edge vs other browsers
                let stream;
                try {
                    // Try to get the stream - different approaches based on browser
                    if (this.isEdgeBrowser()) {
                        // For Edge, use the most basic captureStream() with fallbacks
                        try {
                            stream = this.recordingCanvas.captureStream(window.timeline.fps);
                        } catch (e) {
                            // If that fails, try with no parameters
                            console.warn('Edge-specific captureStream fallback', e);
                            stream = this.recordingCanvas.captureStream();
                        }
                    } else {
                        // For other browsers, use the recommended approach
                        stream = this.recordingCanvas.captureStream(0);
                    }
                } catch (e) {
                    console.error('Error capturing canvas stream:', e);
                    document.body.removeChild(progressContainer);
                    alert('Your browser does not support canvas streaming. Please try Chrome or Firefox.');
                    return;
                }
                
                // Create recorder with appropriate settings
                try {
                    this.recorder = new MediaRecorder(stream, recorderOptions);
                } catch (e) {
                    console.error('Error creating MediaRecorder:', e);
                    // Try without options as a fallback
                    try {
                        this.recorder = new MediaRecorder(stream);
                    } catch (e2) {
                        document.body.removeChild(progressContainer);
                        alert('Failed to create video recorder. Please try Chrome or Firefox.');
                        return;
                    }
                }
                
                this.recorder.ondataavailable = (e) => {
                    if (e.data && e.data.size > 0) {
                        this.chunks.push(e.data);
                    }
                };
                
                this.recorder.onerror = (err) => {
                    console.error('MediaRecorder error:', err);
                    progressText.textContent = 'Error during recording: ' + err.message;
                };
                
                this.recorder.onstop = () => {
                    progressText.textContent = 'Finalizing video...';
                    progressFill.style.width = '100%';
                    
                    // Check if we have data
                    if (this.chunks.length === 0) {
                        document.body.removeChild(progressContainer);
                        alert('Failed to create video: No data was recorded. Please try Chrome or Firefox.');
                        return;
                    }
                    
                    // Create video file - use webm for all browsers (even Edge should support it)
                    const blob = new Blob(this.chunks, { type: mimeType });
                    
                    // Check if blob is valid
                    if (blob.size === 0) {
                        document.body.removeChild(progressContainer);
                        alert('Generated video file is empty. Please try Chrome or Firefox.');
                        return;
                    }
                    
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `animation.webm`;
                    
                    setTimeout(() => {
                        document.body.removeChild(progressContainer);
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                    }, 500);
                };
                
                // For Edge, get chunks more frequently
                const dataRequestInterval = this.isEdgeBrowser() ? 50 : 100;
                this.recorder.start(dataRequestInterval);
                
                // Adjust frame delay based on browser
                const frameDelay = 1000 / window.timeline.fps;
                // Edge needs a bit more time between frames
                const edgeDelayMultiplier = this.isEdgeBrowser() ? 2 : 1;
                
                // Frame rendering function - optimized for each browser
                let frameIndex = 0;
                
                // Edge-optimized rendering approach
                if (this.isEdgeBrowser()) {
                    const renderNextFrame = () => {
                        if (frameIndex >= preparedFrames.length) {
                            // Stop recording after a delay to ensure last frame is captured
                            setTimeout(() => {
                                try {
                                    this.recorder.stop();
                                } catch (e) {
                                    console.error('Error stopping recorder:', e);
                                    document.body.removeChild(progressContainer);
                                    alert('Error finalizing video.');
                                }
                            }, frameDelay * 5);
                            return;
                        }
                        
                        // Draw the current frame
                        this.recordingCtx.clearRect(0, 0, this.recordingCanvas.width, this.recordingCanvas.height);
                        this.recordingCtx.drawImage(preparedFrames[frameIndex], 0, 0);
                        
                        // Update progress
                        const progress = 30 + Math.floor((frameIndex / preparedFrames.length) * 70);
                        progressFill.style.width = `${progress}%`;
                        progressText.textContent = `Recording frames: ${frameIndex + 1} of ${preparedFrames.length}`;
                        
                        frameIndex++;
                        
                        // Give Edge more time to process each frame
                        setTimeout(renderNextFrame, frameDelay * edgeDelayMultiplier);
                    };
                    
                    renderNextFrame();
                } else {
                    // Standard batch approach for other browsers
                    const renderAllFrames = () => {
                        const renderNextBatch = () => {
                            // Process fewer frames per batch for Edge
                            const batchSize = 5;
                            const startIdx = frameIndex;
                            const endIdx = Math.min(frameIndex + batchSize, preparedFrames.length);
                            
                            // Draw each frame in this batch
                            for (let i = startIdx; i < endIdx; i++) {
                                this.recordingCtx.clearRect(0, 0, this.recordingCanvas.width, this.recordingCanvas.height);
                                this.recordingCtx.drawImage(preparedFrames[i], 0, 0);
                                
                                // Update progress
                                const progress = 30 + Math.floor((i / preparedFrames.length) * 70);
                                progressFill.style.width = `${progress}%`;
                                progressText.textContent = `Recording frames: ${i + 1} of ${preparedFrames.length}`;
                                
                                // Force the browser to update the canvas
                                this.recordingCanvas.dispatchEvent(new Event('framedrawn'));
                            }
                            
                            frameIndex = endIdx;
                            
                            // Continue with next batch or finish
                            if (frameIndex < preparedFrames.length) {
                                setTimeout(renderNextBatch, frameDelay * batchSize);
                            } else {
                                // Allow time for the final frames to be captured
                                setTimeout(() => {
                                    try {
                                        this.recorder.stop();
                                    } catch (e) {
                                        console.error('Error stopping recorder:', e);
                                        document.body.removeChild(progressContainer);
                                        alert('Error finalizing video.');
                                    }
                                }, frameDelay * 10);
                            }
                        };
                        
                        renderNextBatch();
                    };
                    
                    renderAllFrames();
                }
                
            }, this.isEdgeBrowser() ? 1000 : 500); // Give Edge more time to initialize
            
        } catch (error) {
            document.body.removeChild(progressContainer);
            console.error('Video export error:', error);
            alert(`Error creating video: ${error.message}. Please try Chrome or Firefox.`);
        }
    }
}

window.exporter = new Exporter();
