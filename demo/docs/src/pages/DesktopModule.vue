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
        <tr><td><code>icon</code></td><td><code>string</code></td><td><span class="badge badge-gray">{{ t('common.optional') }}</span></td><td>{{ t('desktop.icon.icon') }}</td></tr>
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
        <tr><td><code>dock.onRender(cb)</code></td><td><code>() => void</code></td><td v-html="t('desktop.dock.onRender')"></td></tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { Desktop } from '@deskpane/desktop'
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

function initDesktop() {
  const container = viewport.value?.container
  if (!container) return
  desktop = new Desktop({
    container,
    dragThreshold: 6,
    iconSnap: true,
    iconSnapThreshold: 20,
    dock: { position: 'bottom', items: [] },
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
  dock: { position: 'bottom', items: [] },
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
    dock: { position: 'bottom', items: [] },
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
      dock: { position: 'bottom', items: [] },
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
  dock: { position: 'bottom', items: [] },
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
