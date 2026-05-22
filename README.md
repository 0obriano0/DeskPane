# WebOS-Core

A **framework-agnostic** web virtual desktop window management engine.

The core handles all window lifecycle, drag/resize, focus, and z-order — your UI framework handles the content.

[![npm version](https://img.shields.io/npm/v/webos-core.svg)](https://www.npmjs.com/package/webos-core)
[![license](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)

---

## Features

- ✅ Open, close, minimize, maximize, restore windows
- ✅ Drag & resize with throttling (60 fps by default)
- ✅ **Snap alignment** — windows magnetically snap to edges and each other while dragging
- ✅ Focus / z-order management
- ✅ Event bus — subscribe to any window lifecycle event
- ✅ Isolated mode — embed a desktop inside any page element
- ✅ Vue 3 adapter — `useWindowManager` composable + `Teleport` support
- ✅ React 18 adapter — `useWindowManager` hook + `createPortal` support
- ✅ ES Module + UMD builds — works with bundlers or plain `<script>` tags
- ✅ Minified builds — `webos-core.es.min.js` / `webos-core.umd.min.js`
- ✅ **Theme system** — built-in light/dark CSS themes with CSS custom properties; `setTheme()` utility for runtime switching
- ✅ **BorderLayout** — EasyUI-style N/S/E/W/Center docking layout; HTML-first `data-region` declaration; collapsible panels with mini strip; draggable splitters; nested layouts

---

## Installation

### npm

```bash
npm install webos-core
```

### CDN / Script Tag (UMD)

```html
<script src="dist/webos-core.umd.js"></script>
```

---

## Quick Start

### ES Module (Vite / Webpack / native `type="module"`)

```typescript
import { WindowManager } from 'webos-core'

const wm = new WindowManager({
  container: document.getElementById('desktop')!,
  isolated: true,
})

const el = document.createElement('div')
el.style.padding = '20px'
el.innerHTML = '<h3>Hello, World!</h3>'

wm.open({ id: 'hello', title: 'My Window', content: el })
```

### Script Tag (UMD / no build step)

```html
<!DOCTYPE html>
<html>
<body>
  <div id="desktop" style="width:100vw; height:100vh; position:relative;"></div>

  <script src="dist/webos-core.umd.js"></script>
  <script>
    var wm = new window.WebOS.WindowManager({
      container: document.getElementById('desktop'),
      isolated: true
    })

    var el = document.createElement('div')
    el.style.padding = '20px'
    el.textContent = 'Hello from UMD!'

    wm.open({ id: 'hello', title: 'My Window', content: el })
  </script>
</body>
</html>
```

### Vue 3

Add a path alias in your `vite.config.ts`:

```typescript
// vite.config.ts
resolve: { alias: { '@webos': '/path/to/webos-core/src' } }
```

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
| `snap` | `boolean` | `true` | Enable magnetic snap alignment while dragging |
| `snapThreshold` | `number` | `20` | Snap trigger distance in pixels |

### Core Methods

| Method | Description |
|--------|-------------|
| `wm.open(config)` | Open a window (restores & focuses if ID already exists) |
| `wm.close(id)` | Close and remove a window |
| `wm.minimize(id)` | Minimize a window |
| `wm.maximize(id)` | Maximize a window |
| `wm.restore(id)` | Restore from minimized or maximized |
| `wm.focus(id)` | Bring window to front |
| `wm.setTitle(id, title)` | Update the window title bar |
| `wm.getState(id)` | Get current `WindowState` |
| `wm.getBodyElement(id)` | Get the window's content `HTMLElement` |
| `wm.getWindowIds()` | Get all open window IDs |
| `wm.destroy()` | Destroy all windows and clean up DOM |

### `WindowConfig`

```typescript
interface WindowConfig {
  id: string           // Unique window ID (required)
  title: string        // Window title bar text
  content: any         // HTMLElement, or null when using framework adapters
  slotType?: 'dom' | 'vue' | 'react'  // Renderer mode, default 'dom'
  x?: number           // Initial X position (px)
  y?: number           // Initial Y position (px)
  width?: number       // Initial width (px), default 640
  height?: number      // Initial height (px), default 480
  props?: Record<string, unknown>
}
```

### Events

```typescript
wm.events.on('window:opened',    (state) => { /* ... */ })
wm.events.on('window:closed',    (state) => { /* ... */ })
wm.events.on('window:focused',   (state) => { /* ... */ })
wm.events.on('window:minimized', (state) => { /* ... */ })
wm.events.on('window:maximized', (state) => { /* ... */ })
wm.events.on('window:restored',  (state) => { /* ... */ })
wm.events.on('window:moved',     (state) => { /* ... */ })
wm.events.on('window:resized',   (state) => { /* ... */ })
```

### Vue 3 Adapter — `useWindowManager(opts?)`

Returns:

| Return | Type | Description |
|--------|------|-------------|
| `wm` | `WindowManager` | Underlying instance (advanced use) |
| `windows` | `ShallowRef<VueWindowEntry[]>` | Reactive window list for `v-for` + `<Teleport>` |
| `openVueWindow(config)` | `fn` | Open a Vue component window |
| `close / minimize / maximize / restore / focus / setTitle` | `fn` | Shorthand methods |

### React 18 Adapter — `useWindowManager(opts?)`

Returns:

| Return | Type | Description |
|--------|------|-------------|
| `wm` | `WindowManager` | Underlying instance (advanced use) |
| `windows` | `ReactWindowEntry[]` | State array for `createPortal` mapping |
| `openReactWindow(config)` | `fn` | Open a React component window |
| `close / minimize / maximize / restore / focus / setTitle` | `fn` | Shorthand methods |

---

## Theming

WebOS-Core uses CSS custom properties for all window styles. Built-in **light** and **dark** themes are included as standalone CSS files in `dist/themes/`.

### Loading a theme

```html
<!-- Place in <head>; swap href to change theme -->
<link id="wos-theme" rel="stylesheet" href="dist/themes/light.css">
```

### `setTheme(preset, options?)`

Utility function exported from the main bundle. Manages the theme `<link>` element automatically.

```typescript
import { setTheme } from 'webos-core'

setTheme('dark')                              // switches to dark (uses 'themes/' basePath by default)
setTheme('light', { basePath: '/themes' })    // explicit basePath for Vite/SPA
setTheme('dark',  { linkId: 'my-theme-link' }) // custom link element ID
```

**UMD / Script Tag:**

```javascript
WebOS.setTheme('dark', { basePath: 'dist/themes' })
```

### CSS custom properties

All 14 window style properties can be overridden to create your own theme:

```css
:root {
  --wos-window-bg:    #ffffff;
  --wos-header-bg:    #f0f0f0;
  --wos-title-color:  #333333;
  --wos-border:       #d0d0d0;
  --wos-border-active: #4a90e2;
  --wos-shadow:       0 2px 12px rgba(0,0,0,0.12);
  --wos-shadow-active: 0 4px 24px rgba(0,0,0,0.22);
  --wos-header-border: #e0e0e0;
  --wos-btn-color:    #555555;
  --wos-btn-hover-bg: rgba(0,0,0,0.08);
  --wos-btn-close-hover-bg:    #e53e3e;
  --wos-btn-close-hover-color: #ffffff;
  --wos-body-bg:      #ffffff;
  --wos-snap-guide-color: rgba(74,144,226,0.4);
}
```

---

## BorderLayout

Embed an EasyUI-style docking layout inside any window. Declare regions with `data-region` attributes — `WindowManager.open()` auto-detects and renders the layout.

### HTML-first declaration

```html
<script>
const content = document.createElement('div')
content.innerHTML = `
  <div data-region="north" data-title="Toolbar"  data-icon="🔧" data-size="40" data-collapsible></div>
  <div data-region="west"  data-title="Nav"      data-icon="📁" data-size="200" data-collapsible>
    <p>Sidebar content</p>
  </div>
  <div data-region="east"  data-title="Props"    data-icon="🔍" data-size="180" data-collapsible></div>
  <div data-region="south" data-title="Status"   data-size="28"  data-collapsible></div>
  <div data-region="center">
    <p>Main content</p>
  </div>
`
wm.open({ id: 'my-app', title: 'My App', width: 900, height: 600, content })
</script>
```

### JS-first declaration

```typescript
import { BorderLayout } from 'webos-core'

const layout = new BorderLayout({
  container: myElement,
  west:   { size: 200, minSize: 80, collapsible: true, title: 'Nav',   icon: '📁' },
  center: { },
  east:   { size: 180, minSize: 80, collapsible: true, title: 'Props', icon: '🔍' },
})
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

### Collapsed strip

When collapsed, a region shrinks to a **28px mini strip** (EasyUI style): expand button at top → icon → rotated title. Click the button to expand.

---

## Build Output

| File | Format | Size | Use when |
|------|--------|------|----------|
| `dist/webos-core.es.js` | ESM | ~23 KB | Vite / Webpack / `type="module"` (dev) |
| `dist/webos-core.es.min.js` | ESM | ~12 KB | Production ESM bundle |
| `dist/webos-core.umd.js` | UMD | ~26 KB | Script tag, jQuery, legacy pages (dev) |
| `dist/webos-core.umd.min.js` | UMD | ~12 KB | Production CDN / script tag |
| `dist/index.d.ts` | TypeScript declarations | — | IDE autocomplete & type checking |
| `dist/themes/light.css` | CSS | ~1 KB | Built-in light theme |
| `dist/themes/dark.css` | CSS | ~1 KB | Built-in dark theme |

---

## Building from Source

```bash
# Install dependencies
npm install

# Type-check only (no output)
npm run build

# Build ES + UMD bundles → dist/
npm run build:lib

# Clean dist/ and rebuild + package release/
npm run release
```

> **Note:** Requires Node.js 18+. The library build uses Rollup.

---

## Browser Support

Any modern browser supporting ES2020 (`optional chaining`, `nullish coalescing`, `Map`, `Set`).  
UMD bundle also works in older environments when transpiled by your build tool.

---

## License

Apache-2.0 © 2026 Brian Cheng

See [LICENSE](LICENSE) for full terms.
