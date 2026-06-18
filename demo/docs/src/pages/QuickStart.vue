<template>
  <div class="page">
    <div class="page-badge">
      <span class="badge badge-blue">{{ t('quickstart.badge') }}</span>
    </div>
    <h1>{{ t('quickstart.h1') }}</h1>
    <p v-html="t('quickstart.intro')"></p>

    <DocSampleLayout>
      <DocSampleTabs
        v-model="activeSample"
        :samples="samples"
        aria-label="Quick start framework"
      />

      <DemoViewport ref="viewport" @reset="reset">
        <template #controls>
          <button class="btn" @click="openWindow">{{ t('quickstart.openWindow') }}</button>
          <button class="btn" @click="openWindow2">{{ t('quickstart.openAnother') }}</button>
        </template>
      </DemoViewport>
    </DocSampleLayout>

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
    description: 'Use the official jQuery adapter: initialize a manager with $.fn.dpWindowManager, then open jQuery-built content with $.fn.dpWindow.',
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
  <script src="https://unpkg.com/deskpane/dist/deskpane-jquery.umd.min.js"><\/script>
  <script src="./main.js"><\/script>
</body>
</html>`,
      },
      {
        name: 'main.js',
        lang: 'javascript',
        code: `$('#desktop').dpWindowManager({
  isolated: true,
  injectStyles: false,
})

function openCustomerForm() {
  $(\`
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
  .on('click', 'button', function () {
    var $form = $(this).closest('form')
    alert('Saved: ' + $form.find('[name="customer"]').val())
  })
  .dpWindow({
    manager: '#desktop',
    id: 'customer-form',
    title: 'Customer Form',
    width: 360,
    height: 240,
  })
}

openCustomerForm()`,
      },
      {
        name: 'plugin-pattern.js',
        lang: 'javascript',
        code: `// The adapter exposes command-style APIs.
$('#desktop').dpWindowManager('open', {
  id: 'plain-window',
  title: 'Plain Window',
  content: $('<div>').text('Opened from a jQuery command')[0],
})

$('#desktop').dpWindowManager('close', 'plain-window')

// Element-to-window helper.
$('.customer-form').dpWindow({
  manager: '#desktop',
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
ol li { margin-bottom: 6px; }

</style>
