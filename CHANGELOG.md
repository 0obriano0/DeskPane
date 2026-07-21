# Changelog

## 0.3.4 - Unreleased

### Added

- Added a Vitest + jsdom regression suite covering WindowManager lifecycle and edge snap, Dock slots/item rendering/SystemTray, Menu keyboard behavior, SessionManager restore, and the Vue `DpWindow` closed-window i18n regression.
- Added a general GitHub Actions CI workflow that runs tests and library builds on Node.js 20 and 22, then builds the complete GitHub Pages artifact and inspects the npm package contents.
- Added tracked npm lockfiles for reproducible root, Vue, React, and docs CI installs.

### Changed

- Updated the roadmap after the 0.3.3 release to reflect live CDN distribution and the existing SessionManager persistence API.
- Updated Vitest to 3.2.6 and `@rollup/plugin-terser` to 1.0.0 so the root development dependency audit reports no known vulnerabilities.
- Building DeskPane from source now requires Node.js 20 or newer; the published browser library still targets ES2020.

### Fixed

- Fixed SessionManager restore order so snapshots captured from minimized, maximized windows preserve both states.

## 0.3.3 - 2026-07-20

### Added

- Added a demo-local Win7 showcase theme with window chrome, Desktop/Dock variables, layout variables, and edge-snap preview styling.
- Added the Windows 7 desktop demo and a Win7 Demo quick-load option in Theme Editor.
- Added the optional `deskpane/menu` bundle with `StartMenu`, `ContextMenu`, ESM/UMD builds, TypeScript declarations, and standalone structural CSS.
- Added nested submenus, disabled and checked items, separators, shortcut labels, command callbacks, keyboard navigation, outside-click closing, viewport-aware placement, and `menu:open` / `menu:close` / `menu:select` events.
- Added menu theme variables to the light and dark themes, the legacy Medieval Pixel compatibility theme, and the demo-local Win7/XP showcase themes, plus a bilingual developer docs page with Vanilla, jQuery, Vue, and React examples.
- Added direct DOM `Node` content and `iconRenderer(context)` to `DesktopIconConfig`, while preserving existing URL, inline SVG, and emoji strings.
- Added a demo-local XP-like showcase theme, an original XP-like desktop demo, Theme Editor quick-load support, documentation, and GitHub Pages discovery.
- Added opt-in Dock `leading` and `trailing` slots with DOM Node/renderer content, dynamic replacement APIs, orientation-aware layout, and a scrollable center item strip.
- Added opt-in Dock `itemRenderer` and `itemLayout: 'taskbar'`, runtime layout/renderer setters, taskbar CSS variables, and Enter/Space item activation while preserving the classic Dock default.
- Added the optional `SystemTray` helper with typed command/status items, badges, custom renderers, runtime item APIs, accessible semantics, events, and themeable structural CSS for Dock trailing slots.

### Changed

- Moved the unreleased Win7 and XP showcase CSS out of `src/themes/` and the npm theme bundle into their respective demo folders.
- Extended `setTheme()` to accept custom theme names and direct CSS paths/URLs while retaining the deprecated `WosThemePreset` type alias for compatibility.
- Kept `medieval-pixel` in the package as a legacy compatibility theme; light and dark remain the general-purpose bundled themes.
- Refactored the Win7 demo to use the official `StartMenu` and `ContextMenu` module, including a desktop right-click menu.
- Refactored the Win7 demo taskbar to use the official Dock `leading` and `trailing` slots for its Start button and clock tray.
- Refactored the XP-like demo to place its Start button and system tray directly inside the official Dock slots instead of overlaying a separate taskbar.
- Refactored the Win7 and XP-like demo status areas to use the official `SystemTray` API while keeping their showcase styling demo-local.
- Updated the bilingual Desktop developer docs and all framework samples with `SystemTray` usage, API methods, and events.
- Refactored Win7 and XP-like running-window buttons to use the official taskbar item layout and CSS variables instead of duplicating structural item CSS.
- Updated Theme Editor with opt-in Dock/taskbar preview controls and editable taskbar item sizing, spacing, padding, radius, and alignment variables.

### Fixed

- Fixed the root `npm run dev` command so static demos can load `dist/` bundles and themes while still opening the demo index.
- Fixed StartMenu and ContextMenu positioning when a custom target is wider than the viewport or partially off-screen, keeping menus inside mobile viewport bounds.
- Fixed Theme Editor Desktop preview controls dropping sample windows and Dock items after a rebuild, and now dispose replaced Desktop/WindowManager instances before recreating the preview.

## 0.3.2 - 2026-07-06

### Added

- Added integrated vue-i18n language switching to the Vue demo Settings window, covering desktop icon labels, open window titles, and existing Vue window content.

### Fixed

- Fixed Vue declarative `<DpWindow>` state sync when closed windows remain mounted and reactive props such as vue-i18n `title` / `label` change before reopening.

## 0.3.1 - 2026-06-18

### Added

- Added Windows-like drag restore for maximized windows: dragging a maximized title bar past `maximizedDragRestoreThreshold` restores the saved window size and continues the same drag gesture.
- Added `window:maximized-drag-restored` so apps can distinguish drag-to-restore from regular restore actions.
- Added Windows-like edge snap preview: dragging a resizable window pointer to the top edge previews maximize, while left/right pointer edges preview half-screen placement and apply on release.
- Added `edgeSnap`, `edgeSnapThreshold`, and `window:edge-snapped` with an `edgeSnapTarget` payload for apps that need to react to top/left/right snap actions.
- Added interaction lifecycle events: `window:drag-start`, `window:drag-end`, `window:resize-start`, `window:resize-end`, `window:edge-snap-preview`, and `window:edge-snap-preview-clear`.

### Changed

- Documented the full WindowManager and Desktop event surfaces in README and developer docs.

## 0.3.0 - 2026-06-18

### Added

- Added an official jQuery adapter exported as `deskpane/jquery`, with `dpWindowManager`, `dpWindow`, `dpDesktop`, `dpWorkspaceManager`, `dpWorkspaceWindow`, and `dpTaskView` plugins plus ESM/UMD bundles and TypeScript declarations.
- Added GitHub repository links to the demo landing page and all web demo entries.
- Refactored the vanilla and jQuery demos into focused DeskPane API labs covering Desktop, Dock sync, WindowManager controls, WorkspaceManager, TaskView, child/modal windows, events, snap gap, and BorderLayout.
- Moved floating GitHub links in desktop-style demos away from the top-right window control area so maximized windows remain fully operable.
- Fixed the React demo GitHub link styling by loading the demo app stylesheet.
- Added a docs Troubleshooting page covering Vite CSS imports, runtime style injection, workspace-scoped portal/teleport windows, TaskView snapshots, and pointer-event issues.

### Changed

- Refactored the docs Quick Start page with Wijmo-like framework tabs for Vanilla JS, jQuery, Vue 3, and React code samples.
- Refactored key docs feature pages to show Vanilla JS, jQuery, Vue 3, and React code samples inside each feature page instead of splitting jQuery into a standalone docs route.
- Removed standalone Vanilla/Vue/React/jQuery docs routes from the main docs navigation so frameworks are presented as per-feature code tabs instead of separate sections.
- Moved docs code samples into the live-demo section so code panels sit beside the related demo instead of occupying a global right rail.
- Simplified the docs top navigation to the main demo landing page, docs, Desktop demo, Theme editor, and GitHub.
- Updated the Desktop docs live demo so the Dock starts empty and only reflects currently open windows.
- Expanded the docs Installation page and README with clearer npm, CDN, manual CSS import, and `injectStyles:false` guidance.
- Refactored the jQuery demo to use the official adapter plugin surface for `dpDesktop`, `dpWindow`, and Dock sync while retaining WorkspaceManager and TaskView integration.
- Updated the jQuery adapter to accept WindowManager-like objects by duck typing, so UMD bundles from `deskpane-workspace` interoperate with `deskpane-jquery`.
- Refactored the jQuery demo again as a full 0.3.0 adapter showcase using `dpDesktop`, `dpWorkspaceManager`, `dpTaskView`, and `dpWorkspaceWindow`.

## 0.2.3 - 2026-06-17

### Added

- Added `parentId` and `modal` props to the Vue `<DpWindow>` component so declarative Vue windows can use core child/modal window behavior.
- Added a Vue workspace demo that mirrors the desktop settings child-window example with modal and non-modal child buttons.

## 0.2.2 - 2026-06-16

### Added

- Added SEO metadata for the GitHub Pages demo landing page and individual demo entries.
- Added canonical, Open Graph, and Twitter card metadata for Vue, React, docs, vanilla, jQuery, desktop, layout, and theme editor demos.
- Added `robots.txt` and `sitemap.xml` generation to the GitHub Pages artifact.
- Added `homepage` and expanded npm keywords in `package.json` for better npm and GitHub discoverability.

### Changed

- Improved `scripts/prepare-pages.mjs` so the generated root Pages entry includes SEO metadata before redirecting to the demo landing page.
- Made `.pages` cleanup more tolerant of transient Dropbox file locks during Pages artifact preparation.

### Removed

- Removed `PROJECT_STATUS.md` from the public project tree and added it to `.gitignore` as a local/private project note.

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
