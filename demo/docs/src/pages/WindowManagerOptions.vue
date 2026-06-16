<template>
  <div class="page">
    <div class="page-badge">
      <span class="badge badge-blue">{{ t('wmopt.badge') }}</span>
    </div>
    <h1>{{ t('wmopt.h1') }}</h1>
    <p v-html="t('wmopt.intro')"></p>

    <h2>{{ t('wmopt.h2Options') }}</h2>
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
        <tr><td><code>container</code></td><td><code>HTMLElement</code></td><td><code>document.body</code></td><td v-html="t('wmopt.opt.container')"></td></tr>
        <tr><td><code>isolated</code></td><td><code>boolean</code></td><td><code>false</code></td><td v-html="t('wmopt.opt.isolated')"></td></tr>
        <tr><td><code>throttleMs</code></td><td><code>number</code></td><td><code>16</code></td><td v-html="t('wmopt.opt.throttleMs')"></td></tr>
        <tr><td><code>snap</code></td><td><code>boolean</code></td><td><code>true</code></td><td v-html="t('wmopt.opt.snap')"></td></tr>
        <tr><td><code>snapThreshold</code></td><td><code>number</code></td><td><code>20</code></td><td v-html="t('wmopt.opt.snapThreshold')"></td></tr>
        <tr><td><code>snapGap</code></td><td><code>number</code></td><td><code>0</code></td><td v-html="t('wmopt.opt.snapGap')"></td></tr>
      </tbody>
    </table>

    <h2>{{ t('wmopt.h2Rwd') }}</h2>
    <p v-html="t('wmopt.rwdDesc')"></p>

    <DemoViewport ref="viewport" @reset="onReset">
      <template #controls>
        <button class="btn" @click="openWindow">{{ t('wmopt.openDemo') }}</button>
        <button class="btn btn-outline" @click="toggleIsolated">
          {{ isolated ? t('wmopt.disableIsolated') : t('wmopt.enableIsolated') }}
        </button>
        <button class="btn btn-outline" @click="toggleSnap">
          {{ snapOn ? t('wmopt.disableSnap') : t('wmopt.enableSnap') }}
        </button>
      </template>
    </DemoViewport>

    <p class="demo-note" v-html="t('wmopt.demoNote')"></p>
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
const isolated = ref(true)
const snapOn = ref(true)
let winCounter = 0

function initWM() {
  const container = viewport.value?.container
  if (!container) return
  wm = new WindowManager({ container, isolated: isolated.value, snap: snapOn.value, snapThreshold: 20, snapGap: 6 })
}

function onReset() { wm?.destroy(); initWM(); winCounter = 0 }

function openWindow() {
  if (!wm) return
  winCounter++
  const div = document.createElement('div')
  div.style.cssText = 'padding:14px;font-size:13px;'
  div.innerHTML = `<p style="margin:0 0 8px"><strong>Window ${winCounter}</strong></p>
    <p style="margin:0;color:#666;font-size:12px">Try dragging near edges — snap is ${snapOn.value ? 'ON' : 'OFF'}.</p>`
  wm.open({ id: `opt-w${winCounter}`, title: `Window ${winCounter}`, content: div, width: 260, height: 130 })
}

function toggleIsolated() {
  isolated.value = !isolated.value
  wm?.destroy()
  initWM()
}

function toggleSnap() {
  snapOn.value = !snapOn.value
  wm?.destroy()
  initWM()
}

onMounted(() => {
  initWM()
  openWindow()
  setCode([
    {
      name: 'basic.ts',
      lang: 'typescript',
      code: `import { WindowManager } from 'deskpane'

// ── Minimal (all defaults) ─────────────────────────────
const wm = new WindowManager()
// container: document.body, isolated: false, snap: true

// ── Embedded desktop ──────────────────────────────────
const wm = new WindowManager({
  container: document.getElementById('desktop')!,
  isolated: true,      // windows stay inside container
})

// ── Custom snap settings ───────────────────────────────
const wm = new WindowManager({
  container: document.getElementById('desktop')!,
  isolated: true,
  snap: true,
  snapThreshold: 20,   // snap trigger distance (px)
  snapGap: 6,          // gap between windows when snapped
})

// ── Fine-grained throttle ──────────────────────────────
const wm = new WindowManager({
  throttleMs: 8,       // ~120 fps (default 16 ≈ 60 fps)
})`,
    },
    {
      name: 'runtime.ts',
      lang: 'typescript',
      code: `// ── Runtime updates ───────────────────────────────────
wm.setSnapGap(12)      // update snap gap at any time

// ── Methods ────────────────────────────────────────────
wm.open(config)        // create / restore window
wm.close(id)
wm.minimize(id)
wm.maximize(id)
wm.restore(id)
wm.focus(id)
wm.setTitle(id, title)
wm.getState(id)        // → WindowState snapshot
wm.getBodyElement(id)  // → .dp-body HTMLElement
wm.getWindowIds()      // → string[]
wm.destroy()           // remove all windows + cleanup`,
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
.btn-outline { background: #fff; color: var(--color-text); border: 1px solid var(--color-border); }
.btn-outline:hover { background: #f3f4f6; }
.demo-note { font-size: 12px; color: var(--color-text-muted); margin-top: -4px; }
</style>
