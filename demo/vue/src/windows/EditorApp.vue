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

const text = ref('DeskPane Vue 3 Demo\n===================\n\n此為 Vue 文字編輯器示範。\n最小化後重新開啟，內容依然保留（KeepAlive）。\n')
const copied = ref(false)

const charCount = computed(() => text.value.length)
const wordCount = computed(() => text.value.split(/\s+/).filter(Boolean).length)
const lineCount = computed(() => text.value ? text.value.split('\n').length : 0)

function clearText() { text.value = '' }

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
  background: var(--dp-window-body-bg, #13131f);
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
  color: var(--dp-window-body-color, #e0e0f0);
  caret-color: #3b82f6;
}
.editor-textarea::placeholder { color: rgba(255,255,255,0.2); }
.status-bar {
  display: flex; align-items: center; gap: 8px; padding: 6px 12px;
  border-top: 1px solid rgba(255,255,255,0.08); background: rgba(0,0,0,0.2); flex-shrink: 0;
}
.stat { font-size: 11px; color: rgba(255,255,255,0.4); }
.spacer { flex: 1; }
.btn {
  padding: 4px 12px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.12);
  background: rgba(255,255,255,0.08); color: var(--dp-window-body-color, #e0e0f0);
  font-size: 11px; cursor: pointer; transition: background 0.15s;
}
.btn:hover:not(:disabled) { background: rgba(255,255,255,0.15); }
.btn:disabled { opacity: 0.35; cursor: default; }
.btn-primary { background: rgba(59,130,246,0.25); border-color: rgba(59,130,246,0.45); color: #93c5fd; }
.btn-primary:hover:not(:disabled) { background: rgba(59,130,246,0.4); }
</style>
