
class PixelEditor {
  constructor() {
    this.canvas = document.getElementById('pixelCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.currentColor = '#000000';
    this.currentTool = 'pencil';
    this.isDrawing = false;
    this.canvasWidth = 32;
    this.canvasHeight = 32;
    this.zoomLevel = 8;
    this.pixelData = [];

    this.initPresetColors();
    this.bindEvents();
    this.applySettings();
    this.updateCanvasInfo();
  }

  initPresetColors() {
    const colors = [
      '#000000', '#ffffff', '#ff0000', '#00ff00',
      '#0000ff', '#ffff00', '#ff00ff', '#00ffff',
      '#ff8800', '#88ff00', '#0088ff', '#ff0088',
      '#8800ff', '#00ff88', '#ff4444', '#44ff44',
      '#4444ff', '#ffff44', '#ff44ff', '#44ffff',
      '#888888', '#444444', '#cccccc', '#222222'
    ];

    const colorGrid = document.getElementById('colorGrid');
    colors.forEach(color => {
      const swatch = document.createElement('div');
      swatch.className = 'color-swatch';
      swatch.style.backgroundColor = color;
      swatch.dataset.color = color;
      colorGrid.appendChild(swatch);
    });
  }

  bindEvents() {
    const toolBtns = document.querySelectorAll('.tool-btn');
    toolBtns.forEach(btn => {
      btn.addEventListener('click', () => this.selectTool(btn.dataset.tool));
    });

    const colorSwatches = document.getElementById('colorGrid');
    colorSwatches.addEventListener('click', (e) => {
      if (e.target.classList.contains('color-swatch')) {
        this.selectColor(e.target.dataset.color);
      }
    });

    document.getElementById('colorPicker').addEventListener('input', (e) => {
      this.selectColor(e.target.value);
    });

    document.getElementById('applySettings').addEventListener('click', () => {
      this.applySettings();
    });

    document.getElementById('clearCanvas').addEventListener('click', () => {
      this.clearCanvas();
    });

    this.canvas.addEventListener('mousedown', (e) => this.startDrawing(e));
    this.canvas.addEventListener('mousemove', (e) => this.draw(e));
    this.canvas.addEventListener('mouseup', () => this.stopDrawing());
    this.canvas.addEventListener('mouseleave', () => this.stopDrawing());
  }

  selectTool(tool) {
    this.currentTool = tool;
    document.querySelectorAll('.tool-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tool === tool);
    });
  }

  selectColor(color) {
    this.currentColor = color;
    document.getElementById('currentColorPreview').style.backgroundColor = color;
    document.getElementById('currentColorHex').textContent = color.toUpperCase();
    document.getElementById('colorPicker').value = color;

    document.querySelectorAll('.color-swatch').forEach(swatch => {
      swatch.classList.toggle('active', swatch.dataset.color === color);
    });
  }

  applySettings() {
    const widthInput = document.getElementById('canvasWidth');
    const heightInput = document.getElementById('canvasHeight');
    const zoomSelect = document.getElementById('zoomLevel');

    let newWidth = parseInt(widthInput.value) || 32;
    let newHeight = parseInt(heightInput.value) || 32;
    let newZoom = parseInt(zoomSelect.value) || 8;

    newWidth = Math.max(8, Math.min(128, newWidth));
    newHeight = Math.max(8, Math.min(128, newHeight));

    this.canvasWidth = newWidth;
    this.canvasHeight = newHeight;
    this.zoomLevel = newZoom;

    this.canvas.width = this.canvasWidth * this.zoomLevel;
    this.canvas.height = this.canvasHeight * this.zoomLevel;

    this.ctx.imageSmoothingEnabled = false;

    this.loadPixelData();
    this.render();

    this.updateCanvasInfo();
    this.showZoomIndicator();
  }

  loadPixelData() {
    if (this.pixelData.length !== this.canvasHeight || 
        (this.pixelData[0] && this.pixelData[0].length !== this.canvasWidth)) {
      const oldData = this.pixelData;
      this.pixelData = [];
      
      for (let y = 0; y < this.canvasHeight; y++) {
        this.pixelData[y] = [];
        for (let x = 0; x < this.canvasWidth; x++) {
          this.pixelData[y][x] = oldData[y] && oldData[y][x] ? oldData[y][x] : '#ffffff';
        }
      }
    }
  }

  render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    for (let y = 0; y < this.canvasHeight; y++) {
      for (let x = 0; x < this.canvasWidth; x++) {
        const color = this.pixelData[y][x];
        this.ctx.fillStyle = color;
        this.ctx.fillRect(
          x * this.zoomLevel,
          y * this.zoomLevel,
          this.zoomLevel,
          this.zoomLevel
        );
      }
    }

    this.ctx.strokeStyle = '#e0e0e0';
    this.ctx.lineWidth = 1;

    for (let x = 0; x <= this.canvasWidth; x++) {
      this.ctx.beginPath();
      this.ctx.moveTo(x * this.zoomLevel + 0.5, 0);
      this.ctx.lineTo(x * this.zoomLevel + 0.5, this.canvas.height);
      this.ctx.stroke();
    }

    for (let y = 0; y <= this.canvasHeight; y++) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y * this.zoomLevel + 0.5);
      this.ctx.lineTo(this.canvas.width, y * this.zoomLevel + 0.5);
      this.ctx.stroke();
    }
  }

  getPixelPosition(e) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    
    const x = Math.floor((e.clientX - rect.left) * scaleX / this.zoomLevel);
    const y = Math.floor((e.clientY - rect.top) * scaleY / this.zoomLevel);
    
    return { x, y };
  }

  startDrawing(e) {
    this.isDrawing = true;
    const pos = this.getPixelPosition(e);
    
    if (pos.x >= 0 && pos.x < this.canvasWidth && 
        pos.y >= 0 && pos.y < this.canvasHeight) {
      
      if (this.currentTool === 'picker') {
        this.pickColor(pos.x, pos.y);
      } else if (this.currentTool === 'fill') {
        this.floodFill(pos.x, pos.y);
      } else {
        this.drawPixel(pos.x, pos.y);
      }
    }
  }

  draw(e) {
    const pos = this.getPixelPosition(e);
    
    document.getElementById('mousePosInfo').textContent = 
      `${pos.x}, ${pos.y}`;

    if (!this.isDrawing) return;

    if (pos.x >= 0 && pos.x < this.canvasWidth && 
        pos.y >= 0 && pos.y < this.canvasHeight) {
      
      if (this.currentTool === 'pencil') {
        this.drawPixel(pos.x, pos.y);
      } else if (this.currentTool === 'eraser') {
        this.erasePixel(pos.x, pos.y);
      }
    }
  }

  stopDrawing() {
    this.isDrawing = false;
  }

  drawPixel(x, y) {
    if (this.pixelData[y][x] !== this.currentColor) {
      this.pixelData[y][x] = this.currentColor;
      this.render();
    }
  }

  erasePixel(x, y) {
    if (this.pixelData[y][x] !== '#ffffff') {
      this.pixelData[y][x] = '#ffffff';
      this.render();
    }
  }

  pickColor(x, y) {
    const color = this.pixelData[y][x];
    this.selectColor(color);
  }

  floodFill(startX, startY) {
    const targetColor = this.pixelData[startY][startX];
    const fillColor = this.currentColor;

    if (targetColor === fillColor) return;

    const stack = [[startX, startY]];
    const visited = new Set();

    while (stack.length > 0) {
      const [x, y] = stack.pop();
      const key = `${x},${y}`;

      if (visited.has(key)) continue;
      if (x < 0 || x >= this.canvasWidth || y < 0 || y >= this.canvasHeight) continue;
      if (this.pixelData[y][x] !== targetColor) continue;

      visited.add(key);
      this.pixelData[y][x] = fillColor;

      stack.push([x + 1, y]);
      stack.push([x - 1, y]);
      stack.push([x, y + 1]);
      stack.push([x, y - 1]);
    }

    this.render();
  }

  clearCanvas() {
    for (let y = 0; y < this.canvasHeight; y++) {
      for (let x = 0; x < this.canvasWidth; x++) {
        this.pixelData[y][x] = '#ffffff';
      }
    }
    this.render();
  }

  updateCanvasInfo() {
    document.getElementById('canvasSizeInfo').textContent = 
      `${this.canvasWidth}×${this.canvasHeight}`;
    document.getElementById('zoomInfo').textContent = `${this.zoomLevel}x`;
  }

  showZoomIndicator() {
    const indicator = document.getElementById('zoomIndicator');
    indicator.textContent = `缩放: ${this.zoomLevel}x | 画布: ${this.canvasWidth}×${this.canvasHeight}`;
    indicator.classList.add('show');
    
    setTimeout(() => {
      indicator.classList.remove('show');
    }, 2000);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new PixelEditor();
});