<template>
  <div class="page">
    <div class="page-badge">
      <span class="badge badge-green">{{ t('minmax.badge') }}</span>
    </div>
    <h1>{{ t('minmax.h1') }}</h1>
    <p v-html="t('minmax.intro')"></p>

    <DemoViewport ref="viewport" @reset="reset">
      <template #controls>
        <button class="btn" @click="openDemo">{{ t('minmax.openWindow') }}</button>
        <button class="btn btn-outline" @click="wm?.minimize('demo')">{{ t('common.minimize') }}</button>
        <button class="btn btn-outline" @click="wm?.maximize('demo')">{{ t('common.maximize') }}</button>
        <button class="btn btn-outline" @click="wm?.restore('demo')">{{ t('common.restore') }}</button>
      </template>
    </DemoViewport>

    <h2>{{ t('minmax.h2State') }}</h2>
    <pre class="state-diagram">
  ┌─────────────┐  minimize()   ┌─────────────┐
  │  Normal     │──────────────▶│  Minimized  │
  │  (floating) │◀──────────────│             │
  └──────┬──────┘   restore()   └─────────────┘
         │                             ▲
         │ maximize()                  │ restore()
         ▼                             │  (returns to maximized if was maximized)
  ┌─────────────┐  minimize()   ┌──────┴──────┐
  │  Maximized  │──────────────▶│  Min+Max    │
  │  (fills     │               │  (was max)  │
  │   container)│◀──────────────└─────────────┘
  └─────────────┘   restore()
    </pre>

    <h2>{{ t('minmax.h2Api') }}</h2>
    <table class="api-table">
      <thead><tr><th>{{ t('common.method') }}</th><th>{{ t('minmax.th.stateChange') }}</th></tr></thead>
      <tbody>
        <tr>
          <td><code>wm.minimize(id)</code></td>
          <td v-html="t('minmax.min.desc')"></td>
        </tr>
        <tr>
          <td><code>wm.maximize(id)</code></td>
          <td v-html="t('minmax.max.desc')"></td>
        </tr>
        <tr>
          <td><code>wm.restore(id)</code></td>
          <td v-html="t('minmax.restore.desc')"></td>
        </tr>
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

function initWM() {
  const container = viewport.value?.container
  if (!container) return
  wm = new WindowManager({ container, isolated: true })
}

function reset() { wm?.destroy(); initWM() }

function openDemo() {
  if (!wm) return
  const body = document.createElement('div')
  body.style.cssText = 'padding:16px;'
  body.innerHTML = `
    <p>Use the buttons above to:</p>
    <ul style="margin:8px 0;padding-left:20px;">
      <li>Minimize — hides this window</li>
      <li>Maximize — fills the demo area</li>
      <li>Restore — returns to this size</li>
    </ul>
    <p style="color:#888;font-size:12px">
      Try: maximize → minimize → restore<br>
      → should return to maximized state!
    </p>`
  wm.open({ id: 'demo', title: 'State Demo Window', content: body, width: 360, height: 220 })
}

onMounted(() => {
  initWM()
  openDemo()
  setCode([
    {
      name: 'main.ts',
      lang: 'typescript',
      code: `import { WindowManager } from '@deskpane/core/WindowManager'

const wm = new WindowManager()

// Open a window first
wm.open({ id: 'w1', title: 'My Window', content })

// Minimize — hides the window (DOM preserved, state intact)
wm.minimize('w1')

// Maximize — fills available space
// Saves current geometry for later restore
wm.maximize('w1')

// Restore:
//   • If was only minimized → returns to floating size
//   • If was maximized when minimized → returns to MAXIMIZED
//     (smart restore — state machine aware)
wm.restore('w1')

// ── State inspection ──────────────────────────────────
const state = wm.getState('w1')
// state.isMinimized  boolean
// state.isMaximized  boolean
// state.isActive     boolean
// state.x, state.y, state.width, state.height`,
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
.btn-outline {
  background: #fff;
  color: var(--color-text);
  border: 1px solid var(--color-border);
}
.btn-outline:hover { background: #f3f4f6; }

.state-diagram {
  background: #f8fafc;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 16px;
  font-family: 'Cascadia Code', 'Consolas', monospace;
  font-size: 12px;
  line-height: 1.5;
  overflow-x: auto;
  color: #374151;
}
</style>
