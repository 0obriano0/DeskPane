<template>
  <div class="page">
    <div class="page-badge">
      <span class="badge badge-green">{{ t('openclose.badge') }}</span>
    </div>
    <h1>{{ t('openclose.h1') }}</h1>
    <p v-html="t('openclose.intro')"></p>

    <DemoViewport ref="viewport" @reset="reset">
      <template #controls>
        <button class="btn" v-for="n in [1,2,3]" :key="n" @click="openWin(n)">
          {{ t('openclose.openWin') }} {{ n }}
        </button>
        <button class="btn btn-outline" @click="openFixed">{{ t('openclose.fixedWin') }}</button>
        <button class="btn btn-danger" @click="wm?.destroy()">{{ t('openclose.closeAll') }}</button>
      </template>
    </DemoViewport>

    <h2>{{ t('openclose.h2Open') }}</h2>
    <table class="api-table">
      <thead><tr><th>{{ t('openclose.th.behaviour') }}</th><th>{{ t('common.description') }}</th></tr></thead>
      <tbody>
        <tr>
          <td>{{ t('openclose.newId') }}</td>
          <td>{{ t('openclose.newId.desc') }}</td>
        </tr>
        <tr>
          <td>{{ t('openclose.existId') }}</td>
          <td v-html="t('openclose.existId.desc')"></td>
        </tr>
        <tr>
          <td>{{ t('openclose.retVal') }}</td>
          <td v-html="t('openclose.retVal.desc')"></td>
        </tr>
      </tbody>
    </table>

    <h2>{{ t('openclose.h2Config') }}</h2>
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
        <tr><td><code>id</code></td><td><code>string</code></td><td>—</td><td v-html="t('openclose.cfg.id')"></td></tr>
        <tr><td><code>title</code></td><td><code>string</code></td><td>—</td><td v-html="t('openclose.cfg.title')"></td></tr>
        <tr><td><code>content</code></td><td><code>HTMLElement</code></td><td>—</td><td v-html="t('openclose.cfg.content')"></td></tr>
        <tr><td><code>x, y</code></td><td><code>number</code></td><td>cascade</td><td v-html="t('openclose.cfg.xy')"></td></tr>
        <tr><td><code>width, height</code></td><td><code>number</code></td><td><code>400 / 300</code></td><td v-html="t('openclose.cfg.size')"></td></tr>
        <tr><td><code>resizable</code></td><td><code>boolean</code></td><td><code>true</code></td><td v-html="t('openclose.cfg.resizable')"></td></tr>
      </tbody>
    </table>

    <h2>{{ t('openclose.h2Close') }}</h2>
    <p>{{ t('openclose.closeDesc') }}</p>
    <p v-html="t('openclose.closeAllDesc')"></p>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { WindowManager } from '@webos/core/WindowManager'
import DemoViewport from '../components/DemoViewport.vue'
import { useDocCode } from '../composables/useDocCode'
import { useLocale } from '../composables/useLocale'

const { setCode } = useDocCode()
const { t } = useLocale()
const viewport = ref<InstanceType<typeof DemoViewport> | null>(null)
let wm: WindowManager | null = null

const TITLES = ['Sales Report', 'User Settings', 'Log Viewer']
const ICONS  = ['📊', '⚙️', '📋']

function initWM() {
  const container = viewport.value?.container
  if (!container) return
  wm = new WindowManager({ container, isolated: true })
}

function reset() { wm?.destroy(); initWM() }

function openWin(n: number) {
  if (!wm) return
  const id = `win-${n}`
  const body = document.createElement('div')
  body.style.cssText = 'padding:16px;'
  body.innerHTML = `<p style="margin:0;font-size:24px">${ICONS[n-1]}</p>
    <p><strong>${TITLES[n-1]}</strong></p>
    <p style="color:#888;font-size:12px">id: "${id}"</p>`
  wm.open({ id, title: TITLES[n-1], content: body, width: 260, height: 160 })
}

function openFixed() {
  if (!wm) return
  const body = document.createElement('div')
  body.style.cssText = 'padding:16px;font-size:13px;line-height:1.7;'
  body.innerHTML = `<p style="margin:0 0 8px"><strong>🔒 Fixed-size window</strong></p>
    <p style="margin:0;color:#888;font-size:12px">resizable: false — drag the border or click the maximize button: both are disabled.</p>`
  wm.open({ id: 'fixed-dialog', title: '🔒 Fixed Dialog', content: body, width: 300, height: 150, resizable: false })
}

onMounted(() => {
  initWM()
  setCode([
    {
      name: 'main.ts',
      lang: 'typescript',
      code: `import { WindowManager } from '@webos/core/WindowManager'

const wm = new WindowManager()

// ── open() ────────────────────────────────────────────
const content = document.createElement('div')
content.textContent = 'Window content'

const state = wm.open({
  id: 'report',          // unique identifier
  title: 'Sales Report',
  content,
  x: 80,   y: 60,        // initial position (optional — cascades if omitted)
  width: 480, height: 360,
})

// Calling open() again with the same id:
// → restores if minimized, then focuses. No duplicate window created.
wm.open({ id: 'report', title: 'Sales Report', content })

// ── Fixed-size window (resizable: false) ──────────────
wm.open({
  id: 'dialog',
  title: 'Alert',
  content,
  width: 360, height: 200,
  resizable: false,       // disables maximize button + border-drag resize
})

// ── close() ───────────────────────────────────────────
wm.close('report')    // remove one window

// ── destroy() — close all ──────────────────────────────
wm.destroy()`,
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
.btn-outline { background: transparent; color: var(--color-text); border: 1px solid var(--color-border); }
.btn-outline:hover { background: var(--color-bg-soft, #f3f4f6); }
.btn-danger { background: #dc2626; }
.btn-danger:hover { background: #b91c1c; }
</style>
