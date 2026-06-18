// ============================================================
// DeskPane — Drag & Resize Handler
// 支援滑鼠與觸控，內建 Throttle 確保巨量表格不卡頓
// ============================================================

export interface DragResizeOptions {
  /** 拖曳 / 縮放時的節流間隔（毫秒），預設 16ms ≈ 60fps */
  throttleMs?: number;
  /** 縮放邊框感應寬度（px），預設 6 */
  resizeBorderPx?: number;
  /** 視窗最小寬度（px） */
  minWidth?: number;
  /** 視窗最小高度（px） */
  minHeight?: number;
  /**
   * Isolated 模式容器元素。設定後，拖曳 / 縮放座標會轉換為相對於容器的座標，
   * 搭配 WindowManager isolated 選項使用（視窗以 position:absolute 定位）。
   */
  containerEl?: HTMLElement;
  /**
   * Snap 吸附函數。拖曳時以「原始計算座標」呼叫，回傳吸附後座標。
   * 若不傳則不做吸附。
   */
  snapFn?: (x: number, y: number, width: number, height: number) => { x: number; y: number };
  /**
   * 縮放吸附函數。縮放時呼叫，回傳吸附後的位置與大小。
   * 若不傳則縮放時不做吸附。
   */
  resizeSnapFn?: (x: number, y: number, width: number, height: number, edge: string) => { x: number; y: number; width: number; height: number };
  /**
   * 允許縮放視窗邊框。設為 false 時滑鼠在邊框上不顯示縮放游標，也不啟動縮放。
   * 預設 true。
   */
  resizable?: boolean;
  /**
   * 拖曳邊界保留量（px）。視窗拖曳到容器邊緣時，至少保留此寬度在容器內，
   * 確保使用者仍可抓取視窗標題列。預設 60。設為 0 則不限制。
   */
  dragEdgeMargin?: number;
  onDragStart?: () => void;
  onDrag?: (x: number, y: number) => void;
  onDragEnd?: () => void;
  onResizeStart?: () => void;
  onResize?: (x: number, y: number, width: number, height: number) => void;
  onResizeEnd?: () => void;
}

type ResizeEdge = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw' | null;

/**
 * 簡易節流。
 * 這裡不用 requestAnimationFrame，因為呼叫端可能希望固定節流間隔；
 * 預設 16ms 約等於 60fps，對大型內容視窗比較穩。
 */
function throttle<T extends (...args: any[]) => void>(fn: T, ms: number): T {
  let last = 0;
  return function (this: any, ...args: any[]) {
    const now = performance.now();
    if (now - last >= ms) {
      last = now;
      fn.apply(this, args);
    }
  } as T;
}

export class DragResizeHandler {
  private _winEl: HTMLElement;
  private _headerEl: HTMLElement;
  private _opts: Required<Omit<DragResizeOptions, 'containerEl' | 'snapFn' | 'resizeSnapFn'>> & { containerEl?: HTMLElement; snapFn?: DragResizeOptions['snapFn']; resizeSnapFn?: DragResizeOptions['resizeSnapFn'] };


  // 拖曳狀態
  private _dragging = false;
  private _dragOffX = 0;
  private _dragOffY = 0;

  // 縮放狀態
  private _resizing = false;
  private _resizeEdge: ResizeEdge = null;
  private _resizeStartX = 0;
  private _resizeStartY = 0;
  private _resizeStartRect = { x: 0, y: 0, w: 0, h: 0 };

  private _onMouseMoveBound: (e: MouseEvent) => void;
  private _onMouseUpBound: (e: MouseEvent) => void;
  private _onTouchMoveBound: (e: TouchEvent) => void;
  private _onTouchEndBound: (e: TouchEvent) => void;

  constructor(
    winEl: HTMLElement,
    headerEl: HTMLElement,
    opts: DragResizeOptions = {}
  ) {
    this._winEl = winEl;
    this._headerEl = headerEl;
    this._opts = {
      throttleMs: opts.throttleMs ?? 16,
      resizeBorderPx: opts.resizeBorderPx ?? 8,
      minWidth: opts.minWidth ?? 200,
      minHeight: opts.minHeight ?? 120,
      containerEl: opts.containerEl,
      snapFn: opts.snapFn,
      resizeSnapFn: opts.resizeSnapFn,
      resizable: opts.resizable ?? true,
      dragEdgeMargin: opts.dragEdgeMargin ?? 60,
      onDragStart: opts.onDragStart ?? (() => {}),
      onDrag: opts.onDrag ?? (() => {}),
      onDragEnd: opts.onDragEnd ?? (() => {}),
      onResizeStart: opts.onResizeStart ?? (() => {}),
      onResize: opts.onResize ?? (() => {}),
      onResizeEnd: opts.onResizeEnd ?? (() => {}),
    };

    const throttledMove = throttle(this._handleMove.bind(this), this._opts.throttleMs);
    this._onMouseMoveBound = throttledMove as (e: MouseEvent) => void;
    this._onMouseUpBound = this._handleUp.bind(this);
    this._onTouchMoveBound = (e: TouchEvent) => {
      const t = e.touches[0];
      throttledMove({ clientX: t.clientX, clientY: t.clientY } as MouseEvent);
    };
    this._onTouchEndBound = this._handleUp.bind(this) as unknown as (e: TouchEvent) => void;

    this._attachEvents();
  }

  private _attachEvents(): void {
    // 標題列 → 拖曳
    this._headerEl.addEventListener('mousedown', this._onHeaderMouseDown.bind(this));
    this._headerEl.addEventListener('touchstart', this._onHeaderTouchStart.bind(this), { passive: true });

    // 視窗邊框 → 縮放
    this._winEl.addEventListener('mousedown', this._onWinMouseDown.bind(this));
    this._winEl.addEventListener('mousemove', this._updateResizeCursor.bind(this));
  }

  private _onHeaderMouseDown(e: MouseEvent): void {
    if ((e.target as HTMLElement).closest('.dp-btn')) return; // 忽略按鈕點擊
    e.preventDefault();
    this._startDrag(e.clientX, e.clientY);
    document.addEventListener('mousemove', this._onMouseMoveBound);
    document.addEventListener('mouseup', this._onMouseUpBound, { once: true });
  }

  private _onHeaderTouchStart(e: TouchEvent): void {
    const t = e.touches[0];
    this._startDrag(t.clientX, t.clientY);
    document.addEventListener('touchmove', this._onTouchMoveBound, { passive: true });
    document.addEventListener('touchend', this._onTouchEndBound, { once: true });
  }

  private _startDrag(clientX: number, clientY: number): void {
    const rect = this._winEl.getBoundingClientRect();
    this._dragging = true;
    this._dragOffX = clientX - rect.left;
    this._dragOffY = clientY - rect.top;
    this._winEl.style.userSelect = 'none';
    this._opts.onDragStart();
  }

  private _onWinMouseDown(e: MouseEvent): void {
    if (!this._opts.resizable) return;
    const edge = this._getResizeEdge(e);
    if (!edge) return;
    e.preventDefault();
    this._startResize(edge, e.clientX, e.clientY);
    document.addEventListener('mousemove', this._onMouseMoveBound);
    document.addEventListener('mouseup', this._onMouseUpBound, { once: true });
  }

  private _startResize(edge: ResizeEdge, clientX: number, clientY: number): void {
    const rect = this._winEl.getBoundingClientRect();
    this._resizing = true;
    this._resizeEdge = edge;
    this._resizeStartX = clientX;
    this._resizeStartY = clientY;
    this._resizeStartRect = {
      x: rect.left,
      y: rect.top,
      w: rect.width,
      h: rect.height,
    };
    this._winEl.style.userSelect = 'none';
    this._opts.onResizeStart();
  }

  private _handleMove(e: { clientX: number; clientY: number }): void {
    if (this._dragging) {
      const { left, top } = this._getContainerRect();
      // clientX/Y 是 viewport 座標；isolated 模式下需轉成 container 內部座標。
      let x = e.clientX - this._dragOffX - left;
      let y = e.clientY - this._dragOffY - top;
      if (this._opts.snapFn) {
        const snapped = this._opts.snapFn(x, y, this._winEl.offsetWidth, this._winEl.offsetHeight);
        x = snapped.x;
        y = snapped.y;
      }
      // 邊界保留：確保視窗至少留 dragEdgeMargin px 在容器內，使用者仍可抓取。
      // 注意：此限制只在 containerEl 存在時啟用；全頁模式維持傳統視窗可拖出邊界的彈性。
      const margin = this._opts.dragEdgeMargin;
      if (margin > 0 && this._opts.containerEl) {
        const cW = this._opts.containerEl.offsetWidth;
        const cH = this._opts.containerEl.offsetHeight;
        const winW = this._winEl.offsetWidth;

        // 讀取容器繼承的 Dock inset CSS 變數（Desktop 模式自動設定，非 Desktop 模式為 0）
        const cs = getComputedStyle(this._opts.containerEl);
        const dockTop    = parseFloat(cs.getPropertyValue('--dp-dock-inset-top'))    || 0;
        const dockRight  = parseFloat(cs.getPropertyValue('--dp-dock-inset-right'))  || 0;
        const dockBottom = parseFloat(cs.getPropertyValue('--dp-dock-inset-bottom')) || 0;
        const dockLeft   = parseFloat(cs.getPropertyValue('--dp-dock-inset-left'))   || 0;

        // 各方向邊界 = 使用者設定的 margin + Dock 佔用空間。
        // Dock inset 由 Desktop 透過 CSS 變數同步，避免 DragResizeHandler 直接依賴 Desktop。
        const bTop    = dockTop;                   // 頂部：不允許標題列超出（含 top-dock）
        const bRight  = margin + dockRight;
        const bBottom = margin + dockBottom;       // 底部加上 Dock 高度，視窗不沉入 Dock
        const bLeft   = margin + dockLeft;

        x = Math.max(bLeft - winW, Math.min(x, cW - bRight));
        y = Math.max(bTop,         Math.min(y, cH - bBottom));
      }
      this._winEl.style.left = `${x}px`;
      this._winEl.style.top = `${y}px`;
      this._opts.onDrag(x, y);
    } else if (this._resizing && this._resizeEdge) {
      this._applyResize(e.clientX, e.clientY);
    }
  }

  private _applyResize(clientX: number, clientY: number): void {
    const dx = clientX - this._resizeStartX;
    const dy = clientY - this._resizeStartY;
    const { x, y, w, h } = this._resizeStartRect;
    const { minWidth, minHeight } = this._opts;
    const edge = this._resizeEdge!;

    let newX = x, newY = y, newW = w, newH = h;

    if (edge.includes('e')) newW = Math.max(minWidth, w + dx);
    if (edge.includes('s')) newH = Math.max(minHeight, h + dy);
    if (edge.includes('w')) {
      newW = Math.max(minWidth, w - dx);
      newX = x + (w - newW);
    }
    if (edge.includes('n')) {
      newH = Math.max(minHeight, h - dy);
      newY = y + (h - newH);
    }

    // 轉換為容器相對座標（isolated 模式下 newX/newY 是 viewport 座標）。
    // resizeSnapFn 和 WindowManager state 都使用 container-relative 座標。
    const { left: cLeft, top: cTop } = this._getContainerRect();
    let cx = newX - cLeft;
    let cy = newY - cTop;

    if (this._opts.resizeSnapFn) {
      const snapped = this._opts.resizeSnapFn(cx, cy, newW, newH, edge);
      cx = snapped.x;
      cy = snapped.y;
      newW = snapped.width;
      newH = snapped.height;
    }

    // 縮放邊界保留：與拖曳使用相同的邊界規則。
    // N/W 邊會移動 x/y，因此需要補償 width/height；S/E 邊只限制不能反向縮到不可抓取。
    const margin = this._opts.dragEdgeMargin;
    if (margin > 0 && this._opts.containerEl) {
      const cW = this._opts.containerEl.offsetWidth;
      const cH = this._opts.containerEl.offsetHeight;

      const cs = getComputedStyle(this._opts.containerEl);
      const dockTop    = parseFloat(cs.getPropertyValue('--dp-dock-inset-top'))    || 0;
      const dockRight  = parseFloat(cs.getPropertyValue('--dp-dock-inset-right'))  || 0;
      const dockBottom = parseFloat(cs.getPropertyValue('--dp-dock-inset-bottom')) || 0;
      const dockLeft   = parseFloat(cs.getPropertyValue('--dp-dock-inset-left'))   || 0;

      const bTop    = dockTop;
      const bRight  = margin + dockRight;
      const bBottom = margin + dockBottom;
      const bLeft   = margin + dockLeft;

      // 北邊（n/nw/ne）：cy 移動 → 套用與拖曳完全相同的上下界，底部固定，newH 補償
      if (edge.includes('n')) {
        const bottomSide = cy + newH;
        cy = Math.max(bTop, Math.min(cy, cH - bBottom));
        newH = Math.max(minHeight, bottomSide - cy);
      }
      // 西邊（w/nw/sw）：cx 移動 → 下限 dockLeft（保持把手可見），上限同拖曳右界，右側固定，newW 補償
      if (edge.includes('w')) {
        const rightSide = cx + newW;
        cx = Math.max(dockLeft, Math.min(cx, cW - bRight));
        newW = Math.max(minWidth, rightSide - cx);
      }
      // 東邊（e/ne/se）：cx 不動，標題欄不會離開容器，無需限制右側延伸
      //   只限制右邊線不能往左超過左側拖曳邊界（與拖曳限制距離相同）
      if (edge.includes('e') && !edge.includes('w')) {
        const minW = Math.max(minWidth, bLeft - cx);
        newW = Math.max(minW, newW);
      }
      // 南邊（s/se/sw）：cy 不動，標題欄不會離開容器，無需限制底部延伸
      //   只限制底邊不能往上超過頂部拖曳邊界（防止視窗倒縮）
      if (edge.includes('s') && !edge.includes('n')) {
        const minH = Math.max(minHeight, bTop - cy);
        newH = Math.max(minH, newH);
      }
    }

    this._winEl.style.left = `${cx}px`;
    this._winEl.style.top = `${cy}px`;
    this._winEl.style.width = `${newW}px`;
    this._winEl.style.height = `${newH}px`;
    this._opts.onResize(cx, cy, newW, newH);
  }

  private _handleUp(): void {
    // mouseup/touchend 可能在視窗外觸發；所有全域 listener 都在這裡收掉。
    if (this._dragging) {
      this._dragging = false;
      this._winEl.style.userSelect = '';
      this._opts.onDragEnd();
    }
    if (this._resizing) {
      this._resizing = false;
      this._resizeEdge = null;
      this._winEl.style.userSelect = '';
      this._opts.onResizeEnd();
    }
    document.removeEventListener('mousemove', this._onMouseMoveBound);
    document.removeEventListener('touchmove', this._onTouchMoveBound);
  }

  private _getContainerRect(): { left: number; top: number } {
    if (this._opts.containerEl) {
      const r = this._opts.containerEl.getBoundingClientRect();
      return { left: r.left, top: r.top };
    }
    return { left: 0, top: 0 };
  }

  private _getResizeEdge(e: MouseEvent): ResizeEdge {
    const rect = this._winEl.getBoundingClientRect();
    const b = this._opts.resizeBorderPx;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const right = rect.width - x;
    const bottom = rect.height - y;

    // 標題列內不啟動縮放
    if ((e.target as HTMLElement).closest('.dp-header')) return null;

    const onN = y <= b;
    const onS = bottom <= b;
    const onW = x <= b;
    const onE = right <= b;

    if (onN && onW) return 'nw';
    if (onN && onE) return 'ne';
    if (onS && onW) return 'sw';
    if (onS && onE) return 'se';
    if (onN) return 'n';
    if (onS) return 's';
    if (onW) return 'w';
    if (onE) return 'e';
    return null;
  }

  private _updateResizeCursor(e: MouseEvent): void {
    if (this._dragging || this._resizing) return;
    if (!this._opts.resizable) { this._winEl.style.cursor = 'default'; return; }
    const edge = this._getResizeEdge(e);
    const cursors: Record<string, string> = {
      n: 'n-resize', s: 's-resize', e: 'e-resize', w: 'w-resize',
      ne: 'ne-resize', nw: 'nw-resize', se: 'se-resize', sw: 'sw-resize',
    };
    this._winEl.style.cursor = edge ? cursors[edge] : 'default';
  }

  destroy(): void {
    document.removeEventListener('mousemove', this._onMouseMoveBound);
    document.removeEventListener('mouseup', this._onMouseUpBound);
    document.removeEventListener('touchmove', this._onTouchMoveBound);
    document.removeEventListener('touchend', this._onTouchEndBound);
  }
}
