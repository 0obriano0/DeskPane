<template>
  <div class="page">
    <div class="page-badge">
      <span class="badge badge-green">{{ t('workspace.badge') }}</span>
    </div>
    <h1>{{ t('workspace.h1') }}</h1>
    <p v-html="t('workspace.intro')"></p>

    <DocSampleLayout>
      <DocSampleTabs
        v-model="activeSample"
        :samples="samples"
        aria-label="Workspace framework samples"
      />

      <h2>{{ t('workspace.h2Setup') }}</h2>
      <p v-html="t('workspace.setupDesc')"></p>

      <DemoViewport ref="viewport" @reset="onReset">
        <template #controls>
          <button class="btn" @click="addWorkspace">{{ t('workspace.openBtn') }}</button>
          <button class="btn btn-secondary" @click="switchNext">{{ t('workspace.switchBtn') }}{{ nextLabel }}</button>
        </template>
      </DemoViewport>
    </DocSampleLayout>

    <h2>{{ t('workspace.h2Options') }}</h2>
    <table class="api-table">
      <thead>
        <tr>
          <th>{{ t('workspace.col.option') }}</th>
          <th>{{ t('workspace.col.type') }}</th>
          <th>{{ t('workspace.col.default') }}</th>
          <th>{{ t('workspace.col.desc') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr><td><code>animationMs</code></td><td><code>number</code></td><td><code>250</code></td><td v-html="t('workspace.opt.animationMs')"></td></tr>
        <tr><td><code>injectStyles</code></td><td><code>boolean</code></td><td><code>true</code></td><td v-html="t('workspace.opt.injectStyles')"></td></tr>
        <tr><td><code>windowManagerOptions</code></td><td><code>WindowManagerOptions</code></td><td><code>—</code></td><td v-html="t('workspace.opt.wmOptions')"></td></tr>
      </tbody>
    </table>

    <h2>{{ t('workspace.h2Config') }}</h2>
    <table class="api-table">
      <thead>
        <tr>
          <th>{{ t('workspace.col.option') }}</th>
          <th>{{ t('workspace.col.type') }}</th>
          <th>{{ t('workspace.col.desc') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr><td><code>id</code></td><td><code>string</code></td><td>{{ t('workspace.cfg.id') }}</td></tr>
        <tr><td><code>label</code></td><td><code>string</code></td><td>{{ t('workspace.cfg.label') }}</td></tr>
        <tr><td><code>icon</code></td><td><code>string</code></td><td>{{ t('workspace.cfg.icon') }}</td></tr>
      </tbody>
    </table>

    <h2>{{ t('workspace.h2State') }}</h2>
    <table class="api-table">
      <thead>
        <tr>
          <th>{{ t('workspace.col.option') }}</th>
          <th>{{ t('workspace.col.type') }}</th>
          <th>{{ t('workspace.col.desc') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr><td><code>id</code></td><td><code>string</code></td><td>{{ t('workspace.state.id') }}</td></tr>
        <tr><td><code>label</code></td><td><code>string</code></td><td>{{ t('workspace.state.label') }}</td></tr>
        <tr><td><code>icon</code></td><td><code>string | undefined</code></td><td>{{ t('workspace.state.icon') }}</td></tr>
        <tr><td><code>container</code></td><td><code>HTMLElement</code></td><td>{{ t('workspace.state.container') }}</td></tr>
      </tbody>
    </table>

    <h2>{{ t('workspace.h2Api') }}</h2>
    <table class="api-table">
      <thead>
        <tr>
          <th>{{ t('workspace.col.option') }}</th>
          <th>{{ t('workspace.col.type') }}</th>
          <th>{{ t('workspace.col.desc') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr><td><code>workspaces</code></td><td><code>WorkspaceState[]</code></td><td v-html="t('workspace.api.workspaces')"></td></tr>
        <tr><td><code>current</code></td><td><code>WorkspaceState | null</code></td><td v-html="t('workspace.api.current')"></td></tr>
        <tr><td><code>addWorkspace(config)</code></td><td><code>WorkspaceState</code></td><td v-html="t('workspace.api.add')"></td></tr>
        <tr><td><code>removeWorkspace(id)</code></td><td><code>void</code></td><td v-html="t('workspace.api.remove')"></td></tr>
        <tr><td><code>switchTo(id)</code></td><td><code>void</code></td><td v-html="t('workspace.api.switchTo')"></td></tr>
        <tr><td><code>getWindowManager(workspaceId)</code></td><td><code>WindowManager</code></td><td v-html="t('workspace.api.getWm')"></td></tr>
        <tr><td><code>enableIndicator()</code></td><td><code>void</code></td><td v-html="t('workspace.api.enableInd')"></td></tr>
        <tr><td><code>disableIndicator()</code></td><td><code>void</code></td><td v-html="t('workspace.api.disableInd')"></td></tr>
        <tr><td><code>destroy()</code></td><td><code>void</code></td><td v-html="t('workspace.api.destroy')"></td></tr>
        <tr><td><code>events</code></td><td><code>EventBus</code></td><td>—</td></tr>
      </tbody>
    </table>

    <h2>{{ t('workspace.h2Events') }}</h2>
    <table class="api-table">
      <thead>
        <tr>
          <th>{{ t('workspace.col.option') }}</th>
          <th>{{ t('workspace.col.desc') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr><td><code>workspace:added</code></td><td v-html="t('workspace.event.added')"></td></tr>
        <tr><td><code>workspace:removed</code></td><td v-html="t('workspace.event.removed')"></td></tr>
        <tr><td><code>workspace:switched</code></td><td v-html="t('workspace.event.switched')"></td></tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { WorkspaceManager } from '@deskpane/workspace'
import DemoViewport from '../components/DemoViewport.vue'
import DocSampleLayout from '../components/DocSampleLayout.vue'
import DocSampleTabs from '../components/DocSampleTabs.vue'
import { useDocCode } from '../composables/useDocCode'
import { useLocale } from '../composables/useLocale'

const { setCode } = useDocCode()
const { t } = useLocale()
const viewport = ref<InstanceType<typeof DemoViewport> | null>(null)
let wsMgr: WorkspaceManager | null = null
let wsCount = 2
const activeSample = ref('vanilla')
const samples = [
  { id: 'vanilla', label: 'Vanilla JS', description: 'Create WorkspaceManager directly and open windows per workspace.' },
  { id: 'jquery', label: 'jQuery', description: 'Use dpWorkspaceManager and dpWorkspaceWindow from the 0.3.0 adapter.' },
  { id: 'vue', label: 'Vue 3', description: 'Use WorkspaceManager as the shell and Teleport Vue windows into each workspace manager.' },
  { id: 'react', label: 'React 18', description: 'Use WorkspaceManager as the shell and render React windows with createPortal.' },
] as const

const nextLabel = computed(() => {
  if (!wsMgr) return '2'
  const ws = wsMgr.workspaces
  const cur = wsMgr.current
  if (!cur || ws.length < 2) return ''
  const idx = ws.findIndex(w => w.id === cur.id)
  const next = ws[(idx + 1) % ws.length]
  return next.label
})

function initWorkspaces() {
  const container = viewport.value?.container
  if (!container) return
  wsMgr = new WorkspaceManager(container, { animationMs: 300 })
  wsMgr.addWorkspace({ id: 'ws-1', label: 'Desktop 1', icon: '🖥' })
  wsMgr.addWorkspace({ id: 'ws-2', label: 'Desktop 2', icon: '🖥' })
  wsMgr.enableIndicator()
  wsCount = 2
}

function addWorkspace() {
  if (!wsMgr) return
  wsCount++
  const id = `ws-${wsCount}`
  wsMgr.addWorkspace({ id, label: `Desktop ${wsCount}`, icon: '🖥' })
  wsMgr.switchTo(id)
}

function switchNext() {
  if (!wsMgr) return
  const ws = wsMgr.workspaces
  const cur = wsMgr.current
  if (!cur || ws.length < 2) return
  const idx = ws.findIndex(w => w.id === cur.id)
  wsMgr.switchTo(ws[(idx + 1) % ws.length].id)
}

function onReset() {
  wsMgr?.destroy()
  wsMgr = null
  initWorkspaces()
}

function setCodeForSample() {
  if (activeSample.value === 'jquery') {
    setCode([
      {
        name: 'jquery-workspace.js',
        lang: 'javascript',
        code: `$('#desktop').dpDesktop({
  dock: { position: 'bottom', items: [] },
  windowManager: false,
})

$('#desktop').dpWorkspaceManager({
  desktop: '#desktop',
  workspaces: [
    { id: 'ws-1', label: 'Desktop 1' },
    { id: 'ws-2', label: 'Desktop 2' },
  ],
  syncDock: true,
  windowManagerOptions: {
    isolated: true,
    snap: true,
    injectStyles: false,
  },
})

$('<div>Notes</div>').dpWorkspaceWindow({
  workspace: '#desktop',
  appId: 'notes',
  title: 'Notes',
  width: 280,
  height: 220,
})`,
      },
    ])
    return
  }

  if (activeSample.value === 'vue') {
    setCode([
      {
        name: 'VueWorkspace.vue',
        lang: 'vue',
        code: `<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { WorkspaceManager } from 'deskpane/workspace'
import { useWindowManager } from 'deskpane/vue'
import NotesWindow from './NotesWindow.vue'

const rootEl = ref<HTMLElement | null>(null)
const { windows, openVueWindow } = useWindowManager({ isolated: true })
let wsMgr: WorkspaceManager

onMounted(() => {
  wsMgr = new WorkspaceManager(rootEl.value!, {
    windowManagerOptions: { isolated: true, injectStyles: false },
  })
  wsMgr.addWorkspace({ id: 'ws-1', label: 'Desktop 1' })
  wsMgr.addWorkspace({ id: 'ws-2', label: 'Desktop 2' })
  wsMgr.enableIndicator()

  openVueWindow({
    id: 'notes',
    title: 'Notes',
    component: NotesWindow,
  })
})
<\/script>`,
      },
    ])
    return
  }

  if (activeSample.value === 'react') {
    setCode([
      {
        name: 'ReactWorkspace.tsx',
        lang: 'typescript',
        code: `import { useEffect, useRef } from 'react'
import { WorkspaceManager } from 'deskpane/workspace'
import { useWindowManager } from 'deskpane/react'
import NotesWindow from './NotesWindow'

export default function ReactWorkspace() {
  const rootRef = useRef<HTMLDivElement | null>(null)
  const { openReactWindow } = useWindowManager({ isolated: true })

  useEffect(() => {
    const wsMgr = new WorkspaceManager(rootRef.current!, {
      windowManagerOptions: { isolated: true, injectStyles: false },
    })
    wsMgr.addWorkspace({ id: 'ws-1', label: 'Desktop 1' })
    wsMgr.addWorkspace({ id: 'ws-2', label: 'Desktop 2' })
    wsMgr.enableIndicator()

    openReactWindow({
      id: 'notes',
      title: 'Notes',
      component: NotesWindow,
    })

    return () => wsMgr.destroy()
  }, [])

  return <div ref={rootRef} className="desktop" />
}`,
      },
    ])
    return
  }

  setCode([
    {
      name: 'setup.ts',
      lang: 'typescript',
      code: `import { WorkspaceManager } from 'deskpane/workspace'

const wsMgr = new WorkspaceManager(
  document.getElementById('root')!,
  { animationMs: 300 },
)

// Add workspaces
wsMgr.addWorkspace({ id: 'ws-1', label: 'Desktop 1', icon: '🖥' })
wsMgr.addWorkspace({ id: 'ws-2', label: 'Desktop 2', icon: '🖥' })

// Show indicator dots at bottom
wsMgr.enableIndicator()

// Switch between workspaces
wsMgr.switchTo('ws-2')`,
    },
  ])
}

onMounted(() => {
  initWorkspaces()
  setCodeForSample()
})

watch(activeSample, setCodeForSample)

onUnmounted(() => {
  wsMgr?.destroy()
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
.btn-secondary {
  background: var(--color-btn-secondary, #6b7280);
}
.btn-secondary:hover { background: var(--color-btn-secondary-hover, #4b5563); }
</style>
