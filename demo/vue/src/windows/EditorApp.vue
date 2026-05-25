<template>
  <div class="editor-app">
    <textarea
      v-model="text"
      class="editor-textarea"
      placeholder="在此輸入文字..."
      spellcheck="false"
    />
    <div class="status-bar">
      <span class="stat">{{ charCount }} 字元</span>
      <span class="stat">{{ wordCount }} 詞</span>
      <span class="stat">{{ lineCount }} 行</span>
      <div class="spacer" />
      <button class="btn" @click="clearText" :disabled="!text">清除</button>
      <button class="btn btn-primary" @click="copyText" :disabled="!text">
        {{ copied ? '✓ 已複製' : '複製' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const text = ref('')
const copied = ref(false)

const charCount = computed(() => text.value.length)
const wordCount = computed(() => text.value.split(/\s+/).filter(Boolean).length)
const lineCount = computed(() => text.value ? text.value.split('\n').length : 0)

function clearText() {
  text.value = ''
}

async function copyText() {
  if (!text.value) return
  await navigator.clipboard.writeText(text.value)
  copied.value = true
  setTimeout(() => { copied.value = false }, 1500)
}
</script>

<style scoped>
.editor-app {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--wos-body-bg, #0f172a);
}
.editor-textarea {
  flex: 1;
  resize: none;
  border: none;
  outline: none;
  padding: 14px 16px;
  font-size: 13px;
  font-family: 'Cascadia Code', 'Consolas', monospace;
  line-height: 1.6;
  background: transparent;
  color: #e2e8f0;
  caret-color: #3b82f6;
}
.editor-textarea::placeholder { color: rgba(226,232,240,0.25); }
.status-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-top: 1px solid rgba(255,255,255,0.08);
  background: rgba(0,0,0,0.2);
  flex-shrink: 0;
}
.stat {
  font-size: 11px;
  color: rgba(226,232,240,0.45);
}
.spacer { flex: 1; }
.btn {
  padding: 4px 12px;
  border-radius: 6px;
  border: 1px solid rgba(255,255,255,0.12);
  background: rgba(255,255,255,0.08);
  color: #e2e8f0;
  font-size: 11px;
  cursor: pointer;
  transition: background 0.15s;
}
.btn:hover:not(:disabled) { background: rgba(255,255,255,0.15); }
.btn:disabled { opacity: 0.35; cursor: default; }
.btn-primary {
  background: rgba(59,130,246,0.25);
  border-color: rgba(59,130,246,0.45);
  color: #93c5fd;
}
.btn-primary:hover:not(:disabled) { background: rgba(59,130,246,0.4); }
</style>