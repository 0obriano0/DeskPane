<template>
  <Teleport :to="entry.bodyEl">
    <KeepAlive>
      <component :is="entry.component" :key="cacheKey" />
    </KeepAlive>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { WindowTeleportEntry } from '../types'

const props = defineProps<{
  entry: WindowTeleportEntry
}>()

const cacheKey = computed(() => `${props.entry.workspaceId}:${props.entry.id}`)
</script>
