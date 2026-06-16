<template>
  <div class="demo-shell">
    <div class="demo-toolbar">
      <span class="demo-label">Live Demo</span>
      <slot name="controls" />
      <button class="btn-reset" @click="$emit('reset')" title="重置所有視窗">Reset</button>
    </div>
    <div ref="container" class="demo-viewport">
      <!-- WindowManager isolated container — windows are rendered here -->
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

defineEmits<{ (e: 'reset'): void }>()

const container = ref<HTMLElement | null>(null)
defineExpose({ container })
</script>

<style scoped>
.demo-shell {
  border: 1px dashed var(--color-demo-border);
  border-radius: 0;
  overflow: hidden;
  background: var(--color-demo-bg);
  margin: 18px 0 26px;
}

.demo-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: #f7f9fb;
  border-bottom: 1px solid var(--color-demo-border);
  flex-wrap: wrap;
}

.demo-label {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  color: #536577;
  margin-right: 8px;
}

.demo-viewport {
  height: clamp(320px, 46vh, 560px);
  position: relative;
  overflow: hidden;
  background:
    linear-gradient(90deg, rgba(15,23,42,0.04) 1px, transparent 1px),
    linear-gradient(0deg, rgba(15,23,42,0.04) 1px, transparent 1px),
    #fbfcfd;
  background-size: 28px 28px;
}

.btn-reset {
  margin-left: auto;
  padding: 6px 13px;
  background: #fff;
  border: 1px solid #b8c2cc;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  color: #536577;
  transition: background 0.1s;
}
.btn-reset:hover { background: #fee2e2; border-color: #fca5a5; color: #dc2626; }
</style>
