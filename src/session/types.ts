// ============================================================
// WebOS-Core — Session Types
// ============================================================

/**
 * 單一視窗的幾何與元資料快照（可 JSON 序列化）。
 * `content` 不可序列化，改以 `appId + props` 描述如何重建。
 */
export interface WindowSnapshot {
  id: string;
  title: string;
  icon?: string;
  label?: string;
  /** 對應 AppRegistry 的鍵值，還原時用來重建 content */
  appId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  isMinimized: boolean;
  isMaximized: boolean;
  resizable: boolean;
  props?: Record<string, unknown>;
}

/** 單一工作區快照（含所有視窗） */
export interface WorkspaceSnapshot {
  id: string;
  label: string;
  icon?: string;
  windows: WindowSnapshot[];
}

/** 完整 session 快照（含工作區與當前頁） */
export interface SessionSnapshot {
  version: 1;
  currentWorkspaceId: string | null;
  /** 多工作區模式下的快照陣列 */
  workspaces?: WorkspaceSnapshot[];
  /** 單一 WindowManager 模式下直接存視窗陣列 */
  windows?: WindowSnapshot[];
}

/**
 * 應用程式登錄表。
 * key = appId（與 WindowSnapshot.appId 對應）
 * value = 工廠函式：傳入 props，回傳視窗 content（HTMLElement / Vue / React 元件）
 */
export type AppRegistry = Record<string, (props?: Record<string, unknown>) => unknown>;
