import React from 'react'

const s = {
  root: { height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--dp-window-body-bg,#13131f)', color: 'var(--dp-window-body-color,#e0e0f0)', padding: '16px', overflowY: 'auto', fontFamily: 'system-ui, sans-serif', fontSize: 13, boxSizing: 'border-box', gap: 10 } as React.CSSProperties,
  h1: { margin: '0 0 4px', fontSize: 15, fontWeight: 700 } as React.CSSProperties,
  card: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '12px 14px' } as React.CSSProperties,
  label: { fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: '0.08em', color: '#3b82f6', fontWeight: 600, marginBottom: 8 },
  code: { display: 'block', background: 'rgba(0,0,0,0.3)', borderRadius: 6, padding: '8px 10px', fontFamily: 'monospace', fontSize: 11, color: '#93c5fd', whiteSpace: 'pre' as const, overflowX: 'auto' as const, margin: 0 },
  hint: { margin: '8px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 },
  item: { display: 'flex', gap: 10, fontSize: 12, padding: '4px 0' } as React.CSSProperties,
}

export default function GuideApp() {
  return (
    <div style={s.root}>
      <h2 style={s.h1}>⚛️ React 整合指南</h2>

      <div style={s.card}>
        <div style={s.label}>架構說明</div>
        <p style={s.hint}>DeskPane Desktop 提供桌面殼層（圖示 + Dock），React 元件透過 createPortal 渲染進視窗 body。視窗最小化時 DOM 仍保留，useState 狀態不丟失。</p>
      </div>

      <div style={s.card}>
        <div style={s.label}>開窗方式</div>
        <code style={s.code}>{`wm.open({
  id: 'app-guide',
  title: 'React 指南',
  slotType: 'react',  // 留空 body
  content: null,
})`}</code>
      </div>

      <div style={s.card}>
        <div style={s.label}>Portal 注入</div>
        <code style={s.code}>{`{windows.map(w =>
  createPortal(<w.component />, w.bodyEl, w.id)
)}`}</code>
        <p style={s.hint}>最小化時視窗 body 隱藏但不卸載，React 狀態自動保留。</p>
      </div>

      <div style={s.card}>
        <div style={s.label}>示範元件</div>
        {[
          ['📝', '文字編輯器 — useState 控制內容，最小化後保留'],
          ['✅', '待辦清單 — useState 陣列，展示 React 響應式更新'],
          ['🔢', '計數器 — 最小化後數值不重置（Portal 保留 DOM）'],
          ['🧮', '計算機 — useState + 事件處理'],
        ].map(([icon, desc]) => (
          <div key={icon as string} style={s.item}>
            <span style={{ fontSize: 14, flexShrink: 0 }}>{icon}</span>
            <span style={{ color: 'rgba(255,255,255,0.65)', lineHeight: 1.5 }}>{desc}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
