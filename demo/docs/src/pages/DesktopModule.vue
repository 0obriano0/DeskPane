<template>
  <div class="page">
    <div class="page-badge">
      <span class="badge badge-green">{{ t('desktop.badge') }}</span>
    </div>
    <h1>{{ t('desktop.h1') }}</h1>
    <p v-html="t('desktop.intro')"></p>

    <DocSampleLayout>
      <DocSampleTabs
        v-model="activeSample"
        :samples="samples"
        aria-label="Desktop framework samples"
      />

      <h2>{{ t('desktop.h2Setup') }}</h2>
      <p v-html="t('desktop.setupDesc')"></p>

      <DemoViewport ref="viewport" @reset="onReset">
        <template #controls>
          <button class="btn" @click="addDemoIcon">{{ t('desktop.openIcon') }}</button>
        </template>
      </DemoViewport>
    </DocSampleLayout>

    <h2>{{ t('desktop.h2Config') }}</h2>
    <table class="api-table">
      <thead>
        <tr>
          <th>{{ t('desktop.col.option') }}</th>
          <th>{{ t('desktop.col.type') }}</th>
          <th>{{ t('wmopt.col.default') }}</th>
          <th>{{ t('desktop.col.desc') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr><td><code>container</code></td><td><code>HTMLElement</code></td><td><code>document.body</code></td><td v-html="t('desktop.conf.container')"></td></tr>
        <tr><td><code>dragThreshold</code></td><td><code>number</code></td><td><code>6</code></td><td v-html="t('desktop.conf.dragThreshold')"></td></tr>
        <tr><td><code>iconSnap</code></td><td><code>boolean</code></td><td><code>true</code></td><td v-html="t('desktop.conf.iconSnap')"></td></tr>
        <tr><td><code>iconSnapThreshold</code></td><td><code>number</code></td><td><code>20</code></td><td v-html="t('desktop.conf.iconSnapThreshold')"></td></tr>
        <tr><td><code>storageKey</code></td><td><code>string</code></td><td><code>'dp-desktop'</code></td><td v-html="t('desktop.conf.storageKey')"></td></tr>
        <tr><td><code>dock</code></td><td><code>DockConfig</code></td><td><code>{}</code></td><td v-html="t('desktop.conf.dock')"></td></tr>
        <tr><td><code>icons</code></td><td><code>DesktopIconConfig[]</code></td><td><code>[]</code></td><td v-html="t('desktop.conf.icons')"></td></tr>
      </tbody>
    </table>

    <h2>{{ t('desktop.h2DockConfig') }}</h2>
    <p v-html="t('desktop.dockConfigDesc')"></p>
    <table class="api-table">
      <thead>
        <tr>
          <th>{{ t('desktop.col.option') }}</th>
          <th>{{ t('desktop.col.type') }}</th>
          <th>{{ t('wmopt.col.default') }}</th>
          <th>{{ t('desktop.col.desc') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr><td><code>position</code></td><td><code>DockPosition</code></td><td><code>'bottom'</code></td><td v-html="t('desktop.dockConf.position')"></td></tr>
        <tr><td><code>items</code></td><td><code>DockItemConfig[]</code></td><td><code>[]</code></td><td v-html="t('desktop.dockConf.items')"></td></tr>
        <tr><td><code>itemLayout</code></td><td><code>'dock' | 'taskbar'</code></td><td><code>'dock'</code></td><td v-html="t('desktop.dockConf.itemLayout')"></td></tr>
        <tr><td><code>itemRenderer</code></td><td><code>DockItemRenderer</code></td><td><code>undefined</code></td><td v-html="t('desktop.dockConf.itemRenderer')"></td></tr>
        <tr><td><code>leading</code></td><td><code>Node | DockSlotRenderer</code></td><td><code>undefined</code></td><td v-html="t('desktop.dockConf.leading')"></td></tr>
        <tr><td><code>trailing</code></td><td><code>Node | DockSlotRenderer</code></td><td><code>undefined</code></td><td v-html="t('desktop.dockConf.trailing')"></td></tr>
        <tr><td><code>iconSize</code></td><td><code>number</code></td><td><code>44</code></td><td v-html="t('desktop.dockConf.iconSize')"></td></tr>
        <tr><td><code>showLabels</code></td><td><code>boolean</code></td><td><code>true</code></td><td v-html="t('desktop.dockConf.showLabels')"></td></tr>
      </tbody>
    </table>

    <h2>{{ t('desktop.h2AddIcon') }}</h2>
    <table class="api-table">
      <thead>
        <tr>
          <th>{{ t('desktop.col.option') }}</th>
          <th>{{ t('desktop.col.type') }}</th>
          <th>{{ t('desktop.col.req') }}</th>
          <th>{{ t('desktop.col.desc') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr><td><code>id</code></td><td><code>string</code></td><td><span class="badge badge-blue">{{ t('common.required') }}</span></td><td>{{ t('desktop.icon.id') }}</td></tr>
        <tr><td><code>label</code></td><td><code>string</code></td><td><span class="badge badge-blue">{{ t('common.required') }}</span></td><td>{{ t('desktop.icon.label') }}</td></tr>
        <tr><td><code>icon</code></td><td><code>string | Node</code></td><td><span class="badge badge-gray">{{ t('common.optional') }}</span></td><td>{{ t('desktop.icon.icon') }}</td></tr>
        <tr><td><code>iconRenderer</code></td><td><code>(context) =&gt; string | Node | void</code></td><td><span class="badge badge-gray">{{ t('common.optional') }}</span></td><td>{{ t('desktop.icon.renderer') }}</td></tr>
        <tr><td><code>action</code></td><td><code>() =&gt; void</code></td><td><span class="badge badge-blue">{{ t('common.required') }}</span></td><td>{{ t('desktop.icon.action') }}</td></tr>
      </tbody>
    </table>

    <h2>{{ t('desktop.h2Sync') }}</h2>
    <p v-html="t('desktop.syncDesc')"></p>

    <h2>{{ t('desktop.h2SyncOpts') }}</h2>
    <table class="api-table">
      <thead>
        <tr>
          <th>{{ t('desktop.col.option') }}</th>
          <th>{{ t('desktop.col.type') }}</th>
          <th>{{ t('wmopt.col.default') }}</th>
          <th>{{ t('desktop.col.desc') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr><td><code>showWindowPreview</code></td><td><code>boolean</code></td><td><code>true</code></td><td v-html="t('desktop.sync.preview')"></td></tr>
        <tr><td><code>previewSize</code></td><td><code>{ width: number; height: number }</code></td><td><code>{ width: 200, height: 130 }</code></td><td v-html="t('desktop.sync.previewSize')"></td></tr>
      </tbody>
    </table>

    <h2>{{ t('desktop.h2DockMethods') }}</h2>
    <table class="api-table">
      <thead>
        <tr>
          <th>{{ t('desktop.col.option') }}</th>
          <th>{{ t('desktop.col.type') }}</th>
          <th>{{ t('desktop.col.desc') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr><td><code>dock.addItemAt(item, index)</code></td><td><code>void</code></td><td v-html="t('desktop.dock.addItemAt')"></td></tr>
        <tr><td><code>dock.setItemLayout(layout)</code></td><td><code>void</code></td><td v-html="t('desktop.dock.setItemLayout')"></td></tr>
        <tr><td><code>dock.getItemLayout()</code></td><td><code>DockItemLayout</code></td><td v-html="t('desktop.dock.getItemLayout')"></td></tr>
        <tr><td><code>dock.setItemRenderer(renderer)</code></td><td><code>void</code></td><td v-html="t('desktop.dock.setItemRenderer')"></td></tr>
        <tr><td><code>dock.onRender(cb)</code></td><td><code>() => void</code></td><td v-html="t('desktop.dock.onRender')"></td></tr>
        <tr><td><code>dock.setSlot(name, content)</code></td><td><code>void</code></td><td v-html="t('desktop.dock.setSlot')"></td></tr>
        <tr><td><code>dock.setLeading(content)</code></td><td><code>void</code></td><td v-html="t('desktop.dock.setLeading')"></td></tr>
        <tr><td><code>dock.setTrailing(content)</code></td><td><code>void</code></td><td v-html="t('desktop.dock.setTrailing')"></td></tr>
        <tr><td><code>dock.getSlotElement(name)</code></td><td><code>HTMLElement | null</code></td><td v-html="t('desktop.dock.getSlotElement')"></td></tr>
        <tr><td><code>dock.getItemsElement()</code></td><td><code>HTMLElement</code></td><td v-html="t('desktop.dock.getItemsElement')"></td></tr>
      </tbody>
    </table>

    <h2>{{ t('desktop.h2Events') }}</h2>
    <table class="api-table">
      <thead>
        <tr>
          <th>{{ t('common.event') }}</th>
          <th>{{ t('common.payload') }}</th>
          <th>{{ t('desktop.col.desc') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr><td><code>desktop:ready</code></td><td><code>DesktopItemsEvent</code></td><td>{{ t('desktop.event.ready') }}</td></tr>
        <tr><td><code>desktop:destroyed</code></td><td><code>DesktopItemsEvent</code></td><td>{{ t('desktop.event.destroyed') }}</td></tr>
        <tr><td><code>items:changed</code></td><td><code>DesktopItemsEvent</code></td><td>{{ t('desktop.event.itemsChanged') }}</td></tr>
        <tr><td><code>items:refreshed</code></td><td><code>DesktopItemsEvent</code></td><td>{{ t('desktop.event.itemsRefreshed') }}</td></tr>
        <tr><td><code>icon:added</code></td><td><code>DesktopIconEvent</code></td><td>{{ t('desktop.event.iconAdded') }}</td></tr>
        <tr><td><code>icon:removed</code></td><td><code>DesktopIconEvent</code></td><td>{{ t('desktop.event.iconRemoved') }}</td></tr>
        <tr><td><code>icon:moved</code></td><td><code>DesktopIconMoveEvent</code></td><td>{{ t('desktop.event.iconMoved') }}</td></tr>
        <tr><td><code>icon:activated</code></td><td><code>DesktopIconEvent</code></td><td>{{ t('desktop.event.iconActivated') }}</td></tr>
        <tr><td><code>icon:selected</code></td><td><code>DesktopIconEvent</code></td><td>{{ t('desktop.event.iconSelected') }}</td></tr>
        <tr><td><code>dock:position-changed</code></td><td><code>{ position }</code></td><td>{{ t('desktop.event.dockPositionChanged') }}</td></tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { Desktop, type DockItemRendererContext } from '@deskpane/desktop'
import { WindowManager } from '@deskpane/core/WindowManager'
import DemoViewport from '../components/DemoViewport.vue'
import DocSampleLayout from '../components/DocSampleLayout.vue'
import DocSampleTabs from '../components/DocSampleTabs.vue'
import { useDocCode } from '../composables/useDocCode'
import { useLocale } from '../composables/useLocale'

const { setCode } = useDocCode()
const { t } = useLocale()
const viewport = ref<InstanceType<typeof DemoViewport> | null>(null)
let desktop: Desktop | null = null
let wm: WindowManager | null = null
let iconCount = 0
const activeSample = ref('vanilla')

const ICONS = ['📝', '🎵', '📷', '🎮', '📊', '🗂', '🌐', '⚙️']
const samples = [
  { id: 'vanilla', label: 'Vanilla JS', description: 'Create Desktop, icons, Dock, and a WindowManager directly.' },
  { id: 'jquery', label: 'jQuery', description: 'Use dpDesktop to initialize Desktop, icons, WindowManager, and Dock sync.' },
  { id: 'vue', label: 'Vue 3', description: 'Use Desktop as the shell and Teleport Vue window content into DeskPane bodies.' },
  { id: 'react', label: 'React 18', description: 'Use Desktop as the shell and render React window content with createPortal.' },
] as const

function createLiveDockControl(label: string) {
  const button = document.createElement('button')
  button.type = 'button'
  button.textContent = label
  button.style.cssText = 'height:34px;padding:0 10px;border:1px solid rgba(255,255,255,.3);border-radius:4px;background:#087f9b;color:#fff;font:600 11px system-ui;cursor:pointer;'
  button.addEventListener('click', addDemoIcon)
  return button
}

function createLiveDockStatus() {
  const status = document.createElement('div')
  status.style.cssText = 'display:flex;height:34px;align-items:center;gap:5px;padding:0 9px;border-left:1px solid rgba(255,255,255,.18);color:#fff;font:11px system-ui;white-space:nowrap;'
  status.innerHTML = '<span aria-label="Online">●</span><time>12:30</time>'
  return status
}

function renderLiveDockItem({ item, container, renderDefault }: DockItemRendererContext) {
  renderDefault()
  const running = document.createElement('span')
  running.setAttribute('aria-label', `${item.label} running`)
  running.title = 'Running'
  running.style.cssText = 'width:7px;height:7px;flex:0 0 7px;border-radius:50%;background:#55d98b;box-shadow:0 0 0 2px rgba(85,217,139,.18);'
  container.appendChild(running)
}


function createLiveDockConfig() {
  return {
    position: 'bottom' as const,
    itemLayout: 'taskbar' as const,
    itemRenderer: renderLiveDockItem,
    items: [],
    leading: () => createLiveDockControl('+ App'),
    trailing: createLiveDockStatus(),
  }
}
function initDesktop() {
  const container = viewport.value?.container
  if (!container) return
  desktop = new Desktop({
    container,

    dragThreshold: 6,
    iconSnap: true,
    iconSnapThreshold: 20,
    dock: createLiveDockConfig(),
  })
  wm = new WindowManager({ container: desktop.getElement(), isolated: true, snap: true, snapGap: 4 })
  desktop.syncDockWithWindows(wm)
}

function addDemoIcon() {
  if (!desktop || !wm) return
  const idx = iconCount % ICONS.length
  const emoji = ICONS[idx]
  const id = `app-icon-${iconCount}`
  const title = `App ${iconCount + 1}`
  const openApp = () => {
    const div = document.createElement('div')
    div.style.cssText = 'padding:20px;font-size:24px;text-align:center;'
    div.innerHTML = `<div style="margin-bottom:8px">${emoji}</div><div style="font-size:14px">${title}</div>`
    wm!.open({ id, title, icon: emoji, label: title, content: div, width: 260, height: 150 })
  }

  desktop.addIcon({
    id,
    label: title,
    icon: emoji,
    action: openApp,
  })

  iconCount++
}

function onReset() {
  wm?.destroy()
  desktop?.destroy?.()
  iconCount = 0
  initDesktop()
}

function setCodeForSample() {
  if (activeSample.value === 'jquery') {
    setCode([
      {
        name: 'jquery-desktop.js',
        lang: 'javascript',
        code: `$('#desktop').dpDesktop({
  dock: {
    position: 'bottom',
    itemLayout: 'taskbar',
    itemRenderer: function ({ container, renderDefault }) {
      renderDefault()
      return $('<span>', { text: '●', title: 'Running' }).css('color', '#4ade80')[0]
    },
    items: [],
    leading: $('<button>', { text: 'Start' })[0],
    trailing: $('<time>', { text: '12:30' })[0],
  },
  icons: [
    {
      id: 'notepad',
      label: 'Notepad',
      icon: '📝',
      action: function () {
        $('#desktop')
          .dpDesktop('windowManager')
          .open({
            id: 'notepad',
            title: 'Notepad',
            content: $('<div>').text('Notes')[0],
          })
      },
    },
  ],
  windowManager: {
    isolated: true,
    snap: true,
    injectStyles: false,
  },
  syncDock: true,
})`,
      },
    ])
    return
  }

  if (activeSample.value === 'vue') {
    setCode([
      {
        name: 'VueDesktop.vue',
        lang: 'vue',
        code: `<template>
  <div ref="desktopRoot" class="desktop"></div>

  <Teleport v-for="win in windows" :key="win.id" :to="win.bodyEl">
    <component :is="win.component" />
  </Teleport>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Desktop } from 'deskpane/desktop'
import { useWindowManager } from 'deskpane/vue'
import NotepadWindow from './NotepadWindow.vue'

const desktopRoot = ref<HTMLElement | null>(null)
const { windows, openVueWindow, wm } = useWindowManager({ isolated: true })

onMounted(() => {
  const desktop = new Desktop({
    container: desktopRoot.value!,
    dock: {
      position: 'bottom',
      itemLayout: 'taskbar',
      itemRenderer: ({ renderDefault }) => {
        renderDefault()
        const running = document.createElement('span')
        running.textContent = '●'
        running.title = 'Running'
        running.style.color = '#4ade80'
        return running
      },
      items: [],
      leading: () => Object.assign(document.createElement('button'),
        { textContent: 'Start' }),
      trailing: () => Object.assign(document.createElement('time'),
        { textContent: '12:30' }),
    },
    icons: [{
      id: 'notepad',
      label: 'Notepad',
      icon: '📝',
      action: () => openVueWindow({
        id: 'notepad',
        title: 'Notepad',
        component: NotepadWindow,
      }),
    }],
  })

  desktop.syncDockWithWindows(wm.value!)
})
<\/script>`,
      },
    ])
    return
  }

  if (activeSample.value === 'react') {
    setCode([
      {
        name: 'ReactDesktop.tsx',
        lang: 'typescript',
        code: `import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Desktop } from 'deskpane/desktop'
import { useWindowManager } from 'deskpane/react'
import NotepadWindow from './NotepadWindow'

export default function ReactDesktop() {
  const rootRef = useRef<HTMLDivElement | null>(null)
  const { windows, openReactWindow, wm } = useWindowManager({ isolated: true })

  useEffect(() => {
    const desktop = new Desktop({
      container: rootRef.current!,
      dock: {
        position: 'bottom',
        itemLayout: 'taskbar',
        itemRenderer: ({ renderDefault }) => {
          renderDefault()
          const running = document.createElement('span')
          running.textContent = '●'
          running.title = 'Running'
          running.style.color = '#4ade80'
          return running
        },
        items: [],
        leading: () => Object.assign(document.createElement('button'),
          { textContent: 'Start' }),
        trailing: () => Object.assign(document.createElement('time'),
          { textContent: '12:30' }),
      },
      icons: [{
        id: 'notepad',
        label: 'Notepad',
        icon: '📝',
        action: () => openReactWindow({
          id: 'notepad',
          title: 'Notepad',
          component: NotepadWindow,
        }),
      }],
    })

    const stopSync = desktop.syncDockWithWindows(wm!)
    return () => { stopSync(); desktop.destroy?.() }
  }, [])

  return (
    <div ref={rootRef} className="desktop">
      {windows.map(win => {
        const Component = win.component
        return Component ? createPortal(<Component />, win.bodyEl, win.id) : null
      })}
    </div>
  )
}`,
      },
    ])
    return
  }

  setCode([
    {
      name: 'setup.ts',
      lang: 'typescript',
      code: `import { Desktop } from 'deskpane/desktop'
import { WindowManager } from 'deskpane'

// 1. Create the desktop
const desktop = new Desktop({
  container: document.getElementById('root')!,
  dock: {
    position: 'bottom',
    itemLayout: 'taskbar',
    itemRenderer: ({ renderDefault }) => {
      renderDefault()
      const running = document.createElement('span')
      running.textContent = '●'
      running.title = 'Running'
      running.style.color = '#4ade80'
      return running
    },
    items: [],
    leading: () => Object.assign(document.createElement('button'),
      { textContent: 'Start' }),
    trailing: () => Object.assign(document.createElement('time'),
      { textContent: '12:30' }),
  },
  iconSnap: true,
  dragThreshold: 6,
})

// 2. Create a WindowManager inside the desktop element
const wm = new WindowManager({
  container: desktop.getElement(),
  isolated: true,
  snap: true,
  snapGap: 4,
})

// 3. Sync open windows → Dock items automatically
const stopSync = desktop.syncDockWithWindows(wm)
// Later: stopSync() to detach`,
    },
    {
      name: 'custom-icons.ts',
      lang: 'typescript',
      code: `const htmlIcon = document.createElement('span')
htmlIcon.textContent = '42'
htmlIcon.className = 'status-badge'

desktop.addIcon({
  id: 'status',
  label: 'Status',
  icon: htmlIcon,
})

desktop.addIcon({
  id: 'chart',
  label: 'Live chart',
  iconRenderer: ({ item, container }) => {
    container.dataset.appId = item.id
    const canvas = document.createElement('canvas')
    canvas.width = 48
    canvas.height = 48
    drawChart(canvas)
    return canvas
  },
})`,
    },
  ])
}

onMounted(() => {
  initDesktop()
  setCodeForSample()
})

watch(activeSample, setCodeForSample)

onUnmounted(() => {
  wm?.destroy()
})
</script>

<style scoped>
.page { width: 100%; max-width: 100%; }
.btn {
  padding: 5px 14px;
  background: var(--color-primary);
  color: #fff;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: background 0.1s;
}
.btn:hover { background: var(--color-primary-hover); }
</style>
