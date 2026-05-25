(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.WebOS = {}));
})(this, (function (exports) { 'use strict';

    // ============================================================
    // WebOS-Core — Global Event Bus
    // 跨視窗事件系統，允許不同視窗間即時資料聯動
    // ============================================================
    class EventBus {
        constructor() {
            this._listeners = new Map();
        }
        /** 訂閱事件 */
        on(event, cb) {
            if (!this._listeners.has(event)) {
                this._listeners.set(event, new Set());
            }
            this._listeners.get(event).add(cb);
            // 回傳取消訂閱函式
            return () => this.off(event, cb);
        }
        /** 取消訂閱 */
        off(event, cb) {
            this._listeners.get(event)?.delete(cb);
        }
        /** 發送事件 */
        emit(event, data) {
            this._listeners.get(event)?.forEach(cb => {
                try {
                    cb(data);
                }
                catch (e) {
                    console.error(`[EventBus] Error in handler for "${event}":`, e);
                }
            });
        }
        /** 清除特定事件的所有訂閱 */
        clear(event) {
            this._listeners.delete(event);
        }
        /** 清除全部訂閱 */
        clearAll() {
            this._listeners.clear();
        }
    }
    /** 全域單例 */
    const eventBus = new EventBus();

    // ============================================================
    // WebOS-Core — Drag & Resize Handler
    // 支援滑鼠與觸控，內建 Throttle 確保巨量表格不卡頓
    // ============================================================
    /** 簡易節流 */
    function throttle(fn, ms) {
        let last = 0;
        return function (...args) {
            const now = performance.now();
            if (now - last >= ms) {
                last = now;
                fn.apply(this, args);
            }
        };
    }
    class DragResizeHandler {
        constructor(winEl, headerEl, opts = {}) {
            // 拖曳狀態
            this._dragging = false;
            this._dragOffX = 0;
            this._dragOffY = 0;
            // 縮放狀態
            this._resizing = false;
            this._resizeEdge = null;
            this._resizeStartX = 0;
            this._resizeStartY = 0;
            this._resizeStartRect = { x: 0, y: 0, w: 0, h: 0 };
            this._winEl = winEl;
            this._headerEl = headerEl;
            this._opts = {
                throttleMs: opts.throttleMs ?? 16,
                resizeBorderPx: opts.resizeBorderPx ?? 8,
                minWidth: opts.minWidth ?? 200,
                minHeight: opts.minHeight ?? 120,
                containerEl: opts.containerEl,
                snapFn: opts.snapFn,
                onDragStart: opts.onDragStart ?? (() => { }),
                onDrag: opts.onDrag ?? (() => { }),
                onDragEnd: opts.onDragEnd ?? (() => { }),
                onResizeStart: opts.onResizeStart ?? (() => { }),
                onResize: opts.onResize ?? (() => { }),
                onResizeEnd: opts.onResizeEnd ?? (() => { }),
            };
            const throttledMove = throttle(this._handleMove.bind(this), this._opts.throttleMs);
            this._onMouseMoveBound = throttledMove;
            this._onMouseUpBound = this._handleUp.bind(this);
            this._onTouchMoveBound = (e) => {
                const t = e.touches[0];
                throttledMove({ clientX: t.clientX, clientY: t.clientY });
            };
            this._onTouchEndBound = this._handleUp.bind(this);
            this._attachEvents();
        }
        _attachEvents() {
            // 標題列 → 拖曳
            this._headerEl.addEventListener('mousedown', this._onHeaderMouseDown.bind(this));
            this._headerEl.addEventListener('touchstart', this._onHeaderTouchStart.bind(this), { passive: true });
            // 視窗邊框 → 縮放
            this._winEl.addEventListener('mousedown', this._onWinMouseDown.bind(this));
            this._winEl.addEventListener('mousemove', this._updateResizeCursor.bind(this));
        }
        _onHeaderMouseDown(e) {
            if (e.target.closest('.wos-btn'))
                return; // 忽略按鈕點擊
            e.preventDefault();
            this._startDrag(e.clientX, e.clientY);
            document.addEventListener('mousemove', this._onMouseMoveBound);
            document.addEventListener('mouseup', this._onMouseUpBound, { once: true });
        }
        _onHeaderTouchStart(e) {
            const t = e.touches[0];
            this._startDrag(t.clientX, t.clientY);
            document.addEventListener('touchmove', this._onTouchMoveBound, { passive: true });
            document.addEventListener('touchend', this._onTouchEndBound, { once: true });
        }
        _startDrag(clientX, clientY) {
            const rect = this._winEl.getBoundingClientRect();
            this._dragging = true;
            this._dragOffX = clientX - rect.left;
            this._dragOffY = clientY - rect.top;
            this._winEl.style.userSelect = 'none';
            this._opts.onDragStart();
        }
        _onWinMouseDown(e) {
            const edge = this._getResizeEdge(e);
            if (!edge)
                return;
            e.preventDefault();
            this._startResize(edge, e.clientX, e.clientY);
            document.addEventListener('mousemove', this._onMouseMoveBound);
            document.addEventListener('mouseup', this._onMouseUpBound, { once: true });
        }
        _startResize(edge, clientX, clientY) {
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
        _handleMove(e) {
            if (this._dragging) {
                const { left, top } = this._getContainerRect();
                let x = e.clientX - this._dragOffX - left;
                let y = e.clientY - this._dragOffY - top;
                if (this._opts.snapFn) {
                    const snapped = this._opts.snapFn(x, y, this._winEl.offsetWidth, this._winEl.offsetHeight);
                    x = snapped.x;
                    y = snapped.y;
                }
                this._winEl.style.left = `${x}px`;
                this._winEl.style.top = `${y}px`;
                this._opts.onDrag(x, y);
            }
            else if (this._resizing && this._resizeEdge) {
                this._applyResize(e.clientX, e.clientY);
            }
        }
        _applyResize(clientX, clientY) {
            const dx = clientX - this._resizeStartX;
            const dy = clientY - this._resizeStartY;
            const { x, y, w, h } = this._resizeStartRect;
            const { minWidth, minHeight } = this._opts;
            const edge = this._resizeEdge;
            let newX = x, newY = y, newW = w, newH = h;
            if (edge.includes('e'))
                newW = Math.max(minWidth, w + dx);
            if (edge.includes('s'))
                newH = Math.max(minHeight, h + dy);
            if (edge.includes('w')) {
                newW = Math.max(minWidth, w - dx);
                newX = x + (w - newW);
            }
            if (edge.includes('n')) {
                newH = Math.max(minHeight, h - dy);
                newY = y + (h - newH);
            }
            // 轉換為容器相對座標（isolated 模式下 newX/newY 是 viewport 座標）
            const { left: cLeft, top: cTop } = this._getContainerRect();
            this._winEl.style.left = `${newX - cLeft}px`;
            this._winEl.style.top = `${newY - cTop}px`;
            this._winEl.style.width = `${newW}px`;
            this._winEl.style.height = `${newH}px`;
            this._opts.onResize(newX - cLeft, newY - cTop, newW, newH);
        }
        _handleUp() {
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
        _getContainerRect() {
            if (this._opts.containerEl) {
                const r = this._opts.containerEl.getBoundingClientRect();
                return { left: r.left, top: r.top };
            }
            return { left: 0, top: 0 };
        }
        _getResizeEdge(e) {
            const rect = this._winEl.getBoundingClientRect();
            const b = this._opts.resizeBorderPx;
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const right = rect.width - x;
            const bottom = rect.height - y;
            // 標題列內不啟動縮放
            if (e.target.closest('.wos-header'))
                return null;
            const onN = y <= b;
            const onS = bottom <= b;
            const onW = x <= b;
            const onE = right <= b;
            if (onN && onW)
                return 'nw';
            if (onN && onE)
                return 'ne';
            if (onS && onW)
                return 'sw';
            if (onS && onE)
                return 'se';
            if (onN)
                return 'n';
            if (onS)
                return 's';
            if (onW)
                return 'w';
            if (onE)
                return 'e';
            return null;
        }
        _updateResizeCursor(e) {
            if (this._dragging || this._resizing)
                return;
            const edge = this._getResizeEdge(e);
            const cursors = {
                n: 'n-resize', s: 's-resize', e: 'e-resize', w: 'w-resize',
                ne: 'ne-resize', nw: 'nw-resize', se: 'se-resize', sw: 'sw-resize',
            };
            this._winEl.style.cursor = edge ? cursors[edge] : 'default';
        }
        destroy() {
            document.removeEventListener('mousemove', this._onMouseMoveBound);
            document.removeEventListener('mouseup', this._onMouseUpBound);
            document.removeEventListener('touchmove', this._onTouchMoveBound);
            document.removeEventListener('touchend', this._onTouchEndBound);
        }
    }

    // ============================================================
    // WebOS-Core — DOM Window Renderer
    // 負責建立視窗外殼 DOM 節點、注入樣式
    // ============================================================
    const STYLE_ID = 'wos-core-styles';
    const BASE_CSS = `
.wos-window {
  position: fixed;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  border: 4px solid var(--wos-border, #d0d0d0);
  border-radius: 6px;
  box-shadow: var(--wos-shadow, 0 4px 24px rgba(0,0,0,0.18));
  background: var(--wos-window-bg, #d0d0d0);
  overflow: hidden;
  min-width: 200px;
  min-height: 120px;
  transition: box-shadow 0.15s, border-color 0.15s;
}
.wos-window.wos-active {
  border-color: var(--wos-border-active, #b0b8c8);
  box-shadow: var(--wos-shadow-active, 0 8px 36px rgba(0,0,0,0.28));
}
.wos-window.wos-minimized {
  display: none !important;
}
.wos-window.wos-maximized {
  left: 72px !important;
  top: 0 !important;
  width: calc(100vw - 72px) !important;
  height: calc(100vh - 48px) !important;
  border-radius: 0;
  border-width: 0;
}
/* ── Isolated container mode ──────────────────────────── */
.wos-isolated {
  position: relative;
  overflow: hidden;
}
.wos-isolated .wos-window {
  position: absolute;
}
.wos-isolated .wos-window.wos-maximized {
  left: 0 !important;
  top: 0 !important;
  width: 100% !important;
  height: 100% !important;
  border-radius: 0;
}
/* ─────────────────────────────────────────────────────── */
.wos-header {
  display: flex;
  align-items: center;
  padding: 0 8px;
  height: 36px;
  background: var(--wos-header-bg, #f5f5f5);
  border-bottom: 1px solid var(--wos-header-border, #e0e0e0);
  cursor: move;
  user-select: none;
  flex-shrink: 0;
}
.wos-title {
  flex: 1;
  font-size: 13px;
  font-weight: 600;
  color: var(--wos-title-color, #333333);
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.wos-btn {
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 4px;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: var(--wos-btn-color, #555555);
  margin-left: 2px;
  transition: background 0.1s;
}
.wos-btn:hover { background: var(--wos-btn-hover-bg, #e0e0e0); }
.wos-btn.wos-btn-close:hover { background: var(--wos-btn-close-hover-bg, #ff5f57); color: var(--wos-btn-close-hover-color, #ffffff); }
.wos-body {
  flex: 1;
  overflow: auto;
  position: relative;
  background: var(--wos-body-bg, #ffffff);
  color: var(--wos-body-color, #222222);
}
.wos-body.wos-has-layout {
  overflow: hidden;
}
/* ── Snap guide lines ─────────────────────────────── */
.wos-snap-guide {
  position: absolute;
  pointer-events: none;
  z-index: 2147483647;
  display: none;
  background: var(--wos-snap-guide-color, rgba(0, 120, 255, 0.55));
}
.wos-snap-guide--v {
  width: 1px;
  top: 0;
  bottom: 0;
}
.wos-snap-guide--h {
  height: 1px;
  left: 0;
  right: 0;
}
`;
    function injectStyles() {
        if (document.getElementById(STYLE_ID))
            return;
        const style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = BASE_CSS;
        document.head.appendChild(style);
    }
    /** 建立視窗外殼 DOM，回傳各主要元素參照 */
    function createWindowDOM(state) {
        const root = document.createElement('div');
        root.className = 'wos-window';
        root.dataset.wosId = state.id;
        applyGeometry(root, state);
        root.style.zIndex = String(state.zIndex);
        // ── Header ──
        const header = document.createElement('div');
        header.className = 'wos-header';
        const title = document.createElement('span');
        title.className = 'wos-title';
        title.textContent = state.title;
        const btnMin = createButton('－', 'wos-btn-min', '最小化');
        const btnMax = createButton('□', 'wos-btn-max', '最大化');
        const btnClose = createButton('✕', 'wos-btn-close', '關閉');
        header.append(title, btnMin, btnMax, btnClose);
        // ── Body ──
        const body = document.createElement('div');
        body.className = 'wos-body';
        root.append(header, body);
        // 注入視窗內容（DOM 型別）
        if (state.slotType === 'dom' && state.content instanceof HTMLElement) {
            body.appendChild(state.content);
        }
        return { root, header, title, body, btnMin, btnMax, btnClose };
    }
    function createButton(text, cls, ariaLabel) {
        const btn = document.createElement('button');
        btn.className = `wos-btn ${cls}`;
        btn.textContent = text;
        btn.setAttribute('aria-label', ariaLabel);
        return btn;
    }
    /** 將 WindowState 的幾何資訊套用到 DOM 元素 */
    function applyGeometry(el, state) {
        if (state.x !== undefined)
            el.style.left = `${state.x}px`;
        if (state.y !== undefined)
            el.style.top = `${state.y}px`;
        if (state.width !== undefined)
            el.style.width = `${state.width}px`;
        if (state.height !== undefined)
            el.style.height = `${state.height}px`;
    }

    // ============================================================
    // WebOS-Core — Snap Helper
    // 純計算模組：計算視窗拖曳時的吸附位置與 guide 線位置
    // ============================================================
    /**
     * 計算單軸的吸附結果。
     * 同時檢查「近邊」(pos) 和「遠邊」(pos+size) 是否接近任一 target。
     * 回傳最近一次命中的吸附後座標與 guide 位置。
     */
    function snapAxis(pos, size, targets, threshold) {
        let bestDist = threshold;
        let snapped = pos;
        let guidePos = null;
        for (const t of targets) {
            // 近邊 (left / top)
            const dNear = Math.abs(pos - t);
            if (dNear < bestDist) {
                bestDist = dNear;
                snapped = t;
                guidePos = t;
            }
            // 遠邊 (right / bottom)
            const dFar = Math.abs(pos + size - t);
            if (dFar < bestDist) {
                bestDist = dFar;
                snapped = t - size;
                guidePos = t;
            }
        }
        return { snapped, guidePos };
    }
    /**
     * 計算拖曳視窗的吸附位置。
     *
     * @param drag          拖曳中視窗的建議位置與大小
     * @param containerSize 容器的寬高（isolated 用容器；否則用 viewport）
     * @param others        其他非最小化 / 非最大化視窗的位置與大小
     * @param threshold     吸附感應距離（px）
     */
    function snapPosition(drag, containerSize, others, threshold) {
        // X 軸吸附目標：容器左邊、右邊，以及所有其他視窗的左右邊
        const xTargets = [0, containerSize.width];
        // Y 軸吸附目標：容器頂邊、底邊，以及所有其他視窗的上下邊
        const yTargets = [0, containerSize.height];
        for (const o of others) {
            xTargets.push(o.x, o.x + o.width);
            yTargets.push(o.y, o.y + o.height);
        }
        const { snapped: snapX, guidePos: guideX } = snapAxis(drag.x, drag.width, xTargets, threshold);
        const { snapped: snapY, guidePos: guideY } = snapAxis(drag.y, drag.height, yTargets, threshold);
        const guides = [];
        if (guideX !== null)
            guides.push({ axis: 'v', pos: guideX });
        if (guideY !== null)
            guides.push({ axis: 'h', pos: guideY });
        return { x: snapX, y: snapY, guides };
    }

    // ============================================================
    // WebOS-Core — Border Layout Manager
    // EasyUI 風格東南西北+中間佈局，支援：
    //   • HTML data-region 宣告式初始化
    //   • 任意層巢狀（region 內再放 data-region）
    //   • Splitter 拖曳 resize
    //   • 可折疊面板（折疊按鈕在 header 右端，EasyUI 風格）
    //   • Region 標題列（data-title）+ 圖示（data-icon）
    //   • ResizeObserver 自動重排
    // ============================================================
    const LAYOUT_STYLE_ID = 'wos-layout-styles';
    const LAYOUT_CSS = `
.wos-layout {
  position: relative;
  overflow: hidden;
  box-sizing: border-box;
  width: 100%;
  height: 100%;
}
.wos-layout-region {
  position: absolute;
  overflow: hidden;
  box-sizing: border-box;
}
/* Region header (when data-title is set) */
.wos-region-header {
  display: flex;
  align-items: center;
  height: 28px;
  padding: 0 0 0 8px;
  background: var(--wos-header-bg, #f5f5f5);
  border-bottom: 1px solid var(--wos-header-border, #e0e0e0);
  flex-shrink: 0;
  user-select: none;
  overflow: hidden;
  box-sizing: border-box;
}
.wos-region-icon {
  font-size: 13px;
  margin-right: 5px;
  flex-shrink: 0;
  line-height: 1;
}
.wos-region-title {
  flex: 1;
  font-size: 12px;
  font-weight: 600;
  color: var(--wos-title-color, #333);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
/* Collapse button — lives in header right end (EasyUI style) */
.wos-region-collapse-btn {
  flex-shrink: 0;
  width: 26px;
  height: 28px;
  border: none;
  border-left: 1px solid var(--wos-header-border, #e0e0e0);
  background: var(--wos-header-bg, #f5f5f5);
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--wos-btn-color, #555);
  transition: background 0.1s, color 0.1s;
  z-index: 11;
  line-height: 1;
  margin-left: auto;
  padding: 0;
}
.wos-region-collapse-btn:hover {
  background: var(--wos-btn-hover-bg, #d8e4f0);
  color: var(--wos-title-color, #333);
}
.wos-region-body {
  position: absolute;
  left: 0; right: 0; bottom: 0;
  overflow: auto;
  box-sizing: border-box;
}
/* ── Collapsed strip ───────────────────────────────────────── */
.wos-layout-region--collapsed .wos-region-body {
  display: none;
}
/* East/West collapsed: header fills the full vertical strip */
.wos-layout-region--collapsed.wos-layout-region--west > .wos-region-header,
.wos-layout-region--collapsed.wos-layout-region--east > .wos-region-header {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  height: auto;
  flex-direction: column;
  align-items: center;
  padding: 0;
  border-bottom: none;
  overflow: hidden;
}
/* Collapse btn → top, full-width, larger */
.wos-layout-region--collapsed.wos-layout-region--west .wos-region-collapse-btn,
.wos-layout-region--collapsed.wos-layout-region--east .wos-region-collapse-btn {
  order: 0;
  width: 100%;
  height: 28px;
  font-size: 14px;
  border-left: none;
  border-bottom: 1px solid var(--wos-header-border, #e0e0e0);
  margin-left: 0;
  flex-shrink: 0;
}
/* Icon → below button */
.wos-layout-region--collapsed.wos-layout-region--west .wos-region-icon,
.wos-layout-region--collapsed.wos-layout-region--east .wos-region-icon {
  order: 1;
  margin-right: 0;
  margin-top: 8px;
  font-size: 15px;
}
/* Title → below icon, rotated */
.wos-layout-region--collapsed.wos-layout-region--west .wos-region-title,
.wos-layout-region--collapsed.wos-layout-region--east .wos-region-title {
  order: 2;
  writing-mode: vertical-lr;
  flex: 1;
  margin: 6px 0 4px;
  min-height: 0;
  text-overflow: ellipsis;
  font-size: 12px;
}
/* Splitters */
.wos-layout-splitter {
  position: absolute;
  background: var(--wos-border, #d0d0d0);
  box-sizing: border-box;
  z-index: 10;
  user-select: none;
  transition: background 0.1s;
}
.wos-layout-splitter:hover,
.wos-layout-splitter.wos-splitter-dragging {
  background: var(--wos-border-active, #b0b8c8);
}
.wos-layout-splitter--v {
  cursor: col-resize;
}
.wos-layout-splitter--h {
  cursor: row-resize;
}
`;
    function injectLayoutStyles() {
        if (document.getElementById(LAYOUT_STYLE_ID))
            return;
        const style = document.createElement('style');
        style.id = LAYOUT_STYLE_ID;
        style.textContent = LAYOUT_CSS;
        document.head.appendChild(style);
    }
    const REGION_DEFAULTS = {
        north: { size: 48, minSize: 24 },
        south: { size: 120, minSize: 24 },
        east: { size: 200, minSize: 60 },
        west: { size: 200, minSize: 60 },
        center: { size: 0, minSize: 40 },
    };
    class BorderLayout {
        constructor(options) {
            this.regions = new Map();
            this.splitterEls = new Map();
            this._childLayouts = [];
            this.resizeObserver = null;
            this.cleanups = [];
            injectLayoutStyles();
            // Resolve container
            this.container = typeof options.container === 'string'
                ? (() => {
                    const el = document.querySelector(options.container);
                    if (!el)
                        throw new Error(`[BorderLayout] Container not found: ${options.container}`);
                    return el;
                })()
                : options.container;
            this.splitterSize = options.splitterSize ?? 5;
            this.headerSize = options.headerSize ?? 28;
            // Parse HTML data-region children
            const htmlMap = this._parseHTMLRegions();
            // Build merged region states
            const ALL_REGIONS = ['north', 'south', 'east', 'west', 'center'];
            for (const name of ALL_REGIONS) {
                const opt = options[name];
                const html = htmlMap[name];
                if (!opt && !html)
                    continue;
                const merged = { ...html?.cfg, ...opt };
                const def = REGION_DEFAULTS[name];
                const size = merged.size ?? def.size;
                // Create outer region el
                const el = document.createElement('div');
                el.className = `wos-layout-region wos-layout-region--${name}`;
                el.dataset.wosRegion = name;
                // Optional region header
                const hasHeader = !!merged.title;
                let headerEl = null;
                if (hasHeader) {
                    headerEl = document.createElement('div');
                    headerEl.className = 'wos-region-header';
                    // Optional icon
                    if (merged.icon) {
                        const iconSpan = document.createElement('span');
                        iconSpan.className = 'wos-region-icon';
                        iconSpan.textContent = merged.icon;
                        headerEl.appendChild(iconSpan);
                    }
                    // Title
                    const ttl = document.createElement('span');
                    ttl.className = 'wos-region-title';
                    ttl.textContent = merged.title;
                    headerEl.appendChild(ttl);
                    // Collapse button (right end of header)
                    if (merged.collapsible) {
                        const btn = document.createElement('button');
                        btn.className = 'wos-region-collapse-btn';
                        btn.dataset.wosCollapseFor = name;
                        btn.setAttribute('aria-label', `切換 ${name} 面板`);
                        btn.textContent = this._collapseIcon(name, merged.collapsed ?? false);
                        headerEl.appendChild(btn);
                    }
                    el.appendChild(headerEl);
                }
                // Body (scrollable inner)
                const bodyEl = document.createElement('div');
                bodyEl.className = 'wos-region-body';
                // Move content in
                if (html?.contentEl) {
                    while (html.contentEl.firstChild)
                        bodyEl.appendChild(html.contentEl.firstChild);
                }
                else if (merged.content) {
                    bodyEl.appendChild(merged.content);
                }
                el.appendChild(bodyEl);
                this.regions.set(name, {
                    el, bodyEl, headerEl, size,
                    minSize: merged.minSize ?? def.minSize,
                    collapsible: merged.collapsible ?? false,
                    collapsed: merged.collapsed ?? false,
                    savedSize: size,
                    hasHeader,
                });
                // Apply initial collapsed class
                if (merged.collapsed)
                    el.classList.add('wos-layout-region--collapsed');
            }
            this._buildDOM();
            this._applyLayout();
            this._attachEvents();
            this._initChildLayouts();
        }
        // ── Parse HTML [data-region] direct children ───────────────
        _parseHTMLRegions() {
            const result = {};
            const children = Array.from(this.container.children);
            for (const child of children) {
                const name = child.dataset.region;
                if (!name || !REGION_DEFAULTS[name])
                    continue;
                const cfg = {};
                if (child.dataset.size)
                    cfg.size = +child.dataset.size;
                if (child.dataset.minSize)
                    cfg.minSize = +child.dataset.minSize;
                if ('collapsible' in child.dataset)
                    cfg.collapsible = true;
                if ('collapsed' in child.dataset)
                    cfg.collapsed = true;
                if (child.dataset.title)
                    cfg.title = child.dataset.title;
                if (child.dataset.icon)
                    cfg.icon = child.dataset.icon;
                result[name] = { cfg, contentEl: child };
            }
            return result;
        }
        // ── Build DOM ──────────────────────────────────────────────
        _buildDOM() {
            this.container.innerHTML = '';
            this.container.classList.add('wos-layout');
            // Append region elements
            for (const state of this.regions.values()) {
                this.container.appendChild(state.el);
            }
            // Create splitters between defined non-center regions
            const splitterRegions = ['north', 'south', 'east', 'west'];
            for (const name of splitterRegions) {
                if (!this.regions.has(name))
                    continue;
                const isV = name === 'east' || name === 'west';
                const sp = document.createElement('div');
                sp.className = `wos-layout-splitter wos-layout-splitter--${isV ? 'v' : 'h'}`;
                sp.dataset.wosSplitter = name;
                this.splitterEls.set(name, sp);
                this.container.appendChild(sp);
            }
        }
        // ── Compute & apply all positions ─────────────────────────
        _applyLayout() {
            const W = this.container.clientWidth;
            const H = this.container.clientHeight;
            const sp = this.splitterSize;
            this.headerSize;
            const north = this.regions.get('north');
            const south = this.regions.get('south');
            const east = this.regions.get('east');
            const west = this.regions.get('west');
            const center = this.regions.get('center');
            const nH = north ? (north.collapsed ? this.headerSize : north.size) : 0;
            const sH = south ? (south.collapsed ? this.headerSize : south.size) : 0;
            const eW = east ? (east.collapsed ? this.headerSize : east.size) : 0;
            const wW = west ? (west.collapsed ? this.headerSize : west.size) : 0;
            const nSp = north ? sp : 0;
            const sSp = south ? sp : 0;
            const eSp = east ? sp : 0;
            const wSp = west ? sp : 0;
            // ── North
            if (north) {
                this._setRegionRect(north, 0, 0, W, nH);
                const spEl = this.splitterEls.get('north');
                this._applyRect(spEl, { top: nH, left: 0, width: W, height: sp });
            }
            // ── South
            if (south) {
                this._setRegionRect(south, 0, H - sH, W, sH);
                const spEl = this.splitterEls.get('south');
                this._applyRect(spEl, { top: H - sH - sp, left: 0, width: W, height: sp });
            }
            // Vertical band
            const bandTop = nH + nSp;
            const bandH = H - nH - nSp - sH - sSp;
            // ── West
            if (west) {
                this._setRegionRect(west, 0, bandTop, wW, bandH);
                const spEl = this.splitterEls.get('west');
                this._applyRect(spEl, { top: bandTop, left: wW, width: sp, height: bandH });
            }
            // ── East
            if (east) {
                this._setRegionRect(east, W - eW, bandTop, eW, bandH);
                const spEl = this.splitterEls.get('east');
                this._applyRect(spEl, { top: bandTop, left: W - eW - sp, width: sp, height: bandH });
            }
            // ── Center
            if (center) {
                const cLeft = wW + wSp;
                const cW = W - cLeft - eW - eSp;
                this._setRegionRect(center, cLeft, bandTop, cW, bandH);
            }
        }
        /** Set region outer el + inner body positions */
        _setRegionRect(state, x, y, w, h) {
            const el = state.el;
            el.style.left = `${x}px`;
            el.style.top = `${y}px`;
            el.style.width = `${Math.max(0, w)}px`;
            el.style.height = `${Math.max(0, h)}px`;
            // body offset: leave room for header if present
            const bodyTop = state.hasHeader ? this.headerSize : 0;
            state.bodyEl.style.top = `${bodyTop}px`;
            state.bodyEl.style.height = `${Math.max(0, h - bodyTop)}px`;
        }
        _applyRect(el, r) {
            el.style.top = `${r.top}px`;
            el.style.left = `${r.left}px`;
            el.style.width = `${Math.max(0, r.width)}px`;
            el.style.height = `${Math.max(0, r.height)}px`;
        }
        // ── Recursive child layout detection ──────────────────────
        _initChildLayouts() {
            for (const state of this.regions.values()) {
                const hasNested = Array.from(state.bodyEl.children).some(c => c.dataset.region !== undefined);
                if (hasNested) {
                    const child = new BorderLayout({
                        container: state.bodyEl,
                        splitterSize: this.splitterSize,
                        headerSize: this.headerSize,
                    });
                    this._childLayouts.push(child);
                }
            }
        }
        // ── Event Listeners ───────────────────────────────────────
        _attachEvents() {
            // Splitter drag
            for (const [name, spEl] of this.splitterEls) {
                const onDown = (e) => {
                    if (e.target.closest('.wos-region-collapse-btn'))
                        return;
                    this._startDrag(e, name);
                };
                spEl.addEventListener('mousedown', onDown);
                this.cleanups.push(() => spEl.removeEventListener('mousedown', onDown));
            }
            // Collapse buttons — delegated on container (button lives in region header)
            const onCollapseClick = (e) => {
                const btn = e.target.closest('[data-wos-collapse-for]');
                if (!btn)
                    return;
                this.toggleCollapse(btn.dataset.wosCollapseFor);
            };
            this.container.addEventListener('click', onCollapseClick);
            this.cleanups.push(() => this.container.removeEventListener('click', onCollapseClick));
            // ResizeObserver
            if (typeof ResizeObserver !== 'undefined') {
                this.resizeObserver = new ResizeObserver(() => this._applyLayout());
                this.resizeObserver.observe(this.container);
            }
        }
        _startDrag(e, name) {
            e.preventDefault();
            const state = this.regions.get(name);
            if (state.collapsed)
                return;
            const spEl = this.splitterEls.get(name);
            const isV = name === 'east' || name === 'west';
            const startPos = isV ? e.clientX : e.clientY;
            const startSize = state.size;
            const totalSize = isV ? this.container.clientWidth : this.container.clientHeight;
            spEl.classList.add('wos-splitter-dragging');
            const onMove = (ev) => {
                const delta = isV ? (ev.clientX - startPos) : (ev.clientY - startPos);
                let newSize = (name === 'east' || name === 'south')
                    ? startSize - delta
                    : startSize + delta;
                newSize = Math.max(state.minSize, Math.min(totalSize * 0.85, newSize));
                state.size = newSize;
                state.savedSize = newSize;
                this._applyLayout();
            };
            const onUp = () => {
                spEl.classList.remove('wos-splitter-dragging');
                document.removeEventListener('mousemove', onMove);
                document.removeEventListener('mouseup', onUp);
            };
            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup', onUp);
        }
        // ── Collapse / Expand ──────────────────────────────────────
        toggleCollapse(name) {
            const state = this.regions.get(name);
            if (!state?.collapsible)
                return;
            state.collapsed = !state.collapsed;
            state.el.classList.toggle('wos-layout-region--collapsed', state.collapsed);
            if (!state.collapsed && state.size < state.minSize) {
                state.size = state.savedSize > 0 ? state.savedSize : REGION_DEFAULTS[name].size;
            }
            // Update button icon — button lives in headerEl
            const btn = state.headerEl?.querySelector('[data-wos-collapse-for]');
            if (btn)
                btn.textContent = this._collapseIcon(name, state.collapsed);
            this._applyLayout();
        }
        _collapseIcon(name, collapsed) {
            if (name === 'west')
                return collapsed ? '»' : '«';
            if (name === 'east')
                return collapsed ? '«' : '»';
            if (name === 'north')
                return collapsed ? '⋁' : '⋀';
            if (name === 'south')
                return collapsed ? '⋀' : '⋁';
            return '';
        }
        // ── Public API ─────────────────────────────────────────────
        /** 取得指定 region 的 body 元素（內容區） */
        getRegionEl(name) {
            return this.regions.get(name)?.bodyEl;
        }
        /** 手動觸發重新計算（容器尺寸已改變時使用） */
        resize() {
            this._applyLayout();
        }
        /** 銷毀：移除事件、observer；child layouts 遞迴 destroy */
        destroy() {
            this._childLayouts.forEach(c => c.destroy());
            this._childLayouts = [];
            this.cleanups.forEach(fn => fn());
            this.cleanups = [];
            this.resizeObserver?.disconnect();
            this.resizeObserver = null;
            this.container.classList.remove('wos-layout');
        }
    }

    // ============================================================
    // WebOS-Core — Panel Component
    // 為任意元素加上可折疊的標題列（EasyUI panel 風格）
    // 支援：
    //   • data-panel 宣告式自動初始化
    //   • JS-first: new Panel({ container, title, collapsible })
    //   • 折疊 / 展開（動畫 height）
    // ============================================================
    const PANEL_STYLE_ID = 'wos-panel-styles';
    const PANEL_CSS = `
.wos-panel {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-sizing: border-box;
  width: 100%;
  height: 100%;
}
.wos-panel-header {
  display: flex;
  align-items: center;
  height: 30px;
  min-height: 30px;
  padding: 0 8px;
  background: var(--wos-header-bg, #f5f5f5);
  border-bottom: 1px solid var(--wos-header-border, #e0e0e0);
  user-select: none;
  flex-shrink: 0;
  cursor: default;
}
.wos-panel-title {
  flex: 1;
  font-size: 12px;
  font-weight: 600;
  color: var(--wos-title-color, #333);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.wos-panel-toggle {
  width: 20px;
  height: 20px;
  border-radius: 3px;
  background: transparent;
  border: 1px solid transparent;
  cursor: pointer;
  font-size: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--wos-btn-color, #555);
  flex-shrink: 0;
  transition: background 0.1s;
  line-height: 1;
}
.wos-panel-toggle:hover {
  background: var(--wos-btn-hover-bg, #e0e0e0);
  border-color: var(--wos-border, #d0d0d0);
}
.wos-panel-body {
  flex: 1;
  overflow: auto;
  box-sizing: border-box;
  transition: max-height 0.2s ease;
}
.wos-panel-body.wos-panel-collapsed {
  max-height: 0 !important;
  overflow: hidden;
}
`;
    function injectPanelStyles() {
        if (document.getElementById(PANEL_STYLE_ID))
            return;
        const style = document.createElement('style');
        style.id = PANEL_STYLE_ID;
        style.textContent = PANEL_CSS;
        document.head.appendChild(style);
    }
    class Panel {
        constructor(options) {
            this.headerEl = null;
            this.toggleBtn = null;
            this.cleanups = [];
            injectPanelStyles();
            this.container = typeof options.container === 'string'
                ? (() => {
                    const el = document.querySelector(options.container);
                    if (!el)
                        throw new Error(`[Panel] Container not found: ${options.container}`);
                    return el;
                })()
                : options.container;
            this._collapsed = options.collapsed ?? false;
            this._collapsible = options.collapsible ?? false;
            // Collect existing children to move into body
            const children = Array.from(this.container.childNodes);
            // Clear container
            this.container.innerHTML = '';
            this.container.classList.add('wos-panel');
            // Header (always shown when title provided; or when collapsible)
            const hasHeader = !!options.title || this._collapsible;
            if (hasHeader) {
                const hdr = document.createElement('div');
                hdr.className = 'wos-panel-header';
                const ttl = document.createElement('span');
                ttl.className = 'wos-panel-title';
                ttl.textContent = options.title ?? '';
                hdr.appendChild(ttl);
                if (this._collapsible) {
                    const btn = document.createElement('button');
                    btn.className = 'wos-panel-toggle';
                    btn.setAttribute('aria-label', '切換面板');
                    btn.textContent = this._collapsed ? '▶' : '▼';
                    hdr.appendChild(btn);
                    this.toggleBtn = btn;
                    const onToggle = () => this.toggle();
                    btn.addEventListener('click', onToggle);
                    // Also allow clicking title to toggle
                    hdr.style.cursor = 'pointer';
                    hdr.addEventListener('click', (e) => {
                        if (e.target.closest('.wos-panel-toggle'))
                            return;
                        this.toggle();
                    });
                    this.cleanups.push(() => btn.removeEventListener('click', onToggle));
                }
                this.container.appendChild(hdr);
                this.headerEl = hdr;
            }
            // Body
            const body = document.createElement('div');
            body.className = 'wos-panel-body';
            // Restore original children
            children.forEach(c => body.appendChild(c));
            if (this._collapsed) {
                body.classList.add('wos-panel-collapsed');
            }
            this.container.appendChild(body);
            this.bodyEl = body;
        }
        // ── Public API ─────────────────────────────────────────────
        get collapsed() { return this._collapsed; }
        toggle() {
            this._collapsed = !this._collapsed;
            this.bodyEl.classList.toggle('wos-panel-collapsed', this._collapsed);
            if (this.toggleBtn) {
                this.toggleBtn.textContent = this._collapsed ? '▶' : '▼';
            }
        }
        expand() {
            if (this._collapsed)
                this.toggle();
        }
        collapse() {
            if (!this._collapsed)
                this.toggle();
        }
        setTitle(title) {
            const ttl = this.headerEl?.querySelector('.wos-panel-title');
            if (ttl)
                ttl.textContent = title;
        }
        /** 取得內容區元素 */
        getBodyEl() {
            return this.bodyEl;
        }
        destroy() {
            this.cleanups.forEach(fn => fn());
            this.cleanups = [];
            this.container.classList.remove('wos-panel');
        }
    }

    // ============================================================
    // WebOS-Core — WindowManager
    // 核心大腦：管理所有視窗的生命週期與狀態
    // ============================================================
    const DEFAULT_WIDTH = 640;
    const DEFAULT_HEIGHT = 480;
    const BASE_Z = 100;
    const CASCADE_OFFSET = 30;
    class WindowManager {
        constructor(opts = {}) {
            this._wins = new Map();
            this._zCounter = BASE_Z;
            this._cascadeCount = 0;
            this._guideV = null;
            this._guideH = null;
            /** 追蹤自動建立的 BorderLayout / Panel 實例，視窗關閉時 destroy */
            this._layouts = new Map();
            this._resizeObserver = null;
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
            this._setupResizeObserver();
        }
        // ─────────────────────────────────────────
        // Public API
        // ─────────────────────────────────────────
        /**
         * 開啟視窗。若 ID 已存在，恢復並聚焦；否則建立新視窗。
         */
        open(config) {
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
            const state = {
                id: config.id,
                title: config.title,
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
                props: config.props,
            };
            const elements = createWindowDOM(state);
            this._container.appendChild(elements.root);
            // ── Auto-detect BorderLayout / Panel in content ──────────
            this._tryAutoLayout(state.id, state.content, elements.body);
            const dragResize = new DragResizeHandler(elements.root, elements.header, {
                throttleMs: this._throttleMs,
                containerEl: this._isolated ? this._container : undefined,
                snapFn: this._snapEnabled ? (x, y, w, h) => {
                    const cw = this._isolated ? this._container.offsetWidth : window.innerWidth;
                    const ch = this._isolated ? this._container.offsetHeight : window.innerHeight;
                    const others = [];
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
                    state.x = x;
                    state.y = y;
                    this.events.emit('window:moved', { ...state });
                },
                onDragEnd: () => {
                    this._hideSnapGuides();
                },
                onResize: (x, y, w, h) => {
                    state.x = x;
                    state.y = y;
                    state.width = w;
                    state.height = h;
                    this.events.emit('window:resized', { ...state });
                },
            });
            // 綁定標題列按鈕
            elements.btnMin.addEventListener('click', () => this.minimize(state.id));
            elements.btnMax.addEventListener('click', () => {
                if (state.isMaximized) {
                    // 標題列按鈕點還原：強制完整還原到最大化前的幾何
                    state.isMaximized = false; // 清掉旗標讓 restore() 走完整還原路徑
                    this.restore(state.id);
                }
                else {
                    this.maximize(state.id);
                }
            });
            elements.btnClose.addEventListener('click', () => this.close(state.id));
            // 點擊視窗任意處 → 聚焦
            elements.root.addEventListener('mousedown', () => this.focus(state.id), true);
            const managed = { state, elements, dragResize };
            this._wins.set(state.id, managed);
            this._deactivateOthers(state.id);
            elements.root.classList.add('wos-active');
            this.events.emit('window:opened', { ...state });
            return state;
        }
        /**
         * 關閉並銷毀視窗
         */
        close(id) {
            const win = this._wins.get(id);
            if (!win)
                return;
            win.dragResize.destroy();
            win.elements.root.remove();
            this._wins.delete(id);
            // 銷毀自動建立的 BorderLayout / Panel
            this._layouts.get(id)?.destroy();
            this._layouts.delete(id);
            this.events.emit('window:closed', { id });
            // 聚焦最後一個存活視窗
            this._focusTopWindow();
        }
        /**
         * 聚焦視窗：置頂 zIndex，設定 isActive
         */
        focus(id) {
            const win = this._wins.get(id);
            if (!win || win.state.isActive)
                return;
            this._deactivateOthers(id);
            win.state.zIndex = ++this._zCounter;
            win.state.isActive = true;
            win.elements.root.style.zIndex = String(win.state.zIndex);
            win.elements.root.classList.add('wos-active');
            if (win.state.isMinimized)
                this.restore(id);
            this.events.emit('window:focused', { ...win.state });
        }
        /**
         * 最小化（隱藏 DOM，保留狀態）
         */
        minimize(id) {
            const win = this._wins.get(id);
            if (!win || win.state.isMinimized)
                return;
            win.state.isMinimized = true;
            win.elements.root.classList.add('wos-minimized');
            this.events.emit('window:minimized', { ...win.state });
            this._focusTopWindow();
        }
        /**
         * 最大化
         */
        maximize(id) {
            const win = this._wins.get(id);
            if (!win)
                return;
            // 若已最大化但被最小化，只需還原（顯示最大化視窗）
            if (win.state.isMaximized) {
                if (win.state.isMinimized)
                    this.restore(id);
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
            this.events.emit('window:maximized', { ...win.state });
        }
        /**
         * 還原：
         * - 若視窗是「最大化狀態下被最小化」→ 僅移除最小化，保持最大化
         * - 若只是最大化 → 還原到最大化前的幾何
         * - 若只是最小化 → 還原到原始幾何
         */
        restore(id) {
            const win = this._wins.get(id);
            if (!win)
                return;
            const wasMaximized = win.state.isMaximized;
            win.state.isMinimized = false;
            win.elements.root.classList.remove('wos-minimized');
            if (wasMaximized) {
                // 最大化狀態：只解除最小化，維持最大化視覺
                win.elements.root.classList.add('wos-maximized');
                this.events.emit('window:restored', { ...win.state });
                return;
            }
            // 完全還原（從最大化按鈕點還原，或單純取消最小化）
            win.state.isMaximized = false;
            win.elements.root.classList.remove('wos-maximized');
            win.elements.btnMax.textContent = '□';
            win.elements.btnMax.setAttribute('aria-label', '最大化');
            if (win.state._savedGeometry) {
                const g = win.state._savedGeometry;
                win.state.x = g.x;
                win.state.y = g.y;
                win.state.width = g.width;
                win.state.height = g.height;
                applyGeometry(win.elements.root, win.state);
                delete win.state._savedGeometry;
            }
            this.events.emit('window:restored', { ...win.state });
        }
        /** 取得視窗目前狀態快照（唯讀副本） */
        getState(id) {
            const win = this._wins.get(id);
            return win ? { ...win.state } : undefined;
        }
        /** 取得視窗 Body DOM 節點，供外部 Wijmo / jQuery 附加內容 */
        getBodyElement(id) {
            return this._wins.get(id)?.elements.body;
        }
        /** 取得所有視窗 ID 清單 */
        getWindowIds() {
            return [...this._wins.keys()];
        }
        /** 更新視窗標題 */
        setTitle(id, title) {
            const win = this._wins.get(id);
            if (!win)
                return;
            win.state.title = title;
            win.elements.title.textContent = title;
        }
        /** 銷毀所有視窗，清除事件 */
        destroy() {
            [...this._wins.keys()].forEach(id => this.close(id));
            this._layouts.forEach(l => l.destroy());
            this._layouts.clear();
            this.events.clearAll();
            this._guideV?.remove();
            this._guideH?.remove();
            this._guideV = null;
            this._guideH = null;
            this._resizeObserver?.disconnect();
            this._resizeObserver = null;
            if (this._isolated) {
                this._container.classList.remove('wos-isolated');
            }
        }
        // ─────────────────────────────────────────
        // Private helpers
        // ─────────────────────────────────────────
        /** 延遲建立 snap guide 元素（僅需要時才建立） */
        _ensureGuides() {
            if (this._guideV)
                return;
            this._guideV = document.createElement('div');
            this._guideV.className = 'wos-snap-guide wos-snap-guide--v';
            this._guideH = document.createElement('div');
            this._guideH.className = 'wos-snap-guide wos-snap-guide--h';
            this._container.appendChild(this._guideV);
            this._container.appendChild(this._guideH);
        }
        /** 根據 SnapResult 顯示 / 隱藏 guide 線 */
        _updateSnapGuides(guides) {
            this._ensureGuides();
            const vGuide = guides.find(g => g.axis === 'v');
            const hGuide = guides.find(g => g.axis === 'h');
            if (this._guideV) {
                if (vGuide !== undefined) {
                    this._guideV.style.left = `${vGuide.pos}px`;
                    this._guideV.style.display = 'block';
                }
                else {
                    this._guideV.style.display = 'none';
                }
            }
            if (this._guideH) {
                if (hGuide !== undefined) {
                    this._guideH.style.top = `${hGuide.pos}px`;
                    this._guideH.style.display = 'block';
                }
                else {
                    this._guideH.style.display = 'none';
                }
            }
        }
        /** 拖曳結束時隱藏所有 guide 線 */
        _hideSnapGuides() {
            if (this._guideV)
                this._guideV.style.display = 'none';
            if (this._guideH)
                this._guideH.style.display = 'none';
        }
        // ── Layout auto-detection ─────────────────────────────────
        /**
         * 偵測 content 是否包含 BorderLayout 或 Panel 宣告，並自動初始化。
         * - content 有 [data-region] 直接子元素 → BorderLayout（body 作為容器）
         * - content 本身有 data-panel 屬性 → Panel（body 作為容器）
         */
        _tryAutoLayout(id, content, body) {
            if (!(content instanceof HTMLElement))
                return;
            const hasRegions = Array.from(content.children).some(c => c.dataset.region !== undefined);
            if (hasRegions) {
                // Move [data-region] children from content into body, use body as layout container
                while (content.firstChild)
                    body.appendChild(content.firstChild);
                content.remove();
                body.classList.add('wos-has-layout');
                const layout = new BorderLayout({ container: body });
                this._layouts.set(id, layout);
                return;
            }
            if ('panel' in content.dataset) {
                // Move content's children into body, use body as Panel container
                const panelTitle = content.dataset.panelTitle ?? content.dataset.title ?? '';
                const panelCollapsible = 'collapsible' in content.dataset;
                const panelCollapsed = 'collapsed' in content.dataset;
                while (content.firstChild)
                    body.appendChild(content.firstChild);
                content.remove();
                body.classList.add('wos-has-layout');
                const panel = new Panel({
                    container: body,
                    title: panelTitle || undefined,
                    collapsible: panelCollapsible,
                    collapsed: panelCollapsed,
                });
                this._layouts.set(id, panel);
            }
        }
        _deactivateOthers(exceptId) {
            this._wins.forEach((win, id) => {
                if (id !== exceptId && win.state.isActive) {
                    win.state.isActive = false;
                    win.elements.root.classList.remove('wos-active');
                }
            });
        }
        _focusTopWindow() {
            let topId = null;
            let topZ = -1;
            this._wins.forEach((win, id) => {
                if (!win.state.isMinimized && win.state.zIndex > topZ) {
                    topZ = win.state.zIndex;
                    topId = id;
                }
            });
            if (topId !== null) {
                const win = this._wins.get(topId);
                win.state.isActive = false; // reset so focus() triggers
                this.focus(topId);
            }
        }
        /** 監聽容器尺寸變化，自動將視窗夾回可視範圍 */
        _setupResizeObserver() {
            if (typeof ResizeObserver === 'undefined')
                return;
            const target = this._isolated ? this._container : document.documentElement;
            this._resizeObserver = new ResizeObserver(() => this._clampAllWindows());
            this._resizeObserver.observe(target);
        }
        /** 將所有非最大化、非最小化視窗的位置夾回容器範圍 */
        _clampAllWindows() {
            const cw = this._isolated ? this._container.offsetWidth : window.innerWidth;
            const ch = this._isolated ? this._container.offsetHeight : window.innerHeight;
            if (!cw || !ch)
                return;
            const MIN_VISIBLE = 80; // 至少保留這麼多 px 在畫面內
            this._wins.forEach(win => {
                if (win.state.isMinimized || win.state.isMaximized)
                    return;
                const newX = Math.max(0, Math.min(win.state.x, cw - MIN_VISIBLE));
                const newY = Math.max(0, Math.min(win.state.y, ch - MIN_VISIBLE));
                if (newX !== win.state.x || newY !== win.state.y) {
                    win.state.x = newX;
                    win.state.y = newY;
                    applyGeometry(win.elements.root, { x: newX, y: newY });
                }
            });
        }
    }

    // ============================================================
    // WebOS-Core — Theme Switcher
    // 動態切換主題 CSS 的工具函式
    // ============================================================
    /**
     * 動態切換 WebOS 主題。
     *
     * 第一次呼叫時，若頁面中不存在指定 id 的 `<link>` 元素，
     * 會自動建立一個並插入 `<head>`。
     *
     * @param preset  `'light'` 或 `'dark'`
     * @param options 選填設定（basePath / linkId）
     *
     * @example
     * // ESM
     * import { setTheme } from 'webos-core';
     * setTheme('dark');
     *
     * // UMD
     * WebOS.setTheme('dark');
     *
     * // 自訂路徑（例如主題放在 /assets/themes/）
     * setTheme('dark', { basePath: '/assets/themes' });
     */
    function setTheme(preset, options = {}) {
        const { basePath = 'themes', linkId = 'wos-theme' } = options;
        const href = `${basePath}/${preset}.css`;
        let link = document.getElementById(linkId);
        if (!link) {
            link = document.createElement('link');
            link.id = linkId;
            link.rel = 'stylesheet';
            document.head.appendChild(link);
        }
        if (link.getAttribute('href') !== href) {
            link.href = href;
        }
    }

    exports.BorderLayout = BorderLayout;
    exports.EventBus = EventBus;
    exports.Panel = Panel;
    exports.WindowManager = WindowManager;
    exports.eventBus = eventBus;
    exports.setTheme = setTheme;
    exports.snapPosition = snapPosition;

}));
//# sourceMappingURL=webos-core.umd.js.map
