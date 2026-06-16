<template>
  <div class="vue-demo">
    <div ref="desktopRootEl" class="vue-demo__desktop"></div>
    <WindowTeleportHost :windows="windows" />
  </div>
</template>

<script setup lang="ts">
import WindowTeleportHost from './components/WindowTeleportHost.vue'
import { useDeskPaneWorkspaceDemo } from './composables/useDeskPaneWorkspaceDemo'

const { desktopRootEl, windows } = useDeskPaneWorkspaceDemo()
</script>

<style scoped>
.vue-demo {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

.vue-demo__desktop {
  position: relative;
  width: 100%;
  height: 100%;
}
</style>
