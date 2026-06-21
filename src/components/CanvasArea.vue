<template>
  <div class="canvas-area" ref="canvasAreaRef">
    <div class="canvas-wrapper">
      <canvas
        id="pixelCanvas"
        ref="canvasRef"
        :style="{ cursor: cursorStyle }"
        @mousedown="$emit('mousedown', $event)"
        @mousemove="$emit('mousemove', $event)"
        @mouseup="$emit('mouseup')"
        @mouseleave="$emit('mouseup')"
        @wheel="$emit('wheel', $event)"
      ></canvas>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const canvasRef = ref(null)
const canvasAreaRef = ref(null)

defineProps({
  cursorStyle: {
    type: String,
    default: 'crosshair'
  }
})

defineEmits(['mousedown', 'mousemove', 'mouseup'])

function getCanvasRef() {
  return canvasRef
}

function getCanvasAreaRef() {
  return canvasAreaRef
}

defineExpose({ canvasRef, canvasAreaRef, getCanvasRef, getCanvasAreaRef })
</script>
