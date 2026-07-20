<template>
  <div class="page">
    <div class="page-badge">
      <span class="badge badge-blue">{{ t('install.badge') }}</span>
    </div>
    <h1>{{ t('install.h1') }}</h1>
    <p v-html="t('install.intro')"></p>

    <section class="install-cards" aria-label="Installation choices">
      <article class="install-card">
        <h2>npm / bundler</h2>
        <p>Best for Vite, Vue, React, TypeScript, and app-level CSS overrides.</p>
        <pre class="code-block">npm install deskpane</pre>
      </article>
      <article class="install-card">
        <h2>CDN / no build</h2>
        <p>Best for vanilla HTML, jQuery pages, prototypes, and docs examples.</p>
        <pre class="code-block">&lt;script src="https://unpkg.com/deskpane/dist/deskpane.umd.min.js"&gt;&lt;/script&gt;</pre>
      </article>
    </section>

    <h2>Recommended CSS loading</h2>
    <p>
      If your app imports DeskPane CSS with a bundler, disable runtime injection so your app-level overrides keep a stable order.
      If you use the CDN script-only workflow, the runtime injector can load the core styles for you.
    </p>
    <pre class="code-block" v-pre>// Bundler mode
import 'deskpane/dist/styles/deskpane.css'
import 'deskpane/dist/styles/deskpane-desktop.css'
import 'deskpane/dist/themes/light.css'

const wm = new WindowManager({
  container: document.getElementById('desktop')!,
  isolated: true,
  injectStyles: false,
})</pre>

    <!-- ── Tab switcher ─────────────────────────────── -->
    <div class="tab-bar">
      <button :class="['tab', { active: tab === 'esm' }]" @click="tab = 'esm'">
        {{ t('install.tabEsm') }}
      </button>
      <button :class="['tab', { active: tab === 'umd' }]" @click="tab = 'umd'">
        {{ t('install.tabUmd') }}
      </button>
    </div>

    <!-- ── ESM panel ────────────────────────────────── -->
    <section v-if="tab === 'esm'" class="panel">
      <h2 v-html="t('install.esm.h2')"></h2>
      <p v-html="t('install.esm.intro')"></p>

      <h3>{{ t('install.esm.h3Step1') }}</h3>
      <pre class="code-block">npm install deskpane</pre>

      <h3>{{ t('install.esm.h3Step2') }}</h3>
      <pre class="code-block" v-pre>// main.ts  (TypeScript / bundler)
import 'deskpane/dist/styles/deskpane.css'
import 'deskpane/dist/themes/light.css'
import { WindowManager } from 'deskpane'

const wm = new WindowManager({
  container: document.getElementById('desktop')!,
  isolated: true,
  injectStyles: false,
})

const el = document.createElement('div')
el.style.padding = '20px'
el.textContent = 'Hello from ESM!'

wm.open({ id: 'w1', title: 'ESM Window', content: el })</pre>

      <h3>{{ t('install.esm.h3Step3') }}</h3>
      <pre class="code-block" v-pre>&lt;!-- index.html --&gt;
&lt;link rel="stylesheet" href="https://unpkg.com/deskpane/dist/styles/deskpane.css"&gt;
&lt;link rel="stylesheet" href="https://unpkg.com/deskpane/dist/themes/light.css"&gt;
&lt;script type="module"&gt;
  import { WindowManager } from 'https://unpkg.com/deskpane/dist/deskpane.es.min.js'

  const wm = new WindowManager({ container: document.body, injectStyles: false })
  const el = document.createElement('div')
  el.style.padding = '20px'
  el.textContent = 'Hello!'
  wm.open({ id: 'w1', title: 'My Window', content: el })
&lt;/script&gt;</pre>

      <h3>{{ t('install.esm.h3Step4') }}</h3>
      <pre class="code-block" v-pre>// The Vue adapter is in the source tree; import it through your bundler alias:
import { useWindowManager } from '@deskpane/adapters/vue/useWindowManager'

// In a vite project, add to vite.config.ts:
// resolve: { alias: { '@deskpane': path.resolve(__dirname, 'path/to/deskpane/src') } }</pre>

      <h3>{{ t('install.esm.h3Types') }}</h3>
      <pre class="code-block">// dist/index.d.ts is generated automatically.
// In tsconfig.json:
{
  "compilerOptions": {
    "paths": {
      "@deskpane/core/*": ["./node_modules/deskpane/dist/*"]
    }
  }
}</pre>
    </section>

    <!-- ── UMD panel ─────────────────────────────────── -->
    <section v-if="tab === 'umd'" class="panel">
      <h2 v-html="t('install.umd.h2')"></h2>
      <p v-html="t('install.umd.intro')"></p>

      <h3>{{ t('install.umd.h3Basic') }}</h3>
      <pre class="code-block" v-pre>&lt;!DOCTYPE html&gt;
&lt;html&gt;
&lt;head&gt;
  &lt;meta charset="UTF-8"&gt;
  &lt;title&gt;DeskPane UMD Demo&lt;/title&gt;
  &lt;link rel="stylesheet" href="https://unpkg.com/deskpane/dist/styles/deskpane.css"&gt;
  &lt;link rel="stylesheet" href="https://unpkg.com/deskpane/dist/themes/light.css"&gt;
&lt;/head&gt;
&lt;body&gt;
  &lt;div id="desktop" style="width:100vw;height:100vh;position:relative;"&gt;&lt;/div&gt;

  &lt;!-- 1. Load the bundle --&gt;
  &lt;script src="https://unpkg.com/deskpane/dist/deskpane.umd.min.js"&gt;&lt;/script&gt;

  &lt;!-- 2. Use it — no import needed --&gt;
  &lt;script&gt;
    var WindowManager = window.DeskPane.WindowManager

    var wm = new WindowManager({
      container: document.getElementById('desktop'),
      isolated: true
    })

    var el = document.createElement('div')
    el.style.padding = '20px'
    el.innerHTML = '&lt;b&gt;Hello from UMD!&lt;/b&gt;&lt;p&gt;No build step required.&lt;/p&gt;'

    wm.open({ id: 'w1', title: 'UMD Window', content: el, width: 300, height: 160 })
  &lt;/script&gt;
&lt;/body&gt;
&lt;/html&gt;</pre>

      <h3>{{ t('install.umd.h3jQuery') }}</h3>
      <pre class="code-block" v-pre>&lt;script src="https://code.jquery.com/jquery-3.7.1.min.js"&gt;&lt;/script&gt;
&lt;script src="https://unpkg.com/deskpane/dist/deskpane.umd.min.js"&gt;&lt;/script&gt;
&lt;script&gt;
  var wm = new window.DeskPane.WindowManager({ container: document.body })

  wm.on('open', function(win) {
    // jQuery plugin on the window body element
    $(wm.getBodyElement(win.id)).someJQueryPlugin({ option: true })
  })

  wm.open({ id: 'jq-grid', title: 'Grid Window', content: document.createElement('div') })
&lt;/script&gt;</pre>

      <h3>{{ t('install.umd.h3Globals') }}</h3>
      <table class="api-table">
        <thead><tr><th>{{ t('install.globals.path') }}</th><th>{{ t('install.globals.type') }}</th><th>{{ t('common.description') }}</th></tr></thead>
        <tbody>
          <tr><td><code>window.DeskPane.WindowManager</code></td><td>class</td><td>{{ t('install.globals.wm') }}</td></tr>
          <tr><td><code>window.DeskPane.DOMRenderer</code></td><td>class</td><td>{{ t('install.globals.renderer') }}</td></tr>
        </tbody>
      </table>
    </section>

    <!-- ── Live demo ─────────────────────────────────── -->
    <h2 style="margin-top:32px">{{ t('install.h2Demo') }}</h2>
    <p v-html="t('install.demoIntro')"></p>

    <DemoViewport ref="viewport" @reset="reset">
      <template #controls>
        <button class="btn" @click="openWindow('esm-demo-1', 'ESM Window', '#4a9eff')">{{ t('install.openEsm') }}</button>
        <button class="btn btn-alt" @click="openWindow('esm-demo-2', 'Second Window', '#27ae60')">{{ t('install.openSecond') }}</button>
      </template>
    </DemoViewport>

    <h2>{{ t('install.h2Sizes') }}</h2>
    <table class="api-table">
      <thead><tr><th>{{ t('install.sizes.file') }}</th><th>{{ t('install.sizes.format') }}</th><th>{{ t('install.sizes.size') }}</th><th>{{ t('install.sizes.use') }}</th></tr></thead>
      <tbody>
        <tr>
          <td><code>dist/deskpane.es.js</code></td>
          <td>ESM</td>
          <td>~24 KB</td>
          <td v-html="t('install.sizes.es.use')"></td>
        </tr>
        <tr>
          <td><code>dist/deskpane.umd.js</code></td>
          <td>UMD</td>
          <td>~26 KB</td>
          <td>{{ t('install.sizes.umd.use') }}</td>
        </tr>
        <tr>
          <td><code>dist/index.d.ts</code></td>
          <td>TypeScript</td>
          <td>~4 KB</td>
          <td>{{ t('install.sizes.dts.use') }}</td>
        </tr>
      </tbody>
    </table>

    <h2>{{ t('install.h2WorkspaceBundle') }}</h2>
    <p v-html="t('install.workspaceBundleDesc')"></p>
    <table class="api-table">
      <thead><tr><th>{{ t('install.sizes.file') }}</th><th>{{ t('install.sizes.format') }}</th><th>{{ t('common.description') }}</th></tr></thead>
      <tbody>
        <tr>
          <td><code>dist/deskpane-workspace.es.js</code></td>
          <td>ESM</td>
          <td v-html="t('install.sizes.es.use')"></td>
        </tr>
        <tr>
          <td><code>dist/deskpane-workspace.umd.js</code></td>
          <td>UMD</td>
          <td>{{ t('install.sizes.umd.use') }} — <code>window.DeskPaneWorkspace</code></td>
        </tr>
      </tbody>
    </table>

    <h2>{{ t('install.h2MenuBundle') }}</h2>
    <p v-html="t('install.menuBundleDesc')"></p>
    <table class="api-table">
      <thead><tr><th>{{ t('install.sizes.file') }}</th><th>{{ t('install.sizes.format') }}</th><th>{{ t('common.description') }}</th></tr></thead>
      <tbody>
        <tr>
          <td><code>dist/deskpane-menu.es.js</code></td>
          <td>ESM</td>
          <td v-html="t('install.sizes.es.use')"></td>
        </tr>
        <tr>
          <td><code>dist/deskpane-menu.umd.js</code></td>
          <td>UMD</td>
          <td>{{ t('install.sizes.umd.use') }} — <code>window.DeskPaneMenu</code></td>
        </tr>
        <tr>
          <td><code>dist/styles/deskpane-menu.css</code></td>
          <td>CSS</td>
          <td>{{ t('install.menuCssDesc') }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { WindowManager } from '@deskpane/core/WindowManager'
import DemoViewport from '../components/DemoViewport.vue'
import { useDocCode } from '../composables/useDocCode'
import { useLocale } from '../composables/useLocale'

const { setCode } = useDocCode()
const { t } = useLocale()
const viewport = ref<InstanceType<typeof DemoViewport> | null>(null)
let wm: WindowManager | null = null
const tab = ref<'esm' | 'umd'>('esm')

function initWM() {
  const container = viewport.value?.container
  if (!container) return
  wm = new WindowManager({ container, isolated: true })
}

function reset() {
  wm?.destroy()
  initWM()
}

function openWindow(id: string, title: string, color: string) {
  if (!wm) return
  const div = document.createElement('div')
  div.style.cssText = 'padding:20px;'
  div.innerHTML = `
    <div style="display:inline-block;background:${color};color:#fff;padding:4px 10px;border-radius:4px;font-size:12px;margin-bottom:8px">
      ${tab.value === 'esm' ? 'ESM import' : 'UMD script tag'}
    </div>
    <p style="margin:0;font-size:13px">This window was created by <strong>WindowManager</strong>.</p>
    <p style="margin:8px 0 0;font-size:12px;color:#888">Both ES6 and ES5 produce the same result.</p>
  `
  wm.open({ id, title, content: div, width: 320, height: 170 })
}

onMounted(() => {
  initWM()
  setCode([
    {
      name: 'ES6 (ESM)',
      lang: 'typescript',
      code: `// ── ES6 / ESM ──────────────────────────────────────
// Works with Vite, Webpack, Rollup, or native <script type="module">

import { WindowManager } from './dist/deskpane.es.js'

const wm = new WindowManager({
  container: document.getElementById('desktop')!,
  isolated: true,
})

const el = document.createElement('div')
el.style.padding = '20px'
el.innerHTML = '<h3>Hello from ESM!</h3>'

wm.open({ id: 'w1', title: 'ESM Window', content: el })`,
    },
    {
      name: 'ES5 (UMD)',
      lang: 'html',
      code: `<!-- ── ES5 / UMD ─────────────────────────────────── -->
<!-- Works in any browser — no build step required      -->

<!DOCTYPE html>
<html>
<body>
  <div id="desktop" style="width:100vw;height:100vh;position:relative;"></div>

  <!-- Step 1: load the UMD bundle -->
  <script src="dist/deskpane.umd.js"><\/script>

  <!-- Step 2: use window.DeskPane -->
  <script>
    var wm = new window.DeskPane.WindowManager({
      container: document.getElementById('desktop'),
      isolated: true,
    })

    var el = document.createElement('div')
    el.style.padding = '20px'
    el.innerHTML = '<h3>Hello from UMD!</h3>'

    wm.open({ id: 'w1', title: 'UMD Window', content: el })
  <\/script>
</body>
</html>`,
    },
    {
      name: 'Vue 3 (ESM)',
      lang: 'typescript',
      code: `<!-- ── Vue 3 integration ─────────────────────────── -->
<!-- Add to vite.config.ts:
     resolve: { alias: { '@deskpane': '/path/to/deskpane/src' } }
-->

<template>
  <div class="desktop">
    <button @click="openClock">Open Clock</button>

    <template v-for="win in windows" :key="win.id">
      <Teleport v-if="win.component" :to="win.bodyEl">
        <KeepAlive>
          <component :is="win.component" />
        </KeepAlive>
      </Teleport>
    </template>
  </div>
</template>

<script setup lang="ts">
import { useWindowManager } from '@deskpane/adapters/vue/useWindowManager'
import ClockWindow from './ClockWindow.vue'

const { windows, openVueWindow } = useWindowManager()

function openClock() {
  openVueWindow({ id: 'clock', title: 'Clock', component: ClockWindow })
}
<\/script>`,
    },
  ])
})

onUnmounted(() => wm?.destroy())
</script>

<style scoped>
.page { max-width: 800px; }

.tab-bar {
  display: flex;
  gap: 4px;
  border-bottom: 2px solid #e0e0e0;
  margin-bottom: 20px;
}
.tab {
  padding: 8px 20px;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  cursor: pointer;
  font-size: 14px;
  color: #555;
  font-weight: 500;
  transition: all 0.15s;
}
.tab:hover { color: var(--color-primary); }
.tab.active {
  color: var(--color-primary);
  border-bottom-color: var(--color-primary);
}

.panel h2 { margin-top: 0; }
.panel h3 { margin: 20px 0 6px; font-size: 14px; color: #333; }

.install-cards {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  margin: 18px 0 22px;
}

.install-card {
  border: 1px solid var(--color-border);
  background: #fff;
  padding: 14px;
}

.install-card h2 {
  margin: 0 0 6px;
  padding: 0;
}

.install-card p {
  color: #536577;
  min-height: 42px;
}

.code-block {
  background: #1e1e2e;
  color: #cdd6f4;
  padding: 12px 16px;
  border-radius: 6px;
  font-size: 12.5px;
  line-height: 1.6;
  overflow-x: auto;
  margin: 0 0 8px;
  white-space: pre;
  font-family: 'Cascadia Code', 'Fira Code', monospace;
}

.api-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  margin-bottom: 24px;
}
.api-table th {
  background: #f5f6f8;
  text-align: left;
  padding: 8px 12px;
  font-weight: 600;
  border-bottom: 2px solid #e0e0e0;
}
.api-table td {
  padding: 8px 12px;
  border-bottom: 1px solid #f0f0f0;
  vertical-align: top;
}
.api-table code { font-size: 12px; background: #f0f0f0; padding: 1px 5px; border-radius: 3px; }

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

@media (max-width: 760px) {
  .install-cards {
    grid-template-columns: 1fr;
  }
}
</style>
