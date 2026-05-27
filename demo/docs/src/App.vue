<template>
  <div class="docs-root">

    <!-- ── Header ── -->
    <header class="docs-header">
      <div class="header-logo">
        <span class="header-icon">🖥</span>
        <span class="header-title">WebOS-Core</span>
        <span class="header-sub">{{ t('header.sub') }}</span>
      </div>
      <nav class="header-nav">
        <a href="../index.html">{{ t('header.demos') }}</a>
        <a href="../vanilla/index.html" target="_blank">{{ t('header.vanillaDemo') }}</a>
        <a href="../vue/index.html" target="_blank">{{ t('header.vueDemo') }}</a>
        <button class="lang-btn" @click="locale = locale === 'en' ? 'zh-TW' : 'en'">
          {{ locale === 'en' ? '中文' : 'EN' }}
        </button>
      </nav>
    </header>

    <!-- ── 3-Panel Body ── -->
    <div class="docs-body">

      <!-- Left: sidebar -->
      <aside class="docs-sidebar">
        <SideNav :nav="navConfig" v-model:active="currentPageId" />
      </aside>

      <!-- Center: demo + content -->
      <main class="docs-main">
        <component
          :is="currentPage"
          :key="currentPageId"
        />
      </main>

      <!-- Right: code panel -->
      <aside class="docs-code">
        <CodePanel :files="pageCode" />
      </aside>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, defineAsyncComponent } from 'vue'
import type { Ref } from 'vue'
import SideNav from './components/SideNav.vue'
import CodePanel from './components/CodePanel.vue'
import { provideDocCode } from './composables/useDocCode'
import { provideLocale } from './composables/useLocale'
import { getNavConfig } from './nav-config'
import type { CodeFile } from './composables/useDocCode'

// Provide shared code state — pages inject 'setPageCode' to register their code
const pageCode: Ref<CodeFile[]> = provideDocCode()

// Provide locale
const { locale, t } = provideLocale()

// Reactive nav config driven by locale
const navConfig = computed(() => getNavConfig(t))

// Current page
const currentPageId = ref('overview')

const PAGE_MAP: Record<string, ReturnType<typeof defineAsyncComponent>> = {
  'overview':       defineAsyncComponent(() => import('./pages/Overview.vue')),
  'installation':   defineAsyncComponent(() => import('./pages/Installation.vue')),
  'quick-start':    defineAsyncComponent(() => import('./pages/QuickStart.vue')),
  'wm-options':     defineAsyncComponent(() => import('./pages/WindowManagerOptions.vue')),
  'open-close':     defineAsyncComponent(() => import('./pages/OpenClose.vue')),
  'min-max':        defineAsyncComponent(() => import('./pages/MinMaxRestore.vue')),
  'snap':           defineAsyncComponent(() => import('./pages/SnapAlignment.vue')),
  'events':         defineAsyncComponent(() => import('./pages/EventsPage.vue')),
  'theme-system':   defineAsyncComponent(() => import('./pages/ThemeSystem.vue')),
  'desktop':            defineAsyncComponent(() => import('./pages/DesktopModule.vue')),
  'border-layout':      defineAsyncComponent(() => import('./pages/BorderLayoutPage.vue')),
  'workspace-manager':  defineAsyncComponent(() => import('./pages/WorkspacePage.vue')),
  'task-view':          defineAsyncComponent(() => import('./pages/TaskViewPage.vue')),
  'session-manager':    defineAsyncComponent(() => import('./pages/SessionPage.vue')),
  'hello-world':    defineAsyncComponent(() => import('./pages/HelloWorld.vue')),
  'dom-content':    defineAsyncComponent(() => import('./pages/DomContent.vue')),
  'jquery':         defineAsyncComponent(() => import('./pages/JqueryPage.vue')),
  'vue-composable': defineAsyncComponent(() => import('./pages/VueComposable.vue')),
  'vue-keepalive':  defineAsyncComponent(() => import('./pages/VueKeepAlive.vue')),
  'react':          defineAsyncComponent(() => import('./pages/ReactPage.vue')),
}

const currentPage = computed(() => PAGE_MAP[currentPageId.value])
</script>

<style>
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; height: 100%; overflow: hidden; }
</style>

<style scoped>
.docs-root {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* ── Header ── */
.docs-header {
  height: 52px;
  background: var(--color-header-bg);
  display: flex;
  align-items: center;
  padding: 0 20px;
  gap: 20px;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
}

.header-logo {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #fff;
}

.header-icon { font-size: 22px; }
.header-title { font-size: 16px; font-weight: 700; letter-spacing: -0.01em; }
.header-sub {
  font-size: 11px;
  color: rgba(255,255,255,0.55);
  margin-left: 2px;
  font-weight: 400;
}

.header-nav {
  margin-left: auto;
  display: flex;
  gap: 20px;
}
.header-nav a {
  color: rgba(255,255,255,0.85);
  font-size: 13px;
  text-decoration: none;
  transition: color 0.1s;
}
.header-nav a:hover { color: #fff; }

.lang-btn {
  background: rgba(255,255,255,0.15);
  border: 1px solid rgba(255,255,255,0.3);
  color: #fff;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  font-weight: 600;
  transition: background 0.1s;
}
.lang-btn:hover { background: rgba(255,255,255,0.25); }

/* ── 3-Panel Body ── */
.docs-body {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.docs-sidebar {
  width: 220px;
  flex-shrink: 0;
  border-right: 1px solid var(--color-sidebar-border);
  background: var(--color-sidebar-bg);
  overflow-y: auto;
}

.docs-main {
  flex: 1;
  overflow-y: auto;
  padding: 28px 32px 48px;
  min-width: 0;
}

.docs-code {
  width: 480px;
  flex-shrink: 0;
  border-left: 1px solid #313244;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
</style>
