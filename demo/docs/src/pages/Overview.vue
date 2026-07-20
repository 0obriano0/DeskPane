<template>
  <div class="overview-page">
    <div class="overview-grid">
      <section id="overview-intro" class="intro-column">
        <span class="eyebrow">{{ t('overview.badge') }}</span>
        <h1>{{ locale === 'en' ? 'A desktop engine for the web' : '為網頁而生的桌面引擎' }}</h1>
        <p class="hero-copy">{{ locale === 'en'
          ? 'DeskPane brings native desktop patterns to the browser. Create windows, manage state, and build powerful productivity experiences.'
          : 'DeskPane 將原生桌面操作模式帶進瀏覽器，協助你建立視窗、管理狀態，打造強大的生產力體驗。' }}</p>

        <div id="overview-start" class="quick-start">
          <h2>{{ locale === 'en' ? 'Get started in two steps' : '兩個步驟快速開始' }}</h2>
          <div class="step">
            <span class="step-number">1</span>
            <div class="step-body">
              <strong>{{ locale === 'en' ? 'Install' : '安裝' }}</strong>
              <div class="command-line">
                <code>npm install deskpane</code>
                <button type="button" @click="copy('npm install deskpane')">{{ copyState }}</button>
              </div>
            </div>
          </div>
          <div class="step">
            <span class="step-number">2</span>
            <div class="step-body">
              <strong>{{ locale === 'en' ? 'Open your first window' : '開啟第一個視窗' }}</strong>
              <pre class="hero-code"><code><span class="syntax-key">import</span> { WindowManager } <span class="syntax-key">from</span> <span class="syntax-string">'deskpane'</span>

<span class="syntax-key">const</span> wm = <span class="syntax-key">new</span> WindowManager()
wm.open({
  id: <span class="syntax-string">'welcome'</span>,
  title: <span class="syntax-string">'Welcome'</span>,
  content,
})</code></pre>
            </div>
          </div>
          <div class="hero-actions">
            <button type="button" class="primary-action" @click="runExample">{{ locale === 'en' ? 'Run example' : '執行範例' }}</button>
            <button type="button" class="text-action" @click="$emit('navigate', 'quick-start')">{{ locale === 'en' ? 'View full quick start' : '查看完整快速開始' }}</button>
          </div>
        </div>
      </section>

      <section id="overview-demo" class="playground" aria-label="DeskPane live example">
        <div class="playground-toolbar">
          <strong>{{ locale === 'en' ? 'Live example' : '即時範例' }}</strong>
          <button type="button" @click="resetDemo">{{ locale === 'en' ? 'Reset' : '重設' }}</button>
        </div>
        <div ref="desktop" class="desktop-surface"></div>
      </section>
    </div>

    <section id="overview-next" class="next-steps">
      <button type="button" @click="$emit('navigate', 'open-close')">
        <span><strong>{{ locale === 'en' ? 'Window lifecycle' : '視窗生命週期' }}</strong><small>{{ locale === 'en' ? 'Create, update, focus, and dispose windows.' : '建立、更新、聚焦與關閉視窗。' }}</small></span>
        <span class="row-action">{{ locale === 'en' ? 'Explore' : '探索' }}</span>
      </button>
      <button type="button" @click="$emit('navigate', 'desktop')">
        <span><strong>{{ locale === 'en' ? 'Desktop shell' : '桌面外殼' }}</strong><small>{{ locale === 'en' ? 'Add desktop icons, dock, menus, and more.' : '加入桌面圖示、Dock、選單等功能。' }}</small></span>
        <span class="row-action">{{ locale === 'en' ? 'Explore' : '探索' }}</span>
      </button>
      <button type="button" @click="$emit('navigate', 'quick-start')">
        <span><strong>{{ locale === 'en' ? 'Framework adapters' : '框架整合' }}</strong><small>{{ locale === 'en' ? 'Integrate with Vue, React, jQuery, or plain DOM.' : '整合 Vue、React、jQuery 或原生 DOM。' }}</small></span>
        <span class="row-action">{{ locale === 'en' ? 'Explore' : '探索' }}</span>
      </button>
    </section>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { WindowManager } from '@deskpane/core/WindowManager'
import { Desktop } from '@deskpane/desktop/Desktop'
import displayIcon from '@fortawesome/fontawesome-free/svgs/solid/display.svg?url'
import fileIcon from '@fortawesome/fontawesome-free/svgs/solid/file-lines.svg?url'
import folderIcon from '@fortawesome/fontawesome-free/svgs/solid/folder.svg?url'
import terminalIcon from '@fortawesome/fontawesome-free/svgs/solid/terminal.svg?url'
import wifiIcon from '@fortawesome/fontawesome-free/svgs/solid/wifi.svg?url'
import volumeIcon from '@fortawesome/fontawesome-free/svgs/solid/volume-high.svg?url'
import layoutIcon from '@fortawesome/fontawesome-free/svgs/regular/window-maximize.svg?url'
import { useDocCode } from '../composables/useDocCode'
import { useLocale } from '../composables/useLocale'

defineEmits<{ (event: 'navigate', id: string): void }>()
const { setCode } = useDocCode()
const { locale, t } = useLocale()
const desktop = ref<HTMLElement | null>(null)
const copyState = ref('Copy')
let wm: WindowManager | null = null
let desk: Desktop | null = null

const sampleCode = [
  "import { WindowManager } from 'deskpane'",
  '',
  'const wm = new WindowManager()',
  "const content = document.createElement('div')",
  "content.textContent = 'Hello from DeskPane'",
  '',
  'wm.open({',
  "  id: 'welcome',",
  "  title: 'Welcome',",
  '  content,',
  '})',
].join('\n')

function initDemo() {
  if (!desktop.value) return

  desk = new Desktop({
    container: desktop.value,
    storageKey: 'deskpane-docs-overview',
    background: '#2a94ad',
    iconSnap: true,
    dock: {
      position: 'bottom',
      iconSize: 24,
      showLabels: false,
      items: [
        { id: 'files', label: 'Files', icon: folderIcon, action: runExample },
        { id: 'documents', label: 'Documents', icon: fileIcon, action: runExample },
        { id: 'terminal', label: 'Terminal', icon: terminalIcon, action: runExample },
        { id: 'network', label: 'Wi-Fi connected', icon: wifiIcon, action: () => undefined },
        { id: 'volume', label: 'Volume', icon: volumeIcon, action: () => undefined },
        { id: 'layout', label: 'Show desktop', icon: layoutIcon, action: () => wm?.getWindowIds().forEach(id => wm?.minimize(id)) },
      ],
    },
    icons: [
      { id: 'explorer', label: 'Explorer', icon: displayIcon, x: 16, y: 18, action: runExample },
      { id: 'notes', label: 'Notes.txt', icon: fileIcon, x: 16, y: 108, action: runExample },
    ],
  })

  wm = new WindowManager({ container: desk.getElement(), isolated: true })
  desk.syncDockWithWindows(wm, {
    getDockItem: (_appId, event) => ({
      label: event.label ?? event.title ?? 'Window',
      icon: event.icon ?? displayIcon,
    }),
  })
}

function runExample() {
  if (!wm) initDemo()

  const explorer = document.createElement('div')
  explorer.className = 'overview-explorer'
  explorer.innerHTML = '<div class="explorer-path">Home / Projects</div><div class="explorer-head"><span>Name</span><span>Updated</span></div><div class="explorer-row"><strong>Roadmap.md</strong><span>Today</span></div><div class="explorer-row"><strong>Demo.tsx</strong><span>May 19</span></div><div class="explorer-row"><strong>WindowService.ts</strong><span>May 18</span></div><div class="explorer-row"><strong>theme.css</strong><span>May 18</span></div>'
  wm?.open({ id: 'overview-explorer', title: 'Explorer', content: explorer, width: 410, height: 255, x: 190, y: 24 })

  const content = document.createElement('div')
  content.className = 'overview-window-content'
  content.innerHTML = '<strong>Welcome to DeskPane</strong><p>Drag this window, resize it, or try the title-bar controls.</p>'
  wm?.open({ id: 'overview-welcome', title: 'Welcome', content, width: 300, height: 185, x: 32, y: 180 })

  const notes = document.createElement('div')
  notes.className = 'overview-window-content overview-notes'
  notes.innerHTML = '<strong>Project notes</strong><p>Window lifecycle<br>Layout and snapping<br>State persistence</p>'
  wm?.open({ id: 'overview-notes', title: 'Notes', content: notes, width: 260, height: 170, x: 390, y: 270 })
}

function resetDemo() {
  wm?.destroy()
  desk?.destroy()
  wm = null
  desk = null
  initDemo()
  runExample()
}

async function copy(value: string) {
  await navigator.clipboard?.writeText(value)
  copyState.value = locale.value === 'en' ? 'Copied' : '已複製'
  window.setTimeout(() => { copyState.value = 'Copy' }, 1400)
}

onMounted(() => {
  initDemo()
  runExample()
  setCode([{ name: 'main.ts', lang: 'typescript', code: sampleCode }])
})
onUnmounted(() => {
  wm?.destroy()
  desk?.destroy()
})
</script>

<style scoped>
.overview-page { width: min(1280px, 100%); margin: 0 auto; padding: 22px 0 40px; }
.overview-grid { display: grid; grid-template-columns: minmax(380px, .72fr) minmax(620px, 1.28fr); gap: 30px; align-items: stretch; }
.intro-column { min-width: 0; padding: 10px 0; }
.eyebrow { display: inline-flex; padding: 4px 10px; border-radius: 999px; background: #e6f3f6; color: #087f9c; font-size: 12px; font-weight: 700; }
h1 { max-width: 480px; margin-top: 18px; font-size: clamp(38px, 2.7vw, 48px); line-height: 1.06; }
.hero-copy { max-width: 500px; color: #4d5b6c; font-size: 15px; line-height: 1.65; }
.quick-start { margin-top: 24px; padding-top: 8px; border-top: 1px solid #dfe5ea; }
.quick-start h2 { margin: 14px 0 16px; font-size: 18px; }
.step { display: flex; gap: 12px; margin-bottom: 14px; }
.step-number { display: grid; place-items: center; width: 24px; height: 24px; flex: 0 0 24px; border-radius: 50%; background: #078daa; color: #fff; font-size: 12px; font-weight: 800; }
.step-body { min-width: 0; flex: 1; }
.step-body > strong { display: block; margin: 2px 0 8px; }
.command-line { display: flex; align-items: center; gap: 8px; border: 1px solid #d8e0e6; border-radius: 6px; background: #f8fafb; padding: 8px 10px; }
.command-line code { flex: 1; background: none; color: #283649; }
.command-line button, .playground-toolbar button { border: 0; background: transparent; color: #087f9c; font: inherit; font-size: 12px; cursor: pointer; }
.hero-code { overflow: auto; margin: 0; border: 1px solid #d8e0e6; border-radius: 6px; background: #f8fafb; padding: 12px 14px; color: #253348; font: 12px/1.55 'Cascadia Code', Consolas, monospace; }
.hero-code code { background: none; padding: 0; color: inherit; }
.syntax-key { color: #7854b8; }.syntax-string { color: #a72d4f; }
.hero-actions { display: flex; align-items: center; gap: 16px; margin: 14px 0 0 36px; }
.primary-action, .text-action { min-height: 36px; border-radius: 5px; padding: 0 14px; font: inherit; font-size: 13px; font-weight: 700; cursor: pointer; }
.primary-action { border: 1px solid #0785a3; background: #0785a3; color: #fff; }
.primary-action:hover { background: #066f89; }.text-action { border: 0; background: transparent; color: #087f9c; padding: 0; }
.playground { min-width: 0; display: flex; flex-direction: column; align-self: center; border: 1px solid #d7e0e6; border-radius: 8px; overflow: hidden; background: #fff; box-shadow: 0 14px 32px rgba(29, 58, 77, .10); }
.playground-toolbar { height: 48px; display: flex; align-items: center; justify-content: space-between; padding: 0 16px; border-bottom: 1px solid #d7e0e6; color: #344256; font-size: 13px; }
.desktop-surface { position: relative; height: 480px; overflow: hidden; background: #2a94ad; }
.desktop-surface :deep(.dp-desktop) { width: 100%; height: 100%; position: absolute; inset: 0; overflow: hidden; }
.desktop-surface :deep(.dp-desktop-icon-area) { z-index: 1; }
.desktop-surface :deep(.dp-desktop-window-area) { z-index: 2; }
.desktop-surface :deep(.dp-dock) { z-index: 4; }
.desktop-surface :deep(.dp-desktop-icon) { transform: scale(.78); transform-origin: top left; }
.desktop-shortcuts { position: absolute; z-index: 1; top: 18px; left: 16px; display: grid; gap: 14px; }
.desktop-shortcuts button { width: 70px; border: 0; background: transparent; color: #fff; display: grid; justify-items: center; gap: 6px; padding: 5px; font: inherit; font-size: 11px; cursor: default; text-shadow: 0 1px 2px rgba(0,0,0,.28); }
.desktop-shortcuts button:hover, .desktop-shortcuts button:focus-visible { border-radius: 4px; background: rgba(255,255,255,.16); outline: 1px solid rgba(255,255,255,.48); }
.desktop-shortcuts i { font-size: 30px; color: #effaff; filter: drop-shadow(0 2px 2px rgba(0,0,0,.18)); }
.desktop-taskbar { height: 48px; display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 0 12px; border-top: 1px solid #cbd5dc; background: #eef3f5; color: #526173; font-size: 12px; }
.taskbar-apps, .system-tray { display: flex; align-items: center; gap: 8px; }
.taskbar-apps button { display: grid; place-items: center; width: 32px; height: 32px; border: 0; border-radius: 5px; background: transparent; color: #34475b; font: inherit; cursor: pointer; }
.taskbar-apps button:hover { background: #dce7eb; }
.taskbar-apps i { font-size: 17px; }.taskbar-apps .fa-folder { color: #e9a51a; }.taskbar-apps .fa-file-lines { color: #2f80d8; }.taskbar-apps .fa-terminal { color: #263544; }
.taskbar-mark { background: #fff !important; color: #0785a3 !important; font-size: 15px !important; font-weight: 800 !important; box-shadow: 0 1px 3px rgba(20,40,55,.12); }
.system-tray { gap: 13px; color: #26384a; }
.system-tray i { font-size: 14px; }.system-tray time { font-variant-numeric: tabular-nums; }
.next-steps { margin-top: 26px; border-top: 1px solid #dfe5ea; }
.next-steps button { width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 20px; border: 0; border-bottom: 1px solid #dfe5ea; background: transparent; padding: 16px 10px; color: #172033; text-align: left; cursor: pointer; }
.next-steps button:hover { background: #f7fafb; }.next-steps button > span:first-child { display: flex; align-items: baseline; gap: 18px; min-width: 0; }
.next-steps strong { min-width: 150px; font-size: 14px; }.next-steps small { color: #637083; font-size: 13px; }.row-action { color: #0785a3; font-size: 12px; font-weight: 700; }
:deep(.overview-explorer) { padding: 10px 12px; color: #334155; font-size: 12px; }
:deep(.explorer-path) { margin: -10px -12px 10px; padding: 9px 12px; border-bottom: 1px solid #e1e6ea; background: #f7f9fa; font-weight: 600; }
:deep(.explorer-head), :deep(.explorer-row) { display: grid; grid-template-columns: 1fr 72px; gap: 12px; padding: 6px 4px; border-bottom: 1px solid #e7ebee; }
:deep(.explorer-head) { color: #738093; font-size: 11px; font-weight: 700; }
:deep(.explorer-row span) { color: #7b8795; text-align: right; }
:deep(.overview-window-content) { padding: 22px; color: #243147; font-size: 14px; line-height: 1.55; }
:deep(.overview-window-content strong) { display: block; margin-bottom: 10px; font-size: 18px; }
:deep(.overview-window-content p) { margin: 0; }
@media (max-width: 980px) { .overview-grid { grid-template-columns: 1fr; }.playground { width: 100%; }.desktop-surface { height: 420px; } }
@media (max-width: 640px) { .overview-page { padding-top: 10px; }.desktop-surface { height: 340px; }.hero-actions { margin-left: 0; }.next-steps button > span:first-child { align-items: flex-start; flex-direction: column; gap: 4px; }.next-steps strong { min-width: 0; } }
</style>