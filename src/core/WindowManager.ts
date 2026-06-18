// ============================================================
// DeskPane — WindowManager
// 核心大腦：管理所有視窗的生命週期與狀態
// ============================================================

import { WindowConfig, WindowState } from './types.js';
import { EventBus } from './EventBus.js';
import { DragResizeHandler, DragResizeOptions } from './DragResizeHandler.js';
import { injectStyles, createWindowDOM, applyGeometry, createModalOverlay, WindowElements } from '../renderers/DOMRenderer.js';
import { snapPosition, snapResize, SnapRect, SnapGuide } from './SnapHelper.js';
import { BorderLayout } from '../layout/BorderLayout.js';
import { Panel } from '../layout/Panel.js';

/** WindowManager 事件清單 */
export type WinEvent =
  | 'window:opened'
  | 'window:closed'
  | 'window:focused'
  | 'window:minimized'
  | 'window:maximized'
  | 'window:restored'
  | 'window:moved'
  | 'window:resized'
  | 'window:child-opened'
  | 'window:child-closed';

const DEFAULT_WIDTH = 640;
const DEFAULT_HEIGHT = 480;
const BASE_Z = 100;
/** 視窗 z-index 上限；超過時自動正規化，確保低於 Dock/Toolbar（預設 9999） */
const MAX_Z = 8999;
const CASCADE_OFFSET = 30;

export interface WindowManagerOptions {
  /** 視窗容器，預設為 document.body */
  container?: HTMLElement;
  /** 節流毫秒數，預設 16 */
  throttleMs?: number;
  /**
   * Isolated 模式：視窗改用 position:absolute，限制在容器範圍內。
   * 適合文件頁面的內嵌 demo 區塊，或頁面中的局部桌面。
   * 啟用後容器會自動加上 dp-isolated CSS class。
   */
  isolated?: boolean;
  /**
   * 啟用視窗拖曳時的 Snap 吸附功能，預設 true。
   * 拖曳到容器邊緣或其他視窗邊緣時，自動對齊並顯示藍色 guide 線。
   */
  snap?: boolean;
  /**
   * Snap 吸附感應距離（px），預設 20。
   * 視窗距離吸附目標小於此值時觸發吸附。
   */
  snapThreshold?: number;
  /**
   * 視窗與視窗之間的吸附間距（px），預設 0。
   * 大於 0 時，兩視窗對齊後會保留指定像素的空隙；容器邊緣不受影響。
   */
  snapGap?: number;
  /**
   * 是否自動注入 Core CSS 樣式，預設 true。
   * 若已用 <link> 或 bundler import 載入 deskpane.css，runtime 會自動略過重複注入。
   * 設為 false 時完全不注入樣式，由使用者自行控制 CSS 載入順序。
   * 可搭配 `getCoreCSS()` 取得預設 CSS 作為修改基礎。
   */
  injectStyles?: boolean;
}

interface ManagedWindow {
  state: WindowState;
  elements: WindowElements;
  dragResize: DragResizeHandler;
}

export class WindowManager {
  private readonly _wins = new Map<string, ManagedWindow>();
  private _zCounter = BASE_Z;
  private _cascadeCount = 0;
  private readonly _container: HTMLElement;
  private readonly _throttleMs: number;
  private readonly _isolated: boolean;
  private readonly _snapEnabled: boolean;
  private readonly _snapThreshold: number;
  private _snapGap: number;
  private _guideV: HTMLElement | null = null;
  private _guideH: HTMLElement | null = null;
  /** 追蹤自動建立的 BorderLayout / Panel 實例，視窗關閉時 destroy */
  private readonly _layouts = new Map<string, BorderLayout | Panel>();
  /** 父視窗 → 子視窗 ID Set（一對多） */
  private readonly _children = new Map<string, Set<string>>();
  /** Modal 子視窗 → 它在父視窗上的遮罩 DOM 元素 */
  private readonly _modalOverlays = new Map<string, HTMLElement>();
  private _resizeObserver: ResizeObserver | null = null;
  readonly events: EventBus;

  constructor(opts: WindowManagerOptions = {}) {
    this._container = opts.container ?? document.body;
    this._throttleMs = opts.throttleMs ?? 16;
    this._isolated = opts.isolated ?? false;
    this._snapEnabled = opts.snap ?? true;
    this._snapThreshold = opts.snapThreshold ?? 20;
    this._snapGap = opts.snapGap ?? 0;
    this.events = new EventBus();
    if (opts.injectStyles !== false) injectStyles();
    if (this._isolated) {
      this._container.classList.add('dp-isolated');
    }
    this._setupResizeObserver();
  }

  // ─────────────────────────────────────────
  // Public API
  // ─────────────────────────────────────────

  /**
   * 開啟視窗。若 ID 已存在，恢復並聚焦；否則建立新視窗。
   */
  open(config: WindowConfig): WindowState {
    const existing = this._wins.get(config.id);
    if (existing) {
      this.restore(config.id);
      this.focus(config.id);
      return existing.state;
    }

    const offset = (this._cascadeCount++ % 10) * CASCADE_OFFSET;
    const cw = this._isolated ? this._container.offsetWidth : window.innerWidth;
    const ch = this._isolated ? this._container.offsetHeight : window.innerHeight;
    const w = config.width ?? DEFAULT_WIDTH;
    const h = config.height ?? DEFAULT_HEIGHT;
    const rawX = config.x ?? 60 + offset;
    const rawY = config.y ?? 60 + offset;
    const state: WindowState = {
      id: config.id,
      title: config.title,
      icon: config.icon,
      label: config.label,
      slotType: config.slotType ?? 'dom',
      content: config.content,
      x: cw > 0 ? Math.max(0, Math.min(rawX, cw - Math.min(w, cw))) : rawX,
      y: ch > 0 ? Math.max(0, Math.min(rawY, ch - Math.min(h, ch))) : rawY,
      width: w,
      height: h,
      zIndex: ++this._zCounter,
      isMaximized: false,
      isMinimized: false,
      isActive: true,
      resizable: config.resizable ?? true,
      props: config.props,
      parentId: config.parentId,
      modal: config.modal ?? false,
    };

    // 子視窗：z-index 必須高於父視窗
    if (state.parentId) {
      const parentWin = this._wins.get(state.parentId);
      if (parentWin) {
        state.zIndex = Math.max(state.zIndex, parentWin.state.zIndex + 1);
        this._zCounter = Math.max(this._zCounter, state.zIndex);
      }
    }

    const elements = createWindowDOM(state);
    this._container.appendChild(elements.root);

    // ── Auto-detect BorderLayout / Panel in content ──────────
    this._tryAutoLayout(state.id, state.content, elements.body);

    const dragResize = new DragResizeHandler(
      elements.root,
      elements.header,
      {
        throttleMs: this._throttleMs,
        resizable: state.resizable,
        containerEl: this._isolated ? this._container : undefined,
        snapFn: this._snapEnabled ? this._buildSnapFn(state.id) : undefined,
        resizeSnapFn: this._snapEnabled ? this._buildResizeSnapFn(state.id) : undefined,
        onDrag: (x, y) => {
          state.x = x; state.y = y;
          this.events.emit<WindowState>('window:moved', { ...state });
        },
        onDragEnd: () => {
          this._hideSnapGuides();
        },
        onResize: (x, y, w, h) => {
          state.x = x; state.y = y; state.width = w; state.height = h;
          this.events.emit<WindowState>('window:resized', { ...state });
        },
        onResizeEnd: () => {
          this._hideSnapGuides();
        },
      }
    );

    // 綁定標題列按鈕
    elements.btnMin.addEventListener('click', () => this.minimize(state.id));
    elements.btnMax.addEventListener('click', () => {
      if (state.isMaximized) {
        // 標題列按鈕點還原：強制完整還原到最大化前的幾何
        state.isMaximized = false; // 清掉旗標讓 restore() 走完整還原路徑
        this.restore(state.id);
      } else {
        this.maximize(state.id);
      }
    });
    elements.btnClose.addEventListener('click', () => this.close(state.id));

    // 點擊視窗任意處 → 聚焦
    elements.root.addEventListener('mousedown', () => this.focus(state.id), true);

    const managed: ManagedWindow = { state, elements, dragResize };
    this._wins.set(state.id, managed);

    // 建立父子關係
    if (state.parentId) {
      if (!this._children.has(state.parentId)) {
        this._children.set(state.parentId, new Set());
      }
      this._children.get(state.parentId)!.add(state.id);

      // Modal：在父視窗插入遮罩層
      if (state.modal) {
        this._attachModalOverlay(state.parentId, state.id);
      }

      this.events.emit('window:child-opened', { parentId: state.parentId, childId: state.id });
    }

    this._deactivateOthers(state.id);
    elements.root.classList.add('dp-active');

    this.events.emit<WindowState>('window:opened', { ...state });
    return state;
  }

  /**
   * 關閉並銷毀視窗
   */
  close(id: string): void {
    const win = this._wins.get(id);
    if (!win) return;

    const parentId = win.state.parentId;

    win.dragResize.destroy();
    win.elements.root.remove();
    this._wins.delete(id);
    // 銷毀自動建立的 BorderLayout / Panel
    this._layouts.get(id)?.destroy();
    this._layouts.delete(id);

    // 子視窗關閉：清除父子關係 + 移除遮罩
    if (parentId) {
      const siblings = this._children.get(parentId);
      if (siblings) {
        siblings.delete(id);
        if (siblings.size === 0) this._children.delete(parentId);
      }
      // 移除此子視窗對應的 modal overlay
      this._detachModalOverlay(id);
      this.events.emit('window:child-closed', { parentId, childId: id });
    }

    // 如果這個視窗有子視窗，一并關閉（深度優先）
    const children = this._children.get(id);
    if (children && children.size > 0) {
      [...children].forEach(childId => this.close(childId));
    }
    this._children.delete(id);

    this.events.emit('window:closed', { id });
    // 聚焦最後一個存活視窗
    this._focusTopWindow();
  }

  /**
   * 當 z-index 計數器逼近上限時，將所有視窗的 z-index 正規化回
   * [BASE_Z+1 … BASE_Z+N]，保留原本的堆疊順序。
   * 確保視窗 z-index 永遠低於 Dock/Toolbar（9999）。
   */
  private _normalizeZ(): void {
    if (this._zCounter < MAX_Z) return;
    const sorted = Array.from(this._wins.values())
      .sort((a, b) => a.state.zIndex - b.state.zIndex);
    sorted.forEach((w, i) => {
      w.state.zIndex = BASE_Z + 1 + i;
      w.elements.root.style.zIndex = String(w.state.zIndex);
    });
    this._zCounter = BASE_Z + sorted.length;
  }

  /**
   * 聚焦視窗：置頂 zIndex，設定 isActive
   */
  focus(id: string): void {
    const win = this._wins.get(id);
    if (!win || win.state.isActive) return;
    this._normalizeZ();
    this._deactivateOthers(id);
    win.state.zIndex = ++this._zCounter;
    win.state.isActive = true;
    win.elements.root.style.zIndex = String(win.state.zIndex);
    win.elements.root.classList.add('dp-active');
    if (win.state.isMinimized) this.restore(id);

    // 將此視窗的所有子視窗一起置頂（子視窗必須高於父視窗）
    const children = this._children.get(id);
    if (children && children.size > 0) {
      [...children].forEach(childId => {
        const child = this._wins.get(childId);
        if (!child) return;
        child.state.zIndex = ++this._zCounter;
        child.elements.root.style.zIndex = String(child.state.zIndex);
        // 子視窗也要一起顯示（若已最小化）
        if (child.state.isMinimized) {
          child.state.isMinimized = false;
          child.elements.root.classList.remove('dp-minimized');
        }
      });
    }

    // 如果此視窗是子視窗，同時經對間父視窗（父視窗 z-index 仍低於子）
    if (win.state.parentId) {
      const parent = this._wins.get(win.state.parentId);
      if (parent && !parent.state.isActive) {
        const childZ = win.state.zIndex;
        // 父視窗置於子視窗之後提升，但不超過子視窗
        parent.state.zIndex = childZ - 1;
        parent.elements.root.style.zIndex = String(parent.state.zIndex);
      }
    }

    this.events.emit<WindowState>('window:focused', { ...win.state });
  }

  /**
   * Re-emit focus for the topmost visible window.
   * Useful when a preserved workspace becomes active again and its previous
   * active window needs to resync dock/focus state.
   */
  activateTopWindow(): void {
    this._focusTopWindow();
  }

  /**
   * 最小化（隱藏 DOM，保留狀態）
   */
  minimize(id: string): void {
    const win = this._wins.get(id);
    if (!win || win.state.isMinimized) return;
    win.state.isMinimized = true;
    win.state.isActive = false;
    win.elements.root.classList.add('dp-minimized');
    win.elements.root.classList.remove('dp-active');
    this.events.emit<WindowState>('window:minimized', { ...win.state });
    // 同時最小化所有子視窗
    const children = this._children.get(id);
    if (children) {
      [...children].forEach(childId => {
        const child = this._wins.get(childId);
        if (child && !child.state.isMinimized) {
          child.state.isMinimized = true;
          child.state.isActive = false;
          child.elements.root.classList.add('dp-minimized');
          child.elements.root.classList.remove('dp-active');
        }
      });
    }
    this._focusTopWindow();
  }

  /**
   * 最大化
   */
  maximize(id: string): void {
    const win = this._wins.get(id);
    if (!win || !win.state.resizable) return;
    // 若已最大化但被最小化，只需還原（顯示最大化視窗）
    if (win.state.isMaximized) {
      if (win.state.isMinimized) this.restore(id);
      return;
    }
    // 儲存幾何快照
    win.state._savedGeometry = {
      x: win.state.x, y: win.state.y,
      width: win.state.width, height: win.state.height,
    };
    win.state.isMaximized = true;
    win.state.isMinimized = false;
    win.elements.root.classList.remove('dp-minimized');
    win.elements.root.classList.add('dp-maximized');
    win.elements.btnMax.textContent = '❐';
    win.elements.btnMax.setAttribute('aria-label', '還原');
    this.focus(id);
    this.events.emit<WindowState>('window:maximized', { ...win.state });
  }

  /**
   * 還原：
   * - 若視窗是「最大化狀態下被最小化」→ 僅移除最小化，保持最大化
   * - 若只是最大化 → 還原到最大化前的幾何
   * - 若只是最小化 → 還原到原始幾何
   */
  restore(id: string): void {
    const win = this._wins.get(id);
    if (!win) return;

    const wasMaximized = win.state.isMaximized;
    win.state.isMinimized = false;
    win.elements.root.classList.remove('dp-minimized');

    if (wasMaximized) {
      // 最大化狀態：只解除最小化，維持最大化視覺
      win.elements.root.classList.add('dp-maximized');
      this.events.emit<WindowState>('window:restored', { ...win.state });
      return;
    }

    // 完全還原（從最大化按鈕點還原，或單純取消最小化）
    win.state.isMaximized = false;
    win.elements.root.classList.remove('dp-maximized');
    win.elements.btnMax.textContent = '□';
    win.elements.btnMax.setAttribute('aria-label', '最大化');
    if (win.state._savedGeometry) {
      const g = win.state._savedGeometry;
      win.state.x = g.x; win.state.y = g.y;
      win.state.width = g.width; win.state.height = g.height;
      applyGeometry(win.elements.root, win.state);
      delete win.state._savedGeometry;
    }

    // 同時 restore 所有子視窗
    const children = this._children.get(id);
    if (children) {
      [...children].forEach(childId => {
        const child = this._wins.get(childId);
        if (child && child.state.isMinimized) {
          child.state.isMinimized = false;
          child.elements.root.classList.remove('dp-minimized');
        }
      });
    }

    this.events.emit<WindowState>('window:restored', { ...win.state });
  }

  /** 取得視窗目前狀態快照（唯讀副本） */
  getState(id: string): Readonly<WindowState> | undefined {
    const win = this._wins.get(id);
    return win ? { ...win.state } : undefined;
  }

  /** 取得視窗 Body DOM 節點，供外部 Wijmo / jQuery 附加內容 */
  getBodyElement(id: string): HTMLElement | undefined {
    return this._wins.get(id)?.elements.body;
  }

  getWindowElement(id: string): HTMLElement | undefined {
    return this._wins.get(id)?.elements.root;
  }

  /** 取得所有視窗 ID 清單 */
  getWindowIds(): string[] {
    return [...this._wins.keys()];
  }

  /** 更新視窗標題 */
  setTitle(id: string, title: string): void {
    const win = this._wins.get(id);
    if (!win) return;
    win.state.title = title;
    win.elements.title.textContent = title;
  }

  /**
   * 動態更新視窗與視窗之間的吸附間距（px）。
   * 設為 0 表示緊貼（預設行為）。
   */
  setSnapGap(gap: number): void {
    this._snapGap = Math.max(0, gap);
  }

  /** 取得所有視窗狀態的快照陣列（供序列化使用） */
  getAllStates(): WindowState[] {
    return [...this._wins.values()].map(w => ({ ...w.state }));
  }

  /** 取得特定視窗的子視窗 ID 清單 */
  getChildIds(parentId: string): string[] {
    const children = this._children.get(parentId);
    return children ? Array.from(children) : [];
  }

  /** 取得某個視窗所屬的最頂層根視窗 ID */
  getRootWindowId(id: string): string {
    const win = this._wins.get(id);
    if (!win || !win.state.parentId) return id;
    return this.getRootWindowId(win.state.parentId);
  }

  /** 讓視窗出現「搖晃」動畫，提示使用者需先關閉子視窗 */
  shake(id: string): void {
    const win = this._wins.get(id);
    if (!win) return;
    win.elements.root.classList.add('dp-shake');
    setTimeout(() => win.elements.root.classList.remove('dp-shake'), 400);
  }

  /** 銷毀所有視窗，清除事件 */
  destroy(): void {
    [...this._wins.keys()].forEach(id => this.close(id));
    this._layouts.forEach(l => l.destroy());
    this._layouts.clear();
    this._children.clear();
    // 移除所有遮罩
    this._modalOverlays.forEach(el => el.remove());
    this._modalOverlays.clear();
    this.events.clearAll();
    this._guideV?.remove();
    this._guideH?.remove();
    this._guideV = null;
    this._guideH = null;
    this._resizeObserver?.disconnect();
    this._resizeObserver = null;
    if (this._isolated) {
      this._container.classList.remove('dp-isolated');
    }
  }

  // ─────────────────────────────────────────
  // Private helpers
  // ─────────────────────────────────────────

  /** 延遲建立 snap guide 元素（僅需要時才建立） */
  private _ensureGuides(): void {
    if (this._guideV) return;
    this._guideV = document.createElement('div');
    this._guideV.className = 'dp-snap-guide dp-snap-guide--v';
    this._guideH = document.createElement('div');
    this._guideH.className = 'dp-snap-guide dp-snap-guide--h';
    this._container.appendChild(this._guideV);
    this._container.appendChild(this._guideH);
  }

  /** 根據 SnapResult 顯示 / 隱藏 guide 線 */
  private _updateSnapGuides(guides: SnapGuide[]): void {
    this._ensureGuides();
    const vGuide = guides.find(g => g.axis === 'v');
    const hGuide = guides.find(g => g.axis === 'h');
    if (this._guideV) {
      if (vGuide !== undefined) {
        this._guideV.style.left = `${vGuide.pos}px`;
        this._guideV.style.display = 'block';
      } else {
        this._guideV.style.display = 'none';
      }
    }
    if (this._guideH) {
      if (hGuide !== undefined) {
        this._guideH.style.top = `${hGuide.pos}px`;
        this._guideH.style.display = 'block';
      } else {
        this._guideH.style.display = 'none';
      }
    }
  }

  /** 拖曳結束時隱藏所有 guide 線 */
  private _hideSnapGuides(): void {
    if (this._guideV) this._guideV.style.display = 'none';
    if (this._guideH) this._guideH.style.display = 'none';
  }

  // ── Layout auto-detection ─────────────────────────────────

  /**
   * 偵測 content 是否包含 BorderLayout 或 Panel 宣告，並自動初始化。
   * - content 有 [data-region] 直接子元素 → BorderLayout（body 作為容器）
   * - content 本身有 data-panel 屬性 → Panel（body 作為容器）
   */
  private _tryAutoLayout(id: string, content: unknown, body: HTMLElement): void {
    if (!(content instanceof HTMLElement)) return;

    const hasRegions = Array.from(content.children).some(
      c => (c as HTMLElement).dataset.region !== undefined
    );

    if (hasRegions) {
      // Move [data-region] children from content into body, use body as layout container
      while (content.firstChild) body.appendChild(content.firstChild);
      content.remove();
      body.classList.add('dp-has-layout');
      const layout = new BorderLayout({ container: body });
      this._layouts.set(id, layout);
      return;
    }

    if ('panel' in content.dataset) {
      // Move content's children into body, use body as Panel container
      const panelTitle        = content.dataset.panelTitle ?? content.dataset.title ?? '';
      const panelCollapsible  = 'collapsible' in content.dataset;
      const panelCollapsed    = 'collapsed'   in content.dataset;
      while (content.firstChild) body.appendChild(content.firstChild);
      content.remove();
      body.classList.add('dp-has-layout');
      const panel = new Panel({
        container:   body,
        title:       panelTitle || undefined,
        collapsible: panelCollapsible,
        collapsed:   panelCollapsed,
      });
      this._layouts.set(id, panel);
    }
  }

  // ── Modal Overlay helpers ─────────────────────────────

  /**
   * 在父視窗插入 Modal 遮罩層。
   * overlay 附同子視窗 ID 記錄，點擊時觸發對應子視窗的 shake 動畫。
   */
  private _attachModalOverlay(parentId: string, childId: string): void {
    const parentWin = this._wins.get(parentId);
    if (!parentWin) return;
    // 如果已經有遮罩，不重複插入
    if (this._modalOverlays.has(childId)) return;

    const overlay = createModalOverlay();
    overlay.dataset.dpChildId = childId;

    // 點擊遮罩 → 對應子視窗抓回前景 + shake
    overlay.addEventListener('mousedown', (e) => {
      e.stopPropagation();
      const childWin = this._wins.get(childId);
      if (childWin) {
        // 引導焦點回子視窗
        childWin.state.isActive = false;
        this.focus(childId);
        this.shake(childId);
      }
    });

    parentWin.elements.root.appendChild(overlay);
    this._modalOverlays.set(childId, overlay);
  }

  /**
   * 移除 parentId 上由 childId 產生的 modal 遮罩。
   */
  private _detachModalOverlay(childId: string): void {
    const overlay = this._modalOverlays.get(childId);
    if (overlay) {
      overlay.remove();
      this._modalOverlays.delete(childId);
    }
  }

  private _deactivateOthers(exceptId: string): void {
    this._wins.forEach((win, id) => {
      if (id !== exceptId && win.state.isActive) {
        win.state.isActive = false;
        win.elements.root.classList.remove('dp-active');
      }
    });
  }

  private _focusTopWindow(): void {
    let topId: string | null = null;
    let topZ = -1;
    this._wins.forEach((win, id) => {
      if (!win.state.isMinimized && win.state.zIndex > topZ) {
        topZ = win.state.zIndex;
        topId = id;
      }
    });
    if (topId !== null) {
      const win = this._wins.get(topId)!;
      win.state.isActive = false; // reset so focus() triggers
      this.focus(topId);
    }
  }

  /** 監聽容器尺寸變化，自動將視窗夾回可視範圍 */
  private _setupResizeObserver(): void {
    if (typeof ResizeObserver === 'undefined') return;
    const target = this._isolated ? this._container : document.documentElement;
    this._resizeObserver = new ResizeObserver(() => this._clampAllWindows());
    this._resizeObserver.observe(target);
  }

  /** 將所有非最大化、非最小化視窗的位置夾回容器範圍 */
  private _clampAllWindows(): void {
    const cw = this._isolated ? this._container.offsetWidth : window.innerWidth;
    const ch = this._isolated ? this._container.offsetHeight : window.innerHeight;
    if (!cw || !ch) return;
    const MIN_VISIBLE = 80; // 至少保留這麼多 px 在畫面內
    this._wins.forEach(win => {
      if (win.state.isMinimized || win.state.isMaximized) return;
      const newX = Math.max(0, Math.min(win.state.x, cw - MIN_VISIBLE));
      const newY = Math.max(0, Math.min(win.state.y, ch - MIN_VISIBLE));
      if (newX !== win.state.x || newY !== win.state.y) {
        win.state.x = newX;
        win.state.y = newY;
        applyGeometry(win.elements.root, { x: newX, y: newY });
      }
    });
  }

  /** 取得可供 snap 計算用的其他視窗矩形（排除 excludeId 及最小化/最大化視窗） */
  private _getOtherWindows(excludeId: string): SnapRect[] {
    const others: SnapRect[] = [];
    this._wins.forEach((win, wid) => {
      if (wid !== excludeId && !win.state.isMinimized && !win.state.isMaximized) {
        others.push({ x: win.state.x, y: win.state.y, width: win.state.width, height: win.state.height });
      }
    });
    return others;
  }

  /** 建立拖曳 snap 函式（用於 DragResizeHandler.snapFn） */
  private _buildSnapFn(stateId: string): DragResizeOptions['snapFn'] {
    return (x, y, w, h) => {
      const cw = this._isolated ? this._container.offsetWidth : window.innerWidth;
      const ch = this._isolated ? this._container.offsetHeight : window.innerHeight;
      const result = snapPosition(
        { x, y, width: w, height: h },
        { width: cw, height: ch },
        this._getOtherWindows(stateId),
        this._snapThreshold,
        this._snapGap,
      );
      this._updateSnapGuides(result.guides);
      return { x: result.x, y: result.y };
    };
  }

  /** 建立 resize snap 函式（用於 DragResizeHandler.resizeSnapFn） */
  private _buildResizeSnapFn(stateId: string): DragResizeOptions['resizeSnapFn'] {
    return (x, y, w, h, edge) => {
      const cw = this._isolated ? this._container.offsetWidth : window.innerWidth;
      const ch = this._isolated ? this._container.offsetHeight : window.innerHeight;
      const result = snapResize(
        { x, y, width: w, height: h },
        edge,
        { width: cw, height: ch },
        this._getOtherWindows(stateId),
        this._snapThreshold,
        this._snapGap,
      );
      this._updateSnapGuides(result.guides);
      return { x: result.x, y: result.y, width: result.width, height: result.height };
    };
  }
}
