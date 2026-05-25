<template>
  <div class="guide-app">
    <h2 class="title">🧩 Vue Composable 指南</h2>

    <section class="card">
      <div class="card-label">初始化</div>
      <pre class="code">const { wm, windows, openVueWindow } = useWindowManager()</pre>
    </section>

    <section class="card">
      <div class="card-label">回傳值一覽</div>
      <div class="api-list">
        <div v-for="item in apiItems" :key="item.name" class="api-item">
          <span class="api-name">{{ item.name }}</span>
          <span class="api-desc">{{ item.desc }}</span>
        </div>
      </div>
    </section>

    <section class="card">
      <div class="card-label">KeepAlive 保留狀態</div>
      <pre class="code">&lt;KeepAlive&gt;
  &lt;component :is="win.component" /&gt;
&lt;/KeepAlive&gt;</pre>
      <p class="hint">最小化視窗後重新開啟，元件狀態完整保留。</p>
    </section>

    <section class="card">
      <div class="card-label">Teleport 注入 DOM</div>
      <pre class="code">&lt;Teleport :to="win.bodyEl"&gt;
  &lt;MyComponent /&gt;
&lt;/Teleport&gt;</pre>
      <p class="hint">將 Vue 元件渲染進 WM 管理的視窗 DOM。</p>
    </section>
  </div>
</template>

<script setup lang="ts">
const apiItems = [
  { name: 'wm',            desc: 'WindowManager 實例' },
  { name: 'windows',       desc: 'Ref<VueWindowEntry[]> 響應式視窗清單' },
  { name: 'openVueWindow', desc: '開啟含 Vue 元件的新視窗' },
  { name: 'close',         desc: '關閉視窗（保留元件）' },
  { name: 'minimize',      desc: '最小化視窗' },
  { name: 'restore',       desc: '還原最小化視窗' },
  { name: 'focus',         desc: '聚焦視窗（置頂）' },
  { name: 'destroy',       desc: '銷毀視窗並釋放資源' },
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
  background: var(--wos-body-bg, #0f172a);
  color: #e2e8f0;
  font-family: 'Segoe UI', sans-serif;
}
.title {
  margin: 0 0 4px;
  font-size: 15px;
  font-weight: 700;
  color: #e2e8f0;
}
.card {
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 8px;
  padding: 12px 14px;
}
.card-label {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #3b82f6;
  font-weight: 600;
  margin-bottom: 8px;
}
.code {
  margin: 0;
  padding: 8px 10px;
  background: #1e293b;
  border-radius: 6px;
  font-size: 11px;
  font-family: 'Cascadia Code', 'Consolas', monospace;
  color: #93c5fd;
  white-space: pre-wrap;
  word-break: break-all;
}
.hint {
  margin: 8px 0 0;
  font-size: 11px;
  color: rgba(226,232,240,0.55);
}
.api-list { display: flex; flex-direction: column; gap: 4px; }
.api-item {
  display: flex;
  gap: 10px;
  align-items: baseline;
  font-size: 12px;
}
.api-name {
  font-family: 'Cascadia Code', monospace;
  color: #34d399;
  min-width: 130px;
  flex-shrink: 0;
}
.api-desc { color: rgba(226,232,240,0.65); }
</style>