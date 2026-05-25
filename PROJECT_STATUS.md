# WebOS-Core — 專案狀態（AI 快查版）

> 最後更新：2026-05-25 17:01 ｜ 備份：`bak/PROJECT_STATUS.2026-05-25.md`
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
| light.css / dark.css（Core + Desktop 變數） | ✅ | `src/themes/*.css` |
| `setTheme()` 工具函式 | ✅ | `src/themes/setTheme.ts` |
| BorderLayout（5 區域 + 折疊 Strip） | ✅ | `src/layout/BorderLayout.ts` |
| Panel（可折疊標題面板） | ✅ | `src/layout/Panel.ts` |
| Desktop 桌面模組 | ✅ | `src/desktop/` |
| Vue 3 Composable | ✅ | `src/adapters/vue/useWindowManager.ts` |
| React 18 Hook | ✅ | `src/adapters/react/useWindowManager.ts` |
| Demo（vanilla / jQuery / Vue / React / Desktop / Theme Editor / Layout） | ✅ | `demo/` |
| Docs 開發手冊（Vue3 SPA，i18n EN/zh-TW，17 頁，含 WindowConfig 完整選項表） | ✅ | `demo/docs/` |

**尚未實作：**
- [ ] 工作區（虛擬桌面）多頁切換
- [ ] 視窗狀態序列化 / localStorage 還原
- [ ] CDN 發佈（jsDelivr / unpkg）

---

## 3. 目錄結構（精簡版）

```
WebOS/
├── src/
│   ├── index.ts                    ← Core 公開 Entry Point
│   ├── core/
│   │   ├── WindowManager.ts        ← 視窗生命週期（含 Snap 引導線、RWD Clamp）
│   │   ├── DragResizeHandler.ts    ← 拖曳/縮放（snapFn callback、throttle）
│   │   ├── SnapHelper.ts           ← Snap 吸附純函式（零 DOM 依賴）
│   │   ├── EventBus.ts
│   │   └── types.ts
│   ├── renderers/
│   │   └── DOMRenderer.ts          ← DOM 結構 + CSS 注入（全部色值用 var(--wos-*)）
│   ├── themes/
│   │   ├── light.css               ← 亮色（Core 15 vars + Desktop 7 vars）
│   │   ├── dark.css                ← 暗色（Core 15 vars + Desktop 7 vars）
│   │   └── setTheme.ts             ← setTheme(preset, options?)
│   ├── layout/
│   │   ├── BorderLayout.ts         ← 東西南北中五區域、可拖曳分割線、巢狀遞迴
│   │   └── Panel.ts                ← 可折疊標題+內容面板（data-panel 宣告式）
│   ├── desktop/
│   │   ├── index.ts                ← Desktop 公開 Entry Point
│   │   ├── Desktop.ts              ← 桌面主容器（icon 拖放、Snap、Sentinel、RWD）
│   │   ├── Dock.ts                 ← 快速啟動 Dock（HTML5 D&D 排序、active 指示）
│   │   ├── DesktopIcon.ts          ← 桌面圖示（dragThreshold、snapFn、localStorage）
│   │   ├── styles.ts               ← injectDesktopStyles()（含 --wos-desktop-* 變數）
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
│   ├── index.d.ts / webos-desktop.d.ts
│   └── themes/light.css, dark.css  ← build-themes.mjs 從 src/themes/ 複製
│
├── demo/
│   ├── index.html                  ← Demo 首頁
│   ├── shared/base.css             ← 共用 reset + header 樣式
│   ├── vanilla/index.html
│   ├── jquery/index.html
│   ├── desktop/index.html          ← 完整虛擬桌面體驗
│   ├── theme-editor/index.html     ← 🎨 Theme Editor（Core + Desktop 雙分頁，免建置）
│   ├── layout/index.html
│   ├── vue/                        ← 獨立 Vite 專案（port 3008）
│   ├── react/                      ← 獨立 Vite 專案（port 3002）
│   └── docs/                       ← 開發手冊 Vite SPA（port 3002）
│
├── scripts/
│   ├── build-themes.mjs            ← 複製 src/themes/ → dist/themes/ + demo/*/public/themes/
│   ├── clean.mjs                   ← 清除 dist/（含 Dropbox EBUSY retry）
│   └── pack-release.mjs            ← 打包 release/ 交付物
│
├── bak/                            ← 備份（不 commit）
├── rollup.lib.config.mjs
├── tsconfig.json / tsconfig.build.json
└── package.json
```

---

## 4. CSS 自訂屬性（完整 22 個）

### Core 視窗（15 個）— 來源：`src/renderers/DOMRenderer.ts`

| 變數 | 說明 | Light 預設 |
|------|------|-----------|
| `--wos-window-bg` | 視窗背景 | `#ffffff` |
| `--wos-header-bg` | 標題列背景 | `#f0f0f0` |
| `--wos-title-color` | 標題文字 | `#333333` |
| `--wos-border` | 視窗外框 | `#d0d0d0` |
| `--wos-border-active` | 作用中外框 | `#4a90e2` |
| `--wos-shadow` | 視窗陰影 | `0 2px 12px rgba(0,0,0,0.12)` |
| `--wos-shadow-active` | 作用中陰影 | `0 4px 24px rgba(0,0,0,0.22)` |
| `--wos-header-border` | 標題列底線 | `#e0e0e0` |
| `--wos-btn-color` | 按鈕圖示 | `#555555` |
| `--wos-btn-hover-bg` | 按鈕 hover 背景 | `rgba(0,0,0,0.08)` |
| `--wos-btn-close-hover-bg` | 關閉按鈕 hover 背景 | `#e53e3e` |
| `--wos-btn-close-hover-color` | 關閉按鈕 hover 文字 | `#ffffff` |
| `--wos-body-bg` | 視窗內容背景 | `#ffffff` |
| `--wos-body-color` | 視窗內容文字 | `#222222` |
| `--wos-snap-guide-color` | Snap 引導線 | `rgba(74,144,226,0.4)` |

### Desktop 模組（7 個）— 來源：`src/desktop/styles.ts`

| 變數 | 說明 | Light 預設 |
|------|------|-----------|
| `--wos-desktop-bg` | 桌面背景（支援 gradient） | `linear-gradient(135deg,#f0f4f8,#e2e8f0)` |
| `--wos-desktop-icon-text` | 桌面圖示文字 | `#1a202c` |
| `--wos-desktop-icon-hover-bg` | 圖示 hover 背景 | `rgba(0,0,0,0.08)` |
| `--wos-dock-bg` | Dock 背景（支援 rgba） | `rgba(255,255,255,0.75)` |
| `--wos-dock-border` | Dock 邊框（支援 rgba） | `rgba(0,0,0,0.10)` |
| `--wos-dock-item-hover-bg` | Dock 項目 hover 背景 | `rgba(0,0,0,0.06)` |
| `--wos-font` | 全域字體 | `system-ui,-apple-system,sans-serif` |

> **注意**：`rgba` / `linear-gradient` 型別的變數必須用 `type: 'text'`（非 color picker），否則 alpha 會被截掉。

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
// config: { id, title, content, x?, y?, width?, height?, resizable? }
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
desktop.syncDockWithWindows(wm)
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
| `index.d.ts` | TypeScript | Core 型別宣告 |
| `webos-desktop.d.ts` | TypeScript | Desktop 型別宣告 |
| `themes/light.css` | CSS | ~2 KB，Core + Desktop 22 vars |
| `themes/dark.css` | CSS | ~2 KB，Core + Desktop 22 vars |

---

## 9. Demo 頁面索引

| Demo | 路徑 | 說明 |
|------|------|------|
| 首頁 | `demo/index.html` | 所有 Demo 入口卡片 |
| Vanilla JS | `demo/vanilla/index.html` | 純 JS，snap=true |
| jQuery | `demo/jquery/index.html` | UMD + jQuery CDN，5 個應用 |
| Desktop | `demo/desktop/index.html` | 完整虛擬桌面（Dock + Icons + WindowManager + BorderLayout 範例視窗） |
| Theme Editor | `demo/theme-editor/index.html` | Core + Desktop 雙分頁，module banner，text 預覽色塊 |
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

