<template>
  <div class="page">
    <div class="page-badge">
      <span class="badge badge-gray">{{ t('dom.badge') }}</span>
    </div>
    <h1>{{ t('dom.h1') }}</h1>
    <p v-html="t('dom.intro')"></p>

    <DocSampleLayout>
      <DocSampleTabs
        v-model="activeSample"
        :samples="samples"
        aria-label="DOM content framework samples"
      />

      <DemoViewport ref="viewport" @reset="reset">
        <template #controls>
          <button class="btn" @click="openText">{{ t('dom.btnText') }}</button>
          <button class="btn" @click="openForm">{{ t('dom.btnForm') }}</button>
          <button class="btn" @click="openTable">{{ t('dom.btnTable') }}</button>
          <button class="btn" @click="openProgress">{{ t('dom.btnProgress') }}</button>
        </template>
      </DemoViewport>
    </DocSampleLayout>

    <h2>{{ t('dom.h2GetBody') }}</h2>
    <p v-html="t('dom.getBodyDesc')"></p>
    <table class="api-table">
      <thead><tr><th>{{ t('dom.th.pattern') }}</th><th>{{ t('dom.th.usage') }}</th></tr></thead>
      <tbody>
        <tr>
          <td v-html="t('dom.pattern1')"></td>
          <td>{{ t('dom.pattern1.desc') }}</td>
        </tr>
        <tr>
          <td v-html="t('dom.pattern2')"></td>
          <td>{{ t('dom.pattern2.desc') }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { WindowManager } from '@deskpane/core/WindowManager'
import DemoViewport from '../components/DemoViewport.vue'
import DocSampleLayout from '../components/DocSampleLayout.vue'
import DocSampleTabs from '../components/DocSampleTabs.vue'
import { useDocCode } from '../composables/useDocCode'
import { useLocale } from '../composables/useLocale'

const { setCode } = useDocCode()
const { t } = useLocale()
const viewport = ref<InstanceType<typeof DemoViewport> | null>(null)
let wm: WindowManager | null = null
let winCount = 0
const activeSample = ref('vanilla')
const samples = [
  { id: 'vanilla', label: 'Vanilla JS', description: 'Pass HTMLElement content directly or mount into getBodyElement().' },
  { id: 'jquery', label: 'jQuery', description: 'Build DOM with jQuery and open it with dpWindow.' },
  { id: 'vue', label: 'Vue 3', description: 'Use Teleport to mount Vue components into DeskPane body elements.' },
  { id: 'react', label: 'React 18', description: 'Use createPortal to mount React components into DeskPane body elements.' },
] as const

function initWM() {
  const container = viewport.value?.container
  if (!container) return
  wm = new WindowManager({ container, isolated: true })
  winCount = 0
}

function reset() { wm?.destroy(); initWM() }

function nextPos() {
  return { x: 20 + (winCount % 4) * 40, y: 20 + (winCount % 3) * 30 }
}

function openText() {
  if (!wm) return
  const pos = nextPos(); winCount++
  const el = document.createElement('div')
  el.style.cssText = 'padding:16px; line-height:1.7;'
  el.innerHTML = `
    <h3 style="margin:0 0 8px">Plain Text</h3>
    <p>Any HTML string can be set via <code>innerHTML</code>.</p>
    <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>`
  wm.open({ id: `text-${winCount}`, title: 'Text Window', content: el, width: 300, height: 180, ...pos })
}

function openForm() {
  if (!wm) return
  const pos = nextPos(); winCount++
  const el = document.createElement('form')
  el.style.cssText = 'padding:16px; display:flex; flex-direction:column; gap:10px;'
  el.innerHTML = `
    <label style="font-size:12px;font-weight:600">Name</label>
    <input type="text" placeholder="Enter name..." style="padding:6px 10px;border:1px solid #d1d5db;border-radius:4px;">
    <label style="font-size:12px;font-weight:600">Email</label>
    <input type="email" placeholder="user@example.com" style="padding:6px 10px;border:1px solid #d1d5db;border-radius:4px;">
    <button type="submit" style="padding:6px;background:#0078d4;color:#fff;border:none;border-radius:4px;cursor:pointer;">Submit</button>`
  el.addEventListener('submit', (e) => { e.preventDefault(); alert('Submitted!') })
  wm.open({ id: `form-${winCount}`, title: 'Form Window', content: el, width: 280, height: 230, ...pos })
}

function openTable() {
  if (!wm) return
  const pos = nextPos(); winCount++
  const el = document.createElement('div')
  el.style.cssText = 'overflow:auto;'
  el.innerHTML = `
    <table style="width:100%;border-collapse:collapse;font-size:12px;">
      <thead>
        <tr style="background:#f3f4f6;">
          <th style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:left">Name</th>
          <th style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:left">Status</th>
          <th style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right">Score</th>
        </tr>
      </thead>
      <tbody>
        ${['Alice','Bob','Carol','Dave'].map((n,i) => `
          <tr>
            <td style="padding:7px 12px;border-bottom:1px solid #f3f4f6">${n}</td>
            <td style="padding:7px 12px;border-bottom:1px solid #f3f4f6">
              <span style="padding:2px 8px;border-radius:12px;font-size:11px;background:${i%2?'#dcfce7':'#dbeafe'};color:${i%2?'#166534':'#1d4ed8'}">${i%2?'Active':'Pending'}</span>
            </td>
            <td style="padding:7px 12px;border-bottom:1px solid #f3f4f6;text-align:right">${Math.floor(Math.random()*100)}</td>
          </tr>`).join('')}
      </tbody>
    </table>`
  wm.open({ id: `table-${winCount}`, title: 'Table Window', content: el, width: 320, height: 200, ...pos })
}

function openProgress() {
  if (!wm) return
  const pos = nextPos(); winCount++
  const el = document.createElement('div')
  el.style.cssText = 'padding:16px;'
  el.innerHTML = `<p style="margin:0 0 8px;font-size:12px;font-weight:600">Processing...</p>`
  const bar = document.createElement('div')
  bar.style.cssText = 'height:8px;background:#e5e7eb;border-radius:4px;overflow:hidden;'
  const fill = document.createElement('div')
  fill.style.cssText = 'height:100%;background:#0078d4;border-radius:4px;width:0;transition:width 0.1s;'
  bar.appendChild(fill)
  el.appendChild(bar)
  const info = document.createElement('p')
  info.style.cssText = 'margin:8px 0 0;font-size:11px;color:#888;'
  info.textContent = '0%'
  el.appendChild(info)
  wm.open({ id: `prog-${winCount}`, title: 'Progress Demo', content: el, width: 260, height: 120, ...pos })
  // Animate
  let pct = 0
  const iv = setInterval(() => {
    pct = Math.min(100, pct + Math.random() * 8)
    fill.style.width = `${pct}%`
    info.textContent = `${Math.floor(pct)}%${pct >= 100 ? ' — Done!' : ''}`
    if (pct >= 100) clearInterval(iv)
  }, 120)
}

function setCodeForSample() {
  if (activeSample.value === 'jquery') {
    setCode([
      {
        name: 'jquery.js',
        lang: 'javascript',
        code: `$('#desktop').dpWindowManager({
  isolated: true,
  injectStyles: false,
})

const $form = $(\`
  <form class="customer-form">
    <label>Customer <input name="customer"></label>
    <button type="button">Save</button>
  </form>
\`)

$form.on('click', 'button', function () {
  alert('Saved: ' + $form.find('[name="customer"]').val())
})

$form.dpWindow({
  manager: '#desktop',
  id: 'customer-form',
  title: 'Customer Form',
  width: 360,
  height: 220,
})`,
      },
    ])
    return
  }

  if (activeSample.value === 'vue') {
    setCode([
      {
        name: 'App.vue',
        lang: 'vue',
        code: `<template>
  <div ref="desktopEl" class="desktop">
    <button @click="openCustomer">Open customer form</button>

    <Teleport
      v-for="win in windows"
      :key="win.id"
      :to="win.bodyEl"
    >
      <component :is="win.component" />
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useWindowManager } from 'deskpane/vue'
import CustomerForm from './CustomerForm.vue'

const desktopEl = ref<HTMLElement | null>(null)
const { windows, openVueWindow } = useWindowManager({
  container: desktopEl,
  isolated: true,
})

function openCustomer() {
  openVueWindow({
    id: 'customer-form',
    title: 'Customer Form',
    component: CustomerForm,
    width: 360,
    height: 240,
  })
}
<\/script>`,
      },
    ])
    return
  }

  if (activeSample.value === 'react') {
    setCode([
      {
        name: 'App.tsx',
        lang: 'typescript',
        code: `import { createPortal } from 'react-dom'
import { useWindowManager } from 'deskpane/react'
import CustomerForm from './CustomerForm'

export default function App() {
  const { windows, openReactWindow } = useWindowManager({
    isolated: true,
  })

  return (
    <div className="desktop">
      <button onClick={() => openReactWindow({
        id: 'customer-form',
        title: 'Customer Form',
        component: CustomerForm,
        width: 360,
        height: 240,
      })}>
        Open customer form
      </button>

      {windows.map(win => {
        const Component = win.component
        return Component
          ? createPortal(<Component />, win.bodyEl, win.id)
          : null
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
      name: 'vanilla.ts',
      lang: 'typescript',
      code: `import { WindowManager } from 'deskpane'

const wm = new WindowManager({
  container: document.getElementById('desktop')!,
  isolated: true,
})

const content = document.createElement('div')
content.innerHTML = \`
  <h3>Plain DOM content</h3>
  <p>Any HTMLElement can become a DeskPane window body.</p>
\`

wm.open({
  id: 'plain-dom',
  title: 'Plain DOM',
  content,
  width: 340,
  height: 200,
})

const body = wm.getBodyElement('plain-dom')
body?.append(document.createElement('hr'))`,
    },
  ])
}

onMounted(() => {
  initWM()
  setCodeForSample()
})

watch(activeSample, setCodeForSample)

onUnmounted(() => wm?.destroy())
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
}
.btn:hover { background: var(--color-primary-hover); }
</style>
