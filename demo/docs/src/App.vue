<template>
  <div class="docs-root">
    <header class="docs-header">
      <div class="brand">
        <span class="brand-mark">DP</span>
        <span class="brand-name">DeskPane</span>
        <span class="brand-divider"></span>
        <span class="brand-product">{{ t('header.sub') }}</span>
      </div>
      <nav class="header-nav">
        <a
          v-for="link in demoLinks"
          :key="link.label"
          :href="link.href"
          :target="link.external ? '_blank' : undefined"
          :rel="link.external ? 'noopener' : undefined"
          :class="{ active: link.active }"
        >{{ link.label }}</a>
        <button class="lang-btn" @click="locale = locale === 'en' ? 'zh-TW' : 'en'">
          {{ locale === 'en' ? '中文' : 'EN' }}
        </button>
      </nav>
    </header>

    <div class="docs-subbar">
      <button class="menu-btn" type="button" @click="sidebarOpen = !sidebarOpen" aria-label="Toggle navigation">
        <span></span>
        <span></span>
        <span></span>
      </button>
      <div class="breadcrumb">
        <button type="button" @click="currentPageId = 'overview'">Demos</button>
        <span>/</span>
        <button type="button" @click="selectFirstInCategory">{{ currentCategoryLabel }}</button>
        <span>/</span>
        <strong>{{ currentPageLabel }}</strong>
      </div>
      <label class="search-box">
        <span>Search</span>
        <input v-model="searchQuery" type="search" placeholder="Search demos, API, framework..." />
      </label>
    </div>

    <div class="docs-body">
      <aside class="docs-sidebar" :class="{ open: sidebarOpen }">
        <SideNav
          :nav="navConfig"
          :query="searchQuery"
          :active="currentPageId"
          @update:active="selectPage"
        />
      </aside>

      <main class="docs-main">
        <div class="content-scroll">
          <component
            :is="currentPage"
            :key="currentPageId"
          />
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, defineAsyncComponent } from 'vue'
import type { Ref } from 'vue'
import SideNav from './components/SideNav.vue'
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
const searchQuery = ref('')
const sidebarOpen = ref(false)

const demoLinks = computed(() => [
  { label: t('header.demos'), href: '../../index.html' },
  { label: 'Docs', href: './index.html', active: true },
  { label: 'Desktop', href: '../../desktop/index.html' },
  { label: 'Theme', href: '../../theme-editor/index.html' },
  { label: 'GitHub', href: 'https://github.com/0obriano0/DeskPane', external: true },
])

const PAGE_MAP: Record<string, ReturnType<typeof defineAsyncComponent>> = {
  'overview':       defineAsyncComponent(() => import('./pages/Overview.vue')),
  'installation':   defineAsyncComponent(() => import('./pages/Installation.vue')),
  'quick-start':    defineAsyncComponent(() => import('./pages/QuickStart.vue')),
  'troubleshooting': defineAsyncComponent(() => import('./pages/Troubleshooting.vue')),
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
  'dom-content':    defineAsyncComponent(() => import('./pages/DomContent.vue')),
}

const currentPage = computed(() => PAGE_MAP[currentPageId.value])

const flatNav = computed(() =>
  navConfig.value.flatMap(category =>
    category.items.map(item => ({ ...item, category: category.label }))
  )
)

const currentNavItem = computed(() =>
  flatNav.value.find(item => item.id === currentPageId.value)
)

const currentCategoryLabel = computed(() => currentNavItem.value?.category ?? 'Demos')
const currentPageLabel = computed(() => currentNavItem.value?.label ?? 'Overview')

function selectFirstInCategory() {
  const category = navConfig.value.find(group => group.label === currentCategoryLabel.value)
  const first = category?.items[0]
  if (first) currentPageId.value = first.id
}

function selectPage(id: string) {
  currentPageId.value = id
  sidebarOpen.value = false
}
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
  background: #fff;
}

.docs-header {
  height: 64px;
  background: #2f9bb3;
  display: flex;
  align-items: center;
  padding: 0 24px;
  gap: 18px;
  flex-shrink: 0;
  min-width: 0;
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #fff;
  flex: 0 0 auto;
  min-width: 0;
}

.brand-mark {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border: 2px solid rgba(255,255,255,0.8);
  font-size: 13px;
  font-weight: 800;
  line-height: 1;
}

.brand-name {
  font-size: 24px;
  font-weight: 800;
  white-space: nowrap;
}

.brand-divider {
  width: 1px;
  height: 26px;
  background: rgba(255,255,255,0.5);
}

.brand-product {
  font-size: 16px;
  font-weight: 600;
  color: rgba(255,255,255,0.9);
  white-space: nowrap;
}

.header-nav {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  overflow-x: auto;
  scrollbar-width: none;
  padding: 8px 0;
}

.header-nav::-webkit-scrollbar {
  display: none;
}

.header-nav a {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 34px;
  padding: 0 10px;
  border: 1px solid transparent;
  color: rgba(255,255,255,0.9);
  font-size: 12px;
  font-weight: 700;
  text-decoration: none;
  text-transform: uppercase;
  white-space: nowrap;
  letter-spacing: 0;
}

.header-nav a:hover,
.header-nav a.active {
  color: #fff;
  border-color: rgba(255,255,255,0.85);
  background: rgba(255,255,255,0.12);
}

.lang-btn {
  background: transparent;
  border: 1px solid rgba(255,255,255,0.85);
  color: #fff;
  min-height: 34px;
  padding: 0 12px;
  font-size: 12px;
  cursor: pointer;
  font-weight: 700;
  border-radius: 0;
  white-space: nowrap;
  flex: 0 0 auto;
}

.lang-btn:hover { background: rgba(255,255,255,0.16); }

.docs-subbar {
  height: 45px;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 0 28px;
  border-bottom: 1px solid #d9e0e5;
  background: #f4f6f8;
  flex-shrink: 0;
}

.menu-btn {
  width: 26px;
  display: none;
  border: 0;
  background: transparent;
  padding: 4px 2px;
  cursor: pointer;
}

.menu-btn span {
  display: block;
  height: 2px;
  background: #425466;
  margin: 4px 0;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  color: #6b7785;
  font-size: 14px;
}

.breadcrumb button {
  border: 0;
  background: transparent;
  color: #536577;
  padding: 0;
  cursor: pointer;
  font: inherit;
}

.breadcrumb button:hover { color: #087c98; }
.breadcrumb strong {
  color: #2b3a45;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.search-box {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 8px;
  width: min(320px, 34vw);
}

.search-box span {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
}

.search-box input {
  width: 100%;
  height: 30px;
  border: 1px solid #b8c2cc;
  border-radius: 3px;
  padding: 0 12px;
  font: inherit;
  background: #fff;
}

.search-box input:focus {
  outline: 2px solid rgba(47,155,179,0.22);
  border-color: #2f9bb3;
}

.docs-body {
  flex: 1;
  display: flex;
  overflow: hidden;
  min-height: 0;
}

.docs-sidebar {
  width: 310px;
  flex-shrink: 0;
  border-right: 1px solid #d9e0e5;
  background: var(--color-sidebar-bg);
  overflow-y: auto;
}

.docs-main {
  flex: 1;
  display: flex;
  min-width: 0;
  background: #fff;
}

.content-scroll {
  flex: 1;
  overflow: auto;
  padding: 0 34px 56px;
  min-width: 0;
}

@media (max-width: 1180px) {
  .docs-sidebar {
    position: fixed;
    top: 109px;
    bottom: 0;
    left: 0;
    z-index: 20;
    transform: translateX(-100%);
    transition: transform 0.18s ease;
    box-shadow: 8px 0 24px rgba(16,24,40,0.15);
  }

  .docs-sidebar.open {
    transform: translateX(0);
  }

  .menu-btn {
    display: block;
  }

  .docs-main {
    min-height: 0;
  }
}

@media (max-width: 760px) {
  .docs-header {
    padding: 0 12px;
    gap: 10px;
  }

  .brand-product {
    display: none;
  }

  .brand-mark {
    width: 30px;
    height: 30px;
  }

  .brand-name {
    font-size: 20px;
  }

  .docs-subbar {
    padding: 0 14px;
    gap: 10px;
  }

  .search-box {
    width: 40vw;
  }

  .content-scroll {
    padding: 0 18px 40px;
  }
}
</style>
