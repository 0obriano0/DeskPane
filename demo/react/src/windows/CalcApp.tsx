import React, { useState } from 'react'

const KEYS = ['C','±','%','÷','7','8','9','×','4','5','6','−','1','2','3','+','0','.','⌫','=']

export default function CalcApp() {
  const [display, setDisplay] = useState('0')
  const exprRef = React.useRef('')

  function press(k: string) {
    const expr = exprRef.current
    if (k === 'C') { exprRef.current = ''; setDisplay('0'); return }
    if (k === '=') {
      try {
        const r = Function('return ' + expr.replace(/×/g,'*').replace(/÷/g,'/').replace(/−/g,'-'))()
        exprRef.current = String(r); setDisplay(String(r))
      } catch { exprRef.current = ''; setDisplay('錯誤') }
      return
    }
    if (k === '⌫') { exprRef.current = expr.slice(0,-1); setDisplay(exprRef.current || '0'); return }
    if (k === '±') {
      try {
        const v = -Function('return ' + expr.replace(/×/g,'*').replace(/÷/g,'/').replace(/−/g,'-'))()
        exprRef.current = String(v); setDisplay(String(v))
      } catch {} return
    }
    if (k === '%') {
      try {
        const v = Function('return ' + expr.replace(/×/g,'*').replace(/÷/g,'/').replace(/−/g,'-'))() / 100
        exprRef.current = String(v); setDisplay(String(v))
      } catch {} return
    }
    exprRef.current = expr + k; setDisplay(exprRef.current)
  }

  const isOp = (k: string) => '÷×−+='.includes(k)
  const isFn = (k: string) => 'C±%'.includes(k)

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 10, padding: 12, boxSizing: 'border-box', background: 'var(--dp-window-body-bg,#13131f)', color: 'var(--dp-window-body-color,#e0e0f0)' }}>
      <div style={{ padding: 10, fontSize: 22, textAlign: 'right', borderRadius: 6, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.06)', minHeight: 48, wordBreak: 'break-all' }}>
        {display}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6, flex: 1 }}>
        {KEYS.map(k => (
          <button
            key={k}
            onClick={() => press(k)}
            style={{
              padding: 0, fontSize: 16, fontWeight: 500, borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer',
              background: isOp(k) ? '#ff9500' : isFn(k) ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.08)',
              color: isOp(k) ? '#fff' : 'inherit',
            }}
          >{k}</button>
        ))}
      </div>
    </div>
  )
}
