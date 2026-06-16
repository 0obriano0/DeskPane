<template>
  <div class="declarative-demo">
    <DpDesktop
      v-model:items="icons"
      class="declarative-demo__desktop"
      :dock="{ position: 'bottom', showLabels: true }"
      storage-key="dp-vue-declarative"
      @icon-activated="onIconActivated"
    >
      <DpDesktopIcon
        id="template-counter"
        label="Template Icon"
        icon="🧩"
        :x="140"
        :y="40"
        @activate="counterOpen = true"
      />
    </DpDesktop>

    <DpWindowManager class="declarative-demo__windows">
      <DpWindow
        id="guide"
        v-model:open="guideOpen"
        title="Declarative Guide"
        icon="📘"
        :width="520"
        :height="420"
        :x="80"
        :y="60"
      >
        <GuideApp />
      </DpWindow>

      <DpWindow
        id="counter"
        v-model:open="counterOpen"
        title="Template Counter"
        icon="🧩"
        :width="320"
        :height="360"
        :x="180"
        :y="120"
      >
        <CounterApp />
      </DpWindow>
    </DpWindowManager>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import {
  DpDesktop,
  DpDesktopIcon,
  DpWindow,
  DpWindowManager,
} from '@deskpane/adapters/vue'
import type { DesktopIconConfig, DesktopIconEvent } from '@deskpane/desktop'
import GuideApp from './windows/GuideApp.vue'
import CounterApp from './windows/CounterApp.vue'

const guideOpen = ref(true)
const counterOpen = ref(false)

const icons = ref<DesktopIconConfig[]>([
  { id: 'guide-icon', label: 'Guide', icon: '📘', x: 40, y: 40 },
  { id: 'counter-icon', label: 'Counter', icon: '🔢', x: 40, y: 140 },
])

function onIconActivated(event: DesktopIconEvent) {
  if (event.id === 'guide-icon') guideOpen.value = true
  if (event.id === 'counter-icon') counterOpen.value = true
}
</script>

<style scoped>
.declarative-demo {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

.declarative-demo__desktop,
.declarative-demo__windows {
  position: absolute;
  inset: 0;
}

.declarative-demo__windows {
  pointer-events: none;
}

.declarative-demo__windows :deep(.dp-window) {
  pointer-events: auto;
}
</style>
