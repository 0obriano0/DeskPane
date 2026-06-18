// ============================================================
// DeskPane — TaskView
// 虛擬桌面切換 Task View 覆蓋層
// 功能：
//   • 顯示所有工作區的 DOM clone 縮略圖
//   • 點擊卡片切換工作區
//   • 新增 / 刪除工作區按鈕（可透過 options 控制）
//   • Escape 鍵關閉（預設開）
//   • EventBus：taskview:open / taskview:close
// ============================================================

import { EventBus } from '../core/EventBus.js';
import { WorkspaceManager } from './WorkspaceManager.js';
import { WorkspaceConfig, TaskViewOptions, DockLike } from './types.js';
import TASKVIEW_CSS from '../styles/deskpane-taskview.css';
import { injectRuntimeCSS } from '../styles/inject.js';

const TASKVIEW_STYLE_ID = 'dp-taskview-styles';

function injectTaskViewStyles(): void {
  injectRuntimeCSS({
    id: TASKVIEW_STYLE_ID,
    css: TASKVIEW_CSS,
    hrefPart: 'deskpane-taskview.css',
    fingerprint: 'DeskPane — TaskView CSS',
  });
}

/** 取得 TaskView CSS（供 SSR 或自訂注入使用） */
export function getTaskViewCSS(): string {
  return TASKVIEW_CSS;
}

export type TaskViewEvent = 'taskview:open' | 'taskview:close';

export class TaskView {
  private readonly _wsMgr: WorkspaceManager;
  private readonly _opts: Required<Omit<TaskViewOptions, 'onCreateWorkspace' | 'dock'>> & {
    onCreateWorkspace?: () => WorkspaceConfig;
    dock?: DockLike;
  };

  private readonly _overlayEl: HTMLElement;
  private readonly _panelEl: HTMLElement;
  private _isOpen = false;
  private _wsCounter = 0;
  private readonly _buttonId: string;

  private readonly _onKeyDown: (e: KeyboardEvent) => void;
  private readonly _onSwitched: () => void;

  readonly events: EventBus;

  constructor(wsMgr: WorkspaceManager, options: TaskViewOptions = {}) {
    this._wsMgr = wsMgr;
    this._opts = {
      target:           options.target          ?? document.body,
      allowAdd:         options.allowAdd         ?? true,
      allowDelete:      options.allowDelete       ?? true,
      keyboard:         options.keyboard          ?? true,
      closeOnBackdrop:  options.closeOnBackdrop   ?? true,
      injectStyles:     options.injectStyles      ?? true,
      showButton:       options.showButton        ?? true,
      buttonLabel:      options.buttonLabel       ?? '虛擬桌面',
      buttonIcon:       options.buttonIcon        ?? '⧉',
      buttonId:         options.buttonId          ?? 'dp-tv-button',
      onCreateWorkspace: options.onCreateWorkspace,
      dock: options.dock,
    };
    this._buttonId = this._opts.buttonId;

    if (this._opts.injectStyles) injectTaskViewStyles();

    this.events = new EventBus();

    // ── 建立覆蓋層 DOM ──────────────────────────────────────
    this._overlayEl = document.createElement('div');
    this._overlayEl.className = 'dp-task-view';
    this._overlayEl.hidden = true;

    this._panelEl = document.createElement('div');
    this._panelEl.className = 'dp-task-view-panel';
    this._overlayEl.appendChild(this._panelEl);

    this._opts.target.appendChild(this._overlayEl);

    // ── Dock 按鈕（可選）─────────────────────────────────────
    // TaskView 按鈕用 addItemAt(0) 固定插在最左側，模擬作業系統的桌面切換入口。
    // destroy() 會用同一個 buttonId 移除，避免重建 TaskView 時重複按鈕。
    if (this._opts.dock && this._opts.showButton) {
      this._opts.dock.addItemAt({
        id:     this._buttonId,
        label:  this._opts.buttonLabel,
        icon:   this._opts.buttonIcon,
        action: () => this.toggle(),
      }, 0);
    }

    // ── 綁定事件 ───────────────────────────────────────────
    if (this._opts.closeOnBackdrop) {
      this._overlayEl.addEventListener('click', (e) => {
        if (e.target === this._overlayEl) this.close();
      });
    }

    this._onKeyDown = (e: KeyboardEvent) => {
      if (this._isOpen && e.key === 'Escape') {
        e.preventDefault();
        this.close();
      }
    };
    if (this._opts.keyboard) {
      document.addEventListener('keydown', this._onKeyDown);
    }

    // 工作區切換時若 Task View 已開啟則重新渲染
    this._onSwitched = () => {
      if (this._isOpen) this._render();
    };
    this._wsMgr.events.on('workspace:switched', this._onSwitched);

    // 計算初始 wsCounter（讓新增的桌面編號不重複）
    this._syncCounter();
  }

  // ── Public API ─────────────────────────────────────────────

  get isOpen(): boolean { return this._isOpen; }

  open(): void {
    if (this._isOpen) return;
    this._isOpen = true;
    this._overlayEl.hidden = false;
    this._render();
    this._overlayEl.classList.add('dp-task-view--open');
    this.events.emit<void>('taskview:open', undefined);
  }

  close(): void {
    if (!this._isOpen) {
      this._overlayEl.classList.remove('dp-task-view--open');
      this._overlayEl.hidden = true;
      return;
    }
    this._isOpen = false;
    this._overlayEl.classList.remove('dp-task-view--open');
    this._overlayEl.hidden = true;
    this.events.emit<void>('taskview:close', undefined);
  }

  toggle(): void {
    this._isOpen ? this.close() : this.open();
  }

  /** 銷毀 Task View，移除 DOM 與事件監聽 */
  destroy(): void {
    this.close();
    document.removeEventListener('keydown', this._onKeyDown);
    this._wsMgr.events.off('workspace:switched', this._onSwitched);
    if (this._opts.dock && this._opts.showButton) {
      this._opts.dock.removeItem(this._buttonId);
    }
    this._overlayEl.remove();
  }

  // ── Private ────────────────────────────────────────────────

  private _syncCounter(): void {
    this._wsMgr.workspaces.forEach(ws => {
      const m = ws.id.match(/^ws-(\d+)$/);
      if (m) {
        const n = parseInt(m[1], 10);
        if (n > this._wsCounter) this._wsCounter = n;
      }
    });
  }

  private _render(): void {
    // 每次 open 或 workspace 切換都重建卡片，確保縮略圖反映最新 DOM。
    // 這裡不做長期 cache，因為視窗內容可能由 Vue/React portal 動態改變。
    this._panelEl.innerHTML = '';
    const workspaces = this._wsMgr.workspaces;
    const currentId  = this._wsMgr.current?.id;

    workspaces.forEach(ws => {
      const card = document.createElement('div');
      card.className = 'dp-tv-card' + (ws.id === currentId ? ' dp-tv-card--active' : '');

      // 縮略圖（DOM clone）
      const preview = document.createElement('div');
      preview.className = 'dp-tv-preview';
      this._buildPreview(preview, ws.container);
      card.appendChild(preview);

      // 工作區名稱
      const lbl = document.createElement('div');
      lbl.className   = 'dp-tv-label';
      lbl.textContent = ws.label;
      card.appendChild(lbl);

      // 刪除按鈕（需 allowDelete，且 > 1 個工作區才顯示）
      if (this._opts.allowDelete && workspaces.length > 1) {
        const del = document.createElement('button');
        del.className   = 'dp-tv-delete';
        del.textContent = '✕';
        del.title       = '刪除此桌面';
        del.addEventListener('click', (e) => {
          e.stopPropagation();
          this._wsMgr.removeWorkspace(ws.id);
          this._render();
        });
        card.appendChild(del);
      }

      card.addEventListener('click', () => {
        this._wsMgr.switchTo(ws.id);
        this.close();
      });
      this._panelEl.appendChild(card);
    });

    // 新增桌面按鈕
    if (this._opts.allowAdd) {
      const addWrap = document.createElement('div');
      addWrap.className = 'dp-tv-add-wrap';
      addWrap.title     = '新增虛擬桌面';

      const addBox = document.createElement('div');
      addBox.className   = 'dp-tv-add';
      addBox.textContent = '+';

      const addLbl = document.createElement('div');
      addLbl.className   = 'dp-tv-add-label';
      addLbl.textContent = '新增桌面';

      addWrap.append(addBox, addLbl);
      addWrap.addEventListener('click', () => {
        const config = this._opts.onCreateWorkspace
          ? this._opts.onCreateWorkspace()
          : this._defaultWorkspaceConfig();
        this._wsMgr.addWorkspace(config);
        this._wsMgr.switchTo(config.id);
        this.close();
      });
      this._panelEl.appendChild(addWrap);
    }
  }

  /** 預設新增桌面設定：ws-N / 桌面 N */
  private _defaultWorkspaceConfig(): WorkspaceConfig {
    this._wsCounter++;
    return { id: `ws-${this._wsCounter}`, label: `桌面 ${this._wsCounter}` };
  }

  /** DOM clone + CSS scale 縮略圖 */
  private _buildPreview(preview: HTMLElement, container: HTMLElement): void {
    const vw    = container.offsetWidth  || window.innerWidth;
    const vh    = container.offsetHeight || window.innerHeight;
    const pw    = 210;
    const ph    = 132;
    const scale = Math.min(pw / vw, ph / vh);

    const wrapper = document.createElement('div');
    wrapper.style.cssText =
      `position:absolute;top:0;left:0;width:${vw}px;height:${vh}px;` +
      `transform:scale(${scale});transform-origin:top left;` +
      `pointer-events:none;overflow:hidden;`;

    const clone = container.cloneNode(true) as HTMLElement;
    // 原 workspace 可能是 hidden/inert/aria-hidden；縮略圖 clone 必須解除這些狀態才看得到。
    // pointer-events:none 則確保 clone 只是預覽，不會攔截 TaskView 的卡片點擊。
    clone.hidden = false;
    (clone as any).inert = false;
    clone.removeAttribute('hidden');
    clone.removeAttribute('inert');
    clone.removeAttribute('aria-hidden');
    clone.classList.remove(
      'dp-workspace--enter-right', 'dp-workspace--enter-left',
      'dp-workspace--leave-left',  'dp-workspace--leave-right',
    );
    clone.classList.add('dp-workspace--active');
    clone.style.cssText =
      'position:absolute;inset:0;width:100%;height:100%;' +
      'transform:translateX(0);visibility:visible;transition:none;pointer-events:none;';

    wrapper.appendChild(clone);
    preview.appendChild(wrapper);
  }
}
