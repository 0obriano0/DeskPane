# Changelog

## 0.2.2 - Unreleased

_No changes yet._

## 0.2.1 - 2026-06-16

### Added

- Added a GitHub Pages build workflow for static demos, Vue, React, and docs.
- Added a downloadable `deskpane-pages-vX.X.X.zip` demo bundle to GitHub Release assets.

### Changed

- Changed GitHub Pages deployment to run from version tags (`v*`) instead of every `main` branch push.
- The main `demo/desktop/` entry now showcases the Medieval Pixel desktop demo.
- Vue, React, and docs demos now build with relative asset paths for GitHub Pages.
- Renamed remaining legacy project-name references to DeskPane across demos, docs, package metadata, and generated runtime output.
- Renamed old internal runtime data attributes to `data-dp-*`.

## 0.2.0 - 2026-06-16

### Added

- Added Wijmo-style desktop data binding with `itemsSource` and `DesktopCollectionView`.
- Added `Desktop.events` with icon and item synchronization events.
- Added `desktop.getItems()`, `desktop.getItem()`, `desktop.setItems()`, `desktop.setItemsSource()`, `desktop.updateItem()`, `desktop.refreshItems()`, and `desktop.refresh()`.
- Added Vue declarative components exported from `deskpane/vue`: `DpDesktop`, `DpDesktopIcon`, `DpWindowManager`, and `DpWindow`.
- Added Vue `v-model:items` support for desktop icon synchronization.
- Added Vue `v-model:open` support for declarative DeskPane windows.
- Added Wijmo-style `initialized` events to Vue declarative components for imperative instance access.
- Added a Vue declarative demo source at `demo/vue/src/DeclarativeApp.vue`.
- Added workspace-scoped window id helpers: `createWorkspaceWindowId()`, `parseWorkspaceWindowId()`, and `getAppIdFromWorkspaceWindowId()`.
- Added `WorkspaceManager.openWindow({ appId })` to open workspace-safe app windows without manually composing cross-workspace ids.
- Added duplicate raw window id warnings across workspaces, configurable with `warnOnDuplicateWindowIds`.

### Changed

- `DesktopIconConfig.action` is now optional, allowing icon data to be used as plain data records.
- The library build now emits `dist/deskpane-vue.es.js` and `dist/vue.d.ts`.

### Fixed

- Fixed the Vue demo KeepAlive behavior so switching virtual workspaces no longer recreates mounted Vue window components.
- Refactored `demo/vue` into smaller app catalog, workspace orchestration, and Teleport host modules.
- Fixed duplicate Vue window component identity in `demo/vue` so the same app opened on different workspaces keeps independent KeepAlive state and event targets.
- Fixed inactive workspaces receiving pointer/focus events while offscreen framework portals remain mounted.
- Fixed `demo/vue` virtual workspace switching so identical apps opened on different workspaces use unique window ids and resync focus when returning to a workspace.
- Hid inactive workspace DOM from hit-testing so offscreen window resize borders cannot be grabbed from another virtual desktop.
- Marked inactive workspace containers as `hidden` after transitions so scoped Vue Teleport content cannot receive clicks from another desktop.
- Fixed Task View workspace snapshots so cloned inactive workspaces are visible in previews even when the live workspace is hidden.
- Hid the Task View overlay when closed so its panel cannot intercept clicks after switching desktops.
- Updated `demo/vue` to use `WorkspaceManager.openWindow({ appId })` instead of hand-written workspace id composition.

## 0.1.4 - skip

### Added

- Added a Medieval Pixel preset to `demo/theme-editor/`.
- The Theme Editor can now load the full `dist/themes/medieval-pixel.css` file so image-based `border-image` styling can be previewed and edited.

### Fixed

- Fixed the GitHub Actions tag release workflow so `npm version` only runs when `package.json` does not already match the tag version.

## 0.1.3 - 2026-06-15

### Fixed

- Fixed Medieval Pixel theme window border styling.
- Adjusted `.dp-window` border sizing so the 9-slice panel frame renders more naturally when windows are resized.
- Updated generated theme CSS in `dist/themes/`, `demo/vue/public/themes/`, and `demo/react/public/themes/`.

## 0.1.2 - 2026-06-15

### Added

- Updated the main desktop demo at `demo/desktop/` to showcase the Medieval Pixel theme.
- Added the built-in `medieval-pixel.css` theme for DeskPane desktop windows, dock, and UI controls.
- Added Medieval Pixel UI assets under `dist/themes/assets/medieval-pixel/`.

### Documentation

- Updated `README.md` and `PROJECT_STATUS.md` with the Medieval Pixel theme, assets, and demo entry.

### Notes

- The Medieval Pixel desktop demo is now the main `demo/desktop/` example.
