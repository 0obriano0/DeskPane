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
