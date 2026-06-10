<template>
  <div class="counter-app">
    <div class="render-badge">此元件已渲染 {{ renderCount }} 次</div>
    <div class="count-display" :class="{ positive: count > 0, negative: count < 0 }">{{ count }}</div>
    <div class="btn-row">
      <button class="btn btn-dec" @click="count--">－</button>
      <button class="btn btn-reset" @click="reset">重置</button>
      <button class="btn btn-inc" @click="count++">＋</button>
    </div>
    <div class="keepalive-note">
      <span class="note-icon">💡</span>
      <span>最小化後重新開啟，計數器仍保留<br/>— 這就是 <code>KeepAlive</code> 的效果</span>
    </div>
    <div class="history-panel">
      <div class="history-label">最近操作</div>
      <div class="history-list">
        <div v-for="(h, i) in history" :key="i" class="history-row">
          <span class="h-time">{{ h.time }}</span>
          <span class="h-val" :class="h.delta > 0 ? 'up' : h.delta < 0 ? 'down' : 'rst'">
            {{ h.delta > 0 ? `+${h.delta}` : h.delta === 0 ? '重置' : h.delta }} → {{ h.value }}
          </span>
        </div>
        <div v-if="history.length === 0" class="h-empty">尚無操作記錄</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'

const count = ref(0)
const renderCount = ref(0)
const history = ref<{ time: string; value: number; delta: number }[]>([])

onMounted(() => { renderCount.value++ })

function now() {
  return new Date().toLocaleTimeString('zh-TW', { hour12: false })
}

watch(count, (val, old) => {
  history.value.unshift({ time: now(), value: val, delta: val - old })
  if (history.value.length > 15) history.value.pop()
})

function reset() {
  const prev = count.value
  count.value = 0
  if (prev !== 0) {
    history.value.unshift({ time: now(), value: 0, delta: 0 })
    if (history.value.length > 15) history.value.pop()
  }
}
</script>

<style scoped>
.counter-app {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 16px;
  background: var(--dp-window-body-bg, #13131f);
  color: #e2e8f0;
  overflow-y: auto;
}
.render-badge {
  font-size: 11px;
  padding: 3px 10px;
  border-radius: 20px;
  background: rgba(59,130,246,0.15);
  border: 1px solid rgba(59,130,246,0.3);
  color: #93c5fd;
}
.count-display {
  font-size: 72px;
  font-weight: 800;
  line-height: 1;
  color: #e2e8f0;
  transition: color 0.2s;
  font-variant-numeric: tabular-nums;
  min-width: 120px;
  text-align: center;
}
.count-display.positive { color: #34d399; }
.count-display.negative { color: #f87171; }
.btn-row { display: flex; gap: 8px; align-items: center; }
.btn {
  border-radius: 8px;
  border: 1px solid rgba(255,255,255,0.12);
  background: rgba(255,255,255,0.08);
  color: #e2e8f0;
  cursor: pointer;
  font-size: 18px;
  font-weight: 700;
  transition: background 0.15s, transform 0.1s;
}
.btn:hover { transform: scale(1.08); }
.btn-dec, .btn-inc { width: 46px; height: 46px; border-radius: 50%; }
.btn-dec:hover { background: rgba(239,68,68,0.25); border-color: rgba(239,68,68,0.4); color: #f87171; }
.btn-inc:hover { background: rgba(52,211,153,0.2); border-color: rgba(52,211,153,0.4); color: #34d399; }
.btn-reset { font-size: 12px; padding: 6px 12px; }
.keepalive-note {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  padding: 10px 14px;
  background: rgba(234,179,8,0.08);
  border: 1px solid rgba(234,179,8,0.2);
  border-radius: 8px;
  font-size: 12px;
  color: rgba(226,232,240,0.7);
  line-height: 1.5;
  width: 100%;
}
.note-icon { font-size: 16px; flex-shrink: 0; }
code {
  background: rgba(255,255,255,0.1);
  padding: 1px 5px;
  border-radius: 4px;
  font-family: monospace;
  color: #fbbf24;
}
.history-panel { width: 100%; }
.history-label { font-size: 10px; color: rgba(226,232,240,0.4); text-transform: uppercase; letter-spacing: 0.07em; margin-bottom: 4px; }
.history-list { display: flex; flex-direction: column; gap: 2px; max-height: 100px; overflow-y: auto; }
.history-row { display: flex; gap: 10px; font-size: 11px; font-family: monospace; }
.h-time { color: rgba(226,232,240,0.35); }
.up { color: #34d399; }
.down { color: #f87171; }
.rst { color: rgba(226,232,240,0.45); }
.h-empty { color: rgba(226,232,240,0.25); font-size: 11px; }
</style>