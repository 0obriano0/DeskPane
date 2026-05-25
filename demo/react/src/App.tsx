import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useWindowManager } from '@webos/adapters/react/useWindowManager'
import type { ReactWindowEntry } from '@webos/adapters/react/useWindowManager'
import { setTheme } from '@webos/themes/setTheme'

import GuideApp   from './windows/GuideApp'
import EditorApp  from './windows/EditorApp'
import CounterApp from './windows/CounterApp'
import TodoApp    from './windows/TodoApp'
import DataPanel  from './windows/DataPanel'

interface AppDef {
  id: string
  label: string
  icon: string
  title: string
  component: React.ComponentType<any>
  width?: number
  height?: number
  x?: number
  y?: number
}

const APP_LIST: AppDef[] = [
  { id: 'guide',   label: 'Hook',   icon: '⚛️', title: 'useWindowManager Hook 指南', component: GuideApp,   width: 480, height: 380, x: 80,  y: 40  },
  { id: 'editor',  label: '文字',   icon: '📝', title: 'React 文字編輯器',            component: EditorApp,  width: 420, height: 320, x: 120, y: 60  },
  { id: 'counter', label: '計數器', icon: '🔢', title: 'React 計數器 (KeepAlive)',    component: CounterApp, width: 300, height: 300, x: 240, y: 100 },
  { id: 'todo',    label: '待辦',   icon: '✅', title: 'React 待辦清單',              component: TodoApp,    width: 360, height: 420, x: 160, y: 80  },
  { id: 'data',    label: '資料',   icon: '📊', title: 'React 資料面板',              component: DataPanel,  width: 500, height: 360, x: 200, y: 60  },
]

const APP_MAP = Object.fromEntries(APP_LIST.map(a => [a.id, a]))

export default function App() {
  const { wm, windows, openReactWindow, minimize, restore, focus, destroy } =
    useWindowManager({ throttleMs: 16, snap: true })

  const [logs, setLogs] = useState<string[]>(['📡 Event Log'])
  const [theme, setThemeState] = useState<'light' | 'dark'>('light')

  const toggleTheme = useCallback(() => {
    const next = theme === 'light' ? 'dark' : 'light'
    setThemeState(next)
    setTheme(next, { basePath: '/themes' })
  }, [theme])

  const openApp = (appId: string) => {
    const app = APP_MAP[appId]
    if (!app) return
    openReactWindow({
      id:        app.id,
      title:     app.title,
      component: app.component,
      width:     app.width,
      height:    app.height,
      x:         app.x,
      y:         app.y,
    })
  }

  useEffect(() => {
    const EVENTS = [
      'window:opened', 'window:closed', 'window:focused',
      'window:minimized', 'window:maximized', 'window:restored',
    ]
    EVENTS.forEach(ev => {
      wm.events.on(ev, (d: any) => {
        setLogs(prev => [`▶ ${ev} [${d?.id ?? ''}]`, ...prev.slice(0, 39)])
      })
    })
    // 啟動時開啟歡迎視窗
    openApp('guide')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const openIds = new Set(windows.map(w => w.id))

  function onTaskbarClick(win: ReactWindowEntry) {
    if (win.state.isMinimized) {
      restore(win.id)
      focus(win.id)
    } else if (win.state.isActive) {
      minimize(win.id)
    } else {
      focus(win.id)
    }
  }

  return (
    <div className="desktop">

      {/* ── 左側 Dock ── */}
      <nav id="app-dock">
        {APP_LIST.map(app => (
          <button
            key={app.id}
            className={`dock-item${openIds.has(app.id) ? ' running' : ''}`}
            title={app.title}
            onClick={() => openApp(app.id)}
          >
            <span className="dock-icon">{app.icon}</span>
            <span className="dock-label">{app.label}</span>
          </button>
        ))}

        <div className="dock-separator" />

        <button className="dock-item" title="關閉全部" onClick={() => destroy()}>
          <span className="dock-icon">💣</span>
          <span className="dock-label">關閉全部</span>
        </button>

        <div className="dock-separator" />

        <button
          className="dock-item"
          title={theme === 'light' ? '切換暗色' : '切換亮色'}
          onClick={toggleTheme}
        >
          <span className="dock-icon">{theme === 'light' ? '🌙' : '☀️'}</span>
          <span className="dock-label">{theme === 'light' ? '暗色' : '亮色'}</span>
        </button>
      </nav>

      {/* ── 下方任務列 ── */}
      <div id="taskbar">
        {windows.map(win => (
          <button
            key={win.id}
            className={[
              'task-item',
              win.state.isActive    ? 'active'    : '',
              win.state.isMinimized ? 'minimized' : '',
            ].join(' ').trim()}
            onClick={() => onTaskbarClick(win)}
          >
            <span className="task-icon">{APP_MAP[win.id]?.icon ?? '🪟'}</span>
            {win.state.title}
          </button>
        ))}
      </div>

      {/* ── 事件 Log ── */}
      <div id="event-log">
        {logs.map((entry, i) => <p key={i}>{entry}</p>)}
      </div>

      {/* ── React Portals：渲染進 WM 管理的 DOM body ── */}
      {windows.map(win =>
        win.component
          ? createPortal(
              <win.component {...(win.props ?? {})} />,
              win.bodyEl,
              win.id
            )
          : null
      )}

    </div>
  )
}
