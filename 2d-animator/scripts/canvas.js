class Canvas {
    constructor() {
        this.canvas = document.getElementById('animation-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.currentTool = 'brush';
        this.color = '#000000';
        this.brushSize = 5;
        this.isDrawing = false;
        this.brushPreview = document.getElementById('brush-preview');
        this.initEvents();
        this.updateBrushPreview();
    }

    initEvents() {
        this.canvas.addEventListener('mousedown', this.startDrawing.bind(this));
        this.canvas.addEventListener('mousemove', this.draw.bind(this));
        this.canvas.addEventListener('mouseup', this.stopDrawing.bind(this));
        this.canvas.addEventListener('mouseout', this.stopDrawing.bind(this));

        // Tool selection
        document.querySelectorAll('.tool').forEach(tool => {
            tool.addEventListener('click', (e) => {
                document.querySelectorAll('.tool').forEach(t => t.classList.remove('active'));
                e.currentTarget.classList.add('active');
                this.currentTool = e.currentTarget.dataset.tool;
                this.updateBrushPreview();
            });
        });

        // Set brush as default active tool
        document.querySelector('[data-tool="brush"]').classList.add('active');

        // Color picker
        document.getElementById('color-picker').addEventListener('input', (e) => {
            this.color = e.target.value;
            this.updateBrushPreview();
        });

        // Brush size
        document.getElementById('brush-size').addEventListener('input', (e) => {
            this.brushSize = e.target.value;
            this.updateBrushPreview();
        });
    }

    updateBrushPreview() {
        // Update the brush preview size and color
        if (this.currentTool === 'brush') {
            this.brushPreview.style.width = `${this.brushSize}px`;
            this.brushPreview.style.height = `${this.brushSize}px`;
            this.brushPreview.style.backgroundColor = this.color;
            this.brushPreview.style.display = 'block';
        } else if (this.currentTool === 'eraser') {
            this.brushPreview.style.width = `${this.brushSize}px`;
            this.brushPreview.style.height = `${this.brushSize}px`;
            this.brushPreview.style.backgroundColor = '#ffffff';
            this.brushPreview.style.border = '1px solid #ccc';
            this.brushPreview.style.display = 'block';
        } else {
            this.brushPreview.style.display = 'none';
        }
    }

    startDrawing(e) {
        this.isDrawing = true;
        this.draw(e);
    }

    draw(e) {
        if (!this.isDrawing) return;

        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        this.ctx.lineWidth = this.brushSize;
        this.ctx.lineCap = 'round';
        
        if (this.currentTool === 'brush') {
            this.ctx.strokeStyle = this.color;
            this.ctx.globalCompositeOperation = 'source-over';
        } else if (this.currentTool === 'eraser') {
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.globalCompositeOperation = 'destination-out';
        }

        this.ctx.lineTo(x, y);
        this.ctx.stroke();
        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
    }

    stopDrawing() {
        this.isDrawing = false;
        this.ctx.beginPath();
        
        if (window.timeline) {
            window.timeline.updateCurrentFrame();
        }
    }

    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    fillBucket(x, y, fillColor) {
        // Basic fill tool - to be implemented
        // This would require a more complex flood fill algorithm
        this.ctx.fillStyle = fillColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    getImageData() {
        return this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    }

    setImageData(imageData) {
        this.ctx.putImageData(imageData, 0, 0);
    }
}

window.canvas = new Canvas();
