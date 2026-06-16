<template>
  <div class="page">
    <div class="page-badge">
      <span class="badge badge-blue">{{ t('jquery.badge') }}</span>
    </div>
    <h1>{{ t('jquery.h1') }}</h1>
    <p v-html="t('jquery.intro')"></p>

    <DemoViewport ref="viewport" @reset="reset">
      <template #controls>
        <button class="btn" @click="openForm">{{ t('jquery.openForm') }}</button>
        <button class="btn" @click="openSearch">{{ t('jquery.openSearch') }}</button>
        <button class="btn" @click="openAccordion">{{ t('jquery.openAccordion') }}</button>
        <button class="btn" @click="openTable">{{ t('jquery.openTable') }}</button>
      </template>
    </DemoViewport>

    <!-- Pattern 1 -->
    <h2>{{ t('jquery.h2Pattern1') }}</h2>
    <p v-html="t('jquery.pattern1Desc')"></p>

    <!-- Pattern 2 -->
    <h2>{{ t('jquery.h2Pattern2') }}</h2>
    <p v-html="t('jquery.pattern2Desc')"></p>

    <!-- Patterns Table -->
    <h2>{{ t('jquery.h2Patterns') }}</h2>
    <table class="api-table">
      <thead>
        <tr>
          <th>{{ t('jquery.th.pattern') }}</th>
          <th>{{ t('jquery.th.when') }}</th>
          <th>{{ t('jquery.th.code') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>{{ t('jquery.pat1.name') }}</td>
          <td>{{ t('jquery.pat1.when') }}</td>
          <td v-html="t('jquery.pat1.code')"></td>
        </tr>
        <tr>
          <td>{{ t('jquery.pat2.name') }}</td>
          <td>{{ t('jquery.pat2.when') }}</td>
          <td v-html="t('jquery.pat2.code')"></td>
        </tr>
        <tr>
          <td>{{ t('jquery.pat3.name') }}</td>
          <td>{{ t('jquery.pat3.when') }}</td>
          <td v-html="t('jquery.pat3.code')"></td>
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

/** Form window — vanilla DOM equivalent of jQuery form */
function openForm() {
  if (!wm) return
  const pos = nextPos(); winCount++
  const el = document.createElement('div')
  el.style.cssText = 'padding:16px; font-family:Segoe UI,sans-serif;'
  el.innerHTML = `
    <h3 style="margin:0 0 14px;font-size:14px;color:#333">聯絡表單</h3>
    <label style="display:block;font-size:12px;color:#666;font-weight:600;margin-bottom:4px">姓名 *</label>
    <input id="jq-name" type="text" placeholder="請輸入姓名"
      style="width:100%;padding:8px;border:1px solid #ddd;border-radius:4px;font-size:13px;box-sizing:border-box;margin-bottom:10px">
    <label style="display:block;font-size:12px;color:#666;font-weight:600;margin-bottom:4px">Email *</label>
    <input id="jq-email" type="email" placeholder="example@email.com"
      style="width:100%;padding:8px;border:1px solid #ddd;border-radius:4px;font-size:13px;box-sizing:border-box;margin-bottom:10px">
    <label style="display:block;font-size:12px;color:#666;font-weight:600;margin-bottom:4px">年齡</label>
    <input id="jq-age" type="number" placeholder="18"
      style="width:100%;padding:8px;border:1px solid #ddd;border-radius:4px;font-size:13px;box-sizing:border-box;margin-bottom:14px">
    <button id="jq-submit"
      style="background:#4a90e2;color:#fff;border:none;padding:8px 16px;border-radius:4px;cursor:pointer;font-size:13px">
      提交
    </button>
    <div id="jq-result" style="display:none;margin-top:12px;padding:10px;background:#f0f8ff;border-radius:4px;font-size:12px"></div>`
  el.querySelector('#jq-submit')!.addEventListener('click', () => {
    const name  = (el.querySelector('#jq-name')  as HTMLInputElement).value
    const email = (el.querySelector('#jq-email') as HTMLInputElement).value
    const result = el.querySelector('#jq-result') as HTMLElement
    if (!name || !email.includes('@')) {
      result.style.display = 'block'
      result.textContent = '⚠ 請填寫必填欄位（姓名及有效 Email）'
      return
    }
    result.style.display = 'block'
    result.innerHTML = `✅ 提交成功！<br>姓名: <strong>${name}</strong><br>Email: <strong>${email}</strong>`
  })
  wm.open({ id: `jq-form-${winCount}`, title: '表單驗證', content: el, width: 380, height: 340, ...pos })
}

/** Live search window */
function openSearch() {
  if (!wm) return
  const pos = nextPos(); winCount++
  const items = ['Apple','Banana','Cherry','Date','Elderberry','Fig','Grape','Honeydew','Kiwi','Lemon','Mango','Nectarine']
  const el = document.createElement('div')
  el.style.cssText = 'padding:16px; font-family:Segoe UI,sans-serif;'
  const input = document.createElement('input')
  input.type = 'text'
  input.placeholder = '搜尋水果...'
  input.style.cssText = 'width:100%;padding:8px;border:1px solid #ddd;border-radius:4px;font-size:13px;box-sizing:border-box;margin-bottom:8px'
  const count = document.createElement('div')
  count.style.cssText = 'font-size:11px;color:#888;margin-bottom:8px'
  count.textContent = `共 ${items.length} 筆`
  const list = document.createElement('ul')
  list.style.cssText = 'list-style:none;padding:0;margin:0;max-height:200px;overflow-y:auto'
  items.forEach(item => {
    const li = document.createElement('li')
    li.textContent = item
    li.dataset.item = item.toLowerCase()
    li.style.cssText = 'padding:8px 12px;border-bottom:1px solid #f0f0f0;font-size:13px;cursor:pointer'
    li.addEventListener('mouseenter', () => { li.style.background = '#f5f5f5' })
    li.addEventListener('mouseleave', () => { li.style.background = '' })
    list.appendChild(li)
  })
  input.addEventListener('input', () => {
    const q = input.value.toLowerCase()
    let visible = 0
    list.querySelectorAll('li').forEach(li => {
      const match = (li as HTMLElement).dataset.item!.includes(q)
      ;(li as HTMLElement).style.display = match ? '' : 'none'
      if (match) visible++
    })
    count.textContent = `顯示 ${visible} / ${items.length} 筆`
  })
  el.append(input, count, list)
  wm.open({ id: `jq-search-${winCount}`, title: '即時搜尋', content: el, width: 320, height: 320, ...pos })
}

/** Accordion window */
function openAccordion() {
  if (!wm) return
  const pos = nextPos(); winCount++
  const sections = [
    { title: '📦 什麼是 DeskPane？', body: 'DeskPane 是一套框架無關的虛擬桌面視窗管理引擎，支援拖曳、縮放、置頂、最小化、最大化等完整功能。' },
    { title: '🔗 如何與 jQuery 整合？', body: '載入 UMD bundle 後，使用 jQuery 建立視窗內容，並以 wm.getBodyElement(id) 取得視窗 body 元素附加外掛。' },
    { title: '📄 支援哪些框架？', body: '支援純 JavaScript、jQuery、Vue 3、React（規劃中）。核心完全框架無關。' },
    { title: '⚡ 如何安裝？', body: '複製 dist/ 資料夾，或以 script 標籤載入 deskpane.umd.js，無需任何建置步驟。' },
  ]
  const el = document.createElement('div')
  el.style.cssText = 'font-family:Segoe UI,sans-serif;'
  sections.forEach((sec, i) => {
    const header = document.createElement('div')
    header.style.cssText = `padding:12px 16px;background:${i===0?'#4a90e2':'#f8f8f8'};color:${i===0?'#fff':'#333'};cursor:pointer;border-bottom:1px solid #e0e0e0;font-size:13px;font-weight:600;display:flex;justify-content:space-between;align-items:center`
    header.innerHTML = `${sec.title} <span>${i===0?'▲':'▼'}</span>`
    const body = document.createElement('div')
    body.style.cssText = `padding:${i===0?'12px 16px':'0 16px'};font-size:13px;line-height:1.6;color:#555;background:#fff;border-bottom:1px solid #e0e0e0;overflow:hidden;max-height:${i===0?'200px':'0'};transition:max-height 0.3s ease,padding 0.3s ease`
    body.textContent = sec.body
    header.addEventListener('click', () => {
      const isOpen = body.style.maxHeight !== '0px'
      el.querySelectorAll<HTMLElement>('[data-acc-body]').forEach(b => { b.style.maxHeight = '0'; b.style.padding = '0 16px' })
      el.querySelectorAll<HTMLElement>('[data-acc-header]').forEach(h => {
        h.style.background = '#f8f8f8'; h.style.color = '#333'
        const icon = h.querySelector('span'); if (icon) icon.textContent = '▼'
      })
      if (!isOpen) {
        body.style.maxHeight = '200px'; body.style.padding = '12px 16px'
        header.style.background = '#4a90e2'; header.style.color = '#fff'
        const icon = header.querySelector('span'); if (icon) icon.textContent = '▲'
      }
    })
    header.dataset.accHeader = ''
    body.dataset.accBody = ''
    el.append(header, body)
  })
  wm.open({ id: `jq-accord-${winCount}`, title: '摺疊面板', content: el, width: 420, height: 320, ...pos })
}

/** Data table window */
function openTable() {
  if (!wm) return
  const pos = nextPos(); winCount++
  const data = [
    { name: '視窗管理器', version: '0.1.0', size: '24 KB', type: 'ES Module' },
    { name: 'UMD Bundle',  version: '0.1.0', size: '26 KB', type: 'Script Tag' },
    { name: 'Vue Adapter', version: '0.1.0', size: '2 KB',  type: 'Vue 3' },
    { name: 'TypeScript 型別', version: '0.1.0', size: '4 KB', type: '宣告檔' },
    { name: 'DOM Renderer', version: '0.1.0', size: '8 KB', type: '核心' },
  ]
  let counter = 0
  const el = document.createElement('div')
  el.style.cssText = 'font-family:Segoe UI,sans-serif;'
  const toolbar = document.createElement('div')
  toolbar.style.cssText = 'padding:8px 12px;display:flex;gap:8px;background:#f8f8f8;border-bottom:1px solid #e0e0e0;align-items:center'
  const addBtn = document.createElement('button')
  addBtn.textContent = '+ 新增列'
  addBtn.style.cssText = 'background:#4a90e2;color:#fff;border:none;padding:4px 10px;border-radius:4px;cursor:pointer;font-size:12px'
  const filterInput = document.createElement('input')
  filterInput.type = 'text'
  filterInput.placeholder = '篩選...'
  filterInput.style.cssText = 'flex:1;padding:4px 8px;border:1px solid #ddd;border-radius:4px;font-size:12px'
  toolbar.append(addBtn, filterInput)

  const table = document.createElement('table')
  table.style.cssText = 'width:100%;border-collapse:collapse;font-size:12px'
  const thead = document.createElement('thead')
  thead.innerHTML = `<tr>${['名稱','版本','大小','類型'].map(h => `<th style="padding:8px 12px;background:#4a90e2;color:#fff;text-align:left;font-weight:600">${h}</th>`).join('')}</tr>`
  const tbody = document.createElement('tbody')

  function renderRows(rows: typeof data) {
    tbody.innerHTML = ''
    rows.forEach((row, i) => {
      const tr = document.createElement('tr')
      tr.style.background = i % 2 === 0 ? '#fff' : '#f9f9f9'
      tr.innerHTML = [row.name, row.version, row.size, row.type].map(v => `<td style="padding:8px 12px;border-bottom:1px solid #eee">${v}</td>`).join('')
      tbody.appendChild(tr)
    })
  }

  renderRows(data)
  table.append(thead, tbody)

  addBtn.addEventListener('click', () => {
    counter++
    data.push({ name: `模組 ${counter}`, version: '0.x.0', size: `${Math.floor(Math.random()*20)+1} KB`, type: '自訂' })
    renderRows(data)
  })
  filterInput.addEventListener('input', () => {
    const q = filterInput.value.toLowerCase()
    const rows = q ? data.filter(r => Object.values(r).some(v => v.toLowerCase().includes(q))) : data
    renderRows(rows)
  })

  el.append(toolbar, table)
  wm.open({ id: `jq-table-${winCount}`, title: '資料表格', content: el, width: 500, height: 300, ...pos })
}

onMounted(() => {
  initWM()
  setCode([
    {
      name: 'index.html (UMD + jQuery setup)',
      lang: 'html',
      code: `<!-- 1. Load DeskPane UMD bundle -->
<script src="dist/deskpane.umd.js"><\/script>
<!-- 2. Load jQuery -->
<script src="https://code.jquery.com/jquery-3.7.1.min.js"><\/script>

<script>
  const { WindowManager } = DeskPane;
  const wm = new WindowManager({ throttleMs: 16 });

  // 3. Create window content with jQuery
  const $form = $('<div>').css('padding', '16px').append(
    $('<input type="text" placeholder="Name">'),
    $('<button>Submit<\/button>').on('click', function () {
      alert($form.find('input').val());
    })
  );

  // 4. Open window — pass unwrapped DOM node
  wm.open({
    id: 'form-win',
    title: 'jQuery Form',
    content: $form[0],   // ← $el[0] unwraps to HTMLElement
    width: 400,
    height: 300
  });
<\/script>`,
    },
    {
      name: 'getBodyElement.js (plugin init pattern)',
      lang: 'javascript',
      code: `// Open window with no content first
wm.open({ id: 'grid', title: 'Data Grid', content: null });

// Get the window body element and attach a jQuery plugin
const $body = $(wm.getBodyElement('grid'));
$body.css('padding', '0');

// Example: initialise a hypothetical jQuery grid plugin
// $body.wijgrid({ data: myData, columns: [...] });
// $body.DataTable({ data: rows, columns: cols });

// Or use window:opened event for deferred init
wm.events.on('window:opened', function ({ id }) {
  if (id === 'my-chart') {
    $(wm.getBodyElement(id)).myChartPlugin({ color: 'blue' });
  }
});`,
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
}
.btn:hover { background: var(--color-primary-hover); }
.badge-blue { background: rgba(0,119,190,0.15); color: #0077be; }
</style>
