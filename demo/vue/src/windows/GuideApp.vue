<template>
  <div class="guide-app">
    <h2 class="title">🧩 {{ t('guide.title') }}</h2>

    <section class="card">
      <div class="card-label">{{ t('guide.architecture') }}</div>
      <p class="hint">{{ t('guide.architectureText') }}</p>
    </section>

    <section class="card">
      <div class="card-label">{{ t('guide.opening') }}</div>
      <pre class="code">wm.open({
  id: 'app-guide',
  title: t('apps.guide.title'),
  slotType: 'vue',   // leave body empty
  content: null,
})</pre>
    </section>

    <section class="card">
      <div class="card-label">{{ t('guide.teleport') }}</div>
      <pre class="code">&lt;Teleport :to="win.bodyEl"&gt;
  &lt;KeepAlive&gt;
    &lt;component :is="win.component" /&gt;
  &lt;/KeepAlive&gt;
&lt;/Teleport&gt;</pre>
      <p class="hint">{{ t('guide.keepAlive') }}</p>
    </section>

    <section class="card">
      <div class="card-label">{{ t('guide.components') }}</div>
      <div class="api-list">
        <div v-for="item in items" :key="item.key" class="api-item">
          <span class="api-icon">{{ item.icon }}</span>
          <span class="api-desc">{{ t(item.key) }}</span>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const items: Array<{ icon: string; key: string }> = [
  { icon: '📝', key: 'guide.editor' },
  { icon: '✅', key: 'guide.todo' },
  { icon: '🔢', key: 'guide.counter' },
  { icon: '🧮', key: 'guide.calc' },
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
