# DeskPane — 專案狀態（AI 快查版）

> 最後更新：2026-06-16 ｜ 備份：`bak/PROJECT_STATUS.2026-05-26.md`
> 此文件為 AI 輔助開發設計，優先說明「現在是什麼」，歷史細節見備份。

---

## 1. 專案一句話

**框架無關的網頁虛擬桌面視窗管理引擎。**  
核心：視窗生命週期 + 拖曳縮放 + Snap 吸附 + 主題系統。  
擴充：Desktop 桌面模組（圖示 + Dock + itemsSource 資料繫結）、BorderLayout 佈局、Vue3/React 包裝。

- 授權：Apache-2.0 © 2026 Brian Cheng
- 路徑：`D:\Dropbox\新ERP框架開發\DeskPane\`（Dropbox 同步，重裝後直接開啟）

---

## 2. 已完成功能清單

| 功能 | 狀態 | 主要檔案 |
|------|------|---------|
| 視窗管理核心（open/close/min/max/focus/snap） | ✅ | `src/core/WindowManager.ts` |
| 拖曳 + 縮放 + Snap 吸附（拖曳 & 縮放）+ Snap 間距設定 | ✅ | `src/core/DragResizeHandler.ts`, `SnapHelper.ts` |
| `resizable: false` — 禁用放大按鈕 + 邊框縮放（固定大小視窗） | ✅ | `src/core/types.ts`, `DOMRenderer.ts`, `DragResizeHandler.ts`, `WindowManager.ts` |
| DOM 渲染 + CSS 變數主題系統 | ✅ | `src/renderers/DOMRenderer.ts` |
| CSS 單一來源（Single Source of Truth）— core / desktop / layout / workspace / taskview | ✅ | `src/styles/*.css` |
| **穩定 CSS 載入策略** — 可關閉 runtime inject、重複偵測、runtime style 前插，避免覆蓋 app override | ✅ | `src/styles/inject.ts`, `DOMRenderer.ts`, `desktop/styles.ts`, `workspace/*` |
| Rollup rawCss() plugin — build time 將 `.css` 轉為 JS 字串內嵌 | ✅ | `rollup.lib.config.mjs` |
| light.css / dark.css / medieval-pixel.css（Core + Desktop 變數） | ✅ | `src/themes/*.css` |
| `setTheme()` 工具函式 | ✅ | `src/themes/setTheme.ts` |
| BorderLayout（5 區域 + 折疊 Strip） | ✅ | `src/layout/BorderLayout.ts` |
| Panel（可折疊標題面板） | ✅ | `src/layout/Panel.ts` |
| Desktop 桌面模組 | ✅ | `src/desktop/` |
| **DesktopCollectionView / itemsSource** — Wijmo-style icon data binding、`refresh()`、`add/remove/update()`、`desktop.events` | ✅ | `src/desktop/DesktopCollectionView.ts`, `src/desktop/Desktop.ts` |
| Vue 3 Composable | ✅ | `src/adapters/vue/useWindowManager.ts` |
| **Vue 3 宣告式元件** — `DpDesktop` / `DpDesktopIcon` / `DpWindowManager` / `DpWindow`，支援 `v-model:items` / `v-model:open` | ✅ | `src/adapters/vue/components.ts`, `demo/vue/src/DeclarativeApp.vue` |
| React 18 Hook | ✅ | `src/adapters/react/useWindowManager.ts` |
| Demo（vanilla / jQuery / Vue / React / Desktop / Theme Editor / Layout） | ✅ | `demo/`，GitHub Pages artifact 由 `npm run build:pages` 產生 |
| Theme Editor — Tab 3 完整桌面預覽 + 雙 CSS 即時注入（core + desktop 同時） | ✅ | `demo/theme-editor/index.html` |
| Dock 毛玻璃效果（`--dp-dock-backdrop-filter`）— `overflow:clip` 修正讓視窗可穿透顯示 | ✅ | `src/styles/deskpane-desktop.css`, `deskpane.css`, `desktop/Desktop.ts` |
| Docs 開發手冊（Vue3 SPA，i18n EN/zh-TW，17 頁，含 WindowConfig 完整選項表） | ✅ | `demo/docs/` |
| WorkspaceManager — 多工作區切換（獨立容器、左右滑入動畫、指示點） | ✅ | `src/workspace/WorkspaceManager.ts` |
| SessionManager — 視窗狀態序列化 / 還原（支援單 WM 或多工作區） | ✅ | `src/session/SessionManager.ts` |
| **TaskView** — 虛擬桌面切換覆蓋層（DOM clone 快照 + 新增/刪除/Escape，獨立 class） | ✅ | `src/workspace/TaskView.ts` |
| **TaskView Dock 按鈕管理** — 建立時傳入 `dock`，自動在最左側插入按鈕；`showButton: false` 可關閉但 `open()` 仍可呼叫 | ✅ | `src/workspace/TaskView.ts`, `src/workspace/types.ts` |
| **Dock hover 縮略圖預覽** — 滑鼠懸停 300ms 後顯示視窗 DOM clone 縮圖（240×150，比例縮放）；拖曳重排或多視窗後事件自動重綁 | ✅ | `src/desktop/Desktop.ts`, `src/desktop/Dock.ts` |
| **Dock.addItemAt(item, index)** — 在指定位置插入 item（0 = 最左）；`Dock.onRender(cb)` 每次重建 DOM 後觸發回呼 | ✅ | `src/desktop/Dock.ts` |
| **src 重構整理** — 提取 `iconUtils.ts` 共用 `appendIconContent()`，消除 `Dock.ts`/`DesktopIcon.ts` 重複 icon 邏輯；修正 `workspace/types.ts` 自我 import；簡化 `Desktop.ts` snap guide 嵌套 null check | ✅ | `src/desktop/iconUtils.ts`, `Dock.ts`, `DesktopIcon.ts`, `Desktop.ts`, `workspace/types.ts` |
| **拖曳邊界保留（dragEdgeMargin）** — 視窗拖曳到容器邊緣時至少保留 60px（可設定）在容器內，確保使用者可抓回；Desktop 模式自動讀取 `--dp-dock-inset-*` CSS 變數，底部邊界加計 Dock 高度，視窗無法沉入 Dock 遮蔽區 | ✅ | `src/core/DragResizeHandler.ts` |
| **縮放邊界保留** — 所有 4 個縮放方向（N/S/E/W）皆套用邊界限制：向外延伸（S/E）無限制，向內縮小不超過對側拖曳邊界；N/W 移動端加計上/左邊界，防止把手消失在容器外 | ✅ | `src/core/DragResizeHandler.ts` |
| **最小化 restore 修正** — 修正 `minimize()` 未清除 `isActive`，導致單一視窗最小化後 `focus()` 提前返回、無法 restore 的 bug | ✅ | `src/core/WindowManager.ts` |
| **子視窗管理（parentId / modal）** — `WindowConfig.parentId` 指定父視窗，子視窗 z-index 永遠高於父；`modal:true` = 父視窗加半透明遮罩，點遮罩時子視窗 shake 提示；子視窗隨父最小化/restore；關閉父視窗時 cascade 關閉子視窗；子視窗不在 Dock 獨立顯示；新增 `shake(id)` / `getChildIds(id)` / `getRootWindowId(id)` API；新增事件 `window:child-opened` / `window:child-closed` | ✅ | `src/core/types.ts`, `WindowManager.ts`, `DOMRenderer.ts`, `deskpane.css` |
| **Dock 群組縮略圖預覽（Windows 風格）** — 父視窗 Dock item hover 280ms 後顯示父+所有子視窗縮略圖卡片列；每張卡片有標題 + × 關閉鈕（hover 才顯示）；Sticky hover（滑鼠移入 popup 不消失）；modal 安全：關閉父視窗前若有 modal 子視窗，shake 子視窗本體並搖晃卡片提示；`syncExisting` 補傳 `parentId` 修正子視窗過濾 bug | ✅ | `src/desktop/Desktop.ts`, `src/desktop/types.ts`, `src/styles/deskpane-desktop.css` |
| **專案改名 DeskPane → DeskPane** — package.json name、UMD global、CSS class prefix（`.dp-*`）、CSS vars（`--dp-*`）、dist 檔名全部更新 | ✅ | 85 個檔案更新 |
| **npm 發佈 deskpane@0.1.1** — 整合 GitHub Actions OIDC Trusted Publisher 自動發佈 | ✅ | npmjs.com/package/deskpane |
| **GitHub Repo 改名** — remote URL 更新為 `https://github.com/0obriano0/DeskPane.git` | ✅ | |
| **git tag v0.1.0** — 第一個 Release 標籤 | ✅ | |
| **README 改版** — npm/downloads/license/bundle size 四個 badge；Why DeskPane；Features 依模組分組；CDN/unpkg 安裝說明；Roadmap；Contributing | ✅ | `README.md` |
| **Demo 全部重建**（vanilla/jquery/vue/react）— 改成全螢幕虛擬桌面風格，對齊 demo/desktop；Vue 用 Teleport+KeepAlive；React 用 createPortal | ✅ | `demo/vanilla/`, `demo/jquery/`, `demo/vue/`, `demo/react/` |
| **Vue/React Workspace demo 修正** — bundler manual CSS import + `injectStyles:false`；Portal/Teleport state 加入 `workspaceId` key，切換工作區時同步 active workspace 視窗 | ✅ | `demo/vue/`, `demo/react/` |
| **docs-internal 文件** — 發佈流程 + Workspace/TaskView/Vue Teleport 踩雷紀錄 | ✅ | `docs-internal/` |

**尚未實作：**
- [ ] CDN 發佈（jsDelivr / unpkg）

---

## 3. 目錄結構（精簡版）

```
DeskPane/
├── src/
│   ├── index.ts                    ← Core 公開 Entry Point
│   ├── css.d.ts                    ← TypeScript module declaration（*.css → string）
│   ├── core/
│   │   ├── WindowManager.ts        ← 視窗生命週期（含 Snap 引導線、RWD Clamp）
│   │   ├── DragResizeHandler.ts    ← 拖曳/縮放（snapFn callback、throttle）
│   │   ├── SnapHelper.ts           ← Snap 吸附純函式（零 DOM 依賴）
│   │   ├── EventBus.ts
│   │   └── types.ts
│   ├── renderers/
│   │   └── DOMRenderer.ts          ← DOM 結構 + CSS 注入（import BASE_CSS from styles/deskpane.css）
│   ├── styles/
│   │   ├── deskpane.css          ← Core CSS 單一來源（視窗結構/Snap/Dock 基礎樣式）
│   │   ├── deskpane-desktop.css       ← Desktop CSS 單一來源（桌面/Dock/Icon 樣式）
│   │   ├── deskpane-layout.css        ← Layout CSS 單一來源（BorderLayout/Panel 樣式）
│   │   ├── deskpane-workspace.css     ← Workspace CSS 單一來源（工作區容器/滑入動畫/指示點）
│   │   ├── deskpane-taskview.css      ← TaskView CSS 單一來源（覆蓋層/卡片/縮略圖/按鈕）
│   │   └── inject.ts                  ← runtime CSS 注入工具（重複偵測 + 前插策略）
│   ├── themes/
│   │   ├── light.css               ← 亮色（Core 15 vars + Desktop 8 vars）
│   │   ├── dark.css                ← 暗色（Core 15 vars + Desktop 8 vars）
│   │   └── setTheme.ts             ← setTheme(preset, options?)
│   ├── layout/
│   │   ├── BorderLayout.ts         ← 東西南北中五區域、可拖曳分割線、巢狀遞迴
│   │   ├── Panel.ts                ← 可折疊標題+內容面板（data-panel 宣告式）
│   │   └── styles.ts               ← injectLayoutStyles() / getLayoutCSS()（import from deskpane-layout.css）
│   ├── workspace/
│   │   ├── index.ts                ← Workspace 公開 Entry Point（同時 re-export SessionManager）
│   │   ├── WorkspaceManager.ts     ← 多工作區管理（addWorkspace/switchTo/左右滑入動畫/指示點）
│   │   ├── TaskView.ts             ← 虛擬桌面切換覆蓋層（DOM clone 縮略圖/新增/刪除/Escape）
│   │   └── types.ts                ← WorkspaceConfig / WorkspaceState / WorkspaceManagerOptions / TaskViewOptions
│   ├── session/
│   │   ├── SessionManager.ts       ← serialize / restore（支援單 WM 或 WorkspaceManager 兩種模式）
│   │   └── types.ts                ← WindowSnapshot / WorkspaceSnapshot / SessionSnapshot / AppRegistry
│   ├── desktop/
│   │   ├── index.ts                ← Desktop 公開 Entry Point
│   │   ├── Desktop.ts              ← 桌面主容器（icon 拖放、Snap、Sentinel、RWD）
│   │   ├── Dock.ts                 ← 快速啟動 Dock（HTML5 D&D 排序、active 指示、onRender 回呼）
│   │   ├── DesktopIcon.ts          ← 桌面圖示（dragThreshold、snapFn、localStorage）
│   │   ├── iconUtils.ts            ← appendIconContent() 共用 icon 類型判斷（URL/SVG/emoji）
│   │   ├── styles.ts               ← injectDesktopStyles()（import DESKTOP_CSS from styles/deskpane-desktop.css）
│   │   └── types.ts                ← DesktopConfig / DockConfig / DesktopIconConfig
│   └── adapters/
│       ├── vue/useWindowManager.ts ← Vue 3 Composable
│       └── react/useWindowManager.ts ← React Hook（useRef + useState + useEffect）
│
├── dist/                           ← rollup build:lib 輸出（勿手動編輯）
│   ├── deskpane.es.js / .min.js
│   ├── deskpane.umd.js / .min.js
│   ├── deskpane-desktop.es.js / .min.js
│   ├── deskpane-desktop.umd.js / .min.js
│   ├── deskpane-workspace.es.js / .min.js
│   ├── deskpane-workspace.umd.js / .min.js
│   ├── index.d.ts / desktop.d.ts / workspace.d.ts
│   ├── themes/light.css, dark.css, medieval-pixel.css  ← build-themes.mjs 從 src/themes/ 複製
│   ├── themes/assets/medieval-pixel/  ← Medieval Pixel 主題素材
│   └── styles/
│       ├── deskpane.css          ← build-themes.mjs 從 src/styles/ 複製（可直接 <link>）
│       ├── deskpane-desktop.css       ← build-themes.mjs 從 src/styles/ 複製（可直接 <link>）
│       ├── deskpane-layout.css        ← build-themes.mjs 從 src/styles/ 複製（可直接 <link>）
│       └── deskpane-workspace.css     ← build-themes.mjs 從 src/styles/ 複製（可直接 <link>）
│       └── deskpane-taskview.css      ← build-themes.mjs 從 src/styles/ 複製（可直接 <link>）
│
├── demo/
│   ├── index.html                  ← Demo 首頁
│   ├── shared/base.css             ← 共用 reset + header 樣式
│   ├── vanilla/index.html
│   ├── jquery/index.html
│   ├── desktop/index.html          ← 中世紀像素風格完整虛擬桌面體驗
│   ├── theme-editor/index.html     ← 🎨 Theme Editor（Tab1 Core / Tab2 Desktop / Tab3 完整桌面預覽+CSS 即時注入）
│   ├── layout/index.html
│   ├── vue/                        ← 獨立 Vite 專案（port 3001）
│   ├── react/                      ← 獨立 Vite 專案（port 3002）
│   └── docs/                       ← 開發手冊 Vite SPA（port 3002）
│
├── scripts/
│   ├── build-themes.mjs            ← 複製 src/themes/ → dist/themes/ + src/styles/ → dist/styles/ + demo/
│   ├── clean.mjs                   ← 清除 dist/（含 Dropbox EBUSY retry）
│   └── pack-release.mjs            ← 打包 release/ 交付物
│
├── bak/                            ← 備份（不 commit）
├── rollup.lib.config.mjs
├── tsconfig.json / tsconfig.build.json
└── package.json
```

---

## 4. CSS 自訂屬性（完整 30 個）

### Core 視窗（15 個）— 來源：`src/styles/deskpane.css`

| 變數 | 說明 | CSS 預設值 |
|------|------|-----------|
| `--dp-window-border` | 視窗外框顏色 | `#d0d0d0` |
| `--dp-window-border-active` | 作用中外框顏色 | `#b0b8c8` |
| `--dp-window-shadow` | 視窗陰影 | `0 4px 24px rgba(0,0,0,0.18)` |
| `--dp-window-shadow-active` | 作用中陰影 | `0 8px 36px rgba(0,0,0,0.28)` |
| `--dp-window-bg` | 視窗本體背景（避免 body 未撐滿時透明） | `var(--dp-window-body-bg, #ffffff)` |
| `--dp-window-header-bg` | 標題列背景 | `#f5f5f5` |
| `--dp-window-header-border` | 標題列底線 | `#e0e0e0` |
| `--dp-window-title-color` | 標題文字色 | `#333333` |
| `--dp-window-btn-color` | 按鈕圖示色 | `#555555` |
| `--dp-window-btn-hover-bg` | 按鈕 hover 背景 | `#e0e0e0` |
| `--dp-window-btn-close-hover-bg` | 關閉按鈕 hover 背景 | `#ff5f57` |
| `--dp-window-btn-close-hover-color` | 關閉按鈕 hover 文字 | `#ffffff` |
| `--dp-window-body-bg` | 視窗內容背景 | `#ffffff` |
| `--dp-window-body-color` | 視窗內容文字 | `#222222` |
| `--dp-snap-guide-color` | Snap 引導線 | `rgba(0,120,255,0.55)` |

### Layout 模組（7 個）— 來源：`src/styles/deskpane-layout.css`

| 變數 | 說明 | CSS 預設值 |
|------|------|-----------|
| `--dp-layout-header-bg` | 面板標題列背景 | `#f5f5f5` |
| `--dp-layout-header-border` | 面板標題列底線 | `#e0e0e0` |
| `--dp-layout-title-color` | 面板標題文字色 | `#333` |
| `--dp-layout-btn-color` | 面板按鈕圖示色 | `#555` |
| `--dp-layout-btn-hover-bg` | 面板按鈕 hover 背景 | `#e0e0e0` |
| `--dp-layout-splitter-bg` | 分隔條顏色 | `#d0d0d0` |
| `--dp-layout-splitter-active` | 分隔條拖動顏色 | `#b0b8c8` |

### Desktop 模組（8 個）— 來源：`src/styles/deskpane-desktop.css`

| 變數 | 說明 | CSS 預設值 |
|------|------|-----------|
| `--dp-desktop-bg` | 桌面背景（支援 gradient） | `linear-gradient(135deg,#1a2a4a,#0d1b2a)` |
| `--dp-desktop-icon-text` | 桌面圖示文字 | `#fff` |
| `--dp-desktop-icon-hover-bg` | 圖示 hover 背景 | `rgba(255,255,255,0.15)` |
| `--dp-dock-bg` | Dock 背景（支援 rgba） | `rgba(20,30,50,0.75)` |
| `--dp-dock-backdrop-filter` | Dock 毛玻璃模糊（`blur(Npx)` 或 `none`） | `blur(14px)` |
| `--dp-dock-border` | Dock 邊框（支援 rgba） | `rgba(255,255,255,0.1)` |
| `--dp-dock-item-hover-bg` | Dock 項目 hover 背景 | `rgba(255,255,255,0.12)` |
| `--dp-font` | 全域字體 | `system-ui,-apple-system,sans-serif` |

> **注意**：`rgba` / `linear-gradient` / `blur()` 型別的變數必須用 `type: 'text'`（非 color picker），否則值會被截掉。

---

## 5. 核心 API 速查

```typescript
// 建立視窗管理器
const wm = new WindowManager({
  container?: HTMLElement,     // 預設 document.body
  isolated?: boolean,          // true = 限制在容器內（position:absolute）
  throttleMs?: number,         // 預設 16ms
  snap?: boolean,              // 預設 true
  snapThreshold?: number,      // 預設 20px
  snapGap?: number,            // 預設 0px；視窗與視窗間距（容器邊緣不受影響）
})

// 開窗（WindowConfig）
wm.open(config: WindowConfig)  // id 存在則 restore+focus
// config: { id, title, icon?, label?, content, x?, y?, width?, height?, resizable? }
// icon:    emoji 或圖片 URL，供 Dock 自動同步顯示
// label:   Dock 顯示用短標籤；有值時優先於 title，無值則 fallback 到 title
// resizable: false → 禁用放大按鈕 + 邊框拖曳縮放（固定大小視窗模式）
wm.close(id) / wm.minimize(id) / wm.maximize(id) / wm.restore(id)
wm.focus(id) / wm.setTitle(id, title)
wm.setSnapGap(gap)             // 動態更新 Snap 間距（px）
wm.getState(id) / wm.getBodyElement(id) / wm.getWindowIds()
wm.destroy()
wm.events.on(event, callback)  // window:opened|closed|focused|minimized|maximized|restored|moved|resized

// 主題切換
setTheme('dark' | 'light', { basePath?: string, linkId?: string })
// ESM: import { setTheme } from 'deskpane'
// UMD: DeskPane.setTheme(...)

// Desktop 模組
const desktop = new Desktop({ container, dock: { position: 'bottom', ... }, ... })
const wm = new WindowManager({ container: desktop.getElement(), isolated: true })
desktop.addIcon({ id, label, icon, action })

// Dock 與 WindowManager 自動同步（零 config 即可）
desktop.syncDockWithWindows(wm)
// Dock 顯示文字優先順序：WindowConfig.label → WindowConfig.title
// Dock 圖示來源：WindowConfig.icon（未傳則顯示 🪟）

// 動態變更 Dock 停靠位置（即時生效，icon 區域同步更新）
desktop.setDockPosition('top' | 'bottom' | 'left' | 'right')

// 取得桌面根元素（含 Dock）
desktop.getDesktopElement()

// WorkspaceManager — 多虛擬桌面
const wsMgr = new WorkspaceManager(desktop.getElement(), {
  animationMs: 220,
  windowManagerOptions: { isolated: true, snap: true },
})
wsMgr.addWorkspace({ id: 'ws-1', label: '桌面 1' })
wsMgr.switchTo('ws-1')
wsMgr.removeWorkspace('ws-1')
wsMgr.getWindowManager('ws-1')   // 取得該工作區的 WindowManager
wsMgr.openWindow({               // 推薦：自動產生 workspace-scoped window id
  appId: 'counter',
  title: 'Counter',
  content: el,
})
wsMgr.createWindowId('counter')   // 例如 ws-2::app-counter
wsMgr.events.on('workspace:switched', ({ from, to }) => { })
wsMgr.events.on('workspace:added',    (state) => { })
wsMgr.events.on('workspace:removed',  ({ id }) => { })

// TaskView — 虛擬桌面切換覆蓋層（Dock 按鈕自動管理）
const taskView = new TaskView(wsMgr, {
  dock:        desktop.getDock(), // 自動在最左側插入按鈕
  showButton:  true,              // 預設 true；false = 不加按鈕，open() 仍可呼叫
  buttonLabel: '虛擬桌面',         // 自訂按鈕標籤
  buttonIcon:  '⧉',               // 自訂按鈕圖示
  allowAdd:    true,       // 顯示「新增桌面」按鈕（預設 true）
  allowDelete: true,       // 顯示「刪除桌面」按鈕（預設 true）
  keyboard:    true,       // Escape 關閉（預設 true）
  onCreateWorkspace: () => ({ id: 'my-ws', label: '自訂桌面' }),  // 自訂新增邏輯
})
taskView.open() / taskView.close() / taskView.toggle()
taskView.events.on('taskview:open',  () => { })
taskView.events.on('taskview:close', () => { })
taskView.destroy()

// Dock hover 縮略圖預覽（syncDockWithWindows 選項）
// 若有子視窗，hover 時顯示群組卡片列（父+所有子視窗，含 × 關閉鈕）
desktop.syncDockWithWindows(wm, {
  showWindowPreview: true,                    // 預設 true；false = 關閉預覽
  previewSize: { width: 160, height: 100 },   // 每張卡片縮略圖尺寸
  // Vue + Vuetify 環境下自動偵測 .v-application，通常不需設定
  // 若自動偵測失敗（縮略圖無樣式），手動指定 CSS scope root：
  // previewMountEl: document.getElementById('app'),
})

// 子視窗（parentId / modal）
wm.open({
  id:       'dialog',
  title:    '確認對話框',
  parentId: 'app-main',   // 附屬於父視窗，不在 Dock 獨立顯示
  modal:    true,          // 父視窗加遮罩，點遮罩 → 子視窗 shake 提示
  content:  el,
})
wm.shake(id)              // 讓視窗出現搖晃動畫
wm.getChildIds(parentId)  // 取得父視窗的子視窗 ID 陣列
wm.getRootWindowId(id)    // 取得視窗的最頂層根視窗 ID
// 新增事件：window:child-opened / window:child-closed
```

---

## 6. 建置指令速查

```bash
# ── 根目錄（核心 Library）──────────────────────────────────────
cd D:\Dropbox\新ERP框架開發\DeskPane

npm run build         # tsc --noEmit（型別檢查，不輸出 JS）
npm run build:lib     # Rollup 建置 → dist/（ES + UMD + min + .d.ts + themes）
npm run clean         # 清除 dist/（含 Dropbox EBUSY auto-retry）
npm run release       # clean + build:lib + 打包 release/ 交付資料夾

# ── 發佈 npm (自動化 CI/CD) ────────────────────────────────────
npm version patch/minor/major  # 更新版本號並自動產生 git tag
git push --follow-tags         # push 後 GitHub Actions 自動編譯與發佈

# ── 複製主題 CSS（build:lib 已自動執行）────────────────────────
node scripts/build-themes.mjs   # src/themes/ → dist/themes/ + demo/*/public/themes/

# ── Demo 子專案 ─────────────────────────────────────────────
cd demo/vue   && npm install && npm run dev    # port 3001
cd demo/react && npm install && npm run dev    # port 3002
cd demo/docs  && npm install && npm run dev    # port 3002
```

> ⚠️ `npm run build` 只做型別檢查，**不產生 JS**。實際建置請用 `npm run build:lib`。  
> ⚠️ Node.js 18+（目前 18.15.0）。`rollup-plugin-dts` v6 在 Node 18 有 EBADENGINE 警告，**功能正常**。  
> ⚠️ Vite 快取放 Dropbox 會 EBUSY → `vite.config.ts` 設 `cacheDir: path.join(os.tmpdir(), '...')`。  
> ⚠️ `package.json` 必須無 BOM（UTF-8 without BOM），否則 PostCSS config 搜尋器會 parse 失敗。  
> ⚠️ `.github/workflows/release.yml` 的 **`Update npm`** 步驟（`npm install -g npm@latest`）**絕對不能拿掉**。GitHub Actions 內建 npm 版本過舊，不支援 OIDC Trusted Publisher，Publish to npm 步驟會直接失敗。  
> 📄 發佈詳細教學：`docs-internal/npm-publish-guide.md`  
> 📄 Release 流程：`docs-internal/release-workflow.md`
> 📄 Workspace / TaskView / Vue 踩雷紀錄：`docs-internal/workspace-taskview-vue-gotchas.md`

---

## 7. 重要技術決策 & 已知陷阱

| # | 問題/決策 | 結論/處理方式 |
|---|----------|-------------|
| 1 | 建置工具 | 用 **Rollup**（非 Vite）打包 Library；根目錄 Vite v8 需 Node 20+ |
| 2 | 視窗縮放 UX | `.dp-window` border 改為 4px，`resizeBorderPx` 預設 8；最大化時 `border-width:0` |
| 3 | Vite module 作用域 | `type="module"` 不能用 `onclick=""`，改用 `addEventListener` 綁定 |
| 4 | DragResizeOptions 型別 | 不能用 `Required<DragResizeOptions>`，改用 `Required<Omit<...,'containerEl'>> & {containerEl?}` |
| 5 | 隔離模式座標 | `_getContainerRect()` 無容器時回傳 `{left:0,top:0}`，拖曳公式兩模式通用 |
| 6 | Dropbox + Vite EBUSY | `vite.config.ts` → `cacheDir: path.join(os.tmpdir(), 'vite-deskpane-xxx')` |
| 7 | restore() 狀態機 | 最大化→最小化→點任務列 → 保留最大化狀態；`wasMaximized` 旗標控制 |
| 8 | maximize() bug | Minimize→Maximize→Minimize→再 Maximize 無反應；修法：isMaximized+isMinimized 時先 restore |
| 9 | Docs i18n | `provide/inject` 輕量方案；App.vue 不能同時 provideLocale+useLocale（inject 只找祖先） |
| 10 | React StrictMode | dev 雙重 effect 會 destroy+recreate WM；demo 可接受 |
| 11 | adapters 型別範圍 | `src/adapters/` 不在根 tsconfig exclude 內（需 vue/react peer deps）；由各 demo tsconfig 負責 |
| 12 | `--dp-dock-border` 型別 | Theme Editor 裡此變數必須用 `type:'text'`，color picker 會截掉 rgba alpha |
| 13 | `build-themes.mjs` | 純複製腳本，`src/themes/` 是 source of truth；Desktop 變數已手動加入 |
| 14 | Desktop Sentinel | icon 拖到邊界外時撐開 scrollHeight/Width；`addIcon/removeIcon/_savePositions` 都要呼叫 `_updateSentinel()` |
| 15 | Snap 縮放吸附座標 | `_applyResize` 轉換為容器相對座標後才傳給 `resizeSnapFn`；snapResize 回傳容器相對座標，不再需要扣 cLeft/cTop |
| 16 | snapGap 邏輯 | 跨側吸附（近邊貼遠邊）加 gap；同側對齊（左對左）不加；容器邊緣一律不加 gap |
| 17 | `resizable: false` 實作 | `WindowConfig` + `WindowState` 加 `resizable`；`DOMRenderer` 設 `btnMax.disabled`；`DragResizeHandler` guard `_onWinMouseDown` + `_updateResizeCursor`；`WindowManager.maximize()` 提前 return |
| 18 | Dock z-index 被視窗壓住 | Dock `.dp-dock` z-index: 100 → **9999**；視窗 `BASE_Z=100`、`MAX_Z=8999`；新增 `_normalizeZ()` 在視窗 z-index 逼近 8999 時自動重新排序，確保工具列永遠在視窗上方 |
| 19 | `syncDockWithWindows` 簡化 | `WindowConfig/State` 加 `icon?` + `label?`；Dock 預設直接讀取事件資料，無需傳 `getDockItem` config。`label` 優先於 `title` 顯示於 Dock |
| 20 | Dock 動態切換位置 | `Dock.setPosition()` 切換 CSS class；`Desktop.setDockPosition()` 同步更新 `_iconAreaEl` 與 `_windowAreaEl` 的 inset |
| 21 | Desktop `getElement()` 與最大化裁切 | 原本 `getElement()` 回傳含 Dock 的 `_desktopEl`，WM 最大化計算佔滿整個桌面，視窗被 Dock 蓋住。改為新增 `_windowAreaEl`（排除 Dock 的區域），`getElement()` 改回傳它。`getDesktopElement()` 取全桌面根元素 |
| 22 | `_windowAreaEl` position 被 dp-isolated 覆蓋 | `dp-isolated` CSS 設 `position:relative`，把 `_windowAreaEl` 的 `position:absolute` 蓋掉導致高度塌陷。修法：`.dp-desktop-window-area { position: absolute !important }` + `pointer-events: none; > * { pointer-events: auto }` |
| 23 | CSS Single Source of Truth | 移除 `DOMRenderer.ts` 中的 `BASE_CSS` 內嵌字串（~116 行）與 `desktop/styles.ts` 的 `DESKTOP_CSS`（~271 行）。改為 `import BASE_CSS from '../styles/deskpane.css'`。Rollup 以 `rawCss()` inline plugin 將 `.css` import 轉成 JS 字串，`src/css.d.ts` 補 TypeScript module declaration。`src/styles/*.css` 是唯一 CSS source，也複製至 `dist/styles/` 供 `<link>` 直接使用 |
| 24 | Dock `backdrop-filter` 被 `overflow:hidden` 阻斷 | Chrome 已知問題：`overflow:hidden` 會建立 scroll container，阻斷 `backdrop-filter` 的 compositing 穿透。修法：`.dp-desktop`、`.dp-desktop-window-area`、`.dp-isolated` 全部改為 `overflow:clip`（視覺效果相同，但不建立 scroll container）。支援 Chrome 90+, Firefox 102+, Safari 16+ |
| 25 | `_windowAreaEl` 有 inset 導致視窗被裁切，無法滑入 Dock 下方 | 視窗區域改為全尺寸（inset 全部 0），讓視窗可自由拖到 Dock 下方。同時設 `--dp-dock-inset-{top/bottom/left/right}` CSS 變數在 `.dp-desktop`，最大化 CSS 改讀這組變數計算邊界，確保最大化不蓋住 Dock |
| 26 | TaskView 設計選擇 | 獨立 `TaskView` class（職責分離），不整合進 WorkspaceManager。DOM clone + `transform:scale()` 縮略圖，無外部依賴。CSS 注入隔離（`dp-taskview-styles`），style 單一來源 `src/styles/deskpane-taskview.css` |
| 27 | TaskView DOM clone 快照 | `container.cloneNode(true)` 深複製工作區 DOM → 移除動畫 class，強制加 `dp-workspace--active` → `transform:scale(pw/vw)` 縮放到 210×132 預覽框。不需要 html2canvas 等外部套件 |
| 28 | TaskView 工作區切換後的 `_wsCounter` 同步 | 建構時掃描現有工作區 id 以 `/^ws-(\d+)$/` pattern 取最大 N，確保新增桌面編號不會重複 |
| 29 | TaskView Dock 按鈕固定位置 | `addItemAt(item, index)` 插入指定位置（0=最左）；TaskView 呼叫 `addItemAt(btn, 0)` 確保虛擬桌面按鈕永遠在最左側；`showButton: false` 可關閉自動插入但 `open()` 仍可呼叫 |
| 30 | Dock hover 縮略圖多視窗/拖曳失效 | `Dock.addItem/addItemAt/removeItem` 及拖曳排序每次都觸發 `_render()` 重建所有 DOM，導致舊 hover 事件消失。修法：新增 `onRender(cb)` 回呼，`syncDockWithWindows` 訂閱後統一呼叫 `refreshAllPreviewHovers()` 重綁所有現有視窗；cleanup 時加入 `offRender()` 避免 memory leak |
| 31 | `Dock.ts` / `DesktopIcon.ts` 重複 icon 判斷 | 兩者都需判斷 icon 字串是 URL/SVG/emoji，邏輯完全相同。提取至 `src/desktop/iconUtils.ts` 的 `appendIconContent(container, icon)` 共用函式，各自保留不同的包裝元素和 size 邏輯 |
| 32 | 子視窗 z-index 設計 | `state.zIndex = Math.max(++_zCounter, parentWin.state.zIndex + 1)`；`focus()` 父視窗時同步置頂所有子視窗並設為高於父；子視窗聚焦時父視窗 z-index = childZ - 1（保留層級順序）|
| 33 | Modal overlay 點擊處理 | overlay `mousedown` stopPropagation，不讓父視窗接到 focus 事件；觸發子視窗 `focus()` + `shake()`；overlay DOM 插入父視窗 root 內（`dp-modal-overlay`），不獨立管理 z-index |
| 34 | Dock 群組預覽 Sticky hover | `showGroupPreview` 用兩個 timer（showTimer 280ms / hideTimer 120ms）；popup `mouseenter` 取消 hide timer；Dock item `mouseleave` 只 scheduleHide，不立刻關閉，讓使用者可滑入 popup |
| 35 | Modal 關閉安全機制 | 點群組預覽父視窗 × 時，先掃所有子視窗找 `modal:true` 的；若存在則 shake 子視窗 + shake 對應卡片，不執行關閉；只有全部子視窗都是 non-modal 才 cascade 關閉 |
| 36 | `syncExisting` parentId 遺漏 | 原本 `syncExisting` 路徑只傳 `id/title/label/icon`，漏傳 `parentId`，導致初始存在的子視窗未被過濾、會出現在 Dock。修法：讀 `state.parentId` 一併傳入 |
| 37 | 群組預覽 popup 定位偏移（Vuetify / position:fixed 失效）| `buildGroupPreview` 用 `position:fixed` + `getBoundingClientRect()` viewport 座標，但若外層有 `transform`/`will-change`，`fixed` 會失效變成相對該容器定位。修法：在最後用 `popup.style.cssText +=` inline 覆寫 `position:fixed`，優先權高於 CSS class，不受外層 stacking context 影響 |
| 38 | 群組預覽縮略圖 CSS scope 失效（Vuetify scoped CSS）| `cloneNode(true)` 後掛到 `document.body`，脫離 `.v-application` selector scope、Vue scoped `data-v-*` 及 Desktop CSS 變數繼承，縮略圖只剩文字。修法：`buildGroupPreview` 自動偵測第一個 `winEl` 最近的 `.v-application` 作為 popup 掛載點；找不到 fallback `document.body`。新增 `DockSyncOptions.previewMountEl` 供使用者手動指定 CSS scope root |
| 39 | Vite 開發 server 無法使用 rawCss plugin（CSS SyntaxError）| Vite 的 CSS pipeline 在 `load()` hook 前就攔截 `.css` 檔，導致 DeskPane 的 `import CSS from '*.css'` 在 Vite dev 時出現 `does not provide an export named 'default'` 錯誤。修法：在 `vite.config.ts` 加 `rawCssPlugin()`（`enforce:'pre'`），`resolveId()` 將 `DeskPane/src/` 底下的 CSS 路徑加上 `?raw-dp` suffix，`load()` 讀檔並 `export default <string>`，完全繞過 Vite CSS pipeline | 
| 40 | `deskpane-workspace.css` pointer-events 設計 | `.dp-workspace-root` 和 `.dp-workspace--active` 都必須保留 `pointer-events:none`。空白處事件穿透到下方 icon-area（icon 可點擊）；視窗元素靠自身的 `pointer-events:auto` 接收事件（由 `.dp-desktop-window-area > *` 及 `.dp-isolated .dp-window` 設定）。**切勿**改為 `pointer-events:auto`，否則 workspace root 會遮住 icon-area，圖示無法點擊 |
| 41 | root `package.json` UTF-8 BOM 導致 PostCSS parse 失敗 | PostCSS config 搜尋器沿目錄向上找 `package.json`，遇到有 BOM（EF BB BF）的 JSON 時 `JSON.parse()` 丟 `SyntaxError: Unexpected token`。修法：用 `[System.Text.UTF8Encoding]::new($false)` 重寫 `package.json` 移除 BOM |
| 42 | DeskPane runtime CSS 注入策略 | `Desktop` / `WorkspaceManager` / `WindowManager` / `TaskView` 都支援 `injectStyles:false`。runtime inject 會先偵測既有 `<link>` / bundler `<style>`，避免重複注入；若需要注入，插在 app-level stylesheet 前面，讓專案端 override 保持有效。`WorkspaceManager.injectStyles:false` 會傳遞給內部建立的 `WindowManager`，除非 `windowManagerOptions.injectStyles` 明確覆寫 |
| 43 | `.dp-window` 透明與點擊穿透 | core CSS 不應依賴 `.dp-body` 撐滿整個視窗才有背景；`.dp-window` 改為 `background: var(--dp-window-bg, var(--dp-window-body-bg, #ffffff))`，並確保 `.dp-window` / `.dp-header` / `.dp-body` 保持 `pointer-events:auto` |
| 44 | Vite demo rawCss plugin scope | raw CSS plugin 只攔截 DeskPane `src/` 內部 import `src/styles/*.css` 的情況，並加上 `?raw-dp` 轉成 JS string；demo app 自己在 `main.ts` / `main.tsx` import 的 DeskPane CSS 仍走 Vite 正常 CSS pipeline，避免樣式被當成 default export 或消失 |
| 45 | React/Vue Workspace Portal/Teleport 黑畫面 | 這是 framework integration state 問題，不是 DeskPane core 畫面渲染問題。DeskPane 管 DOM 視窗，React/Vue 內容由 app 用 portal/teleport 掛進 `bodyEl`；使用多工作區時必須在 `workspace:switched` 同步 active workspace 視窗、訂閱 `workspace:added` 的 WindowManager 事件，且 portal/teleport key 要包含 `workspaceId:id`，避免不同桌面同 id 視窗重用錯誤 target |
| 46 | GitHub Actions `Update npm` 步驟不可移除 | GitHub Actions runner 內建 npm 版本過舊（不支援 OIDC Trusted Publisher），必須在 `Publish to npm` 前執行 `npm install -g npm@latest`（需 npm 11.5.1+）。少了這步驟 `npm publish --provenance` 會直接失敗 |
| 47 | `demo/vue` 多 workspace 相同 app id 錯位 | 同一個 app 可在不同桌面開啟時，不可重複使用 `app-counter` 這種 window id。實際 window id 要包含 workspace，例如 `ws-2::app-counter`；Dock/app lookup 再用 `getAppIdFromWindowId()` 還原成 `counter`。否則 Dock sync、Teleport target、focus 可能指到第一個同 id 視窗 |
| 48 | inactive workspace 不能只靠 transform/visibility 隱藏 | 舊桌面看不到但仍可能摸到視窗 resize 邊框或 Vue Teleport 內容。切換動畫結束後 inactive workspace 必須 `hidden=true`，並設 `inert` + `aria-hidden="true"`；CSS 加 `.dp-workspace[hidden] { display:none !important; pointer-events:none !important; }` |
| 49 | TaskView 快照會 clone live state | `TaskView` 用 `container.cloneNode(true)` 做快照，會連 `hidden` / `inert` / `aria-hidden` 一起複製。clone 後必須清掉這些屬性，再移除 enter/leave class、加回 `dp-workspace--active`，否則 inactive workspace 的預覽會空白 |
| 50 | TaskView 關閉後 overlay 必須硬 hidden | `opacity:0` 或單靠 `pointer-events:none` 不夠；`dp-task-view-panel` 仍可能在 DevTools / hit-test 中被碰到。`TaskView` constructor 預設 `overlay.hidden=true`，`open()` 解開，`close()` 立刻設回；CSS 加 `.dp-task-view[hidden]` |
| 51 | Vue `data-v-*` 不是根因 | DevTools 看到 `data-v-cdbe9a07` 只是 Vue scoped CSS。若點到它會切桌面，真正要查的是最近的 `.dp-workspace` 是否 hidden/inert，或 `.dp-task-view` 是否 hidden。詳細排查流程見 `docs-internal/workspace-taskview-vue-gotchas.md` |
| 52 | Workspace id 預防 API | 使用者不必自己組 `ws-2::app-counter`。`deskpane/workspace` 匯出 `createWorkspaceWindowId()` / `parseWorkspaceWindowId()` / `getAppIdFromWorkspaceWindowId()`，`WorkspaceManager.openWindow({ appId })` 會自動產生 scoped id。`warnOnDuplicateWindowIds` 預設 true，直接用 raw id 跨 workspace 重複開窗會 `console.warn` |

---

## 8. dist/ 產出清單

| 檔案 | 格式 | 說明 |
|------|------|------|
| `deskpane.es.js` | ESM | ~23 KB，開發用 |
| `deskpane.es.min.js` | ESM | ~12 KB，生產用 |
| `deskpane.umd.js` | UMD | ~26 KB，script tag / jQuery |
| `deskpane.umd.min.js` | UMD | ~12 KB，CDN |
| `deskpane-desktop.es.js / .min.js` | ESM | Desktop 模組 |
| `deskpane-desktop.umd.js / .min.js` | UMD | `window.DeskPaneDesktop` |
| `deskpane-workspace.es.js / .min.js` | ESM | Workspace + Session 模組 |
| `deskpane-workspace.umd.js / .min.js` | UMD | `window.DeskPaneWorkspace` |
| `index.d.ts` | TypeScript | Core 型別宣告 |
| `desktop.d.ts` | TypeScript | Desktop 型別宣告 |
| `workspace.d.ts` | TypeScript | Workspace + Session 型別宣告 |
| `themes/light.css` | CSS | ~2 KB，Core + Desktop 23 vars |
| `themes/dark.css` | CSS | ~2 KB，Core + Desktop 23 vars |
| `themes/medieval-pixel.css` | CSS | ~3 KB，中世紀像素主題（Core + Desktop + pixel UI assets） |
| `themes/assets/medieval-pixel/` | Assets | Medieval Pixel 主題素材 |
| `styles/deskpane.css` | CSS | Core 視窗結構樣式（可直接 `<link>`） |
| `styles/deskpane-desktop.css` | CSS | Desktop / Dock / Icon 樣式（可直接 `<link>`） |
| `styles/deskpane-layout.css` | CSS | BorderLayout / Panel 樣式（可直接 `<link>`） |
| `styles/deskpane-workspace.css` | CSS | Workspace 容器 / 滑入動畫 / 指示點（可直接 `<link>`） |
| `styles/deskpane-taskview.css` | CSS | TaskView 覆蓋層 / 卡片 / 縮略圖 / 按鈕（可直接 `<link>`） |

---

## 9. Demo 頁面索引

| Demo | 路徑 | 說明 |
|------|------|------|
| 首頁 | `demo/index.html` | 所有 Demo 入口卡片 |
| Vanilla JS | `demo/vanilla/index.html` | 純 JS，snap=true |
| jQuery | `demo/jquery/index.html` | UMD + jQuery CDN，5 個應用 |
| Desktop | `demo/desktop/index.html` | 中世紀像素風格完整虛擬桌面（Dock + Icons + WindowManager + BorderLayout 範例視窗） |
| Theme Editor | `demo/theme-editor/index.html` | Tab1 Core CSS 變數 / Tab2 Desktop CSS 變數 / Tab3 完整桌面預覽 + 雙 CSS 即時注入（core + desktop）+ Win11 預設樣式 |
| Layout | `demo/layout/index.html` | BorderLayout 東西南北中 + 巢狀 + Panel |
| Vue 3 | `demo/vue/` / Pages: `demo/vue/dist/index.html` | 全螢幕虛擬桌面風格；Desktop+WorkspaceManager+TaskView；manual CSS import + `injectStyles:false`；workspace-aware Teleport key；5 個 app（GuideApp/EditorApp/TodoApp/CounterApp/CalcApp），port 3001 |
| React 18 | `demo/react/` / Pages: `demo/react/dist/index.html` | 全螢幕虛擬桌面風格；Desktop+WorkspaceManager+TaskView；manual CSS import + `injectStyles:false`；workspace-aware createPortal key；5 個 app，port 3002 |
| Docs | `demo/docs/` / Pages: `demo/docs/dist/index.html` | 開發手冊 Vue SPA，i18n EN/zh-TW，port 3002 |

---

## 10. 快速恢復步驟（重裝後）

```bash
# 1. 確認 Node.js 18+
node --version

# 2. 安裝根依賴
cd D:\Dropbox\新ERP框架開發\DeskPane
npm install

# 3. 建置 Library
npm run build:lib

# 4. （選用）啟動 Vue Demo
cd demo/vue && npm install && npm run dev

# 5. （選用）啟動 React Demo
cd demo/react && npm install && npm run dev
```

