# WebOS-Core — 專案狀態（AI 快查版）

> 最後更新：2026-05-27 15:17 ｜ 備份：`bak/PROJECT_STATUS.2026-05-26.md`
> 此文件為 AI 輔助開發設計，優先說明「現在是什麼」，歷史細節見備份。

---

## 1. 專案一句話

**框架無關的網頁虛擬桌面視窗管理引擎。**  
核心：視窗生命週期 + 拖曳縮放 + Snap 吸附 + 主題系統。  
擴充：Desktop 桌面模組（圖示 + Dock + 虛擬桌面）、BorderLayout 佈局、Vue3/React Hook 包裝。

- 授權：Apache-2.0 © 2026 Brian Cheng
- 路徑：`D:\Dropbox\新ERP框架開發\WebOS\`（Dropbox 同步，重裝後直接開啟）

---

## 2. 已完成功能清單

| 功能 | 狀態 | 主要檔案 |
|------|------|---------|
| 視窗管理核心（open/close/min/max/focus/snap） | ✅ | `src/core/WindowManager.ts` |
| 拖曳 + 縮放 + Snap 吸附（拖曳 & 縮放）+ Snap 間距設定 | ✅ | `src/core/DragResizeHandler.ts`, `SnapHelper.ts` |
| `resizable: false` — 禁用放大按鈕 + 邊框縮放（固定大小視窗） | ✅ | `src/core/types.ts`, `DOMRenderer.ts`, `DragResizeHandler.ts`, `WindowManager.ts` |
| DOM 渲染 + CSS 變數主題系統 | ✅ | `src/renderers/DOMRenderer.ts` |
| CSS 單一來源（Single Source of Truth） — webos-core.css / webos-desktop.css | ✅ | `src/styles/*.css` |
| Rollup rawCss() plugin — build time 將 `.css` 轉為 JS 字串內嵌 | ✅ | `rollup.lib.config.mjs` |
| light.css / dark.css（Core + Desktop 變數） | ✅ | `src/themes/*.css` |
| `setTheme()` 工具函式 | ✅ | `src/themes/setTheme.ts` |
| BorderLayout（5 區域 + 折疊 Strip） | ✅ | `src/layout/BorderLayout.ts` |
| Panel（可折疊標題面板） | ✅ | `src/layout/Panel.ts` |
| Desktop 桌面模組 | ✅ | `src/desktop/` |
| Vue 3 Composable | ✅ | `src/adapters/vue/useWindowManager.ts` |
| React 18 Hook | ✅ | `src/adapters/react/useWindowManager.ts` |
| Demo（vanilla / jQuery / Vue / React / Desktop / Theme Editor / Layout） | ✅ | `demo/` |
| Theme Editor — Tab 3 完整桌面預覽 + 雙 CSS 即時注入（core + desktop 同時） | ✅ | `demo/theme-editor/index.html` |
| Dock 毛玻璃效果（`--wos-dock-backdrop-filter`）— `overflow:clip` 修正讓視窗可穿透顯示 | ✅ | `src/styles/webos-desktop.css`, `webos-core.css`, `desktop/Desktop.ts` |
| Docs 開發手冊（Vue3 SPA，i18n EN/zh-TW，17 頁，含 WindowConfig 完整選項表） | ✅ | `demo/docs/` |
| WorkspaceManager — 多工作區切換（獨立容器、左右滑入動畫、指示點） | ✅ | `src/workspace/WorkspaceManager.ts` |
| SessionManager — 視窗狀態序列化 / 還原（支援單 WM 或多工作區） | ✅ | `src/session/SessionManager.ts` |
| **TaskView** — 虛擬桌面切換覆蓋層（DOM clone 快照 + 新增/刪除/Escape，獨立 class） | ✅ | `src/workspace/TaskView.ts` |
| **TaskView Dock 按鈕管理** — 建立時傳入 `dock`，自動在最左側插入按鈕；`showButton: false` 可關閉但 `open()` 仍可呼叫 | ✅ | `src/workspace/TaskView.ts`, `src/workspace/types.ts` |
| **Dock hover 縮略圖預覽** — 滑鼠懸停 300ms 後顯示視窗 DOM clone 縮圖（240×150，比例縮放）；拖曳重排或多視窗後事件自動重綁 | ✅ | `src/desktop/Desktop.ts`, `src/desktop/Dock.ts` |
| **Dock.addItemAt(item, index)** — 在指定位置插入 item（0 = 最左）；`Dock.onRender(cb)` 每次重建 DOM 後觸發回呼 | ✅ | `src/desktop/Dock.ts` |
| **src 重構整理** — 提取 `iconUtils.ts` 共用 `appendIconContent()`，消除 `Dock.ts`/`DesktopIcon.ts` 重複 icon 邏輯；修正 `workspace/types.ts` 自我 import；簡化 `Desktop.ts` snap guide 嵌套 null check | ✅ | `src/desktop/iconUtils.ts`, `Dock.ts`, `DesktopIcon.ts`, `Desktop.ts`, `workspace/types.ts` |
| **拖曳邊界保留（dragEdgeMargin）** — 視窗拖曳到容器邊緣時至少保留 60px（可設定）在容器內，確保使用者可抓回；Desktop 模式自動讀取 `--wos-dock-inset-*` CSS 變數，底部邊界加計 Dock 高度，視窗無法沉入 Dock 遮蔽區 | ✅ | `src/core/DragResizeHandler.ts` |

**尚未實作：**
- [ ] CDN 發佈（jsDelivr / unpkg）

---

## 3. 目錄結構（精簡版）

```
WebOS/
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
│   │   └── DOMRenderer.ts          ← DOM 結構 + CSS 注入（import BASE_CSS from styles/webos-core.css）
│   ├── styles/
│   │   ├── webos-core.css          ← Core CSS 單一來源（視窗結構/Snap/Dock 基礎樣式）
│   │   ├── webos-desktop.css       ← Desktop CSS 單一來源（桌面/Dock/Icon 樣式）
│   │   ├── webos-layout.css        ← Layout CSS 單一來源（BorderLayout/Panel 樣式）
│   │   ├── webos-workspace.css     ← Workspace CSS 單一來源（工作區容器/滑入動畫/指示點）
│   │   └── webos-taskview.css      ← TaskView CSS 單一來源（覆蓋層/卡片/縮略圖/按鈕）
│   ├── themes/
│   │   ├── light.css               ← 亮色（Core 15 vars + Desktop 7 vars）
│   │   ├── dark.css                ← 暗色（Core 15 vars + Desktop 7 vars）
│   │   └── setTheme.ts             ← setTheme(preset, options?)
│   ├── layout/
│   │   ├── BorderLayout.ts         ← 東西南北中五區域、可拖曳分割線、巢狀遞迴
│   │   ├── Panel.ts                ← 可折疊標題+內容面板（data-panel 宣告式）
│   │   └── styles.ts               ← injectLayoutStyles() / getLayoutCSS()（import from webos-layout.css）
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
│   │   ├── styles.ts               ← injectDesktopStyles()（import DESKTOP_CSS from styles/webos-desktop.css）
│   │   └── types.ts                ← DesktopConfig / DockConfig / DesktopIconConfig
│   └── adapters/
│       ├── vue/useWindowManager.ts ← Vue 3 Composable
│       └── react/useWindowManager.ts ← React Hook（useRef + useState + useEffect）
│
├── dist/                           ← rollup build:lib 輸出（勿手動編輯）
│   ├── webos-core.es.js / .min.js
│   ├── webos-core.umd.js / .min.js
│   ├── webos-desktop.es.js / .min.js
│   ├── webos-desktop.umd.js / .min.js
│   ├── webos-workspace.es.js / .min.js
│   ├── webos-workspace.umd.js / .min.js
│   ├── index.d.ts / desktop.d.ts / workspace.d.ts
│   ├── themes/light.css, dark.css  ← build-themes.mjs 從 src/themes/ 複製
│   └── styles/
│       ├── webos-core.css          ← build-themes.mjs 從 src/styles/ 複製（可直接 <link>）
│       ├── webos-desktop.css       ← build-themes.mjs 從 src/styles/ 複製（可直接 <link>）
│       ├── webos-layout.css        ← build-themes.mjs 從 src/styles/ 複製（可直接 <link>）
│       └── webos-workspace.css     ← build-themes.mjs 從 src/styles/ 複製（可直接 <link>）
│       └── webos-taskview.css      ← build-themes.mjs 從 src/styles/ 複製（可直接 <link>）
│
├── demo/
│   ├── index.html                  ← Demo 首頁
│   ├── shared/base.css             ← 共用 reset + header 樣式
│   ├── vanilla/index.html
│   ├── jquery/index.html
│   ├── desktop/index.html          ← 完整虛擬桌面體驗
│   ├── theme-editor/index.html     ← 🎨 Theme Editor（Tab1 Core / Tab2 Desktop / Tab3 完整桌面預覽+CSS 即時注入）
│   ├── layout/index.html
│   ├── vue/                        ← 獨立 Vite 專案（port 3008）
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

## 4. CSS 自訂屬性（完整 29 個）

### Core 視窗（14 個）— 來源：`src/styles/webos-core.css`

| 變數 | 說明 | CSS 預設值 |
|------|------|-----------|
| `--wos-window-border` | 視窗外框顏色 | `#d0d0d0` |
| `--wos-window-border-active` | 作用中外框顏色 | `#b0b8c8` |
| `--wos-window-shadow` | 視窗陰影 | `0 4px 24px rgba(0,0,0,0.18)` |
| `--wos-window-shadow-active` | 作用中陰影 | `0 8px 36px rgba(0,0,0,0.28)` |
| `--wos-window-header-bg` | 標題列背景 | `#f5f5f5` |
| `--wos-window-header-border` | 標題列底線 | `#e0e0e0` |
| `--wos-window-title-color` | 標題文字色 | `#333333` |
| `--wos-window-btn-color` | 按鈕圖示色 | `#555555` |
| `--wos-window-btn-hover-bg` | 按鈕 hover 背景 | `#e0e0e0` |
| `--wos-window-btn-close-hover-bg` | 關閉按鈕 hover 背景 | `#ff5f57` |
| `--wos-window-btn-close-hover-color` | 關閉按鈕 hover 文字 | `#ffffff` |
| `--wos-window-body-bg` | 視窗內容背景 | `#ffffff` |
| `--wos-window-body-color` | 視窗內容文字 | `#222222` |
| `--wos-snap-guide-color` | Snap 引導線 | `rgba(0,120,255,0.55)` |

### Layout 模組（7 個）— 來源：`src/styles/webos-layout.css`

| 變數 | 說明 | CSS 預設值 |
|------|------|-----------|
| `--wos-layout-header-bg` | 面板標題列背景 | `#f5f5f5` |
| `--wos-layout-header-border` | 面板標題列底線 | `#e0e0e0` |
| `--wos-layout-title-color` | 面板標題文字色 | `#333` |
| `--wos-layout-btn-color` | 面板按鈕圖示色 | `#555` |
| `--wos-layout-btn-hover-bg` | 面板按鈕 hover 背景 | `#e0e0e0` |
| `--wos-layout-splitter-bg` | 分隔條顏色 | `#d0d0d0` |
| `--wos-layout-splitter-active` | 分隔條拖動顏色 | `#b0b8c8` |

### Desktop 模組（8 個）— 來源：`src/styles/webos-desktop.css`

| 變數 | 說明 | CSS 預設值 |
|------|------|-----------|
| `--wos-desktop-bg` | 桌面背景（支援 gradient） | `linear-gradient(135deg,#1a2a4a,#0d1b2a)` |
| `--wos-desktop-icon-text` | 桌面圖示文字 | `#fff` |
| `--wos-desktop-icon-hover-bg` | 圖示 hover 背景 | `rgba(255,255,255,0.15)` |
| `--wos-dock-bg` | Dock 背景（支援 rgba） | `rgba(20,30,50,0.75)` |
| `--wos-dock-backdrop-filter` | Dock 毛玻璃模糊（`blur(Npx)` 或 `none`） | `blur(14px)` |
| `--wos-dock-border` | Dock 邊框（支援 rgba） | `rgba(255,255,255,0.1)` |
| `--wos-dock-item-hover-bg` | Dock 項目 hover 背景 | `rgba(255,255,255,0.12)` |
| `--wos-font` | 全域字體 | `system-ui,-apple-system,sans-serif` |

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
// ESM: import { setTheme } from 'webos-core'
// UMD: WebOS.setTheme(...)

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
desktop.syncDockWithWindows(wm, {
  showWindowPreview: true,                    // 預設 true；false = 關閉預覽
  previewSize: { width: 240, height: 150 },   // 預設值；可自訂
})
```

---

## 6. 建置指令速查

```bash
# ── 根目錄（核心 Library）──────────────────────────────────────
cd D:\Dropbox\新ERP框架開發\WebOS

npm run build         # tsc --noEmit（型別檢查，不輸出 JS）
npm run build:lib     # Rollup 建置 → dist/（ES + UMD + min + .d.ts + themes）
npm run clean         # 清除 dist/（含 Dropbox EBUSY auto-retry）
npm run release       # clean + build:lib + 打包 release/ 交付資料夾

# ── 複製主題 CSS（build:lib 已自動執行）────────────────────────
node scripts/build-themes.mjs   # src/themes/ → dist/themes/ + demo/*/public/themes/

# ── Demo 子專案 ─────────────────────────────────────────────
cd demo/vue   && npm install && npm run dev    # port 3008
cd demo/react && npm install && npm run dev    # port 3002
cd demo/docs  && npm install && npm run dev    # port 3002
```

> ⚠️ `npm run build` 只做型別檢查，**不產生 JS**。實際建置請用 `npm run build:lib`。  
> ⚠️ Node.js 18+（目前 18.15.0）。`rollup-plugin-dts` v6 在 Node 18 有 EBADENGINE 警告，**功能正常**。  
> ⚠️ Vite 快取放 Dropbox 會 EBUSY → `vite.config.ts` 設 `cacheDir: path.join(os.tmpdir(), '...')`。

---

## 7. 重要技術決策 & 已知陷阱

| # | 問題/決策 | 結論/處理方式 |
|---|----------|-------------|
| 1 | 建置工具 | 用 **Rollup**（非 Vite）打包 Library；根目錄 Vite v8 需 Node 20+ |
| 2 | 視窗縮放 UX | `.wos-window` border 改為 4px，`resizeBorderPx` 預設 8；最大化時 `border-width:0` |
| 3 | Vite module 作用域 | `type="module"` 不能用 `onclick=""`，改用 `addEventListener` 綁定 |
| 4 | DragResizeOptions 型別 | 不能用 `Required<DragResizeOptions>`，改用 `Required<Omit<...,'containerEl'>> & {containerEl?}` |
| 5 | 隔離模式座標 | `_getContainerRect()` 無容器時回傳 `{left:0,top:0}`，拖曳公式兩模式通用 |
| 6 | Dropbox + Vite EBUSY | `vite.config.ts` → `cacheDir: path.join(os.tmpdir(), 'vite-webos-xxx')` |
| 7 | restore() 狀態機 | 最大化→最小化→點任務列 → 保留最大化狀態；`wasMaximized` 旗標控制 |
| 8 | maximize() bug | Minimize→Maximize→Minimize→再 Maximize 無反應；修法：isMaximized+isMinimized 時先 restore |
| 9 | Docs i18n | `provide/inject` 輕量方案；App.vue 不能同時 provideLocale+useLocale（inject 只找祖先） |
| 10 | React StrictMode | dev 雙重 effect 會 destroy+recreate WM；demo 可接受 |
| 11 | adapters 型別範圍 | `src/adapters/` 不在根 tsconfig exclude 內（需 vue/react peer deps）；由各 demo tsconfig 負責 |
| 12 | `--wos-dock-border` 型別 | Theme Editor 裡此變數必須用 `type:'text'`，color picker 會截掉 rgba alpha |
| 13 | `build-themes.mjs` | 純複製腳本，`src/themes/` 是 source of truth；Desktop 變數已手動加入 |
| 14 | Desktop Sentinel | icon 拖到邊界外時撐開 scrollHeight/Width；`addIcon/removeIcon/_savePositions` 都要呼叫 `_updateSentinel()` |
| 15 | Snap 縮放吸附座標 | `_applyResize` 轉換為容器相對座標後才傳給 `resizeSnapFn`；snapResize 回傳容器相對座標，不再需要扣 cLeft/cTop |
| 16 | snapGap 邏輯 | 跨側吸附（近邊貼遠邊）加 gap；同側對齊（左對左）不加；容器邊緣一律不加 gap |
| 17 | `resizable: false` 實作 | `WindowConfig` + `WindowState` 加 `resizable`；`DOMRenderer` 設 `btnMax.disabled`；`DragResizeHandler` guard `_onWinMouseDown` + `_updateResizeCursor`；`WindowManager.maximize()` 提前 return |
| 18 | Dock z-index 被視窗壓住 | Dock `.wos-dock` z-index: 100 → **9999**；視窗 `BASE_Z=100`、`MAX_Z=8999`；新增 `_normalizeZ()` 在視窗 z-index 逼近 8999 時自動重新排序，確保工具列永遠在視窗上方 |
| 19 | `syncDockWithWindows` 簡化 | `WindowConfig/State` 加 `icon?` + `label?`；Dock 預設直接讀取事件資料，無需傳 `getDockItem` config。`label` 優先於 `title` 顯示於 Dock |
| 20 | Dock 動態切換位置 | `Dock.setPosition()` 切換 CSS class；`Desktop.setDockPosition()` 同步更新 `_iconAreaEl` 與 `_windowAreaEl` 的 inset |
| 21 | Desktop `getElement()` 與最大化裁切 | 原本 `getElement()` 回傳含 Dock 的 `_desktopEl`，WM 最大化計算佔滿整個桌面，視窗被 Dock 蓋住。改為新增 `_windowAreaEl`（排除 Dock 的區域），`getElement()` 改回傳它。`getDesktopElement()` 取全桌面根元素 |
| 22 | `_windowAreaEl` position 被 wos-isolated 覆蓋 | `wos-isolated` CSS 設 `position:relative`，把 `_windowAreaEl` 的 `position:absolute` 蓋掉導致高度塌陷。修法：`.wos-desktop-window-area { position: absolute !important }` + `pointer-events: none; > * { pointer-events: auto }` |
| 23 | CSS Single Source of Truth | 移除 `DOMRenderer.ts` 中的 `BASE_CSS` 內嵌字串（~116 行）與 `desktop/styles.ts` 的 `DESKTOP_CSS`（~271 行）。改為 `import BASE_CSS from '../styles/webos-core.css'`。Rollup 以 `rawCss()` inline plugin 將 `.css` import 轉成 JS 字串，`src/css.d.ts` 補 TypeScript module declaration。`src/styles/*.css` 是唯一 CSS source，也複製至 `dist/styles/` 供 `<link>` 直接使用 |
| 24 | Dock `backdrop-filter` 被 `overflow:hidden` 阻斷 | Chrome 已知問題：`overflow:hidden` 會建立 scroll container，阻斷 `backdrop-filter` 的 compositing 穿透。修法：`.wos-desktop`、`.wos-desktop-window-area`、`.wos-isolated` 全部改為 `overflow:clip`（視覺效果相同，但不建立 scroll container）。支援 Chrome 90+, Firefox 102+, Safari 16+ |
| 25 | `_windowAreaEl` 有 inset 導致視窗被裁切，無法滑入 Dock 下方 | 視窗區域改為全尺寸（inset 全部 0），讓視窗可自由拖到 Dock 下方。同時設 `--wos-dock-inset-{top/bottom/left/right}` CSS 變數在 `.wos-desktop`，最大化 CSS 改讀這組變數計算邊界，確保最大化不蓋住 Dock |
| 26 | TaskView 設計選擇 | 獨立 `TaskView` class（職責分離），不整合進 WorkspaceManager。DOM clone + `transform:scale()` 縮略圖，無外部依賴。CSS 注入隔離（`wos-taskview-styles`），style 單一來源 `src/styles/webos-taskview.css` |
| 27 | TaskView DOM clone 快照 | `container.cloneNode(true)` 深複製工作區 DOM → 移除動畫 class，強制加 `wos-workspace--active` → `transform:scale(pw/vw)` 縮放到 210×132 預覽框。不需要 html2canvas 等外部套件 |
| 28 | TaskView 工作區切換後的 `_wsCounter` 同步 | 建構時掃描現有工作區 id 以 `/^ws-(\d+)$/` pattern 取最大 N，確保新增桌面編號不會重複 |
| 29 | TaskView Dock 按鈕固定位置 | `addItemAt(item, index)` 插入指定位置（0=最左）；TaskView 呼叫 `addItemAt(btn, 0)` 確保虛擬桌面按鈕永遠在最左側；`showButton: false` 可關閉自動插入但 `open()` 仍可呼叫 |
| 30 | Dock hover 縮略圖多視窗/拖曳失效 | `Dock.addItem/addItemAt/removeItem` 及拖曳排序每次都觸發 `_render()` 重建所有 DOM，導致舊 hover 事件消失。修法：新增 `onRender(cb)` 回呼，`syncDockWithWindows` 訂閱後統一呼叫 `refreshAllPreviewHovers()` 重綁所有現有視窗；cleanup 時加入 `offRender()` 避免 memory leak |
| 31 | `Dock.ts` / `DesktopIcon.ts` 重複 icon 判斷 | 兩者都需判斷 icon 字串是 URL/SVG/emoji，邏輯完全相同。提取至 `src/desktop/iconUtils.ts` 的 `appendIconContent(container, icon)` 共用函式，各自保留不同的包裝元素和 size 邏輯 |

---

## 8. dist/ 產出清單

| 檔案 | 格式 | 說明 |
|------|------|------|
| `webos-core.es.js` | ESM | ~23 KB，開發用 |
| `webos-core.es.min.js` | ESM | ~12 KB，生產用 |
| `webos-core.umd.js` | UMD | ~26 KB，script tag / jQuery |
| `webos-core.umd.min.js` | UMD | ~12 KB，CDN |
| `webos-desktop.es.js / .min.js` | ESM | Desktop 模組 |
| `webos-desktop.umd.js / .min.js` | UMD | `window.WebOSDesktop` |
| `webos-workspace.es.js / .min.js` | ESM | Workspace + Session 模組 |
| `webos-workspace.umd.js / .min.js` | UMD | `window.WebOSWorkspace` |
| `index.d.ts` | TypeScript | Core 型別宣告 |
| `desktop.d.ts` | TypeScript | Desktop 型別宣告 |
| `workspace.d.ts` | TypeScript | Workspace + Session 型別宣告 |
| `themes/light.css` | CSS | ~2 KB，Core + Desktop 22 vars |
| `themes/dark.css` | CSS | ~2 KB，Core + Desktop 22 vars |
| `styles/webos-core.css` | CSS | Core 視窗結構樣式（可直接 `<link>`） |
| `styles/webos-desktop.css` | CSS | Desktop / Dock / Icon 樣式（可直接 `<link>`） |
| `styles/webos-layout.css` | CSS | BorderLayout / Panel 樣式（可直接 `<link>`） |
| `styles/webos-workspace.css` | CSS | Workspace 容器 / 滑入動畫 / 指示點（可直接 `<link>`） |
| `styles/webos-taskview.css` | CSS | TaskView 覆蓋層 / 卡片 / 縮略圖 / 按鈕（可直接 `<link>`） |

---

## 9. Demo 頁面索引

| Demo | 路徑 | 說明 |
|------|------|------|
| 首頁 | `demo/index.html` | 所有 Demo 入口卡片 |
| Vanilla JS | `demo/vanilla/index.html` | 純 JS，snap=true |
| jQuery | `demo/jquery/index.html` | UMD + jQuery CDN，5 個應用 |
| Desktop | `demo/desktop/index.html` | 完整虛擬桌面（Dock + Icons + WindowManager + BorderLayout 範例視窗） |
| Theme Editor | `demo/theme-editor/index.html` | Tab1 Core CSS 變數 / Tab2 Desktop CSS 變數 / Tab3 完整桌面預覽 + 雙 CSS 即時注入（core + desktop）+ Win11 預設樣式 |
| Layout | `demo/layout/index.html` | BorderLayout 東西南北中 + 巢狀 + Panel |
| Vue 3 | `demo/vue/` | useWindowManager composable，port 3008 |
| React 18 | `demo/react/` | useWindowManager hook + createPortal，port 3002 |
| Docs | `demo/docs/` | 開發手冊 Vue SPA，i18n EN/zh-TW，port 3002 |

---

## 10. 快速恢復步驟（重裝後）

```bash
# 1. 確認 Node.js 18+
node --version

# 2. 安裝根依賴
cd D:\Dropbox\新ERP框架開發\WebOS
npm install

# 3. 建置 Library
npm run build:lib

# 4. （選用）啟動 Vue Demo
cd demo/vue && npm install && npm run dev

# 5. （選用）啟動 React Demo
cd demo/react && npm install && npm run dev
```

