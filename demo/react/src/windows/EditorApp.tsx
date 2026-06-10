import React, { useState } from 'react'

const btn: React.CSSProperties = {
  background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
  color: 'var(--dp-window-body-color,#e0e0f0)', borderRadius: 6, cursor: 'pointer',
  padding: '5px 12px', fontSize: 12,
}

export default function EditorApp() {
  const [text, setText] = useState('DeskPane React Demo\n===================\n\n此為 React 文字編輯器示範。\n最小化後重新開啟，內容依然保留。\n')
  const wordCount = text.split(/\s+/).filter(Boolean).length

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--dp-window-body-bg,#13131f)', color: 'var(--dp-window-body-color,#e0e0f0)', padding: 12, boxSizing: 'border-box', gap: 8 }}>
      <textarea
        style={{
          flex: 1, resize: 'none', background: 'rgba(255,255,255,0.04)', color: 'inherit',
          border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6,
          padding: 10, fontSize: 13, fontFamily: 'Cascadia Code, Consolas, monospace',
          outline: 'none', lineHeight: 1.6,
        }}
        placeholder="開始輸入文字…"
        value={text}
        onChange={e => setText(e.target.value)}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>
        <span>{text.length} 字元</span>
        <span>·</span>
        <span>{wordCount} 字詞</span>
        <span style={{ flex: 1 }} />
        <button style={btn} onClick={() => setText('')}>清除</button>
        <button style={{ ...btn, background: 'rgba(59,130,246,0.2)', borderColor: 'rgba(59,130,246,0.4)', color: '#93c5fd' }}
          onClick={() => text && navigator.clipboard.writeText(text)}>複製</button>
      </div>
    </div>
  )
}
