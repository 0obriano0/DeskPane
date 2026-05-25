<template>
  <div class="todo-app">
    <div class="input-row">
      <input
        v-model.trim="newTodo"
        class="todo-input"
        placeholder="新增待辦事項..."
        @keydown.enter="addTodo"
      />
      <button class="btn btn-primary" @click="addTodo" :disabled="!newTodo">新增</button>
    </div>

    <div class="filter-row">
      <button
        v-for="f in ['all','active','done']"
        :key="f"
        class="filter-btn"
        :class="{ active: filter === f }"
        @click="filter = f as FilterType"
      >{{ filterLabel(f) }}</button>
    </div>

    <div class="todo-list">
      <div
        v-for="item in filteredTodos"
        :key="item.id"
        class="todo-item"
        :class="{ done: item.done }"
      >
        <input type="checkbox" v-model="item.done" class="todo-check" />
        <span class="todo-text">{{ item.text }}</span>
        <button class="btn-del" @click="remove(item.id)">✕</button>
      </div>
      <div v-if="filteredTodos.length === 0" class="empty">
        {{ filter === 'done' ? '尚無已完成項目' : filter === 'active' ? '全部完成 🎉' : '新增第一項待辦' }}
      </div>
    </div>

    <div class="footer">
      <span class="count">{{ pendingCount }} 項待完成</span>
      <button class="btn" @click="clearDone" :disabled="doneCount === 0">清除已完成</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface Todo { id: number; text: string; done: boolean }
type FilterType = 'all' | 'active' | 'done'

const todos = ref<Todo[]>([
  { id: 1, text: '探索 WebOS-Core 功能', done: false },
  { id: 2, text: '嘗試最小化與還原視窗', done: false },
  { id: 3, text: '體驗 KeepAlive 狀態保留', done: true },
])
let nextId = 4
const newTodo = ref('')
const filter = ref<FilterType>('all')

const pendingCount = computed(() => todos.value.filter(t => !t.done).length)
const doneCount = computed(() => todos.value.filter(t => t.done).length)

const filteredTodos = computed(() => {
  if (filter.value === 'active') return todos.value.filter(t => !t.done)
  if (filter.value === 'done') return todos.value.filter(t => t.done)
  return todos.value
})

function filterLabel(f: string) {
  if (f === 'all') return `全部 (${todos.value.length})`
  if (f === 'active') return `進行中 (${pendingCount.value})`
  return `已完成 (${doneCount.value})`
}

function addTodo() {
  if (!newTodo.value) return
  todos.value.push({ id: nextId++, text: newTodo.value, done: false })
  newTodo.value = ''
}

function remove(id: number) {
  todos.value = todos.value.filter(t => t.id !== id)
}

function clearDone() {
  todos.value = todos.value.filter(t => !t.done)
}
</script>

<style scoped>
.todo-app {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  background: var(--wos-body-bg, #0f172a);
  color: #e2e8f0;
  overflow: hidden;
}
.input-row { display: flex; gap: 6px; }
.todo-input {
  flex: 1;
  padding: 7px 10px;
  border-radius: 6px;
  border: 1px solid rgba(255,255,255,0.1);
  background: rgba(255,255,255,0.05);
  color: #e2e8f0;
  font-size: 13px;
  outline: none;
}
.todo-input:focus { border-color: #3b82f6; }
.todo-input::placeholder { color: rgba(226,232,240,0.3); }
.filter-row { display: flex; gap: 4px; }
.filter-btn {
  flex: 1;
  padding: 5px 4px;
  border-radius: 6px;
  border: 1px solid rgba(255,255,255,0.1);
  background: rgba(255,255,255,0.05);
  color: rgba(226,232,240,0.6);
  font-size: 11px;
  cursor: pointer;
  transition: background 0.15s;
}
.filter-btn.active {
  background: rgba(59,130,246,0.2);
  border-color: rgba(59,130,246,0.5);
  color: #93c5fd;
  font-weight: 600;
}
.todo-list { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 4px; }
.todo-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 6px;
  border: 1px solid rgba(255,255,255,0.07);
  background: rgba(255,255,255,0.03);
  transition: background 0.15s;
}
.todo-item.done { background: rgba(52,211,153,0.05); border-color: rgba(52,211,153,0.15); }
.todo-item.done .todo-text { text-decoration: line-through; color: rgba(226,232,240,0.35); }
.todo-check { accent-color: #3b82f6; width: 14px; height: 14px; flex-shrink: 0; cursor: pointer; }
.todo-text { flex: 1; font-size: 13px; }
.btn-del {
  border: none;
  background: transparent;
  color: rgba(226,232,240,0.3);
  cursor: pointer;
  font-size: 11px;
  padding: 2px 5px;
  border-radius: 4px;
  line-height: 1;
}
.btn-del:hover { background: rgba(239,68,68,0.2); color: #f87171; }
.empty { color: rgba(226,232,240,0.35); font-size: 13px; text-align: center; padding: 20px 0; }
.footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 4px;
  border-top: 1px solid rgba(255,255,255,0.07);
}
.count { font-size: 11px; color: rgba(226,232,240,0.5); }
.btn {
  padding: 4px 10px;
  border-radius: 6px;
  border: 1px solid rgba(255,255,255,0.12);
  background: rgba(255,255,255,0.06);
  color: #e2e8f0;
  font-size: 11px;
  cursor: pointer;
  transition: background 0.15s;
}
.btn:hover:not(:disabled) { background: rgba(255,255,255,0.12); }
.btn:disabled { opacity: 0.3; cursor: default; }
.btn-primary {
  background: rgba(59,130,246,0.25);
  border-color: rgba(59,130,246,0.45);
  color: #93c5fd;
  white-space: nowrap;
  font-weight: 600;
}
.btn-primary:hover:not(:disabled) { background: rgba(59,130,246,0.4); }
</style>