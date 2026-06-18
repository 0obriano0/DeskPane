<template>
  <div class="page">
    <div class="page-badge">
      <span class="badge badge-blue">{{ t('overview.badge') }}</span>
    </div>
    <h1>{{ t('overview.h1') }}</h1>
    <p class="lead" v-html="t('overview.lead')"></p>

    <h2>{{ t('overview.h2Features') }}</h2>
    <ul>
      <li>✅ <span v-html="t('overview.feat1')"></span></li>
      <li>✅ <span v-html="t('overview.feat2')"></span></li>
      <li>✅ {{ t('overview.feat3') }}</li>
      <li>✅ {{ t('overview.feat4') }}</li>
      <li>✅ {{ t('overview.feat5') }}</li>
      <li>✅ <span v-html="t('overview.feat6')"></span></li>
      <li>✅ <span v-html="t('overview.feat7')"></span></li>
      <li>✅ <span v-html="t('overview.feat8')"></span></li>
      <li>✅ <span v-html="t('overview.feat9')"></span></li>
      <li>✅ <span v-html="t('overview.feat10')"></span></li>
    </ul>

    <h2>{{ t('overview.h2CoreApi') }}</h2>
    <table class="api-table">
      <thead>
        <tr><th>{{ t('overview.col.method') }}</th><th>{{ t('overview.col.description') }}</th></tr>
      </thead>
      <tbody>
        <tr><td><code>wm.open(config)</code></td><td>{{ t('overview.api.open') }}</td></tr>
        <tr><td><code>wm.close(id)</code></td><td>{{ t('overview.api.close') }}</td></tr>
        <tr><td><code>wm.minimize(id)</code></td><td>{{ t('overview.api.minimize') }}</td></tr>
        <tr><td><code>wm.maximize(id)</code></td><td>{{ t('overview.api.maximize') }}</td></tr>
        <tr><td><code>wm.restore(id)</code></td><td>{{ t('overview.api.restore') }}</td></tr>
        <tr><td><code>wm.focus(id)</code></td><td>{{ t('overview.api.focus') }}</td></tr>
        <tr><td><code>wm.setTitle(id, title)</code></td><td>{{ t('overview.api.setTitle') }}</td></tr>
        <tr><td><code>wm.getState(id)</code></td><td>{{ t('overview.api.getState') }}</td></tr>
        <tr><td><code>wm.getBodyElement(id)</code></td><td v-html="t('overview.api.getBodyElement')"></td></tr>
        <tr><td><code>wm.getWindowIds()</code></td><td>{{ t('overview.api.getWindowIds') }}</td></tr>
        <tr><td><code>wm.events.on(event, cb)</code></td><td>{{ t('overview.api.eventsOn') }}</td></tr>
        <tr><td><code>wm.destroy()</code></td><td>{{ t('overview.api.destroy') }}</td></tr>
      </tbody>
    </table>

    <h2>{{ t('overview.h2Events') }}</h2>
    <table class="api-table">
      <thead>
        <tr><th>{{ t('overview.col.event') }}</th><th>{{ t('overview.col.payload') }}</th><th>{{ t('overview.col.firedWhen') }}</th></tr>
      </thead>
      <tbody>
        <tr><td><code>window:opened</code></td><td><code>WindowState</code></td><td>{{ t('overview.event.opened') }}</td></tr>
        <tr><td><code>window:closed</code></td><td><code>{ id }</code></td><td>{{ t('overview.event.closed') }}</td></tr>
        <tr><td><code>window:focused</code></td><td><code>WindowState</code></td><td>{{ t('overview.event.focused') }}</td></tr>
        <tr><td><code>window:minimized</code></td><td><code>WindowState</code></td><td>{{ t('overview.event.minimized') }}</td></tr>
        <tr><td><code>window:maximized</code></td><td><code>WindowState</code></td><td>{{ t('overview.event.maximized') }}</td></tr>
        <tr><td><code>window:restored</code></td><td><code>WindowState</code></td><td>{{ t('overview.event.restored') }}</td></tr>
        <tr><td><code>window:maximized-drag-restored</code></td><td><code>WindowState</code></td><td>{{ t('overview.event.maximizedDragRestored') }}</td></tr>
        <tr><td><code>window:edge-snapped</code></td><td><code>EdgeSnapEvent</code></td><td>{{ t('overview.event.edgeSnapped') }}</td></tr>
        <tr><td><code>window:moved</code></td><td><code>WindowState</code></td><td>{{ t('overview.event.moved') }}</td></tr>
        <tr><td><code>window:resized</code></td><td><code>WindowState</code></td><td>{{ t('overview.event.resized') }}</td></tr>
        <tr><td><code>window:child-opened</code></td><td><code>{ parentId, childId }</code></td><td>{{ t('overview.event.childOpened') }}</td></tr>
        <tr><td><code>window:child-closed</code></td><td><code>{ parentId, childId }</code></td><td>{{ t('overview.event.childClosed') }}</td></tr>
      </tbody>
    </table>

    <h2>{{ t('overview.h2Config') }}</h2>
    <table class="api-table">
      <thead>
        <tr><th>{{ t('overview.col.property') }}</th><th>{{ t('common.type') }}</th><th>{{ t('overview.col.required') }}</th><th>{{ t('overview.col.description') }}</th></tr>
      </thead>
      <tbody>
        <tr><td><code>id</code></td><td>string</td><td><span class="badge badge-blue">{{ t('common.required') }}</span></td><td>{{ t('overview.config.id') }}</td></tr>
        <tr><td><code>title</code></td><td>string</td><td><span class="badge badge-blue">{{ t('common.required') }}</span></td><td>{{ t('overview.config.title') }}</td></tr>
        <tr><td><code>icon</code></td><td>string</td><td><span class="badge badge-gray">{{ t('common.optional') }}</span></td><td v-html="t('overview.config.icon')"></td></tr>
        <tr><td><code>label</code></td><td>string</td><td><span class="badge badge-gray">{{ t('common.optional') }}</span></td><td v-html="t('overview.config.label')"></td></tr>
        <tr><td><code>content</code></td><td>HTMLElement | null</td><td><span class="badge badge-blue">{{ t('common.required') }}</span></td><td>{{ t('overview.config.content') }}</td></tr>
        <tr><td><code>slotType</code></td><td>'dom' | 'vue' | 'react'</td><td><span class="badge badge-gray">{{ t('common.optional') }}</span></td><td v-html="t('overview.config.slotType')"></td></tr>
        <tr><td><code>x, y</code></td><td>number</td><td><span class="badge badge-gray">{{ t('common.optional') }}</span></td><td>{{ t('overview.config.xy') }}</td></tr>
        <tr><td><code>width, height</code></td><td>number</td><td><span class="badge badge-gray">{{ t('common.optional') }}</span></td><td>{{ t('overview.config.wh') }}</td></tr>
        <tr><td><code>props</code></td><td>Record&lt;string, unknown&gt;</td><td><span class="badge badge-gray">{{ t('common.optional') }}</span></td><td>{{ t('overview.config.props') }}</td></tr>
        <tr><td><code>resizable</code></td><td>boolean</td><td><span class="badge badge-gray">{{ t('common.optional') }}</span></td><td v-html="t('overview.config.resizable')"></td></tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useDocCode } from '../composables/useDocCode'
import { useLocale } from '../composables/useLocale'

const { setCode } = useDocCode()
const { t } = useLocale()

onMounted(() => setCode([
  {
    name: 'install.sh',
    lang: 'javascript',
    code: `# Type-check only (no JS output)
npm run build

# Build ES + UMD bundles → dist/
npm run build:lib

# Or import TypeScript source directly in a Vite project
# (no build step needed)`,
  },
  {
    name: 'main.ts',
    lang: 'typescript',
    code: `import { WindowManager } from '@deskpane/core/WindowManager'

const wm = new WindowManager()

const content = document.createElement('div')
content.style.padding = '16px'
content.textContent = 'Hello, World!'

wm.open({
  id: 'hello',
  title: 'My First Window',
  content,
})`,
  },
]))
</script>

<style scoped>
.page { max-width: 760px; }
.page-badge { margin-bottom: 8px; }
.lead {
  font-size: 15px;
  color: #374151;
  margin-bottom: 20px;
  line-height: 1.7;
}
ul { padding-left: 20px; }
ul li { margin-bottom: 6px; }
</style>
