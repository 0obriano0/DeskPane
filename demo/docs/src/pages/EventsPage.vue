<template>
  <div class="page">
    <div class="page-badge">
      <span class="badge badge-green">{{ t('events.badge') }}</span>
    </div>
    <h1>{{ t('events.h1') }}</h1>
    <p v-html="t('events.intro')"></p>

    <DemoViewport ref="viewport" @reset="onReset">
      <template #controls>
        <button class="btn" @click="openWindow">{{ t('events.openWindow') }}</button>
        <button class="btn btn-outline" @click="wm?.minimize('evt-demo')">{{ t('common.minimize') }}</button>
        <button class="btn btn-outline" @click="wm?.maximize('evt-demo')">{{ t('common.maximize') }}</button>
        <button class="btn btn-outline" @click="wm?.restore('evt-demo')">{{ t('common.restore') }}</button>
        <button class="btn btn-danger" @click="wm?.close('evt-demo')">{{ t('common.close') }}</button>
      </template>
    </DemoViewport>

    <!-- Event log inside the page (outside the demo viewport) -->
    <div class="event-log" ref="logEl">
      <div class="event-log-header">
        <span>{{ t('events.logTitle') }}</span>
        <button class="clear-btn" @click="logs = []">{{ t('common.clear') }}</button>
      </div>
      <div class="event-log-body">
        <div v-if="!logs.length" class="log-empty">{{ t('events.logEmpty') }}</div>
        <div
          v-for="(entry, i) in logs"
          :key="i"
          class="log-entry"
          :class="entry.type"
        >
          <span class="log-time">{{ entry.time }}</span>
          <span class="log-event">{{ entry.event }}</span>
          <span class="log-id">[{{ entry.id }}]</span>
        </div>
      </div>
    </div>

    <h2>{{ t('events.h2All') }}</h2>
    <table class="api-table">
      <thead><tr><th>{{ t('common.event') }}</th><th>{{ t('events.th.when') }}</th><th>{{ t('common.payload') }}</th></tr></thead>
      <tbody>
        <tr v-for="ev in EVENT_DOCS" :key="ev.name">
          <td><code>{{ ev.name }}</code></td>
          <td>{{ ev.when }}</td>
          <td><code>{{ ev.payload }}</code></td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { WindowManager } from '@deskpane/core/WindowManager'
import type { WinEvent } from '@deskpane/core/WindowManager'
import DemoViewport from '../components/DemoViewport.vue'
import { useDocCode } from '../composables/useDocCode'
import { useLocale } from '../composables/useLocale'

const { setCode } = useDocCode()
const { t } = useLocale()
const viewport = ref<InstanceType<typeof DemoViewport> | null>(null)
const logEl = ref<HTMLElement | null>(null)
let wm: WindowManager | null = null

interface LogEntry { time: string; event: string; id: string; type: string }
const logs = ref<LogEntry[]>([])

const EVENT_DOCS = computed(() => [
  { name: 'window:opened',    when: t('events.opened.when'),    payload: 'WindowState' },
  { name: 'window:closed',    when: t('events.closed.when'),    payload: '{ id }' },
  { name: 'window:focused',   when: t('events.focused.when'),   payload: 'WindowState' },
  { name: 'window:minimized', when: t('events.minimized.when'), payload: 'WindowState' },
  { name: 'window:maximized', when: t('events.maximized.when'), payload: 'WindowState' },
  { name: 'window:restored',  when: t('events.restored.when'),  payload: 'WindowState' },
  { name: 'window:maximized-drag-restored', when: t('events.maximizedDragRestored.when'), payload: 'WindowState' },
  { name: 'window:edge-snapped', when: t('events.edgeSnapped.when'), payload: 'EdgeSnapEvent' },
  { name: 'window:moved',     when: t('events.moved.when'),     payload: 'WindowState' },
  { name: 'window:resized',   when: t('events.resized.when'),   payload: 'WindowState' },
  { name: 'window:child-opened', when: t('events.childOpened.when'), payload: '{ parentId, childId }' },
  { name: 'window:child-closed', when: t('events.childClosed.when'), payload: '{ parentId, childId }' },
])

const EVENT_COLORS: Record<string, string> = {
  'window:opened': 'green', 'window:closed': 'red', 'window:focused': 'blue',
  'window:minimized': 'orange', 'window:maximized': 'purple', 'window:restored': 'teal',
  'window:maximized-drag-restored': 'teal',
  'window:edge-snapped': 'purple',
  'window:moved': 'gray', 'window:resized': 'gray',
  'window:child-opened': 'indigo', 'window:child-closed': 'indigo',
}

const ALL_EVENTS: WinEvent[] = [
  'window:opened', 'window:closed', 'window:focused',
  'window:minimized', 'window:maximized', 'window:restored',
  'window:maximized-drag-restored', 'window:edge-snapped',
  'window:moved', 'window:resized',
  'window:child-opened', 'window:child-closed',
]

function now() {
  return new Date().toLocaleTimeString('zh-TW', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function initWM() {
  const container = viewport.value?.container
  if (!container) return
  wm = new WindowManager({ container, isolated: true })
  ALL_EVENTS.forEach(ev => {
    wm!.events.on(ev, (data: any) => {
      logs.value.unshift({
        time: now(),
        event: ev,
        id: data?.id ?? data?.childId ?? '',
        type: EVENT_COLORS[ev] ?? 'gray',
      })
      if (logs.value.length > 20) logs.value.pop()
    })
  })
}

function onReset() { logs.value = []; wm?.destroy(); initWM() }

function openWindow() {
  if (!wm) return
  const body = document.createElement('div')
  body.style.cssText = 'padding:16px;'
  body.innerHTML = '<p>Interact with me — drag, resize, minimize, maximize, close.</p><p>Watch the event log below!</p>'
  wm.open({ id: 'evt-demo', title: 'Event Demo', content: body, width: 340, height: 160 })
}

onMounted(() => {
  initWM()
  openWindow()
  setCode([
    {
      name: 'main.ts',
      lang: 'typescript',
      code: `import { WindowManager } from '@deskpane/core/WindowManager'
import type { WinEvent, WindowState } from '@deskpane/core/WindowManager'

const wm = new WindowManager()

// ── Subscribe to a single event ───────────────────────
wm.events.on('window:opened', (state: WindowState) => {
  console.log('opened:', state.id, state.title)
})

wm.events.on('window:closed', (data: { id: string }) => {
  console.log('closed:', data.id)
})

// ── Subscribe to all events ───────────────────────────
const ALL_EVENTS: WinEvent[] = [
  'window:opened',    'window:closed',
  'window:focused',   'window:minimized',
  'window:maximized', 'window:restored',
  'window:maximized-drag-restored', 'window:edge-snapped',
  'window:moved',     'window:resized',
  'window:child-opened', 'window:child-closed',
]

ALL_EVENTS.forEach(ev => {
  wm.events.on(ev, (data: any) => {
    const id = data.id ?? data.childId ?? ''
    console.log(\`[\${ev}] id=\${id}\`)
  })
})

// ── Unsubscribe ───────────────────────────────────────
const handler = (s: WindowState) => console.log(s)
wm.events.on('window:focused', handler)
wm.events.off('window:focused', handler)`,
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
.btn-danger { background: #dc2626; }
.btn-danger:hover { background: #b91c1c; }

/* Event log */
.event-log {
  border: 1px solid var(--color-border);
  border-radius: 6px;
  overflow: hidden;
  margin: 8px 0 20px;
}
.event-log-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 12px;
  background: #1e1e2e;
  color: #a6adc8;
  font-size: 12px;
  font-weight: 600;
}
.clear-btn {
  background: none;
  border: 1px solid #45475a;
  color: #a6adc8;
  padding: 2px 8px;
  border-radius: 3px;
  cursor: pointer;
  font-size: 11px;
}
.clear-btn:hover { background: #313244; }
.event-log-body {
  max-height: 180px;
  overflow-y: auto;
  background: #11111b;
  padding: 8px 12px;
}
.log-empty { color: #585b70; font-size: 12px; font-family: monospace; }
.log-entry {
  display: flex;
  gap: 10px;
  font-size: 12px;
  font-family: 'Cascadia Code', monospace;
  line-height: 1.8;
}
.log-time { color: #585b70; flex-shrink: 0; }
.log-event { font-weight: 600; }
.log-id { color: #6272a4; }
.green .log-event  { color: #a6e3a1; }
.red .log-event    { color: #f38ba8; }
.blue .log-event   { color: #89b4fa; }
.orange .log-event { color: #fab387; }
.purple .log-event { color: #cba6f7; }
.teal .log-event   { color: #94e2d5; }
.gray .log-event   { color: #6c7086; }
</style>
