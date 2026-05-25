<template>
  <div class="page">
    <div class="page-badge">
      <span class="badge badge-green">{{ t('border.badge') }}</span>
    </div>
    <h1>{{ t('border.h1') }}</h1>
    <p v-html="t('border.intro')"></p>

    <DemoViewport ref="viewport" @reset="onReset">
      <template #controls>
        <button class="btn" @click="openBasic">{{ t('border.openDemo') }}</button>
        <button class="btn btn-alt" @click="openNested">{{ t('border.openNested') }}</button>
      </template>
    </DemoViewport>

    <h2>{{ t('border.h2Usage') }}</h2>
    <pre class="code-block" v-pre>const content = document.createElement('div')
content.innerHTML = `
  &lt;div data-region="north"  data-title="Toolbar" data-icon="🔧" data-size="40" data-collapsible&gt;&lt;/div&gt;
  &lt;div data-region="west"   data-title="Nav"     data-icon="📁" data-size="180" data-collapsible&gt;&lt;p&gt;Sidebar&lt;/p&gt;&lt;/div&gt;
  &lt;div data-region="center"&gt;&lt;p style="padding:16px"&gt;Main content&lt;/p&gt;&lt;/div&gt;
  &lt;div data-region="east"   data-title="Props"   data-icon="🔍" data-size="160" data-collapsible&gt;&lt;/div&gt;
  &lt;div data-region="south"  data-title="Status"  data-size="28"  data-collapsible&gt;&lt;/div&gt;
`
wm.open({ id: 'app', title: 'My App', width: 800, height: 500, content })</pre>

    <h2>{{ t('border.h2Attrs') }}</h2>
    <table class="api-table">
      <thead>
        <tr>
          <th>{{ t('border.col.attr') }}</th>
          <th>{{ t('border.col.desc') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr><td><code>data-region</code></td><td v-html="t('border.attr.region')"></td></tr>
        <tr><td><code>data-size</code></td><td v-html="t('border.attr.size')"></td></tr>
        <tr><td><code>data-min-size</code></td><td v-html="t('border.attr.minSize')"></td></tr>
        <tr><td><code>data-collapsible</code></td><td v-html="t('border.attr.collapsible')"></td></tr>
        <tr><td><code>data-collapsed</code></td><td v-html="t('border.attr.collapsed')"></td></tr>
        <tr><td><code>data-title</code></td><td v-html="t('border.attr.title')"></td></tr>
        <tr><td><code>data-icon</code></td><td v-html="t('border.attr.icon')"></td></tr>
      </tbody>
    </table>

    <h2>{{ t('border.h2Strip') }}</h2>
    <p v-html="t('border.stripDesc')"></p>

    <h2>{{ t('border.h2Nested') }}</h2>
    <p v-html="t('border.nestedDesc')"></p>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { WindowManager } from '@webos/core/WindowManager'
import DemoViewport from '../components/DemoViewport.vue'
import { useDocCode } from '../composables/useDocCode'
import { useLocale } from '../composables/useLocale'

const { setCode } = useDocCode()
const { t } = useLocale()
const viewport = ref<InstanceType<typeof DemoViewport> | null>(null)
let wm: WindowManager | null = null

function initWM() {
  const container = viewport.value?.container
  if (!container) return
  wm = new WindowManager({ container, isolated: true, snap: true, snapGap: 4 })
}

function onReset() { wm?.destroy(); initWM() }

function openBasic() {
  if (!wm) return
  const content = document.createElement('div')
  content.innerHTML = `
    <div data-region="north" data-title="Toolbar" data-icon="🔧" data-size="36" data-collapsible>
      <div style="padding:0 8px;display:flex;align-items:center;height:100%;gap:6px">
        <button style="padding:2px 8px;font-size:11px">New</button>
        <button style="padding:2px 8px;font-size:11px">Open</button>
        <button style="padding:2px 8px;font-size:11px">Save</button>
      </div>
    </div>
    <div data-region="west" data-title="Navigator" data-icon="📁" data-size="140" data-collapsible>
      <div style="padding:8px;font-size:12px">
        <div style="margin-bottom:4px">📄 index.ts</div>
        <div style="margin-bottom:4px">📄 App.vue</div>
        <div style="margin-bottom:4px">📁 components/</div>
        <div style="margin-bottom:4px;padding-left:12px">📄 Button.vue</div>
      </div>
    </div>
    <div data-region="center">
      <div style="padding:16px;font-size:13px">
        <p><strong>Center region</strong> — main content area</p>
        <p style="color:#666;font-size:12px">Try dragging the splitters ↔ or clicking the collapse buttons ◀ ▶</p>
      </div>
    </div>
    <div data-region="east" data-title="Properties" data-icon="🔍" data-size="140" data-collapsible>
      <div style="padding:8px;font-size:12px">
        <div style="margin-bottom:6px"><strong>width</strong>: 140px</div>
        <div style="margin-bottom:6px"><strong>height</strong>: auto</div>
        <div style="margin-bottom:6px"><strong>theme</strong>: light</div>
      </div>
    </div>
    <div data-region="south" data-title="Status" data-size="26" data-collapsible>
      <div style="padding:0 8px;display:flex;align-items:center;height:100%;gap:12px;font-size:11px;color:#666">
        <span>✅ Ready</span>
        <span>TypeScript 5.4</span>
      </div>
    </div>
  `
  wm.open({ id: 'border-basic', title: 'BorderLayout Demo', width: 680, height: 380, content })
}

function openNested() {
  if (!wm) return
  const content = document.createElement('div')
  content.innerHTML = `
    <div data-region="west" data-title="Sidebar" data-icon="📁" data-size="120" data-collapsible>
      <div style="padding:8px;font-size:12px">
        <div>📁 Pages</div>
        <div style="padding-left:10px;margin-top:4px">📄 Home</div>
        <div style="padding-left:10px;margin-top:4px">📄 About</div>
      </div>
    </div>
    <div data-region="center">
      <div data-region="north" data-title="Tabs" data-size="32">
        <div style="padding:0 8px;display:flex;align-items:center;height:100%;gap:4px">
          <button style="padding:2px 10px;font-size:11px;background:#e0e7ff;border:none;border-radius:3px;cursor:pointer">Tab 1</button>
          <button style="padding:2px 10px;font-size:11px;background:none;border:1px solid #ddd;border-radius:3px;cursor:pointer">Tab 2</button>
        </div>
      </div>
      <div data-region="center">
        <div style="padding:16px;font-size:13px">
          <p><strong>Nested Center</strong></p>
          <p style="font-size:12px;color:#666">Center region contains another BorderLayout with North tabs + Center content.</p>
        </div>
      </div>
      <div data-region="south" data-title="Log" data-size="80" data-collapsible>
        <div style="padding:8px;font-family:monospace;font-size:11px;color:#a6adc8;background:#11111b;height:100%;overflow:auto">
          [INFO] App started<br>[DEBUG] Layout mounted<br>[INFO] Ready
        </div>
      </div>
    </div>
  `
  wm.open({ id: 'border-nested', title: 'Nested Layout', width: 620, height: 380, content, x: 40, y: 30 })
}

onMounted(() => {
  initWM()
  openBasic()
  setCode([
    {
      name: 'basic.html',
      lang: 'html',
      code: `<!-- All regions declared with data-region HTML attributes -->
<!-- wm.open() auto-detects them and builds the BorderLayout -->

<script>
const content = document.createElement('div')
content.innerHTML = \`
  <div data-region="north"  data-title="Toolbar" data-icon="🔧" data-size="36" data-collapsible></div>
  <div data-region="west"   data-title="Nav"     data-icon="📁" data-size="180" data-collapsible>
    <p>Sidebar content</p>
  </div>
  <div data-region="center"><p>Main content</p></div>
  <div data-region="east"   data-title="Props"   data-icon="🔍" data-size="160" data-collapsible></div>
  <div data-region="south"  data-title="Status"  data-size="28"  data-collapsible></div>
\`

wm.open({
  id: 'app',
  title: 'My App',
  width: 800,
  height: 500,
  content,
})
<\/script>`,
    },
    {
      name: 'nested.html',
      lang: 'html',
      code: `<!-- Any region can contain a child BorderLayout -->
<script>
const content = document.createElement('div')
content.innerHTML = \`
  <div data-region="west" data-size="150" data-collapsible>
    <p>Sidebar</p>
  </div>
  <div data-region="center">
    <!-- Nested layout inside center region -->
    <div data-region="north" data-size="32" data-title="Tabs"></div>
    <div data-region="center"><p>Main</p></div>
    <div data-region="south" data-size="80" data-collapsible data-title="Log"></div>
  </div>
\`
wm.open({ id: 'nested', title: 'Nested', width: 700, height: 450, content })
<\/script>`,
    },
  ])
})

onUnmounted(() => wm?.destroy())
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
.btn-alt { background: #27ae60; }
.btn-alt:hover { background: #219150; }
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
</style>
