<template>
  <div class="page">
    <div class="page-badge">
      <span class="badge badge-green">{{ t('taskview.badge') }}</span>
    </div>
    <h1>{{ t('taskview.h1') }}</h1>
    <p v-html="t('taskview.intro')"></p>

    <h2>{{ t('taskview.h2Setup') }}</h2>
    <p v-html="t('taskview.setupDesc')"></p>

    <DemoViewport ref="viewport" @reset="onReset">
      <template #controls>
        <button class="btn" @click="openTaskView">{{ t('taskview.openBtn') }}</button>
      </template>
    </DemoViewport>

    <h2>{{ t('taskview.h2Options') }}</h2>
    <table class="api-table">
      <thead>
        <tr>
          <th>{{ t('taskview.col.option') }}</th>
          <th>{{ t('taskview.col.type') }}</th>
          <th>{{ t('taskview.col.default') }}</th>
          <th>{{ t('taskview.col.desc') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr><td><code>target</code></td><td><code>HTMLElement</code></td><td><code>document.body</code></td><td v-html="t('taskview.opt.target')"></td></tr>
        <tr><td><code>allowAdd</code></td><td><code>boolean</code></td><td><code>true</code></td><td v-html="t('taskview.opt.allowAdd')"></td></tr>
        <tr><td><code>allowDelete</code></td><td><code>boolean</code></td><td><code>true</code></td><td v-html="t('taskview.opt.allowDelete')"></td></tr>
        <tr><td><code>keyboard</code></td><td><code>boolean</code></td><td><code>true</code></td><td v-html="t('taskview.opt.keyboard')"></td></tr>
        <tr><td><code>closeOnBackdrop</code></td><td><code>boolean</code></td><td><code>true</code></td><td v-html="t('taskview.opt.closeOnBackdrop')"></td></tr>
        <tr><td><code>onCreateWorkspace</code></td><td><code>() =&gt; WorkspaceConfig</code></td><td><code>—</code></td><td v-html="t('taskview.opt.onCreateWorkspace')"></td></tr>
        <tr><td><code>injectStyles</code></td><td><code>boolean</code></td><td><code>true</code></td><td v-html="t('taskview.opt.injectStyles')"></td></tr>
        <tr><td><code>dock</code></td><td><code>DockLike</code></td><td><code>—</code></td><td v-html="t('taskview.opt.dock')"></td></tr>
        <tr><td><code>showButton</code></td><td><code>boolean</code></td><td><code>true</code></td><td v-html="t('taskview.opt.showButton')"></td></tr>
        <tr><td><code>buttonLabel</code></td><td><code>string</code></td><td><code>'虛擬桌面'</code></td><td v-html="t('taskview.opt.buttonLabel')"></td></tr>
        <tr><td><code>buttonIcon</code></td><td><code>string</code></td><td><code>'⧉'</code></td><td v-html="t('taskview.opt.buttonIcon')"></td></tr>
        <tr><td><code>buttonId</code></td><td><code>string</code></td><td><code>'dp-tv-button'</code></td><td v-html="t('taskview.opt.buttonId')"></td></tr>
      </tbody>
    </table>

    <h2>{{ t('taskview.h2Api') }}</h2>
    <table class="api-table">
      <thead>
        <tr>
          <th>{{ t('taskview.col.option') }}</th>
          <th>{{ t('taskview.col.type') }}</th>
          <th>{{ t('taskview.col.desc') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr><td><code>isOpen</code></td><td><code>boolean</code></td><td v-html="t('taskview.api.isOpen')"></td></tr>
        <tr><td><code>open()</code></td><td><code>void</code></td><td v-html="t('taskview.api.open')"></td></tr>
        <tr><td><code>close()</code></td><td><code>void</code></td><td v-html="t('taskview.api.close')"></td></tr>
        <tr><td><code>toggle()</code></td><td><code>void</code></td><td v-html="t('taskview.api.toggle')"></td></tr>
        <tr><td><code>destroy()</code></td><td><code>void</code></td><td v-html="t('taskview.api.destroy')"></td></tr>
        <tr><td><code>events</code></td><td><code>EventBus</code></td><td>—</td></tr>
      </tbody>
    </table>

    <h2>{{ t('taskview.h2Events') }}</h2>
    <table class="api-table">
      <thead>
        <tr>
          <th>{{ t('taskview.col.option') }}</th>
          <th>{{ t('taskview.col.desc') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr><td><code>taskview:open</code></td><td v-html="t('taskview.event.open')"></td></tr>
        <tr><td><code>taskview:close</code></td><td v-html="t('taskview.event.close')"></td></tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { WorkspaceManager, TaskView } from '@deskpane/workspace'
import DemoViewport from '../components/DemoViewport.vue'
import { useDocCode } from '../composables/useDocCode'
import { useLocale } from '../composables/useLocale'

const { setCode } = useDocCode()
const { t } = useLocale()
const viewport = ref<InstanceType<typeof DemoViewport> | null>(null)
let wsMgr: WorkspaceManager | null = null
let tv: TaskView | null = null

function initDemo() {
  const container = viewport.value?.container
  if (!container) return
  wsMgr = new WorkspaceManager(container, { animationMs: 300 })
  wsMgr.addWorkspace({ id: 'ws-1', label: 'Desktop 1', icon: '🖥' })
  wsMgr.addWorkspace({ id: 'ws-2', label: 'Desktop 2', icon: '🖥' })
  wsMgr.enableIndicator()
  tv = new TaskView(wsMgr, {
    target: container,
    keyboard: true,
    closeOnBackdrop: true,
    showButton: false,
  })
}

function openTaskView() {
  tv?.open()
}

function onReset() {
  tv?.destroy()
  wsMgr?.destroy()
  tv = null
  wsMgr = null
  initDemo()
}

onMounted(() => {
  initDemo()
  setCode([
    {
      name: 'basic.ts',
      lang: 'typescript',
      code: `import { WorkspaceManager, TaskView } from '@deskpane/workspace'

const wsMgr = new WorkspaceManager(document.getElementById('root')!)
wsMgr.addWorkspace({ id: 'ws-1', label: 'Desktop 1' })
wsMgr.addWorkspace({ id: 'ws-2', label: 'Desktop 2' })

const tv = new TaskView(wsMgr)

// Show/hide the overlay
tv.open()
tv.close()
tv.toggle()

// Cleanup
tv.destroy()`,
    },
    {
      name: 'dock-integration.ts',
      lang: 'typescript',
      code: `import { Desktop } from '@deskpane/desktop'
import { WorkspaceManager, TaskView } from '@deskpane/workspace'

const desktop = new Desktop({
  container: document.getElementById('root')!,
  dock: { position: 'bottom', items: [] },
})

const wsMgr = new WorkspaceManager(desktop.getElement())
wsMgr.addWorkspace({ id: 'ws-1', label: 'Desktop 1' })

// Pass the Desktop's Dock → TaskView adds a toggle button automatically
const tv = new TaskView(wsMgr, {
  dock: desktop.dock,
  showButton: true,
  buttonLabel: 'Virtual Desktops',
  buttonIcon: '⧉',
})`,
    },
    {
      name: 'custom-create.ts',
      lang: 'typescript',
      code: `// Customise what happens when the user clicks "Add desktop"
let counter = 3
const tv = new TaskView(wsMgr, {
  onCreateWorkspace: () => ({
    id: \`ws-\${counter}\`,
    label: \`Desktop \${counter++}\`,
    icon: '🖥',
  }),
})

// React to overlay open/close
tv.events.on('taskview:open',  () => console.log('overlay opened'))
tv.events.on('taskview:close', () => console.log('overlay closed'))`,
    },
  ])
})

onUnmounted(() => {
  tv?.destroy()
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
</style>
