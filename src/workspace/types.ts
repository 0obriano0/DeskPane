// ============================================================
// DeskPane — Workspace Types
// ============================================================

import type { WindowConfig } from '../core/types.js';

/** 建立工作區時的設定 */
export interface WorkspaceConfig {
  /** 唯一識別碼（必填） */
  id: string;
  /** 顯示名稱，用於指示器 / aria-label */
  label?: string;
  /** 工作區圖示（emoji 或圖片 URL） */
  icon?: string;
}

/** 工作區的執行時狀態 */
export interface WorkspaceState {
  id: string;
  label: string;
  icon?: string;
  /** 工作區的 DOM 容器（已掛載到 WorkspaceManager 根容器內） */
  container: HTMLElement;
}

/** Workspace-aware window id helper options. */
export interface WorkspaceWindowIdOptions {
  /** Separator between workspace id and app id. Default: `::app-`. */
  separator?: string;
}

/** Parsed result from a workspace-scoped window id. */
export interface WorkspaceWindowIdParts {
  workspaceId: string;
  appId: string;
}

/**
 * Window config for `WorkspaceManager.openWindow()`.
 * Use `appId` to let DeskPane generate a workspace-scoped window id.
 */
export interface WorkspaceOpenWindowConfig extends Omit<WindowConfig, 'id'> {
  /**
   * Logical application id. When provided, DeskPane opens the window with a
   * workspace-scoped id such as `ws-2::app-counter`.
   */
  appId?: string;
  /**
   * Explicit window id. If omitted, `appId` is required and a scoped id is
   * generated automatically.
   */
  id?: string;
  /** Target workspace. Defaults to the current workspace. */
  workspaceId?: string;
}

/** Dock 最小介面（duck typing，避免 workspace 直接依賴 desktop bundle） */
export interface DockLike {
  addItem(item: { id: string; label: string; icon: string; action: () => void }): void;
  /** 在指定索引插入按鈕（0 = 最左/最上）。超出範圍自動夾緊。 */
  addItemAt(item: { id: string; label: string; icon: string; action: () => void }, index: number): void;
  removeItem(id: string): void;
}

/** TaskView 建構選項 */
export interface TaskViewOptions {
  /**
   * 覆蓋層掛載的 DOM 目標，預設 document.body。
   */
  target?: HTMLElement;
  /**
   * 是否顯示「新增桌面」按鈕，預設 true。
   */
  allowAdd?: boolean;
  /**
   * 是否顯示「刪除桌面」按鈕，預設 true。
   */
  allowDelete?: boolean;
  /**
   * 是否監聽 Escape 鍵關閉 Task View，預設 true。
   */
  keyboard?: boolean;
  /**
   * 點擊遮罩背景時是否關閉，預設 true。
   */
  closeOnBackdrop?: boolean;
  /**
   * 新增工作區時的設定產生器。
   * 若不提供，預設自動產生 id='ws-N'、label='桌面 N'。
   */
  onCreateWorkspace?: () => WorkspaceConfig;
  /**
   * 是否自動注入 TaskView CSS，預設 true。
   */
  injectStyles?: boolean;
  /**
   * Dock 實例。提供後 TaskView 可自動管理「虛擬桌面」按鈕。
   */
  dock?: DockLike;
  /**
   * 是否在 Dock 顯示「虛擬桌面」按鈕，預設 true。
   * 設為 false 時按鈕不會加入 Dock，但 `open()` / `toggle()` 仍可呼叫。
   */
  showButton?: boolean;
  /**
   * Dock 按鈕標籤文字，預設「虛擬桌面」。
   */
  buttonLabel?: string;
  /**
   * Dock 按鈕圖示（emoji 或 URL），預設「⧉」。
   */
  buttonIcon?: string;
  /**
   * Dock 按鈕的唯一 ID，預設「dp-tv-button」。
   */
  buttonId?: string;
}

/** WorkspaceManager 建構選項 */
export interface WorkspaceManagerOptions {
  /**
   * 切換動畫持續時間（ms），預設 250。
   * 設為 0 則直接切換（無動畫）。
   */
  animationMs?: number;
  /**
   * 是否自動注入 Workspace CSS，預設 true。
   * 設為 false 時也會套用到內部建立的 WindowManager，
   * 除非 windowManagerOptions.injectStyles 明確指定其他值。
   */
  injectStyles?: boolean;
  /**
   * 傳給每個 WindowManager 的選項（snap、throttle 等）。
   * 每個工作區的 WindowManager 都套用相同選項。
   */
  windowManagerOptions?: import('../core/WindowManager.js').WindowManagerOptions;
  /**
   * Warn when the same raw window id exists in more than one workspace.
   * This helps catch Dock/Portal/Teleport identity bugs early.
   * Default: true.
   */
  warnOnDuplicateWindowIds?: boolean;
}
