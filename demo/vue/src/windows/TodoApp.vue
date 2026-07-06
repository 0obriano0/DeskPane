<template>
  <div class="todo-app">
    <div class="input-row">
      <input
        v-model="input"
        class="todo-input"
        :placeholder="t('todo.placeholder')"
        @keydown.enter="addTodo"
      />
      <button class="btn btn-add" @click="addTodo">{{ t('todo.add') }}</button>
    </div>

    <div class="filter-row">
      <button
        v-for="f in filters" :key="f.id"
        class="btn filter-btn"
        :class="{ active: filter === f.id }"
        @click="filter = f.id"
      >{{ t(f.labelKey) }}</button>
    </div>

    <div class="todo-list">
      <div v-if="visible.length === 0" class="empty">{{ t('todo.empty') }}</div>
      <div v-for="todo in visible" :key="todo.id" class="todo-item">
        <input type="checkbox" :checked="todo.done" @change="toggle(todo.id)" class="check" />
        <span
          class="todo-text"
          :class="{ done: todo.done }"
          @click="toggle(todo.id)"
        >{{ todo.textKey ? t(todo.textKey) : todo.text }}</span>
        <button class="btn btn-del" @click="remove(todo.id)">✕</button>
      </div>
    </div>

    <div class="footer">{{ pending }} {{ t('todo.pending') }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'

interface Todo { id: number; text?: string; textKey?: string; done: boolean }
type Filter = 'all' | 'active' | 'done'

const { t } = useI18n()
const todos = ref<Todo[]>([
  { id: 1, textKey: 'todo.samples.integration', done: false },
  { id: 2, textKey: 'todo.samples.calculator', done: false },
  { id: 3, textKey: 'todo.samples.keepAlive', done: true },
])
const input = ref('')
const filter = ref<Filter>('all')

const filters = [
  { id: 'all' as Filter, labelKey: 'todo.filters.all' },
  { id: 'active' as Filter, labelKey: 'todo.filters.active' },
  { id: 'done' as Filter, labelKey: 'todo.filters.done' },
]

const visible = computed(() =>
  todos.value.filter(t =>
    filter.value === 'all' ? true : filter.value === 'active' ? !t.done : t.done
  )
)
const pending = computed(() => todos.value.filter(t => !t.done).length)

function addTodo() {
  const text = input.value.trim()
  if (!text) return
  todos.value.push({ id: Date.now(), text, done: false })
  input.value = ''
}
function toggle(id: number) {
  const t = todos.value.find(t => t.id === id)
  if (t) t.done = !t.done
}
function remove(id: number) {
  todos.value = todos.value.filter(t => t.id !== id)
}
</script>

<style scoped>
.todo-app {
  height: 100%; display: flex; flex-direction: column; gap: 10px;
  padding: 14px; background: var(--dp-window-body-bg, #13131f);
  color: var(--dp-window-body-color, #e0e0f0); font-family: system-ui, sans-serif; font-size: 13px;
  box-sizing: border-box;
}
.input-row { display: flex; gap: 8px; }
.todo-input {
  flex: 1; padding: 7px 10px; border-radius: 6px;
  border: 1px solid rgba(255,255,255,0.12); background: rgba(255,255,255,0.06);
  color: inherit; font-size: 13px; outline: none;
}
.filter-row { display: flex; gap: 6px; }
.todo-list { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 4px; }
.empty { text-align: center; color: rgba(255,255,255,0.25); padding-top: 20px; }
.todo-item {
  display: flex; align-items: center; gap: 8px;
  padding: 7px 10px; border-radius: 6px;
  background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06);
}
.check { cursor: pointer; accent-color: #3b82f6; }
.todo-text { flex: 1; cursor: pointer; }
.todo-text.done { text-decoration: line-through; color: rgba(255,255,255,0.3); }
.footer { font-size: 11px; color: rgba(255,255,255,0.4); border-top: 1px solid rgba(255,255,255,0.06); padding-top: 8px; }
.btn {
  padding: 5px 12px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.12);
  background: rgba(255,255,255,0.08); color: inherit; cursor: pointer; font-size: 12px;
}
.btn-add { background: rgba(59,130,246,0.2); border-color: rgba(59,130,246,0.4); color: #93c5fd; }
.btn-del { padding: 2px 8px; font-size: 11px; color: rgba(255,255,255,0.4); }
.filter-btn.active { background: rgba(59,130,246,0.2); border-color: rgba(59,130,246,0.5); color: #93c5fd; }
</style>
