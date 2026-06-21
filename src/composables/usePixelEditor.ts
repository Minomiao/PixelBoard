import { ref, computed, watch, onBeforeUnmount, nextTick, type Ref, type ComputedRef } from 'vue'

interface PixelFileData {
  version: number
  width: number
  height: number
  pixels: (string | null)[][]
}

interface Tool {
  id: string
  title: string
  svg: string
}

type PixelRow = (string | null)[]
type PixelGrid = PixelRow[]

interface PixelPos {
  x: number
  y: number
}

const PRESET_COLORS = [
  '#ffcccc', '#ff6666', '#cc0000', '#660000',
  '#ffddbb', '#ff9933', '#cc6600', '#663300',
  '#ffffcc', '#ffff44', '#cccc00', '#666600',
  '#ddffbb', '#88ff44', '#66cc00', '#336600',
  '#bbffbb', '#44ff44', '#00cc00', '#003300',
  '#bbffdd', '#44ff88', '#00cc66', '#006633',
  '#ccffff', '#44ffff', '#00cccc', '#006666',
  '#ccccff', '#4444ff', '#0000cc', '#000066',
  '#ddbbff', '#8844ff', '#6600cc', '#330066',
  '#ffccff', '#ff44ff', '#cc00cc', '#660066',
  '#ffbbdd', '#ff4488', '#cc0066', '#660033',
  '#e8d5b7', '#cd853f', '#8b4513', '#4a2509',
  '#faf0e6', '#deb887', '#a0522d', '#5c3317',
  '#ffffff', '#cccccc', '#888888', '#555555',
  '#444444', '#333333', '#222222', '#000000'
]

const FREQUENT_COLORS = [
  '#ffffff', '#b0b0b0', '#888888', '#555555', '#000000',
  '#ff5555', '#ffaa00', '#ffff55', '#55ff55',
  '#55ffff', '#5555ff', '#ff55ff',
  '#8b4513', '#daa520', '#2e8b57', '#87ceeb',
  '#f5deb3', '#deb887', '#d2691e', '#a0522d'
]

const TOOLS: Tool[] = [
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

function createEmptyPixelData(w: number, h: number): PixelGrid {
  const data: PixelGrid = []
  for (let y = 0; y < h; y++) {
    data[y] = new Array(w).fill(null)
  }
  return data
}

export function usePixelEditor() {
  const currentColor: Ref<string> = ref('#000000')
  const currentTool: Ref<string> = ref('pencil')
  const isDrawing: Ref<boolean> = ref(false)
  const canvasWidth: Ref<number> = ref(16)
  const canvasHeight: Ref<number> = ref(16)
  const zoomPercent: Ref<number> = ref(100)
  const pixelData: Ref<PixelGrid> = ref(createEmptyPixelData(16, 16))
  const mousePosX: Ref<number> = ref(-1)
  const mousePosY: Ref<number> = ref(-1)
  const zoomIndicatorVisible: Ref<boolean> = ref(false)

  const exportFormat: Ref<string> = ref('png')
  const exportBgColor: Ref<string> = ref('#ffffff')
  const exportScale: Ref<number> = ref(1)

  const backgroundImage: Ref<HTMLImageElement | null> = ref(null)
  const hasBackground: ComputedRef<boolean> = computed(() => backgroundImage.value !== null)

  const presetColors = PRESET_COLORS
  const frequentColors = FREQUENT_COLORS
  const recentColors: Ref<string[]> = ref([])
  const tools = TOOLS
  const zoomPercents = ZOOM_PERCENTS

  const canvasRef: Ref<HTMLCanvasElement | null> = ref(null)
  const canvasAreaRef: Ref<HTMLElement | null> = ref(null)
  let resizeObserver: ResizeObserver | null = null
  let zoomIndicatorTimer: ReturnType<typeof setTimeout> | null = null

  const canvasSizeInfo: ComputedRef<string> = computed(() => `${canvasWidth.value}×${canvasHeight.value}`)
  const zoomInfo: ComputedRef<string> = computed(() => `${zoomPercent.value}%`)
  const mousePosText: ComputedRef<string> = computed(() => {
    if (mousePosX.value < 0 || mousePosY.value < 0) return '-'
    return `${mousePosX.value}, ${mousePosY.value}`
  })
  const zoomIndicatorText: ComputedRef<string> = computed(() => `缩放: ${zoomPercent.value}% | 画布: ${canvasWidth.value}×${canvasHeight.value}`)
  const currentColorUpper: ComputedRef<string> = computed(() => currentColor.value.toUpperCase())

  function calcFitZoom(): number {
    const area = canvasAreaRef.value
    if (!area) return 1
    const availW = area.clientWidth - 80
    const availH = area.clientHeight - 80
    const fitW = Math.floor(availW / canvasWidth.value)
    const fitH = Math.floor(availH / canvasHeight.value)
    return Math.max(1, Math.min(fitW, fitH))
  }

  const actualZoom: ComputedRef<number> = computed(() => {
    return Math.max(1, Math.round(calcFitZoom() * zoomPercent.value / 100))
  })

  function loadBackgroundImage(file: File): void {
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        backgroundImage.value = img
        doRender()
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  }

  function clearBackground(): void {
    backgroundImage.value = null
    doRender()
  }

  function doRender(): void {
    const canvas = canvasRef.value
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const z = actualZoom.value

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    if (backgroundImage.value) {
      ctx.drawImage(backgroundImage.value, 0, 0, canvas.width, canvas.height)
    }

    for (let y = 0; y < canvasHeight.value; y++) {
      for (let x = 0; x < canvasWidth.value; x++) {
        if (backgroundImage.value) {
          ctx.fillStyle = (x + y) % 2 === 0 ? 'rgba(128,128,128,0.25)' : 'rgba(96,96,96,0.25)'
        } else {
          ctx.fillStyle = (x + y) % 2 === 0 ? '#ffffff' : '#d0d0d0'
        }
        ctx.fillRect(x * z, y * z, z, z)
      }
    }

    for (let y = 0; y < canvasHeight.value; y++) {
      for (let x = 0; x < canvasWidth.value; x++) {
        const color = pixelData.value[y][x]
        if (color === null) continue
        ctx.fillStyle = color
        ctx.fillRect(x * z, y * z, z, z)
      }
    }
  }

  function resizeCanvas(): void {
    const canvas = canvasRef.value
    if (!canvas) return
    const z = actualZoom.value
    canvas.width = canvasWidth.value * z
    canvas.height = canvasHeight.value * z
    canvas.style.width = canvas.width + 'px'
    canvas.style.height = canvas.height + 'px'
    const ctx = canvas.getContext('2d')!
    ctx.imageSmoothingEnabled = false
    doRender()
  }

  function setupCanvas(): void {
    const canvas = canvasRef.value
    if (!canvas) return
    const z = actualZoom.value
    canvas.width = canvasWidth.value * z
    canvas.height = canvasHeight.value * z
    canvas.style.width = canvas.width + 'px'
    canvas.style.height = canvas.height + 'px'
    const ctx = canvas.getContext('2d')!
    ctx.imageSmoothingEnabled = false
    doRender()
  }

  function observeResize(): void {
    const area = canvasAreaRef.value
    if (!area) return
    resizeObserver = new ResizeObserver(() => {
      resizeCanvas()
    })
    resizeObserver.observe(area)
  }

  function selectTool(toolId: string): void {
    currentTool.value = toolId
  }

  function selectColor(color: string): void {
    currentColor.value = color
  }

  watch(currentColor, (newVal) => {
    if (newVal) addRecentColor(newVal)
  })

  function addRecentColor(color: string): void {
    const arr = recentColors.value.filter(c => c !== color)
    arr.unshift(color)
    recentColors.value = arr.slice(0, 8)
  }

  function applySettings(): void {
    canvasWidth.value = Math.max(8, Math.min(256, Math.round(canvasWidth.value)))
    canvasHeight.value = Math.max(8, Math.min(256, Math.round(canvasHeight.value)))

    const oldData = pixelData.value
    const newData: PixelGrid = []
    for (let y = 0; y < canvasHeight.value; y++) {
      newData[y] = []
      for (let x = 0; x < canvasWidth.value; x++) {
        newData[y][x] = (oldData[y] && oldData[y][x] != null) ? oldData[y][x] : null
      }
    }
    pixelData.value = newData

    nextTick(() => {
      resizeCanvas()
      showZoomIndicator()
    })
  }

  function clearCanvas(): void {
    for (let y = 0; y < canvasHeight.value; y++) {
      for (let x = 0; x < canvasWidth.value; x++) {
        pixelData.value[y][x] = null
      }
    }
    doRender()
  }

  function getPixelPosition(e: MouseEvent): PixelPos {
    const canvas = canvasRef.value
    if (!canvas) return { x: -1, y: -1 }
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const z = actualZoom.value
    const x = Math.floor((e.clientX - rect.left) * scaleX / z)
    const y = Math.floor((e.clientY - rect.top) * scaleY / z)
    return { x, y }
  }

  function onCanvasMouseDown(e: MouseEvent): void {
    isDrawing.value = true
    const pos = getPixelPosition(e)
    if (pos.x >= 0 && pos.x < canvasWidth.value && pos.y >= 0 && pos.y < canvasHeight.value) {
      if (currentTool.value === 'picker') {
        const picked = pixelData.value[pos.y][pos.x]
        if (picked !== null) selectColor(picked)
      } else if (currentTool.value === 'fill') {
        floodFill(pos.x, pos.y)
      } else {
        drawPixel(pos.x, pos.y)
      }
    }
  }

  function onCanvasMouseMove(e: MouseEvent): void {
    const pos = getPixelPosition(e)
    mousePosX.value = pos.x
    mousePosY.value = pos.y

    if (!isDrawing.value) return
    if (pos.x >= 0 && pos.x < canvasWidth.value && pos.y >= 0 && pos.y < canvasHeight.value) {
      if (currentTool.value === 'pencil') {
        drawPixel(pos.x, pos.y)
      } else if (currentTool.value === 'eraser') {
        erasePixel(pos.x, pos.y)
      }
    }
  }

  function onCanvasMouseUp(): void {
    isDrawing.value = false
  }

  function drawPixel(x: number, y: number): void {
    if (pixelData.value[y][x] !== currentColor.value) {
      pixelData.value[y][x] = currentColor.value
      doRender()
    }
  }

  function erasePixel(x: number, y: number): void {
    if (pixelData.value[y][x] !== null) {
      pixelData.value[y][x] = null
      doRender()
    }
  }

  function floodFill(startX: number, startY: number): void {
    const targetColor = pixelData.value[startY][startX]
    const fillColor = currentColor.value
    if (targetColor === fillColor) return

    const stack: [number, number][] = [[startX, startY]]
    const visited = new Set<string>()

    while (stack.length > 0) {
      const [x, y] = stack.pop()!
      const key = `${x},${y}`
      if (visited.has(key)) continue
      if (x < 0 || x >= canvasWidth.value || y < 0 || y >= canvasHeight.value) continue
      if (pixelData.value[y][x] !== targetColor) continue

      visited.add(key)
      pixelData.value[y][x] = fillColor
      stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1])
    }

    doRender()
  }

  function showZoomIndicator(): void {
    zoomIndicatorVisible.value = true
    clearTimeout(zoomIndicatorTimer!)
    zoomIndicatorTimer = setTimeout(() => {
      zoomIndicatorVisible.value = false
    }, 2000)
  }

  function hexToRgb(hex: string): [number, number, number] {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return [r, g, b]
  }

  function encodeICO(w: number, h: number, scale: number, bgColor: string): Uint8Array {
    const imgW = w * scale
    const imgH = h * scale
    const hasTransparency = true

    // DIB header (40 bytes) + XOR pixels (BGRA) + AND mask (1bpp, row-aligned to 4 bytes)
    const xorRowBytes = imgW * 4
    const xorSize = xorRowBytes * imgH

    const andRowBytes = Math.ceil(imgW / 8)
    const andPad = (4 - (andRowBytes % 4)) % 4
    const andStride = andRowBytes + andPad
    const andSize = andStride * imgH

    const dibSize = 40
    const imageDataOffset = 6 + 16 // header + 1 entry
    const imageSize = dibSize + xorSize + andSize
    const fileSize = imageDataOffset + imageSize

    const buf = new ArrayBuffer(fileSize)
    const dv = new DataView(buf)
    let pos = 0

    // ICO header
    dv.setUint16(pos, 0, true); pos += 2      // reserved
    dv.setUint16(pos, 1, true); pos += 2      // type: ICO
    dv.setUint16(pos, 1, true); pos += 2      // count: 1

    // Directory entry
    dv.setUint8(pos, imgW >= 256 ? 0 : imgW); pos += 1   // width
    dv.setUint8(pos, imgH >= 256 ? 0 : imgH); pos += 1   // height
    dv.setUint8(pos, 0); pos += 1                         // color count
    dv.setUint8(pos, 0); pos += 1                         // reserved
    dv.setUint16(pos, 1, true); pos += 2                  // planes
    dv.setUint16(pos, 32, true); pos += 2                 // bpp
    dv.setUint32(pos, imageSize, true); pos += 4          // image size
    dv.setUint32(pos, imageDataOffset, true); pos += 4    // offset

    // DIB header (BITMAPINFOHEADER)
    const headerPos = pos
    dv.setUint32(pos, 40, true); pos += 4                 // header size
    dv.setInt32(pos, imgW, true); pos += 4                // width
    dv.setInt32(pos, imgH * 2, true); pos += 4            // height (XOR + AND)
    dv.setUint16(pos, 1, true); pos += 2                  // planes
    dv.setUint16(pos, 32, true); pos += 2                 // bpp
    dv.setUint32(pos, 0, true); pos += 4                  // compression: BI_RGB
    dv.setUint32(pos, xorSize + andSize, true); pos += 4  // image size
    dv.setInt32(pos, 0, true); pos += 4                   // xPelsPerMeter
    dv.setInt32(pos, 0, true); pos += 4                   // yPelsPerMeter
    dv.setUint32(pos, 0, true); pos += 4                  // colors used
    dv.setUint32(pos, 0, true); pos += 4                  // colors important

    // XOR pixels (BGRA, bottom-up)
    const xorOffset = pos
    const [bgR, bgG, bgB] = hexToRgb(bgColor)
    for (let y = imgH - 1; y >= 0; y--) {
      const rowStart = xorOffset + (imgH - 1 - y) * xorRowBytes
      for (let x = 0; x < imgW; x++) {
        const px = Math.floor(x / scale)
        const py = Math.floor(y / scale)
        const color = pixelData.value[py]?.[px]
        const off = rowStart + x * 4
        if (color !== null && color !== undefined) {
          const [r, g, b] = hexToRgb(color)
          dv.setUint8(off, b)
          dv.setUint8(off + 1, g)
          dv.setUint8(off + 2, r)
          dv.setUint8(off + 3, 255)
        } else {
          dv.setUint8(off, bgB)
          dv.setUint8(off + 1, bgG)
          dv.setUint8(off + 2, bgR)
          dv.setUint8(off + 3, 0)
        }
      }
    }
    pos = xorOffset + xorSize

    // AND mask (1bpp, bottom-up, all zeros for 32bpp)
    for (let y = 0; y < imgH; y++) {
      for (let b = 0; b < andStride; b++) {
        dv.setUint8(pos, 0)
        pos++
      }
    }

    return new Uint8Array(buf)
  }

  function exportImage(): void {
    const w = canvasWidth.value
    const h = canvasHeight.value
    const scale = exportScale.value
    const format = exportFormat.value
    const bgColor = exportBgColor.value

    if (format === 'ico') {
      const icoData = encodeICO(w, h, scale, bgColor)
      const blob = new Blob([icoData], { type: 'image/x-icon' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.download = `pixelboard-${w}x${h}.ico`
      link.href = url
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      return
    }

    const exportCanvas = document.createElement('canvas')
    exportCanvas.width = w * scale
    exportCanvas.height = h * scale
    const ctx = exportCanvas.getContext('2d')!

    const supportsTransparency = format === 'png' || format === 'webp'
    if (!supportsTransparency) {
      ctx.fillStyle = bgColor
      ctx.fillRect(0, 0, w * scale, h * scale)
    }

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const color = pixelData.value[y][x]
        if (color === null) {
          if (supportsTransparency) continue
          ctx.fillStyle = bgColor
        } else {
          ctx.fillStyle = color
        }
        ctx.fillRect(x * scale, y * scale, scale, scale)
      }
    }

    let mimeType = 'image/png'
    let ext = 'png'
    if (format === 'jpg' || format === 'jpeg') { mimeType = 'image/jpeg'; ext = 'jpg' }
    else if (format === 'webp') { mimeType = 'image/webp'; ext = 'webp' }
    else if (format === 'bmp') { mimeType = 'image/bmp'; ext = 'bmp' }

    const link = document.createElement('a')
    link.download = `pixelboard-${w}x${h}.${ext}`
    link.href = exportCanvas.toDataURL(mimeType)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  function saveProject(): void {
    const data: PixelFileData = {
      version: 1,
      width: canvasWidth.value,
      height: canvasHeight.value,
      pixels: pixelData.value.map(row => [...row])
    }

    const json = JSON.stringify(data, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.download = `pixelboard-${canvasWidth.value}x${canvasHeight.value}.pixel`
    link.href = url
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  function loadProject(file: File): Promise<void> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        try {
          const data: PixelFileData = JSON.parse(reader.result as string)
          if (!data.version || !data.width || !data.height || !Array.isArray(data.pixels)) {
            throw new Error('无效的 .pixel 文件格式')
          }
          canvasWidth.value = Math.max(8, Math.min(256, Math.round(data.width)))
          canvasHeight.value = Math.max(8, Math.min(256, Math.round(data.height)))
          pixelData.value = createEmptyPixelData(canvasWidth.value, canvasHeight.value)
          for (let y = 0; y < Math.min(data.height, canvasHeight.value); y++) {
            const row = data.pixels[y]
            if (Array.isArray(row)) {
              for (let x = 0; x < Math.min(row.length, canvasWidth.value); x++) {
                pixelData.value[y][x] = row[x] ?? null
              }
            }
          }
          nextTick(() => {
            resizeCanvas()
            showZoomIndicator()
          })
          resolve()
        } catch (err) {
          reject(err)
        }
      }
      reader.onerror = () => reject(new Error('读取文件失败'))
      reader.readAsText(file)
    })
  }

  function onCanvasWheel(e: WheelEvent): void {
    const sorted = [...ZOOM_PERCENTS].sort((a, b) => a - b)
    const current = zoomPercent.value
    let idx = sorted.indexOf(current)
    if (e.deltaY < 0) {
      idx = Math.min(sorted.length - 1, idx + 1)
    } else {
      idx = Math.max(0, idx - 1)
    }
    zoomPercent.value = sorted[idx]
    resizeCanvas()
    showZoomIndicator()
  }

  function initCanvas(): void {
    pixelData.value = createEmptyPixelData(canvasWidth.value, canvasHeight.value)
    nextTick(() => {
      setupCanvas()
      observeResize()
    })
  }

  onBeforeUnmount(() => {
    if (resizeObserver) {
      resizeObserver.disconnect()
      resizeObserver = null
    }
  })

  return {
    currentColor,
    currentTool,
    isDrawing,
    canvasWidth,
    canvasHeight,
    zoomPercent,
    pixelData,
    mousePosX,
    mousePosY,
    zoomIndicatorVisible,
    exportFormat,
    exportBgColor,
    exportScale,
    backgroundImage,
    hasBackground,
    presetColors,
    frequentColors,
    recentColors,
    tools,
    zoomPercents,
    canvasRef,
    canvasAreaRef,
    canvasSizeInfo,
    zoomInfo,
    mousePosText,
    zoomIndicatorText,
    currentColorUpper,
    actualZoom,
    selectTool,
    selectColor,
    addRecentColor,
    applySettings,
    clearCanvas,
    exportImage,
    saveProject,
    loadProject,
    loadBackgroundImage,
    clearBackground,
    onCanvasWheel,
    onCanvasMouseDown,
    onCanvasMouseMove,
    onCanvasMouseUp,
    initCanvas
  }
}
