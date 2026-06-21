<template>
  <div class="right-panel">
    <div class="color-section">
      <div class="section-title">颜色</div>
      <div class="current-color-display">
        <div
          class="current-color-preview"
          :style="{ backgroundColor: currentColor }"
        ></div>
        <span class="current-color-hex">{{ currentColorUpper }}</span>
      </div>
    </div>

    <div class="color-section color-section-frequent">
      <div class="section-title">常用色</div>
      <div class="frequent-color-grid-wrapper">
        <div class="frequent-color-grid">
          <div
            v-for="color in mergedFrequentColors"
            :key="'freq-' + color"
            class="color-swatch"
            :class="{ active: currentColor === color }"
            :style="{ backgroundColor: color }"
            @click="$emit('selectColor', color)"
          ></div>
        </div>
      </div>
    </div>

    <div class="color-section color-section-fill">
      <div class="section-title">调色板</div>
      <div class="color-grid-wrapper">
        <div class="color-grid">
          <div
            v-for="color in presetColors"
            :key="color"
            class="color-swatch"
            :class="{ active: currentColor === color }"
            :style="{ backgroundColor: color }"
            @click="$emit('selectColor', color)"
          ></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  currentColor: String,
  currentColorUpper: String,
  presetColors: Array,
  frequentColors: Array,
  recentColors: Array
})

defineEmits(['selectColor'])

const mergedFrequentColors = computed(() => {
  const merged = [...props.recentColors]
  for (const c of props.frequentColors) {
    if (!merged.includes(c)) merged.push(c)
  }
  return merged.slice(0, 30)
})
</script>
