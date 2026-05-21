<template>
  <div class="page">
    <div class="page-badge">
      <span class="badge badge-blue">{{ t('vuecomp.badge') }}</span>
    </div>
    <h1>{{ t('vuecomp.h1') }}</h1>
    <p v-html="t('vuecomp.intro')"></p>

    <DemoViewport ref="viewport" @reset="reset">
      <template #controls>
        <button class="btn" v-for="app in apps" :key="app.id" @click="openApp(app.id)">
          {{ app.icon }} {{ app.label }}
        </button>
      </template>
    </DemoViewport>

    <!-- Taskbar (reactive, driven by windows ref) -->
    <div class="taskbar">
      <span class="taskbar-label">{{ t('vuecomp.taskbarLabel') }}</span>
      <button
        v-for="win in windows"
        :key="win.id"
        class="task-btn"
        :class="{ active: win.state.isActive, minimized: win.state.isMinimized }"
        @click="onTaskClick(win)"
      >{{ win.state.title }}</button>
      <span v-if="!windows.length" class="taskbar-empty">{{ t('vuecomp.noWindows') }}</span>
    </div>

    <!-- Teleport Vue components into WM-managed DOM nodes -->
    <template v-for="win in windows" :key="win.id">
      <Teleport v-if="win.component" :to="win.bodyEl">
        <KeepAlive>
          <component :is="win.component" v-bind="win.props ?? {}" />
        </KeepAlive>
      </Teleport>
    </template>

    <h2>{{ t('vuecomp.h2How') }}</h2>
    <ol>
      <li v-html="t('vuecomp.step1')"></li>
      <li v-html="t('vuecomp.step2')"></li>
      <li v-html="t('vuecomp.step3')"></li>
      <li v-html="t('vuecomp.step4')"></li>
    </ol>

    <h2>{{ t('vuecomp.h2Returns') }}</h2>
    <table class="api-table">
      <thead><tr><th>{{ t('common.name') }}</th><th>{{ t('common.type') }}</th><th>{{ t('common.description') }}</th></tr></thead>
      <tbody>
        <tr><td><code>windows</code></td><td><code>ShallowRef&lt;VueWindowEntry[]&gt;</code></td><td>{{ t('vuecomp.ret.windows') }}</td></tr>
        <tr><td><code>wm</code></td><td><code>WindowManager</code></td><td>{{ t('vuecomp.ret.wm') }}</td></tr>
        <tr><td><code>openVueWindow(config)</code></td><td>—</td><td>{{ t('vuecomp.ret.openVue') }}</td></tr>
        <tr><td><code>close / minimize / maximize / restore / focus / setTitle</code></td><td>—</td><td v-html="t('vuecomp.ret.proxies')"></td></tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, markRaw, defineComponent, h } from 'vue'
import { useWindowManager } from '@webos/adapters/vue/useWindowManager'
import type { VueWindowEntry } from '@webos/adapters/vue/useWindowManager'
import DemoViewport from '../components/DemoViewport.vue'
import { useDocCode } from '../composables/useDocCode'
import { useLocale } from '../composables/useLocale'

const { setCode } = useDocCode()
const { t } = useLocale()
const viewport = ref<InstanceType<typeof DemoViewport> | null>(null)

let wmApi: ReturnType<typeof useWindowManager> | null = null
const windows = ref<VueWindowEntry[]>([])

// ── Inline Vue components for the demo ──
const ClockComp = markRaw(defineComponent({
  setup() {
    const time = ref(new Date().toLocaleTimeString())
    const iv = setInterval(() => { time.value = new Date().toLocaleTimeString() }, 1000)
    return () => h('div', { style: 'padding:20px;text-align:center;' }, [
      h('div', { style: 'font-size:36px;font-weight:300;letter-spacing:0.05em;' }, time.value),
      h('p', { style: 'color:#888;font-size:12px;margin:8px 0 0' }, 'Live clock component'),
    ])
  },
}))

const CounterComp = markRaw(defineComponent({
  setup() {
    const n = ref(0)
    return () => h('div', { style: 'padding:20px;text-align:center;' }, [
      h('p', { style: 'font-size:40px;font-weight:700;margin:0 0 16px;' }, String(n.value)),
      h('div', { style: 'display:flex;gap:8px;justify-content:center;' }, [
        h('button', { onClick: () => n.value--, style: 'padding:6px 18px;font-size:16px;border:1px solid #d1d5db;border-radius:4px;cursor:pointer;' }, '−'),
        h('button', { onClick: () => n.value++, style: 'padding:6px 18px;font-size:16px;background:#0078d4;color:#fff;border:none;border-radius:4px;cursor:pointer;' }, '+'),
      ]),
    ])
  },
}))

const NoteComp = markRaw(defineComponent({
  setup() {
    const text = ref('Type your notes here...')
    return () => h('textarea', {
      value: text.value,
      onInput: (e: Event) => { text.value = (e.target as HTMLTextAreaElement).value },
      style: 'width:100%;height:100%;padding:12px;border:none;resize:none;font-size:13px;outline:none;font-family:inherit;',
    })
  },
}))

const apps = [
  { id: 'clock',   icon: '🕐', label: 'Clock',   component: ClockComp,   title: 'Live Clock',   width: 260, height: 130 },
  { id: 'counter', icon: '🔢', label: 'Counter', component: CounterComp, title: 'Counter',      width: 260, height: 160 },
  { id: 'note',    icon: '📝', label: 'Notes',   component: NoteComp,    title: 'Notes',        width: 300, height: 220 },
]

function openApp(id: string) {
  if (!wmApi) return
  const app = apps.find(a => a.id === id)!
  wmApi.openVueWindow({ id: app.id, title: app.title, component: app.component, width: app.width, height: app.height })
  windows.value = wmApi.windows.value
}

function onTaskClick(win: VueWindowEntry) {
  if (!wmApi) return
  if (win.state.isMinimized) { wmApi.restore(win.id); wmApi.focus(win.id) }
  else if (win.state.isActive) wmApi.minimize(win.id)
  else wmApi.focus(win.id)
}

function reset() {
  wmApi?.destroy()
  windows.value = []
  initWM()
}

function initWM() {
  const container = viewport.value?.container
  if (!container) return
  wmApi = useWindowManager({ container, isolated: true })
  // Keep local ref in sync
  const orig = wmApi.windows
  Object.defineProperty(wmApi, 'windows', {
    get: () => orig,
  })
  // Watch for reactivity sync
  wmApi.wm.events.on('window:opened',    () => { windows.value = wmApi!.windows.value })
  wmApi.wm.events.on('window:closed',    () => { windows.value = wmApi!.windows.value })
  wmApi.wm.events.on('window:minimized', () => { windows.value = wmApi!.windows.value })
  wmApi.wm.events.on('window:maximized', () => { windows.value = wmApi!.windows.value })
  wmApi.wm.events.on('window:restored',  () => { windows.value = wmApi!.windows.value })
  wmApi.wm.events.on('window:focused',   () => { windows.value = wmApi!.windows.value })
}

onMounted(() => {
  initWM()
  setCode([
    {
      name: 'App.vue',
      lang: 'vue',
      code: `<script setup lang="ts">
import { useWindowManager } from '@webos/adapters/vue/useWindowManager'
import ClockWindow from './windows/ClockWindow.vue'
import CounterWindow from './windows/CounterWindow.vue'

// All window state + WM methods — reactive & auto-cleanup on unmount
const { windows, openVueWindow, close, minimize, restore, focus } =
  useWindowManager()

function openClock() {
  openVueWindow({ id: 'clock', title: 'Clock', component: ClockWindow })
}
function openCounter() {
  openVueWindow({ id: 'counter', title: 'Counter', component: CounterWindow })
}

function onTaskbarClick(win) {
  if (win.state.isMinimized) { restore(win.id); focus(win.id) }
  else if (win.state.isActive) minimize(win.id)
  else focus(win.id)
}
<\/script>

<template>
  <!-- Taskbar: reactive list of open windows -->
  <div class="taskbar">
    <button
      v-for="win in windows"
      :key="win.id"
      :class="{ active: win.state.isActive }"
      @click="onTaskbarClick(win)"
    >{{ win.state.title }}</button>
  </div>

  <!-- Teleport Vue components into WM-managed DOM nodes -->
  <template v-for="win in windows" :key="win.id">
    <Teleport v-if="win.component" :to="win.bodyEl">
      <KeepAlive>
        <component :is="win.component" v-bind="win.props ?? {}" />
      </KeepAlive>
    </Teleport>
  </template>

  <button @click="openClock">Open Clock</button>
  <button @click="openCounter">Open Counter</button>
</template>`,
    },
    {
      name: 'ClockWindow.vue',
      lang: 'vue',
      code: `<script setup lang="ts">
import { ref, onUnmounted } from 'vue'

const time = ref(new Date().toLocaleTimeString())
const iv = setInterval(() => { time.value = new Date().toLocaleTimeString() }, 1000)
onUnmounted(() => clearInterval(iv))
<\/script>

<template>
  <div class="clock">
    <div class="time">{{ time }}</div>
  </div>
</template>

<style scoped>
.clock { padding: 20px; text-align: center; }
.time  { font-size: 36px; font-weight: 300; letter-spacing: 0.05em; }
</style>`,
    },
  ])
})
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

/* Taskbar */
.taskbar {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: #f1f5f9;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  margin: 4px 0 20px;
  flex-wrap: wrap;
}
.taskbar-label { font-size: 11px; color: var(--color-text-muted); font-weight: 600; margin-right: 4px; }
.taskbar-empty { font-size: 12px; color: #9ca3af; font-style: italic; }
.task-btn {
  padding: 4px 12px;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  background: #fff;
  font-size: 12px;
  cursor: pointer;
}
.task-btn.active { background: #dbeafe; border-color: #93c5fd; color: #1d4ed8; }
.task-btn.minimized { opacity: 0.6; text-decoration: underline dotted; }

ol li { margin-bottom: 6px; }
</style>
