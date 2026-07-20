<template>
  <nav class="side-nav">
    <div
      v-for="cat in filteredNav"
      :key="cat.label"
      class="nav-category"
    >
      <button class="nav-cat-label" type="button" @click="toggle(cat.label)">
        <span class="cat-arrow" :class="{ open: isOpen(cat.label) }"></span>
        <span>{{ cat.label }}</span>
      </button>
      <ul class="nav-items">
        <li
          v-for="item in cat.items"
          :key="item.id"
          class="nav-item"
          :class="{ active: item.id === active }"
          v-show="isOpen(cat.label)"
          @click="$emit('update:active', item.id)"
        >
          {{ item.label }}
        </li>
      </ul>
    </div>
    <div v-if="!filteredNav.length" class="nav-empty">
      No matching demos
    </div>
  </nav>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { NavCategory } from '../nav-config'

const props = defineProps<{
  nav: NavCategory[]
  active: string
  query?: string
}>()
defineEmits<{
  (e: 'update:active', id: string): void
}>()

const collapsed = ref(new Set<string>())

const filteredNav = computed(() => {
  const query = (props.query ?? '').trim().toLowerCase()
  if (!query) return props.nav

  return props.nav
    .map(category => ({
      ...category,
      items: category.items.filter(item =>
        item.label.toLowerCase().includes(query) ||
        item.id.toLowerCase().includes(query) ||
        category.label.toLowerCase().includes(query)
      ),
    }))
    .filter(category => category.items.length > 0)
})

watch(() => props.query, (query) => {
  if (query?.trim()) collapsed.value = new Set()
})

function isOpen(label: string) {
  return !collapsed.value.has(label)
}

function toggle(label: string) {
  const next = new Set(collapsed.value)
  if (next.has(label)) next.delete(label)
  else next.add(label)
  collapsed.value = next
}
</script>

<style scoped>
.side-nav {
  padding: 18px 10px 32px 0;
}

.nav-category {
  margin-bottom: 12px;
}

.nav-cat-label {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  border: 0;
  background: transparent;
  padding: 8px 16px 8px 22px;
  font: inherit;
  font-size: 12px;
  font-weight: 800;
  color: #3d4b5c;
  text-align: left;
  cursor: pointer;
}

.nav-cat-label:hover {
  background: #eef3f6;
}

.cat-arrow {
  width: 6px;
  height: 6px;
  border-right: 1.5px solid #647184;
  border-bottom: 1.5px solid #647184;
  transform: rotate(-45deg);
  transition: transform 0.14s ease;
  flex-shrink: 0;
}

.cat-arrow.open {
  transform: rotate(45deg) translateY(-2px);
}

.nav-items {
  list-style: none;
  margin: 0;
  padding: 0;
}

.nav-item {
  padding: 7px 18px 7px 50px;
  cursor: pointer;
  font-size: 14px;
  color: #2c3a45;
  border-left: 3px solid transparent;
  transition: background 0.12s, color 0.12s;
}

.nav-item:hover {
  background: #edf3f6;
}

.nav-item.active {
  background: #e6f2f5;
  color: #087f9c;
  border-left-color: #1597b4;
  font-weight: 600;
}

.nav-empty {
  margin: 18px;
  padding: 12px;
  color: #6b7785;
  border: 1px dashed #c6d0d8;
  text-align: center;
  font-size: 13px;
}
</style>
