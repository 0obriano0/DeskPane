<template>
  <div class="page">
    <div class="page-badge">
      <span class="badge badge-green">{{ t('theme.badge') }}</span>
    </div>
    <h1>{{ t('theme.h1') }}</h1>
    <p v-html="t('theme.intro')"></p>

    <h2>{{ t('theme.h2Load') }}</h2>
    <pre class="code-block" v-pre>&lt;!-- In your HTML &lt;head&gt; --&gt;
&lt;link id="dp-theme" rel="stylesheet" href="dist/themes/light.css"&gt;

&lt;!-- Or the bundled dark theme --&gt;
&lt;link id="dp-theme" rel="stylesheet" href="dist/themes/dark.css"&gt;

&lt;!-- Legacy compatibility theme --&gt;
&lt;link id="dp-theme" rel="stylesheet" href="dist/themes/medieval-pixel.css"&gt;

&lt;!-- Demo-local showcases, not package built-ins --&gt;
&lt;link id="dp-theme" rel="stylesheet" href="../win7/win7-theme.css"&gt;
&lt;link id="dp-theme" rel="stylesheet" href="../xp/xp-theme.css"&gt;</pre>

    <h2>{{ t('theme.h2SetTheme') }}</h2>
    <p v-html="t('theme.setThemeDesc')"></p>
    <table class="api-table">
      <thead>
        <tr>
          <th>{{ t('theme.col.option') }}</th>
          <th>{{ t('theme.col.type') }}</th>
          <th>{{ t('theme.col.default') }}</th>
          <th>{{ t('common.description') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr><td><code>basePath</code></td><td><code>string</code></td><td><code>'themes'</code></td><td v-html="t('theme.opt.basePath')"></td></tr>
        <tr><td><code>linkId</code></td><td><code>string</code></td><td><code>'dp-theme'</code></td><td v-html="t('theme.opt.linkId')"></td></tr>
      </tbody>
    </table>

    <!-- Live Demo -->
    <h2>{{ t('theme.liveLabel') }}</h2>
    <div class="theme-switcher">
      <button
        class="btn"
        :class="{ active: demoTheme === 'light' }"
        @click="setDemoTheme('light')"
      >☀️ {{ t('theme.switchLight') }}</button>
      <button
        class="btn"
        :class="{ active: demoTheme === 'dark' }"
        @click="setDemoTheme('dark')"
      >🌙 {{ t('theme.switchDark') }}</button>
    </div>
    <div ref="demoEl" class="demo-area" :class="'theme-' + demoTheme">
      <div class="demo-viewport-inner" ref="container"></div>
    </div>
    <p class="demo-note" v-html="t('theme.demoNote')"></p>

    <h2>{{ t('theme.h2CoreVars') }}</h2>
    <table class="api-table">
      <thead>
        <tr>
          <th>{{ t('theme.col.var') }}</th>
          <th>{{ t('theme.col.desc') }}</th>
          <th>{{ t('theme.col.light') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="v in coreVars" :key="v.name">
          <td><code>{{ v.name }}</code></td>
          <td>{{ v.desc }}</td>
          <td>
            <span v-if="v.swatch" class="swatch" :style="{ background: v.swatch }"></span>
            <code>{{ v.value }}</code>
          </td>
        </tr>
      </tbody>
    </table>

    <h2>{{ t('theme.h2DesktopVars') }}</h2>
    <p v-html="t('theme.note.rgba')"></p>
    <table class="api-table">
      <thead>
        <tr>
          <th>{{ t('theme.col.var') }}</th>
          <th>{{ t('theme.col.desc') }}</th>
          <th>{{ t('theme.col.light') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="v in desktopVars" :key="v.name">
          <td><code>{{ v.name }}</code></td>
          <td>{{ v.desc }}</td>
          <td><code>{{ v.value }}</code></td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { WindowManager } from '@deskpane/core/WindowManager'
import { useDocCode } from '../composables/useDocCode'
import { useLocale } from '../composables/useLocale'

const { setCode } = useDocCode()
const { t } = useLocale()
const container = ref<HTMLElement | null>(null)
let wm: WindowManager | null = null
const demoTheme = ref<'light' | 'dark'>('light')

const LIGHT_VARS = {
  '--dp-window-header-bg': '#f0f0f0',
  '--dp-window-title-color': '#333333',
  '--dp-window-border': '#d0d0d0',
  '--dp-window-border-active': '#4a90e2',
  '--dp-window-shadow': '0 2px 12px rgba(0,0,0,0.12)',
  '--dp-window-shadow-active': '0 4px 24px rgba(0,0,0,0.22)',
  '--dp-window-header-border': '#e0e0e0',
  '--dp-window-btn-color': '#555555',
  '--dp-window-btn-hover-bg': 'rgba(0,0,0,0.08)',
  '--dp-window-btn-close-hover-bg': '#e53e3e',
  '--dp-window-btn-close-hover-color': '#ffffff',
  '--dp-window-body-bg': '#ffffff',
  '--dp-window-body-color': '#222222',
  '--dp-snap-guide-color': 'rgba(74,144,226,0.4)',
}
const DARK_VARS = {
  '--dp-window-header-bg': '#181825',
  '--dp-window-title-color': '#cdd6f4',
  '--dp-window-border': '#313244',
  '--dp-window-border-active': '#89b4fa',
  '--dp-window-shadow': '0 2px 12px rgba(0,0,0,0.5)',
  '--dp-window-shadow-active': '0 4px 24px rgba(0,0,0,0.6)',
  '--dp-window-header-border': '#313244',
  '--dp-window-btn-color': '#a6adc8',
  '--dp-window-btn-hover-bg': 'rgba(255,255,255,0.08)',
  '--dp-window-btn-close-hover-bg': '#f38ba8',
  '--dp-window-btn-close-hover-color': '#1e1e2e',
  '--dp-window-body-bg': '#1e1e2e',
  '--dp-window-body-color': '#cdd6f4',
  '--dp-snap-guide-color': 'rgba(137,180,250,0.4)',
}

const demoEl = ref<HTMLElement | null>(null)

function applyThemeVars(theme: 'light' | 'dark') {
  const el = demoEl.value
  if (!el) return
  const vars = theme === 'light' ? LIGHT_VARS : DARK_VARS
  for (const [key, val] of Object.entries(vars)) {
    el.style.setProperty(key, val)
  }
  el.style.background = theme === 'dark' ? '#11111b' : '#f8fafc'
}

function setDemoTheme(theme: 'light' | 'dark') {
  demoTheme.value = theme
  applyThemeVars(theme)
}

const coreVars = [
  { name: '--dp-window-header-bg',             desc: 'Title bar background',            value: '#f0f0f0',                           swatch: '#f0f0f0' },
  { name: '--dp-window-title-color',           desc: 'Title bar text',                  value: '#333333',                           swatch: '#333333' },
  { name: '--dp-window-border',                desc: 'Window border',                   value: '#d0d0d0',                           swatch: '#d0d0d0' },
  { name: '--dp-window-border-active',         desc: 'Active window border',            value: '#4a90e2',                           swatch: '#4a90e2' },
  { name: '--dp-window-shadow',                desc: 'Window shadow',                   value: '0 2px 12px rgba(0,0,0,0.12)',       swatch: null },
  { name: '--dp-window-shadow-active',         desc: 'Active window shadow',            value: '0 4px 24px rgba(0,0,0,0.22)',       swatch: null },
  { name: '--dp-window-header-border',         desc: 'Title bar bottom border',         value: '#e0e0e0',                           swatch: '#e0e0e0' },
  { name: '--dp-window-btn-color',             desc: 'Control button icon',             value: '#555555',                           swatch: '#555555' },
  { name: '--dp-window-btn-hover-bg',          desc: 'Control button hover background', value: 'rgba(0,0,0,0.08)',                  swatch: null },
  { name: '--dp-window-btn-close-hover-bg',    desc: 'Close button hover background',   value: '#e53e3e',                           swatch: '#e53e3e' },
  { name: '--dp-window-btn-close-hover-color', desc: 'Close button hover text',         value: '#ffffff',                           swatch: '#ffffff' },
  { name: '--dp-window-body-bg',               desc: 'Window body background',          value: '#ffffff',                           swatch: '#ffffff' },
  { name: '--dp-window-body-color',            desc: 'Window body text',                value: '#222222',                           swatch: '#222222' },
  { name: '--dp-snap-guide-color',      desc: 'Snap guide line colour',          value: 'rgba(74,144,226,0.4)',              swatch: null },
]

const desktopVars = [
  { name: '--dp-desktop-bg',            desc: 'Desktop background (gradient OK)', value: 'linear-gradient(135deg,#f0f4f8,#e2e8f0)' },
  { name: '--dp-desktop-icon-text',     desc: 'Desktop icon label text',          value: '#1a202c' },
  { name: '--dp-desktop-icon-hover-bg', desc: 'Desktop icon hover background',    value: 'rgba(0,0,0,0.08)' },
  { name: '--dp-dock-bg',               desc: 'Dock background (rgba OK)',         value: 'rgba(255,255,255,0.75)' },
  { name: '--dp-dock-border',           desc: 'Dock border (rgba OK)',             value: 'rgba(0,0,0,0.10)' },
  { name: '--dp-dock-item-hover-bg',    desc: 'Dock item hover background',        value: 'rgba(0,0,0,0.06)' },
  { name: '--dp-font',                  desc: 'Global font family',                value: 'system-ui,-apple-system,sans-serif' },
]

onMounted(() => {
  if (container.value) {
    wm = new WindowManager({ container: container.value, isolated: true, snap: true, snapGap: 4 })
    const div = document.createElement('div')
    div.style.cssText = 'padding:14px;font-size:13px;'
    div.innerHTML = '<p style="margin:0 0 6px"><strong>Themed window</strong></p><p style="margin:0;font-size:12px;color:var(--dp-window-body-color,#666)">Toggle Light/Dark above</p>'
    wm.open({ id: 'theme-demo', title: 'Theme Preview', content: div, x: 30, y: 20, width: 260, height: 120 })
  }
  applyThemeVars('light')
  setCode([
    {
      name: 'html-link.html',
      lang: 'html',
      code: `<!-- Load light theme (covers Core + Desktop, 22 CSS variables) -->
<link id="dp-theme" rel="stylesheet" href="dist/themes/light.css">

<!-- Or dark theme -->
<link id="dp-theme" rel="stylesheet" href="dist/themes/dark.css">

<!-- Legacy compatibility theme -->
<link id="dp-theme" rel="stylesheet" href="dist/themes/medieval-pixel.css">

<!-- Demo-local showcases, not package built-ins -->
<link id="dp-theme" rel="stylesheet" href="../win7/win7-theme.css">
<link id="dp-theme" rel="stylesheet" href="../xp/xp-theme.css">`,
    },
    {
      name: 'setTheme.ts',
      lang: 'typescript',
      code: `import { setTheme } from 'deskpane'

// Switch to dark theme (basePath defaults to 'themes')
setTheme('dark')

// With explicit base path (Vite SPA)
setTheme('light', { basePath: '/themes' })

// Legacy compatibility theme
setTheme('medieval-pixel', { basePath: 'dist/themes' })

// Direct app or demo CSS paths are used as-is
setTheme('../win7/win7-theme.css')
setTheme('../xp/xp-theme.css')

// Relative to dist/
setTheme('dark', { basePath: 'dist/themes' })

// Custom link element id (if you manage the <link> yourself)
setTheme('dark', { linkId: 'my-dp-theme' })

// UMD (no import needed)
// DeskPane.setTheme('dark', { basePath: 'dist/themes' })`,
    },
    {
      name: 'custom-vars.css',
      lang: 'css',
      code: `/* Override individual variables after loading the theme */
:root {
  --dp-window-border-active: #7c3aed;   /* purple accent */
  --dp-window-header-bg:     #f3f0ff;   /* lavender title bar */
}`,
    },
  ])
})

onUnmounted(() => wm?.destroy())
</script>

<style scoped>
.page { max-width: 760px; }

.code-block {
  background: #1e1e2e;
  color: #cdd6f4;
  padding: 12px 16px;
  border-radius: 6px;
  font-size: 12.5px;
  line-height: 1.6;
  overflow-x: auto;
  margin: 0 0 12px;
  white-space: pre;
  font-family: 'Cascadia Code', 'Fira Code', monospace;
}

.theme-switcher {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.btn {
  padding: 6px 16px;
  background: var(--color-primary);
  color: #fff;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  opacity: 0.7;
  transition: opacity 0.1s, background 0.1s;
}
.btn:hover { opacity: 0.9; }
.btn.active { opacity: 1; outline: 2px solid var(--color-primary); outline-offset: 2px; }

.demo-area {
  border: 1px solid var(--color-demo-border);
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 8px;
}

.demo-viewport-inner {
  height: 220px;
  position: relative;
  overflow: hidden;
  transition: background 0.3s;
}

.demo-note { font-size: 12px; color: var(--color-text-muted); margin-top: 0; }

.swatch {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 2px;
  border: 1px solid rgba(0,0,0,0.15);
  vertical-align: middle;
  margin-right: 4px;
}
</style>
