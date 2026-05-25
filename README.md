# WebOS-Core

A **framework-agnostic** web virtual desktop window management engine.

[![license](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)

---

## Features

- ✅ Open / close / minimize / maximize / restore windows
- ✅ Drag & resize with throttling (60 fps default)
- ✅ **Snap alignment** — windows snap to edges and each other while **dragging and resizing**; configurable gap between windows
- ✅ Focus / z-order management
- ✅ Event bus — subscribe to any window lifecycle event
- ✅ Isolated mode — embed a desktop inside any container element
- ✅ **RWD viewport clamping** — windows auto-clamp via `ResizeObserver`; never open off-screen
- ✅ **Theme system** — light/dark CSS themes with 22 CSS custom properties; `setTheme()` runtime switching
- ✅ **BorderLayout** — N/S/E/W/Center docking layout; `data-region` HTML-first declaration; collapsible mini strip; draggable splitters; nested layouts
- ✅ **Desktop module** (`webos-desktop`) — virtual desktop with icons, Dock, active indicator, icon snap, RWD scrollable icon area
- ✅ Vue 3 adapter — `useWindowManager` composable + `<Teleport>` support
- ✅ React 18 adapter — `useWindowManager` hook + `createPortal` support
- ✅ ES Module + UMD builds — bundlers or plain `<script>` tags

---

## Installation

### npm

```bash
npm install webos-core
```

### Script Tag (UMD, no build step)

```html
<script src="dist/webos-core.umd.js"></script>
<!-- window.WebOS is now available -->
```

---

## Quick Start

### ES Module

```typescript
import { WindowManager } from 'webos-core'

const wm = new WindowManager({
  container: document.getElementById('desktop')!,
  isolated: true,
})

const el = document.createElement('div')
el.innerHTML = '<p style="padding:20px">Hello, World!</p>'

wm.open({ id: 'hello', title: 'My Window', content: el })
```

### Script Tag (UMD)

```html
<div id="desktop" style="width:100vw; height:100vh; position:relative;"></div>
<script src="dist/webos-core.umd.js"></script>
<script>
  var wm = new window.WebOS.WindowManager({
    container: document.getElementById('desktop'),
    isolated: true
  })
  var el = document.createElement('div')
  el.textContent = 'Hello from UMD!'
  wm.open({ id: 'hello', title: 'My Window', content: el })
</script>
```

### Vue 3

```vue
<template>
  <div ref="desktopEl" class="desktop">
    <button @click="openVueWindow({ id: 'w1', title: 'My Window', component: MyComp })">
      Open Window
    </button>
    <Teleport v-for="win in windows" :key="win.id" :to="win.bodyEl">
      <component :is="win.component" v-bind="win.props ?? {}" />
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { useWindowManager } from '@webos/adapters/vue/useWindowManager'
import MyComp from './MyComp.vue'

const { windows, openVueWindow } = useWindowManager()
</script>
```

### React 18

```tsx
import { createPortal } from 'react-dom'
import { useWindowManager } from '@webos/adapters/react/useWindowManager'
import MyComp from './MyComp'

export default function App() {
  const { windows, openReactWindow } = useWindowManager()

  return (
    <div className="desktop">
      <button onClick={() => openReactWindow({ id: 'w1', title: 'My Window', component: MyComp })}>
        Open Window
      </button>
      {windows.map(win =>
        win.component
          ? createPortal(<win.component {...(win.props ?? {})} />, win.bodyEl)
          : null
      )}
    </div>
  )
}
```

---

## API Reference

### `new WindowManager(options?)`

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `container` | `HTMLElement` | `document.body` | Desktop container element |
| `isolated` | `boolean` | `false` | Constrain windows to container (`position: absolute`) |
| `throttleMs` | `number` | `16` | Drag/resize throttle interval (ms) |
| `snap` | `boolean` | `true` | Enable snap alignment while dragging **and resizing** |
| `snapThreshold` | `number` | `20` | Snap trigger distance (px) |
| `snapGap` | `number` | `0` | Gap between windows when snapping (px). Container edges are not affected. |

> **RWD**: Automatically monitors container size via `ResizeObserver` and clamps all windows back into view when the viewport shrinks.

### Methods

| Method | Description |
|--------|-------------|
| `wm.open(config)` | Open a window (restores & focuses if ID already exists) |
| `wm.close(id)` | Close and remove a window |
| `wm.minimize(id)` | Minimize a window |
| `wm.maximize(id)` | Maximize a window |
| `wm.restore(id)` | Restore from minimized or maximized |
| `wm.focus(id)` | Bring window to front |
| `wm.setTitle(id, title)` | Update the window title bar |
| `wm.setSnapGap(gap)` | Dynamically update the window-to-window snap gap (px) |
| `wm.getState(id)` | Get current `WindowState` |
| `wm.getBodyElement(id)` | Get the window's content `HTMLElement` |
| `wm.getWindowIds()` | Get all open window IDs |
| `wm.destroy()` | Destroy all windows and clean up DOM |

### `WindowConfig`

```typescript
interface WindowConfig {
  id:        string    // Unique window ID (required)
  title:     string    // Window title bar text
  content:   any       // HTMLElement, or null when using framework adapters
  x?:        number    // Initial X position (px)
  y?:        number    // Initial Y position (px)
  width?:    number    // Initial width (px), default 640
  height?:   number    // Initial height (px), default 480
  props?:    Record<string, unknown>
  slotType?: 'dom' | 'vue' | 'react'
}
```

### Events

```typescript
wm.events.on('window:opened',    (state) => { })
wm.events.on('window:closed',    (state) => { })
wm.events.on('window:focused',   (state) => { })
wm.events.on('window:minimized', (state) => { })
wm.events.on('window:maximized', (state) => { })
wm.events.on('window:restored',  (state) => { })
wm.events.on('window:moved',     (state) => { })
wm.events.on('window:resized',   (state) => { })
```

---

## Theming

Built-in `dist/themes/light.css` and `dist/themes/dark.css` each contain **22 CSS custom properties** (15 Core + 7 Desktop). A single `<link>` tag covers both the window manager and the Desktop module.

### Load a theme

```html
<link id="wos-theme" rel="stylesheet" href="dist/themes/light.css">
```

### `setTheme(preset, options?)`

```typescript
import { setTheme } from 'webos-core'

setTheme('dark')                               // default basePath: 'themes'
setTheme('light', { basePath: '/themes' })     // Vite SPA
setTheme('dark',  { basePath: 'dist/themes' }) // relative path
// UMD: WebOS.setTheme('dark', { basePath: 'dist/themes' })
```

### CSS Custom Properties — Core (15)

```css
:root {
  --wos-window-bg:             #ffffff;
  --wos-header-bg:             #f0f0f0;
  --wos-title-color:           #333333;
  --wos-border:                #d0d0d0;
  --wos-border-active:         #4a90e2;
  --wos-shadow:                0 2px 12px rgba(0,0,0,0.12);
  --wos-shadow-active:         0 4px 24px rgba(0,0,0,0.22);
  --wos-header-border:         #e0e0e0;
  --wos-btn-color:             #555555;
  --wos-btn-hover-bg:          rgba(0,0,0,0.08);
  --wos-btn-close-hover-bg:    #e53e3e;
  --wos-btn-close-hover-color: #ffffff;
  --wos-body-bg:               #ffffff;
  --wos-body-color:            #222222;
  --wos-snap-guide-color:      rgba(74,144,226,0.4);
}
```

### CSS Custom Properties — Desktop module (7)

```css
:root {
  --wos-desktop-bg:            linear-gradient(135deg,#f0f4f8 0%,#e2e8f0 100%);
  --wos-desktop-icon-text:     #1a202c;
  --wos-desktop-icon-hover-bg: rgba(0,0,0,0.08);
  --wos-dock-bg:               rgba(255,255,255,0.75);
  --wos-dock-border:           rgba(0,0,0,0.10);
  --wos-dock-item-hover-bg:    rgba(0,0,0,0.06);
  --wos-font:                  system-ui,-apple-system,sans-serif;
}
```

---

## Desktop Module

```typescript
import { Desktop } from 'webos-core/desktop'
import { WindowManager } from 'webos-core'

const desktop = new Desktop({
  container: document.getElementById('root')!,
  dock: { position: 'bottom', items: [] },
  iconSnap: true,
  dragThreshold: 6,
})

const wm = new WindowManager({
  container: desktop.getElement(),
  isolated: true,
})

desktop.addIcon({ id: 'notepad', label: '📝 Notepad', icon: '📝', action: () => {
  wm.open({ id: 'notepad', title: 'Notepad', content: document.createElement('div') })
}})

// Sync running windows ↔ Dock items automatically
const stopSync = desktop.syncDockWithWindows(wm)
// Later: stopSync() to detach
```

### `DesktopConfig`

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `container` | `HTMLElement` | `document.body` | Container for the desktop |
| `dragThreshold` | `number` | `6` | Global drag start threshold (px) |
| `iconSnap` | `boolean` | `true` | Enable icon snap alignment |
| `iconSnapThreshold` | `number` | `20` | Icon snap trigger distance (px) |
| `storageKey` | `string` | `'wos-desktop'` | localStorage key prefix for icon positions |
| `dock` | `DockConfig` | `{}` | Dock configuration |
| `icons` | `DesktopIconConfig[]` | `[]` | Initial desktop icons |

### `desktop.syncDockWithWindows(manager, options?)`

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `getAppIdFromWindowId` | `(windowId) => string \| null` | strip `app-` prefix | Map window ID → app ID. Return `null` to skip. |
| `getDockItem` | `(appId, event) => { label, icon } \| null` | title + 🪟 | Build Dock display. Return `null` to skip. |
| `onDockItemClick` | `(appId, windowId) => void` | focus window | Custom click handler |
| `dedupeByAppId` | `boolean` | `true` | One Dock item per app ID |
| `syncExisting` | `boolean` | `true` | Sync already-open windows at bind time |

Returns a `() => void` cleanup function (same as `desktop.unsyncDockWithWindows()`).

> **Demo** — `demo/desktop/index.html` ships a full virtual desktop experience with Dock, draggable icons, theme switching, snap-gap control, and a **📐 BorderLayout demo window** (Basic + Nested tabs).

---

## Developer Documentation

An in-depth interactive docs site is included at `demo/docs/` (Vue 3 SPA, i18n EN / zh-TW).

```bash
cd demo/docs && npm install && npm run dev   # http://localhost:3002
```

**Pages covered (17 total):**

| Category | Pages |
|----------|-------|
| Getting Started | Overview, Installation, Quick Start |
| Core API | WindowManager Options, Open & Close, Min / Max / Restore, Snap & Alignment, Events |
| Theming | Theme System |
| Desktop Module | Desktop & Dock, BorderLayout |
| Vanilla JS | Hello World, DOM Content, jQuery |
| Vue 3 | useWindowManager, KeepAlive |
| React | useWindowManager |

---

## BorderLayout

Embed an EasyUI-style docking layout inside any window. `wm.open()` auto-detects `data-region` children and renders the layout.

```html
<script>
const content = document.createElement('div')
content.innerHTML = `
  <div data-region="north" data-title="Toolbar" data-icon="🔧" data-size="40" data-collapsible></div>
  <div data-region="west"  data-title="Nav"     data-icon="📁" data-size="200" data-collapsible>
    <p>Sidebar</p>
  </div>
  <div data-region="center"><p>Main content</p></div>
  <div data-region="east"  data-title="Props"   data-icon="🔍" data-size="180" data-collapsible></div>
  <div data-region="south" data-title="Status"  data-size="28" data-collapsible></div>
`
wm.open({ id: 'app', title: 'My App', width: 900, height: 600, content })
</script>
```

### `data-*` attributes

| Attribute | Description |
|-----------|-------------|
| `data-region="north\|south\|east\|west\|center"` | Region direction |
| `data-size="200"` | Width (E/W) or height (N/S) in px |
| `data-min-size="60"` | Minimum drag size in px |
| `data-collapsible` | Allow collapsing (presence flag) |
| `data-collapsed` | Initially collapsed |
| `data-title="Label"` | Show region header bar |
| `data-icon="🔧"` | Icon shown before title |

When collapsed, a region shrinks to a **28px mini strip**: expand button → icon → rotated title.

---

## Vue 3 Adapter

`useWindowManager(opts?)` returns:

| Return | Type | Description |
|--------|------|-------------|
| `wm` | `WindowManager` | Underlying instance |
| `windows` | `ShallowRef<VueWindowEntry[]>` | Reactive list for `v-for` + `<Teleport>` |
| `openVueWindow(config)` | `fn` | Open a Vue component window |
| `close / minimize / maximize / restore / focus / setTitle` | `fn` | Proxy methods |

## React 18 Adapter

`useWindowManager(opts?)` returns:

| Return | Type | Description |
|--------|------|-------------|
| `wm` | `WindowManager` | Underlying instance |
| `windows` | `ReactWindowEntry[]` | State array for `createPortal` mapping |
| `openReactWindow(config)` | `fn` | Open a React component window |
| `close / minimize / maximize / restore / focus / setTitle` | `fn` | Proxy methods |

---

## Build Output

| File | Format | Size | Use when |
|------|--------|------|----------|
| `dist/webos-core.es.js` | ESM | ~23 KB | Vite / Webpack / `type="module"` (dev) |
| `dist/webos-core.es.min.js` | ESM | ~12 KB | Production ESM |
| `dist/webos-core.umd.js` | UMD | ~26 KB | Script tag / jQuery (dev) |
| `dist/webos-core.umd.min.js` | UMD | ~12 KB | Production CDN |
| `dist/webos-desktop.es.js / .min.js` | ESM | — | Desktop module (ESM) |
| `dist/webos-desktop.umd.js / .min.js` | UMD | — | Desktop module (`window.WebOSDesktop`) |
| `dist/index.d.ts` | TypeScript | — | Core type declarations |
| `dist/webos-desktop.d.ts` | TypeScript | — | Desktop type declarations |
| `dist/themes/light.css` | CSS | ~2 KB | Light theme (Core + Desktop) |
| `dist/themes/dark.css` | CSS | ~2 KB | Dark theme (Core + Desktop) |

---

## Building from Source

```bash
npm install

npm run build        # Type-check only (tsc --noEmit, no JS output)
npm run build:lib    # Build all bundles → dist/
npm run clean        # Clean dist/
npm run release      # clean + build:lib + package release/
```

> Requires **Node.js 18+**. Library build uses Rollup.

---

## Browser Support

Any modern browser supporting ES2020 (`optional chaining`, `nullish coalescing`, `Map`, `Set`).

---

## License

Apache-2.0 © 2026 Brian Cheng

See [LICENSE](LICENSE) for full terms.

