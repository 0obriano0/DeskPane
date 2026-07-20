<template>
  <div class="page">
    <div class="page-badge">
      <span class="badge badge-green">{{ t('menus.badge') }}</span>
    </div>
    <h1>{{ t('menus.h1') }}</h1>
    <p v-html="t('menus.intro')"></p>

    <DocSampleLayout>
      <DocSampleTabs
        v-model="activeSample"
        :samples="samples"
        aria-label="Menu framework samples"
      />

      <h2>{{ t('menus.h2Demo') }}</h2>
      <p v-html="t('menus.demoDesc')"></p>

      <DemoViewport ref="viewport" @reset="onReset">
        <template #controls>
          <button ref="startButton" class="btn" type="button">{{ t('menus.startBtn') }}</button>
          <button class="btn btn-alt" type="button" @click="showContextMenu">{{ t('menus.contextBtn') }}</button>
        </template>
      </DemoViewport>
    </DocSampleLayout>

    <h2>{{ t('menus.h2Items') }}</h2>
    <table class="api-table">
      <thead>
        <tr><th>{{ t('menus.col.option') }}</th><th>{{ t('menus.col.type') }}</th><th>{{ t('menus.col.desc') }}</th></tr>
      </thead>
      <tbody>
        <tr><td><code>id</code></td><td><code>string</code></td><td v-html="t('menus.item.id')"></td></tr>
        <tr><td><code>label</code></td><td><code>string</code></td><td v-html="t('menus.item.label')"></td></tr>
        <tr><td><code>icon</code></td><td><code>string</code></td><td v-html="t('menus.item.icon')"></td></tr>
        <tr><td><code>shortcut</code></td><td><code>string</code></td><td v-html="t('menus.item.shortcut')"></td></tr>
        <tr><td><code>disabled</code> / <code>checked</code></td><td><code>boolean</code></td><td v-html="t('menus.item.state')"></td></tr>
        <tr><td><code>children</code></td><td><code>MenuItemConfig[]</code></td><td v-html="t('menus.item.children')"></td></tr>
        <tr><td><code>action</code></td><td><code>(event) =&gt; void</code></td><td v-html="t('menus.item.action')"></td></tr>
        <tr><td><code>type: 'separator'</code></td><td><code>MenuSeparatorItem</code></td><td v-html="t('menus.item.separator')"></td></tr>
      </tbody>
    </table>

    <h2>{{ t('menus.h2Api') }}</h2>
    <table class="api-table">
      <thead>
        <tr><th>{{ t('menus.col.api') }}</th><th>{{ t('menus.col.desc') }}</th></tr>
      </thead>
      <tbody>
        <tr><td><code>ContextMenu.showAt(x, y)</code></td><td v-html="t('menus.api.showAt')"></td></tr>
        <tr><td><code>ContextMenu.showFor(anchor, placement?)</code></td><td v-html="t('menus.api.showFor')"></td></tr>
        <tr><td><code>ContextMenu.bindTo(element, getItems?)</code></td><td v-html="t('menus.api.bindTo')"></td></tr>
        <tr><td><code>StartMenu.open() / close() / toggle()</code></td><td v-html="t('menus.api.start')"></td></tr>
        <tr><td><code>setItems()</code></td><td v-html="t('menus.api.setItems')"></td></tr>
        <tr><td><code>isOpen() / getElement() / destroy()</code></td><td v-html="t('menus.api.lifecycle')"></td></tr>
      </tbody>
    </table>

    <h2>{{ t('menus.h2Events') }}</h2>
    <p v-html="t('menus.eventsDesc')"></p>
    <pre class="code-block">menu.events.on('menu:select', event =&gt; console.log(event.id))
menu.events.on('menu:open', event =&gt; console.log(event.source))
menu.events.on('menu:close', event =&gt; console.log(event.reason))</pre>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { ContextMenu, StartMenu } from '@deskpane/menu'
import DemoViewport from '../components/DemoViewport.vue'
import DocSampleLayout from '../components/DocSampleLayout.vue'
import DocSampleTabs from '../components/DocSampleTabs.vue'
import { useDocCode } from '../composables/useDocCode'
import { useLocale } from '../composables/useLocale'

const { setCode } = useDocCode()
const { t } = useLocale()
const viewport = ref<InstanceType<typeof DemoViewport> | null>(null)
const startButton = ref<HTMLButtonElement | null>(null)
const activeSample = ref('vanilla')
let startMenu: StartMenu | null = null
let contextMenu: ContextMenu | null = null
let statusEl: HTMLElement | null = null

const samples = [
  { id: 'vanilla', label: 'Vanilla JS', description: 'Import the optional menu bundle and bind menus directly.' },
  { id: 'jquery', label: 'jQuery', description: 'Use DeskPaneMenu beside an existing jQuery desktop.' },
  { id: 'vue', label: 'Vue 3', description: 'Create and destroy menu instances in Vue lifecycle hooks.' },
  { id: 'react', label: 'React 18', description: 'Own menu instances inside a React effect.' },
] as const

function markAction(label: string) {
  if (statusEl) statusEl.textContent = `${t('menus.selected')}: ${label}`
}

function initDemo() {
  const target = viewport.value?.container
  const anchor = startButton.value
  if (!target || !anchor) return

  target.innerHTML = ''
  const hint = document.createElement('div')
  hint.className = 'menu-demo-hint'
  hint.innerHTML = `<strong>${t('menus.demoSurface')}</strong><span>${t('menus.demoSurfaceHint')}</span>`
  statusEl = document.createElement('div')
  statusEl.className = 'menu-demo-status'
  statusEl.textContent = t('menus.ready')
  target.append(hint, statusEl)

  const primaryItems = [
    { id: 'computer', label: 'Computer', icon: '🖥️', action: () => markAction('Computer') },
    { id: 'documents', label: 'Documents', icon: '📁', action: () => markAction('Documents') },
    { type: 'separator' as const },
    {
      id: 'programs',
      label: 'All Programs',
      icon: '▦',
      children: [
        { id: 'editor', label: 'Editor', icon: '📝', action: () => markAction('Editor') },
        { id: 'settings', label: 'Settings', icon: '⚙️', action: () => markAction('Settings') },
      ],
    },
  ]

  startMenu = new StartMenu({
    anchor,
    target,
    placement: 'bottom-start',
    header: { label: 'DeskPane', icon: 'DP' },
    items: primaryItems,
    secondaryItems: [
      { id: 'network', label: 'Network', action: () => markAction('Network') },
      { id: 'help', label: 'Help', action: () => markAction('Help') },
    ],
    footerItems: [
      { id: 'shutdown', label: 'Shut down', icon: '⏻', action: () => markAction('Shut down') },
    ],
  })

  contextMenu = new ContextMenu({
    target,
    items: [
      { id: 'open', label: 'Open', icon: '📂', action: () => markAction('Open') },
      { id: 'refresh', label: 'Refresh', shortcut: 'F5', action: () => markAction('Refresh') },
      { type: 'separator' },
      { id: 'disabled', label: 'Unavailable command', disabled: true },
      { id: 'properties', label: 'Properties', action: () => markAction('Properties') },
    ],
  })
  contextMenu.bindTo(target)
}

function destroyDemo() {
  startMenu?.destroy()
  contextMenu?.destroy()
  startMenu = null
  contextMenu = null
  statusEl = null
}

function onReset() {
  destroyDemo()
  initDemo()
}

function showContextMenu() {
  const target = viewport.value?.container
  if (!target || !contextMenu) return
  const rect = target.getBoundingClientRect()
  contextMenu.showAt(rect.left + rect.width / 2, rect.top + 70)
}

function setCodeForSample() {
  if (activeSample.value === 'jquery') {
    setCode([{ name: 'jquery-menu.js', lang: 'javascript', code: `// Load deskpane-menu.umd.min.js after DeskPane.
const { StartMenu, ContextMenu } = window.DeskPaneMenu

const startMenu = new StartMenu({
  anchor: $('#start-button')[0],
  items: [
    { id: 'orders', label: 'Orders', action: () => $('#orders').dpWindow('focus') },
    { id: 'settings', label: 'Settings', action: openSettings },
  ],
})

const desktopMenu = new ContextMenu({ items: [
  { id: 'refresh', label: 'Refresh', action: refreshDesktop },
] })
desktopMenu.bindTo($('#desktop')[0])` }])
    return
  }

  if (activeSample.value === 'vue') {
    setCode([{ name: 'DesktopMenu.vue', lang: 'vue', code: `<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { ContextMenu, StartMenu } from 'deskpane/menu'
import 'deskpane/styles/deskpane-menu.css'

const desktopEl = ref<HTMLElement | null>(null)
const startEl = ref<HTMLButtonElement | null>(null)
let startMenu: StartMenu
let contextMenu: ContextMenu

onMounted(() => {
  startMenu = new StartMenu({
    anchor: startEl.value!,
    injectStyles: false,
    items: [{ id: 'orders', label: 'Orders', action: openOrders }],
  })
  contextMenu = new ContextMenu({
    injectStyles: false,
    items: [{ id: 'refresh', label: 'Refresh', action: refreshDesktop }],
  })
  contextMenu.bindTo(desktopEl.value!)
})

onUnmounted(() => {
  startMenu?.destroy()
  contextMenu?.destroy()
})
<\/script>` }])
    return
  }

  if (activeSample.value === 'react') {
    setCode([{ name: 'DesktopMenu.tsx', lang: 'typescript', code: `import { useEffect, useRef } from 'react'
import { ContextMenu, StartMenu } from 'deskpane/menu'
import 'deskpane/styles/deskpane-menu.css'

export function DesktopMenu() {
  const desktopRef = useRef<HTMLDivElement>(null)
  const startRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const startMenu = new StartMenu({
      anchor: startRef.current!,
      injectStyles: false,
      items: [{ id: 'orders', label: 'Orders', action: openOrders }],
    })
    const contextMenu = new ContextMenu({
      injectStyles: false,
      items: [{ id: 'refresh', label: 'Refresh', action: refreshDesktop }],
    })
    contextMenu.bindTo(desktopRef.current!)

    return () => {
      startMenu.destroy()
      contextMenu.destroy()
    }
  }, [])

  return <div ref={desktopRef}><button ref={startRef}>Start</button></div>
}` }])
    return
  }

  setCode([{ name: 'menus.ts', lang: 'typescript', code: `import { ContextMenu, StartMenu } from 'deskpane/menu'
import 'deskpane/styles/deskpane-menu.css'

const startMenu = new StartMenu({
  anchor: document.getElementById('start-button')!,
  injectStyles: false,
  header: { label: 'My Desktop', icon: 'DP' },
  items: [
    { id: 'orders', label: 'Orders', icon: '📦', action: openOrders },
    { id: 'settings', label: 'Settings', children: [
      { id: 'theme', label: 'Theme', action: openThemeSettings },
    ] },
  ],
})

const contextMenu = new ContextMenu({
  injectStyles: false,
  items: [{ id: 'refresh', label: 'Refresh', shortcut: 'F5', action: refreshDesktop }],
})
contextMenu.bindTo(document.getElementById('desktop')!)

// Cleanup when the desktop is removed.
startMenu.destroy()
contextMenu.destroy()` }])
}

onMounted(() => {
  initDemo()
  setCodeForSample()
})

watch(activeSample, setCodeForSample)

onUnmounted(destroyDemo)
</script>

<style scoped>
.page { width: 100%; max-width: 100%; }
.btn {
  padding: 5px 14px;
  border: 0;
  border-radius: 4px;
  background: var(--color-primary);
  color: #fff;
  font-size: 12px;
  cursor: pointer;
}
.btn:hover { background: var(--color-primary-hover); }
.btn-alt { background: #536577; }
:deep(.menu-demo-hint) {
  position: absolute;
  inset: 28px;
  display: grid;
  place-content: center;
  gap: 8px;
  border: 1px dashed #9aa9b8;
  color: #435466;
  text-align: center;
}
:deep(.menu-demo-hint span) { font-size: 12px; color: #66788a; }
:deep(.menu-demo-status) {
  position: absolute;
  right: 16px;
  bottom: 14px;
  padding: 6px 10px;
  border: 1px solid #c7d2de;
  background: #fff;
  color: #435466;
  font-size: 12px;
}
</style>
