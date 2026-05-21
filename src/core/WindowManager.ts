// ============================================================
// WebOS-Core — WindowManager
// 核心大腦：管理所有視窗的生命週期與狀態
// ============================================================

import { WindowConfig, WindowState, EventCallback } from './types.js';
import { EventBus } from './EventBus.js';
import { DragResizeHandler } from './DragResizeHandler.js';
import { injectStyles, createWindowDOM, applyGeometry, WindowElements } from '../renderers/DOMRenderer.js';
import { snapPosition, SnapRect, SnapGuide } from './SnapHelper.js';

/** WindowManager 事件清單 */
export type WinEvent =
  | 'window:opened'
  | 'window:closed'
  | 'window:focused'
  | 'window:minimized'
  | 'window:maximized'
  | 'window:restored'
  | 'window:moved'
  | 'window:resized';

const DEFAULT_WIDTH = 640;
const DEFAULT_HEIGHT = 480;
const BASE_Z = 100;
const CASCADE_OFFSET = 30;

export interface WindowManagerOptions {
  /** 視窗容器，預設為 document.body */
  container?: HTMLElement;
  /** 節流毫秒數，預設 16 */
  throttleMs?: number;
  /**
   * Isolated 模式：視窗改用 position:absolute，限制在容器範圍內。
   * 適合文件頁面的內嵌 demo 區塊，或頁面中的局部桌面。
   * 啟用後容器會自動加上 wos-isolated CSS class。
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
  private _guideV: HTMLElement | null = null;
  private _guideH: HTMLElement | null = null;
  readonly events: EventBus;

  constructor(opts: WindowManagerOptions = {}) {
    this._container = opts.container ?? document.body;
    this._throttleMs = opts.throttleMs ?? 16;
    this._isolated = opts.isolated ?? false;
    this._snapEnabled = opts.snap ?? true;
    this._snapThreshold = opts.snapThreshold ?? 20;
    this.events = new EventBus();
    injectStyles();
    if (this._isolated) {
      this._container.classList.add('wos-isolated');
    }
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
    const state: WindowState = {
      id: config.id,
      title: config.title,
      slotType: config.slotType ?? 'dom',
      content: config.content,
      x: config.x ?? 60 + offset,
      y: config.y ?? 60 + offset,
      width: config.width ?? DEFAULT_WIDTH,
      height: config.height ?? DEFAULT_HEIGHT,
      zIndex: ++this._zCounter,
      isMaximized: false,
      isMinimized: false,
      isActive: true,
      props: config.props,
    };

    const elements = createWindowDOM(state);
    this._container.appendChild(elements.root);

    const dragResize = new DragResizeHandler(
      elements.root,
      elements.header,
      {
        throttleMs: this._throttleMs,
        containerEl: this._isolated ? this._container : undefined,
        snapFn: this._snapEnabled ? (x, y, w, h) => {
          const cw = this._isolated ? this._container.offsetWidth : window.innerWidth;
          const ch = this._isolated ? this._container.offsetHeight : window.innerHeight;
          const others: SnapRect[] = [];
          this._wins.forEach((win2, wid) => {
            if (wid !== state.id && !win2.state.isMinimized && !win2.state.isMaximized) {
              others.push({ x: win2.state.x, y: win2.state.y, width: win2.state.width, height: win2.state.height });
            }
          });
          const result = snapPosition({ x, y, width: w, height: h }, { width: cw, height: ch }, others, this._snapThreshold);
          this._updateSnapGuides(result.guides);
          return { x: result.x, y: result.y };
        } : undefined,
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

    this._deactivateOthers(state.id);
    elements.root.classList.add('wos-active');

    this.events.emit<WindowState>('window:opened', { ...state });
    return state;
  }

  /**
   * 關閉並銷毀視窗
   */
  close(id: string): void {
    const win = this._wins.get(id);
    if (!win) return;
    win.dragResize.destroy();
    win.elements.root.remove();
    this._wins.delete(id);
    this.events.emit('window:closed', { id });
    // 聚焦最後一個存活視窗
    this._focusTopWindow();
  }

  /**
   * 聚焦視窗：置頂 zIndex，設定 isActive
   */
  focus(id: string): void {
    const win = this._wins.get(id);
    if (!win || win.state.isActive) return;
    this._deactivateOthers(id);
    win.state.zIndex = ++this._zCounter;
    win.state.isActive = true;
    win.elements.root.style.zIndex = String(win.state.zIndex);
    win.elements.root.classList.add('wos-active');
    if (win.state.isMinimized) this.restore(id);
    this.events.emit<WindowState>('window:focused', { ...win.state });
  }

  /**
   * 最小化（隱藏 DOM，保留狀態）
   */
  minimize(id: string): void {
    const win = this._wins.get(id);
    if (!win || win.state.isMinimized) return;
    win.state.isMinimized = true;
    win.elements.root.classList.add('wos-minimized');
    this.events.emit<WindowState>('window:minimized', { ...win.state });
    this._focusTopWindow();
  }

  /**
   * 最大化
   */
  maximize(id: string): void {
    const win = this._wins.get(id);
    if (!win) return;
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
    win.elements.root.classList.remove('wos-minimized');
    win.elements.root.classList.add('wos-maximized');
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
    win.elements.root.classList.remove('wos-minimized');

    if (wasMaximized) {
      // 最大化狀態：只解除最小化，維持最大化視覺
      win.elements.root.classList.add('wos-maximized');
      this.events.emit<WindowState>('window:restored', { ...win.state });
      return;
    }

    // 完全還原（從最大化按鈕點還原，或單純取消最小化）
    win.state.isMaximized = false;
    win.elements.root.classList.remove('wos-maximized');
    win.elements.btnMax.textContent = '□';
    win.elements.btnMax.setAttribute('aria-label', '最大化');
    if (win.state._savedGeometry) {
      const g = win.state._savedGeometry;
      win.state.x = g.x; win.state.y = g.y;
      win.state.width = g.width; win.state.height = g.height;
      applyGeometry(win.elements.root, win.state);
      delete win.state._savedGeometry;
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

  /** 銷毀所有視窗，清除事件 */
  destroy(): void {
    [...this._wins.keys()].forEach(id => this.close(id));
    this.events.clearAll();
    this._guideV?.remove();
    this._guideH?.remove();
    this._guideV = null;
    this._guideH = null;
    if (this._isolated) {
      this._container.classList.remove('wos-isolated');
    }
  }

  // ─────────────────────────────────────────
  // Private helpers
  // ─────────────────────────────────────────

  /** 延遲建立 snap guide 元素（僅需要時才建立） */
  private _ensureGuides(): void {
    if (this._guideV) return;
    this._guideV = document.createElement('div');
    this._guideV.className = 'wos-snap-guide wos-snap-guide--v';
    this._guideH = document.createElement('div');
    this._guideH.className = 'wos-snap-guide wos-snap-guide--h';
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

  private _deactivateOthers(exceptId: string): void {
    this._wins.forEach((win, id) => {
      if (id !== exceptId && win.state.isActive) {
        win.state.isActive = false;
        win.elements.root.classList.remove('wos-active');
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
}
