import React from 'react'

const s = {
  root: { height: '100%', display: 'flex', flexDirection: 'column', background: '#0f172a', color: '#e2e8f0', padding: '14px 16px', overflowY: 'auto', fontFamily: 'system-ui, sans-serif', fontSize: 13, boxSizing: 'border-box' } as React.CSSProperties,
  h1: { margin: '0 0 12px', fontSize: 15, fontWeight: 700, color: '#93c5fd', display: 'flex', alignItems: 'center', gap: 6 } as React.CSSProperties,
  section: { marginBottom: 14 } as React.CSSProperties,
  sectionTitle: { fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 6 },
  code: { display: 'block', background: '#1e293b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, padding: '10px 12px', fontFamily: 'monospace', fontSize: 12, color: '#7dd3fc', whiteSpace: 'pre' as const, overflowX: 'auto' as const },
  list: { margin: '0', paddingLeft: 0, listStyle: 'none' } as React.CSSProperties,
  listItem: { display: 'flex', gap: 8, padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: 12 } as React.CSSProperties,
  badge: { background: 'rgba(59,130,246,0.2)', color: '#93c5fd', borderRadius: 4, padding: '1px 6px', fontFamily: 'monospace', fontSize: 11, whiteSpace: 'nowrap' as const, flexShrink: 0 },
  desc: { color: 'rgba(226,232,240,0.6)', lineHeight: 1.5 } as React.CSSProperties,
  note: { background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 6, padding: '8px 12px', fontSize: 12, color: 'rgba(226,232,240,0.7)', lineHeight: 1.6 } as React.CSSProperties,
}

export default function GuideApp() {
  return (
    <div style={s.root}>
      <h2 style={s.h1}>⚛️ useWindowManager Hook 指南</h2>

      <div style={s.section}>
        <div style={s.sectionTitle}>匯入與使用</div>
        <code style={s.code}>{`const { wm, windows, openReactWindow } = useWindowManager()`}</code>
      </div>

      <div style={s.section}>
        <div style={s.sectionTitle}>回傳值說明</div>
        <ul style={s.list}>
          {[
            ['wm', 'WindowManager 核心實例，可直接操作視窗'],
            ['windows', 'ReactWindowEntry[] — React 狀態陣列'],
            ['openReactWindow', '開啟或聚焦一個 React 視窗'],
            ['minimize(id)', '最小化指定視窗'],
            ['restore(id)', '還原最小化視窗'],
            ['focus(id)', '將視窗帶至前景'],
            ['destroy(id?)', '關閉視窗，省略 id 則關閉全部'],
          ].map(([key, desc]) => (
            <li key={key} style={s.listItem}>
              <span style={s.badge}>{key}</span>
              <span style={s.desc}>{desc}</span>
            </li>
          ))}
        </ul>
      </div>

      <div style={s.section}>
        <div style={s.sectionTitle}>createPortal 渲染模式</div>
        <code style={s.code}>{`windows.map(win =>
  createPortal(
    <win.component />,
    win.bodyEl,  // WM 管理的 DOM 節點
    win.id
  )
)`}</code>
      </div>

      <div style={s.note}>
        💡 <strong>狀態保留：</strong>透過 Portal 渲染的 React 元件在視窗最小化後仍保持掛載，
        useState / useRef 的狀態不會遺失。開啟計數器視窗並最小化後重新開啟即可驗證。
      </div>
    </div>
  )
}