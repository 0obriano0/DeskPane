<template>
  <!-- ── 全螢幕桌面背景 ── -->
  <div class="desktop">

    <!-- ══════════════════════════════════════════
         左側應用程式 Dock
    ═══════════════════════════════════════════ -->
    <nav id="app-dock">
      <button
        v-for="app in appList"
        :key="app.id"
        class="dock-item"
        :class="{ running: openIds.has(app.id) }"
        :title="app.title"
        @click="openApp(app.id)"
      >
        <span class="dock-icon">{{ app.icon }}</span>
        <span class="dock-label">{{ app.label }}</span>
      </button>

      <div class="dock-separator" />

      <button class="dock-item" title="關閉全部" @click="destroyAll">
        <span class="dock-icon">💣</span>
        <span class="dock-label">關閉全部</span>
      </button>

      <div class="dock-separator" />

      <button class="dock-item" :title="currentTheme === 'light' ? '切換暗色' : '切換亮色'" @click="toggleTheme">
        <span class="dock-icon">{{ currentTheme === 'light' ? '🌙' : '☀️' }}</span>
        <span class="dock-label">{{ currentTheme === 'light' ? '暗色' : '亮色' }}</span>
      </button>
    </nav>

    <!-- ══════════════════════════════════════════
         下方任務列
    ═══════════════════════════════════════════ -->
    <div id="taskbar">
      <button
        v-for="win in windows"
        :key="win.id"
        class="task-item"
        :class="{ active: win.state.isActive, minimized: win.state.isMinimized }"
        @click="onTaskbarClick(win)"
      >
        <span class="task-icon">{{ getIcon(win.id) }}</span>
        {{ win.state.title }}
      </button>
    </div>

    <!-- ══════════════════════════════════════════
         事件 Log（左下角）
    ═══════════════════════════════════════════ -->
    <div id="event-log">
      <p v-for="(entry, i) in logs" :key="i">{{ entry }}</p>
    </div>

    <!-- ══════════════════════════════════════════
         Vue 元件 Teleport：渲染進 WM 管理的 DOM body
         KeepAlive 確保最小化後元件狀態完整保留
    ═══════════════════════════════════════════ -->
    <template v-for="win in windows" :key="win.id">
      <Teleport v-if="win.component" :to="win.bodyEl">
        <KeepAlive>
          <component :is="win.component" v-bind="win.props ?? {}" />
        </KeepAlive>
      </Teleport>
    </template>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, markRaw } from 'vue'
import { useWindowManager } from '@webos/adapters/vue/useWindowManager'
import type { VueWindowEntry } from '@webos/adapters/vue/useWindowManager'
import { setTheme } from '@webos/themes/setTheme'

// ── 匯入所有 .vue 視窗元件 ──
import GuideApp   from './windows/GuideApp.vue'
import EditorApp  from './windows/EditorApp.vue'
import TodoApp    from './windows/TodoApp.vue'
import TableApp   from './windows/TableApp.vue'
import CounterApp from './windows/CounterApp.vue'

// ── 初始化 WindowManager Composable ──
const { wm, windows, openVueWindow, close, minimize, restore, focus, destroy } =
  useWindowManager({ throttleMs: 16, snap: true })

// ── Event Log ──
const logs = ref<string[]>(['📡 Event Log'])
const SYNC_EVENTS = [
  'window:opened', 'window:closed', 'window:focused',
  'window:minimized', 'window:maximized', 'window:restored',
] as const
SYNC_EVENTS.forEach(ev => {
  wm.events.on(ev, (d: any) => {
    logs.value = [`▶ ${ev} [${d?.id ?? ''}]`, ...logs.value.slice(0, 39)]
  })
})

// ── 應用程式清單 ──
interface AppDef {
  id: string
  label: string
  icon: string
  title: string
  component: any
  width?: number; height?: number; x?: number; y?: number
}

const appList: AppDef[] = [
  { id: 'guide',   label: 'Composable', icon: '🧩', title: 'useWindowManager 指南',  component: markRaw(GuideApp),   width: 480, height: 380, x: 80,  y: 40  },
  { id: 'editor',  label: '文字',       icon: '📝', title: 'Vue 文字編輯器',          component: markRaw(EditorApp),  width: 420, height: 320, x: 120, y: 60  },
  { id: 'todo',    label: '待辦',       icon: '✅', title: 'Vue 待辦清單',             component: markRaw(TodoApp),    width: 360, height: 420, x: 160, y: 80  },
  { id: 'table',   label: '資料表',     icon: '📊', title: 'Vue 資料表格',             component: markRaw(TableApp),   width: 500, height: 360, x: 200, y: 60  },
  { id: 'counter', label: '計數器',     icon: '🔢', title: 'Keep-Alive 計數器',        component: markRaw(CounterApp), width: 300, height: 300, x: 240, y: 100 },
]

const appMap = Object.fromEntries(appList.map(a => [a.id, a]))

// ── Dock 小圓點：已開啟的視窗 ID 集合 ──
const openIds = computed(() => new Set(windows.value.map((w: VueWindowEntry) => w.id)))

function getIcon(id: string) {
  return appMap[id]?.icon ?? '🪟'
}

function openApp(appId: string) {
  const app = appMap[appId]
  if (!app) return
  openVueWindow({
    id:        app.id,
    title:     app.title,
    component: app.component,
    width:     app.width,
    height:    app.height,
    x:         app.x,
    y:         app.y,
  })
}

function onTaskbarClick(win: VueWindowEntry) {
  if (win.state.isMinimized) {
    restore(win.id)
    focus(win.id)
  } else if (win.state.isActive) {
    minimize(win.id)
  } else {
    focus(win.id)
  }
}

function destroyAll() {
  destroy()
}

// ── Theme ──
const currentTheme = ref<'light' | 'dark'>('light')
setTheme('light', { basePath: '/themes' })

function toggleTheme() {
  const next = currentTheme.value === 'light' ? 'dark' : 'light'
  currentTheme.value = next
  setTheme(next, { basePath: '/themes' })
}

// ── 啟動時開啟指南視窗 ──
openApp('guide')
</script>

<style>
* { box-sizing: border-box; }
html, body { margin: 0; height: 100%; overflow: hidden; }
body {
  font-family: 'Segoe UI', sans-serif;
  background: linear-gradient(135deg, #1a2a4a 0%, #2d4a7a 100%);
  height: 100vh;
}
</style>

<style scoped>
.desktop { width: 100vw; height: 100vh; overflow: hidden; }

/* ── Dock ── */
#app-dock {
  position: fixed;
  left: 0; top: 0; bottom: 48px;
  width: 72px;
  background: rgba(0,0,0,0.35);
  backdrop-filter: blur(14px);
  border-right: 1px solid rgba(255,255,255,0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 12px 0;
  z-index: 9997;
  overflow-y: auto;
}
.dock-item {
  width: 52px; height: 52px;
  border-radius: 12px;
  border: none;
  background: rgba(255,255,255,0.1);
  color: #fff;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  transition: background 0.15s, transform 0.1s;
  position: relative;
}
.dock-item:hover { background: rgba(255,255,255,0.25); transform: scale(1.1); }
.dock-icon { font-size: 22px; line-height: 1; }
.dock-label { font-size: 9px; color: rgba(255,255,255,0.8); white-space: nowrap; }
.dock-item.running::after {
  content: '';
  position: absolute;
  bottom: 4px; left: 50%;
  transform: translateX(-50%);
  width: 5px; height: 5px;
  border-radius: 50%;
  background: #4fc3f7;
}
.dock-separator {
  width: 40px; height: 1px;
  background: rgba(255,255,255,0.15);
  margin: 4px 0;
}

/* ── Taskbar ── */
#taskbar {
  position: fixed;
  bottom: 0; left: 72px; right: 0;
  height: 48px;
  background: rgba(0,0,0,0.45);
  backdrop-filter: blur(12px);
  border-top: 1px solid rgba(255,255,255,0.12);
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0 10px;
  z-index: 9998;
  overflow-x: auto;
}
.task-item {
  height: 34px;
  max-width: 180px; min-width: 80px;
  padding: 0 12px;
  border-radius: 6px;
  border: 1px solid rgba(255,255,255,0.15);
  background: rgba(255,255,255,0.08);
  color: rgba(255,255,255,0.85);
  font-size: 12px;
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: background 0.15s;
  display: flex;
  align-items: center;
  gap: 6px;
}
.task-item:hover { background: rgba(255,255,255,0.2); }
.task-item.active { background: rgba(74,144,226,0.5); border-color: rgba(74,144,226,0.8); }
.task-item.minimized { opacity: 0.55; text-decoration: underline dotted; }
.task-icon { font-size: 14px; flex-shrink: 0; }

/* ── Event Log ── */
#event-log {
  position: fixed;
  bottom: 52px; left: 4px;
  width: 200px; max-height: 180px;
  overflow-y: auto;
  background: rgba(0,0,0,0.6);
  backdrop-filter: blur(8px);
  border-radius: 8px;
  padding: 8px 10px;
  color: #b0ffb0;
  font-size: 10px;
  font-family: monospace;
  z-index: 9997;
}
#event-log p { margin: 2px 0; }
</style>
