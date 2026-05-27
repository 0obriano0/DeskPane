# WebOS-Core

A **framework-agnostic** web virtual desktop window management engine.

[![license](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)

---

## Features

- ✅ Open / close / minimize / maximize / restore windows
- ✅ Drag & resize with throttling (60 fps default)
- ✅ **`resizable: false`** — disable maximize button and border-drag resize per window (fixed-size dialog pattern)
- ✅ **Snap alignment** — windows snap to edges and each other while **dragging and resizing**; configurable gap between windows
- ✅ Focus / z-order management
- ✅ Event bus — subscribe to any window lifecycle event
- ✅ Isolated mode — embed a desktop inside any container element
- ✅ **RWD viewport clamping** — windows auto-clamp via `ResizeObserver`; never open off-screen
- ✅ **Theme system** — light/dark CSS themes with 22 CSS custom properties; `setTheme()` runtime switching
- ✅ **BorderLayout** — N/S/E/W/Center docking layout; `data-region` HTML-first declaration; collapsible mini strip; draggable splitters; nested layouts
- ✅ **Desktop module** (`webos-desktop`) — virtual desktop with icons, Dock, active indicator, icon snap, RWD scrollable icon area, **frosted-glass backdrop-filter** on Dock
- ✅ **WorkspaceManager** (`webos-workspace`) — multiple virtual desktops with slide animation and dot indicator
- ✅ **TaskView** (`webos-workspace`) — workspace switcher overlay with real DOM-clone thumbnails, add/delete workspace, Escape key support
- ✅ Vue 3 adapter — `useWindowManager` composable + `<Teleport>` support
- ✅ React 18 adapter — `useWindowManager` hook + `createPortal` support
- ✅ **CSS pre-built files** — `dist/styles/webos-core.css` and `dist/styles/webos-desktop.css` for direct `<link>` use (single source of truth at `src/styles/*.css`)

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
  id:          string    // Unique window ID (required)
  title:       string    // Window title bar text
  icon?:       string    // Emoji or image URL shown in Dock (default: '🪟')
  label?:      string    // Short Dock label; falls back to title when omitted
  content:     any       // HTMLElement, or null when using framework adapters
  x?:          number    // Initial X position (px)
  y?:          number    // Initial Y position (px)
  width?:      number    // Initial width (px), default 640
  height?:     number    // Initial height (px), default 480
  resizable?:  boolean   // Default true. Set false to disable maximize + border-drag resize
  props?:      Record<string, unknown>
  slotType?:   'dom' | 'vue' | 'react'
}
```

### Fixed-size Windows

Pass `resizable: false` to lock a window to its initial size — the maximize button is visually disabled and border-drag resizing is blocked:

```typescript
wm.open({
  id:        'alert',
  title:     '⚠️ Confirm',
  content:   myDialogEl,
  width:     360,
  height:    200,
  resizable: false,   // maximize button disabled, border drag blocked
})
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

Built-in `dist/themes/light.css` and `dist/themes/dark.css` each contain **23 CSS custom properties** (15 Core + 8 Desktop). A single `<link>` tag covers both the window manager and the Desktop module.

Structural styles are provided separately as `dist/styles/webos-core.css` (window structure), `dist/styles/webos-desktop.css` (Desktop / Dock / Icon), `dist/styles/webos-workspace.css` (workspace slide animation), and `dist/styles/webos-taskview.css` (TaskView overlay). These are independent of theme variables and can be `<link>`ed directly:

```html
<link rel="stylesheet" href="dist/styles/webos-core.css">
<link rel="stylesheet" href="dist/styles/webos-desktop.css">
<!-- optional: only needed when using WorkspaceManager / TaskView -->
<link rel="stylesheet" href="dist/styles/webos-workspace.css">
<link rel="stylesheet" href="dist/styles/webos-taskview.css">
```

Alternatively, use `getCoreCSS()` / `getDesktopCSS()` / `getWorkspaceCSS()` / `getTaskViewCSS()` for programmatic injection:

```typescript
import { getCoreCSS } from 'webos-core'
import { getDesktopCSS } from 'webos-core/desktop'
import { getWorkspaceCSS, getTaskViewCSS } from 'webos-core/workspace'
// inject into shadow root, iframe, or custom container
```

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

### CSS Custom Properties — Desktop module (8)

```css
:root {
  --wos-desktop-bg:             linear-gradient(135deg,#f0f4f8 0%,#e2e8f0 100%);
  --wos-desktop-icon-text:      #1a202c;
  --wos-desktop-icon-hover-bg:  rgba(0,0,0,0.08);
  --wos-dock-bg:                rgba(220,225,240,0.20);  /* semi-transparent for frosted glass */
  --wos-dock-backdrop-filter:   blur(4px);               /* frosted-glass blur behind dock */
  --wos-dock-border:            rgba(0,0,0,0.10);
  --wos-dock-item-hover-bg:     rgba(0,0,0,0.06);
  --wos-font:                   system-ui,-apple-system,sans-serif;
}
```

> Set `--wos-dock-backdrop-filter: none` to disable the blur effect entirely.

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
  wm.open({
    id:    'notepad',
    title: '📝 Notepad',   // shown in window title bar
    label: 'Notepad',      // short label shown in Dock (falls back to title if omitted)
    icon:  '📝',           // icon shown in Dock
    content: document.createElement('div'),
  })
}})

// Sync running windows ↔ Dock items automatically (zero config)
const stopSync = desktop.syncDockWithWindows(wm)
// Later: stopSync() to detach

// Dynamically change Dock position at runtime
desktop.setDockPosition('top')    // 'top' | 'bottom' | 'left' | 'right'
// Icon area and window area insets update instantly

// Get the full desktop root element (includes Dock)
desktop.getDesktopElement()
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

### Desktop Methods

| Method | Description |
|--------|-------------|
| `desktop.addIcon(config)` | Add a desktop icon |
| `desktop.removeIcon(id)` | Remove a desktop icon |
| `desktop.getDock()` | Get the `Dock` instance for advanced manipulation |
| `desktop.setDockPosition(pos)` | Dynamically move Dock: `'top' \| 'bottom' \| 'left' \| 'right'`. Updates icon and window area insets instantly. |
| `desktop.getElement()` | Get the window area element (Dock excluded) — use as `WindowManager` container |
| `desktop.getDesktopElement()` | Get the full desktop root element (includes Dock) |
| `desktop.syncDockWithWindows(wm, opts?)` | Sync Dock items with running windows |
| `desktop.unsyncDockWithWindows()` | Stop sync |
| `desktop.destroy()` | Tear down the desktop |

### `desktop.syncDockWithWindows(manager, options?)`

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `getAppIdFromWindowId` | `(windowId) => string \| null` | strip `app-` prefix | Map window ID → app ID. Return `null` to skip. |
| `getDockItem` | `(appId, event) => { label, icon } \| null` | `event.label ?? event.title` + `event.icon ?? 🪟` | Build Dock display. Return `null` to skip. |
| `onDockItemClick` | `(appId, windowId) => void` | focus window | Custom click handler |
| `dedupeByAppId` | `boolean` | `true` | One Dock item per app ID |
| `syncExisting` | `boolean` | `true` | Sync already-open windows at bind time |
| `showWindowPreview` | `boolean` | `true` | Enable hover thumbnail preview on Dock items |
| `previewSize` | `{ width: number; height: number }` | `{ width: 240, height: 150 }` | Max thumbnail size (aspect-ratio preserved) |

### `Dock` Methods

| Method | Description |
|--------|-------------|
| `dock.addItem(item)` | Append a `DockItem` to the end |
| `dock.addItemAt(item, index)` | Insert at position `index` (0 = leftmost) |
| `dock.removeItem(id)` | Remove item by id |
| `dock.onRender(cb)` | Subscribe to DOM-rebuild events (fires after every `_render()`). Returns an `offRender` function. Useful for re-binding hover/event listeners after Dock reorders. |

---

> **Preview hover** — Hovering a Dock item for 300ms shows a DOM-clone thumbnail (default 240×150px, aspect-ratio preserved). Thumbnails are automatically re-bound after drag-reorder or new window opens via `Dock.onRender`.

> **Demo** — `demo/desktop/index.html` ships a full virtual desktop experience with Dock, draggable icons, theme switching, snap-gap control, **live Dock position switching** (top/bottom/left/right), and a **📐 BorderLayout demo window** (Basic + Nested tabs).

---

## Workspace Module

### `WorkspaceManager` — Multiple Virtual Desktops

```typescript
import { WorkspaceManager } from 'webos-core/workspace'

const wsMgr = new WorkspaceManager(desktop.getElement(), {
  animationMs: 220,                            // slide animation duration (default 250ms)
  windowManagerOptions: { isolated: true, snap: true },
})

wsMgr.addWorkspace({ id: 'ws-1', label: 'Desktop 1' })
wsMgr.addWorkspace({ id: 'ws-2', label: 'Desktop 2' })
wsMgr.switchTo('ws-2')

// Get the WindowManager for the active workspace
const wm = wsMgr.getWindowManager(wsMgr.current.id)
wm.open({ id: 'app', title: 'My App', content: el })

// Events
wsMgr.events.on('workspace:switched', ({ from, to }) => { })
wsMgr.events.on('workspace:added',    (state) => { })
wsMgr.events.on('workspace:removed',  ({ id }) => { })

// Optional dot indicator (shown inside the workspace root)
wsMgr.enableIndicator()
```

#### `WorkspaceManagerOptions`

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `animationMs` | `number` | `250` | Slide animation duration (ms). Set `0` for instant switch. |
| `injectStyles` | `boolean` | `true` | Auto-inject workspace CSS |
| `windowManagerOptions` | `WindowManagerOptions` | `{}` | Options passed to every workspace's `WindowManager` |

#### `WorkspaceManager` Methods

| Method | Description |
|--------|-------------|
| `addWorkspace(config)` | Create a new workspace (auto-activates if first) |
| `removeWorkspace(id)` | Destroy workspace and switch to nearest remaining |
| `switchTo(id)` | Animate to target workspace |
| `getWindowManager(id)` | Get the `WindowManager` for a workspace |
| `enableIndicator()` | Show dot indicator below workspaces |
| `disableIndicator()` | Remove dot indicator |
| `destroy()` | Destroy all workspaces and clean up |

---

### `TaskView` — Workspace Switcher Overlay

Shows a full-screen overlay with real DOM-clone thumbnails of every workspace. Clicking a card switches to that workspace.

```typescript
import { TaskView } from 'webos-core/workspace'

const taskView = new TaskView(wsMgr, {
  dock:        desktop.getDock(),  // auto-insert toggle button at leftmost Dock position
  showButton:  true,               // set false to suppress auto-button; open() still works
  buttonLabel: '虛擬桌面',          // label shown in the Dock button
  buttonIcon:  '⧉',                // icon shown in the Dock button
  allowAdd:    true,               // show "Add Desktop" button
  allowDelete: true,               // show delete button on cards
  keyboard:    true,               // Escape closes the overlay
})

// Programmatic open/close (always works even if showButton: false)
taskView.open()
taskView.toggle()

// Events
taskView.events.on('taskview:open',  () => { })
taskView.events.on('taskview:close', () => { })

// Cleanup
taskView.destroy()
```

#### `TaskViewOptions`

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `target` | `HTMLElement` | `document.body` | Where to mount the overlay |
| `dock` | `DockLike` | — | When provided, auto-inserts a toggle button at position 0 (leftmost) |
| `showButton` | `boolean` | `true` | Insert toggle button into Dock. Set `false` to hide while keeping `open()` callable. |
| `buttonLabel` | `string` | `'虛擬桌面'` | Label for the auto-managed Dock button |
| `buttonIcon` | `string` | `'⧉'` | Icon for the auto-managed Dock button |
| `buttonId` | `string` | `'taskview-btn'` | ID for the auto-managed Dock button |
| `allowAdd` | `boolean` | `true` | Show "New Desktop" button |
| `allowDelete` | `boolean` | `true` | Show delete button on workspace cards |
| `keyboard` | `boolean` | `true` | Close on Escape key |
| `closeOnBackdrop` | `boolean` | `true` | Close when clicking the overlay backdrop |
| `onCreateWorkspace` | `() => WorkspaceConfig` | auto `ws-N` / `桌面 N` | Custom workspace config for new workspaces |
| `injectStyles` | `boolean` | `true` | Auto-inject TaskView CSS |

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
| `dist/webos-workspace.es.js / .min.js` | ESM | — | Workspace + TaskView + Session module (ESM) |
| `dist/webos-workspace.umd.js / .min.js` | UMD | — | Workspace module (`window.WebOSWorkspace`) |
| `dist/index.d.ts` | TypeScript | — | Core type declarations |
| `dist/desktop.d.ts` | TypeScript | — | Desktop type declarations |
| `dist/workspace.d.ts` | TypeScript | — | Workspace + TaskView + Session type declarations |
| `dist/themes/light.css` | CSS | ~2 KB | Light theme (Core + Desktop) |
| `dist/themes/dark.css` | CSS | ~2 KB | Dark theme (Core + Desktop) |
| `dist/styles/webos-core.css` | CSS | — | Core window structure styles (direct `<link>`) |
| `dist/styles/webos-desktop.css` | CSS | — | Desktop / Dock / Icon styles (direct `<link>`) |
| `dist/styles/webos-layout.css` | CSS | — | BorderLayout / Panel styles (direct `<link>`) |
| `dist/styles/webos-workspace.css` | CSS | — | Workspace container / slide animation styles (direct `<link>`) |
| `dist/styles/webos-taskview.css` | CSS | — | TaskView overlay / card / thumbnail styles (direct `<link>`) |

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

