<template>
  <div class="left-panel">
    <button
      v-for="tool in tools"
      :key="tool.id"
      class="tool-btn"
      :class="{ active: currentTool === tool.id }"
      :title="tool.title"
      @click="$emit('select', tool.id)"
    >
      <svg viewBox="0 0 24 24">
        <path :d="tool.svg" />
      </svg>
    </button>
  </div>
</template>

<script setup>
defineProps({
  tools: Array,
  currentTool: String
})

defineEmits(['select'])
</script>
