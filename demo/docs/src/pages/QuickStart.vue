<template>
  <div class="page">
    <div class="page-badge">
      <span class="badge badge-blue">{{ t('quickstart.badge') }}</span>
    </div>
    <h1>{{ t('quickstart.h1') }}</h1>
    <p v-html="t('quickstart.intro')"></p>

    <DemoViewport ref="viewport" @reset="reset">
      <template #controls>
        <button class="btn" @click="openWindow">{{ t('quickstart.openWindow') }}</button>
        <button class="btn" @click="openWindow2">{{ t('quickstart.openAnother') }}</button>
      </template>
    </DemoViewport>

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
  setCode([
    {
      name: 'main.ts',
      lang: 'typescript',
      code: `import { WindowManager } from '@deskpane/core/WindowManager'

// Create the window manager
// Pass a container element to run in "isolated" mode (confined to that element)
const wm = new WindowManager({
  container: document.getElementById('desktop')!,
  isolated: true,   // windows use position:absolute, constrained to container
})

// Build your content
const content = document.createElement('div')
content.style.padding = '20px'
content.innerHTML = \`
  <h3>Hello, World!</h3>
  <p>This is a DeskPane window.</p>
\`

// Open a window
wm.open({
  id: 'hello',        // unique ID — calling open() again restores & focuses
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
  <!-- Desktop container — give it a size -->
  <div id="desktop" style="width:100vw; height:100vh; position:relative;"></div>

  <script type="module" src="./main.ts"><\/script>
</body>
</html>`,
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
ol li { margin-bottom: 6px; }
</style>
