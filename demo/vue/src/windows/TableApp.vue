<template>
  <div class="table-app">
    <div class="toolbar">
      <input v-model="search" class="search-input" placeholder="🔍 搜尋姓名或部門..." />
      <span class="result-count">{{ filtered.length }} / {{ rows.length }} 筆</span>
    </div>
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th v-for="col in columns" :key="col.key" @click="sortBy(col.key)" class="sortable">
              {{ col.label }}
              <span class="sort-icon">{{ sortKey === col.key ? (sortAsc ? '▲' : '▼') : '⇅' }}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in sorted" :key="row.name" class="data-row">
            <td>{{ row.name }}</td>
            <td>{{ row.dept }}</td>
            <td class="score">{{ row.score }}</td>
            <td>
              <span class="badge" :class="row.status">
                {{ row.status === 'active' ? '在職' : '離職' }}
              </span>
            </td>
          </tr>
          <tr v-if="sorted.length === 0">
            <td colspan="4" class="no-data">無符合資料</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface Row { name: string; dept: string; score: number; status: 'active' | 'inactive' }

const rows: Row[] = [
  { name: '王小明', dept: '工程部', score: 92, status: 'active' },
  { name: '李美玲', dept: '設計部', score: 87, status: 'active' },
  { name: '張志豪', dept: '工程部', score: 78, status: 'inactive' },
  { name: '陳雅芳', dept: '行銷部', score: 95, status: 'active' },
  { name: '林建宏', dept: '人資部', score: 83, status: 'active' },
  { name: '吳佳蓉', dept: '設計部', score: 76, status: 'inactive' },
  { name: '黃文傑', dept: '工程部', score: 89, status: 'active' },
  { name: '劉怡君', dept: '行銷部', score: 91, status: 'active' },
]

const columns = [
  { key: 'name',   label: '姓名' },
  { key: 'dept',   label: '部門' },
  { key: 'score',  label: '評分' },
  { key: 'status', label: '狀態' },
]

const search = ref('')
const sortKey = ref<keyof Row>('score')
const sortAsc = ref(false)

const filtered = computed(() => {
  const q = search.value.toLowerCase()
  if (!q) return rows
  return rows.filter(r => r.name.includes(q) || r.dept.includes(q))
})

const sorted = computed(() => {
  return [...filtered.value].sort((a, b) => {
    const av = a[sortKey.value]
    const bv = b[sortKey.value]
    if (av < bv) return sortAsc.value ? -1 : 1
    if (av > bv) return sortAsc.value ? 1 : -1
    return 0
  })
})

function sortBy(key: string) {
  if (sortKey.value === key) {
    sortAsc.value = !sortAsc.value
  } else {
    sortKey.value = key as keyof Row
    sortAsc.value = true
  }
}
</script>

<style scoped>
.table-app {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--wos-body-bg, #0f172a);
  color: #e2e8f0;
  overflow: hidden;
}
.toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-bottom: 1px solid rgba(255,255,255,0.07);
  flex-shrink: 0;
}
.search-input {
  flex: 1;
  padding: 6px 10px;
  border-radius: 6px;
  border: 1px solid rgba(255,255,255,0.1);
  background: rgba(255,255,255,0.05);
  color: #e2e8f0;
  font-size: 12px;
  outline: none;
}
.search-input:focus { border-color: #3b82f6; }
.search-input::placeholder { color: rgba(226,232,240,0.3); }
.result-count { font-size: 11px; color: rgba(226,232,240,0.4); white-space: nowrap; }
.table-wrap { flex: 1; overflow-y: auto; }
table { width: 100%; border-collapse: collapse; }
thead th {
  padding: 8px 10px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: rgba(226,232,240,0.5);
  border-bottom: 1px solid rgba(255,255,255,0.08);
  text-align: left;
  white-space: nowrap;
  position: sticky;
  top: 0;
  background: var(--wos-body-bg, #0f172a);
}
.sortable { cursor: pointer; user-select: none; }
.sortable:hover { color: #93c5fd; }
.sort-icon { font-size: 9px; margin-left: 4px; opacity: 0.5; }
.data-row { transition: background 0.12s; }
.data-row:hover td { background: rgba(255,255,255,0.04); }
td {
  padding: 8px 10px;
  font-size: 12px;
  border-bottom: 1px solid rgba(255,255,255,0.04);
}
.score { font-variant-numeric: tabular-nums; font-weight: 600; color: #fbbf24; }
.badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: 600;
}
.badge.active { background: rgba(52,211,153,0.15); color: #34d399; border: 1px solid rgba(52,211,153,0.3); }
.badge.inactive { background: rgba(148,163,184,0.1); color: rgba(148,163,184,0.7); border: 1px solid rgba(148,163,184,0.2); }
.no-data { text-align: center; color: rgba(226,232,240,0.3); font-size: 12px; padding: 24px 0; }
</style>