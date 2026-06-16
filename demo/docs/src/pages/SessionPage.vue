<template>
  <div class="page">
    <div class="page-badge">
      <span class="badge badge-purple">{{ t('session.badge') }}</span>
    </div>
    <h1>{{ t('session.h1') }}</h1>
    <p v-html="t('session.intro')"></p>

    <h2>{{ t('session.h2Setup') }}</h2>
    <p v-html="t('session.setupDesc')"></p>

    <DemoViewport ref="viewport" @reset="onReset">
      <template #controls>
        <button class="btn" @click="doSerialize">{{ t('session.serializeBtn') }}</button>
      </template>
    </DemoViewport>

    <p class="demo-note" v-html="t('session.demoNote')"></p>

    <div v-if="serializedJson" class="json-block-wrap">
      <div class="json-label">{{ t('session.jsonLabel') }}</div>
      <pre class="json-block">{{ serializedJson }}</pre>
    </div>

    <h2>{{ t('session.h2StaticMethods') }}</h2>
    <table class="api-table">
      <thead>
        <tr>
          <th>{{ t('session.col.method') }}</th>
          <th>{{ t('session.col.returns') }}</th>
          <th>{{ t('session.col.desc') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><code>SessionManager.serializeWindows(wm)</code></td>
          <td><code>string</code></td>
          <td v-html="t('session.method.serializeWindows')"></td>
        </tr>
        <tr>
          <td><code>SessionManager.serializeWorkspaces(wsm)</code></td>
          <td><code>string</code></td>
          <td v-html="t('session.method.serializeWorkspaces')"></td>
        </tr>
        <tr>
          <td><code>SessionManager.restoreWindows(json, registry, wm)</code></td>
          <td><code>void</code></td>
          <td v-html="t('session.method.restoreWindows')"></td>
        </tr>
        <tr>
          <td><code>SessionManager.restoreWorkspaces(json, registry, wsm)</code></td>
          <td><code>void</code></td>
          <td v-html="t('session.method.restoreWorkspaces')"></td>
        </tr>
      </tbody>
    </table>

    <h2>{{ t('session.h2AppRegistry') }}</h2>
    <p v-html="t('session.registryDesc')"></p>

    <h2>{{ t('session.h2Snapshot') }}</h2>
    <table class="api-table">
      <thead>
        <tr>
          <th>{{ t('common.property') }}</th>
          <th>{{ t('common.type') }}</th>
          <th>{{ t('common.description') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr><td><code>version</code></td><td><code>1</code></td><td v-html="t('session.snap.version')"></td></tr>
        <tr><td><code>currentWorkspaceId</code></td><td><code>string | null</code></td><td v-html="t('session.snap.currentWorkspaceId')"></td></tr>
        <tr><td><code>workspaces</code></td><td><code>WorkspaceSnapshot[]</code></td><td v-html="t('session.snap.workspaces')"></td></tr>
        <tr><td><code>windows</code></td><td><code>WindowSnapshot[]</code></td><td v-html="t('session.snap.windows')"></td></tr>
      </tbody>
    </table>

    <h2>{{ t('session.h2WindowSnapshot') }}</h2>
    <table class="api-table">
      <thead>
        <tr>
          <th>{{ t('common.property') }}</th>
          <th>{{ t('common.type') }}</th>
          <th>{{ t('common.description') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr><td><code>appId</code></td><td><code>string</code></td><td v-html="t('session.winsnap.appId')"></td></tr>
        <tr><td><code>x, y, width, height</code></td><td><code>number</code></td><td v-html="t('session.winsnap.geometry')"></td></tr>
        <tr><td><code>isMinimized, isMaximized</code></td><td><code>boolean</code></td><td v-html="t('session.winsnap.state')"></td></tr>
        <tr><td><code>props</code></td><td><code>Record&lt;string, unknown&gt;</code></td><td v-html="t('session.winsnap.props')"></td></tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { WorkspaceManager, SessionManager } from '@deskpane/workspace'
import DemoViewport from '../components/DemoViewport.vue'
import { useDocCode } from '../composables/useDocCode'
import { useLocale } from '../composables/useLocale'

const { setCode } = useDocCode()
const { t } = useLocale()
const viewport = ref<InstanceType<typeof DemoViewport> | null>(null)
const serializedJson = ref<string | null>(null)
let wsMgr: WorkspaceManager | null = null

function initDemo() {
  const container = viewport.value?.container
  if (!container) return
  wsMgr = new WorkspaceManager(container, { animationMs: 200 })

  const ws1 = wsMgr.addWorkspace({ id: 'demo-ws-1', label: 'Desktop 1', icon: '🖥' })
  const ws2 = wsMgr.addWorkspace({ id: 'demo-ws-2', label: 'Desktop 2', icon: '📁' })

  const wm1 = wsMgr.getWindowManager('demo-ws-1')
  const el1 = document.createElement('div')
  el1.style.cssText = 'padding:16px;font-size:13px'
  el1.textContent = 'Notes window (Desktop 1)'
  wm1.open({ id: 'notes', title: 'Notes', content: el1, x: 20, y: 20, width: 220, height: 120 })

  const wm2 = wsMgr.getWindowManager('demo-ws-2')
  const el2 = document.createElement('div')
  el2.style.cssText = 'padding:16px;font-size:13px'
  el2.textContent = 'Calculator window (Desktop 2)'
  wm2.open({ id: 'calc', title: 'Calculator', content: el2, x: 30, y: 30, width: 220, height: 120 })

  wsMgr.enableIndicator()
  serializedJson.value = null
}

function doSerialize() {
  if (!wsMgr) return
  try {
    const json = SessionManager.serializeWorkspaces(wsMgr)
    serializedJson.value = JSON.stringify(JSON.parse(json), null, 2)
  } catch (e) {
    serializedJson.value = String(e)
  }
}

function onReset() {
  wsMgr?.destroy()
  wsMgr = null
  serializedJson.value = null
  initDemo()
}

onMounted(() => {
  initDemo()
  setCode([
    {
      name: 'single-wm.ts',
      lang: 'typescript',
      code: `import { WindowManager } from '@deskpane/core/WindowManager'
import { SessionManager } from '@deskpane/workspace'

const wm = new WindowManager({ container: document.getElementById('desktop')! })

// AppRegistry maps appId → factory function
const registry = {
  notepad: (props?: Record<string, unknown>) => {
    const el = document.createElement('div')
    el.style.padding = '16px'
    el.textContent = String(props?.text ?? 'No content')
    return el
  },
}

// Open a window tagged with appId
const el = document.createElement('div')
el.style.padding = '16px'
el.textContent = 'Hello'
wm.open({
  id: 'win-1',
  title: 'Notepad',
  content: el,
  props: { appId: 'notepad', text: 'Hello' },
})

// ── Serialize ────────────────────────────────────────
const json = SessionManager.serializeWindows(wm)
localStorage.setItem('session', json)

// ── Restore ──────────────────────────────────────────
const saved = localStorage.getItem('session')
if (saved) {
  wm.getWindowIds().forEach(id => wm.close(id)) // clear first
  SessionManager.restoreWindows(saved, registry, wm)
}`,
    },
    {
      name: 'multi-workspace.ts',
      lang: 'typescript',
      code: `import { WorkspaceManager, SessionManager } from '@deskpane/workspace'

const wsMgr = new WorkspaceManager(
  document.getElementById('desktop')!,
  { animationMs: 300 },
)

wsMgr.addWorkspace({ id: 'ws-1', label: 'Desktop 1', icon: '🖥' })
wsMgr.addWorkspace({ id: 'ws-2', label: 'Desktop 2', icon: '📁' })

const registry = {
  editor: (props?: Record<string, unknown>) => {
    const el = document.createElement('div')
    el.style.padding = '16px'
    el.textContent = String(props?.file ?? 'untitled')
    return el
  },
}

// Open some windows
const wm1 = wsMgr.getWindowManager('ws-1')
const editorEl = document.createElement('div')
wm1.open({
  id: 'editor-1',
  title: 'editor.ts',
  content: editorEl,
  props: { appId: 'editor', file: 'editor.ts' },
})

// ── Serialize all workspaces ─────────────────────────
const json = SessionManager.serializeWorkspaces(wsMgr)

// ── Restore all workspaces ───────────────────────────
// Missing workspaces are created automatically
SessionManager.restoreWorkspaces(json, registry, wsMgr)`,
    },
    {
      name: 'localstorage.ts',
      lang: 'typescript',
      code: `import { WorkspaceManager, SessionManager } from '@deskpane/workspace'

const STORAGE_KEY = 'deskpane-session'

function saveSession(wsMgr: WorkspaceManager) {
  const json = SessionManager.serializeWorkspaces(wsMgr)
  localStorage.setItem(STORAGE_KEY, json)
}

function loadSession(wsMgr: WorkspaceManager, registry: Record<string, (props?: Record<string, unknown>) => unknown>) {
  const json = localStorage.getItem(STORAGE_KEY)
  if (json) {
    SessionManager.restoreWorkspaces(json, registry, wsMgr)
  }
}

// Usage
const wsMgr = new WorkspaceManager(document.getElementById('desktop')!, {})
const registry = {
  myApp: (props) => {
    const el = document.createElement('div')
    el.textContent = 'Restored: ' + JSON.stringify(props)
    return el
  },
}

// Restore on page load
loadSession(wsMgr, registry)

// Save before page unload
window.addEventListener('beforeunload', () => saveSession(wsMgr))`,
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
.demo-note {
  font-size: 12px;
  color: #6b7280;
  margin-top: 8px;
  font-style: italic;
}
.json-block-wrap {
  margin-top: 12px;
}
.json-label {
  font-size: 12px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 4px;
}
.json-block {
  background: #1e1e2e;
  color: #cdd6f4;
  padding: 12px 16px;
  border-radius: 6px;
  font-size: 11.5px;
  line-height: 1.6;
  overflow-x: auto;
  max-height: 320px;
  overflow-y: auto;
  white-space: pre;
  font-family: 'Cascadia Code', 'Fira Code', monospace;
}
</style>
