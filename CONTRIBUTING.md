# Contributing to DeskPane

Thanks for helping improve DeskPane. This project is a framework-agnostic desktop/window management engine for the browser, with demos for plain JavaScript, Vue, React, workspace switching, theming, and layout patterns.

## Development Setup

```bash
npm install
npm run build
npm run build:lib
```

`npm run build` runs TypeScript checks only. `npm run build:lib` produces the library bundles and copies CSS files into `dist/`.

## Demo Projects

```bash
npm --prefix demo/vue run dev
npm --prefix demo/react run dev
npm --prefix demo/docs run dev
```

The Vue and React demos import DeskPane source directly during development. If you are working on CSS loading, workspace switching, or framework portal/teleport behavior, verify both demos.

## Before Opening a Pull Request

Please run the checks that match your change:

```bash
npm run build
npm run build:lib
```

For demo or documentation changes:

```bash
npm --prefix demo/vue run build
npm --prefix demo/react run build
npm --prefix demo/docs run build
```

## CSS Loading Notes

DeskPane supports both runtime CSS injection and bundler/manual CSS import. For bundler demos, prefer manual imports plus `injectStyles:false`:

```ts
import 'deskpane/styles/deskpane.css'
import 'deskpane/styles/deskpane-desktop.css'
import 'deskpane/styles/deskpane-workspace.css'

new Desktop({ injectStyles: false })
new WorkspaceManager(desktop.getElement(), {
  injectStyles: false,
  windowManagerOptions: {
    isolated: true,
    snap: true,
    injectStyles: false,
  },
})
```

When changing runtime style injection, make sure project-level CSS overrides still win over DeskPane core styles.

## Vue / React Workspace Notes

DeskPane owns the window DOM. Framework-rendered content inserted with Vue `<Teleport>` or React `createPortal` remains application state.

When using `WorkspaceManager`, keep portal/teleport state scoped to the active workspace:

- Resync framework window entries on `workspace:switched`.
- Subscribe to each new workspace's `WindowManager` on `workspace:added`.
- Use a key that includes both `workspaceId` and `window.id` when duplicate window IDs may exist in different workspaces.
- Clean up event subscriptions on unmount.

## Pull Request Guidelines

- Keep changes focused.
- Avoid unrelated formatting churn.
- Update README or docs when behavior changes.
- Add or update demos when a bug depends on browser interaction.
- Mention which builds or demos you verified.

## Reporting Bugs

Use the bug report issue template and include:

- Browser and OS.
- DeskPane version or commit.
- Framework, if any.
- Whether styles are runtime-injected or manually imported.
- Minimal reproduction steps.
- Screenshots or recordings for visual/drag/window issues.

