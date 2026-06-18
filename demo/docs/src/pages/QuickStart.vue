<template>
  <div class="page">
    <div class="page-badge">
      <span class="badge badge-blue">{{ t('quickstart.badge') }}</span>
    </div>
    <h1>{{ t('quickstart.h1') }}</h1>
    <p v-html="t('quickstart.intro')"></p>

    <div class="sample-tabs" role="tablist" aria-label="Quick start framework">
      <button
        v-for="sample in samples"
        :key="sample.id"
        type="button"
        class="sample-tab"
        :class="{ active: activeSample === sample.id }"
        @click="activeSample = sample.id"
      >
        {{ sample.label }}
      </button>
    </div>

    <DemoViewport ref="viewport" @reset="reset">
      <template #controls>
        <button class="btn" @click="openWindow">{{ t('quickstart.openWindow') }}</button>
        <button class="btn" @click="openWindow2">{{ t('quickstart.openAnother') }}</button>
      </template>
    </DemoViewport>

    <div class="sample-note">
      <strong>{{ currentSample.label }}</strong>
      <span>{{ currentSample.description }}</span>
    </div>

    <p v-html="t('quickstart.dedup')"></p>

    <h2>{{ t('quickstart.h2How') }}</h2>
    <ol>
      <li v-html="t('quickstart.step1')"></li>
      <li v-html="t('quickstart.step2')"></li>
      <li v-html="t('quickstart.step3')"></li>
    </ol>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, watch } from 'vue'
import { WindowManager } from '@deskpane/core/WindowManager'
import DemoViewport from '../components/DemoViewport.vue'
import { useDocCode } from '../composables/useDocCode'
import { useLocale } from '../composables/useLocale'

const { setCode } = useDocCode()
const { t } = useLocale()
const viewport = ref<InstanceType<typeof DemoViewport> | null>(null)
let wm: WindowManager | null = null
const activeSample = ref<'vanilla' | 'jquery' | 'vue' | 'react'>('vanilla')

const samples = [
  {
    id: 'vanilla',
    label: 'Vanilla JS',
    description: 'Use DeskPane directly with DOM elements. This is the smallest possible integration surface.',
  },
  {
    id: 'jquery',
    label: 'jQuery',
    description: 'Use the UMD bundle with jQuery-built content. DeskPane does not require a jQuery plugin wrapper.',
  },
  {
    id: 'vue',
    label: 'Vue 3',
    description: 'Use Vue Teleport to render component content into the DeskPane window body.',
  },
  {
    id: 'react',
    label: 'React 18',
    description: 'Use ReactDOM.createPortal to render component content into the DeskPane window body.',
  },
] as const

const currentSample = computed(() =>
  samples.find(sample => sample.id === activeSample.value) ?? samples[0]
)

function initWM() {
  const container = viewport.value?.container
  if (!container) return
  wm = new WindowManager({ container, isolated: true })
}

function reset() {
  wm?.destroy()
  initWM()
}

function openWindow() {
  if (!wm) return
  const div = document.createElement('div')
  div.style.cssText = 'padding:20px;font-size:14px;'
  div.innerHTML = '<h3 style="margin:0 0 8px">👋 Hello, World!</h3><p>This is a DeskPane window.</p>'
  wm.open({ id: 'quick-hello', title: 'Hello Window', content: div, width: 340, height: 180 })
}

function openWindow2() {
  if (!wm) return
  const div = document.createElement('div')
  div.style.cssText = 'padding:20px;'
  div.innerHTML = '<p>I am a second window.</p><p>Drag my header to move me.</p><p>Drag edges to resize.</p>'
  wm.open({ id: 'quick-two', title: 'Second Window', content: div, width: 280, height: 160, x: 120, y: 80 })
}

onMounted(() => {
  initWM()
  setCodeForSample()
})

onUnmounted(() => wm?.destroy())

watch(activeSample, () => setCodeForSample())

function setCodeForSample() {
  if (activeSample.value === 'vue') {
    setCode([
      {
        name: 'App.vue',
        lang: 'vue',
        code: `<template>
  <div ref="desktopEl" class="desktop">
    <button @click="openCounter">Open Counter</button>

    <Teleport
      v-for="win in windows"
      :key="win.id"
      :to="win.bodyEl"
    >
      <KeepAlive>
        <component :is="win.component" />
      </KeepAlive>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useWindowManager } from 'deskpane/vue'
import CounterWindow from './CounterWindow.vue'

const desktopEl = ref<HTMLElement | null>(null)
const { windows, openVueWindow } = useWindowManager({
  container: desktopEl,
  isolated: true,
})

function openCounter() {
  openVueWindow({
    id: 'counter',
    title: 'Counter',
    component: CounterWindow,
    width: 360,
    height: 220,
  })
}
<\/script>`,
      },
      {
        name: 'style.css',
        lang: 'css',
        code: `.desktop {
  width: 100vw;
  height: 100vh;
  position: relative;
}`,
      },
    ])
    return
  }

  if (activeSample.value === 'jquery') {
    setCode([
      {
        name: 'index.html',
        lang: 'html',
        code: `<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="https://unpkg.com/deskpane/dist/styles/deskpane.css">
  <link rel="stylesheet" href="https://unpkg.com/deskpane/dist/themes/light.css">
</head>
<body>
  <div id="desktop" style="width:100vw;height:100vh;position:relative;"></div>

  <script src="https://code.jquery.com/jquery-3.7.1.min.js"><\/script>
  <script src="https://unpkg.com/deskpane/dist/deskpane.umd.min.js"><\/script>
  <script src="./main.js"><\/script>
</body>
</html>`,
      },
      {
        name: 'main.js',
        lang: 'javascript',
        code: `var wm = new window.DeskPane.WindowManager({
  container: document.getElementById('desktop'),
  isolated: true,
  injectStyles: false,
})

function openCustomerForm() {
  var $form = $(\`
    <form class="customer-form">
      <label>
        Customer
        <input name="customer" value="Acme Co.">
      </label>
      <label>
        Status
        <select name="status">
          <option>Active</option>
          <option>Pending</option>
        </select>
      </label>
      <button type="button">Save</button>
    </form>
  \`)

  $form.on('click', 'button', function () {
    alert('Saved: ' + $form.find('[name="customer"]').val())
  })

  wm.open({
    id: 'customer-form',
    title: 'Customer Form',
    content: $form[0],
    width: 360,
    height: 240,
  })
}

openCustomerForm()`,
      },
      {
        name: 'plugin-pattern.js',
        lang: 'javascript',
        code: `// Optional: create your own tiny jQuery helper if your app wants one.
// DeskPane itself stays framework-agnostic.
$.fn.dpOpenWindow = function (wm, config) {
  return this.each(function () {
    wm.open({
      ...config,
      content: this,
    })
  })
}

$('.customer-form').dpOpenWindow(wm, {
  id: 'customer-form',
  title: 'Customer Form',
})`,
      },
    ])
    return
  }

  if (activeSample.value === 'react') {
    setCode([
      {
        name: 'App.tsx',
        lang: 'typescript',
        code: `import { createPortal } from 'react-dom'
import { useWindowManager } from 'deskpane/react'
import CounterWindow from './CounterWindow'

export default function App() {
  const { windows, openReactWindow } = useWindowManager({
    isolated: true,
  })

  return (
    <div className="desktop">
      <button
        onClick={() => openReactWindow({
          id: 'counter',
          title: 'Counter',
          component: CounterWindow,
          width: 360,
          height: 220,
        })}
      >
        Open Counter
      </button>

      {windows.map(win => {
        const Component = win.component
        return Component
          ? createPortal(<Component />, win.bodyEl, win.id)
          : null
      })}
    </div>
  )
}`,
      },
      {
        name: 'App.css',
        lang: 'css',
        code: `.desktop {
  width: 100vw;
  height: 100vh;
  position: relative;
}`,
      },
    ])
    return
  }

  setCode([
    {
      name: 'main.ts',
      lang: 'typescript',
      code: `import { WindowManager } from 'deskpane'

// Create the window manager.
// Pass a container element to run in isolated mode.
const wm = new WindowManager({
  container: document.getElementById('desktop')!,
  isolated: true,
})

const content = document.createElement('div')
content.style.padding = '20px'
content.innerHTML = \`
  <h3>Hello, World!</h3>
  <p>This is a DeskPane window.</p>
\`

wm.open({
  id: 'hello',
  title: 'Hello Window',
  content,
  width: 340,
  height: 180,
})`,
    },
    {
      name: 'index.html',
      lang: 'html',
      code: `<!DOCTYPE html>
<html>
<head>
  <title>Quick Start</title>
</head>
<body>
  <div id="desktop" style="width:100vw;height:100vh;position:relative;"></div>
  <script type="module" src="./main.ts"><\/script>
</body>
</html>`,
    },
  ])
}
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
ol li { margin-bottom: 6px; }

.sample-tabs {
  display: flex;
  gap: 0;
  border-bottom: 2px solid #d4d9de;
  margin: 18px 0 0;
}

.sample-tab {
  border: 0;
  border-right: 1px solid #d4d9de;
  background: #f7f9fb;
  color: #536577;
  padding: 9px 20px;
  font: inherit;
  cursor: pointer;
}

.sample-tab:hover {
  color: #087c98;
  background: #eef8fa;
}

.sample-tab.active {
  background: #fff;
  color: #111827;
  box-shadow: inset 0 -3px 0 #2f9bb3;
}

.sample-note {
  display: flex;
  gap: 10px;
  align-items: baseline;
  padding: 10px 12px;
  border: 1px solid #d4d9de;
  background: #f7f9fb;
  margin: 0 0 16px;
  font-size: 13px;
}

.sample-note strong {
  color: #087c98;
  white-space: nowrap;
}

.sample-note span {
  color: #536577;
}
</style>
