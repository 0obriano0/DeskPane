// ============================================================
// DeskPane — Public Entry Point
// ============================================================

export { getCoreCSS } from './renderers/DOMRenderer.js';
export { WindowManager } from './core/WindowManager.js';
export { EventBus, eventBus } from './core/EventBus.js';
export type {
  WindowState,
  WindowConfig,
  SlotType,
  EventCallback,
} from './core/types.js';
export type {
  WinEvent,
  WindowManagerOptions,
  EdgeSnapTarget,
  EdgeSnapEvent,
  EdgeSnapPreviewEvent,
} from './core/WindowManager.js';
export type { SnapRect, SnapGuide, SnapResult } from './core/SnapHelper.js';
export { snapPosition } from './core/SnapHelper.js';
export type { DeskPaneThemeName, WosThemePreset, SetThemeOptions } from './themes/setTheme.js';
export { setTheme } from './themes/setTheme.js';
export { BorderLayout } from './layout/BorderLayout.js';
export type { RegionConfig, BorderLayoutOptions, LayoutRegion } from './layout/BorderLayout.js';
export { Panel } from './layout/Panel.js';
export type { PanelOptions } from './layout/Panel.js';
export { getLayoutCSS } from './layout/styles.js';
