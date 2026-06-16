<template>
  <WindowTeleportItem
    v-for="win in windows"
    :key="`${win.workspaceId}:${win.id}`"
    :entry="win"
  />
</template>

<script setup lang="ts">
import WindowTeleportItem from './WindowTeleportItem.vue'
import type { WindowTeleportEntry } from '../types'

defineProps<{
  windows: WindowTeleportEntry[]
}>()
</script>
