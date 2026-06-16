<template>
  <div class="page">
    <div class="page-badge">
      <span class="badge badge-green">{{ t('workspace.badge') }}</span>
    </div>
    <h1>{{ t('workspace.h1') }}</h1>
    <p v-html="t('workspace.intro')"></p>

    <h2>{{ t('workspace.h2Setup') }}</h2>
    <p v-html="t('workspace.setupDesc')"></p>

    <DemoViewport ref="viewport" @reset="onReset">
      <template #controls>
        <button class="btn" @click="addWorkspace">{{ t('workspace.openBtn') }}</button>
        <button class="btn btn-secondary" @click="switchNext">{{ t('workspace.switchBtn') }}{{ nextLabel }}</button>
      </template>
    </DemoViewport>

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
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { WorkspaceManager } from '@deskpane/workspace'
import DemoViewport from '../components/DemoViewport.vue'
import { useDocCode } from '../composables/useDocCode'
import { useLocale } from '../composables/useLocale'

const { setCode } = useDocCode()
const { t } = useLocale()
const viewport = ref<InstanceType<typeof DemoViewport> | null>(null)
let wsMgr: WorkspaceManager | null = null
let wsCount = 2

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

onMounted(() => {
  initWorkspaces()
  setCode([
    {
      name: 'setup.ts',
      lang: 'typescript',
      code: `import { WorkspaceManager } from '@deskpane/workspace'

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
    {
      name: 'windows.ts',
      lang: 'typescript',
      code: `// Each workspace has its own isolated WindowManager
const wm1 = wsMgr.getWindowManager('ws-1')
const wm2 = wsMgr.getWindowManager('ws-2')

wm1.open({ id: 'notepad', title: 'Notepad', content: el, width: 400, height: 300 })
wm2.open({ id: 'calc',    title: 'Calculator', content: el2 })

// Remove a workspace (and all its windows)
wsMgr.removeWorkspace('ws-2')`,
    },
    {
      name: 'events.ts',
      lang: 'typescript',
      code: `// Listen to workspace lifecycle events
wsMgr.events.on('workspace:added', (ws) => {
  console.log('added:', ws.id, ws.label)
})

wsMgr.events.on('workspace:switched', ({ from, to }) => {
  console.log(\`switched \${from} → \${to}\`)
})

wsMgr.events.on('workspace:removed', ({ id }) => {
  console.log('removed:', id)
})

// Cleanup
wsMgr.destroy()`,
    },
  ])
})

onUnmounted(() => {
  wsMgr?.destroy()
})
</script>

<style scoped>
.page { max-width: 760px; }
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
