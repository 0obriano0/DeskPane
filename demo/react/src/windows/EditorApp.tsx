import React, { useState } from 'react'

const btn: React.CSSProperties = {
  background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
  color: '#e2e8f0', borderRadius: 6, cursor: 'pointer', padding: '5px 12px', fontSize: 12,
}

export default function EditorApp() {
  const [text, setText] = useState('')

  const wordCount = text.split(/\s+/).filter(Boolean).length
  const charCount = text.length

  const handleCopy = () => {
    if (text) navigator.clipboard.writeText(text)
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#0f172a', color: '#e2e8f0', padding: 12, boxSizing: 'border-box', gap: 8 }}>
      <textarea
        style={{
          flex: 1, resize: 'none', background: '#1e293b', color: '#e2e8f0',
          border: '1px solid rgba(255,255,255,0.12)', borderRadius: 6,
          padding: 10, fontSize: 13, fontFamily: 'system-ui, sans-serif',
          outline: 'none', lineHeight: 1.6,
        }}
        placeholder="開始輸入文字…"
        value={text}
        onChange={e => setText(e.target.value)}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'rgba(226,232,240,0.5)' }}>
        <span>{charCount} 字元</span>
        <span>·</span>
        <span>{wordCount} 字詞</span>
        <span style={{ flex: 1 }} />
        <button style={btn} onClick={() => setText('')}>清除</button>
        <button style={{ ...btn, background: 'rgba(59,130,246,0.2)', borderColor: 'rgba(59,130,246,0.4)', color: '#93c5fd' }} onClick={handleCopy}>複製</button>
      </div>
    </div>
  )
}