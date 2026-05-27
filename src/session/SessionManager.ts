// ============================================================
// WebOS-Core — SessionManager
// 視窗狀態序列化 / 還原工具
// 支援：
//   • 單一 WindowManager 模式
//   • 多工作區 WorkspaceManager 模式
// ============================================================

import { WindowManager } from '../core/WindowManager.js';
import { WindowState } from '../core/types.js';
import { WorkspaceManager } from '../workspace/WorkspaceManager.js';
import { AppRegistry, SessionSnapshot, WindowSnapshot, WorkspaceSnapshot } from './types.js';

export class SessionManager {
  // ── Serialize ──────────────────────────────────────────────

  /**
   * 序列化單一 WindowManager 的視窗狀態，回傳 JSON 字串。
   * 僅保留可序列化的幾何與元資料；content 不保存。
   * 若視窗的 props.appId 不存在，該視窗會被略過（無法還原）。
   */
  static serializeWindows(wm: WindowManager): string {
    const snapshot: SessionSnapshot = {
      version: 1,
      currentWorkspaceId: null,
      windows: SessionManager._snapshotWindows(wm),
    };
    return JSON.stringify(snapshot);
  }

  /**
   * 序列化 WorkspaceManager（含所有工作區與各自的視窗），回傳 JSON 字串。
   */
  static serializeWorkspaces(wsm: WorkspaceManager): string {
    const workspaces: WorkspaceSnapshot[] = wsm.workspaces.map(ws => ({
      id: ws.id,
      label: ws.label,
      icon: ws.icon,
      windows: SessionManager._snapshotWindows(wsm.getWindowManager(ws.id)),
    }));

    const snapshot: SessionSnapshot = {
      version: 1,
      currentWorkspaceId: wsm.current?.id ?? null,
      workspaces,
    };
    return JSON.stringify(snapshot);
  }

  // ── Restore ────────────────────────────────────────────────

  /**
   * 從 JSON 字串還原視窗到指定 WindowManager。
   * content 透過 registry[appId](props) 重建。
   * 無法在 registry 找到對應 appId 的視窗會被略過（跳過並 console.warn）。
   */
  static restoreWindows(
    json: string,
    registry: AppRegistry,
    wm: WindowManager,
  ): void {
    const snapshot = SessionManager._parse(json);
    if (!snapshot.windows) {
      console.warn('[SessionManager] restoreWindows: snapshot has no windows array');
      return;
    }
    SessionManager._restoreWindowList(snapshot.windows, registry, wm);
  }

  /**
   * 從 JSON 字串還原多工作區狀態到 WorkspaceManager。
   * 每個工作區若已存在則直接使用，若不存在則新建。
   * 所有工作區還原完畢後，切換到快照記錄的活躍工作區。
   */
  static restoreWorkspaces(
    json: string,
    registry: AppRegistry,
    wsm: WorkspaceManager,
  ): void {
    const snapshot = SessionManager._parse(json);
    if (!snapshot.workspaces) {
      console.warn('[SessionManager] restoreWorkspaces: snapshot has no workspaces array');
      return;
    }

    for (const wsSnap of snapshot.workspaces) {
      // Create workspace if not already present
      const existing = wsm.workspaces.find(w => w.id === wsSnap.id);
      if (!existing) {
        wsm.addWorkspace({ id: wsSnap.id, label: wsSnap.label, icon: wsSnap.icon });
      }
      const wm = wsm.getWindowManager(wsSnap.id);
      SessionManager._restoreWindowList(wsSnap.windows, registry, wm);
    }

    // Switch to the previously active workspace
    if (snapshot.currentWorkspaceId) {
      try {
        wsm.switchTo(snapshot.currentWorkspaceId);
      } catch {
        // workspace might not exist; ignore
      }
    }
  }

  // ── Private helpers ────────────────────────────────────────

  private static _snapshotWindows(wm: WindowManager): WindowSnapshot[] {
    const states: WindowState[] = wm.getAllStates();
    const snapshots: WindowSnapshot[] = [];

    for (const state of states) {
      const appId = state.props?.appId as string | undefined;
      if (!appId) {
        // Can't restore without appId; skip silently
        continue;
      }
      snapshots.push({
        id: state.id,
        title: state.title,
        icon: state.icon,
        label: state.label,
        appId,
        x: state.x,
        y: state.y,
        width: state.width,
        height: state.height,
        zIndex: state.zIndex,
        isMinimized: state.isMinimized,
        isMaximized: state.isMaximized,
        resizable: state.resizable,
        props: state.props,
      });
    }

    // Sort by zIndex so open() calls restore correct stacking order
    return snapshots.sort((a, b) => a.zIndex - b.zIndex);
  }

  private static _restoreWindowList(
    windows: WindowSnapshot[],
    registry: AppRegistry,
    wm: WindowManager,
  ): void {
    for (const snap of windows) {
      const factory = registry[snap.appId];
      if (!factory) {
        console.warn(`[SessionManager] No factory found for appId: "${snap.appId}" — skipping window "${snap.id}"`);
        continue;
      }

      const content = factory(snap.props);

      wm.open({
        id: snap.id,
        title: snap.title,
        icon: snap.icon,
        label: snap.label,
        content,
        x: snap.x,
        y: snap.y,
        width: snap.width,
        height: snap.height,
        resizable: snap.resizable,
        props: snap.props,
      });

      if (snap.isMinimized) wm.minimize(snap.id);
      if (snap.isMaximized) wm.maximize(snap.id);
    }
  }

  private static _parse(json: string): SessionSnapshot {
    try {
      const data = JSON.parse(json) as SessionSnapshot;
      if (data.version !== 1) {
        console.warn(`[SessionManager] Unknown snapshot version: ${data.version}`);
      }
      return data;
    } catch (e) {
      throw new Error(`[SessionManager] Failed to parse session snapshot: ${e}`);
    }
  }
}
