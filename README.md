# DeskPane

**A framework-agnostic web desktop window management framework.**  
Build floating windows, draggable panels, virtual desktops, and ERP-style layouts directly in the browser — no dependencies, works with Vue, React, or plain JS.

[![npm version](https://img.shields.io/npm/v/deskpane.svg)](https://www.npmjs.com/package/deskpane)
[![npm downloads](https://img.shields.io/npm/dm/deskpane.svg)](https://www.npmjs.com/package/deskpane)
[![license](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)
[![bundle size](https://img.shields.io/bundlephobia/minzip/deskpane)](https://bundlephobia.com/package/deskpane)

**Links:** [Live demos](https://0obriano0.github.io/DeskPane/demo/) · [Developer docs](https://0obriano0.github.io/DeskPane/demo/docs/dist/) · [npm](https://www.npmjs.com/package/deskpane)

---

## Why DeskPane?

Modern web applications — especially ERPs, dashboards, and admin tools — often need a **desktop-like window management experience**. Most solutions are either tied to a specific framework, require a heavy dependency tree, or lack the polish needed for production use.

DeskPane is:

- 🪶 **Zero core dependencies** — pure TypeScript core; framework adapters use optional peer dependencies
- 🔌 **Framework-agnostic** — works with Vue 3, React 18, jQuery, or plain JS
- 🎨 **Themeable** — 30 CSS custom properties, light/dark built-in, fully customizable
- 📦 **Modular** — use only what you need (core / desktop / workspace)
- 🏗️ **Production-ready** — used in real ERP systems

---

## Contents

- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [API Reference](#api-reference)
- [Desktop Module](#desktop-module)
- [Workspace Module](#workspace-module)
- [Developer Documentation](#developer-documentation)
- [Troubleshooting](#troubleshooting)
- [Building from Source](#building-from-source)

---

## Features

### Core Window Manager
- ✅ Open / close / minimize / maximize / restore windows
- ✅ Drag & resize at 60 fps with configurable throttle
- ✅ **Snap alignment** — windows snap to edges and each other while dragging and resizing
- ✅ **Child windows** (`parentId` / `modal`) — z-order management, cascade close, modal overlay with shake feedback
- ✅ **`resizable: false`** — fixed-size dialog pattern
- ✅ Focus / z-order management
- ✅ **RWD viewport clamping** — windows auto-clamp via `ResizeObserver`; never open off-screen
- ✅ Event bus — subscribe to any window lifecycle event
- ✅ Isolated mode — embed a desktop inside any container element

### Desktop Module (`deskpane/desktop`)
- ✅ Virtual desktop with draggable icons and localStorage snap positions
- ✅ **Wijmo-style `itemsSource`** — bind desktop icons to arrays or `DesktopCollectionView`
- ✅ Desktop icon events — `items:changed`, `icon:moved`, `icon:activated`, and more
- ✅ Dock with frosted-glass backdrop-filter, drag reorder
- ✅ **Windows-style group thumbnail preview** — hover Dock item to see live window thumbnails
- ✅ `syncDockWithWindows()` — zero-config Dock ↔ window sync

### Workspace Module (`deskpane/workspace`)
- ✅ **WorkspaceManager** — multiple virtual desktops with slide animation
- ✅ **TaskView** — workspace switcher overlay with real DOM-clone thumbnails
- ✅ **SessionManager** — serialize / restore window state

### Layouts & Theming
- ✅ **BorderLayout** — N/S/E/W/Center docking layout, collapsible panels, draggable splitters
- ✅ **Theme system** — `setTheme('light' | 'dark')`, 30 CSS custom properties
- ✅ Vue 3 adapter — `useWindowManager`, `DpDesktop`, `DpDesktopIcon`, `DpWindowManager`, `DpWindow`
- ✅ React 18 adapter — `useWindowManager` hook + `createPortal` support

---

## Installation

```bash
npm install deskpane
```

### Import Modes

Use one style-loading strategy per app:

| Mode | Best for | Recommendation |
|------|----------|----------------|
| Bundler manual CSS import | Vite, Vue, React, app-level theme overrides | Import CSS yourself and set `injectStyles:false` |
| Runtime CSS injection | Small demos, script-tag prototypes | Let DeskPane inject core CSS |
| CDN CSS + UMD | jQuery, CMS pages, no build step | Use `<link>` tags and `window.DeskPane` |

### Bundler CSS

```html
<!-- Equivalent files are available under dist/styles/ and dist/themes/. -->
```

```typescript
import 'deskpane/dist/styles/deskpane.css'
import 'deskpane/dist/styles/deskpane-desktop.css'
import 'deskpane/dist/styles/deskpane-workspace.css'
import 'deskpane/dist/styles/deskpane-taskview.css'
import 'deskpane/dist/themes/light.css'
```

When CSS is imported by the host app, disable runtime injection:

```typescript
const wm = new WindowManager({
  container: document.getElementById('desktop')!,
  isolated: true,
  injectStyles: false,
})
```

### CDN / Script Tag

```html
<link rel="stylesheet" href="https://unpkg.com/deskpane/dist/styles/deskpane.css">
<link rel="stylesheet" href="https://unpkg.com/deskpane/dist/themes/light.css">
<script src="https://unpkg.com/deskpane/dist/deskpane.umd.min.js"></script>
```

jsDelivr works too:

```html
<script src="https://cdn.jsdelivr.net/npm/deskpane/dist/deskpane.umd.min.js"></script>
```

---

## Quick Start

### ES Module

```typescript
import 'deskpane/dist/styles/deskpane.css'
import 'deskpane/dist/themes/light.css'
import { WindowManager } from 'deskpane'

const wm = new WindowManager({
  container: document.getElementById('desktop')!,
  isolated: true,
  injectStyles: false,
})

const el = document.createElement('div')
el.innerHTML = '<p style="padding:20px">Hello, World!</p>'

wm.open({ id: 'hello', title: 'My Window', content: el })
```

### Script Tag (UMD)

```html
<div id="desktop" style="width:100vw; height:100vh; position:relative;"></div>
<link rel="stylesheet" href="https://unpkg.com/deskpane/dist/styles/deskpane.css">
<link rel="stylesheet" href="https://unpkg.com/deskpane/dist/themes/light.css">
<script src="https://unpkg.com/deskpane/dist/deskpane.umd.min.js"></script>
<script>
  var wm = new window.DeskPane.WindowManager({
    container: document.getElementById('desktop'),
    isolated: true,
    injectStyles: false
  })
  var el = document.createElement('div')
  el.textContent = 'Hello from UMD!'
  wm.open({ id: 'hello', title: 'My Window', content: el })
</script>
```

### Vue 3 — Composable

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
import { useWindowManager } from 'deskpane/vue'
import MyComp from './MyComp.vue'

const { windows, openVueWindow } = useWindowManager()
</script>
```

### Vue 3 — Declarative Components

```vue
<template>
  <DpDesktop
    v-model:items="icons"
    :dock="{ position: 'bottom' }"
    @initialized="desktop = $event"
    @icon-activated="openApp"
  >
    <DpDesktopIcon
      id="settings"
      label="Settings"
      icon="⚙️"
      @activate="settingsOpen = true"
    />
  </DpDesktop>

  <DpWindowManager>
    <DpWindow
      id="settings"
      v-model:open="settingsOpen"
      title="Settings"
      icon="⚙️"
      :width="520"
      :height="420"
      @initialized="onWindowInitialized"
    >
      <SettingsPanel />
    </DpWindow>
  </DpWindowManager>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { DpDesktop, DpDesktopIcon, DpWindow, DpWindowManager } from 'deskpane/vue'
import type { DesktopIconConfig, DesktopIconEvent } from 'deskpane/desktop'
import SettingsPanel from './SettingsPanel.vue'

const settingsOpen = ref(false)
let desktop: unknown = null
const icons = ref<DesktopIconConfig[]>([
  { id: 'settings-icon', label: 'Settings', icon: '⚙️', x: 40, y: 40 },
])

function openApp(event: DesktopIconEvent) {
  if (event.id === 'settings-icon') settingsOpen.value = true
}

function onWindowInitialized({ bodyEl }: { bodyEl: HTMLElement }) {
  // Attach vanilla JS / jQuery / third-party widgets here.
  console.log(bodyEl)
}
</script>
```

`initialized` follows the Wijmo-style pattern: it fires after the underlying DeskPane instance or window body is created, so advanced users can store the instance or attach vanilla JS / jQuery behavior without leaving the declarative template API.

Declarative Vue windows also support core child/modal behavior. Use `parent-id` to attach a window to its parent and `modal` to block the parent until the child is closed:

```vue
<DpWindow id="settings" v-model:open="settingsOpen" title="Settings">
  <SettingsPanel />
</DpWindow>

<DpWindow
  id="settings-confirm"
  v-model:open="confirmOpen"
  title="Confirm changes"
  parent-id="settings"
  modal
>
  <ConfirmChanges />
</DpWindow>
```

### React 18

```tsx
import { createPortal } from 'react-dom'
import { useWindowManager } from '@deskpane/adapters/react/useWindowManager'
import MyComp from './MyComp'

export default function App() {
  const { windows, openReactWindow } = useWindowManager()

  return (
    <div className="desktop">
      <button onClick={() => openReactWindow({ id: 'w1', title: 'My Window', component: MyComp })}>
        Open Window
      </button>
      {windows.map(win => {
        const Component = win.component
        return Component
          ? createPortal(<Component {...(win.props ?? {})} />, win.bodyEl, win.id)
          : null
      })}
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
| `wm.shake(id)` | Trigger shake animation on a window (used for modal blocking feedback) |
| `wm.getChildIds(parentId)` | Get an array of child window IDs attached to a parent |
| `wm.getRootWindowId(id)` | Walk up the parent chain to find the root window ID |
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
  parentId?:   string    // Attach as a child of this window ID; child stays above parent z-index
  modal?:      boolean   // Requires parentId. true = parent gets an overlay; clicking it shakes child
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

### Child Windows

Use `parentId` to attach a window as a child. The child's z-index is always above its parent. Children minimize/restore together with their parent and are excluded from the Dock:

```typescript
// Non-modal child — both windows can be freely focused
wm.open({
  id:       'prop-panel',
  title:    'Properties',
  parentId: 'main-app',
  modal:    false,
  content:  panelEl,
})

// Modal child — parent gets a semi-transparent overlay while child is open
wm.open({
  id:       'confirm-dialog',
  title:    'Confirm',
  parentId: 'main-app',
  modal:    true,       // clicking the overlay shakes the child
  width:    360,
  height:   200,
  resizable: false,
  content:  dialogEl,
})
```

### Events

```typescript
wm.events.on('window:opened',       (state) => { })
wm.events.on('window:closed',       (state) => { })
wm.events.on('window:focused',      (state) => { })
wm.events.on('window:minimized',    (state) => { })
wm.events.on('window:maximized',    (state) => { })
wm.events.on('window:restored',     (state) => { })
wm.events.on('window:moved',        (state) => { })
wm.events.on('window:resized',      (state) => { })
wm.events.on('window:child-opened', ({ parentId, childId }) => { })
wm.events.on('window:child-closed', ({ parentId, childId }) => { })
```

---

## Theming

Built-in `dist/themes/light.css`, `dist/themes/dark.css`, and `dist/themes/medieval-pixel.css` contain Core + Desktop CSS custom properties. A single `<link>` tag covers both the window manager and the Desktop module.

Structural styles are provided separately as `dist/styles/deskpane.css` (window structure), `dist/styles/deskpane-desktop.css` (Desktop / Dock / Icon), `dist/styles/deskpane-workspace.css` (workspace slide animation), and `dist/styles/deskpane-taskview.css` (TaskView overlay). These are independent of theme variables and can be `<link>`ed directly:

```html
<link rel="stylesheet" href="dist/styles/deskpane.css">
<link rel="stylesheet" href="dist/styles/deskpane-desktop.css">
<!-- optional: only needed when using WorkspaceManager / TaskView -->
<link rel="stylesheet" href="dist/styles/deskpane-workspace.css">
<link rel="stylesheet" href="dist/styles/deskpane-taskview.css">
```

DeskPane supports two stable CSS loading modes:

```typescript
// Auto-inject mode: useful for CDN demos and quick starts.
const desktop = new Desktop()
const wm = new WindowManager()
```

```typescript
// Manual import mode: recommended for bundlers and app-level overrides.
import 'deskpane/styles/deskpane.css'
import 'deskpane/styles/deskpane-desktop.css'
import 'deskpane/styles/deskpane-workspace.css'

const desktop = new Desktop({ injectStyles: false })
const ws = new WorkspaceManager(desktop.getElement(), {
  injectStyles: false,
  windowManagerOptions: { isolated: true, snap: true },
})
```

When runtime injection is enabled, DeskPane first checks for an existing matching `<link>` or bundler-created `<style>` and skips duplicate injection. Runtime styles are inserted before app-level stylesheets in `<head>`, so project overrides loaded later remain authoritative. `WorkspaceManager.injectStyles:false` is also propagated to the internally-created `WindowManager` unless `windowManagerOptions.injectStyles` is set explicitly.

Alternatively, use `getCoreCSS()` / `getDesktopCSS()` / `getWorkspaceCSS()` / `getTaskViewCSS()` for programmatic injection:

```typescript
import { getCoreCSS } from 'deskpane'
import { getDesktopCSS } from 'deskpane/desktop'
import { getWorkspaceCSS, getTaskViewCSS } from 'deskpane/workspace'
// inject into shadow root, iframe, or custom container
```

### Load a theme

```html
<link id="dp-theme" rel="stylesheet" href="dist/themes/light.css">
```

### `setTheme(preset, options?)`

```typescript
import { setTheme } from 'deskpane'

setTheme('dark')                               // default basePath: 'themes'
setTheme('light', { basePath: '/themes' })     // Vite SPA
setTheme('medieval-pixel', { basePath: 'dist/themes' })
setTheme('dark',  { basePath: 'dist/themes' }) // relative path
// UMD: DeskPane.setTheme('dark', { basePath: 'dist/themes' })
```

### CSS Custom Properties — Core (15)

```css
:root {
  /* Window chrome */
  --dp-window-border:               #d0d0d0;
  --dp-window-border-active:        #b0b8c8;
  --dp-window-shadow:               0 4px 24px rgba(0,0,0,0.18);
  --dp-window-shadow-active:        0 8px 36px rgba(0,0,0,0.28);
  --dp-window-bg:                   var(--dp-window-body-bg, #ffffff);
  /* Header */
  --dp-window-header-bg:            #f5f5f5;
  --dp-window-header-border:        #e0e0e0;
  --dp-window-title-color:          #333333;
  /* Buttons */
  --dp-window-btn-color:            #555555;
  --dp-window-btn-hover-bg:         #e0e0e0;
  --dp-window-btn-close-hover-bg:   #ff5f57;
  --dp-window-btn-close-hover-color:#ffffff;
  /* Body */
  --dp-window-body-bg:              #ffffff;
  --dp-window-body-color:           #222222;
  /* Snap guide */
  --dp-snap-guide-color:            rgba(0,120,255,0.55);
}
```

### CSS Custom Properties — Layout module (7)

```css
:root {
  --dp-layout-header-bg:       #ebebeb;
  --dp-layout-header-border:   #d8d8d8;
  --dp-layout-title-color:     #444444;
  --dp-layout-btn-color:       #666666;
  --dp-layout-btn-hover-bg:    #d8e4f0;
  --dp-layout-splitter-bg:     #d0d0d0;
  --dp-layout-splitter-active: #b0b8c8;
}
```

### CSS Custom Properties — Desktop module (8)

```css
:root {
  --dp-desktop-bg:             linear-gradient(135deg,#e8eaf0 0%,#d0d4e0 100%);
  --dp-desktop-icon-text:      #1a1a2e;
  --dp-desktop-icon-hover-bg:  rgba(0,0,0,0.08);
  --dp-dock-bg:                rgba(220,225,240,0.20);  /* semi-transparent for frosted glass */
  --dp-dock-backdrop-filter:   blur(4px);               /* frosted-glass blur behind dock */
  --dp-dock-border:            rgba(0,0,0,0.12);
  --dp-dock-item-hover-bg:     rgba(0,0,0,0.08);
  --dp-font:                   system-ui,-apple-system,sans-serif;
}
```

> Set `--dp-dock-backdrop-filter: none` to disable the blur effect entirely.

---

## Desktop Module

```typescript
import { Desktop } from 'deskpane/desktop'
import { WindowManager } from 'deskpane'

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
| `storageKey` | `string` | `'dp-desktop'` | localStorage key prefix for icon positions |
| `dock` | `DockConfig` | `{}` | Dock configuration |
| `icons` | `DesktopIconConfig[]` | `[]` | Initial desktop icons |
| `itemsSource` | `DesktopIconConfig[] \| DesktopCollectionView` | `icons ?? []` | Wijmo-style data source for desktop icons |

### Desktop Methods

| Method | Description |
|--------|-------------|
| `desktop.addIcon(config)` | Add a desktop icon |
| `desktop.removeIcon(id)` | Remove a desktop icon |
| `desktop.getItems()` | Get the current desktop icon snapshot, including live positions |
| `desktop.getItem(id)` | Get one icon snapshot |
| `desktop.setItems(items)` | Replace the desktop icon list |
| `desktop.setItemsSource(source)` | Bind a new array or `DesktopCollectionView` |
| `desktop.updateItem(id, patch)` | Patch one icon and refresh its rendered element |
| `desktop.refreshItems()` / `desktop.refresh()` | Re-read the bound source and repaint desktop icons |
| `desktop.getCollectionView()` | Get the active `DesktopCollectionView` |
| `desktop.getDock()` | Get the `Dock` instance for advanced manipulation |
| `desktop.setDockPosition(pos)` | Dynamically move Dock: `'top' \| 'bottom' \| 'left' \| 'right'`. Updates icon and window area insets instantly. |
| `desktop.getElement()` | Get the window area element (Dock excluded) — use as `WindowManager` container |
| `desktop.getDesktopElement()` | Get the full desktop root element (includes Dock) |
| `desktop.syncDockWithWindows(wm, opts?)` | Sync Dock items with running windows |
| `desktop.unsyncDockWithWindows()` | Stop sync |
| `desktop.destroy()` | Tear down the desktop |

### `DesktopCollectionView`

```typescript
import { Desktop, DesktopCollectionView } from 'deskpane/desktop'

const icons = [
  { id: 'erp', label: 'ERP', icon: '📦', x: 40, y: 40 },
]

const view = new DesktopCollectionView(icons)
const desktop = new Desktop({ itemsSource: view })

view.add({ id: 'mail', label: 'Mail', icon: '✉️', x: 40, y: 140 })
view.update('erp', { label: 'ERP System' })
view.refresh() // use this after direct sourceCollection mutations

desktop.events.on('items:changed', event => {
  console.log(event.reason, event.items)
})
```

### `desktop.syncDockWithWindows(manager, options?)`

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `getAppIdFromWindowId` | `(windowId) => string \| null` | strip `app-` prefix | Map window ID → app ID. Return `null` to skip. |
| `getDockItem` | `(appId, event) => { label, icon } \| null` | `event.label ?? event.title` + `event.icon ?? 🪟` | Build Dock display. Return `null` to skip. |
| `onDockItemClick` | `(appId, windowId) => void` | focus window | Custom click handler |
| `dedupeByAppId` | `boolean` | `true` | One Dock item per app ID |
| `syncExisting` | `boolean` | `true` | Sync already-open windows at bind time |
| `showWindowPreview` | `boolean` | `true` | Enable Windows-style group thumbnail preview on hover |
| `previewSize` | `{ width: number; height: number }` | `{ width: 160, height: 100 }` | Thumbnail card size per window (aspect-ratio preserved) |
| `previewMountEl` | `HTMLElement` | auto-detect `.v-application` | Element to mount the preview popup into. Auto-detects the nearest `.v-application` ancestor so Vuetify / Vue scoped CSS / CSS variables are inherited by cloned thumbnails. Pass your app root if the detection fails (e.g., `document.getElementById('app')`). |

### `Dock` Methods

| Method | Description |
|--------|-------------|
| `dock.addItem(item)` | Append a `DockItem` to the end |
| `dock.addItemAt(item, index)` | Insert at position `index` (0 = leftmost) |
| `dock.removeItem(id)` | Remove item by id |
| `dock.onRender(cb)` | Subscribe to DOM-rebuild events (fires after every `_render()`). Returns an `offRender` function. Useful for re-binding hover/event listeners after Dock reorders. |

---

> **Group thumbnail preview** — Hovering a Dock item for 280ms shows a Windows-style card strip: one card per window (parent + all children). Each card has a title and a × close button (appears on hover). The popup is sticky — mouse can move into it without it disappearing. Modal safety: clicking × on a parent card while a `modal` child exists shakes the child instead of closing. Thumbnails are automatically re-bound after drag-reorder or new window opens via `Dock.onRender`.
>
> **Vuetify / Scoped CSS** — The popup is auto-mounted inside the nearest `.v-application` ancestor (or `previewMountEl`) so cloned thumbnails correctly inherit Vuetify selectors, Vue `data-v-*` scoped styles, and CSS custom properties. Positioning always uses `position:fixed` with viewport coordinates, unaffected by the mount point.

> **Demo** — `demo/desktop/index.html` ships a full virtual desktop experience with Dock, draggable icons, theme switching, snap-gap control, **live Dock position switching** (top/bottom/left/right), a **📐 BorderLayout demo window** (Basic + Nested tabs), and a **child window / modal dialog demo** (System Settings window).
>
> **Theme Demo** — `demo/desktop/index.html` is the main desktop demo, featuring the Medieval Pixel theme, Dock, draggable icons, virtual desktops, and 9-slice panel borders.
>
> **GitHub Pages** — run `npm run build:pages` to build the library, Vue demo, React demo, docs, and the static Pages artifact in `.pages/`. Vue/React/docs demos are served from their generated `dist/` folders on Pages. The CI Pages deployment runs from version tags (`v*`), and GitHub Releases also include a downloadable `deskpane-pages-vX.X.X.zip` demo bundle.

---

## Workspace Module

### `WorkspaceManager` — Multiple Virtual Desktops

```typescript
import { WorkspaceManager } from 'deskpane/workspace'

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

// Safer: let DeskPane scope the window id to the workspace.
// This prevents duplicate raw ids when the same app opens on multiple desktops.
wsMgr.openWindow({
  appId: 'counter',
  title: 'Counter',
  icon: '🔢',
  label: 'Counter',
  content: el,
})
// Actual window id becomes similar to: ws-2::app-counter

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
| `openWindow(config)` | Open a window in a workspace. Prefer `appId` to generate a workspace-scoped id automatically. |
| `createWindowId(appId, workspaceId?)` | Build a workspace-scoped id such as `ws-2::app-counter`. |
| `enableIndicator()` | Show dot indicator below workspaces |
| `disableIndicator()` | Remove dot indicator |
| `destroy()` | Destroy all workspaces and clean up |

#### Workspace-safe window ids

When the same app can open on more than one workspace, avoid reusing a raw id like `app-counter` in every workspace. Use `openWindow({ appId })` or the helper functions exported from `deskpane/workspace`:

```typescript
import {
  createWorkspaceWindowId,
  getAppIdFromWorkspaceWindowId,
  parseWorkspaceWindowId,
} from 'deskpane/workspace'

const id = createWorkspaceWindowId('ws-2', 'counter') // ws-2::app-counter
parseWorkspaceWindowId(id)                            // { workspaceId:'ws-2', appId:'counter' }
getAppIdFromWorkspaceWindowId(id)                     // counter
```

`WorkspaceManager` warns by default when the same raw window id is opened in multiple workspaces because it can confuse Dock sync and framework Portal/Teleport targets. Disable this only if you intentionally manage ids yourself:

```typescript
const wsMgr = new WorkspaceManager(container, {
  warnOnDuplicateWindowIds: false,
})
```

#### React / Vue Portal Content with Workspaces

DeskPane owns the window DOM, but framework-rendered content inserted with React `createPortal` or Vue `<Teleport>` remains application state. When using `WorkspaceManager`, keep that state scoped to the active workspace and resync it whenever the active workspace changes.

This matters when the same app/window id can exist in more than one workspace. A key based only on `window.id` can cause React or Vue to reuse the wrong portal target after switching desktops, which may appear as an empty or black window body until the window is recreated.

Recommended integration pattern:

```typescript
type FrameworkWindowEntry = {
  workspaceId: string
  id: string
  bodyEl: HTMLElement
  component: any
}

let windows: FrameworkWindowEntry[] = []
const disposers: Array<() => void> = []

function syncWindows() {
  const current = wsMgr.current
  if (!current) return

  const wm = wsMgr.getWindowManager(current.id)
  windows = wm.getWindowIds().map(id => ({
    workspaceId: current.id,
    id,
    bodyEl: wm.getBodyElement(id)!,
    component: resolveComponent(id),
  }))
}

function subscribeWorkspace(workspaceId: string) {
  const wm = wsMgr.getWindowManager(workspaceId)
  disposers.push(
    wm.events.on('window:opened', syncWindows),
    wm.events.on('window:closed', syncWindows),
    wm.events.on('window:restored', syncWindows),
  )
}

disposers.push(
  wsMgr.events.on('workspace:added', state => subscribeWorkspace(state.id)),
  wsMgr.events.on('workspace:switched', syncWindows),
)

// On app unmount:
disposers.forEach(dispose => dispose())
```

Use a workspace-aware key for portal/teleport nodes:

```tsx
// React
windows.map(win => {
  const Component = win.component
  return createPortal(<Component />, win.bodyEl, `${win.workspaceId}:${win.id}`)
})
```

```vue
<!-- Vue -->
<Teleport v-for="win in windows" :key="`${win.workspaceId}:${win.id}`" :to="win.bodyEl">
  <component :is="win.component" />
</Teleport>
```

---

### `TaskView` — Workspace Switcher Overlay

Shows a full-screen overlay with real DOM-clone thumbnails of every workspace. Clicking a card switches to that workspace.

```typescript
import { TaskView } from 'deskpane/workspace'

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

**Pages covered (21 total):**

| Category | Pages |
|----------|-------|
| Getting Started | Overview, Installation, Quick Start, Troubleshooting |
| Core API | WindowManager Options, Open & Close, Min / Max / Restore, Snap & Alignment, Events, Session |
| Theming | Theme System |
| Desktop Module | Desktop & Dock, BorderLayout |
| Workspace Module | Workspace, TaskView |
| Vanilla JS | Hello World, DOM Content, jQuery |
| Vue 3 | useWindowManager, KeepAlive |
| React | useWindowManager |

---

## Troubleshooting

### CSS import vs runtime injection

If your app imports DeskPane CSS through a bundler, keep style order predictable by disabling runtime injection:

```typescript
import 'deskpane/dist/styles/deskpane.css'
import 'deskpane/dist/styles/deskpane-desktop.css'
import 'deskpane/dist/themes/light.css'

new Desktop({
  container,
  injectStyles: false,
})

new WorkspaceManager(desktop.getElement(), {
  injectStyles: false,
  windowManagerOptions: {
    isolated: true,
    snap: true,
    injectStyles: false,
  },
})
```

### Vite source-development CSS error

When developing directly against DeskPane source, Vite may report:

```text
deskpane-desktop.css does not provide an export named default
```

DeskPane's library build converts internal CSS imports into strings. Vite dev needs the demo raw CSS plugin so DeskPane source CSS can be imported as a string while the host app's manual CSS imports still use normal CSS handling.

### Vue / React workspace content goes black

DeskPane owns the window DOM. Vue and React content is mounted by `Teleport` / `createPortal`. In multi-workspace apps:

- Make real window ids workspace-scoped, for example `ws-2::counter`.
- Include `workspaceId:id` in portal / teleport keys.
- Re-sync framework state after `workspace:switched`.

### Transparent window or pointer-event issues

Core CSS should give `.dp-window`, `.dp-header`, and `.dp-body` reliable backgrounds and `pointer-events:auto`. If your app overrides these classes, check that runtime CSS is not injected after your override stylesheet.

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
| `dist/deskpane.es.js` | ESM | ~23 KB | Vite / Webpack / `type="module"` (dev) |
| `dist/deskpane.es.min.js` | ESM | ~12 KB | Production ESM |
| `dist/deskpane.umd.js` | UMD | ~26 KB | Script tag / jQuery (dev) |
| `dist/deskpane.umd.min.js` | UMD | ~12 KB | Production CDN |
| `dist/deskpane-desktop.es.js / .min.js` | ESM | — | Desktop module (ESM) |
| `dist/deskpane-desktop.umd.js / .min.js` | UMD | — | Desktop module (`window.DeskPaneDesktop`) |
| `dist/deskpane-workspace.es.js / .min.js` | ESM | — | Workspace + TaskView + Session module (ESM) |
| `dist/deskpane-workspace.umd.js / .min.js` | UMD | — | Workspace module (`window.DeskPaneWorkspace`) |
| `dist/index.d.ts` | TypeScript | — | Core type declarations |
| `dist/desktop.d.ts` | TypeScript | — | Desktop type declarations |
| `dist/workspace.d.ts` | TypeScript | — | Workspace + TaskView + Session type declarations |
| `dist/themes/light.css` | CSS | ~2 KB | Light theme (Core + Desktop) |
| `dist/themes/dark.css` | CSS | ~2 KB | Dark theme (Core + Desktop) |
| `dist/themes/medieval-pixel.css` | CSS | ~3 KB | Medieval pixel theme (Core + Desktop + pixel UI assets) |
| `dist/themes/assets/medieval-pixel/` | Assets | — | Pixel UI source assets used by the Medieval Pixel theme |
| `dist/styles/deskpane.css` | CSS | — | Core window structure styles (direct `<link>`) |
| `dist/styles/deskpane-desktop.css` | CSS | — | Desktop / Dock / Icon styles (direct `<link>`) |
| `dist/styles/deskpane-layout.css` | CSS | — | BorderLayout / Panel styles (direct `<link>`) |
| `dist/styles/deskpane-workspace.css` | CSS | — | Workspace container / slide animation styles (direct `<link>`) |
| `dist/styles/deskpane-taskview.css` | CSS | — | TaskView overlay / card / thumbnail styles (direct `<link>`) |

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

## Roadmap

- [ ] CDN publish (jsDelivr / unpkg auto-sync after npm publish)
- [ ] Angular adapter
- [ ] Window state persistence (localStorage / IndexedDB)
- [ ] Accessibility (ARIA roles, keyboard navigation)
- [x] More built-in themes

---

## Contributing

Contributions are welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request.

Useful checks:

```bash
npm run build
npm run build:lib
npm --prefix demo/vue run build
npm --prefix demo/react run build
npm --prefix demo/docs run build
```

---

## Community Standards

- [Code of Conduct](CODE_OF_CONDUCT.md)
- [Contributing Guide](CONTRIBUTING.md)
- [Security Policy](SECURITY.md)
- [Bug reports / feature requests / documentation issues](.github/ISSUE_TEMPLATE)
- [Pull request template](.github/pull_request_template.md)

---

## License

Apache-2.0 © 2026 Brian Cheng

See [LICENSE](LICENSE) for full terms.

