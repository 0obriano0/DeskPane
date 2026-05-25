import React, { useState, useRef } from 'react'

const btn: React.CSSProperties = {
  background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
  color: '#e2e8f0', borderRadius: 6, cursor: 'pointer', padding: '5px 12px', fontSize: 12,
}
const bigBtn: React.CSSProperties = {
  ...btn, fontSize: 22, padding: '8px 20px', minWidth: 48,
}

export default function CounterApp() {
  const [count, setCount] = useState(0)
  const renderCount = useRef(0)
  renderCount.current += 1

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0f172a', color: '#e2e8f0', gap: 16, padding: 20, boxSizing: 'border-box' }}>
      <div style={{ fontSize: 72, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: count === 0 ? 'rgba(226,232,240,0.3)' : '#3b82f6', lineHeight: 1, minWidth: 100, textAlign: 'center' }}>
        {count}
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button style={bigBtn} onClick={() => setCount(c => c - 1)}>−</button>
        <button style={bigBtn} onClick={() => setCount(c => c + 1)}>＋</button>
      </div>

      <button style={{ ...btn, color: 'rgba(226,232,240,0.5)' }} onClick={() => setCount(0)}>重置</button>

      <div style={{ marginTop: 8, fontSize: 12, color: 'rgba(226,232,240,0.4)', textAlign: 'center', lineHeight: 1.8 }}>
        <div>此元件已渲染 <strong style={{ color: '#fbbf24' }}>{renderCount.current}</strong> 次</div>
        <div style={{ fontSize: 11, marginTop: 4 }}>最小化後重新開啟，計數仍保留</div>
      </div>
    </div>
  )
}