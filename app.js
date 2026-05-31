const { ipcRenderer } = require('electron')

const PRESET_COLORS = [
  '#000000', '#ffffff', '#ff0000', '#00ff00',
  '#0000ff', '#ffff00', '#ff00ff', '#00ffff',
  '#ff8800', '#88ff00', '#0088ff', '#ff0088',
  '#8800ff', '#00ff88', '#ff4444', '#44ff44',
  '#4444ff', '#ffff44', '#ff44ff', '#44ffff',
  '#888888', '#cccccc', '#666666', '#aaaaaa'
]

const TOOLS = [
  {
    id: 'pencil',
    title: '画笔',
    svg: 'M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z'
  },
  {
    id: 'eraser',
    title: '橡皮擦',
    svg: 'M16.24 3.56l4.95 4.94c.78.79.78 2.05 0 2.84L12 20.53a4.008 4.008 0 0 1-5.66 0L2.81 17c-.78-.79-.78-2.05 0-2.84l10.6-10.6c.79-.78 2.05-.78 2.83 0zm-1.41 1.42L6.93 12.88l4.24 4.24 7.9-7.9-4.24-4.24z'
  },
  {
    id: 'fill',
    title: '填充',
    svg: 'M16.56 8.94L7.62 0 6.21 1.41l2.38 2.38-5.15 5.15c-.59.59-.59 1.54 0 2.12l5.5 5.5c.29.29.68.44 1.06.44s.77-.15 1.06-.44l5.5-5.5c.59-.58.59-1.53 0-2.12zM5.21 10L10 5.21 14.79 10H5.21zM19 11.5s-2 2.17-2 3.5c0 1.1.9 2 2 2s2-.9 2-2c0-1.33-2-3.5-2-3.5z'
  },
  {
    id: 'picker',
    title: '取色器',
    svg: 'M20.71 5.63l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-3.12 3.12-1.93-1.91-1.41 1.41 1.42 1.42L3 16.25V21h4.75l8.92-8.92 1.42 1.42 1.41-1.41-1.92-1.92 3.12-3.12c.4-.4.4-1.03.01-1.42zM6.92 19L5 17.08l8.06-8.06 1.92 1.92L6.92 19z'
  }
]

const ZOOM_PERCENTS = [25, 50, 75, 100, 150, 200, 300, 400]

const createEmptyPixelData = (w, h) => {
  const data = []
  for (let y = 0; y < h; y++) {
    data[y] = new Array(w).fill('#ffffff')
  }
  return data
}

const app = Vue.createApp({
  data() {
    return {
      currentColor: '#000000',
      currentTool: 'pencil',
      isDrawing: false,
      canvasWidth: 16,
      canvasHeight: 16,
      zoomPercent: 100,
      pixelData: [],
      presetColors: PRESET_COLORS,
      tools: TOOLS,
      zoomPercents: ZOOM_PERCENTS,
      mousePosX: -1,
      mousePosY: -1,
      zoomIndicatorVisible: false,
      zoomIndicatorTimeout: null,
      _resizeObserver: null
    }
  },

  computed: {
    canvasSizeInfo() {
      return `${this.canvasWidth}×${this.canvasHeight}`
    },

    zoomInfo() {
      return `${this.zoomPercent}%`
    },

    mousePosText() {
      if (this.mousePosX < 0 || this.mousePosY < 0) return '-'
      return `${this.mousePosX}, ${this.mousePosY}`
    },

    zoomIndicatorText() {
      return `缩放: ${this.zoomPercent}% | 画布: ${this.canvasWidth}×${this.canvasHeight}`
    },

    currentColorUpper() {
      return this.currentColor.toUpperCase()
    },

    actualZoom() {
      return Math.max(1, Math.round(this.calcFitZoom() * this.zoomPercent / 100))
    }
  },

  mounted() {
    this.pixelData = createEmptyPixelData(this.canvasWidth, this.canvasHeight)
    this.$nextTick(() => {
      this.setupCanvas()
      this.observeResize()
    })
  },

  beforeUnmount() {
    if (this._resizeObserver) {
      this._resizeObserver.disconnect()
    }
  },

  methods: {
    calcFitZoom() {
      const area = this.$refs.canvasArea
      if (!area) return 1
      const availW = area.clientWidth - 80
      const availH = area.clientHeight - 80
      const fitW = Math.floor(availW / this.canvasWidth)
      const fitH = Math.floor(availH / this.canvasHeight)
      return Math.max(1, Math.min(fitW, fitH))
    },

    observeResize() {
      const area = this.$refs.canvasArea
      if (!area) return
      this._resizeObserver = new ResizeObserver(() => {
        this.resizeCanvas()
      })
      this._resizeObserver.observe(area)
    },

    resizeCanvas() {
      const canvas = this.$refs.pixelCanvas
      if (!canvas) return
      const z = this.actualZoom
      canvas.width = this.canvasWidth * z
      canvas.height = this.canvasHeight * z
      canvas.style.width = canvas.width + 'px'
      canvas.style.height = canvas.height + 'px'
      const ctx = canvas.getContext('2d')
      ctx.imageSmoothingEnabled = false
      this.doRender(ctx, canvas)
    },

    setupCanvas() {
      const canvas = this.$refs.pixelCanvas
      if (!canvas) return
      const z = this.actualZoom
      canvas.width = this.canvasWidth * z
      canvas.height = this.canvasHeight * z
      canvas.style.width = canvas.width + 'px'
      canvas.style.height = canvas.height + 'px'
      const ctx = canvas.getContext('2d')
      ctx.imageSmoothingEnabled = false
      this.doRender(ctx, canvas)
    },

    doRender(ctx, canvas) {
      const z = this.actualZoom
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      for (let y = 0; y < this.canvasHeight; y++) {
        for (let x = 0; x < this.canvasWidth; x++) {
          ctx.fillStyle = this.pixelData[y][x]
          ctx.fillRect(x * z, y * z, z, z)
        }
      }

      ctx.strokeStyle = '#e0e0e0'
      ctx.lineWidth = 1
      for (let x = 0; x <= this.canvasWidth; x++) {
        ctx.beginPath()
        ctx.moveTo(x * z + 0.5, 0)
        ctx.lineTo(x * z + 0.5, canvas.height)
        ctx.stroke()
      }
      for (let y = 0; y <= this.canvasHeight; y++) {
        ctx.beginPath()
        ctx.moveTo(0, y * z + 0.5)
        ctx.lineTo(canvas.width, y * z + 0.5)
        ctx.stroke()
      }
    },

    renderCanvas() {
      const canvas = this.$refs.pixelCanvas
      if (!canvas) return
      this.doRender(canvas.getContext('2d'), canvas)
    },

    selectTool(toolId) {
      this.currentTool = toolId
    },

    selectColor(color) {
      this.currentColor = color
    },

    applySettings() {
      this.canvasWidth = Math.max(8, Math.min(256, this.canvasWidth))
      this.canvasHeight = Math.max(8, Math.min(256, this.canvasHeight))

      const oldData = this.pixelData
      const newData = []
      for (let y = 0; y < this.canvasHeight; y++) {
        newData[y] = []
        for (let x = 0; x < this.canvasWidth; x++) {
          newData[y][x] = (oldData[y] && oldData[y][x] !== undefined) ? oldData[y][x] : '#ffffff'
        }
      }
      this.pixelData = newData

      this.$nextTick(() => {
        this.resizeCanvas()
        this.showZoomIndicator()
      })
    },

    clearCanvas() {
      for (let y = 0; y < this.canvasHeight; y++) {
        for (let x = 0; x < this.canvasWidth; x++) {
          this.pixelData[y][x] = '#ffffff'
        }
      }
      this.renderCanvas()
    },

    getPixelPosition(e) {
      const canvas = this.$refs.pixelCanvas
      if (!canvas) return { x: -1, y: -1 }
      const rect = canvas.getBoundingClientRect()
      const scaleX = canvas.width / rect.width
      const scaleY = canvas.height / rect.height
      const z = this.actualZoom
      const x = Math.floor((e.clientX - rect.left) * scaleX / z)
      const y = Math.floor((e.clientY - rect.top) * scaleY / z)
      return { x, y }
    },

    onCanvasMouseDown(e) {
      this.isDrawing = true
      const pos = this.getPixelPosition(e)
      if (pos.x >= 0 && pos.x < this.canvasWidth && pos.y >= 0 && pos.y < this.canvasHeight) {
        if (this.currentTool === 'picker') {
          this.selectColor(this.pixelData[pos.y][pos.x])
        } else if (this.currentTool === 'fill') {
          this.floodFill(pos.x, pos.y)
        } else {
          this.drawPixel(pos.x, pos.y)
        }
      }
    },

    onCanvasMouseMove(e) {
      const pos = this.getPixelPosition(e)
      this.mousePosX = pos.x
      this.mousePosY = pos.y

      if (!this.isDrawing) return
      if (pos.x >= 0 && pos.x < this.canvasWidth && pos.y >= 0 && pos.y < this.canvasHeight) {
        if (this.currentTool === 'pencil') {
          this.drawPixel(pos.x, pos.y)
        } else if (this.currentTool === 'eraser') {
          this.erasePixel(pos.x, pos.y)
        }
      }
    },

    onCanvasMouseUp() {
      this.isDrawing = false
    },

    drawPixel(x, y) {
      if (this.pixelData[y][x] !== this.currentColor) {
        this.pixelData[y][x] = this.currentColor
        this.renderCanvas()
      }
    },

    erasePixel(x, y) {
      if (this.pixelData[y][x] !== '#ffffff') {
        this.pixelData[y][x] = '#ffffff'
        this.renderCanvas()
      }
    },

    floodFill(startX, startY) {
      const targetColor = this.pixelData[startY][startX]
      const fillColor = this.currentColor
      if (targetColor === fillColor) return

      const stack = [[startX, startY]]
      const visited = new Set()

      while (stack.length > 0) {
        const [x, y] = stack.pop()
        const key = `${x},${y}`
        if (visited.has(key)) continue
        if (x < 0 || x >= this.canvasWidth || y < 0 || y >= this.canvasHeight) continue
        if (this.pixelData[y][x] !== targetColor) continue

        visited.add(key)
        this.pixelData[y][x] = fillColor
        stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1])
      }

      this.renderCanvas()
    },

    showZoomIndicator() {
      this.zoomIndicatorVisible = true
      clearTimeout(this.zoomIndicatorTimeout)
      this.zoomIndicatorTimeout = setTimeout(() => {
        this.zoomIndicatorVisible = false
      }, 2000)
    },

    minimizeWindow() {
      ipcRenderer.send('window-minimize')
    },

    maximizeWindow() {
      ipcRenderer.send('window-maximize')
    },

    closeWindow() {
      ipcRenderer.send('window-close')
    }
  }
})

app.mount('#app')
