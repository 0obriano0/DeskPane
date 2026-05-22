# WebOS-Core — 專案狀態紀錄

> 最後更新：2026-05-22（BorderLayout 折疊 Strip UX 改版 + Theme Editor 加入 Layout 預覽）  
> 用途：電腦重裝 / VS Code 重裝後快速恢復開發環境

---

## 一、專案位置

```
D:\Dropbox\新ERP框架開發\WebOS\
```

> 專案放在 Dropbox，原始碼會自動同步，**重裝後直接開啟此資料夾即可**。

---

## 二、專案目標

打造一套 **框架無關（Framework-Agnostic）** 的網頁虛擬桌面視窗管理引擎。

- 核心只做「視窗調度大腦」，不綁定任何 UI 框架
- 支援：純 JS / jQuery / Vue 2·3 / React
- 內部業務元件由開發者自行接入（Wijmo、DevExpress、Element Plus 等）

---

## 三、整體目錄結構

```
WebOS/
├── src/                        ← 核心原始碼（TypeScript）
│   ├── index.ts                ← 公開 Entry Point（統一 export）
│   ├── core/
│   │   ├── types.ts            ← WindowState / WindowConfig / EventCallback
│   │   ├── WindowManager.ts    ← 核心大腦：視窗生命週期管理（含 Snap 引導線）
│   │   ├── EventBus.ts         ← 事件巴士
│   │   ├── DragResizeHandler.ts← 拖曳 / 縮放（含節流 + snapFn callback）
│   │   └── SnapHelper.ts       ← Snap 吸附計算（純函式，零 DOM 依賴）
│   ├── renderers/
│   │   └── DOMRenderer.ts      ← DOM 結構生成 + CSS 注入（所有色值使用 var(--wos-*)）
│   ├── themes/
│   │   ├── light.css           ← 亮色主題（14 個 :root CSS 自訂屬性）
│   │   ├── dark.css            ← 暗色主題（14 個 :root CSS 自訂屬性）
│   │   └── setTheme.ts         ← setTheme(preset, options?) 工具函式（管理 <link> 元素）
│   ├── layout/
│   │   ├── BorderLayout.ts     ← 東南西北中 五區域佈局（position:absolute，拖曳分割線，巢狀遞迴）
│   │   └── Panel.ts            ← 可折疊標題+內容面板（data-panel 宣告式）
│   └── adapters/
│       ├── vue/
│       │   ├── useWindowManager.ts  ← Vue 3 Composable
│       │   └── index.ts
│       └── react/
│           ├── useWindowManager.ts  ← React Hook（useRef + useState + useEffect）
│           └── index.ts
│
├── dist/                       ← 建置輸出（rollup build:lib 產生）
│   ├── webos-core.es.js        ← ES Module bundle (~23KB)
│   ├── webos-core.es.js.map    ← Source map
│   ├── webos-core.es.min.js    ← ES Module bundle（壓縮版 ~12KB）
│   ├── webos-core.umd.js       ← UMD bundle，window.WebOS (~26KB)
│   ├── webos-core.umd.js.map   ← Source map
│   ├── webos-core.umd.min.js   ← UMD bundle（壓縮版 ~12KB）
│   ├── index.d.ts              ← TypeScript 宣告
│   ├── index.d.ts.map
│   └── themes/                 ← 主題 CSS（build-themes.mjs 複製自 src/themes/）
│       ├── light.css
│       └── dark.css
│
├── demo/
│   ├── index.html              ← Demo 首頁（連結到各 demo）
│   ├── vanilla/
│   │   └── index.html          ← 純 JS Demo（Dock + 任務列 + 事件 Log）
│   ├── jquery/
│   │   └── index.html          ← jQuery Demo（UMD + jQuery CDN，5 個應用）
│   ├── vue/                    ← Vue 3 Demo（獨立 Vite 專案）
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   ├── public/
│   │   │   └── themes/         ← 主題 CSS（build-themes.mjs 複製）
│   │   └── src/
│   ├── react/                  ← React 18 Demo（獨立 Vite 專案）
│   │   ├── package.json
│   │   ├── vite.config.ts      ← port:3002，cacheDir→tmpdir（Dropbox 安全）
│   │   ├── tsconfig.json       ← jsx:react-jsx，paths: @webos + @types/react
│   │   ├── public/
│   │   │   └── themes/         ← 主題 CSS（build-themes.mjs 複製）
│   │   └── src/
│   │       ├── main.tsx        ← createRoot + StrictMode
│   │       ├── App.tsx         ← Dock + Taskbar + Event Log + createPortal
│   │       ├── App.css
│   │       └── windows/
│   │           ├── WelcomeApp.tsx
│   │           ├── TextEditor.tsx
│   │           ├── CounterApp.tsx
│   │           ├── TodoApp.tsx
│   │           └── FormApp.tsx
│   ├── theme-editor/
│   │   └── index.html          ← 🎨 Theme Editor（免建置單檔，可視化編輯 14 個 --wos-* CSS 變數 + 即時預覽 + 匯出 CSS）
│   ├── layout/
│   │   └── index.html          ← 📐 Layout Demo（BorderLayout 東南西北中 + 巢狀 + Panel，HTML-first 宣告）
│   └── docs/                   ← 開發手冊（Wijmo 風格，獨立 Vite + Vue 3）
│       ├── package.json
│       ├── vite.config.ts      ← port:3002，cacheDir→tmpdir（Dropbox 安全）
│       ├── tsconfig.json
│       └── src/
│           ├── App.vue         ← 3欄佈局（sidebar + main + code panel）
│           ├── nav-config.ts   ← 側欄導航設定
│           ├── components/
│           │   ├── SideNav.vue
│           │   ├── CodePanel.vue   ← highlight.js 語法高亮
│           │   └── DemoViewport.vue← iframe-like 隔離 demo 容器
│           ├── composables/
│           │   ├── useDocCode.ts   ← provide/inject 跨組件共享代碼面板
│           │   └── useLocale.ts    ← i18n provide/inject（EN / zh-TW）
│           ├── locales/
│           │   ├── en.ts           ← 英文翻譯字串（所有頁面）
│           │   └── zh-TW.ts        ← 繁體中文翻譯字串
│           └── pages/
│               ├── Overview.vue        ← 功能總覽 + API 表格
│               ├── Installation.vue    ← ES6/ES5 安裝說明
│               ├── QuickStart.vue      ← 最小範例
│               ├── OpenClose.vue       ← open/close API demo
│               ├── MinMaxRestore.vue   ← 最小化/最大化/還原 demo
│               ├── EventsPage.vue      ← 事件監聽 demo
│               ├── HelloWorld.vue      ← Vanilla JS Hello World
│               ├── DomContent.vue      ← DOM 內容注入 demo
│               ├── JqueryPage.vue      ← jQuery 整合說明 + 模式表格
│               ├── VueComposable.vue   ← useWindowManager + Teleport + KeepAlive
│               ├── VueKeepAlive.vue    ← KeepAlive 狀態保存 demo
│               └── ReactPage.vue       ← React Hook + createPortal 整合說明
│
├── scripts/
│   ├── clean.mjs               ← 清除 dist/（含 Dropbox EBUSY retry）
│   ├── build-themes.mjs        ← 複製 src/themes/*.css → dist/themes/ + demo/*/public/themes/
│   └── pack-release.mjs        ← 打包 release/ 給同事用
│
├── release/                    ← npm run release 產出（給同事的交付物）
│   └── webos-core-v0.1.0/
│       ├── dist/               ← ES + UMD + .d.ts
│       ├── package.json        ← 精簡版
│       └── README.md
│
├── README.md                   ← npm 套件說明文件（安裝 + API 快查）
├── LICENSE                     ← Apache 2.0 授權（Copyright 2026 Brian Cheng）
├── package.json                ← 根專案設定
├── tsconfig.json               ← TypeScript 設定
└── rollup.lib.config.mjs       ← Library 建置設定（ES + ES.min + UMD + UMD.min）
```

---

## 四、核心 API 速查

### WindowManager

```typescript
const wm = new WindowManager({
  container?: HTMLElement,  // 預設 document.body
  isolated?: boolean,       // true = position:absolute 限制在容器內
  throttleMs?: number,      // 預設 16ms (60fps)
  snap?: boolean,           // true = 啟用 Snap 吸附功能（預設 true）
  snapThreshold?: number,   // 吸附觸發距離 px（預設 20）
})

wm.open(config: WindowConfig)   // 開窗（id 存在則 restore+focus）
wm.close(id: string)
wm.minimize(id: string)
wm.maximize(id: string)
wm.restore(id: string)          // 解除最小/最大化
wm.focus(id: string)
wm.setTitle(id: string, title: string)  // 更新視窗標題列
wm.getState(id: string): WindowState | undefined
wm.getBodyElement(id: string): HTMLElement | undefined
wm.getWindowIds(): string[]     // 取得所有開啟中的視窗 ID
wm.destroy()                    // 銷毀所有視窗，移除 DOM
wm.events.on(event, callback)   // 訂閱事件
```

### WinEvent 事件清單

| 事件 | 觸發時機 |
|------|---------|
| `window:opened` | 開新視窗 |
| `window:closed` | 關閉視窗 |
| `window:focused` | 視窗獲得焦點 |
| `window:minimized` | 最小化 |
| `window:maximized` | 最大化 |
| `window:restored` | 還原 |
| `window:moved` | 拖曳結束 |
| `window:resized` | 縮放結束 |

---

## 五、建置 / 發布指令

### 根目錄（核心 Library）

```bash
cd D:\Dropbox\新ERP框架開發\WebOS

# 安裝依賴
npm install

# 型別檢查（不輸出 JS，需配合 build:lib 使用）
npm run build

# 清除 dist/（含自動 retry 處理 Dropbox 鎖定）
npm run clean

# 建置 ES + UMD bundle（輸出到 dist/）
npm run build:lib

# 清除 + 重建 + 打包給同事 → release/webos-core-vX.X.X/
npm run release
```

> ⚠️ Node.js 需求：根目錄用 **rollup**（Node 18 兼容）。  
> `rollup-plugin-dts` v6 在 Node 18 會顯示 EBADENGINE 警告，但**功能正常**。  
> docs/ 內的 Vite 需要 **Node 18+**（目前環境是 Node 18.15.0）。
> **注意**：`npm run build` 只做 `tsc --noEmit`（型別檢查），**不產生 JS 輸出**。
> 實際建置 dist/ 請用 `npm run build:lib`。

### 建置設定檔清單

| 檔案 | 用途 |
|------|------|
| `tsconfig.json` | 根專案 TypeScript 設定（type-check `src/core` + `src/renderers` + `src/index.ts`） |
| `rollup.lib.config.mjs` | Library 建置（ES + ES.min + UMD + UMD.min + .d.ts），peer deps `vue`/`react`/`react-dom` 為 external |
| `scripts/clean.mjs` | 清除 dist/（Dropbox retry 機制） |
| `scripts/build-themes.mjs` | 複製 `src/themes/*.css` 到 `dist/themes/` + `demo/vue/public/themes/` + `demo/react/public/themes/` |
| `scripts/pack-release.mjs` | 打包 release/ 交付資料夾 |

> **注意**：`src/adapters/` 的型別由各自 demo 的 tsconfig 負責（需 vue/react peer deps）。
> 根目錄 `tsc --noEmit` 不含 adapters。

```
release/webos-core-v0.1.0/
  dist/
    webos-core.es.js      ← ESM import 用（~23KB）
    webos-core.es.min.js  ← ESM 壓縮版（~12KB，生產環境推薦）
    webos-core.umd.js     ← script tag 用，window.WebOS（~26KB）
    webos-core.umd.min.js ← UMD 壓縮版（~12KB）
    index.d.ts            ← TypeScript 型別
  package.json
  README.md
```

壓縮 `release/webos-core-v0.1.0/` 資料夾交給同事即可。

### Demo Docs（開發手冊）

```bash
cd D:\Dropbox\新ERP框架開發\WebOS\demo\docs

# 安裝依賴
npm install

# 開發伺服器（http://localhost:3002）
npm run dev

# 型別檢查
npx vue-tsc --noEmit

# 建置
npm run build
```

### React Demo

```bash
cd D:\Dropbox\新ERP框架開發\WebOS\demo\react
npm install
npm run dev   # 預設 http://localhost:3002（若被占用自動遞增）
```

### Vue Demo

```bash
cd D:\Dropbox\新ERP框架開發\WebOS\demo\vue
npm install
npm run dev   # 預設 http://localhost:3008
```

---

## 六、重要技術決策紀錄

### 1. 建置工具選擇
- 根目錄使用 **Rollup**（非 Vite）打包 Library
  - 原因：Vite v8 需要 Node 20+，目前環境是 Node 18.15.0
  - Rollup 與 Node 版本無關，可直接 `npx rollup`

### 2. 窗口縮放 UX 修正
- **問題**：有卷軸時右下角難以拖曳縮放（鼠標容易點到卷軸）
- **解法**：`.wos-window` border 從 1px 改為 **4px**，邊框本身就是縮放把手
  - `resizeBorderPx` 預設值改為 **8**
  - 最大化時 `border-width: 0`（避免蓋到其他區域）
  - 曾試過加角落 overlay 元素（被拒絕，因為擋到卷軸下鍵）

### 3. Vite Dependency Scanner 陷阱
- Vue SFC `<script setup>` 內 template string 中的 `import ... from '...'`
  會被 Vite 掃描器當作真實依賴嘗試解析
- 修法：code example 字串中使用實際正確的 import 路徑

### 4. DragResizeHandler 型別問題
- `DragResizeOptions` 有可選欄位 `containerEl?: HTMLElement`
- 不能用 `Required<DragResizeOptions>`（會讓 `containerEl` 變成必填的 `HTMLElement`）
- 正確做法：`Required<Omit<DragResizeOptions, 'containerEl'>> & { containerEl?: HTMLElement }`

### 5. Vue 隔離模式座標計算
- 視窗使用 `position: fixed`（一般）或 `position: absolute`（isolated）
- `DragResizeHandler` 接受 `containerEl?`，拖曳/縮放座標減去容器的 `getBoundingClientRect()` offset
- `_getContainerRect()` 在無容器時回傳 `{left:0, top:0}`，同一公式兩種模式通用

### 6. Dropbox 同步 + Vite EBUSY 問題
- Vite 快取在 Dropbox 同步資料夾會出現 `EBUSY: resource busy or locked` 錯誤
- 修法：`vite.config.ts` 設定 `cacheDir: path.join(os.tmpdir(), 'vite-webos-docs')`

### 7. restore() 最大化狀態保留
- 最大化 → 最小化 → 點任務列 → 應恢復到最大化狀態（不是正常大小）
- `restore()` 判斷 `wasMaximized`：若是則只解除最小化，維持最大化

### 8. ES Module 作用域問題
- `type="module"` 有獨立作用域，`onclick=""` 找不到 window.*
- 修法：在 module 內用 `addEventListener` 直接綁定

### 9. npm release 打包流程
- `npm run release` = `clean` → `build:lib` → `pack-release.mjs`
- `scripts/clean.mjs`：清除 `dist/`，內建 5 次 retry（每次 800ms），解決 Dropbox EBUSY 鎖定問題
- `scripts/pack-release.mjs`：複製 `dist/` + `README.md` + 精簡版 `package.json` 到 `release/webos-core-vX.X.X/`
- `package.json` 加了 `"files": ["dist"]`，將來若 `npm publish` 只會上傳 `dist/`

### 10. 發布策略（目前）
- 暫不發布 npm
- 交付方式：`npm run release` → 壓縮 `release/webos-core-v0.1.0/` → 給同事
- 若未來要發布：`npm login` → `npm publish`（名稱 `webos-core` 需先確認未被佔用）

### 11. Docs 多國語言（i18n）
- Docs 站點支援 **EN / 繁體中文** 切換
- 輕量方案：`provide/inject`（無外部 i18n 套件）
  - `useLocale.ts`：提供 `provideLocale()` + `useLocale()` + `t(key)` 函式
  - `locales/en.ts` + `locales/zh-TW.ts`：扁平鍵值翻譯物件（~200 鍵）
  - `nav-config.ts` 改為 `getNavConfig(t)` 函式，App.vue 用 `computed` 驅動
  - App.vue header 加入語言切換按鈕（🌐 EN ↔ 中文）
  - 10 頁全部使用 `{{ t('key') }}` 或 `v-html="t('key')"`
- ⚠️ 陷阱：根元件（App.vue）不可同時呼叫 `provideLocale()` 再呼叫 `useLocale()`
  - Vue 3 的 `inject` 只能從**祖先**取，自己 provide 自己 inject 會得到 `undefined`
  - 修法：`provideLocale()` 直接回傳 `{ locale, t }`，App.vue 不再呼叫 `useLocale()`

### 12. maximize 狀態機 Bug 修正
- **問題**：Minimize → Maximize → Minimize → 再點 Maximize 完全無反應
- **根因**：`maximize()` 開頭 `if (win.state.isMaximized) return`
  - 視窗在最大化狀態下被最小化後，`isMaximized` 仍為 `true`
  - 再次點 Maximize 被 early-return，視窗永遠無法顯示
- **修法**：`maximize()` 改為：
  ```typescript
  if (win.state.isMaximized) {
    if (win.state.isMinimized) this.restore(id); // 已最大化但被藏 → 還原顯示
    return;
  }
  ```
- 影響檔案：`src/core/WindowManager.ts`（需重新 `npm run build:lib`）

### 13. jQuery 整合支援
- 新增 `demo/jquery/index.html` — 完整 jQuery 桌面 Demo
  - 載入方式：UMD bundle + jQuery 3.7 CDN（無需建置工具）
  - 5 個示範應用：文字編輯器、表單驗證、即時搜尋、摺疊面板、資料表格
  - 相同的 Dock + 任務列 + 事件 Log 佈局
- `demo/index.html` 新增 jQuery 卡片入口 💙
- `demo/docs` 新增 `JqueryPage.vue` 文件頁（Vanilla JS 分類下）
  - 模式 1：`$('<div>')[0]` 作為 `content:` 傳入
  - 模式 2：`$(wm.getBodyElement(id)).plugin()` 附加外掛
  - 模式 3：`wm.events.on('window:opened', ...)` 延遲初始化
- i18n locales 新增 `nav.jquery` + 所有 `jquery.*` 鍵

### 14. React 包裝層設計
- **Hook**：`src/adapters/react/useWindowManager.ts`
  - `useRef` 保存 WM 實例（不因 re-render 重建）
  - `useState` 存放 `ReactWindowEntry[]` → 觸發 re-render
  - `useEffect` 訂閱 6 個 WinEvent；cleanup 呼叫 `wm.destroy()`
  - `infoRef`（`useRef<Map>`）儲存元件/props 對應，不觸發渲染
  - 所有回傳方法用 `useCallback` 包裝
- **元件渲染**：`createPortal(<Component />, win.bodyEl, win.id)` 掛載到核心 DOM
  - 第三個參數 `win.id` 作為 portal key（React 18+）
- **狀態保留**：body element 停留在 DOM（display:none 隱藏），元件永不 unmount，無需 KeepAlive
- **tsconfig 技巧**：paths 加入 `"react": ["./node_modules/@types/react"]` 讓外部 adapter 檔案 tsc 可找到型別
- **StrictMode 注意**：dev 模式雙重 effect 會 destroy+recreate WM，demo 可接受

### 15. 2026-05 重構紀錄
#### 清除死碼
- 刪除 `vite.lib.config.ts`（早期 Vite 建置設定，已改用 Rollup）
- 移除 `package.json` 死腳本 `"demo:build"`（引用不存在的 `scripts/bundle-demo.js`）
- 移除 root devDependencies：`vite ^8.0.13` 和 `vite-plugin-dts ^5.0.1`（改用 rollup 後未清除）

#### Build 腳本修正
- `"build"` 改為 `"tsc --noEmit"`（型別檢查），`"build:watch"` 改為 `"tsc --noEmit --watch"`
  - 原 `"build": "tsc"` 會把 JS 輸出到 `dist/`，與 rollup 的 `dist/webos-core.es.js` 衝突
- `rollup.lib.config.mjs` externals 加入 `'react'` + `'react-dom'`（保護未來 adapter 合併）
- `rollup.lib.config.mjs` typescript plugin 明確加入 `declarationMap: false`（避免 TS5069 警告）

#### TypeScript 設定現代化
- `tsconfig.json` `"target"`: ES2017 → **ES2020**（與 demo 子專案一致）
- `tsconfig.json` `"module"`: ES2020 → **ESNext**（配合 bundler resolution）
- `tsconfig.json` `"moduleResolution"`: node → **bundler**（TypeScript 5 推薦）
- `tsconfig.json` 加入 `"skipLibCheck": true`（加速建置）
- `tsconfig.json` `"exclude"` 加入 `"src/adapters"`
  - adapters 依賴 vue/react peer deps，root 未安裝；adapter 型別由各 demo 的 tsconfig 負責檢查
  - demo/react tsconfig 有 `"paths": { "@webos/*": ["../../src/*"] }` 會 include 並型別檢查 adapters

#### 原始碼修正
- `src/core/WindowManager.ts`：`_focusTopWindow()` 重構消除不必要的 `as ManagedWindow` 型別強轉
  - 改為追蹤 `topId: string | null`，再從 Map 取 win，TypeScript 控制流推斷正常
- `src/adapters/react/useWindowManager.ts`：`React.ComponentType<any>` → 具名匯入 `ComponentType<any>`
  - 原本未匯入 React 命名空間，直接使用 `React.ComponentType` 在 strict 環境下不穩定



#### 本次重構影響的重要檔案

| 檔案 | 說明 |
|------|------|
| `README.md` | npm 套件說明（安裝 + API + ESM/UMD 範例） |
| `rollup.lib.config.mjs` | Rollup library 建置設定（ES + UMD + .d.ts） |
| `scripts/clean.mjs` | 清除 dist/，含 Dropbox EBUSY 自動 retry |
| `scripts/pack-release.mjs` | 打包 release/ 交付資料夾 |
| `demo/docs/src/pages/Installation.vue` | Docs 安裝說明頁（ES6/ES5 tab 切換） |
| `demo/docs/src/composables/useLocale.ts` | i18n composable（provide/inject） |
| `demo/docs/src/locales/en.ts` | 英文翻譯字串（~200 鍵） |
| `demo/docs/src/locales/zh-TW.ts` | 繁體中文翻譯字串（~200 鍵） |
| `demo/jquery/index.html` | jQuery 全桌面 Demo（UMD + jQuery CDN） |
| `demo/react/src/App.tsx` | React 桌面 Demo（Dock + Taskbar + createPortal） |
| `src/adapters/react/useWindowManager.ts` | React Hook 包裝層 |
| `demo/docs/src/pages/ReactPage.vue` | Docs React 整合說明頁 |
| `demo/docs/src/pages/JqueryPage.vue` | Docs jQuery 整合說明頁 |
| `PROJECT_STATUS.md` | 本文件 |

### 16. 2026-05-21 授權 + 文件更新

#### 授權從 MIT 改為 Apache 2.0
- 新增 `LICENSE`：完整 Apache 2.0 條文，`Copyright 2026 Brian Cheng`
- `package.json` `"license"` 欄位：`"MIT"` → `"Apache-2.0"`
- `README.md` badge 連結改為 `Apache-2.0` badge

**Apache 2.0 vs MIT 差異重點**：
- ✅ 同樣允許商業使用、修改後不開源
- 🛡️ 多了**明確專利授權條款**：貢獻者對你的程式碼授予專利使用權
- 🛡️ **專利報復條款**：對方使用此程式碼後對你提起專利訴訟，其授權自動終止
- 📌 使用者義務：保留版權聲明、保留 LICENSE 檔、標示修改之處

#### README.md 全面更新
- React 18 adapter 狀態：`⬜ planned` → `✅ 完成`
- 新增 React `useWindowManager` hook 完整使用範例（`createPortal`）
- 更新 Vue 3 範例為 `openVueWindow()` 新 API
- 新增 Vue 3 / React adapter 回傳值說明表格
- API 表格補入 `setTitle()` + `getWindowIds()`
- `WindowConfig` 補入 `slotType?: 'dom' | 'vue' | 'react'`
- `npm run build` 說明修正（型別檢查，不產生輸出）
- Browser support：ES2017 → ES2020
- License 頁尾：MIT → Apache-2.0 © 2026 Brian Cheng

### 17. 2026-05-21 壓縮版建置輸出 + Docs 修正

#### 壓縮版建置輸出
- 安裝 `@rollup/plugin-terser@0.4.4`
- `rollup.lib.config.mjs` 加入第二個建置 pass（啟用 `terser()`，關閉 sourcemap）
- 新增輸出：
  - `dist/webos-core.es.min.js`（~12KB，原版 ~23KB）
  - `dist/webos-core.umd.min.js`（~12KB，原版 ~26KB）
- `npm run build:lib` 一次產出全部 4 個 bundle + `index.d.ts`

#### Docs 修正（stale content）
- `Overview.vue`：React adapter `⬜` → `✅`；`slotType` 補 `'react'`；build cmd 說明修正
- `Installation.vue`：Vue 3 code panel 改為 `openVueWindow()` 新 API
- `VueComposable.vue` + `ReactPage.vue`：proxy methods row 補入 `setTitle`
- `en.ts` + `zh-TW.ts`：`ret.proxies`、`install.esm.intro`、`h3Step4` 均補入 React / setTitle 資訊



| ID | 頁面 | 分類 |
|----|------|------|
| `overview` | Overview | Getting Started |
| `installation` | Installation（ES6/ES5 說明）| Getting Started |
| `quick-start` | Quick Start | Getting Started |
| `open-close` | open / close | Core API |
| `min-max` | minimize / maximize | Core API |
| `events` | Events | Core API |
| `hello-world` | Hello World | Vanilla JS |
| `dom-content` | DOM Content | Vanilla JS |
| `jquery` | jQuery Integration | Vanilla JS |
| `vue-composable` | useWindowManager | Vue 3 |
| `vue-keepalive` | Keep-Alive State | Vue 3 |
| `react` | useWindowManager (React hook) | React |

### 18. 2026-05-21 Snap 吸附功能 + Demo 更新

#### Snap 吸附功能實作

- 新增 `src/core/SnapHelper.ts`：純函式模組（零 DOM 依賴，易於單元測試）
  - `snapPosition(drag, containerSize, others, threshold)` → `SnapResult`
  - 檢查拖曳視窗四邊與容器邊界及其他視窗邊緣的距離
  - 回傳吸附後的 `{ x, y }` 以及參考線描述 `guides[]`
- `src/core/DragResizeHandler.ts`：新增 `snapFn?` callback
  - `_handleMove` 中套用 snapFn，取得吸附後座標再更新位置
- `src/core/WindowManager.ts`：新增 snap 配置與引導線管理
  - `WindowManagerOptions` 新增 `snap?`（預設 `true`）、`snapThreshold?`（預設 20）
  - 私有方法：`_ensureGuides()`（懶建立）、`_updateSnapGuides()`、`_hideSnapGuides()`
  - `open()` 中串接 snapFn 與 onDragEnd（結束拖曳隱藏引導線）
  - `destroy()` 移除引導線 DOM 節點
- `src/renderers/DOMRenderer.ts`：CSS 新增 `.wos-snap-guide`、`.wos-snap-guide--v`、`.wos-snap-guide--h`
  - `position:absolute`、`pointer-events:none`、`z-index:2147483647`、預設 `display:none`
- `src/index.ts`：export `SnapRect`、`SnapGuide`、`SnapResult`（型別）與 `snapPosition`（函式）
- 建置確認：`npm run build` (tsc --noEmit) ✅、`npm run build:lib` (4 bundles) ✅

#### Demo 全面更新

- **vanilla**：`WindowManager({ snap: true })`、Welcome 視窗加入「Snap 吸附」項目
- **jquery**：`WindowManager({ snap: true })`、Accordion 新增「🧲 Snap 吸附功能」FAQ、React 狀態更正
- **vue**：`useWindowManager({ snap: true })`、WelcomeApp 加入 Snap 項目
- **react**：`useWindowManager({ snap: true })`、WelcomeApp 加入 Snap 項目

#### Snap 技術細節

| 項目 | 說明 |
|------|------|
| 吸附閾值 | 預設 20px，可透過 `snapThreshold` 調整 |
| 吸附目標 | 容器四邊 + 其他所有非最小化/非最大化視窗的邊緣 |
| 引導線懶建立 | 首次拖曳時才建立 DOM 節點，不提早污染 DOM |
| 非 isolated 模式 | 容器大小使用 `window.innerWidth/Height` |
| Snap 關閉 | `new WindowManager({ snap: false })` |

### 19. 2026-05-21 Docs 工具鏈升級

#### Vite 5 → 6 升級（demo/docs）

- `demo/docs/package.json` 更新：
  - `vite`: `^5.0.0` → `^6.0.0`
  - `@vitejs/plugin-vue`: `^5.0.0` → `^5.2.0`（Vite 6 相容版本）
- 本機 build 驗證通過（`npm run build` ✅）

#### TypeScript 設定改進（demo/docs）

- `demo/docs/tsconfig.json` 新增 `"skipLibCheck": true`
  - 跳過 `node_modules` 中第三方套件的 `.d.ts` 型別檢查
  - 避免外部套件型別聲明不完整導致 `vue-tsc` 報錯
  - 根目錄 `tsconfig.json` 早已有此設定，docs 補齊一致

---

### 20. 2026-05-21 UI 主題切換功能

#### 架構設計

- **主題完全由純 CSS 負責，與 JS bundle 完全獨立**
- `src/themes/light.css` + `src/themes/dark.css`：定義 14 個 `:root` CSS 自訂屬性
- `src/renderers/DOMRenderer.ts`：所有色值改為 `var(--wos-*, fallback)` 格式
  - fallback 值 = 亮色主題預設值，不載入任何主題 CSS 也能正常顯示（亮色）
- `scripts/build-themes.mjs`：複製 `src/themes/` → `dist/themes/`
- `package.json` `build:lib` 加入 `&& node scripts/build-themes.mjs`

#### 建置輸出

```
dist/
├── webos-core.es.js / .min.js    ← JS bundle（不含任何主題色）
├── webos-core.umd.js / .min.js   ← UMD bundle
├── index.d.ts
└── themes/                       ← 主題資料夾（獨立）
    ├── light.css
    └── dark.css
```

| 變數 | 說明 |
|------|------|
| `--wos-border` | 視窗外框顏色 |
| `--wos-border-active` | 作用中視窗外框顏色 |
| `--wos-shadow` | 視窗陰影 |
| `--wos-shadow-active` | 作用中視窗陰影 |
| `--wos-window-bg` | 視窗外層背景 |
| `--wos-header-bg` | 標題列背景 |
| `--wos-header-border` | 標題列底線顏色 |
| `--wos-title-color` | 標題文字顏色 |
| `--wos-btn-color` | 按鈕圖示顏色 |
| `--wos-btn-hover-bg` | 按鈕 hover 背景 |
| `--wos-btn-close-hover-bg` | 關閉按鈕 hover 背景 |
| `--wos-btn-close-hover-color` | 關閉按鈕 hover 文字 |
| `--wos-body-bg` | 內容區背景 |
| `--wos-snap-guide-color` | Snap 引導線顏色 |

#### `setTheme()` 工具函式

- `src/themes/setTheme.ts` → 隨主 bundle 一起 export（ESM + UMD）
  - 自動建立 `<link id="wos-theme">` 並插入 `<head>`（若不存在）
  - 僅在 href 改變時才更新（避免不必要的 CSS 重新載入）
  - `basePath` 預設 `'themes'`（Vite SPA 用 `'/themes'`；UMD 相對路徑視情況）
  - `linkId` 預設 `'wos-theme'`（可自訂以支援多主題實例）

```typescript
import { setTheme } from 'webos-core'
setTheme('dark')                                    // 使用預設 basePath
setTheme('light', { basePath: '/themes' })          // Vite SPA
setTheme('dark',  { basePath: '../../dist/themes' }) // 相對路徑（pure HTML）
```

UMD：
```javascript
WebOS.setTheme('dark', { basePath: '../../dist/themes' })
```

#### 建置輸出

```
dist/
├── webos-core.es.js / .min.js    ← JS bundle（不含任何主題色）
├── webos-core.umd.js / .min.js   ← UMD bundle
├── index.d.ts
└── themes/                       ← 主題資料夾（獨立）
    ├── light.css
    └── dark.css
```

`scripts/build-themes.mjs`：一次複製到三個目標
- `dist/themes/`
- `demo/vue/public/themes/`
- `demo/react/public/themes/`

#### Demo 全面更新

| Demo | 主題載入方式 | 切換方式 |
|------|-------------|---------|
| vanilla | `<link id="wos-theme">` 預設亮色 | ☀️/🌙 Dock 按鈕，`setTheme('dark', { basePath: '../../dist/themes' })` |
| jquery | `<link id="wos-theme">` 預設亮色 | ☀️/🌙 Dock 按鈕，`WebOS.setTheme()` |
| vue | `setTheme('light', { basePath: '/themes' })` 初始化 | 🌙/☀️ 切換 Dock 按鈕，`currentTheme` 響應式狀態 |
| react | `setTheme` 初始調用 | 🌙/☀️ Dock 按鈕，`useState` + `useCallback` |

> ⚠️ **已修正**：jQuery demo 中插入主題按鈕時，`edit` 操作意外截斷了 `$('#app-dock').on('click', '.dock-item[data-app]', ...)` 開頭，導致 Dock 點擊完全失效。已還原完整事件綁定。

---

### 21. 2026-05-22 主題設計編輯器 (Theme Editor)

#### 功能總覽

- 新增 `demo/theme-editor/index.html`（單一 HTML 檔案，免 Node / 免建置工具）
- 載入 `../../dist/webos-core.umd.js`，直接使用現有 UMD bundle
- 支援視覺化編輯全部 14 個 `--wos-*` CSS 變數：
  - hex 色彩變數（11 個）：`<input type="color">` + hex 文字輸入**雙向同步**
  - shadow / rgba 複雜值（3 個）：純文字 `<input>` 直接編輯
- 即時預覽：`document.documentElement.style.setProperty()` 直接修改 `:root` CSS 變數，WebOS 示範視窗即時反應
- Light / Dark 預設按鈕：一鍵套用預設值，同步更新所有輸入控制項
- 匯出 CSS：生成 `:root { }` 格式字串，提供「複製到剪貼簿」＋「下載 .css 檔案」
- 背景切換：深色 / 深色格線 / 淺色三種預覽背景
- 已更新 `demo/index.html`，加入 🎨 Theme Editor 入口卡片
- **2026-05-22 更新**：新增第三個預覽視窗「📐 BorderLayout 示範」（North/West/East/South/Center 五區域，可折疊，帶圖示），讓使用者直接在 Theme Editor 中看到 layout region header 的樣式隨 CSS 變數即時更新

#### 技術細節

| 項目 | 說明 |
|------|------|
| 免建置 | 純 HTML + 原生 JS，直接用瀏覽器開啟或 HTTP Server 均可 |
| 雙向同步 | color picker 改色 → 更新 hex text input；hex text 輸入 → blur 時 normalize |
| CSS 即時反映 | `document.documentElement.style.setProperty(name, value)` 覆寫 `:root` |
| 預覽視窗 | `WindowManager({ isolated: true, snap: false })`，開兩個示範視窗 |
| 匯出格式 | `:root { --wos-xxx: value; }` 標準 CSS，可直接取代 `dist/themes/*.css` |

---

### 22. 2026-05-22 BorderLayout / Panel 元件（HTML-first 佈局宣告）

#### 功能總覽

- 新增 `src/layout/BorderLayout.ts`：東南西北中五區域佈局管理
  - HTML-first 宣告：在 `data-region` 子元素上設定屬性，`wm.open()` 自動偵測並渲染
  - `position: absolute` 精確座標計算，各 region 零縫隙排列
  - 分割線（splitter）可拖曳調整 N/S/E/W 尺寸，尊重 `data-min-size`
  - 折疊按鈕嵌入分割線（▶◀▲▼，依 region 方向自動切換）
  - 可選標題列（`data-title`）：`.wos-region-header`（28px）+ `.wos-region-body`
  - `ResizeObserver` 監聽容器大小變化，自動重算座標
  - 巢狀遞迴：任意 region 的 body 若含 `[data-region]` 子元素，自動建立子 `BorderLayout`
  - CSS 完全使用 `var(--wos-*)` 變數，繼承當前主題
- 新增 `src/layout/Panel.ts`：可折疊標題+內容面板
  - `data-panel` 屬性 + `data-panel-title` / `data-collapsible` / `data-collapsed` 宣告
  - `wm.open()` 自動偵測並將 body 轉為 Panel 容器
- **`src/core/WindowManager.ts`** 自動偵測整合：
  - `open()` 後偵測 content 子元素：有 `[data-region]` → `BorderLayout`；有 `data-panel` → `Panel`
  - 子元素搬移至 `elements.body`，`elements.body` 加入 `.wos-has-layout`
  - 儲存於 `_layouts: Map<string, BorderLayout | Panel>`
  - `close()` / `destroy()` 自動呼叫 `layout.destroy()`
- **`src/renderers/DOMRenderer.ts`** 新增 `.wos-body.wos-has-layout { overflow: hidden }`
- **`src/index.ts`** 新增 `BorderLayout` / `Panel` 及其 TypeScript 型別 export

#### HTML-first 宣告 API

| 屬性 | 用途 |
|------|------|
| `data-region="north\|south\|east\|west\|center"` | 宣告區域方向 |
| `data-size="200"` | E/W 寬度 或 N/S 高度（px） |
| `data-min-size="50"` | 最小拖曳限制（px） |
| `data-collapsible` | 允許折疊（presence flag） |
| `data-collapsed` | 初始折疊狀態 |
| `data-title="Label"` | 顯示 region 標題列 |
| `data-icon="🔧"` | Region 圖示（emoji 或文字），顯示在標題前 |
| `data-panel-title="..."` | Panel 標題文字 |

預設大小：north/south 分別 48/120px（min 24px）；east/west 200px（min 60px）；center 填滿剩餘空間。

#### 使用範例

```html
<!-- HTML-first 宣告（wm.open() 自動渲染） -->
<script>
  const content = document.createElement('div');
  // north
  const n = document.createElement('div');
  n.dataset.region = 'north';
  n.dataset.size   = '40';
  n.dataset.title  = '工具列';
  content.appendChild(n);
  // ... west / center / east / south 同理

  wm.open({ title: '我的應用', width: 800, height: 600, content });
</script>
```

#### 技術細節

| 項目 | 說明 |
|------|------|
| 座標計算 | `position: absolute` 精確像素，center 填滿剩餘 |
| 分割線折疊 | 折疊按鈕嵌入 splitter DOM；折疊時 size → 0，展開還原 |
| 巢狀支援 | `_initChildLayouts()` 遞迴偵測，`_childLayouts[]` 統一 destroy |
| CSS 注入 | 一次注入（`LAYOUT_STYLE_ID` sentinel），不重複 `<style>` |
| 主題繼承 | 全部色值使用 `var(--wos-*)` fallback |

---

### 23. 2026-05-22 BorderLayout 折疊 Strip UX 改版

#### 問題
折疊後 region 寬/高設為 0px，整個面板消失，無法重新展開。

#### 解決方案：EasyUI 風格 Mini Strip

折疊後改為顯示 **28px（`headerSize`）寬/高的迷你條帶**，包含展開按鈕、圖示、旋轉標題。

| 元素 | 位置 | 說明 |
|------|------|------|
| 展開按鈕 | 最上方（`order: 0`） | 全寬 36px 高，字體 14px，明顯可點擊 |
| 圖示 | 按鈕下方（`order: 1`） | `data-icon` 設定，字體 15px |
| 標題 | 最下方（`order: 2`） | `writing-mode: vertical-lr; transform: rotate(180deg)` 旋轉顯示 |

#### 技術細節

- `_applyLayout()`：折疊時使用 `headerSize`（28px）取代 0，保留 strip 空間
- `.wos-layout-region--collapsed` CSS class：
  - `body { display: none }` 隱藏內容
  - W/E 折疊時：header `position: absolute; inset: 0; flex-direction: column`，佔滿整條 strip
  - 按鈕 `border-bottom` 分隔線取代原本的 `border-left`
- 初始折疊（`data-collapsed`）和 `toggleCollapse()` 均同步 `.wos-layout-region--collapsed` class
- 拖曳保護：`_startDrag()` 在 `state.collapsed` 時直接 return，避免折疊狀態下誤觸 splitter

#### 影響檔案

| 檔案 | 變更 |
|------|------|
| `src/layout/BorderLayout.ts` | collapsed strip CSS、`_applyLayout()` 折疊尺寸邏輯、`toggleCollapse()` + 初始化加 CSS class、`_startDrag()` 折疊保護 |

---

## 九、待開發功能（Roadmap）

- [x] **React 包裝層** ✅ `src/adapters/react/` + `demo/react/` + Docs `ReactPage.vue`
- [x] **jQuery 整合範例** ✅ `demo/jquery/index.html` + Docs `JqueryPage.vue`
- [x] **視窗 Snap 吸附功能** ✅ `src/core/SnapHelper.ts` + `WindowManager` + 全 demo 更新
- [x] **UI 主題切換** ✅ `src/themes/*.css` → `dist/themes/` 純 CSS 獨立輸出；`setTheme()` 工具函式隨 bundle export；全 4 個 Demo 均已整合（Vanilla / jQuery / Vue / React）
- [x] **主題設計編輯器** ✅ `demo/theme-editor/index.html`（免建置單檔）；14 個 `--wos-*` 變數可視化編輯；color picker + hex 輸入雙向同步；shadow/rgba 文字輸入；即時預覽（WebOS UMD）；Light/Dark 預設切換；匯出 CSS（複製 / 下載）
- [x] **BorderLayout / Panel 佈局元件** ✅ `src/layout/BorderLayout.ts` + `src/layout/Panel.ts`；HTML-first `data-region` / `data-panel` 宣告；`wm.open()` 自動偵測渲染；巢狀遞迴；可拖曳分割線 + 折疊；`demo/layout/index.html`；EasyUI 風格折疊 strip（展開按鈕在上 → 圖示 → 旋轉標題）；`demo/vanilla` + `demo/jquery` 均含 Layout 示範
- [ ] **工作區（虛擬桌面）多頁切換**
- [ ] **視窗狀態序列化 / 還原**（localStorage）
- [ ] **Docs 補充**：Snap / 主題 / 工作區功能頁面
- [ ] **CDN 發佈**（考慮 jsDelivr / unpkg）

---

## 十、重裝後快速恢復步驟

### 環境要求
- **Node.js 18+**（目前 18.15.0，docs 的 Vite 5 需要 18+）
- **VS Code** 最新版
- 推薦擴充套件：Vue - Official、TypeScript Vue Plugin

### 步驟

```bash
# 1. 進入專案（Dropbox 已同步，直接開啟）
cd D:\Dropbox\新ERP框架開發\WebOS

# 2. 安裝根依賴
npm install

# 3. 安裝 docs 依賴
cd demo\docs && npm install && cd ..\..

# 4. 安裝 vue demo 依賴
cd demo\vue && npm install && cd ..\..

# 5. 安裝 react demo 依賴
cd demo\react && npm install && cd ..\..

# 6. 建置 Library（確認 dist/ 是最新的）
npm run build:lib

# 7. 啟動 Docs 開發伺服器
cd demo\docs && npm run dev
# → http://localhost:3008

# 8. 啟動 Vue Demo（另一個終端）
cd demo\vue && npm run dev
# → http://localhost:3001

# 9. 啟動 React Demo（另一個終端）
cd demo\react && npm run dev
# → http://localhost:3002
```

---

## 十一、VS Code 推薦設定

```json
// .vscode/settings.json（建議建立）
{
  "typescript.tsdk": "node_modules/typescript/lib",
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "vue.server.hybridMode": true
}
```

推薦擴充套件 ID：
- `Vue.volar` — Vue - Official
- `esbenp.prettier-vscode` — Prettier
- `dbaeumer.vscode-eslint` — ESLint（選用）
