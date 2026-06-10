<template>
  <div class="guide-app">
    <h2 class="title">🧩 Vue 3 整合指南</h2>

    <section class="card">
      <div class="card-label">架構說明</div>
      <p class="hint">DeskPane Desktop 提供桌面殼層（圖示 + Dock），Vue 3 元件透過 <code>Teleport</code> 渲染進視窗 body。</p>
    </section>

    <section class="card">
      <div class="card-label">開窗方式</div>
      <pre class="code">wm.open({
  id: 'app-guide',
  title: 'Vue 指南',
  slotType: 'vue',   // 留空 body
  content: null,
})</pre>
    </section>

    <section class="card">
      <div class="card-label">Teleport 注入</div>
      <pre class="code">&lt;Teleport :to="win.bodyEl"&gt;
  &lt;KeepAlive&gt;
    &lt;component :is="win.component" /&gt;
  &lt;/KeepAlive&gt;
&lt;/Teleport&gt;</pre>
      <p class="hint">KeepAlive 確保最小化後元件狀態完整保留。</p>
    </section>

    <section class="card">
      <div class="card-label">示範元件</div>
      <div class="api-list">
        <div v-for="item in items" :key="item.desc" class="api-item">
          <span class="api-icon">{{ item.icon }}</span>
          <span class="api-desc">{{ item.desc }}</span>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
const items: Array<{ icon: string; desc: string }> = [
  { icon: '📝', desc: '文字編輯器 — v-model 雙向綁定，KeepAlive 保留狀態' },
  { icon: '✅', desc: '待辦清單 — ref 陣列響應式操作' },
  { icon: '🔢', desc: 'Keep-Alive 計數器 — 最小化後數值不重置' },
  { icon: '🧮', desc: '計算機 — computed + template 事件處理' },
]
</script>

<style scoped>
.guide-app {
  height: 100%;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: var(--dp-window-body-bg, #13131f);
  color: var(--dp-window-body-color, #e0e0f0);
  font-family: 'Segoe UI', system-ui, sans-serif;
}
.title { margin: 0 0 4px; font-size: 15px; font-weight: 700; }
.card {
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 8px;
  padding: 12px 14px;
}
.card-label {
  font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em;
  color: #3b82f6; font-weight: 600; margin-bottom: 8px;
}
.code {
  margin: 0; padding: 8px 10px; background: rgba(0,0,0,0.3);
  border-radius: 6px; font-size: 11px;
  font-family: 'Cascadia Code', 'Consolas', monospace;
  color: #93c5fd; white-space: pre-wrap; word-break: break-all;
}
.hint { margin: 8px 0 0; font-size: 11px; color: rgba(255,255,255,0.5); line-height: 1.5; }
.hint code { background: rgba(255,255,255,0.1); padding: 1px 5px; border-radius: 3px; }
.api-list { display: flex; flex-direction: column; gap: 6px; }
.api-item { display: flex; gap: 10px; align-items: baseline; font-size: 12px; }
.api-icon { font-size: 14px; flex-shrink: 0; }
.api-desc { color: rgba(255,255,255,0.65); line-height: 1.5; }
</style>
