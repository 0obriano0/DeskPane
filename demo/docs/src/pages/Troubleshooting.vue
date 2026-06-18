<template>
  <div class="page">
    <div class="page-badge">
      <span class="badge badge-blue">{{ copy.badge }}</span>
    </div>
    <h1>{{ copy.title }}</h1>
    <p class="lead">{{ copy.lead }}</p>

    <section class="issue-list">
      <article v-for="item in copy.items" :key="item.title" class="issue">
        <h2>{{ item.title }}</h2>
        <p v-html="item.symptom"></p>
        <table class="api-table">
          <tbody>
            <tr>
              <th>{{ copy.cause }}</th>
              <td v-html="item.cause"></td>
            </tr>
            <tr>
              <th>{{ copy.fix }}</th>
              <td v-html="item.fix"></td>
            </tr>
          </tbody>
        </table>
      </article>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useDocCode } from '../composables/useDocCode'
import { useLocale } from '../composables/useLocale'

const { setCode } = useDocCode()
const { locale } = useLocale()

const copy = computed(() => {
  if (locale.value === 'zh-TW') {
    return {
      badge: '疑難排查',
      title: '常見整合問題',
      lead: '這些是 DeskPane 在 Vue、React、Vite、GitHub Pages 與手動 CSS override 中最常遇到的問題。先檢查載入順序與 framework portal/teleport target，通常能快速定位。',
      cause: '原因',
      fix: '建議修正',
      items: [
        {
          title: 'Vite dev 顯示 CSS default export 錯誤',
          symptom: '<code>deskpane-desktop.css does not provide an export named default</code>',
          cause: 'Vite 會先攔截一般 CSS import，但 DeskPane runtime 需要把 core CSS 當成字串注入。',
          fix: '在 demo 或本機套件開發時使用 DeskPane 的 raw CSS Vite plugin；app 自己手動 import 的 DeskPane CSS 仍走正常 CSS pipeline。',
        },
        {
          title: '視窗透明或看起來點擊穿透',
          symptom: '視窗下半部透明、桌面 icon 可見，或視窗內容無法點擊。',
          cause: 'runtime 注入的 core CSS 可能晚於 app override，或 <code>.dp-window</code> 背景依賴 <code>.dp-body</code> 撐滿高度。',
          fix: 'bundler manual import 模式請設定 <code>injectStyles:false</code>，並確認 <code>.dp-window</code>、<code>.dp-header</code>、<code>.dp-body</code> 有可靠 background 與 <code>pointer-events:auto</code>。',
        },
        {
          title: 'Vue / React workspace 切換後內容黑掉',
          symptom: '切換工作區後 window frame 還在，但 Teleport / Portal 內容消失或掛到錯誤視窗。',
          cause: '多工作區使用相同 window id，或 framework state 沒有跟著 <code>workspace:switched</code> 事件同步。',
          fix: 'window id 要包含 workspace scope，例如 <code>ws-2::counter</code>；portal/teleport key 也要包含 <code>workspaceId:id</code>。',
        },
        {
          title: 'TaskView 預覽空白或點到已隱藏工作區',
          symptom: '縮略圖沒有內容，或關閉 TaskView 後仍然攔截點擊。',
          cause: 'inactive workspace 的 <code>hidden</code> / <code>inert</code> 屬性被 clone 到快照，或 overlay 關閉時只改 opacity。',
          fix: 'clone 快照後清除 <code>hidden</code> / <code>inert</code> / <code>aria-hidden</code>；TaskView 關閉時應直接設回 <code>hidden=true</code>。',
        },
        {
          title: '手動載入 CSS 仍被 runtime CSS 覆蓋',
          symptom: '專案端已 import DeskPane CSS，但 app-level override 偶爾失效。',
          cause: '同時使用 manual import 與 runtime inject，導致 style tag 後插。',
          fix: '在 <code>Desktop</code>、<code>WorkspaceManager</code>、<code>WindowManager</code> 統一使用 <code>injectStyles:false</code>，或只使用 runtime inject 不手動 import。',
        },
      ],
    }
  }

  return {
    badge: 'Troubleshooting',
    title: 'Common Integration Issues',
    lead: 'These are the DeskPane integration issues most often seen with Vue, React, Vite, GitHub Pages, and app-level CSS overrides. Start by checking style load order and framework portal/teleport targets.',
    cause: 'Cause',
    fix: 'Recommended fix',
    items: [
      {
        title: 'Vite dev reports a CSS default export error',
        symptom: '<code>deskpane-desktop.css does not provide an export named default</code>',
        cause: 'Vite intercepts normal CSS imports before library code can consume DeskPane core CSS as a string.',
        fix: 'Use the DeskPane raw CSS Vite plugin while developing against source. CSS imported by the host app should still use the normal Vite CSS pipeline.',
      },
      {
        title: 'Window background is transparent or clicks pass through',
        symptom: 'The lower part of a window is transparent, desktop icons show through, or window content cannot be clicked.',
        cause: 'Runtime core CSS may be injected after app overrides, or <code>.dp-window</code> background depends on <code>.dp-body</code> filling the entire frame.',
        fix: 'In bundler manual-import mode, set <code>injectStyles:false</code> and ensure <code>.dp-window</code>, <code>.dp-header</code>, and <code>.dp-body</code> have reliable background and <code>pointer-events:auto</code>.',
      },
      {
        title: 'Vue / React content goes black after switching workspaces',
        symptom: 'The window frame remains visible, but Teleport / Portal content disappears or mounts into the wrong window.',
        cause: 'Multiple workspaces reuse the same raw window id, or framework state is not synchronized after <code>workspace:switched</code>.',
        fix: 'Scope window ids by workspace, for example <code>ws-2::counter</code>; include <code>workspaceId:id</code> in portal/teleport keys.',
      },
      {
        title: 'TaskView thumbnails are blank or hidden workspaces receive clicks',
        symptom: 'Workspace thumbnails have no content, or the TaskView overlay still intercepts events after closing.',
        cause: 'Inactive workspace <code>hidden</code> / <code>inert</code> attributes were cloned into the snapshot, or the overlay only changed opacity when closing.',
        fix: 'After cloning a workspace, clear <code>hidden</code> / <code>inert</code> / <code>aria-hidden</code>; when TaskView closes, set <code>hidden=true</code>.',
      },
      {
        title: 'Manual CSS import is still overridden by runtime CSS',
        symptom: 'The app imports DeskPane CSS, but app-level overrides sometimes lose.',
        cause: 'Manual CSS import and runtime inject are both enabled, so runtime style tags may be inserted later.',
        fix: 'Use <code>injectStyles:false</code> consistently on <code>Desktop</code>, <code>WorkspaceManager</code>, and <code>WindowManager</code>, or use runtime injection only.',
      },
    ],
  }
})

onMounted(() => {
  setCode([
    {
      name: 'manual-css.ts',
      lang: 'typescript',
      code: `import 'deskpane/dist/styles/deskpane.css'
import 'deskpane/dist/styles/deskpane-desktop.css'
import 'deskpane/dist/styles/deskpane-workspace.css'
import 'deskpane/dist/styles/deskpane-taskview.css'

import { Desktop } from 'deskpane/desktop'
import { WorkspaceManager } from 'deskpane/workspace'

const desktop = new Desktop({
  container: document.getElementById('root')!,
  injectStyles: false,
  dock: { position: 'bottom' },
})

const workspaces = new WorkspaceManager(desktop.getElement(), {
  injectStyles: false,
  windowManagerOptions: {
    isolated: true,
    snap: true,
    injectStyles: false,
  },
})`,
    },
    {
      name: 'workspace-ids.ts',
      lang: 'typescript',
      code: `import {
  createWorkspaceWindowId,
  getAppIdFromWorkspaceWindowId,
} from 'deskpane/workspace'

const workspaceId = workspaceManager.current!.id
const appId = 'counter'
const windowId = createWorkspaceWindowId(workspaceId, appId)

wm.open({
  id: windowId,
  title: 'Counter',
  props: { appId },
})

// Use appId for catalog lookup, but scoped id for real windows.
const rawAppId = getAppIdFromWorkspaceWindowId(windowId)`,
    },
  ])
})
</script>

<style scoped>
.page {
  max-width: 860px;
}

.lead {
  max-width: 780px;
  color: #536577;
}

.issue {
  border-top: 1px solid var(--color-border);
  padding-top: 8px;
}

.issue h2 {
  margin-top: 18px;
}

.api-table th {
  width: 132px;
  vertical-align: top;
}
</style>
