<template>
  <section class="doc-sample-layout">
    <div class="doc-sample-main">
      <slot />
    </div>
    <aside class="doc-sample-code">
      <CodePanel :files="pageCode" />
    </aside>
  </section>
</template>

<script setup lang="ts">
import CodePanel from './CodePanel.vue'
import { useDocCode } from '../composables/useDocCode'

const { pageCode } = useDocCode()
</script>

<style scoped>
.doc-sample-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(320px, 380px);
  gap: 18px;
  align-items: start;
  margin: 18px 0 28px;
  width: 100%;
  max-width: 100%;
}

.doc-sample-main {
  min-width: 0;
}

.doc-sample-code {
  min-width: 0;
  height: min(560px, calc(100vh - 190px));
  border: 1px solid #d4d9de;
  background: #fff;
  overflow: hidden;
  position: sticky;
  top: 18px;
}

@media (max-width: 1120px) {
  .doc-sample-layout {
    grid-template-columns: 1fr;
  }

  .doc-sample-code {
    height: 420px;
    position: static;
  }
}
</style>
