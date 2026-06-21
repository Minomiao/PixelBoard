<template>
  <div id="app" :class="{ 'settings-open': showSettingsModal }">
    <TopBar
      :canvas-width="canvasWidth"
      :canvas-height="canvasHeight"
      :zoom-percent="zoomPercent"
      :zoom-percents="zoomPercents"
      :has-background="hasBackground"
      @update:canvas-width="canvasWidth = $event"
      @update:canvas-height="canvasHeight = $event"
      @update:zoom-percent="zoomPercent = $event"
      @apply="applySettings"
      @clear="clearCanvas"
      @save-project="saveProject"
      @export-image="exportImage"
      @open-settings="showSettingsModal = true"
      @minimize="minimizeWindow"
      @maximize="maximizeWindow"
      @close="closeWindow"
      @import-background="onImportBackground"
      @clear-background="clearBackground"
      @import-project="onImportProject"
    />

    <div class="main-container">
      <ToolPanel
        :tools="tools"
        :current-tool="currentTool"
        @select="selectTool"
      />

      <div class="content-area">
        <CanvasArea
          ref="canvasAreaComp"
          @mousedown="onCanvasMouseDown"
          @mousemove="onCanvasMouseMove"
          @mouseup="onCanvasMouseUp"
          @wheel="onCanvasWheel"
        />

        <ColorPanel
          :current-color="currentColor"
          :current-color-upper="currentColorUpper"
          :preset-colors="presetColors"
          :frequent-colors="frequentColors"
          :recent-colors="recentColors"
          @update:current-color="currentColor = $event"
          @select-color="selectColor"
        />
      </div>
    </div>

    <div class="status-bar">
      <span class="status-left">{{ canvasSizeInfo }} &middot; {{ zoomInfo }}</span>
      <span class="status-right">位置: {{ mousePosText }}</span>
    </div>

    <div class="settings-overlay" v-if="showSettingsModal" @click.self="showSettingsModal = false">
      <div class="settings-modal">
        <div class="settings-modal-header">
          <span class="settings-modal-title">设置</span>
          <button class="settings-modal-close" @click="showSettingsModal = false">&times;</button>
        </div>
        <div class="settings-modal-body">
          <div class="settings-sidebar">
            <button
              v-for="item in settingsMenu"
              :key="item.id"
              class="settings-menu-item"
              :class="{ active: activeSettingsTab === item.id }"
              @click="activeSettingsTab = item.id"
            >
              <svg viewBox="0 0 24 24" width="16" height="16">
                <path :d="item.icon" fill="white"/>
              </svg>
              {{ item.label }}
            </button>
          </div>
          <div class="settings-content">
            <div class="settings-content-header">{{ currentSettingsLabel }}</div>
            <div class="settings-fields" v-if="activeSettingsTab === 'canvas'">
              <div class="settings-group">
                <span class="settings-label">画布宽度</span>
                <input
                  type="number"
                  class="setting-input"
                  :value="canvasWidth"
                  @input="canvasWidth = Math.round(Number($event.target.value)) || canvasWidth"
                  min="8"
                  max="256"
                >
              </div>
              <div class="settings-group">
                <span class="settings-label">画布高度</span>
                <input
                  type="number"
                  class="setting-input"
                  :value="canvasHeight"
                  @input="canvasHeight = Math.round(Number($event.target.value)) || canvasHeight"
                  min="8"
                  max="256"
                >
              </div>
              <div class="settings-group">
                <span class="settings-label">缩放比例</span>
                <select
                  class="setting-select"
                  :value="zoomPercent"
                  @change="zoomPercent = Number($event.target.value)"
                >
                  <option v-for="p in zoomPercents" :key="p" :value="p">{{ p }}%</option>
                </select>
              </div>
            </div>
            <div class="settings-fields" v-if="activeSettingsTab === 'save'">
              <div class="settings-group">
                <span class="settings-label">导出格式</span>
                <select
                  class="setting-select"
                  :value="exportFormat"
                  @change="onFormatChange($event.target.value)"
                >
                  <option value="png">PNG</option>
                  <option value="jpg">JPEG</option>
                  <option value="webp">WebP</option>
                  <option value="bmp">BMP</option>
                  <option value="ico">ICO</option>
                </select>
              </div>
              <div class="settings-group" :class="{ 'settings-group-disabled': supportsTransparency }">
                <span class="settings-label" :class="{ 'settings-label-disabled': supportsTransparency }">背景颜色</span>
                <input
                  type="color"
                  class="setting-input settings-color-input"
                  :value="exportBgColor"
                  :disabled="supportsTransparency"
                  @input="exportBgColor = $event.target.value"
                >
                <span class="settings-hex" :class="{ 'settings-hex-disabled': supportsTransparency }">{{ exportBgColor.toUpperCase() }}</span>
              </div>
              <div class="settings-group">
                <span class="settings-label">导出倍率</span>
                <input
                  type="number"
                  class="setting-input"
                  :value="exportScale"
                  @input="onScaleInput"
                  min="1"
                  max="256"
                >
                <span class="settings-unit">x</span>
              </div>
            </div>
            <div class="settings-footer-actions" v-if="activeSettingsTab === 'canvas'">
              <button class="btn-apply btn-cancel" @click="showSettingsModal = false">取消</button>
              <button class="btn-apply btn-clear" @click="onModalClear">清空画布</button>
              <button class="btn-apply btn-confirm" @click="onModalApply">应用</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted } from 'vue'
import TopBar from './components/TopBar.vue'
import ToolPanel from './components/ToolPanel.vue'
import CanvasArea from './components/CanvasArea.vue'
import ColorPanel from './components/ColorPanel.vue'
import { usePixelEditor } from './composables/usePixelEditor.ts'

interface SettingsMenuItem {
  id: string
  label: string
  icon: string
}

const canvasAreaComp = ref<InstanceType<typeof CanvasArea> | null>(null)
const showSettingsModal = ref(false)
const activeSettingsTab = ref('canvas')

const settingsMenu: SettingsMenuItem[] = [
  {
    id: 'canvas',
    label: '画布设置',
    icon: 'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM7 7h10v2H7V7zm0 4h10v2H7v-2zm0 4h6v2H7v-2z'
  },
  {
    id: 'save',
    label: '导出设置',
    icon: 'M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z'
  }
]

const currentSettingsLabel = computed(() => {
  const item = settingsMenu.find(m => m.id === activeSettingsTab.value)
  return item ? item.label : ''
})

const supportsTransparency = computed(() => {
  return exportFormat.value === 'png' || exportFormat.value === 'webp'
})

const editor = usePixelEditor()

const {
  currentColor,
  currentTool,
  canvasWidth,
  canvasHeight,
  zoomPercent,
  zoomIndicatorVisible,
  presetColors,
  frequentColors,
  recentColors,
  tools,
  zoomPercents,
  canvasSizeInfo,
  zoomInfo,
  mousePosText,
  zoomIndicatorText,
  currentColorUpper,
  exportFormat,
  exportBgColor,
  exportScale,
  selectTool,
  selectColor,
  applySettings,
  clearCanvas,
  hasBackground,
  loadBackgroundImage,
  clearBackground,
  exportImage,
  saveProject,
  loadProject,
  onCanvasWheel,
  onCanvasMouseDown,
  onCanvasMouseMove,
  onCanvasMouseUp,
  initCanvas
} = editor

onMounted(() => {
  nextTick(() => {
    if (canvasAreaComp.value) {
      editor.canvasRef.value = canvasAreaComp.value.canvasRef
      editor.canvasAreaRef.value = canvasAreaComp.value.canvasAreaRef
      initCanvas()
    }
  })
})

function onModalApply(): void {
  applySettings()
  showSettingsModal.value = false
}

function onFormatChange(val: string): void {
  exportFormat.value = val
}

function onScaleInput(e: Event): void {
  const v = Math.round(Number((e.target as HTMLInputElement).value))
  exportScale.value = Math.max(1, Math.min(256, v)) || 1
}

function onModalClear(): void {
  clearCanvas()
  showSettingsModal.value = false
}

function onImportBackground(file: File): void {
  loadBackgroundImage(file)
}

function onImportProject(file: File): void {
  loadProject(file).catch((err: Error) => {
    alert('导入失败: ' + err.message)
  })
}

function minimizeWindow(): void {
  const { ipcRenderer } = (window as any).require('electron')
  ipcRenderer.send('window-minimize')
}

function maximizeWindow(): void {
  const { ipcRenderer } = (window as any).require('electron')
  ipcRenderer.send('window-maximize')
}

function closeWindow(): void {
  const { ipcRenderer } = (window as any).require('electron')
  ipcRenderer.send('window-close')
}
</script>
