<template>
  <div class="code-panel">
    <div class="code-panel-empty" v-if="!files.length">
      <span>← 選擇左側示例後顯示原始碼</span>
    </div>
    <template v-else>
      <div class="code-toolbar">
        <div class="code-tabs">
          <button
            v-for="f in files"
            :key="f.name"
            class="code-tab"
            :class="{ active: activeFile === f.name }"
            @click="activeFile = f.name"
          >{{ f.name }}</button>
        </div>
        <button class="copy-btn" title="Copy code" @click="copyCode">
          {{ copied ? 'Copied' : 'Copy' }}
        </button>
      </div>
      <div class="code-scroll">
        <pre class="hljs-pre"><code
          class="hljs"
          v-html="highlighted"
        /></pre>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import hljs from 'highlight.js/lib/core'
import typescript from 'highlight.js/lib/languages/typescript'
import javascript from 'highlight.js/lib/languages/javascript'
import xml from 'highlight.js/lib/languages/xml'
import css from 'highlight.js/lib/languages/css'
import 'highlight.js/styles/github.min.css'

hljs.registerLanguage('typescript', typescript)
hljs.registerLanguage('javascript', javascript)
hljs.registerLanguage('xml', xml)       // HTML / Vue template
hljs.registerLanguage('css', css)

import type { CodeFile } from '../composables/useDocCode'

const props = defineProps<{ files: CodeFile[] }>()

const activeFile = ref('')
const copied = ref(false)

watch(() => props.files, (files) => {
  activeFile.value = files[0]?.name ?? ''
}, { immediate: true })

const currentFile = computed(() =>
  props.files.find(f => f.name === activeFile.value)
)

const highlighted = computed(() => {
  const f = currentFile.value
  if (!f) return ''
  const lang = f.lang === 'vue' ? 'xml' : f.lang
  try {
    return hljs.highlight(f.code.trim(), { language: lang }).value
  } catch {
    return hljs.highlightAuto(f.code.trim()).value
  }
})

async function copyCode() {
  const code = currentFile.value?.code ?? ''
  await navigator.clipboard.writeText(code.trim())
  copied.value = true
  setTimeout(() => { copied.value = false }, 2000)
}
</script>

<style scoped>
.code-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #fff;
  color: #1f2937;
}

.code-panel-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7785;
  font-size: 13px;
  padding: 20px;
  text-align: center;
}

.code-toolbar {
  display: flex;
  align-items: center;
  background: #f4f4f4;
  border-bottom: 1px solid #d4d9de;
  flex-shrink: 0;
  min-height: 57px;
}

.code-tabs {
  display: flex;
  align-self: stretch;
  min-width: 0;
  overflow-x: auto;
}

.code-tab {
  min-width: 118px;
  padding: 0 20px;
  background: transparent;
  border: 0;
  border-right: 1px solid #d4d9de;
  color: #666;
  font-size: 15px;
  cursor: pointer;
  font-family: inherit;
  white-space: nowrap;
  transition: color 0.1s, background 0.1s;
}

.code-tab:hover { color: #00758c; background: #fafafa; }
.code-tab.active {
  color: #1f2937;
  background: #fff;
  box-shadow: inset 0 -3px 0 #2f9bb3;
}

.copy-btn {
  margin-left: auto;
  margin-right: 14px;
  padding: 8px 18px;
  background: #fff;
  border: 2px solid #008aa8;
  border-radius: 4px;
  color: #00758c;
  font-size: 14px;
  cursor: pointer;
  font-family: inherit;
  font-weight: 600;
  white-space: nowrap;
  transition: background 0.1s, color 0.1s;
}
.copy-btn:hover { background: #e7f5f8; color: #005f73; }

.code-scroll {
  flex: 1;
  overflow: auto;
  background: #fff;
}

.hljs-pre {
  margin: 0;
  padding: 0;
  background: transparent !important;
  font-family: 'Cascadia Code', 'Fira Code', 'Consolas', monospace;
  font-size: 13px;
  line-height: 1.55;
  tab-size: 2;
  counter-reset: line;
}

.hljs-pre code.hljs {
  background: transparent !important;
  padding: 18px 22px;
  font-size: inherit;
  color: #1f2937;
}
</style>
