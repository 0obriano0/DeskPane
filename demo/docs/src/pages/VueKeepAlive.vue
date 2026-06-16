<template>
  <div class="page">
    <div class="page-badge">
      <span class="badge badge-blue">{{ t('keepalive.badge') }}</span>
    </div>
    <h1>{{ t('keepalive.h1') }}</h1>
    <p v-html="t('keepalive.intro')"></p>

    <DemoViewport ref="viewport" @reset="reset">
      <template #controls>
        <button class="btn" @click="openCounter">{{ t('keepalive.openCounter') }}</button>
        <button class="btn btn-outline" @click="wmApi?.minimize('ka-counter')">{{ t('common.minimize') }}</button>
        <button class="btn btn-outline" @click="wmApi?.restore('ka-counter')">{{ t('common.restore') }}</button>
      </template>
    </DemoViewport>

    <!-- Taskbar -->
    <div class="taskbar">
      <span class="taskbar-label">{{ t('keepalive.taskbarLabel') }}</span>
      <button
        v-for="win in windows"
        :key="win.id"
        class="task-btn"
        :class="{ active: win.state.isActive, minimized: win.state.isMinimized }"
        @click="onTaskClick(win)"
      >{{ win.state.title }}</button>
      <span v-if="!windows.length" class="taskbar-empty">{{ t('keepalive.noWindows') }}</span>
    </div>

    <!-- Teleport with KeepAlive -->
    <template v-for="win in windows" :key="win.id">
      <Teleport v-if="win.component" :to="win.bodyEl">
        <KeepAlive>
          <component :is="win.component" v-bind="win.props ?? {}" />
        </KeepAlive>
      </Teleport>
    </template>

    <h2>{{ t('keepalive.h2Try') }}</h2>
    <ol>
      <li v-html="t('keepalive.try1')"></li>
      <li v-html="t('keepalive.try2')"></li>
      <li v-html="t('keepalive.try3')"></li>
    </ol>

    <h2>{{ t('keepalive.h2Comparison') }}</h2>
    <table class="api-table">
      <thead>
        <tr><th></th><th v-html="t('keepalive.th.without')"></th><th v-html="t('keepalive.th.with')"></th></tr>
      </thead>
      <tbody>
        <tr>
          <td>{{ t('keepalive.row1.label') }}</td>
          <td>{{ t('keepalive.row1.without') }}</td>
          <td>{{ t('keepalive.row1.with') }}</td>
        </tr>
        <tr>
          <td>{{ t('keepalive.row2.label') }}</td>
          <td>{{ t('keepalive.row2.without') }}</td>
          <td>{{ t('keepalive.row2.with') }}</td>
        </tr>
        <tr>
          <td>{{ t('keepalive.row3.label') }}</td>
          <td v-html="t('keepalive.row3.without')"></td>
          <td v-html="t('keepalive.row3.with')"></td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, markRaw, defineComponent, h } from 'vue'
import { useWindowManager } from '@deskpane/adapters/vue/useWindowManager'
import type { VueWindowEntry } from '@deskpane/adapters/vue/useWindowManager'
import DemoViewport from '../components/DemoViewport.vue'
import { useDocCode } from '../composables/useDocCode'
import { useLocale } from '../composables/useLocale'

const { setCode } = useDocCode()
const { t } = useLocale()
const viewport = ref<InstanceType<typeof DemoViewport> | null>(null)

let wmApi: ReturnType<typeof useWindowManager> | null = null
const windows = ref<VueWindowEntry[]>([])

// Counter component — state persists via KeepAlive
const CounterComp = markRaw(defineComponent({
  setup() {
    const count = ref(0)
    const log = ref<string[]>(['Counter started'])
    function inc() { count.value++; log.value.unshift(`+1 → ${count.value}`) }
    function dec() { count.value--; log.value.unshift(`-1 → ${count.value}`) }
    function reset2() { log.value.unshift(`reset (was ${count.value})`); count.value = 0 }
    return () => h('div', { style: 'padding:16px;height:100%;display:flex;flex-direction:column;gap:12px;' }, [
      h('div', { style: 'display:flex;align-items:center;gap:16px;' }, [
        h('span', { style: 'font-size:36px;font-weight:700;min-width:60px;' }, String(count.value)),
        h('div', { style: 'display:flex;gap:6px;' }, [
          h('button', { onClick: dec,    style: 'padding:6px 14px;font-size:16px;border:1px solid #d1d5db;border-radius:4px;cursor:pointer;' }, '−'),
          h('button', { onClick: inc,    style: 'padding:6px 14px;font-size:16px;background:#0078d4;color:#fff;border:none;border-radius:4px;cursor:pointer;' }, '+'),
          h('button', { onClick: reset2, style: 'padding:6px 12px;font-size:12px;border:1px solid #d1d5db;border-radius:4px;cursor:pointer;' }, 'Reset'),
        ]),
      ]),
      h('div', { style: 'font-size:11px;color:#888;font-family:monospace;background:#f8fafc;padding:8px;border-radius:4px;overflow-y:auto;flex:1;' },
        log.value.slice(0, 8).map(l => h('div', l))
      ),
      h('p', { style: 'margin:0;font-size:11px;color:#9ca3af;' }, '↑ Minimize and restore — value is preserved!'),
    ])
  },
}))

function openCounter() {
  if (!wmApi) return
  wmApi.openVueWindow({ id: 'ka-counter', title: 'Keep-Alive Counter', component: CounterComp, width: 320, height: 240 })
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
  const sync = () => { windows.value = wmApi!.windows.value }
  wmApi.wm.events.on('window:opened',    sync)
  wmApi.wm.events.on('window:closed',    sync)
  wmApi.wm.events.on('window:minimized', sync)
  wmApi.wm.events.on('window:maximized', sync)
  wmApi.wm.events.on('window:restored',  sync)
  wmApi.wm.events.on('window:focused',   sync)
}

onMounted(() => {
  initWM()
  setCode([
    {
      name: 'App.vue',
      lang: 'vue',
      code: `<script setup lang="ts">
import { useWindowManager } from '@deskpane/adapters/vue/useWindowManager'
import CounterWindow from './CounterWindow.vue'

const { windows, openVueWindow, minimize, restore, focus } = useWindowManager()

openVueWindow({
  id: 'counter',
  title: 'Keep-Alive Counter',
  component: CounterWindow,
  width: 320, height: 240,
})
<\/script>

<template>
  <template v-for="win in windows" :key="win.id">
    <Teleport v-if="win.component" :to="win.bodyEl">
      <!--
        KeepAlive wraps the component.
        On minimize → onDeactivated() fires, state preserved.
        On restore  → onActivated() fires, state still there.
      -->
      <KeepAlive>
        <component :is="win.component" v-bind="win.props ?? {}" />
      </KeepAlive>
    </Teleport>
  </template>
</template>`,
    },
    {
      name: 'CounterWindow.vue',
      lang: 'vue',
      code: `<script setup lang="ts">
import { ref, onActivated, onDeactivated } from 'vue'

// This state PERSISTS across minimize/restore cycles thanks to KeepAlive
const count = ref(0)

// KeepAlive lifecycle hooks (instead of onMounted/onUnmounted)
onActivated(() => {
  console.log('window restored — count is still', count.value)
})
onDeactivated(() => {
  console.log('window minimized — count preserved:', count.value)
})
<\/script>

<template>
  <div class="counter-window">
    <span class="count">{{ count }}</span>
    <div class="btns">
      <button @click="count--">−</button>
      <button @click="count++">+</button>
    </div>
    <p>Minimize and restore — value stays!</p>
  </div>
</template>`,
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
.btn-outline { background: #fff; color: var(--color-text); border: 1px solid var(--color-border); }
.btn-outline:hover { background: #f3f4f6; }

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
.task-btn.active    { background: #dbeafe; border-color: #93c5fd; color: #1d4ed8; }
.task-btn.minimized { opacity: 0.6; text-decoration: underline dotted; }
ol li { margin-bottom: 6px; }
</style>
