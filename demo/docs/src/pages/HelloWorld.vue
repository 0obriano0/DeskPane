<template>
  <div class="page">
    <div class="page-badge">
      <span class="badge badge-gray">{{ t('hello.badge') }}</span>
    </div>
    <h1>{{ t('hello.h1') }}</h1>
    <p v-html="t('hello.intro')"></p>

    <DemoViewport ref="viewport" @reset="reset">
      <template #controls>
        <button class="btn" @click="openHello">{{ t('hello.openHello') }}</button>
      </template>
    </DemoViewport>

    <h2>{{ t('hello.h2Notes') }}</h2>
    <ul>
      <li v-html="t('hello.note1')"></li>
      <li v-html="t('hello.note2')"></li>
      <li>{{ t('hello.note3') }}</li>
      <li v-html="t('hello.note4')"></li>
    </ul>
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

function openHello() {
  if (!wm) return
  const content = document.createElement('div')
  content.style.cssText = 'padding:24px; text-align:center;'
  content.innerHTML = `
    <div style="font-size:48px;margin-bottom:8px">👋</div>
    <h2 style="margin:0 0 8px;font-size:18px">Hello, World!</h2>
    <p style="color:#888;margin:0">Built with DeskPane</p>`
  wm.open({
    id: 'hello-world',
    title: 'Hello World',
    content,
    width: 280,
    height: 200,
    x: 60,
    y: 50,
  })
}

onMounted(() => {
  initWM()
  setCode([
    {
      name: 'main.ts',
      lang: 'typescript',
      code: `import { WindowManager } from '@deskpane/core/WindowManager'

// Create the window manager
const wm = new WindowManager()

// Build content — any HTMLElement works
const content = document.createElement('div')
content.style.cssText = 'padding: 24px; text-align: center;'
content.innerHTML = \`
  <div style="font-size: 48px; margin-bottom: 8px">👋</div>
  <h2>Hello, World!</h2>
  <p>Built with DeskPane</p>
\`

// Open the window
wm.open({
  id: 'hello-world',   // unique ID
  title: 'Hello World',
  content,
  width: 280,
  height: 200,
  x: 60,               // optional: initial left position
  y: 50,               // optional: initial top position
})

// Close it later
// wm.close('hello-world')`,
    },
    {
      name: 'index.html',
      lang: 'html',
      code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Hello World — DeskPane</title>
</head>
<body style="margin:0; width:100vw; height:100vh; overflow:hidden;">
  <!-- No container needed — defaults to document.body -->
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
}
.btn:hover { background: var(--color-primary-hover); }
ul li { margin-bottom: 6px; }
</style>
