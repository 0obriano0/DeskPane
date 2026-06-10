<template>
  <div style="width:100vw;height:100vh">
    <div ref="desktopRootEl" style="width:100%;height:100%"></div>

    <!-- Teleport Vue components into DeskPane window body elements -->
    <template v-for="win in windows" :key="win.id">
      <Teleport v-if="win.bodyEl" :to="win.bodyEl">
        <KeepAlive>
          <component :is="win.component" />
        </KeepAlive>
      </Teleport>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, shallowRef, markRaw, onMounted } from 'vue'
import { Desktop } from '@deskpane/desktop'
import { WorkspaceManager, TaskView } from '@deskpane/workspace'
import type { WindowManager } from '@deskpane/core/WindowManager'

import GuideApp   from './windows/GuideApp.vue'
import EditorApp  from './windows/EditorApp.vue'
import TodoApp    from './windows/TodoApp.vue'
import CounterApp from './windows/CounterApp.vue'
import CalcApp    from './windows/CalcApp.vue'

interface WinEntry {
  id: string
  bodyEl: HTMLElement
  component: any
}

const desktopRootEl = ref<HTMLElement | null>(null)
const windows = shallowRef<WinEntry[]>([])

let _wsMgr: WorkspaceManager | null = null

const appDefs = [
  { id: 'guide',   icon: '🧩', label: 'Vue 指南',   title: 'Vue 3 整合指南',    component: markRaw(GuideApp),   width: 520, height: 420, x: 60,  y: 40  },
  { id: 'editor',  icon: '📝', label: '文字編輯',   title: 'Vue 文字編輯器',    component: markRaw(EditorApp),  width: 560, height: 380, x: 100, y: 60  },
  { id: 'todo',    icon: '✅', label: '待辦清單',   title: 'Vue 待辦清單',       component: markRaw(TodoApp),    width: 360, height: 440, x: 140, y: 80  },
  { id: 'counter', icon: '🔢', label: 'Keep-Alive', title: 'Keep-Alive 計數器', component: markRaw(CounterApp), width: 320, height: 380, x: 180, y: 100 },
  { id: 'calc',    icon: '🧮', label: '計算機',     title: 'Vue 計算機',         component: markRaw(CalcApp),    width: 300, height: 400, x: 220, y: 60  },
]

const compMap = new Map(appDefs.map(a => [a.id, a.component]))

function currentWm(): WindowManager {
  const cur = _wsMgr!.current
  if (!cur) throw new Error('No active workspace')
  return _wsMgr!.getWindowManager(cur.id) as unknown as WindowManager
}

function openApp(appId: string) {
  const def = appDefs.find(a => a.id === appId)
  if (!def) return
  const wm = currentWm()
  wm.open({
    id: 'app-' + appId,
    title: def.title,
    slotType: 'vue',
    content: null,
    width: def.width,
    height: def.height,
    x: def.x,
    y: def.y,
  })
}

function syncWindows() {
  try {
    const wm = currentWm()
    windows.value = wm.getWindowIds()
      .map((id: string) => {
        const bodyEl = wm.getBodyElement(id)
        if (!bodyEl) return null
        const appId = id.replace(/^app-/, '')
        const comp = compMap.get(appId)
        if (!comp) return null
        return { id, bodyEl, component: comp } as WinEntry
      })
      .filter((w): w is WinEntry => w !== null) as WinEntry[]
  } catch { /* ignore during init */ }
}

onMounted(() => {
  const desktop = new Desktop({
    container: desktopRootEl.value!,
    dragThreshold: 10,
    dock: { position: 'bottom', showLabels: true, iconSize: 44, items: [] },
    icons: appDefs.map(a => ({
      id: 'icon-' + a.id,
      label: a.label,
      icon: a.icon,
      action: () => openApp(a.id),
    })),
  })

  _wsMgr = new WorkspaceManager(desktop.getElement(), {
    animationMs: 220,
    windowManagerOptions: { isolated: true, snap: true },
  })

  _wsMgr.addWorkspace({ id: 'ws-1', label: '桌面 1' })
  desktop.syncDockWithWindows(_wsMgr.getWindowManager('ws-1') as any)

  _wsMgr.events.on('workspace:switched', ({ to }: { to: string }) => {
    desktop.syncDockWithWindows(_wsMgr!.getWindowManager(to) as any)
  })

  new TaskView(_wsMgr, { dock: desktop.getDock() as any })

  const wm = _wsMgr.getWindowManager('ws-1')
  const EVENTS = [
    'window:opened', 'window:closed', 'window:focused',
    'window:minimized', 'window:maximized', 'window:restored',
  ]
  EVENTS.forEach(ev => (wm as any).events.on(ev, syncWindows))

  openApp('guide')
})
</script>
