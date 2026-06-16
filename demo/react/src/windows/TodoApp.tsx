import React, { useState } from 'react'

interface Todo { id: number; text: string; done: boolean }
type Filter = 'all' | 'active' | 'done'

const btn: React.CSSProperties = {
  background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
  color: '#e2e8f0', borderRadius: 6, cursor: 'pointer', padding: '5px 12px', fontSize: 12,
}

export default function TodoApp() {
  const [todos, setTodos] = useState<Todo[]>([
    { id: 1, text: '體驗 DeskPane React 整合', done: false },
    { id: 2, text: '閱讀 Hook 指南', done: false },
  ])
  const [input, setInput] = useState('')
  const [filter, setFilter] = useState<Filter>('all')

  const addTodo = () => {
    const text = input.trim()
    if (!text) return
    setTodos(prev => [...prev, { id: Date.now(), text, done: false }])
    setInput('')
  }

  const toggle = (id: number) => setTodos(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t))
  const remove  = (id: number) => setTodos(prev => prev.filter(t => t.id !== id))

  const visible = todos.filter(t => filter === 'all' ? true : filter === 'active' ? !t.done : t.done)
  const pending = todos.filter(t => !t.done).length

  const tabStyle = (f: Filter): React.CSSProperties => ({
    ...btn, borderColor: filter === f ? 'rgba(59,130,246,0.6)' : undefined,
    background: filter === f ? 'rgba(59,130,246,0.2)' : undefined,
    color: filter === f ? '#93c5fd' : '#e2e8f0',
  })

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#0f172a', color: '#e2e8f0', padding: 12, boxSizing: 'border-box', gap: 10, fontFamily: 'system-ui, sans-serif', fontSize: 13 }}>
      {/* Input */}
      <div style={{ display: 'flex', gap: 6 }}>
        <input
          style={{ flex: 1, background: '#1e293b', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 6, color: '#e2e8f0', padding: '6px 10px', fontSize: 13, outline: 'none' }}
          placeholder="新增待辦事項…"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addTodo()}
        />
        <button style={{ ...btn, background: 'rgba(59,130,246,0.2)', borderColor: 'rgba(59,130,246,0.4)', color: '#93c5fd' }} onClick={addTodo}>新增</button>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 6 }}>
        <button style={tabStyle('all')}    onClick={() => setFilter('all')}>全部</button>
        <button style={tabStyle('active')} onClick={() => setFilter('active')}>進行中</button>
        <button style={tabStyle('done')}   onClick={() => setFilter('done')}>已完成</button>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {visible.length === 0 && (
          <div style={{ textAlign: 'center', color: 'rgba(226,232,240,0.3)', marginTop: 24 }}>無項目</div>
        )}
        {visible.map(t => (
          <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', background: 'rgba(255,255,255,0.04)', borderRadius: 6, border: '1px solid rgba(255,255,255,0.06)' }}>
            <input type="checkbox" checked={t.done} onChange={() => toggle(t.id)} style={{ cursor: 'pointer', accentColor: '#3b82f6' }} />
            <span style={{ flex: 1, textDecoration: t.done ? 'line-through' : 'none', color: t.done ? 'rgba(226,232,240,0.3)' : '#e2e8f0', cursor: 'pointer' }} onClick={() => toggle(t.id)}>{t.text}</span>
            <button style={{ ...btn, padding: '2px 8px', fontSize: 11, color: 'rgba(226,232,240,0.4)' }} onClick={() => remove(t.id)}>✕</button>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ fontSize: 11, color: 'rgba(226,232,240,0.4)', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 8 }}>
        {pending} 項待完成
      </div>
    </div>
  )
}
