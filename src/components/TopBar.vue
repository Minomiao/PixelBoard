<template>
  <div class="top-bar">
    <div class="top-bar-left">
      <button class="top-btn settings-btn" @click="$emit('openSettings')" title="设置">
        <svg viewBox="0 0 24 24" width="18" height="18">
          <path fill="white" d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.488.488 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6A3.6 3.6 0 1 1 12 8.4a3.6 3.6 0 0 1 0 7.2z"/>
        </svg>
      </button>

      <div class="dropdown">
        <button class="top-btn dropdown-btn">
          <svg viewBox="0 0 24 24" width="18" height="18">
            <path fill="white" d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z"/>
          </svg>
          <span>文件</span>
          <svg class="dropdown-arrow" viewBox="0 0 24 24" width="12" height="12">
            <path fill="white" d="M7 10l5 5 5-5z"/>
          </svg>
        </button>
        <div class="dropdown-menu">
          <button class="dropdown-item" @click="$emit('saveProject')">
            <svg viewBox="0 0 24 24" width="14" height="14">
              <path fill="currentColor" d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/>
            </svg>
            <span>保存项目</span>
          </button>
          <button class="dropdown-item" @click="triggerProjectImport">
            <svg viewBox="0 0 24 24" width="14" height="14">
              <path fill="currentColor" d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z"/>
            </svg>
            <span>导入项目</span>
          </button>
          <div class="dropdown-divider"></div>
          <button class="dropdown-item" @click="$emit('exportImage')">
            <svg viewBox="0 0 24 24" width="14" height="14">
              <path fill="currentColor" d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
            </svg>
            <span>导出图片</span>
          </button>
        </div>
      </div>

      <div class="dropdown">
        <button class="top-btn dropdown-btn">
          <svg viewBox="0 0 24 24" width="18" height="18">
            <path fill="white" d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
          </svg>
          <span>背景</span>
          <svg class="dropdown-arrow" viewBox="0 0 24 24" width="12" height="12">
            <path fill="white" d="M7 10l5 5 5-5z"/>
          </svg>
        </button>
        <div class="dropdown-menu">
          <button class="dropdown-item" @click="triggerBgImport">
            <svg viewBox="0 0 24 24" width="14" height="14">
              <path fill="currentColor" d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5zm0 16H5V5h14v14zm-5-7l-3 3.72L9 13l-4 5h14l-4-5z"/>
            </svg>
            <span>导入参考图</span>
          </button>
          <button
            v-if="hasBackground"
            class="dropdown-item dropdown-item-danger"
            @click="$emit('clearBackground')"
          >
            <svg viewBox="0 0 24 24" width="14" height="14">
              <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
            <span>关闭参考图</span>
          </button>
        </div>
      </div>

      <input
        ref="bgInputRef"
        type="file"
        accept="image/*"
        class="hidden-input"
        @change="onBgFileChange"
      />
      <input
        ref="projectInputRef"
        type="file"
        accept=".pixel,application/json"
        class="hidden-input"
        @change="onProjectFileChange"
      />
    </div>
    <div class="window-controls">
      <button class="window-dot dot-yellow" @click="$emit('minimize')" title="最小化"></button>
      <button class="window-dot dot-green" @click="$emit('maximize')" title="最大化"></button>
      <button class="window-dot dot-red" @click="$emit('close')" title="关闭"></button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

defineProps<{
  canvasWidth: number
  canvasHeight: number
  zoomPercent: number
  zoomPercents: number[]
  hasBackground: boolean
}>()

const emit = defineEmits<{
  (e: 'update:canvasWidth', value: number): void
  (e: 'update:canvasHeight', value: number): void
  (e: 'update:zoomPercent', value: number): void
  (e: 'apply'): void
  (e: 'clear'): void
  (e: 'saveProject'): void
  (e: 'exportImage'): void
  (e: 'openSettings'): void
  (e: 'minimize'): void
  (e: 'maximize'): void
  (e: 'close'): void
  (e: 'importBackground', file: File): void
  (e: 'clearBackground'): void
  (e: 'importProject', file: File): void
}>()

const bgInputRef = ref<HTMLInputElement | null>(null)
const projectInputRef = ref<HTMLInputElement | null>(null)

function triggerBgImport(): void {
  bgInputRef.value?.click()
}

function triggerProjectImport(): void {
  projectInputRef.value?.click()
}

function onBgFileChange(e: Event): void {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    emit('importBackground', file)
  }
  target.value = ''
}

function onProjectFileChange(e: Event): void {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    emit('importProject', file)
  }
  target.value = ''
}
</script>
