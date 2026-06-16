<template>
  <div class="page">
    <div class="page-badge">
      <span class="badge badge-react">{{ t('react.badge') }}</span>
    </div>
    <h1>{{ t('react.h1') }}</h1>
    <p v-html="t('react.intro')"></p>

    <DemoViewport ref="viewport" @reset="reset">
      <template #controls>
        <button class="btn" @click="openCounter">{{ t('react.openCounter') }}</button>
        <button class="btn" @click="openTodo">{{ t('react.openTodo') }}</button>
        <button class="btn" @click="openForm">{{ t('react.openForm') }}</button>
      </template>
    </DemoViewport>

    <!-- State Preservation note -->
    <p v-html="t('react.stateNote')"></p>

    <!-- How it works -->
    <h2>{{ t('react.h2How') }}</h2>
    <ol>
      <li v-html="t('react.step1')"></li>
      <li v-html="t('react.step2')"></li>
      <li v-html="t('react.step3')"></li>
      <li v-html="t('react.step4')"></li>
    </ol>

    <!-- State preservation comparison -->
    <h2>{{ t('react.h2State') }}</h2>
    <table class="api-table">
      <thead>
        <tr>
          <th>{{ t('react.th.aspect') }}</th>
          <th>{{ t('react.th.vue') }}</th>
          <th>{{ t('react.th.react') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>{{ t('react.cmp.mechanism') }}</td>
          <td v-html="t('react.cmp.vue.mechanism')"></td>
          <td v-html="t('react.cmp.react.mechanism')"></td>
        </tr>
        <tr>
          <td>{{ t('react.cmp.extra') }}</td>
          <td v-html="t('react.cmp.vue.extra')"></td>
          <td v-html="t('react.cmp.react.extra')"></td>
        </tr>
        <tr>
          <td>{{ t('react.cmp.render') }}</td>
          <td v-html="t('react.cmp.vue.render')"></td>
          <td v-html="t('react.cmp.react.render')"></td>
        </tr>
      </tbody>
    </table>

    <!-- Return values -->
    <h2>{{ t('react.h2Returns') }}</h2>
    <table class="api-table">
      <thead>
        <tr>
          <th>{{ t('common.name') }}</th>
          <th>{{ t('common.type') }}</th>
          <th>{{ t('common.description') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr><td><code>windows</code></td><td><code>ReactWindowEntry[]</code></td><td>{{ t('react.ret.windows') }}</td></tr>
        <tr><td><code>wm</code></td><td><code>WindowManager</code></td><td>{{ t('react.ret.wm') }}</td></tr>
        <tr><td><code>openReactWindow(config)</code></td><td>—</td><td>{{ t('react.ret.openReact') }}</td></tr>
        <tr><td><code>close / minimize / maximize / restore / focus / setTitle</code></td><td>—</td><td v-html="t('react.ret.proxies')"></td></tr>
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
let winCount = 0

function initWM() {
  const container = viewport.value?.container
  if (!container) return
  wm = new WindowManager({ container, isolated: true, throttleMs: 16 })
  winCount = 0
}

function reset() { wm?.destroy(); initWM() }

function nextPos() {
  return { x: 20 + (winCount % 4) * 30, y: 20 + (winCount % 3) * 24 }
}

/** Counter demo — vanilla DOM equivalent */
function openCounter() {
  if (!wm) return
  const pos = nextPos(); winCount++
  const el = document.createElement('div')
  el.style.cssText = 'padding:24px;text-align:center;font-family:Segoe UI,sans-serif;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;'
  let count = 0
  const num = document.createElement('div')
  num.style.cssText = 'font-size:64px;font-weight:700;color:#61dafb;line-height:1'
  num.textContent = '0'
  const btns = document.createElement('div')
  btns.style.cssText = 'display:flex;gap:12px'
  ;[['－', -1], ['重置', 0], ['＋', 1]].forEach(([label, delta]) => {
    const btn = document.createElement('button')
    btn.textContent = label as string
    btn.style.cssText = 'width:44px;height:44px;font-size:18px;border:1px solid #ddd;border-radius:8px;background:#f8f8f8;cursor:pointer'
    btn.addEventListener('click', () => {
      count = delta === 0 ? 0 : count + (delta as number)
      num.textContent = String(count)
    })
    btns.appendChild(btn)
  })
  const note = document.createElement('p')
  note.textContent = '最小化後重新打開，數值仍保留'
  note.style.cssText = 'font-size:11px;color:#aaa;margin:0'
  el.append(
    Object.assign(document.createElement('h3'), { textContent: '🔢 計數器', style: 'margin:0;font-size:15px;color:#333' }),
    num, btns, note
  )
  wm.open({ id: `rc-counter-${winCount}`, title: 'React 計數器', content: el, width: 300, height: 260, ...pos })
}

/** Todo demo */
function openTodo() {
  if (!wm) return
  const pos = nextPos(); winCount++
  const el = document.createElement('div')
  el.style.cssText = 'padding:16px;font-family:Segoe UI,sans-serif;'
  const items: string[] = []
  el.innerHTML = `
    <h3 style="margin:0 0 12px;font-size:15px;color:#333">✅ 待辦清單</h3>
    <div style="display:flex;gap:8px;margin-bottom:12px">
      <input id="todo-input" placeholder="新增項目... (Enter)"
        style="flex:1;padding:6px 10px;border:1px solid #ddd;border-radius:4px;font-size:13px;outline:none">
      <button id="todo-add"
        style="padding:6px 14px;background:#61dafb;color:#222;border:none;border-radius:4px;cursor:pointer;font-size:13px;font-weight:600">
        新增
      </button>
    </div>
    <ul id="todo-list" style="list-style:none;padding:0;margin:0"></ul>`
  const input = el.querySelector('#todo-input') as HTMLInputElement
  const list  = el.querySelector('#todo-list')  as HTMLUListElement
  const renderList = () => {
    list.innerHTML = ''
    if (!items.length) {
      list.innerHTML = '<li style="color:#aaa;font-size:12px;padding:8px 0">尚無待辦項目</li>'
      return
    }
    items.forEach((item, i) => {
      const li = document.createElement('li')
      li.style.cssText = 'display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #f0f0f0;font-size:13px'
      li.innerHTML = `<span style="color:#333">• ${item}</span>`
      const del = document.createElement('button')
      del.textContent = '✕'
      del.style.cssText = 'background:none;border:none;cursor:pointer;color:#f44;font-size:16px'
      del.addEventListener('click', () => { items.splice(i, 1); renderList() })
      li.appendChild(del)
      list.appendChild(li)
    })
  }
  const addItem = () => { if (input.value.trim()) { items.push(input.value.trim()); input.value = ''; renderList() } }
  el.querySelector('#todo-add')!.addEventListener('click', addItem)
  input.addEventListener('keydown', (e: KeyboardEvent) => { if (e.key === 'Enter') addItem() })
  renderList()
  wm.open({ id: `rc-todo-${winCount}`, title: '待辦清單', content: el, width: 340, height: 380, ...pos })
}

/** Form demo */
function openForm() {
  if (!wm) return
  const pos = nextPos(); winCount++
  const el = document.createElement('div')
  el.style.cssText = 'padding:16px;font-family:Segoe UI,sans-serif;'
  el.innerHTML = `
    <h3 style="margin:0 0 14px;font-size:15px;color:#333">📋 員工資料表單</h3>
    <label style="display:block;font-size:12px;color:#666;font-weight:600;margin-bottom:4px">姓名 *</label>
    <input id="rc-name" placeholder="請輸入姓名"
      style="width:100%;padding:7px 10px;border:1px solid #ddd;border-radius:4px;font-size:13px;box-sizing:border-box;margin-bottom:10px;outline:none">
    <label style="display:block;font-size:12px;color:#666;font-weight:600;margin-bottom:4px">Email *</label>
    <input id="rc-email" type="email" placeholder="example@email.com"
      style="width:100%;padding:7px 10px;border:1px solid #ddd;border-radius:4px;font-size:13px;box-sizing:border-box;margin-bottom:10px;outline:none">
    <label style="display:block;font-size:12px;color:#666;font-weight:600;margin-bottom:4px">職位</label>
    <select id="rc-role"
      style="width:100%;padding:7px 10px;border:1px solid #ddd;border-radius:4px;font-size:13px;box-sizing:border-box;margin-bottom:14px">
      <option>工程師</option><option>設計師</option><option>主管</option>
    </select>
    <div id="rc-err" style="color:#f44;font-size:12px;display:none;margin-bottom:8px"></div>
    <button id="rc-submit"
      style="width:100%;padding:9px;background:#61dafb;color:#222;border:none;border-radius:4px;cursor:pointer;font-size:13px;font-weight:600">
      提交
    </button>
    <div id="rc-result" style="display:none;margin-top:12px;padding:10px;background:#f0f8ff;border-radius:4px;font-size:12px"></div>`
  el.querySelector('#rc-submit')!.addEventListener('click', () => {
    const name  = (el.querySelector('#rc-name')  as HTMLInputElement).value
    const email = (el.querySelector('#rc-email') as HTMLInputElement).value
    const err   = el.querySelector('#rc-err') as HTMLElement
    const result = el.querySelector('#rc-result') as HTMLElement
    if (!name || !email.includes('@')) {
      err.style.display = 'block'; err.textContent = '⚠ 請填寫姓名及有效的 Email'; return
    }
    err.style.display = 'none'
    result.style.display = 'block'
    result.innerHTML = `✅ 提交成功！<br>姓名: <strong>${name}</strong><br>Email: <strong>${email}</strong>`
  })
  wm.open({ id: `rc-form-${winCount}`, title: '員工資料表單', content: el, width: 360, height: 360, ...pos })
}

onMounted(() => initWM())
onUnmounted(() => wm?.destroy())

setCode([
  {
    name: 'useWindowManager.ts (React hook)',
    lang: 'typescript',
    code: `import { useState, useCallback, useEffect, useRef } from 'react';
import { WindowManager } from 'deskpane';

export function useWindowManager(opts) {
  const wmRef = useRef(null);
  if (!wmRef.current) wmRef.current = new WindowManager(opts);
  const wm = wmRef.current;
  const infoRef = useRef(new Map());
  const [windows, setWindows] = useState([]);

  const sync = useCallback(() => {
    setWindows(
      wm.getWindowIds().map(id => {
        const state = wm.getState(id);
        const bodyEl = wm.getBodyElement(id);
        if (!state || !bodyEl) return null;
        const info = infoRef.current.get(id);
        return { id, state: { ...state }, component: info?.component, bodyEl };
      }).filter(Boolean)
    );
  }, [wm]);

  useEffect(() => {
    ['window:opened','window:closed','window:focused',
     'window:minimized','window:maximized','window:restored']
      .forEach(ev => wm.events.on(ev, sync));
    return () => { wm.destroy(); };
  }, []);

  const openReactWindow = useCallback((config) => {
    infoRef.current.set(config.id, { component: config.component });
    return wm.open({ ...config, slotType: 'react', content: null });
  }, [wm]);

  return { wm, windows, openReactWindow,
    close: (id) => wm.close(id),
    minimize: (id) => wm.minimize(id),
    restore: (id) => wm.restore(id),
    focus: (id) => wm.focus(id),
  };
}`,
  },
  {
    name: 'App.tsx (createPortal)',
    lang: 'tsx',
    code: `import { createPortal } from 'react-dom';
import { useWindowManager } from './hooks/useWindowManager';
import CounterApp from './windows/CounterApp';

export default function App() {
  const { windows, openReactWindow, minimize, restore, focus } =
    useWindowManager({ throttleMs: 16 });

  return (
    <div>
      <button onClick={() =>
        openReactWindow({
          id: 'counter', title: 'Counter',
          component: CounterApp,
          width: 300, height: 260,
        })
      }>
        Open Counter
      </button>

      {/* Taskbar */}
      {windows.map(win => (
        <button key={win.id} onClick={() => {
          if (win.state.isMinimized) restore(win.id);
          else minimize(win.id);
        }}>
          {win.state.title}
        </button>
      ))}

      {/* Portals: inject React components into WM body DOM nodes */}
      {windows.map(win =>
        win.component
          ? createPortal(
              <win.component />,
              win.bodyEl,
              win.id
            )
          : null
      )}
    </div>
  );
}`,
  },
])
</script>

<style scoped>
.badge-react {
  background: rgba(97, 218, 251, 0.2);
  color: #61dafb;
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 700;
  display: inline-block;
}
</style>
