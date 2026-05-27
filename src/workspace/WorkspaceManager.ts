// ============================================================
// WebOS-Core — WorkspaceManager
// 管理多個虛擬工作區（每個工作區有獨立的 WindowManager + 容器）
// 支援：
//   • addWorkspace / removeWorkspace / switchTo
//   • 左右滑入動畫（CSS transform）
//   • 工作區指示點（可選）
//   • EventBus：workspace:added / workspace:removed / workspace:switched
// ============================================================

import { WindowManager, WindowManagerOptions } from '../core/WindowManager.js';
import { EventBus } from '../core/EventBus.js';
import { WorkspaceConfig, WorkspaceManagerOptions, WorkspaceState } from './types.js';
import WORKSPACE_CSS from '../styles/webos-workspace.css';

const WORKSPACE_STYLE_ID = 'wos-workspace-styles';

function injectWorkspaceStyles(): void {
  if (document.getElementById(WORKSPACE_STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = WORKSPACE_STYLE_ID;
  style.textContent = WORKSPACE_CSS;
  document.head.appendChild(style);
}

/** 取得 WorkspaceManager CSS（供 SSR 或自訂注入使用） */
export function getWorkspaceCSS(): string {
  return WORKSPACE_CSS;
}

export type WorkspaceEvent =
  | 'workspace:added'
  | 'workspace:removed'
  | 'workspace:switched';

export class WorkspaceManager {
  private readonly _root: HTMLElement;
  private readonly _animationMs: number;
  private readonly _wmOptions: WindowManagerOptions;
  private readonly _workspaces = new Map<string, WorkspaceState>();
  private readonly _windowManagers = new Map<string, WindowManager>();
  private _currentId: string | null = null;
  private _isAnimating = false;
  private _indicatorEl: HTMLElement | null = null;

  readonly events: EventBus;

  constructor(container: HTMLElement | string, options: WorkspaceManagerOptions = {}) {
    const el = typeof container === 'string'
      ? (() => {
          const found = document.querySelector<HTMLElement>(container);
          if (!found) throw new Error(`[WorkspaceManager] Container not found: ${container}`);
          return found;
        })()
      : container;

    this._animationMs = options.animationMs ?? 250;
    this._wmOptions   = options.windowManagerOptions ?? {};
    this.events       = new EventBus();

    if (options.injectStyles !== false) injectWorkspaceStyles();

    // Wrap the container
    this._root = document.createElement('div');
    this._root.className = 'wos-workspace-root';
    // Pass animation duration as CSS variable
    this._root.style.setProperty('--wos-workspace-animation-ms', `${this._animationMs}ms`);
    el.appendChild(this._root);
  }

  // ── Public API ─────────────────────────────────────────────

  /** 所有工作區的唯讀清單 */
  get workspaces(): WorkspaceState[] {
    return [...this._workspaces.values()];
  }

  /** 目前活躍的工作區，若尚無工作區則為 null */
  get current(): WorkspaceState | null {
    return this._currentId ? (this._workspaces.get(this._currentId) ?? null) : null;
  }

  /**
   * 新增工作區。
   * 若目前沒有活躍工作區，自動切換到新建的工作區。
   */
  addWorkspace(config: WorkspaceConfig): WorkspaceState {
    if (this._workspaces.has(config.id)) {
      throw new Error(`[WorkspaceManager] Workspace already exists: ${config.id}`);
    }

    // Create workspace container div
    const wsEl = document.createElement('div');
    wsEl.className = 'wos-workspace';
    wsEl.dataset.workspaceId = config.id;
    // Initially off-screen to the right
    wsEl.classList.add('wos-workspace--enter-right');
    this._root.appendChild(wsEl);

    // Create dedicated WindowManager
    const wm = new WindowManager({
      ...this._wmOptions,
      container: wsEl,
      isolated: true,
    });

    const state: WorkspaceState = {
      id: config.id,
      label: config.label ?? config.id,
      icon: config.icon,
      container: wsEl,
    };

    this._workspaces.set(config.id, state);
    this._windowManagers.set(config.id, wm);
    this._updateIndicator();
    this.events.emit<WorkspaceState>('workspace:added', state);

    // Auto-activate if this is the first workspace
    if (this._currentId === null) {
      this._activateImmediate(config.id);
    }

    return state;
  }

  /**
   * 移除工作區（同時銷毀其 WindowManager）。
   * 若移除的是目前工作區，自動切換到前一個（或後一個）。
   */
  removeWorkspace(id: string): void {
    const state = this._workspaces.get(id);
    if (!state) return;

    const wm = this._windowManagers.get(id);
    wm?.destroy();

    state.container.remove();
    this._workspaces.delete(id);
    this._windowManagers.delete(id);
    this._updateIndicator();
    this.events.emit<{ id: string }>('workspace:removed', { id });

    // If current was removed, switch to nearest remaining workspace
    if (this._currentId === id) {
      this._currentId = null;
      const remaining = [...this._workspaces.keys()];
      if (remaining.length > 0) {
        this._activateImmediate(remaining[0]);
        this.events.emit<{ from: string | null; to: string }>('workspace:switched', {
          from: id,
          to: remaining[0],
        });
      }
    }
  }

  /**
   * 切換到指定工作區，附帶左右滑入動畫。
   * 若目前正在切換動畫中，忽略此次呼叫。
   */
  switchTo(id: string): void {
    if (id === this._currentId) return;
    if (this._isAnimating) return;

    const next = this._workspaces.get(id);
    if (!next) throw new Error(`[WorkspaceManager] Workspace not found: ${id}`);

    const ids = [...this._workspaces.keys()];
    const currentIndex = this._currentId ? ids.indexOf(this._currentId) : -1;
    const nextIndex = ids.indexOf(id);
    const goingRight = nextIndex > currentIndex;

    const currentEl = this._currentId
      ? this._workspaces.get(this._currentId)?.container ?? null
      : null;
    const nextEl = next.container;

    this._isAnimating = true;

    // Position next workspace off-screen
    nextEl.classList.remove('wos-workspace--enter-left', 'wos-workspace--enter-right');
    nextEl.classList.add(goingRight ? 'wos-workspace--enter-right' : 'wos-workspace--enter-left');
    // Make it visible but off-screen so transition can play
    nextEl.style.visibility = 'visible';

    // Force reflow so the initial transform is applied before transition
    nextEl.getBoundingClientRect();

    // Slide current out
    if (currentEl) {
      currentEl.classList.add(goingRight ? 'wos-workspace--leave-left' : 'wos-workspace--leave-right');
      currentEl.classList.remove('wos-workspace--active');
    }

    // Slide next in
    nextEl.classList.remove('wos-workspace--enter-left', 'wos-workspace--enter-right');
    nextEl.classList.add('wos-workspace--active');

    const prevId = this._currentId;
    this._currentId = id;
    this._updateIndicator();

    const cleanup = () => {
      this._isAnimating = false;
      if (currentEl) {
        currentEl.classList.remove('wos-workspace--leave-left', 'wos-workspace--leave-right');
        currentEl.style.visibility = '';
      }
      this.events.emit<{ from: string | null; to: string }>('workspace:switched', {
        from: prevId,
        to: id,
      });
    };

    if (this._animationMs > 0) {
      let cleanupCalled = false;
      const safeCleanup = () => {
        if (cleanupCalled) return;
        cleanupCalled = true;
        nextEl.removeEventListener('transitionend', safeCleanup);
        cleanup();
      };
      nextEl.addEventListener('transitionend', safeCleanup, { once: true });
      // Fallback: ensure cleanup fires even if transitionend doesn't fire
      setTimeout(safeCleanup, this._animationMs + 50);
    } else {
      cleanup();
    }
  }

  /**
   * 取得指定工作區的 WindowManager。
   * 用於直接呼叫 wm.open() / wm.close() 等操作。
   */
  getWindowManager(workspaceId: string): WindowManager {
    const wm = this._windowManagers.get(workspaceId);
    if (!wm) throw new Error(`[WorkspaceManager] Workspace not found: ${workspaceId}`);
    return wm;
  }

  /**
   * 啟用工作區指示點（小圓點）。
   * 會在根容器底部顯示，指示當前所在工作區。
   */
  enableIndicator(): void {
    if (this._indicatorEl) return;
    const bar = document.createElement('div');
    bar.className = 'wos-workspace-indicator';
    this._root.appendChild(bar);
    this._indicatorEl = bar;
    this._updateIndicator();
  }

  disableIndicator(): void {
    this._indicatorEl?.remove();
    this._indicatorEl = null;
  }

  /** 銷毀所有工作區並清理資源 */
  destroy(): void {
    this._windowManagers.forEach(wm => wm.destroy());
    this._windowManagers.clear();
    this._workspaces.clear();
    this._root.remove();
    this._currentId = null;
  }

  // ── Private helpers ────────────────────────────────────────

  /** 無動畫直接啟用（初始化或移除當前工作區時使用） */
  private _activateImmediate(id: string): void {
    const state = this._workspaces.get(id);
    if (!state) return;

    // Deactivate previous
    if (this._currentId && this._currentId !== id) {
      const prev = this._workspaces.get(this._currentId);
      if (prev) {
        prev.container.classList.remove('wos-workspace--active');
        prev.container.style.visibility = '';
      }
    }

    state.container.classList.remove('wos-workspace--enter-left', 'wos-workspace--enter-right');
    state.container.classList.add('wos-workspace--active');
    this._currentId = id;
    this._updateIndicator();
  }

  /** 更新底部指示點 */
  private _updateIndicator(): void {
    if (!this._indicatorEl) return;
    this._indicatorEl.innerHTML = '';
    this._workspaces.forEach((_, id) => {
      const dot = document.createElement('div');
      dot.className = 'wos-workspace-dot' + (id === this._currentId ? ' wos-workspace-dot--active' : '');
      this._indicatorEl!.appendChild(dot);
    });
  }
}
