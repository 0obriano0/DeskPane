<template>
  <div class="vue-demo">
    <a class="demo-github-link" href="https://github.com/0obriano0/DeskPane" target="_blank" rel="noopener">GitHub</a>
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

.demo-github-link {
  position: fixed;
  right: 14px;
  bottom: 84px;
  z-index: 30000;
  min-height: 32px;
  padding: 0 12px;
  display: inline-flex;
  align-items: center;
  border: 1px solid rgba(255,255,255,0.18);
  border-radius: 8px;
  background: rgba(15,23,42,0.72);
  color: #e2e8f0;
  text-decoration: none;
  font: 700 12px system-ui, sans-serif;
  backdrop-filter: blur(14px);
}

.demo-github-link:hover {
  background: rgba(30,41,59,0.86);
  border-color: rgba(96,165,250,0.6);
}
</style>
