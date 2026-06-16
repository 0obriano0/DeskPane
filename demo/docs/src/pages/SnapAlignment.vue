<template>
  <div class="page">
    <div class="page-badge">
      <span class="badge badge-blue">{{ t('snap.badge') }}</span>
    </div>
    <h1>{{ t('snap.h1') }}</h1>
    <p v-html="t('snap.intro')"></p>

    <DemoViewport ref="viewport" @reset="onReset">
      <template #controls>
        <button class="btn" @click="openA">{{ t('snap.openA') }}</button>
        <button class="btn btn-alt" @click="openB">{{ t('snap.openB') }}</button>
        <button class="btn btn-outline" @click="toggleSnap">
          Snap: {{ snapOn ? 'ON' : 'OFF' }}
        </button>
        <label class="gap-label">
          {{ t('snap.labelGap') }}
          <input v-model.number="gapInput" type="number" min="0" max="40" class="gap-input" />
          <button class="btn btn-sm" @click="applyGap">{{ t('snap.applyGap') }}</button>
        </label>
      </template>
    </DemoViewport>

    <h2>{{ t('snap.h2Config') }}</h2>
    <table class="api-table">
      <thead>
        <tr>
          <th>{{ t('wmopt.col.option') }}</th>
          <th>{{ t('common.type') }}</th>
          <th>{{ t('wmopt.col.default') }}</th>
          <th>{{ t('common.description') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr><td><code>snap</code></td><td><code>boolean</code></td><td><code>true</code></td><td v-html="t('snap.opt.snap')"></td></tr>
        <tr><td><code>snapThreshold</code></td><td><code>number</code></td><td><code>20</code></td><td v-html="t('snap.opt.snapThreshold')"></td></tr>
        <tr><td><code>snapGap</code></td><td><code>number</code></td><td><code>0</code></td><td v-html="t('snap.opt.snapGap')"></td></tr>
      </tbody>
    </table>

    <h2>{{ t('snap.h2Api') }}</h2>
    <table class="api-table">
      <thead>
        <tr>
          <th>{{ t('common.method') }}</th>
          <th>{{ t('common.description') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr><td><code>wm.setSnapGap(gap)</code></td><td v-html="t('snap.setSnapGap')"></td></tr>
      </tbody>
    </table>

    <h2>{{ t('snap.h2Behaviour') }}</h2>
    <table class="api-table">
      <thead>
        <tr>
          <th>{{ t('snap.row.col.target') }}</th>
          <th>{{ t('snap.row.col.gap') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr><td>{{ t('snap.row.containerEdge') }}</td><td v-html="t('snap.row.container')"></td></tr>
        <tr><td>{{ t('snap.row.windowEdge') }}</td><td v-html="t('snap.row.window')"></td></tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { WindowManager } from '@deskpane/core/WindowManager'
import DemoViewport from '../components/DemoViewport.vue'
import { useDocCode } from '../composables/useDocCode'
import { useLocale } from '../composables/useLocale'

const { setCode } = useDocCode()
const { t } = useLocale()
const viewport = ref<InstanceType<typeof DemoViewport> | null>(null)
let wm: WindowManager | null = null
const snapOn = ref(true)
const gapInput = ref(6)

function initWM() {
  const container = viewport.value?.container
  if (!container) return
  wm = new WindowManager({ container, isolated: true, snap: snapOn.value, snapThreshold: 20, snapGap: gapInput.value })
}

function onReset() { wm?.destroy(); initWM(); openA(); openB() }

function openA() {
  if (!wm) return
  const div = document.createElement('div')
  div.style.cssText = 'padding:14px;font-size:13px;'
  div.innerHTML = '<p style="margin:0;"><strong style="color:#4a90e2">Window A</strong></p><p style="margin:4px 0 0;font-size:11px;color:#666">Drag near Window B!</p>'
  wm.open({ id: 'snap-a', title: 'Window A', content: div, x: 20, y: 20, width: 220, height: 110 })
}

function openB() {
  if (!wm) return
  const div = document.createElement('div')
  div.style.cssText = 'padding:14px;font-size:13px;'
  div.innerHTML = '<p style="margin:0;"><strong style="color:#27ae60">Window B</strong></p><p style="margin:4px 0 0;font-size:11px;color:#666">Drag near Window A!</p>'
  wm.open({ id: 'snap-b', title: 'Window B', content: div, x: 260, y: 20, width: 220, height: 110 })
}

function toggleSnap() {
  snapOn.value = !snapOn.value
  wm?.destroy()
  initWM()
  openA()
  openB()
}

function applyGap() {
  wm?.setSnapGap(gapInput.value)
}

onMounted(() => {
  initWM()
  openA()
  openB()
  setCode([
    {
      name: 'snap-setup.ts',
      lang: 'typescript',
      code: `import { WindowManager } from 'deskpane'

const wm = new WindowManager({
  container: document.getElementById('desktop')!,
  isolated: true,

  snap: true,           // enable snap (default: true)
  snapThreshold: 20,    // trigger distance in px (default: 20)
  snapGap: 6,           // gap between windows when snapping (default: 0)
                        // Note: container edges are always flush (no gap)
})

// ── Open two windows — drag them near each other to see snap ──
wm.open({ id: 'a', title: 'Window A', content: divA, x: 20,  y: 20, width: 220 })
wm.open({ id: 'b', title: 'Window B', content: divB, x: 260, y: 20, width: 220 })`,
    },
    {
      name: 'runtime.ts',
      lang: 'typescript',
      code: `// ── Update snap gap at any time ────────────────────────
wm.setSnapGap(12)    // windows snap with 12 px gap

wm.setSnapGap(0)     // windows snap flush together

// ── Disable snap at construction time ────────────────
const wm = new WindowManager({ snap: false })`,
    },
  ])
})

onUnmounted(() => wm?.destroy())
</script>

<style scoped>
.page { max-width: 760px; }
.btn {
  padding: 5px 14px;
  background: var(--color-primary);
  color: #fff;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: background 0.1s;
}
.btn:hover { background: var(--color-primary-hover); }
.btn-alt { background: #27ae60; }
.btn-alt:hover { background: #219150; }
.btn-outline { background: #fff; color: var(--color-text); border: 1px solid var(--color-border); }
.btn-outline:hover { background: #f3f4f6; }
.btn-sm { padding: 4px 10px; font-size: 11px; margin-left: 4px; }
.gap-label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--color-text-muted);
}
.gap-input {
  width: 52px;
  padding: 3px 6px;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  font-size: 12px;
  text-align: center;
}
</style>
