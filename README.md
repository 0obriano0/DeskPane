# WebOS-Core

A **framework-agnostic** web virtual desktop window management engine.

The core handles all window lifecycle, drag/resize, focus, and z-order — your UI framework handles the content.

[![npm version](https://img.shields.io/npm/v/webos-core.svg)](https://www.npmjs.com/package/webos-core)
[![license](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)

---

## Features

- ✅ Open, close, minimize, maximize, restore windows
- ✅ Drag & resize with throttling (60 fps by default)
- ✅ Focus / z-order management
- ✅ Event bus — subscribe to any window lifecycle event
- ✅ Isolated mode — embed a desktop inside any page element
- ✅ Vue 3 adapter — `useWindowManager` composable + `Teleport` support
- ✅ React 18 adapter — `useWindowManager` hook + `createPortal` support
- ✅ ES Module + UMD builds — works with bundlers or plain `<script>` tags

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

## Build Output

| File | Format | Use when |
|------|--------|----------|
| `dist/webos-core.es.js` | ESM | Vite / Webpack / `type="module"` |
| `dist/webos-core.umd.js` | UMD | Script tag, jQuery, legacy pages |
| `dist/index.d.ts` | TypeScript declarations | IDE autocomplete & type checking |

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
