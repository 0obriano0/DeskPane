import { useRef, useEffect, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Desktop } from '@deskpane/desktop'
import { WorkspaceManager, TaskView } from '@deskpane/workspace'

import GuideApp   from './windows/GuideApp'
import EditorApp  from './windows/EditorApp'
import TodoApp    from './windows/TodoApp'
import CounterApp from './windows/CounterApp'
import CalcApp    from './windows/CalcApp'

interface WinEntry {
  workspaceId: string
  id: string
  bodyEl: HTMLElement
  component: React.ComponentType<any>
}

const APP_DEFS = [
  { id: 'guide',   icon: '⚛️', label: 'React 指南', title: 'React 整合指南',    component: GuideApp,   width: 520, height: 420, x: 60,  y: 40  },
  { id: 'editor',  icon: '📝', label: '文字編輯',   title: 'React 文字編輯器',   component: EditorApp,  width: 560, height: 380, x: 100, y: 60  },
  { id: 'todo',    icon: '✅', label: '待辦清單',   title: 'React 待辦清單',      component: TodoApp,    width: 360, height: 440, x: 140, y: 80  },
  { id: 'counter', icon: '🔢', label: 'Counter',    title: 'React 計數器',        component: CounterApp, width: 300, height: 320, x: 180, y: 100 },
  { id: 'calc',    icon: '🧮', label: '計算機',     title: 'React 計算機',        component: CalcApp,    width: 300, height: 400, x: 220, y: 60  },
]

const COMP_MAP = new Map(APP_DEFS.map(a => [a.id, a.component]))

export default function App() {
  const desktopRef = useRef<HTMLDivElement>(null)
  const wsMgrRef = useRef<WorkspaceManager | null>(null)
  const [windows, setWindows] = useState<WinEntry[]>([])

  function currentWm() {
    const cur = wsMgrRef.current?.current
    if (!cur) throw new Error('No active workspace')
    return wsMgrRef.current!.getWindowManager(cur.id) as any
  }

  const syncWindows = useCallback(() => {
    try {
      const cur = wsMgrRef.current?.current
      if (!cur) return
      const wm = wsMgrRef.current!.getWindowManager(cur.id) as any
      setWindows(
        (wm.getWindowIds() as string[]).map((id: string) => {
          const bodyEl = wm.getBodyElement(id) as HTMLElement | undefined
          if (!bodyEl) return null
          const appId = id.replace(/^app-/, '')
          const comp = COMP_MAP.get(appId)
          if (!comp) return null
          return { workspaceId: cur.id, id, bodyEl, component: comp } as WinEntry
        }).filter((w): w is WinEntry => w !== null)
      )
    } catch { /* ignore during init */ }
  }, [])

  function openApp(id: string) {
    const def = APP_DEFS.find(a => a.id === id)
    if (!def) return
    const wm = currentWm()
    wm.open({
      id: 'app-' + id,
      title: def.title,
      icon: def.icon,
      label: def.label,
      slotType: 'react',
      content: null,
      width: def.width,
      height: def.height,
      x: def.x,
      y: def.y,
    })
    syncWindows()
  }

  useEffect(() => {
    if (!desktopRef.current) return

    const desktop = new Desktop({
      container: desktopRef.current,
      injectStyles: false,
      dragThreshold: 10,
      dock: { position: 'bottom', showLabels: true, iconSize: 44, items: [] },
      icons: APP_DEFS.map(a => ({
        id: 'icon-' + a.id,
        label: a.label,
        icon: a.icon,
        action: () => openApp(a.id),
      })),
    })

    const wsMgr = new WorkspaceManager(desktop.getElement(), {
      injectStyles: false,
      animationMs: 220,
      windowManagerOptions: { isolated: true, snap: true, injectStyles: false },
    })
    wsMgrRef.current = wsMgr

    const cleanup: Array<() => void> = []
    const subscribedWorkspaces = new Set<string>()
    const EVENTS = ['window:opened','window:closed','window:focused','window:minimized','window:maximized','window:restored']
    const subscribeWorkspace = (workspaceId: string) => {
      if (subscribedWorkspaces.has(workspaceId)) return
      subscribedWorkspaces.add(workspaceId)
      const wm = wsMgr.getWindowManager(workspaceId) as any
      EVENTS.forEach(ev => cleanup.push(wm.events.on(ev, syncWindows)))
    }

    wsMgr.addWorkspace({ id: 'ws-1', label: '桌面 1' })
    subscribeWorkspace('ws-1')
    desktop.syncDockWithWindows(wsMgr.getWindowManager('ws-1') as any)

    cleanup.push(wsMgr.events.on('workspace:added', ({ id }: { id: string }) => {
      subscribeWorkspace(id)
    }))

    cleanup.push(wsMgr.events.on('workspace:switched', ({ to }: { to: string }) => {
      desktop.syncDockWithWindows(wsMgr.getWindowManager(to) as any)
      syncWindows()
    }))

    const taskView = new TaskView(wsMgr, { dock: desktop.getDock() as any, injectStyles: false })

    openApp('guide')

    return () => {
      cleanup.forEach(off => off())
      taskView.destroy()
      wsMgr.destroy()
      desktop.destroy()
      wsMgrRef.current = null
      setWindows([])
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      <a className="demo-github-link" href="https://github.com/0obriano0/DeskPane" target="_blank" rel="noreferrer">GitHub</a>
      <div ref={desktopRef} style={{ width: '100%', height: '100%', position: 'relative' }} />
      {windows.map(w => createPortal(<w.component />, w.bodyEl, `${w.workspaceId}:${w.id}`))}
    </div>
  )
}
