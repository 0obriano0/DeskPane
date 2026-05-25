import React, { useState, useEffect, useMemo } from 'react'

interface Row { name: string; dept: string; score: number; status: 'active' | 'inactive' }

const INITIAL_DATA: Row[] = [
  { name: '王小明', dept: '工程部', score: 92, status: 'active' },
  { name: '李美麗', dept: '設計部', score: 87, status: 'active' },
  { name: '張大偉', dept: '產品部', score: 78, status: 'inactive' },
  { name: '陳雅婷', dept: '工程部', score: 95, status: 'active' },
  { name: '林志成', dept: '行銷部', score: 82, status: 'active' },
  { name: '黃淑芬', dept: '設計部', score: 69, status: 'inactive' },
  { name: '吳建宏', dept: '工程部', score: 88, status: 'active' },
  { name: '劉麗珍', dept: '產品部', score: 74, status: 'inactive' },
]

type SortKey = keyof Row
type SortDir = 'asc' | 'desc'

const thStyle: React.CSSProperties = {
  padding: '6px 10px', textAlign: 'left', fontSize: 11, fontWeight: 600,
  color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.8,
  borderBottom: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', userSelect: 'none',
  whiteSpace: 'nowrap',
}
const tdStyle: React.CSSProperties = {
  padding: '6px 10px', fontSize: 12, color: '#e2e8f0', borderBottom: '1px solid rgba(255,255,255,0.04)',
}

export default function DataPanel() {
  const [loading, setLoading] = useState(true)
  const [data, setData]       = useState<Row[]>([])
  const [search, setSearch]   = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  useEffect(() => {
    const t = setTimeout(() => {
      setData(INITIAL_DATA)
      setLoading(false)
    }, 800)
    return () => clearTimeout(t)
  }, [])

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    const rows = data.filter(r =>
      r.name.includes(q) || r.dept.includes(q) || String(r.score).includes(q)
    )
    return [...rows].sort((a, b) => {
      const va = a[sortKey], vb = b[sortKey]
      const cmp = va < vb ? -1 : va > vb ? 1 : 0
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [data, search, sortKey, sortDir])

  const arrow = (key: SortKey) => sortKey === key ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#0f172a', color: '#e2e8f0', padding: 12, boxSizing: 'border-box', gap: 10, fontFamily: 'system-ui, sans-serif', fontSize: 13 }}>
      <input
        style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 6, color: '#e2e8f0', padding: '6px 10px', fontSize: 12, outline: 'none' }}
        placeholder="搜尋姓名、部門…"
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      {loading ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, color: 'rgba(226,232,240,0.4)' }}>
          <div style={{ width: 32, height: 32, border: '3px solid rgba(59,130,246,0.3)', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <span style={{ fontSize: 12 }}>載入資料中…</span>
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      ) : (
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {(['name', 'dept', 'score', 'status'] as SortKey[]).map(key => (
                  <th key={key} style={thStyle} onClick={() => handleSort(key)}>
                    {{ name: '姓名', dept: '部門', score: '分數', status: '狀態' }[key]}{arrow(key)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((row, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                  <td style={tdStyle}>{row.name}</td>
                  <td style={tdStyle}>{row.dept}</td>
                  <td style={{ ...tdStyle, fontVariantNumeric: 'tabular-nums', color: row.score >= 90 ? '#34d399' : row.score >= 80 ? '#93c5fd' : '#fbbf24' }}>{row.score}</td>
                  <td style={tdStyle}>
                    <span style={{ background: row.status === 'active' ? 'rgba(52,211,153,0.15)' : 'rgba(100,116,139,0.2)', color: row.status === 'active' ? '#34d399' : '#94a3b8', borderRadius: 4, padding: '2px 7px', fontSize: 11 }}>
                      {row.status === 'active' ? '在職' : '離職'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', color: 'rgba(226,232,240,0.3)', padding: 20 }}>無符合結果</div>
          )}
        </div>
      )}

      <div style={{ fontSize: 11, color: 'rgba(226,232,240,0.4)', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 6 }}>
        共 {filtered.length} / {data.length} 筆
      </div>
    </div>
  )
}