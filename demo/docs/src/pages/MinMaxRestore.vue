<template>
  <div class="page">
    <div class="page-badge">
      <span class="badge badge-green">{{ t('minmax.badge') }}</span>
    </div>
    <h1>{{ t('minmax.h1') }}</h1>
    <p v-html="t('minmax.intro')"></p>

    <DocSampleLayout>
      <DocSampleTabs
        v-model="activeSample"
        :samples="samples"
        aria-label="Minimize maximize framework samples"
      />

      <DemoViewport ref="viewport" @reset="reset">
        <template #controls>
          <button class="btn" @click="openDemo">{{ t('minmax.openWindow') }}</button>
          <button class="btn btn-outline" @click="wm?.minimize('demo')">{{ t('common.minimize') }}</button>
          <button class="btn btn-outline" @click="wm?.maximize('demo')">{{ t('common.maximize') }}</button>
          <button class="btn btn-outline" @click="wm?.restore('demo')">{{ t('common.restore') }}</button>
        </template>
      </DemoViewport>
    </DocSampleLayout>

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
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { WindowManager } from '@deskpane/core/WindowManager'
import DemoViewport from '../components/DemoViewport.vue'
import DocSampleLayout from '../components/DocSampleLayout.vue'
import DocSampleTabs from '../components/DocSampleTabs.vue'
import { useDocCode } from '../composables/useDocCode'
import { useLocale } from '../composables/useLocale'

const { setCode } = useDocCode()
const { t } = useLocale()
const viewport = ref<InstanceType<typeof DemoViewport> | null>(null)
let wm: WindowManager | null = null
const activeSample = ref('vanilla')
const samples = [
  { id: 'vanilla', label: 'Vanilla JS', description: 'Call minimize(), maximize(), restore(), and getState() on WindowManager.' },
  { id: 'jquery', label: 'jQuery', description: 'Use dpWindowManager command APIs for state changes.' },
  { id: 'vue', label: 'Vue 3', description: 'Use the Vue composable proxies to control DeskPane windows.' },
  { id: 'react', label: 'React 18', description: 'Use the React hook proxies to control DeskPane windows.' },
] as const

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

function setCodeForSample() {
  if (activeSample.value === 'jquery') {
    setCode([
      {
        name: 'jquery.js',
        lang: 'javascript',
        code: `$('#desktop').dpWindowManager({
  isolated: true,
  injectStyles: false,
})

$('#desktop').dpWindowManager('open', {
  id: 'demo',
  title: 'State Demo',
  content: $('<div>').text('Window content')[0],
})

$('#desktop').dpWindowManager('maximize', 'demo')
$('#desktop').dpWindowManager('minimize', 'demo')
$('#desktop').dpWindowManager('restore', 'demo')`,
      },
    ])
    return
  }

  if (activeSample.value === 'vue') {
    setCode([
      {
        name: 'App.vue',
        lang: 'vue',
        code: `<script setup lang="ts">
import { ref } from 'vue'
import { useWindowManager } from 'deskpane/vue'
import DemoWindow from './DemoWindow.vue'

const desktopEl = ref<HTMLElement | null>(null)
const { openVueWindow, minimize, maximize, restore, getState } = useWindowManager({
  container: desktopEl,
  isolated: true,
})

function openDemo() {
  openVueWindow({
    id: 'demo',
    title: 'State Demo',
    component: DemoWindow,
  })
}

function inspect() {
  console.log(getState('demo'))
}
<\/script>`,
      },
    ])
    return
  }

  if (activeSample.value === 'react') {
    setCode([
      {
        name: 'App.tsx',
        lang: 'typescript',
        code: `import { useWindowManager } from 'deskpane/react'
import DemoWindow from './DemoWindow'

export default function App() {
  const {
    openReactWindow,
    minimize,
    maximize,
    restore,
    getState,
  } = useWindowManager({ isolated: true })

  function openDemo() {
    openReactWindow({
      id: 'demo',
      title: 'State Demo',
      component: DemoWindow,
    })
  }

  return null
}`,
      },
    ])
    return
  }

  setCode([
    {
      name: 'commands.ts',
      lang: 'typescript',
      code: `import { WindowManager } from 'deskpane'

const wm = new WindowManager({
  container: document.getElementById('desktop')!,
  isolated: true,
})

wm.open({ id: 'w1', title: 'My Window', content })

wm.minimize('w1')

wm.maximize('w1')

wm.restore('w1')`,
    },
  ])
}

onMounted(() => {
  initWM()
  openDemo()
  setCodeForSample()
})

watch(activeSample, setCodeForSample)

onUnmounted(() => wm?.destroy())
</script>

<style scoped>
.page { width: 100%; max-width: 100%; }
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
