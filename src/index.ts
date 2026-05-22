// ============================================================
// WebOS-Core — Public Entry Point
// ============================================================

export { WindowManager } from './core/WindowManager.js';
export { EventBus, eventBus } from './core/EventBus.js';
export type {
  WindowState,
  WindowConfig,
  SlotType,
  EventCallback,
} from './core/types.js';
export type { WinEvent } from './core/WindowManager.js';
export type { SnapRect, SnapGuide, SnapResult } from './core/SnapHelper.js';
export { snapPosition } from './core/SnapHelper.js';
export type { WosThemePreset, SetThemeOptions } from './themes/setTheme.js';
export { setTheme } from './themes/setTheme.js';
export { BorderLayout } from './layout/BorderLayout.js';
export type { RegionConfig, BorderLayoutOptions, LayoutRegion } from './layout/BorderLayout.js';
export { Panel } from './layout/Panel.js';
export type { PanelOptions } from './layout/Panel.js';
