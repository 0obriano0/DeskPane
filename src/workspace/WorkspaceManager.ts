// ============================================================
// DeskPane — WorkspaceManager
// 管理多個虛擬工作區（每個工作區有獨立的 WindowManager + 容器）
// 支援：
//   • addWorkspace / removeWorkspace / switchTo
//   • 左右滑入動畫（CSS transform）
//   • 工作區指示點（可選）
//   • EventBus：workspace:added / workspace:removed / workspace:switched
// ============================================================

import { WindowManager, WindowManagerOptions } from '../core/WindowManager.js';
import { EventBus } from '../core/EventBus.js';
import { WindowConfig, WindowState } from '../core/types.js';
import {
  WorkspaceConfig,
  WorkspaceManagerOptions,
  WorkspaceOpenWindowConfig,
  WorkspaceState,
  WorkspaceWindowIdOptions,
  WorkspaceWindowIdParts,
} from './types.js';
import WORKSPACE_CSS from '../styles/deskpane-workspace.css';
import { injectRuntimeCSS } from '../styles/inject.js';

const WORKSPACE_STYLE_ID = 'dp-workspace-styles';
const WORKSPACE_WINDOW_ID_SEPARATOR = '::app-';

function injectWorkspaceStyles(): void {
  injectRuntimeCSS({
    id: WORKSPACE_STYLE_ID,
    css: WORKSPACE_CSS,
    hrefPart: 'deskpane-workspace.css',
    fingerprint: 'DeskPane — Workspace CSS',
  });
}

/** 取得 WorkspaceManager CSS（供 SSR 或自訂注入使用） */
export function getWorkspaceCSS(): string {
  return WORKSPACE_CSS;
}

/**
 * Build a window id that is unique across workspaces for the same app id.
 * 格式預設為 `workspaceId::app-appId`，讓同一個 app 可在不同工作區同時存在。
 */
export function createWorkspaceWindowId(
  workspaceId: string,
  appId: string,
  options: WorkspaceWindowIdOptions = {},
): string {
  const separator = options.separator ?? WORKSPACE_WINDOW_ID_SEPARATOR;
  return `${workspaceId}${separator}${appId}`;
}

/** Parse an id created by `createWorkspaceWindowId()`; raw window id 會回傳 null。 */
export function parseWorkspaceWindowId(
  windowId: string,
  options: WorkspaceWindowIdOptions = {},
): WorkspaceWindowIdParts | null {
  const separator = options.separator ?? WORKSPACE_WINDOW_ID_SEPARATOR;
  const index = windowId.indexOf(separator);
  if (index <= 0) return null;
  const workspaceId = windowId.slice(0, index);
  const appId = windowId.slice(index + separator.length);
  if (!workspaceId || !appId) return null;
  return { workspaceId, appId };
}

/**
 * Return the app id from a scoped window id, or a sensible fallback.
 * Dock sync 會用 app id 做去重；因此 workspace-scoped id 必須能拆回穩定 app id。
 */
export function getAppIdFromWorkspaceWindowId(
  windowId: string,
  options: WorkspaceWindowIdOptions = {},
): string {
  return parseWorkspaceWindowId(windowId, options)?.appId
    ?? (windowId.startsWith('app-') ? windowId.slice(4) : windowId);
}

export type WorkspaceEvent =
  | 'workspace:added'
  | 'workspace:removed'
  | 'workspace:switched';

export class WorkspaceManager {
  private readonly _root: HTMLElement;
  private readonly _animationMs: number;
  private readonly _wmOptions: WindowManagerOptions;
  private readonly _warnOnDuplicateWindowIds: boolean;
  private readonly _workspaces = new Map<string, WorkspaceState>();
  private readonly _windowManagers = new Map<string, WindowManager>();
  private readonly _windowManagerCleanups = new Map<string, Array<() => void>>();
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
    this._wmOptions   = {
      ...(options.windowManagerOptions ?? {}),
      injectStyles: options.windowManagerOptions?.injectStyles ?? options.injectStyles,
    };
    this._warnOnDuplicateWindowIds = options.warnOnDuplicateWindowIds ?? true;
    this.events       = new EventBus();

    if (options.injectStyles !== false) injectWorkspaceStyles();

    // Wrap the container. 使用額外 root 而不是直接改傳入元素，可讓 destroy() 乾淨移除 DeskPane DOM。
    this._root = document.createElement('div');
    this._root.className = 'dp-workspace-root';
    // Pass animation duration as CSS variable
    this._root.style.setProperty('--dp-workspace-animation-ms', `${this._animationMs}ms`);
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

    // Create workspace container div. 每個 workspace 都有自己的 DOM 容器與 WindowManager。
    // 切換工作區時容器不會銷毀，這讓 Vue Teleport / React Portal 的狀態可以保留。
    const wsEl = document.createElement('div');
    wsEl.className = 'dp-workspace';
    wsEl.dataset.workspaceId = config.id;
    // Initially off-screen to the right
    wsEl.classList.add('dp-workspace--enter-right');
    this._setWorkspaceVisible(wsEl, false);
    this._setWorkspaceInteractive(wsEl, false);
    this._root.appendChild(wsEl);

    // Create dedicated WindowManager. 一律 isolated，避免跨 workspace 的視窗 DOM 互相干擾。
    const wm = new WindowManager({
      ...this._wmOptions,
      container: wsEl,
      isolated: true,
    });
    this._subscribeWindowManager(config.id, wm);

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
    this._windowManagerCleanups.get(id)?.forEach(dispose => dispose());
    this._windowManagerCleanups.delete(id);

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

    // Position next workspace off-screen. hidden 必須先解除，否則 transform transition 不會播放。
    nextEl.classList.remove('dp-workspace--enter-left', 'dp-workspace--enter-right');
    nextEl.classList.add(goingRight ? 'dp-workspace--enter-right' : 'dp-workspace--enter-left');
    this._setWorkspaceVisible(nextEl, true);
    // Make it visible but off-screen so transition can play
    nextEl.style.visibility = 'visible';

    // Force reflow so the initial transform is applied before transition.
    // 少了這行時，某些瀏覽器會把 enter 狀態與 active 狀態合併，動畫直接跳到終點。
    nextEl.getBoundingClientRect();

    // Slide current out
    if (currentEl) {
      this._setWorkspaceVisible(currentEl, true);
      currentEl.classList.add(goingRight ? 'dp-workspace--leave-left' : 'dp-workspace--leave-right');
      currentEl.classList.remove('dp-workspace--active');
      this._setWorkspaceInteractive(currentEl, false);
    }

    // Slide next in
    nextEl.classList.remove('dp-workspace--enter-left', 'dp-workspace--enter-right');
    nextEl.classList.add('dp-workspace--active');
    this._setWorkspaceInteractive(nextEl, true);

    const prevId = this._currentId;
    this._currentId = id;
    this._updateIndicator();

    const cleanup = () => {
      this._isAnimating = false;
      if (currentEl) {
        currentEl.classList.remove('dp-workspace--leave-left', 'dp-workspace--leave-right');
        currentEl.style.visibility = '';
        this._setWorkspaceInteractive(currentEl, false);
        this._setWorkspaceVisible(currentEl, false);
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
   * Build a workspace-scoped window id for an app.
   * Defaults to the current workspace when `workspaceId` is omitted.
   */
  createWindowId(appId: string, workspaceId = this._currentId): string {
    if (!workspaceId) throw new Error('[WorkspaceManager] No active workspace');
    return createWorkspaceWindowId(workspaceId, appId);
  }

  /**
   * Open a window in a workspace.
   * Prefer `appId` over manually reusing raw ids across workspaces; DeskPane
   * will generate a scoped id such as `ws-2::app-counter`.
   */
  openWindow(config: WorkspaceOpenWindowConfig): WindowState {
    const workspaceId = config.workspaceId ?? this._currentId;
    if (!workspaceId) throw new Error('[WorkspaceManager] No active workspace');

    const wm = this.getWindowManager(workspaceId);
    const { workspaceId: _workspaceId, appId, ...windowConfig } = config;
    const id = config.id ?? (appId ? createWorkspaceWindowId(workspaceId, appId) : null);
    if (!id) {
      throw new Error('[WorkspaceManager] openWindow() requires either id or appId');
    }

    return wm.open({
      ...(windowConfig as Omit<WindowConfig, 'id'>),
      id,
    });
  }

  /**
   * 啟用工作區指示點（小圓點）。
   * 會在根容器底部顯示，指示當前所在工作區。
   */
  enableIndicator(): void {
    if (this._indicatorEl) return;
    const bar = document.createElement('div');
    bar.className = 'dp-workspace-indicator';
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
    this._windowManagerCleanups.forEach(cleanups => cleanups.forEach(dispose => dispose()));
    this._windowManagerCleanups.clear();
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
        prev.container.classList.remove('dp-workspace--active');
        prev.container.style.visibility = '';
        this._setWorkspaceInteractive(prev.container, false);
        this._setWorkspaceVisible(prev.container, false);
      }
    }

    state.container.classList.remove('dp-workspace--enter-left', 'dp-workspace--enter-right');
    this._setWorkspaceVisible(state.container, true);
    state.container.classList.add('dp-workspace--active');
    this._setWorkspaceInteractive(state.container, true);
    this._currentId = id;
    this._updateIndicator();
  }

  private _setWorkspaceInteractive(el: HTMLElement, interactive: boolean): void {
    // 非 active workspace 保留 DOM 但禁止互動，避免點擊穿透或 tab focus 跑進隱藏桌面。
    (el as any).inert = !interactive;
    if (interactive) {
      el.removeAttribute('aria-hidden');
    } else {
      el.setAttribute('aria-hidden', 'true');
    }
  }

  private _setWorkspaceVisible(el: HTMLElement, visible: boolean): void {
    // hidden 控制 layout/可見性；inert/aria-hidden 控制互動與輔助技術。
    // 兩者分開是因為動畫期間 next workspace 需要 visible 但還沒 active。
    el.hidden = !visible;
  }

  private _subscribeWindowManager(workspaceId: string, wm: WindowManager): void {
    if (!this._warnOnDuplicateWindowIds) return;
    const offOpened = wm.events.on<WindowState>('window:opened', (state) => {
      if (!state?.id) return;
      this._warnDuplicateWindowId(workspaceId, state.id);
    });
    this._windowManagerCleanups.set(workspaceId, [offOpened]);
  }

  private _warnDuplicateWindowId(workspaceId: string, windowId: string): void {
    // raw id 在不同 workspace 重複時，Portal/Teleport 和 Dock sync 很容易對到錯視窗。
    // 這裡只警告不阻擋，保留低階 API 的彈性；推薦使用 openWindow({ appId })。
    if (parseWorkspaceWindowId(windowId)) return;
    const duplicates: string[] = [];
    this._windowManagers.forEach((wm, otherWorkspaceId) => {
      if (otherWorkspaceId === workspaceId) return;
      if (wm.getState(windowId)) duplicates.push(otherWorkspaceId);
    });
    if (duplicates.length === 0) return;

    const scopedExample = createWorkspaceWindowId(workspaceId, getAppIdFromWorkspaceWindowId(windowId));
    console.warn(
      `[WorkspaceManager] Window id "${windowId}" is also open in workspace(s): ${duplicates.join(', ')}. ` +
      `Duplicate raw ids across workspaces can confuse Dock sync and framework Portal/Teleport targets. ` +
      `Use WorkspaceManager.openWindow({ appId: "${getAppIdFromWorkspaceWindowId(windowId)}", ... }) ` +
      `or createWorkspaceWindowId("${workspaceId}", "${getAppIdFromWorkspaceWindowId(windowId)}") ` +
      `for an id like "${scopedExample}".`,
    );
  }

  /** 更新底部指示點 */
  private _updateIndicator(): void {
    if (!this._indicatorEl) return;
    this._indicatorEl.innerHTML = '';
    this._workspaces.forEach((_, id) => {
      const dot = document.createElement('div');
      dot.className = 'dp-workspace-dot' + (id === this._currentId ? ' dp-workspace-dot--active' : '');
      this._indicatorEl!.appendChild(dot);
    });
  }
}
