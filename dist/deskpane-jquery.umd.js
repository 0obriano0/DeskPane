(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.DeskPaneJQuery = {}));
})(this, (function (exports) { 'use strict';

    // ============================================================
    // DeskPane — Global Event Bus
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

    // ============================================================
    // DeskPane — Drag & Resize Handler
    // 支援滑鼠與觸控，內建 Throttle 確保巨量表格不卡頓
    // ============================================================
    /**
     * 簡易節流。
     * 這裡不用 requestAnimationFrame，因為呼叫端可能希望固定節流間隔；
     * 預設 16ms 約等於 60fps，對大型內容視窗比較穩。
     */
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
            this._dragStartX = 0;
            this._dragStartY = 0;
            this._lastDragX = 0;
            this._lastDragY = 0;
            this._maximizedDragRestored = false;
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
                resizeSnapFn: opts.resizeSnapFn,
                resizable: opts.resizable ?? true,
                dragEdgeMargin: opts.dragEdgeMargin ?? 60,
                maximizedDragRestoreThreshold: opts.maximizedDragRestoreThreshold ?? 12,
                isMaximized: opts.isMaximized,
                onMaximizedDragRestore: opts.onMaximizedDragRestore,
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
            if (e.target.closest('.dp-btn'))
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
            this._dragStartX = clientX;
            this._dragStartY = clientY;
            this._lastDragX = 0;
            this._lastDragY = 0;
            this._maximizedDragRestored = false;
            this._winEl.style.userSelect = 'none';
            this._opts.onDragStart();
        }
        _onWinMouseDown(e) {
            if (!this._opts.resizable)
                return;
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
                if (!this._maximizedDragRestored
                    && this._opts.isMaximized?.()
                    && this._opts.onMaximizedDragRestore) {
                    const dx = e.clientX - this._dragStartX;
                    const dy = e.clientY - this._dragStartY;
                    const distance = Math.hypot(dx, dy);
                    if (distance >= this._opts.maximizedDragRestoreThreshold) {
                        const rect = this._winEl.getBoundingClientRect();
                        const ratioX = rect.width > 0
                            ? Math.max(0, Math.min(1, (this._dragStartX - rect.left) / rect.width))
                            : 0.5;
                        const restored = this._opts.onMaximizedDragRestore(e.clientX, e.clientY, ratioX, this._dragOffY);
                        if (restored) {
                            const { left, top } = this._getContainerRect();
                            this._dragOffX = e.clientX - left - restored.x;
                            this._dragOffY = e.clientY - top - restored.y;
                            this._maximizedDragRestored = true;
                        }
                    }
                }
                const { left, top } = this._getContainerRect();
                // clientX/Y 是 viewport 座標；isolated 模式下需轉成 container 內部座標。
                let x = e.clientX - this._dragOffX - left;
                let y = e.clientY - this._dragOffY - top;
                if (this._opts.snapFn) {
                    const pointerX = e.clientX - left;
                    const pointerY = e.clientY - top;
                    const snapped = this._opts.snapFn(x, y, this._winEl.offsetWidth, this._winEl.offsetHeight, pointerX, pointerY);
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
                    const dockTop = parseFloat(cs.getPropertyValue('--dp-dock-inset-top')) || 0;
                    const dockRight = parseFloat(cs.getPropertyValue('--dp-dock-inset-right')) || 0;
                    const dockBottom = parseFloat(cs.getPropertyValue('--dp-dock-inset-bottom')) || 0;
                    const dockLeft = parseFloat(cs.getPropertyValue('--dp-dock-inset-left')) || 0;
                    // 各方向邊界 = 使用者設定的 margin + Dock 佔用空間。
                    // Dock inset 由 Desktop 透過 CSS 變數同步，避免 DragResizeHandler 直接依賴 Desktop。
                    const bTop = dockTop; // 頂部：不允許標題列超出（含 top-dock）
                    const bRight = margin + dockRight;
                    const bBottom = margin + dockBottom; // 底部加上 Dock 高度，視窗不沉入 Dock
                    const bLeft = margin + dockLeft;
                    x = Math.max(bLeft - winW, Math.min(x, cW - bRight));
                    y = Math.max(bTop, Math.min(y, cH - bBottom));
                }
                this._winEl.style.left = `${x}px`;
                this._winEl.style.top = `${y}px`;
                this._lastDragX = x;
                this._lastDragY = y;
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
                const dockTop = parseFloat(cs.getPropertyValue('--dp-dock-inset-top')) || 0;
                const dockRight = parseFloat(cs.getPropertyValue('--dp-dock-inset-right')) || 0;
                const dockBottom = parseFloat(cs.getPropertyValue('--dp-dock-inset-bottom')) || 0;
                const dockLeft = parseFloat(cs.getPropertyValue('--dp-dock-inset-left')) || 0;
                const bTop = dockTop;
                const bRight = margin + dockRight;
                const bBottom = margin + dockBottom;
                const bLeft = margin + dockLeft;
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
        _handleUp() {
            // mouseup/touchend 可能在視窗外觸發；所有全域 listener 都在這裡收掉。
            if (this._dragging) {
                this._dragging = false;
                this._winEl.style.userSelect = '';
                this._opts.onDragEnd(this._lastDragX, this._lastDragY);
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
            if (e.target.closest('.dp-header'))
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
            if (!this._opts.resizable) {
                this._winEl.style.cursor = 'default';
                return;
            }
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

    var BASE_CSS = "/* ============================================================\r\n * DeskPane — Default Styles\r\n * Version: 0.1.0\r\n *\r\n * Copy this file to your project and link it with:\r\n *   <link rel=\"stylesheet\" href=\"deskpane.css\">\r\n *\r\n * When using injectStyles: false option, these styles will\r\n * NOT be injected automatically — this file is your starting\r\n * point for customization.\r\n *\r\n * All values use CSS custom properties (--dp-*) so you can\r\n * override them in :root without touching this file.\r\n * ============================================================ */\r\n\r\n.dp-window {\r\n  position: fixed;\r\n  box-sizing: border-box;\r\n  display: flex;\r\n  flex-direction: column;\r\n  border: 4px solid var(--dp-window-border, #d0d0d0);\r\n  border-radius: 6px;\r\n  box-shadow: var(--dp-window-shadow, 0 4px 24px rgba(0,0,0,0.18));\r\n  background: var(--dp-window-bg, var(--dp-window-body-bg, #ffffff));\n  overflow: hidden;\r\n  min-width: 200px;\r\n  min-height: 120px;\r\n  transition: box-shadow 0.15s, border-color 0.15s;\r\n  pointer-events: auto;\r\n}\r\n.dp-window.dp-active {\r\n  border-color: var(--dp-window-border-active, #b0b8c8);\r\n  box-shadow: var(--dp-window-shadow-active, 0 8px 36px rgba(0,0,0,0.28));\r\n}\r\n.dp-window.dp-minimized {\r\n  display: none !important;\r\n}\r\n.dp-window.dp-maximized {\r\n  left: 72px !important;\r\n  top: 0 !important;\r\n  width: calc(100vw - 72px) !important;\r\n  height: calc(100vh - 48px) !important;\r\n  border-radius: 0;\r\n  border-width: 0;\r\n}\r\n\r\n/* ── Isolated container mode ──────────────────────────── */\r\n.dp-isolated {\r\n  position: relative;\r\n  overflow: clip;\r\n}\r\n.dp-isolated .dp-window {\r\n  position: absolute;\r\n}\r\n.dp-isolated .dp-window.dp-maximized {\r\n  left:   var(--dp-dock-inset-left,   0px) !important;\r\n  top:    var(--dp-dock-inset-top,    0px) !important;\r\n  width:  calc(100% - var(--dp-dock-inset-left, 0px) - var(--dp-dock-inset-right,  0px)) !important;\r\n  height: calc(100% - var(--dp-dock-inset-top,  0px) - var(--dp-dock-inset-bottom, 0px)) !important;\r\n  border-radius: 0;\r\n}\r\n\r\n/* ── Header ───────────────────────────────────────────── */\r\n.dp-header {\r\n  display: flex;\r\n  align-items: center;\r\n  padding: 0 8px;\r\n  height: 36px;\r\n  background: var(--dp-window-header-bg, #f5f5f5);\r\n  border-bottom: 1px solid var(--dp-window-header-border, #e0e0e0);\r\n  cursor: move;\r\n  user-select: none;\r\n  flex-shrink: 0;\r\n}\r\n.dp-title {\r\n  flex: 1;\r\n  font-size: 13px;\r\n  font-weight: 600;\r\n  color: var(--dp-window-title-color, #333333);\r\n  overflow: hidden;\r\n  white-space: nowrap;\r\n  text-overflow: ellipsis;\r\n}\r\n\r\n/* ── Control buttons ──────────────────────────────────── */\r\n.dp-btn {\r\n  width: 24px;\r\n  height: 24px;\r\n  border: none;\r\n  border-radius: 4px;\r\n  background: transparent;\r\n  cursor: pointer;\r\n  display: flex;\r\n  align-items: center;\r\n  justify-content: center;\r\n  font-size: 14px;\r\n  color: var(--dp-window-btn-color, #555555);\r\n  margin-left: 2px;\r\n  transition: background 0.1s;\r\n}\r\n.dp-btn:hover { background: var(--dp-window-btn-hover-bg, #e0e0e0); }\r\n.dp-btn.dp-btn-close:hover {\r\n  background: var(--dp-window-btn-close-hover-bg, #ff5f57);\r\n  color: var(--dp-window-btn-close-hover-color, #ffffff);\r\n}\r\n.dp-btn:disabled {\r\n  opacity: 0.3;\r\n  cursor: not-allowed;\r\n}\r\n.dp-btn:disabled:hover { background: transparent; }\r\n\r\n/* ── Body ─────────────────────────────────────────────── */\r\n.dp-body {\n  flex: 1;\n  min-height: 0;\n  overflow: auto;\n  position: relative;\r\n  background: var(--dp-window-body-bg, #ffffff);\r\n  color: var(--dp-window-body-color, #222222);\r\n}\r\n.dp-body.dp-has-layout {\r\n  overflow: hidden;\r\n}\r\n\r\n/* ── Snap guide lines ─────────────────────────────────── */\r\n.dp-snap-guide {\r\n  position: absolute;\r\n  pointer-events: none;\r\n  z-index: 2147483647;\r\n  display: none;\r\n  background: var(--dp-snap-guide-color, rgba(0, 120, 255, 0.55));\r\n}\r\n.dp-snap-guide--v {\r\n  width: 1px;\r\n  top: 0;\r\n  bottom: 0;\r\n}\r\n.dp-snap-guide--h {\n  height: 1px;\n  left: 0;\n  right: 0;\n}\n\n/* ── Windows-like edge snap preview ───────────────────── */\n.dp-edge-snap-preview {\n  position: absolute;\n  pointer-events: none;\n  z-index: 8998;\n  display: block;\n  opacity: 0;\n  border: 2px solid var(--dp-edge-snap-preview-border, rgba(0, 120, 255, 0.72));\n  background: var(--dp-edge-snap-preview-bg, rgba(0, 120, 255, 0.16));\n  box-shadow: inset 0 0 0 1px var(--dp-edge-snap-preview-inner-border, rgba(255, 255, 255, 0.35));\n  border-radius: var(--dp-edge-snap-preview-radius, 8px);\n  transform: scale(0.985);\n  transition:\n    opacity 120ms ease,\n    transform 120ms ease,\n    left 90ms ease,\n    top 90ms ease,\n    width 90ms ease,\n    height 90ms ease;\n}\n.dp-edge-snap-preview--visible {\n  opacity: 1;\n  transform: scale(1);\n}\n\n/* ── Child Window ─────────────────────────────────────── */\n/* 子視窗標題列加左側色條，與父視窗做視覺區隔 */\r\n.dp-child-window > .dp-header {\r\n  padding-left: 10px;\r\n}\r\n.dp-child-window > .dp-header::before {\r\n  content: '';\r\n  display: inline-block;\r\n  width: 3px;\r\n  height: 16px;\r\n  border-radius: 2px;\r\n  background: var(--dp-window-border-active, #b0b8c8);\r\n  margin-right: 6px;\r\n  flex-shrink: 0;\r\n  opacity: 0.7;\r\n}\r\n\r\n/* ── Modal Overlay ────────────────────────────────────── */\r\n/* 覆蓋整個父視窗，阻止互動；pointer-events:all 攔截所有點擊 */\r\n.dp-modal-overlay {\r\n  position: absolute;\r\n  inset: 0;\r\n  background: rgba(0, 0, 0, 0.30);\r\n  z-index: 9000;\r\n  cursor: not-allowed;\r\n  border-radius: 0 0 2px 2px; /* 對齊 body，不蓋到標題列圓角 */\r\n  pointer-events: all;\r\n  /* 淡入效果 */\r\n  animation: dp-overlay-in 0.15s ease;\r\n}\r\n@keyframes dp-overlay-in {\r\n  from { opacity: 0; }\r\n  to   { opacity: 1; }\r\n}\r\n\r\n/* ── Shake Animation ──────────────────────────────────── */\r\n/* 點擊遮罩時對應的 modal 子視窗抖動，提示使用者需先處理 */\r\n@keyframes dp-shake {\r\n  0%,  100% { transform: translateX(0); }\r\n  15%       { transform: translateX(-7px); }\r\n  30%       { transform: translateX(7px); }\r\n  45%       { transform: translateX(-5px); }\r\n  60%       { transform: translateX(5px); }\r\n  75%       { transform: translateX(-3px); }\r\n  90%       { transform: translateX(3px); }\r\n}\r\n.dp-shake {\r\n  animation: dp-shake 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;\r\n}\r\n";

    // ============================================================
    // DeskPane — Runtime CSS injection helpers
    // ============================================================
    function isDeskPaneStyleNode(node) {
        // DeskPane runtime style 都會加 data-dp-style；id fallback 是為了相容早期版本。
        if (node instanceof HTMLStyleElement) {
            if (node.dataset.dpStyle === 'true')
                return true;
            if (node.id.startsWith('dp-') && node.id.endsWith('-styles'))
                return true;
        }
        if (node instanceof HTMLLinkElement) {
            // 使用者可能手動 import/link DeskPane CSS。這些 link 也視為 DeskPane style，
            // 避免 runtime CSS 插在它們後面造成 override 順序反轉。
            const href = node.getAttribute('href') ?? '';
            return href.includes('/deskpane') || href.includes('\\deskpane') || href.includes('deskpane');
        }
        return false;
    }
    function hasManualStyleLoaded(options) {
        const hrefPart = options.hrefPart.toLowerCase();
        for (const node of Array.from(document.querySelectorAll('style,link[rel~="stylesheet"]'))) {
            if (node instanceof HTMLStyleElement) {
                // id/fingerprint 任一命中都代表已載入同一份 core CSS。
                // fingerprint 讓 bundler raw CSS 或 SSR inline style 也能被偵測。
                if (node.id === options.id)
                    return true;
                if (node.textContent?.includes(options.fingerprint))
                    return true;
                continue;
            }
            if (node instanceof HTMLLinkElement) {
                const href = (node.getAttribute('href') ?? '').toLowerCase();
                if (href.includes(hrefPart))
                    return true;
            }
        }
        return false;
    }
    function findInsertionAnchor() {
        const styleNodes = Array.from(document.head.querySelectorAll('style,link[rel~="stylesheet"]'));
        // 插在第一個非 DeskPane style 前，讓 app stylesheet 保持較高優先順序。
        // 這是避免 runtime inject 壓過使用者 override 的關鍵。
        return styleNodes.find(node => !isDeskPaneStyleNode(node)) ?? null;
    }
    /**
     * Injects DeskPane runtime CSS only when the same stylesheet is not already
     * present. Runtime CSS is inserted before app-level stylesheets so project
     * overrides imported later remain authoritative.
     */
    function injectRuntimeCSS(options) {
        if (hasManualStyleLoaded(options))
            return;
        const style = document.createElement('style');
        style.id = options.id;
        style.dataset.dpStyle = 'true';
        style.textContent = options.css;
        const anchor = findInsertionAnchor();
        document.head.insertBefore(style, anchor);
    }

    // ============================================================
    // DeskPane — DOM Window Renderer
    // 負責建立視窗外殼 DOM 節點、注入樣式
    // ============================================================
    const STYLE_ID$2 = 'dp-core-styles';
    function injectStyles() {
        injectRuntimeCSS({
            id: STYLE_ID$2,
            css: BASE_CSS,
            hrefPart: 'deskpane.css',
            fingerprint: 'DeskPane — Default Styles',
        });
    }
    /** 建立視窗外殼 DOM，回傳各主要元素參照 */
    function createWindowDOM(state) {
        const root = document.createElement('div');
        root.className = 'dp-window';
        if (state.parentId)
            root.classList.add('dp-child-window');
        root.dataset.dpId = state.id;
        if (state.parentId)
            root.dataset.dpParentId = state.parentId;
        applyGeometry(root, state);
        root.style.zIndex = String(state.zIndex);
        // ── Header ──
        const header = document.createElement('div');
        header.className = 'dp-header';
        const title = document.createElement('span');
        title.className = 'dp-title';
        title.textContent = state.title;
        const btnMin = createButton('－', 'dp-btn-min', '最小化');
        const btnMax = createButton('□', 'dp-btn-max', '最大化');
        const btnClose = createButton('✕', 'dp-btn-close', '關閉');
        if (!state.resizable) {
            btnMax.disabled = true;
            btnMax.title = '此視窗不可調整大小';
        }
        // 子視窗：隱藏最小化按鈕（符合 Windows 對話框習慣）
        if (state.parentId) {
            btnMin.style.display = 'none';
            btnMin.setAttribute('aria-hidden', 'true');
        }
        header.append(title, btnMin, btnMax, btnClose);
        // ── Body ──
        const body = document.createElement('div');
        body.className = 'dp-body';
        root.append(header, body);
        // 注入視窗內容（DOM 型別）
        if (state.slotType === 'dom' && state.content instanceof HTMLElement) {
            body.appendChild(state.content);
        }
        return { root, header, title, body, btnMin, btnMax, btnClose };
    }
    /**
     * 建立 Modal 遮罩層（覆蓋父視窗內容，不可操作）。
     * 需插入父視窗的 root 元素內。
     */
    function createModalOverlay() {
        const el = document.createElement('div');
        el.className = 'dp-modal-overlay';
        el.setAttribute('aria-hidden', 'true');
        return el;
    }
    function createButton(text, cls, ariaLabel) {
        const btn = document.createElement('button');
        btn.className = `dp-btn ${cls}`;
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
    // DeskPane — Snap Helper
    // 純計算模組：計算視窗拖曳時的吸附位置與 guide 線位置
    // ============================================================
    /**
     * 計算單軸的吸附結果。
     * nearTargets：近邊（left/top）匹配用目標。
     * farTargets ：遠邊（right/bottom）匹配用目標。
     */
    function snapAxis(pos, size, nearTargets, farTargets, threshold) {
        let bestDist = threshold;
        let snapped = pos;
        let guidePos = null;
        for (const t of nearTargets) {
            const d = Math.abs(pos - t);
            if (d < bestDist) {
                bestDist = d;
                snapped = t;
                guidePos = t;
            }
        }
        for (const t of farTargets) {
            const d = Math.abs(pos + size - t);
            if (d < bestDist) {
                bestDist = d;
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
     * @param gap           視窗與視窗之間的間距（px），預設 0；容器邊緣不套用
     */
    function snapPosition(drag, containerSize, others, threshold, gap = 0) {
        // 容器邊緣：不套用 gap
        const xNear = [0, containerSize.width];
        const xFar = [0, containerSize.width];
        const yNear = [0, containerSize.height];
        const yFar = [0, containerSize.height];
        for (const o of others) {
            // 近邊（drag.left / drag.top）對齊：
            //   同側對齊（left→left, top→top）：無間距
            //   跨側對齊（left 緊接 other.right）：+gap
            xNear.push(o.x, o.x + o.width + gap);
            yNear.push(o.y, o.y + o.height + gap);
            // 遠邊（drag.right / drag.bottom）對齊：
            //   跨側對齊（right 緊接 other.left）：-gap
            //   同側對齊（right→right）：無間距
            xFar.push(o.x - gap, o.x + o.width);
            yFar.push(o.y - gap, o.y + o.height);
        }
        const { snapped: snapX, guidePos: guideX } = snapAxis(drag.x, drag.width, xNear, xFar, threshold);
        const { snapped: snapY, guidePos: guideY } = snapAxis(drag.y, drag.height, yNear, yFar, threshold);
        const guides = [];
        if (guideX !== null)
            guides.push({ axis: 'v', pos: guideX });
        if (guideY !== null)
            guides.push({ axis: 'h', pos: guideY });
        return { x: snapX, y: snapY, guides };
    }
    /**
     * 找最近的吸附目標。
     */
    function nearestSnap(value, targets, threshold) {
        let best = threshold;
        let snapped = value;
        let guide = null;
        for (const t of targets) {
            const d = Math.abs(value - t);
            if (d < best) {
                best = d;
                snapped = t;
                guide = t;
            }
        }
        return { snapped, guide };
    }
    /**
     * 計算縮放視窗時的吸附結果。
     *
     * @param rect          縮放中視窗目前的位置與大小（容器相對座標）
     * @param edge          正在移動的邊：'n'|'s'|'e'|'w'|'ne'|'nw'|'se'|'sw'
     * @param containerSize 容器寬高
     * @param others        其他非最小化 / 非最大化視窗
     * @param threshold     吸附感應距離（px）
     * @param gap           視窗間距（px），預設 0；容器邊緣不套用
     */
    function snapResize(rect, edge, containerSize, others, threshold, gap = 0) {
        let { x, y, width, height } = rect;
        const guides = [];
        if (edge.includes('e')) {
            const right = x + width;
            const targets = [
                containerSize.width,
                ...others.flatMap(o => [o.x - gap, o.x + o.width]),
            ];
            const { snapped, guide } = nearestSnap(right, targets, threshold);
            width = Math.max(1, snapped - x);
            if (guide !== null)
                guides.push({ axis: 'v', pos: guide });
        }
        if (edge.includes('w')) {
            const left = x;
            const right = x + width;
            const targets = [
                0,
                ...others.flatMap(o => [o.x + o.width + gap, o.x]),
            ];
            const { snapped, guide } = nearestSnap(left, targets, threshold);
            x = snapped;
            width = Math.max(1, right - x);
            if (guide !== null)
                guides.push({ axis: 'v', pos: guide });
        }
        if (edge.includes('s')) {
            const bottom = y + height;
            const targets = [
                containerSize.height,
                ...others.flatMap(o => [o.y - gap, o.y + o.height]),
            ];
            const { snapped, guide } = nearestSnap(bottom, targets, threshold);
            height = Math.max(1, snapped - y);
            if (guide !== null)
                guides.push({ axis: 'h', pos: guide });
        }
        if (edge.includes('n')) {
            const top = y;
            const bottom = y + height;
            const targets = [
                0,
                ...others.flatMap(o => [o.y + o.height + gap, o.y]),
            ];
            const { snapped, guide } = nearestSnap(top, targets, threshold);
            y = snapped;
            height = Math.max(1, bottom - y);
            if (guide !== null)
                guides.push({ axis: 'h', pos: guide });
        }
        return { x, y, width, height, guides };
    }

    var LAYOUT_CSS = "/* ============================================================\r\n   DeskPane — Layout CSS (BorderLayout + Panel)\r\n   Single source of truth for dp-layout-* and dp-panel-* styles\r\n   ============================================================ */\r\n\r\n/* ── BorderLayout ────────────────────────────────────────── */\r\n\r\n.dp-layout {\r\n  position: relative;\r\n  overflow: hidden;\r\n  box-sizing: border-box;\r\n  width: 100%;\r\n  height: 100%;\r\n}\r\n.dp-layout-region {\r\n  position: absolute;\r\n  overflow: hidden;\r\n  box-sizing: border-box;\r\n}\r\n/* Region header (when data-title is set) */\r\n.dp-region-header {\r\n  display: flex;\r\n  align-items: center;\r\n  height: 28px;\r\n  padding: 0 0 0 8px;\r\n  background: var(--dp-layout-header-bg, #f5f5f5);\r\n  flex-shrink: 0;\r\n  user-select: none;\r\n  overflow: hidden;\r\n  box-sizing: border-box;\r\n}\r\n.dp-region-icon {\r\n  font-size: 13px;\r\n  margin-right: 5px;\r\n  flex-shrink: 0;\r\n  line-height: 1;\r\n}\r\n.dp-region-title {\r\n  flex: 1;\r\n  font-size: 12px;\r\n  font-weight: 600;\r\n  color: var(--dp-layout-title-color, #333);\r\n  white-space: nowrap;\r\n  overflow: hidden;\r\n  text-overflow: ellipsis;\r\n}\r\n/* Collapse button — lives in header right end (EasyUI style) */\r\n.dp-region-collapse-btn {\r\n  flex-shrink: 0;\r\n  width: 26px;\r\n  height: 28px;\r\n  border: none;\r\n  border-left: 1px solid var(--dp-layout-header-border, #e0e0e0);\r\n  background: var(--dp-layout-header-bg, #f5f5f5);\r\n  cursor: pointer;\r\n  font-size: 14px;\r\n  display: flex;\r\n  align-items: center;\r\n  justify-content: center;\r\n  color: var(--dp-layout-btn-color, #555);\r\n  transition: background 0.1s, color 0.1s;\r\n  z-index: 11;\r\n  line-height: 1;\r\n  margin-left: auto;\r\n  padding: 0;\r\n}\r\n.dp-region-collapse-btn:hover {\r\n  background: var(--dp-layout-btn-hover-bg, #d8e4f0);\r\n  color: var(--dp-layout-title-color, #333);\r\n}\r\n.dp-region-body {\r\n  position: absolute;\r\n  left: 0; right: 0; bottom: 0;\r\n  overflow: auto;\r\n  box-sizing: border-box;\r\n}\r\n/* ── Collapsed strip ───────────────────────────────────────── */\r\n.dp-layout-region--collapsed .dp-region-body {\r\n  display: none;\r\n}\r\n/* East/West collapsed: header fills the full vertical strip */\r\n.dp-layout-region--collapsed.dp-layout-region--west > .dp-region-header,\r\n.dp-layout-region--collapsed.dp-layout-region--east > .dp-region-header {\r\n  position: absolute;\r\n  top: 0; left: 0; right: 0; bottom: 0;\r\n  height: auto;\r\n  flex-direction: column;\r\n  align-items: center;\r\n  padding: 0;\r\n  border-bottom: none;\r\n  overflow: hidden;\r\n}\r\n/* Collapse btn → top, full-width, larger */\r\n.dp-layout-region--collapsed.dp-layout-region--west .dp-region-collapse-btn,\r\n.dp-layout-region--collapsed.dp-layout-region--east .dp-region-collapse-btn {\r\n  order: 0;\r\n  width: 100%;\r\n  height: 28px;\r\n  font-size: 14px;\r\n  border-left: none;\r\n  border-bottom: 1px solid var(--dp-layout-header-border, #e0e0e0);\r\n  margin-left: 0;\r\n  flex-shrink: 0;\r\n}\r\n/* Icon → below button */\r\n.dp-layout-region--collapsed.dp-layout-region--west .dp-region-icon,\r\n.dp-layout-region--collapsed.dp-layout-region--east .dp-region-icon {\r\n  order: 1;\r\n  margin-right: 0;\r\n  margin-top: 8px;\r\n  font-size: 15px;\r\n}\r\n/* Title → below icon, rotated */\r\n.dp-layout-region--collapsed.dp-layout-region--west .dp-region-title,\r\n.dp-layout-region--collapsed.dp-layout-region--east .dp-region-title {\r\n  order: 2;\r\n  writing-mode: vertical-lr;\r\n  flex: 1;\r\n  margin: 6px 0 4px;\r\n  min-height: 0;\r\n  text-overflow: ellipsis;\r\n  font-size: 12px;\r\n}\r\n/* Splitters */\r\n.dp-layout-splitter {\r\n  position: absolute;\r\n  background: var(--dp-layout-splitter-bg, #d0d0d0);\r\n  box-sizing: border-box;\r\n  z-index: 10;\r\n  user-select: none;\r\n  transition: background 0.1s;\r\n}\r\n.dp-layout-splitter:hover,\r\n.dp-layout-splitter.dp-splitter-dragging {\r\n  background: var(--dp-layout-splitter-active, #b0b8c8);\r\n}\r\n.dp-layout-splitter--v {\r\n  cursor: col-resize;\r\n}\r\n.dp-layout-splitter--h {\r\n  cursor: row-resize;\r\n}\r\n\r\n/* ── Panel ──────────────────────────────────────────────────── */\r\n\r\n.dp-panel {\r\n  display: flex;\r\n  flex-direction: column;\r\n  overflow: hidden;\r\n  box-sizing: border-box;\r\n  width: 100%;\r\n  height: 100%;\r\n}\r\n.dp-panel-header {\r\n  display: flex;\r\n  align-items: center;\r\n  height: 30px;\r\n  min-height: 30px;\r\n  padding: 0 8px;\r\n  background: var(--dp-layout-header-bg, #f5f5f5);\r\n  border-bottom: 1px solid var(--dp-layout-header-border, #e0e0e0);\r\n  user-select: none;\r\n  flex-shrink: 0;\r\n  cursor: default;\r\n}\r\n.dp-panel-title {\r\n  flex: 1;\r\n  font-size: 12px;\r\n  font-weight: 600;\r\n  color: var(--dp-layout-title-color, #333);\r\n  white-space: nowrap;\r\n  overflow: hidden;\r\n  text-overflow: ellipsis;\r\n}\r\n.dp-panel-toggle {\r\n  width: 20px;\r\n  height: 20px;\r\n  border-radius: 3px;\r\n  background: transparent;\r\n  border: 1px solid transparent;\r\n  cursor: pointer;\r\n  font-size: 9px;\r\n  display: flex;\r\n  align-items: center;\r\n  justify-content: center;\r\n  color: var(--dp-layout-btn-color, #555);\r\n  flex-shrink: 0;\r\n  transition: background 0.1s;\r\n  line-height: 1;\r\n}\r\n.dp-panel-toggle:hover {\r\n  background: var(--dp-layout-btn-hover-bg, #e0e0e0);\r\n  border-color: var(--dp-layout-splitter-bg, #d0d0d0);\r\n}\r\n.dp-panel-body {\r\n  flex: 1;\r\n  overflow: auto;\r\n  box-sizing: border-box;\r\n  transition: max-height 0.2s ease;\r\n}\r\n.dp-panel-body.dp-panel-collapsed {\r\n  max-height: 0 !important;\r\n  overflow: hidden;\r\n}\r\n";

    // ============================================================
    // DeskPane — Layout CSS Injection
    // ============================================================
    const STYLE_ID$1 = 'dp-layout-styles';
    function injectLayoutStyles() {
        if (document.getElementById(STYLE_ID$1))
            return;
        const style = document.createElement('style');
        style.id = STYLE_ID$1;
        style.textContent = LAYOUT_CSS;
        document.head.appendChild(style);
    }

    // ============================================================
    // DeskPane — Border Layout Manager
    // EasyUI 風格東南西北+中間佈局，支援：
    //   • HTML data-region 宣告式初始化
    //   • 任意層巢狀（region 內再放 data-region）
    //   • Splitter 拖曳 resize
    //   • 可折疊面板（折疊按鈕在 header 右端，EasyUI 風格）
    //   • Region 標題列（data-title）+ 圖示（data-icon）
    //   • ResizeObserver 自動重排
    // ============================================================
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
                el.className = `dp-layout-region dp-layout-region--${name}`;
                el.dataset.dpRegion = name;
                // Optional region header
                const hasHeader = !!merged.title;
                let headerEl = null;
                if (hasHeader) {
                    headerEl = document.createElement('div');
                    headerEl.className = 'dp-region-header';
                    // Optional icon
                    if (merged.icon) {
                        const iconSpan = document.createElement('span');
                        iconSpan.className = 'dp-region-icon';
                        iconSpan.textContent = merged.icon;
                        headerEl.appendChild(iconSpan);
                    }
                    // Title
                    const ttl = document.createElement('span');
                    ttl.className = 'dp-region-title';
                    ttl.textContent = merged.title;
                    headerEl.appendChild(ttl);
                    // Collapse button (right end of header)
                    if (merged.collapsible) {
                        const btn = document.createElement('button');
                        btn.className = 'dp-region-collapse-btn';
                        btn.dataset.dpCollapseFor = name;
                        btn.setAttribute('aria-label', `切換 ${name} 面板`);
                        btn.textContent = this._collapseIcon(name, merged.collapsed ?? false);
                        headerEl.appendChild(btn);
                    }
                    el.appendChild(headerEl);
                }
                // Body (scrollable inner)
                const bodyEl = document.createElement('div');
                bodyEl.className = 'dp-region-body';
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
                    el.classList.add('dp-layout-region--collapsed');
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
            this.container.classList.add('dp-layout');
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
                sp.className = `dp-layout-splitter dp-layout-splitter--${isV ? 'v' : 'h'}`;
                sp.dataset.dpSplitter = name;
                this.splitterEls.set(name, sp);
                this.container.appendChild(sp);
            }
        }
        // ── Compute & apply all positions ─────────────────────────
        _applyLayout() {
            const W = this.container.clientWidth;
            const H = this.container.clientHeight;
            const sp = this.splitterSize;
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
                    if (e.target.closest('.dp-region-collapse-btn'))
                        return;
                    this._startDrag(e, name);
                };
                spEl.addEventListener('mousedown', onDown);
                this.cleanups.push(() => spEl.removeEventListener('mousedown', onDown));
            }
            // Collapse buttons — delegated on container (button lives in region header)
            const onCollapseClick = (e) => {
                const btn = e.target.closest('[data-dp-collapse-for]');
                if (!btn)
                    return;
                this.toggleCollapse(btn.dataset.dpCollapseFor);
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
            spEl.classList.add('dp-splitter-dragging');
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
                spEl.classList.remove('dp-splitter-dragging');
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
            state.el.classList.toggle('dp-layout-region--collapsed', state.collapsed);
            if (!state.collapsed && state.size < state.minSize) {
                state.size = state.savedSize > 0 ? state.savedSize : REGION_DEFAULTS[name].size;
            }
            // Update button icon — button lives in headerEl
            const btn = state.headerEl?.querySelector('[data-dp-collapse-for]');
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
            this.container.classList.remove('dp-layout');
        }
    }

    // ============================================================
    // DeskPane — Panel Component
    // 為任意元素加上可折疊的標題列（EasyUI panel 風格）
    // 支援：
    //   • data-panel 宣告式自動初始化
    //   • JS-first: new Panel({ container, title, collapsible })
    //   • 折疊 / 展開（動畫 height）
    // ============================================================
    class Panel {
        constructor(options) {
            this.headerEl = null;
            this.toggleBtn = null;
            this.cleanups = [];
            injectLayoutStyles();
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
            this.container.classList.add('dp-panel');
            // Header (always shown when title provided; or when collapsible)
            const hasHeader = !!options.title || this._collapsible;
            if (hasHeader) {
                const hdr = document.createElement('div');
                hdr.className = 'dp-panel-header';
                const ttl = document.createElement('span');
                ttl.className = 'dp-panel-title';
                ttl.textContent = options.title ?? '';
                hdr.appendChild(ttl);
                if (this._collapsible) {
                    const btn = document.createElement('button');
                    btn.className = 'dp-panel-toggle';
                    btn.setAttribute('aria-label', '切換面板');
                    btn.textContent = this._collapsed ? '▶' : '▼';
                    hdr.appendChild(btn);
                    this.toggleBtn = btn;
                    const onToggle = () => this.toggle();
                    btn.addEventListener('click', onToggle);
                    // Also allow clicking title to toggle
                    hdr.style.cursor = 'pointer';
                    hdr.addEventListener('click', (e) => {
                        if (e.target.closest('.dp-panel-toggle'))
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
            body.className = 'dp-panel-body';
            // Restore original children
            children.forEach(c => body.appendChild(c));
            if (this._collapsed) {
                body.classList.add('dp-panel-collapsed');
            }
            this.container.appendChild(body);
            this.bodyEl = body;
        }
        // ── Public API ─────────────────────────────────────────────
        get collapsed() { return this._collapsed; }
        toggle() {
            this._collapsed = !this._collapsed;
            this.bodyEl.classList.toggle('dp-panel-collapsed', this._collapsed);
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
            const ttl = this.headerEl?.querySelector('.dp-panel-title');
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
            this.container.classList.remove('dp-panel');
        }
    }

    // ============================================================
    // DeskPane — WindowManager
    // 核心大腦：管理所有視窗的生命週期與狀態
    // ============================================================
    const DEFAULT_WIDTH = 640;
    const DEFAULT_HEIGHT = 480;
    const BASE_Z = 100;
    /** 視窗 z-index 上限；超過時自動正規化，確保低於 Dock/Toolbar（預設 9999） */
    const MAX_Z = 8999;
    const CASCADE_OFFSET = 30;
    class WindowManager {
        constructor(opts = {}) {
            this._wins = new Map();
            this._zCounter = BASE_Z;
            this._cascadeCount = 0;
            this._guideV = null;
            this._guideH = null;
            this._edgeSnapPreviewEl = null;
            this._activeEdgeSnap = null;
            /** 追蹤自動建立的 BorderLayout / Panel 實例，視窗關閉時 destroy */
            this._layouts = new Map();
            /** 父視窗 → 子視窗 ID Set（一對多） */
            this._children = new Map();
            /** Modal 子視窗 → 它在父視窗上的遮罩 DOM 元素 */
            this._modalOverlays = new Map();
            this._resizeObserver = null;
            this._container = opts.container ?? document.body;
            this._throttleMs = opts.throttleMs ?? 16;
            this._isolated = opts.isolated ?? false;
            this._snapEnabled = opts.snap ?? true;
            this._snapThreshold = opts.snapThreshold ?? 20;
            this._snapGap = opts.snapGap ?? 0;
            this._edgeSnapEnabled = this._snapEnabled && (opts.edgeSnap ?? true);
            this._edgeSnapThreshold = opts.edgeSnapThreshold ?? this._snapThreshold;
            this._maximizedDragRestoreThreshold = opts.maximizedDragRestoreThreshold ?? 12;
            this.events = new EventBus();
            if (opts.injectStyles !== false)
                injectStyles();
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
         *
         * 維護注意：
         * - `WindowState` 是內部可變狀態；事件一律 emit 淺拷貝，避免外部改到內部。
         * - `parentId/modal` 必須在 DOM 建立後才掛 overlay，因為 overlay 掛在父視窗 root。
         * - `content` 可能是使用者的 HTMLElement，也可能被 layout auto-detect 移動子節點。
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
            // 子視窗：z-index 必須高於父視窗；否則 modal overlay 或子視窗會被父視窗蓋住。
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
            const dragResize = new DragResizeHandler(elements.root, elements.header, {
                throttleMs: this._throttleMs,
                resizable: state.resizable,
                containerEl: this._isolated ? this._container : undefined,
                snapFn: this._snapEnabled ? this._buildSnapFn(state.id) : undefined,
                resizeSnapFn: this._snapEnabled ? this._buildResizeSnapFn(state.id) : undefined,
                maximizedDragRestoreThreshold: this._maximizedDragRestoreThreshold,
                isMaximized: () => state.isMaximized,
                onMaximizedDragRestore: (clientX, clientY, ratioX, offsetY) => this._restoreMaximizedForDrag(state.id, clientX, clientY, ratioX, offsetY),
                onDragStart: () => {
                    this.events.emit('window:drag-start', { ...state });
                },
                onDrag: (x, y) => {
                    state.x = x;
                    state.y = y;
                    this.events.emit('window:moved', { ...state });
                },
                onDragEnd: () => {
                    this._applyEdgeSnap(state.id);
                    this._hideSnapGuides();
                    this._hideEdgeSnapPreview();
                    this.events.emit('window:drag-end', { ...state });
                },
                onResizeStart: () => {
                    this.events.emit('window:resize-start', { ...state });
                },
                onResize: (x, y, w, h) => {
                    state.x = x;
                    state.y = y;
                    state.width = w;
                    state.height = h;
                    this.events.emit('window:resized', { ...state });
                },
                onResizeEnd: () => {
                    this._hideSnapGuides();
                    this.events.emit('window:resize-end', { ...state });
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
            // 建立父子關係。這份 map 是 Dock 群組預覽、modal 阻擋、cascade close 的共同來源。
            if (state.parentId) {
                if (!this._children.has(state.parentId)) {
                    this._children.set(state.parentId, new Set());
                }
                this._children.get(state.parentId).add(state.id);
                // Modal：在父視窗插入遮罩層
                if (state.modal) {
                    this._attachModalOverlay(state.parentId, state.id);
                }
                this.events.emit('window:child-opened', { parentId: state.parentId, childId: state.id });
            }
            this._deactivateOthers(state.id);
            elements.root.classList.add('dp-active');
            this.events.emit('window:opened', { ...state });
            return state;
        }
        /**
         * 關閉並銷毀視窗
         *
         * 關閉父視窗時會遞迴關閉子視窗；關閉子視窗時只解除父子關係與 modal overlay。
         * 順序很重要：先移除目前視窗，再 cascade 子視窗，可避免 child close 再次碰到已移除的父 DOM。
         */
        close(id) {
            const win = this._wins.get(id);
            if (!win)
                return;
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
                    if (siblings.size === 0)
                        this._children.delete(parentId);
                }
                // 移除此子視窗對應的 modal overlay
                this._detachModalOverlay(id);
                this.events.emit('window:child-closed', { parentId, childId: id });
            }
            // 如果這個視窗有子視窗，一併關閉（深度優先）
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
        _normalizeZ() {
            if (this._zCounter < MAX_Z)
                return;
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
         *
         * 子視窗有兩個特殊規則：
         * - 聚焦父視窗時，所有子視窗一起置頂，保持「子永遠高於父」。
         * - 聚焦子視窗時，父視窗也要接近頂層，但 z-index 仍低於子視窗。
         */
        focus(id) {
            const win = this._wins.get(id);
            if (!win || win.state.isActive)
                return;
            this._normalizeZ();
            this._deactivateOthers(id);
            win.state.zIndex = ++this._zCounter;
            win.state.isActive = true;
            win.elements.root.style.zIndex = String(win.state.zIndex);
            win.elements.root.classList.add('dp-active');
            if (win.state.isMinimized)
                this.restore(id);
            // 將此視窗的所有子視窗一起置頂（子視窗必須高於父視窗）
            const children = this._children.get(id);
            if (children && children.size > 0) {
                [...children].forEach(childId => {
                    const child = this._wins.get(childId);
                    if (!child)
                        return;
                    child.state.zIndex = ++this._zCounter;
                    child.elements.root.style.zIndex = String(child.state.zIndex);
                    // 子視窗也要一起顯示（若已最小化）
                    if (child.state.isMinimized) {
                        child.state.isMinimized = false;
                        child.elements.root.classList.remove('dp-minimized');
                    }
                });
            }
            // 如果此視窗是子視窗，同時帶起父視窗（父視窗 z-index 仍低於子）
            if (win.state.parentId) {
                const parent = this._wins.get(win.state.parentId);
                if (parent && !parent.state.isActive) {
                    const childZ = win.state.zIndex;
                    // 父視窗置於子視窗之後提升，但不超過子視窗
                    parent.state.zIndex = childZ - 1;
                    parent.elements.root.style.zIndex = String(parent.state.zIndex);
                }
            }
            this.events.emit('window:focused', { ...win.state });
        }
        /**
         * Re-emit focus for the topmost visible window.
         * Useful when a preserved workspace becomes active again and its previous
         * active window needs to resync dock/focus state.
         */
        activateTopWindow() {
            this._focusTopWindow();
        }
        /**
         * 最小化（隱藏 DOM，保留狀態）
         *
         * 注意：minimize 會清掉 isActive。這讓使用者點 Dock restore 時，
         * focus() 不會因為「已 active」而提早返回。
         */
        minimize(id) {
            const win = this._wins.get(id);
            if (!win || win.state.isMinimized)
                return;
            win.state.isMinimized = true;
            win.state.isActive = false;
            win.elements.root.classList.add('dp-minimized');
            win.elements.root.classList.remove('dp-active');
            this.events.emit('window:minimized', { ...win.state });
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
         *
         * 最大化不直接寫入 left/top/width/height，而是交給 CSS class `dp-maximized`。
         * 原始幾何存在 `_savedGeometry`，讓 restore 可以回到最大化前的位置與大小。
         */
        maximize(id) {
            const win = this._wins.get(id);
            if (!win || !win.state.resizable)
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
            win.elements.root.classList.remove('dp-minimized');
            win.elements.root.classList.add('dp-maximized');
            win.elements.btnMax.textContent = '❐';
            win.elements.btnMax.setAttribute('aria-label', '還原');
            this.focus(id);
            this.events.emit('window:maximized', { ...win.state });
        }
        /**
         * 從「最大化標題列拖曳」解除最大化。
         *
         * Windows-like 行為重點：
         * - 用滑鼠在最大化視窗寬度中的比例 ratioX，換算還原後視窗的 x。
         * - y 則保留滑鼠在標題列內的 offset，讓拖曳不跳手。
         * - 移除 dp-maximized 後立即 applyGeometry，DragResizeHandler 同一輪 move 會接著更新位置。
         */
        _restoreMaximizedForDrag(id, clientX, clientY, ratioX, offsetY) {
            const win = this._wins.get(id);
            if (!win || !win.state.isMaximized || !win.state.resizable)
                return null;
            const saved = win.state._savedGeometry ?? {
                x: win.state.x,
                y: win.state.y,
                width: win.state.width,
                height: win.state.height,
            };
            const containerRect = this._isolated
                ? this._container.getBoundingClientRect()
                : { left: 0, top: 0 };
            const cw = this._isolated ? this._container.offsetWidth : window.innerWidth;
            const ch = this._isolated ? this._container.offsetHeight : window.innerHeight;
            const minVisible = 80;
            const width = cw > 0 ? Math.min(saved.width, cw) : saved.width;
            const height = ch > 0 ? Math.min(saved.height, ch) : saved.height;
            let x = clientX - containerRect.left - width * ratioX;
            let y = clientY - containerRect.top - offsetY;
            if (cw > 0)
                x = Math.max(0, Math.min(x, cw - Math.min(width, minVisible)));
            if (ch > 0)
                y = Math.max(0, Math.min(y, ch - Math.min(height, minVisible)));
            win.state.isMaximized = false;
            win.state.isMinimized = false;
            win.state.x = x;
            win.state.y = y;
            win.state.width = width;
            win.state.height = height;
            delete win.state._savedGeometry;
            win.elements.root.classList.remove('dp-maximized', 'dp-minimized');
            win.elements.btnMax.textContent = '□';
            win.elements.btnMax.setAttribute('aria-label', '最大化');
            applyGeometry(win.elements.root, win.state);
            this.events.emit('window:maximized-drag-restored', { ...win.state });
            this.events.emit('window:restored', { ...win.state });
            return { x, y };
        }
        /**
         * 還原：
         * - 若視窗是「最大化狀態下被最小化」→ 僅移除最小化，保持最大化
         * - 若只是最大化 → 還原到最大化前的幾何
         * - 若只是最小化 → 還原到原始幾何
         *
         * 這裡不直接呼叫 focus()；呼叫端通常已經知道是否要聚焦。
         * open(existing) 會 restore 後再 focus，以避免最小化視窗恢復但 Dock active 狀態不同步。
         */
        restore(id) {
            const win = this._wins.get(id);
            if (!win)
                return;
            const wasMaximized = win.state.isMaximized;
            win.state.isMinimized = false;
            win.elements.root.classList.remove('dp-minimized');
            if (wasMaximized) {
                // 最大化狀態：只解除最小化，維持最大化視覺
                win.elements.root.classList.add('dp-maximized');
                this.events.emit('window:restored', { ...win.state });
                return;
            }
            // 完全還原（從最大化按鈕點還原，或單純取消最小化）
            win.state.isMaximized = false;
            win.elements.root.classList.remove('dp-maximized');
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
        getWindowElement(id) {
            return this._wins.get(id)?.elements.root;
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
        /**
         * 動態更新視窗與視窗之間的吸附間距（px）。
         * 設為 0 表示緊貼（預設行為）。
         */
        setSnapGap(gap) {
            this._snapGap = Math.max(0, gap);
        }
        /** 取得所有視窗狀態的快照陣列（供序列化使用） */
        getAllStates() {
            return [...this._wins.values()].map(w => ({ ...w.state }));
        }
        /** 取得特定視窗的子視窗 ID 清單 */
        getChildIds(parentId) {
            const children = this._children.get(parentId);
            return children ? Array.from(children) : [];
        }
        /** 取得某個視窗所屬的最頂層根視窗 ID */
        getRootWindowId(id) {
            const win = this._wins.get(id);
            if (!win || !win.state.parentId)
                return id;
            return this.getRootWindowId(win.state.parentId);
        }
        /** 讓視窗出現「搖晃」動畫，提示使用者需先關閉子視窗 */
        shake(id) {
            const win = this._wins.get(id);
            if (!win)
                return;
            win.elements.root.classList.add('dp-shake');
            setTimeout(() => win.elements.root.classList.remove('dp-shake'), 400);
        }
        /** 銷毀所有視窗，清除事件 */
        destroy() {
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
            this._edgeSnapPreviewEl?.remove();
            this._edgeSnapPreviewEl = null;
            this._activeEdgeSnap = null;
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
        _ensureGuides() {
            if (this._guideV)
                return;
            this._guideV = document.createElement('div');
            this._guideV.className = 'dp-snap-guide dp-snap-guide--v';
            this._guideH = document.createElement('div');
            this._guideH.className = 'dp-snap-guide dp-snap-guide--h';
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
        /** 延遲建立 Windows-like edge snap 預覽區塊。 */
        _ensureEdgeSnapPreview() {
            if (!this._edgeSnapPreviewEl) {
                this._edgeSnapPreviewEl = document.createElement('div');
                this._edgeSnapPreviewEl.className = 'dp-edge-snap-preview';
                this._container.appendChild(this._edgeSnapPreviewEl);
            }
            return this._edgeSnapPreviewEl;
        }
        /** 取得可用視窗區域；Desktop 會透過 CSS 變數提供 Dock inset。 */
        _getWindowAreaBounds() {
            const width = this._isolated ? this._container.offsetWidth : window.innerWidth;
            const height = this._isolated ? this._container.offsetHeight : window.innerHeight;
            const cs = getComputedStyle(this._container);
            const dockTop = parseFloat(cs.getPropertyValue('--dp-dock-inset-top')) || 0;
            const dockRight = parseFloat(cs.getPropertyValue('--dp-dock-inset-right')) || 0;
            const dockBottom = parseFloat(cs.getPropertyValue('--dp-dock-inset-bottom')) || 0;
            const dockLeft = parseFloat(cs.getPropertyValue('--dp-dock-inset-left')) || 0;
            return {
                x: dockLeft,
                y: dockTop,
                width: Math.max(0, width - dockLeft - dockRight),
                height: Math.max(0, height - dockTop - dockBottom),
            };
        }
        _getEdgeSnapRect(target) {
            const area = this._getWindowAreaBounds();
            if (target === 'left') {
                return { x: area.x, y: area.y, width: Math.floor(area.width / 2), height: area.height };
            }
            if (target === 'right') {
                const width = Math.ceil(area.width / 2);
                return { x: area.x + area.width - width, y: area.y, width, height: area.height };
            }
            return area;
        }
        /** 根據目前滑鼠座標更新邊緣預覽。只預覽，mouseup 才真正套用。 */
        _updateEdgeSnapPreview(id, pointerX, pointerY) {
            if (!this._edgeSnapEnabled)
                return;
            const win = this._wins.get(id);
            if (!win || !win.state.resizable || win.state.parentId || win.state.isMinimized) {
                this._hideEdgeSnapPreview();
                return;
            }
            const area = this._getWindowAreaBounds();
            const threshold = this._edgeSnapThreshold;
            let target = null;
            if (pointerY <= area.y + threshold) {
                target = 'maximize';
            }
            else if (pointerX <= area.x + threshold) {
                target = 'left';
            }
            else if (pointerX >= area.x + area.width - threshold) {
                target = 'right';
            }
            if (!target) {
                this._hideEdgeSnapPreview();
                return;
            }
            const rect = this._getEdgeSnapRect(target);
            const el = this._ensureEdgeSnapPreview();
            el.style.left = `${rect.x}px`;
            el.style.top = `${rect.y}px`;
            el.style.width = `${rect.width}px`;
            el.style.height = `${rect.height}px`;
            el.dataset.edgeSnapTarget = target;
            el.classList.add('dp-edge-snap-preview--visible');
            if (!this._activeEdgeSnap || this._activeEdgeSnap.id !== id || this._activeEdgeSnap.target !== target) {
                this.events.emit('window:edge-snap-preview', { id, edgeSnapTarget: target });
            }
            this._activeEdgeSnap = { id, target };
        }
        _hideEdgeSnapPreview() {
            const active = this._activeEdgeSnap;
            if (this._edgeSnapPreviewEl) {
                this._edgeSnapPreviewEl.classList.remove('dp-edge-snap-preview--visible');
                delete this._edgeSnapPreviewEl.dataset.edgeSnapTarget;
            }
            this._activeEdgeSnap = null;
            if (active) {
                this.events.emit('window:edge-snap-preview-clear', { id: active.id });
            }
        }
        /** mouseup 時套用目前 edge snap 預覽。 */
        _applyEdgeSnap(id) {
            const active = this._activeEdgeSnap;
            if (!active || active.id !== id)
                return;
            const target = active.target;
            this._activeEdgeSnap = null;
            this.events.emit('window:edge-snap-preview-clear', { id });
            if (target === 'maximize') {
                this.maximize(id);
                const win = this._wins.get(id);
                if (win)
                    this.events.emit('window:edge-snapped', { ...win.state, edgeSnapTarget: target });
                return;
            }
            const win = this._wins.get(id);
            if (!win || !win.state.resizable)
                return;
            const rect = this._getEdgeSnapRect(target);
            if (!win.state._savedGeometry) {
                win.state._savedGeometry = {
                    x: win.state.x,
                    y: win.state.y,
                    width: win.state.width,
                    height: win.state.height,
                };
            }
            win.state.isMaximized = false;
            win.state.isMinimized = false;
            win.state.x = rect.x;
            win.state.y = rect.y;
            win.state.width = rect.width;
            win.state.height = rect.height;
            win.elements.root.classList.remove('dp-maximized', 'dp-minimized');
            win.elements.btnMax.textContent = '□';
            win.elements.btnMax.setAttribute('aria-label', '最大化');
            applyGeometry(win.elements.root, win.state);
            this.events.emit('window:resized', { ...win.state });
            this.events.emit('window:moved', { ...win.state });
            this.events.emit('window:edge-snapped', { ...win.state, edgeSnapTarget: target });
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
                body.classList.add('dp-has-layout');
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
                body.classList.add('dp-has-layout');
                const panel = new Panel({
                    container: body,
                    title: panelTitle || undefined,
                    collapsible: panelCollapsible,
                    collapsed: panelCollapsed,
                });
                this._layouts.set(id, panel);
            }
        }
        // ── Modal Overlay helpers ─────────────────────────────
        /**
         * 在父視窗插入 Modal 遮罩層。
         * overlay 附同子視窗 ID 記錄，點擊時觸發對應子視窗的 shake 動畫。
         *
         * overlay 掛在父視窗 root，而不是全域 body。這樣在 isolated workspace、
         * TaskView clone、Desktop 內嵌 demo 中，遮罩都只限制在父視窗範圍。
         */
        _attachModalOverlay(parentId, childId) {
            const parentWin = this._wins.get(parentId);
            if (!parentWin)
                return;
            // 如果已經有遮罩，不重複插入
            if (this._modalOverlays.has(childId))
                return;
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
         * 移除由 childId 產生的 modal 遮罩。
         */
        _detachModalOverlay(childId) {
            const overlay = this._modalOverlays.get(childId);
            if (overlay) {
                overlay.remove();
                this._modalOverlays.delete(childId);
            }
        }
        _deactivateOthers(exceptId) {
            this._wins.forEach((win, id) => {
                if (id !== exceptId && win.state.isActive) {
                    win.state.isActive = false;
                    win.elements.root.classList.remove('dp-active');
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
                this._wins.get(topId);
                // reset so focus() triggers even when the top window already thought it was active
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
        /** 取得可供 snap 計算用的其他視窗矩形（排除 excludeId 及最小化/最大化視窗） */
        _getOtherWindows(excludeId) {
            const others = [];
            this._wins.forEach((win, wid) => {
                if (wid !== excludeId && !win.state.isMinimized && !win.state.isMaximized) {
                    others.push({ x: win.state.x, y: win.state.y, width: win.state.width, height: win.state.height });
                }
            });
            return others;
        }
        /** 建立拖曳 snap 函式（用於 DragResizeHandler.snapFn） */
        _buildSnapFn(stateId) {
            return (x, y, w, h, pointerX, pointerY) => {
                const cw = this._isolated ? this._container.offsetWidth : window.innerWidth;
                const ch = this._isolated ? this._container.offsetHeight : window.innerHeight;
                const result = snapPosition({ x, y, width: w, height: h }, { width: cw, height: ch }, this._getOtherWindows(stateId), this._snapThreshold, this._snapGap);
                this._updateSnapGuides(result.guides);
                this._updateEdgeSnapPreview(stateId, pointerX, pointerY);
                return { x: result.x, y: result.y };
            };
        }
        /** 建立 resize snap 函式（用於 DragResizeHandler.resizeSnapFn） */
        _buildResizeSnapFn(stateId) {
            return (x, y, w, h, edge) => {
                const cw = this._isolated ? this._container.offsetWidth : window.innerWidth;
                const ch = this._isolated ? this._container.offsetHeight : window.innerHeight;
                const result = snapResize({ x, y, width: w, height: h }, edge, { width: cw, height: ch }, this._getOtherWindows(stateId), this._snapThreshold, this._snapGap);
                this._updateSnapGuides(result.guides);
                return { x: result.x, y: result.y, width: result.width, height: result.height };
            };
        }
    }

    // ============================================================
    // DeskPane-Desktop — Icon utilities (shared between Dock & DesktopIcon)
    // ============================================================
    /**
     * 依 icon 字串類型，將對應子節點（img / svg innerHTML / emoji text）
     * 附加至目標容器元素。
     * 支援：http/https URL、絕對路徑 /...、data: URI、SVG 字串、emoji / 文字。
     */
    function appendIconContent(container, icon) {
        if (icon.startsWith('http') || icon.startsWith('/') || icon.startsWith('data:')) {
            const img = document.createElement('img');
            img.src = icon;
            img.alt = '';
            container.appendChild(img);
        }
        else if (icon.trim().startsWith('<svg')) {
            container.innerHTML = icon;
        }
        else {
            container.textContent = icon;
        }
    }

    // ============================================================
    // DeskPane-Desktop — Dock
    // 工具列：支援圖示新增/移除 + 拖曳排序
    // ============================================================
    function resolveIconEl$1(icon, size) {
        const el = document.createElement('div');
        el.className = 'dp-dock-icon';
        el.style.width = `${size}px`;
        el.style.height = `${size}px`;
        el.style.fontSize = `${Math.floor(size * 0.72)}px`;
        el.style.lineHeight = '1';
        appendIconContent(el, icon);
        return el;
    }
    class Dock {
        constructor(config = {}) {
            this._dragSrcIndex = -1;
            this._activeId = null;
            this._renderCallbacks = new Set();
            this._items = [...(config.items ?? [])];
            this._position = config.position ?? 'bottom';
            this._iconSize = config.iconSize ?? 44;
            this._showLabels = config.showLabels ?? true;
            this._itemLayout = config.itemLayout ?? 'dock';
            this._itemRenderer = config.itemRenderer ?? null;
            this._leading = config.leading ?? null;
            this._trailing = config.trailing ?? null;
            this._el = document.createElement('div');
            this._el.className = `dp-dock dp-dock-${this._position}`;
            this._syncItemLayoutClass();
            this._render();
        }
        // ── Private ───────────────────────────────────────────────
        _render() {
            this._el.replaceChildren();
            const hasSlots = this._hasSlots();
            this._el.classList.toggle('dp-dock--slotted', hasSlots);
            if (!hasSlots) {
                this._items.forEach((item, index) => {
                    this._el.appendChild(this._createItemEl(item, index));
                });
                this._renderCallbacks.forEach(cb => cb());
                return;
            }
            const leadingEl = this._createSlotEl('leading', this._leading);
            const itemsEl = document.createElement('div');
            itemsEl.className = 'dp-dock-items';
            itemsEl.setAttribute('role', 'list');
            this._items.forEach((item, index) => {
                itemsEl.appendChild(this._createItemEl(item, index));
            });
            const trailingEl = this._createSlotEl('trailing', this._trailing);
            this._el.append(leadingEl, itemsEl, trailingEl);
            this._renderCallbacks.forEach(cb => cb());
        }
        _syncItemLayoutClass() {
            this._el.classList.toggle('dp-dock--taskbar', this._itemLayout === 'taskbar');
        }
        _hasSlots() {
            return this._leading !== null || this._trailing !== null;
        }
        _createSlotEl(slot, content) {
            const el = document.createElement('div');
            el.className = `dp-dock-slot dp-dock-${slot}`;
            el.dataset.slot = slot;
            if (typeof content === 'function') {
                const rendered = content({ slot, position: this._position, container: el });
                if (rendered instanceof Node)
                    el.appendChild(rendered);
            }
            else if (content instanceof Node) {
                el.appendChild(content);
            }
            return el;
        }
        _renderDefaultItemContent(el, item) {
            el.appendChild(resolveIconEl$1(item.icon, this._iconSize));
            if (this._showLabels) {
                const label = document.createElement('div');
                label.className = 'dp-dock-label';
                label.textContent = item.label;
                el.appendChild(label);
                return;
            }
            const tooltip = document.createElement('div');
            tooltip.className = 'dp-dock-tooltip';
            tooltip.textContent = item.label;
            el.appendChild(tooltip);
        }
        _createItemEl(item, index) {
            const el = document.createElement('div');
            el.className = 'dp-dock-item';
            el.draggable = true;
            el.dataset.index = String(index);
            el.dataset.id = item.id;
            el.title = ''; // 使用自訂 tooltip，避免瀏覽器原生 title
            el.tabIndex = 0;
            el.setAttribute('role', 'button');
            el.setAttribute('aria-label', item.label);
            let defaultRendered = false;
            const renderDefault = () => {
                if (defaultRendered)
                    return;
                defaultRendered = true;
                this._renderDefaultItemContent(el, item);
            };
            if (this._itemRenderer) {
                const rendered = this._itemRenderer({
                    item,
                    index,
                    position: this._position,
                    layout: this._itemLayout,
                    container: el,
                    renderDefault,
                });
                if (rendered instanceof Node && rendered !== el && !el.contains(rendered)) {
                    el.appendChild(rendered);
                }
            }
            else {
                renderDefault();
            }
            // Click
            el.addEventListener('click', event => {
                if (!event.defaultPrevented)
                    item.action();
            });
            el.addEventListener('keydown', event => {
                if (event.target !== el || (event.key !== 'Enter' && event.key !== ' '))
                    return;
                event.preventDefault();
                item.action();
            });
            // ── HTML5 Drag-to-reorder ─────────────────────────────
            el.addEventListener('dragstart', (e) => {
                this._dragSrcIndex = index;
                el.classList.add('dp-dock-dragging');
                if (e.dataTransfer) {
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setData('text/plain', String(index));
                }
            });
            el.addEventListener('dragend', () => {
                el.classList.remove('dp-dock-dragging');
                this._clearDragover();
            });
            el.addEventListener('dragover', (e) => {
                e.preventDefault();
                if (e.dataTransfer)
                    e.dataTransfer.dropEffect = 'move';
                const targetIndex = parseInt(el.dataset.index ?? '0', 10);
                if (targetIndex !== this._dragSrcIndex) {
                    this._clearDragover();
                    el.classList.add('dp-dock-dragover');
                }
            });
            el.addEventListener('dragleave', () => {
                el.classList.remove('dp-dock-dragover');
            });
            el.addEventListener('drop', (e) => {
                e.preventDefault();
                el.classList.remove('dp-dock-dragover');
                const targetIndex = parseInt(el.dataset.index ?? '0', 10);
                if (this._dragSrcIndex >= 0 && this._dragSrcIndex !== targetIndex) {
                    const [moved] = this._items.splice(this._dragSrcIndex, 1);
                    this._items.splice(targetIndex, 0, moved);
                    this._render();
                    if (this._activeId)
                        this._applyActive(this._activeId);
                }
                this._dragSrcIndex = -1;
            });
            return el;
        }
        _clearDragover() {
            this._el.querySelectorAll('.dp-dock-dragover').forEach(el => {
                el.classList.remove('dp-dock-dragover');
            });
        }
        // ── Public API ────────────────────────────────────────────
        addItem(item) {
            this._items.push(item);
            this._render();
            if (this._activeId)
                this._applyActive(this._activeId);
        }
        /** 在指定索引位置插入 item（0 = 最左/最上）。超出範圍時自動夾緊。 */
        addItemAt(item, index) {
            const i = Math.max(0, Math.min(index, this._items.length));
            this._items.splice(i, 0, item);
            this._render();
            if (this._activeId)
                this._applyActive(this._activeId);
        }
        /**
         * 設定目前 active（focused）的 item。
         * 傳 null 清除所有高亮。
         */
        setActiveItem(id) {
            this._activeId = id;
            this._applyActive(id);
        }
        _applyActive(id) {
            this._el.querySelectorAll('.dp-dock-item').forEach(el => {
                el.classList.toggle('dp-dock-active', !!id && el.dataset.id === id);
            });
        }
        removeItem(id) {
            const idx = this._items.findIndex(i => i.id === id);
            if (idx !== -1) {
                this._items.splice(idx, 1);
                this._render();
                if (this._activeId)
                    this._applyActive(this._activeId);
            }
        }
        /** 取得目前排列順序的 items（含拖曳後的結果） */
        getItems() {
            return [...this._items];
        }
        /** 動態變更 Dock 停靠位置 */
        setPosition(position) {
            this._el.classList.remove(`dp-dock-${this._position}`);
            this._position = position;
            this._el.classList.add(`dp-dock-${this._position}`);
            if (this._hasSlots() || this._itemRenderer !== null) {
                this._render();
                if (this._activeId)
                    this._applyActive(this._activeId);
            }
        }
        /** Switch between the classic Dock arrangement and a horizontal taskbar button layout. */
        setItemLayout(layout) {
            if (layout === this._itemLayout)
                return;
            this._itemLayout = layout;
            this._syncItemLayoutClass();
            this._render();
            if (this._activeId)
                this._applyActive(this._activeId);
        }
        getItemLayout() {
            return this._itemLayout;
        }
        /** Replace the custom item content renderer. Pass null to restore built-in content. */
        setItemRenderer(renderer) {
            if (renderer === this._itemRenderer)
                return;
            this._itemRenderer = renderer;
            this._render();
            if (this._activeId)
                this._applyActive(this._activeId);
        }
        /**
         * Replace one optional Dock slot. Pass null to clear it.
         * When both slots are clear, Dock restores the legacy direct-item DOM.
         */
        setSlot(slot, content) {
            if (slot === 'leading') {
                this._leading = content;
            }
            else {
                this._trailing = content;
            }
            this._render();
            if (this._activeId)
                this._applyActive(this._activeId);
        }
        setLeading(content) {
            this.setSlot('leading', content);
        }
        setTrailing(content) {
            this.setSlot('trailing', content);
        }
        /** Return a slot host when slotted mode is active. */
        getSlotElement(slot) {
            return this._el.querySelector(`:scope > .dp-dock-${slot}`);
        }
        /**
         * Return the scrollable center item strip.
         * Legacy mode returns the Dock root because items remain direct children.
         */
        getItemsElement() {
            return this._el.querySelector(':scope > .dp-dock-items') ?? this._el;
        }
        /** 取得特定 item 的 DOM 元素 */
        getItemElement(id) {
            return this._el.querySelector(`.dp-dock-item[data-id="${CSS.escape(id)}"]`);
        }
        /** 取得目前 Dock 停靠位置 */
        getPosition() {
            return this._position;
        }
        getElement() {
            return this._el;
        }
        /**
         * 每次 Dock 重新渲染（addItem / addItemAt / removeItem / 拖曳排序）後觸發 cb。
         * 回傳取消訂閱函式。
         */
        onRender(cb) {
            this._renderCallbacks.add(cb);
            return () => this._renderCallbacks.delete(cb);
        }
        destroy() {
            this._el.remove();
        }
    }

    // ============================================================
    // DeskPane-Desktop — DesktopIcon
    // 桌面圖示：可拖曳自由定位，點擊觸發 action
    // ============================================================
    function isNode(value) {
        return typeof Node !== 'undefined' && value instanceof Node;
    }
    function appendResolvedContent(container, content) {
        if (typeof content === 'string') {
            appendIconContent(container, content);
        }
        else if (isNode(content)) {
            container.appendChild(content);
        }
    }
    function resolveIconEl(config) {
        const el = document.createElement('div');
        el.className = 'dp-desktop-icon-img';
        if (config.iconRenderer) {
            appendResolvedContent(el, config.iconRenderer({ item: config, container: el }));
        }
        else {
            appendResolvedContent(el, config.icon);
        }
        return el;
    }
    class DesktopIcon {
        constructor(config, containerEl, onMove, dragThreshold = 6, snapFn = null, onDragEnd = null, onSelect = null) {
            this._isDragging = false;
            this._hasMoved = false;
            this._dragOffX = 0;
            this._dragOffY = 0;
            this._startX = 0;
            this._startY = 0;
            this._config = config;
            this._containerEl = containerEl;
            this._onMove = onMove;
            this._dragThreshold = config.dragThreshold ?? dragThreshold;
            this._snapFn = snapFn;
            this._onDragEnd = onDragEnd;
            this._onSelect = onSelect;
            this._onMouseMoveBound = this._onMouseMove.bind(this);
            this._onMouseUpBound = this._onMouseUp.bind(this);
            this._el = this._createElement();
        }
        _createElement() {
            const el = document.createElement('div');
            el.className = 'dp-desktop-icon';
            el.dataset.id = this._config.id;
            el.appendChild(resolveIconEl(this._config));
            const label = document.createElement('div');
            label.className = 'dp-desktop-icon-label';
            label.textContent = this._config.label;
            el.appendChild(label);
            el.addEventListener('mousedown', this._onMouseDown.bind(this));
            return el;
        }
        _onMouseDown(e) {
            if (e.button !== 0)
                return;
            e.preventDefault();
            e.stopPropagation();
            const rect = this._el.getBoundingClientRect();
            this._dragOffX = e.clientX - rect.left;
            this._dragOffY = e.clientY - rect.top;
            this._startX = e.clientX;
            this._startY = e.clientY;
            this._isDragging = true;
            this._hasMoved = false;
            // 取消其他圖示的選取狀態
            this._containerEl.querySelectorAll('.dp-icon-selected').forEach(el => {
                el.classList.remove('dp-icon-selected');
            });
            this._el.classList.add('dp-icon-selected');
            this._onSelect?.(this._config.id);
            document.addEventListener('mousemove', this._onMouseMoveBound);
            document.addEventListener('mouseup', this._onMouseUpBound);
        }
        _onMouseMove(e) {
            if (!this._isDragging)
                return;
            if (!this._hasMoved) {
                const dx = e.clientX - this._startX;
                const dy = e.clientY - this._startY;
                if (Math.sqrt(dx * dx + dy * dy) < this._dragThreshold)
                    return;
                this._el.classList.add('dp-icon-dragging');
                this._hasMoved = true;
            }
            const containerRect = this._containerEl.getBoundingClientRect();
            const maxX = containerRect.width - this._el.offsetWidth;
            const maxY = containerRect.height - this._el.offsetHeight;
            let x = Math.max(0, Math.min(e.clientX - containerRect.left - this._dragOffX, maxX));
            let y = Math.max(0, Math.min(e.clientY - containerRect.top - this._dragOffY, maxY));
            if (this._snapFn) {
                const result = this._snapFn(x, y, this._el.offsetWidth, this._el.offsetHeight);
                x = Math.max(0, Math.min(result.x, maxX));
                y = Math.max(0, Math.min(result.y, maxY));
            }
            this.setPosition(x, y);
        }
        _onMouseUp(_e) {
            document.removeEventListener('mousemove', this._onMouseMoveBound);
            document.removeEventListener('mouseup', this._onMouseUpBound);
            this._el.classList.remove('dp-icon-dragging');
            this._onDragEnd?.();
            if (!this._hasMoved) {
                // 純點擊，觸發 action
                this._config.action?.();
            }
            else {
                // 拖曳結束，通知 Desktop 儲存位置
                const x = parseInt(this._el.style.left || '0', 10);
                const y = parseInt(this._el.style.top || '0', 10);
                this._onMove(this._config.id, x, y);
            }
            this._isDragging = false;
            this._hasMoved = false;
        }
        setPosition(x, y) {
            this._el.style.left = `${x}px`;
            this._el.style.top = `${y}px`;
        }
        getElement() {
            return this._el;
        }
        getConfig() {
            return { ...this._config };
        }
        destroy() {
            document.removeEventListener('mousemove', this._onMouseMoveBound);
            document.removeEventListener('mouseup', this._onMouseUpBound);
            this._el.remove();
        }
    }

    // ============================================================
    // DeskPane-Desktop — DesktopCollectionView
    // Wijmo-style collection view for desktop icon data binding.
    // ============================================================
    class DesktopCollectionView {
        constructor(sourceCollection = [], options = {}) {
            this.collectionChanged = new EventBus();
            this.currentChanged = new EventBus();
            this.addedItems = [];
            this.removedItems = [];
            this.editedItems = [];
            this._deferLevel = 0;
            this._pendingChange = null;
            this.sourceCollection = sourceCollection;
            this.items = [...sourceCollection];
            this.trackChanges = options.trackChanges ?? false;
            this._getKey = options.getKey ?? ((item) => item.id);
        }
        get length() {
            return this.items.length;
        }
        getItem(id) {
            return this.items.find(item => this._getKey(item) === id);
        }
        setSourceCollection(sourceCollection, options = {}) {
            this.sourceCollection = sourceCollection;
            this.refresh({
                source: options.source ?? 'external',
                emit: options.emit,
            });
        }
        refresh(options = {}) {
            this.items = [...this.sourceCollection];
            this._emit({
                action: 'refresh',
                source: options.source ?? 'external',
                items: this.snapshot(),
            }, options);
        }
        beginUpdate() {
            this._deferLevel++;
        }
        endUpdate() {
            if (this._deferLevel === 0)
                return;
            this._deferLevel--;
            if (this._deferLevel === 0 && this._pendingChange) {
                const pending = this._pendingChange;
                this._pendingChange = null;
                this.collectionChanged.emit('change', pending);
            }
        }
        deferUpdate(fn) {
            this.beginUpdate();
            try {
                fn();
            }
            finally {
                this.endUpdate();
            }
        }
        add(item, options = {}) {
            this.sourceCollection.push(item);
            this.items = [...this.sourceCollection];
            if (this.trackChanges)
                this.addedItems.push(item);
            this._emit({
                action: 'add',
                source: options.source ?? 'view',
                items: this.snapshot(),
                item: { ...item },
                id: this._getKey(item),
                index: this.sourceCollection.length - 1,
            }, options);
        }
        remove(idOrItem, options = {}) {
            const id = typeof idOrItem === 'string' ? idOrItem : this._getKey(idOrItem);
            const index = this.sourceCollection.findIndex(item => this._getKey(item) === id);
            if (index < 0)
                return undefined;
            const [removed] = this.sourceCollection.splice(index, 1);
            this.items = [...this.sourceCollection];
            if (this.trackChanges)
                this.removedItems.push(removed);
            this._emit({
                action: 'remove',
                source: options.source ?? 'view',
                items: this.snapshot(),
                item: { ...removed },
                id,
                index,
            }, options);
            return removed;
        }
        update(idOrItem, patch, options = {}) {
            const id = typeof idOrItem === 'string' ? idOrItem : this._getKey(idOrItem);
            const index = this.sourceCollection.findIndex(item => this._getKey(item) === id);
            if (index < 0)
                return undefined;
            const previous = { ...this.sourceCollection[index] };
            Object.assign(this.sourceCollection[index], patch);
            const item = this.sourceCollection[index];
            this.items = [...this.sourceCollection];
            if (this.trackChanges && !this.editedItems.includes(item))
                this.editedItems.push(item);
            this._emit({
                action: 'update',
                source: options.source ?? 'view',
                items: this.snapshot(),
                item: { ...item },
                previousItem: previous,
                id,
                index,
            }, options);
            return item;
        }
        clearChanges() {
            this.addedItems.length = 0;
            this.removedItems.length = 0;
            this.editedItems.length = 0;
        }
        snapshot() {
            return this.items.map(item => ({ ...item }));
        }
        dispose() {
            this.collectionChanged.clearAll();
            this.currentChanged.clearAll();
            this._pendingChange = null;
            this._deferLevel = 0;
        }
        _emit(change, options) {
            if (options.emit === false)
                return;
            if (this._deferLevel > 0) {
                this._pendingChange = {
                    action: 'reset',
                    source: change.source,
                    items: this.snapshot(),
                };
                return;
            }
            this.collectionChanged.emit('change', change);
        }
    }

    var DESKTOP_CSS = "/* ============================================================\r\n * DeskPane-Desktop — Default Styles\r\n * Version: 0.1.0\r\n *\r\n * Copy this file to your project and link it with:\r\n *   <link rel=\"stylesheet\" href=\"deskpane-desktop.css\">\r\n *\r\n * When using injectStyles: false option in Desktop config,\r\n * these styles will NOT be injected automatically — this file\r\n * is your starting point for customization.\r\n *\r\n * All values use CSS custom properties (--dp-*) so you can\r\n * override them in :root without touching this file.\r\n * ============================================================ */\r\n\r\n/* ── Desktop container ───────────────────────────────── */\r\n.dp-desktop {\r\n  position: relative;\r\n  width: 100%;\r\n  height: 100%;\r\n  overflow: clip;\r\n  background: var(--dp-desktop-bg, linear-gradient(135deg, #1a2a4a 0%, #0d1b2a 100%));\r\n  user-select: none;\r\n  font-family: var(--dp-font, system-ui, -apple-system, sans-serif);\r\n}\r\n\r\n/* ── Icon area ───────────────────────────────────────── */\r\n.dp-desktop-icon-area {\r\n  position: absolute;\r\n  top: 0; left: 0; right: 0; bottom: 0;\r\n  overflow: auto;\r\n  scrollbar-width: thin;\r\n  scrollbar-color: rgba(255,255,255,0.2) transparent;\r\n}\r\n\r\n/* ── Window area ─────────────────────────────────────── */\r\n.dp-desktop-window-area {\r\n  position: absolute !important;\r\n  top: 0; left: 0; right: 0; bottom: 0;\r\n  overflow: clip;\r\n  pointer-events: none;\r\n}\r\n.dp-desktop-window-area > * {\r\n  pointer-events: auto;\r\n}\r\n\r\n/* ── Icon snap guides ────────────────────────────────── */\r\n.dp-icon-snap-guide {\r\n  position: absolute;\r\n  pointer-events: none;\r\n  z-index: 9999;\r\n  display: none;\r\n  background: var(--dp-snap-guide-color, rgba(0, 120, 255, 0.55));\r\n}\r\n.dp-icon-snap-guide.dp-snap-guide--v {\r\n  width: 1px;\r\n  top: 0;\r\n  bottom: 0;\r\n}\r\n.dp-icon-snap-guide.dp-snap-guide--h {\r\n  height: 1px;\r\n  left: 0;\r\n  right: 0;\r\n}\r\n\r\n/* ── Desktop icon ────────────────────────────────────── */\r\n.dp-desktop-icon {\r\n  position: absolute;\r\n  display: flex;\r\n  flex-direction: column;\r\n  align-items: center;\r\n  width: 80px;\r\n  padding: 8px 4px 6px;\r\n  cursor: pointer;\r\n  border-radius: 8px;\r\n  transition: background 0.12s;\r\n}\r\n.dp-desktop-icon:hover {\r\n  background: var(--dp-desktop-icon-hover-bg, rgba(255,255,255,0.15));\r\n}\r\n.dp-desktop-icon.dp-icon-selected {\r\n  background: rgba(74,158,255,0.35);\r\n  outline: 1px solid rgba(74,158,255,0.6);\r\n}\r\n.dp-desktop-icon.dp-icon-dragging {\r\n  opacity: 0.45;\r\n  z-index: 9999;\r\n}\r\n.dp-desktop-icon-img {\r\n  width: 48px;\r\n  height: 48px;\r\n  font-size: 38px;\r\n  line-height: 1;\r\n  display: flex;\r\n  align-items: center;\r\n  justify-content: center;\r\n  border-radius: 10px;\r\n  overflow: hidden;\r\n  pointer-events: none;\r\n}\r\n.dp-desktop-icon-img img {\r\n  width: 100%;\r\n  height: 100%;\r\n  object-fit: contain;\r\n}\r\n.dp-desktop-icon-label {\r\n  margin-top: 4px;\r\n  font-size: 11px;\r\n  color: var(--dp-desktop-icon-text, #fff);\r\n  text-align: center;\r\n  line-height: 1.3;\r\n  max-width: 76px;\r\n  word-break: break-word;\r\n  text-shadow: 0 1px 3px rgba(0,0,0,0.7);\r\n  pointer-events: none;\r\n}\r\n\r\n/* ── Dock ────────────────────────────────────────────── */\r\n.dp-dock {\r\n  position: absolute;\r\n  display: flex;\r\n  align-items: center;\r\n  justify-content: flex-start;\r\n  gap: 4px;\r\n  background: var(--dp-dock-bg, rgba(20,30,50,0.75));\r\n  backdrop-filter: var(--dp-dock-backdrop-filter, blur(14px));\r\n  -webkit-backdrop-filter: var(--dp-dock-backdrop-filter, blur(14px));\r\n  border: 1px solid var(--dp-dock-border, rgba(255,255,255,0.1));\r\n  padding: 6px 10px;\r\n  z-index: 9999;\r\n  box-sizing: border-box;\r\n  scrollbar-width: none;\r\n  -ms-overflow-style: none;\r\n}\r\n.dp-dock::-webkit-scrollbar { display: none; }\r\n.dp-dock.dp-dock-bottom {\r\n  bottom: 0; left: 0; right: 0;\r\n  flex-direction: row;\r\n  height: 68px;\r\n  border-top: 1px solid var(--dp-dock-border, rgba(255,255,255,0.1));\r\n  overflow-x: auto;\r\n  overflow-y: hidden;\r\n}\r\n.dp-dock.dp-dock-top {\r\n  top: 0; left: 0; right: 0;\r\n  flex-direction: row;\r\n  height: 68px;\r\n  border-bottom: 1px solid var(--dp-dock-border, rgba(255,255,255,0.1));\r\n  overflow-x: auto;\r\n  overflow-y: hidden;\r\n}\r\n.dp-dock.dp-dock-left {\r\n  top: 0; left: 0; bottom: 0;\r\n  flex-direction: column;\r\n  width: 68px;\r\n  align-items: center;\r\n  justify-content: flex-start;\r\n  padding: 10px 6px;\r\n  border-right: 1px solid var(--dp-dock-border, rgba(255,255,255,0.1));\r\n  overflow-y: auto;\r\n  overflow-x: hidden;\r\n}\r\n.dp-dock.dp-dock-right {\r\n  top: 0; right: 0; bottom: 0;\r\n  flex-direction: column;\r\n  width: 68px;\r\n  align-items: center;\r\n  justify-content: flex-start;\r\n  padding: 10px 6px;\r\n  border-left: 1px solid var(--dp-dock-border, rgba(255,255,255,0.1));\r\n  overflow-y: auto;\r\n  overflow-x: hidden;\r\n}\r\n\r\n/* ── Optional Dock leading / center / trailing regions ─ */\r\n.dp-dock.dp-dock--slotted {\r\n  overflow: hidden;\r\n}\r\n.dp-dock-slot,\r\n.dp-dock-items {\r\n  display: flex;\r\n  align-items: center;\r\n  gap: 4px;\r\n  min-width: 0;\r\n  min-height: 0;\r\n}\r\n.dp-dock-slot {\r\n  flex: 0 0 auto;\r\n}\r\n.dp-dock-slot:empty {\r\n  display: none;\r\n}\r\n.dp-dock-items {\r\n  flex: 1 1 auto;\r\n  scrollbar-width: none;\r\n  -ms-overflow-style: none;\r\n}\r\n.dp-dock-items::-webkit-scrollbar {\r\n  display: none;\r\n}\r\n.dp-dock-bottom .dp-dock-slot,\r\n.dp-dock-top .dp-dock-slot,\r\n.dp-dock-bottom .dp-dock-items,\r\n.dp-dock-top .dp-dock-items {\r\n  height: 100%;\r\n  flex-direction: row;\r\n}\r\n.dp-dock-bottom .dp-dock-items,\r\n.dp-dock-top .dp-dock-items {\r\n  overflow-x: auto;\r\n  overflow-y: hidden;\r\n}\r\n.dp-dock-left .dp-dock-slot,\r\n.dp-dock-right .dp-dock-slot,\r\n.dp-dock-left .dp-dock-items,\r\n.dp-dock-right .dp-dock-items {\r\n  width: 100%;\r\n  flex-direction: column;\r\n}\r\n.dp-dock-left .dp-dock-items,\r\n.dp-dock-right .dp-dock-items {\r\n  overflow-x: hidden;\r\n  overflow-y: auto;\r\n}\r\n.dp-dock-left .dp-dock-trailing,\r\n.dp-dock-right .dp-dock-trailing {\r\n  margin-top: auto;\r\n}\r\n.dp-dock-slot > * {\r\n  flex-shrink: 0;\r\n}\r\n\r\n/* ── Dock item ───────────────────────────────────────── */\r\n.dp-dock-item {\r\n  display: flex;\r\n  flex-direction: column;\r\n  align-items: center;\r\n  justify-content: center;\r\n  cursor: pointer;\r\n  border-radius: 10px;\r\n  padding: 4px 6px;\r\n  position: relative;\r\n  transition: transform 0.15s, background 0.12s;\r\n  flex-shrink: 0;\r\n}\r\n.dp-dock-item:focus-visible {\r\n  outline: 2px solid var(--dp-dock-focus-ring, rgba(118, 190, 255, 0.95));\r\n  outline-offset: 1px;\r\n}\r\n.dp-dock.dp-dock--taskbar.dp-dock-bottom .dp-dock-item,\r\n.dp-dock.dp-dock--taskbar.dp-dock-top .dp-dock-item {\r\n  box-sizing: border-box;\r\n  width: var(--dp-taskbar-item-width, 160px);\r\n  height: var(--dp-taskbar-item-height, 48px);\r\n  flex: 0 0 var(--dp-taskbar-item-width, 160px);\r\n  flex-direction: row;\r\n  justify-content: var(--dp-taskbar-item-justify, flex-start);\r\n  gap: var(--dp-taskbar-item-gap, 8px);\r\n  padding: var(--dp-taskbar-item-padding, 4px 10px);\r\n  border-radius: var(--dp-taskbar-item-radius, 6px);\r\n}\r\n.dp-dock.dp-dock--taskbar.dp-dock-bottom .dp-dock-item:hover,\r\n.dp-dock.dp-dock--taskbar.dp-dock-top .dp-dock-item:hover,\r\n.dp-dock.dp-dock--taskbar.dp-dock-bottom .dp-dock-item.dp-dock-dragover,\r\n.dp-dock.dp-dock--taskbar.dp-dock-top .dp-dock-item.dp-dock-dragover {\r\n  transform: none;\r\n}\r\n.dp-dock.dp-dock--taskbar.dp-dock-bottom .dp-dock-label,\r\n.dp-dock.dp-dock--taskbar.dp-dock-top .dp-dock-label {\r\n  min-width: 0;\r\n  max-width: none;\r\n  flex: 1 1 auto;\r\n  margin-top: 0;\r\n  text-align: left;\r\n}\r\n.dp-dock-item:hover {\r\n  background: var(--dp-dock-item-hover-bg, rgba(255,255,255,0.12));\r\n  transform: scale(1.15) translateY(-3px);\r\n}\r\n.dp-dock-item.dp-dock-dragging {\r\n  opacity: 0.4;\r\n}\r\n.dp-dock-item.dp-dock-dragover {\r\n  background: rgba(74,158,255,0.25);\r\n  outline: 2px dashed rgba(74,158,255,0.7);\r\n  transform: scale(1.1);\r\n}\r\n.dp-dock-item.dp-dock-active {\r\n  background: rgba(74,158,255,0.2);\r\n}\r\n.dp-dock-item.dp-dock-active::after {\r\n  content: '';\r\n  position: absolute;\r\n  bottom: -5px;\r\n  left: 50%;\r\n  transform: translateX(-50%);\r\n  width: 5px;\r\n  height: 5px;\r\n  border-radius: 50%;\r\n  background: rgba(74,158,255,0.9);\r\n}\r\n.dp-dock.dp-dock-top .dp-dock-item.dp-dock-active::after {\r\n  bottom: unset;\r\n  top: -5px;\r\n}\r\n.dp-dock.dp-dock-left .dp-dock-item.dp-dock-active::after {\r\n  bottom: unset;\r\n  top: 50%;\r\n  left: -5px;\r\n  transform: translateY(-50%);\r\n}\r\n.dp-dock.dp-dock-right .dp-dock-item.dp-dock-active::after {\r\n  bottom: unset;\r\n  top: 50%;\r\n  left: unset;\r\n  right: -5px;\r\n  transform: translateY(-50%);\r\n}\r\n\r\n/* ── Dock icon & label ───────────────────────────────── */\r\n.dp-dock-icon {\r\n  display: flex;\r\n  align-items: center;\r\n  justify-content: center;\r\n  border-radius: 8px;\r\n  overflow: hidden;\r\n  pointer-events: none;\r\n}\r\n.dp-dock-icon img {\r\n  width: 100%;\r\n  height: 100%;\r\n  object-fit: contain;\r\n}\r\n.dp-dock-label {\r\n  font-size: 10px;\r\n  color: var(--dp-desktop-icon-text, rgba(255,255,255,0.85));\r\n  margin-top: 2px;\r\n  white-space: nowrap;\r\n  overflow: hidden;\r\n  text-overflow: ellipsis;\r\n  max-width: 60px;\r\n  pointer-events: none;\r\n}\r\n\r\n/* ── Dock tooltip ────────────────────────────────────── */\r\n.dp-dock-tooltip {\r\n  position: absolute;\r\n  bottom: calc(100% + 6px);\r\n  left: 50%;\r\n  transform: translateX(-50%);\r\n  background: rgba(0,0,0,0.8);\r\n  color: #fff;\r\n  font-size: 11px;\r\n  padding: 3px 8px;\r\n  border-radius: 4px;\r\n  white-space: nowrap;\r\n  pointer-events: none;\r\n  opacity: 0;\r\n  transition: opacity 0.15s;\r\n}\r\n.dp-dock-item:hover .dp-dock-tooltip {\r\n  opacity: 1;\r\n}\r\n.dp-dock.dp-dock-left .dp-dock-tooltip,\r\n.dp-dock.dp-dock-right .dp-dock-tooltip {\r\n  bottom: unset;\r\n  top: 50%;\r\n  transform: translateY(-50%);\r\n}\r\n.dp-dock.dp-dock-left .dp-dock-tooltip {\r\n  left: calc(100% + 6px);\r\n}\r\n.dp-dock.dp-dock-right .dp-dock-tooltip {\r\n  left: unset;\r\n  right: calc(100% + 6px);\r\n}\r\n\r\n/* ── Dock group preview (Windows-style thumbnails) ───── */\r\n.dp-dock-group-preview {\r\n  position: fixed;\r\n  z-index: 99998;\r\n  display: flex;\r\n  flex-direction: row;\r\n  gap: 6px;\r\n  padding: 8px;\r\n  border-radius: 10px;\r\n  background: rgba(18, 20, 26, 0.92);\r\n  border: 1px solid rgba(255, 255, 255, 0.12);\r\n  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.65);\r\n  backdrop-filter: blur(14px);\r\n  pointer-events: auto;\r\n  opacity: 0;\r\n  transform: translateY(8px);\r\n  transition: opacity 0.15s ease, transform 0.15s ease;\r\n}\r\n.dp-dock-group-preview--visible {\r\n  opacity: 1;\r\n  transform: translateY(0);\r\n}\r\n.dp-dock-group-preview--top {\r\n  transform: translateY(-8px);\r\n}\r\n.dp-dock-group-preview--top.dp-dock-group-preview--visible {\r\n  transform: translateY(0);\r\n}\r\n.dp-dock-group-preview--left,\r\n.dp-dock-group-preview--right {\r\n  flex-direction: column;\r\n  transform: translateX(0);\r\n}\r\n\r\n/* ── Group card ──────────────────────────────────────── */\r\n.dp-dock-group-card {\r\n  display: flex;\r\n  flex-direction: column;\r\n  cursor: pointer;\r\n  border-radius: 6px;\r\n  border: 1px solid transparent;\r\n  overflow: hidden;\r\n  transition: border-color 0.12s, background 0.12s;\r\n}\r\n.dp-dock-group-card:hover {\r\n  border-color: rgba(255, 255, 255, 0.25);\r\n  background: rgba(255, 255, 255, 0.07);\r\n}\r\n\r\n/* ── Card header ─────────────────────────────────────── */\r\n.dp-dock-group-card-header {\r\n  display: flex;\r\n  align-items: center;\r\n  gap: 4px;\r\n  padding: 4px 4px 4px 7px;\r\n  height: 26px;\r\n  flex-shrink: 0;\r\n}\r\n.dp-dock-group-card-title {\r\n  flex: 1;\r\n  font-size: 11px;\r\n  color: rgba(255, 255, 255, 0.82);\r\n  white-space: nowrap;\r\n  overflow: hidden;\r\n  text-overflow: ellipsis;\r\n}\r\n.dp-dock-group-card-close {\r\n  flex-shrink: 0;\r\n  width: 18px;\r\n  height: 18px;\r\n  border: none;\r\n  border-radius: 50%;\r\n  background: transparent;\r\n  color: rgba(255, 255, 255, 0.45);\r\n  font-size: 9px;\r\n  cursor: pointer;\r\n  display: flex;\r\n  align-items: center;\r\n  justify-content: center;\r\n  opacity: 0;\r\n  transition: background 0.1s, opacity 0.1s, color 0.1s;\r\n  padding: 0;\r\n  line-height: 1;\r\n}\r\n.dp-dock-group-card:hover .dp-dock-group-card-close {\r\n  opacity: 1;\r\n}\r\n.dp-dock-group-card-close:hover {\r\n  background: rgba(210, 40, 40, 0.85);\r\n  color: #fff;\r\n}\r\n\r\n/* ── Card thumbnail ──────────────────────────────────── */\r\n.dp-dock-group-card-thumb {\r\n  position: relative;\r\n  overflow: hidden;\r\n  flex-shrink: 0;\r\n  background: rgba(0, 0, 0, 0.35);\r\n}\r\n\r\n/* ── Modal-blocked card shake ────────────────────────── */\r\n@keyframes dp-group-card-shake {\r\n  0%, 100% { transform: translateX(0); }\r\n  20%       { transform: translateX(-5px); }\r\n  40%       { transform: translateX(5px); }\r\n  60%       { transform: translateX(-4px); }\r\n  80%       { transform: translateX(3px); }\r\n}\r\n.dp-group-card--shake {\r\n  animation: dp-group-card-shake 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;\r\n}\r\n\r\n\r\n/* ── Optional SystemTray content for Dock trailing slots ─ */\r\n.dp-system-tray {\r\n  display: flex;\r\n  align-items: center;\r\n  justify-content: flex-end;\r\n  gap: var(--dp-tray-gap, 2px);\r\n  min-width: 0;\r\n  min-height: 0;\r\n  height: 100%;\r\n  color: var(--dp-tray-item-color, inherit);\r\n}\r\n.dp-system-tray-item {\r\n  appearance: none;\r\n  position: relative;\r\n  display: inline-flex;\r\n  align-items: center;\r\n  justify-content: center;\r\n  box-sizing: border-box;\r\n  width: var(--dp-tray-item-size, 32px);\r\n  height: var(--dp-tray-item-size, 32px);\r\n  flex: 0 0 var(--dp-tray-item-size, 32px);\r\n  margin: 0;\r\n  padding: var(--dp-tray-item-padding, 4px);\r\n  border: var(--dp-tray-item-border, 0);\r\n  border-radius: var(--dp-tray-item-radius, 4px);\r\n  background: var(--dp-tray-item-bg, transparent);\r\n  color: var(--dp-tray-item-color, inherit);\r\n  font: inherit;\r\n  line-height: 1;\r\n  cursor: pointer;\r\n}\r\n.dp-system-tray-item:hover:not(:disabled) {\r\n  background: var(--dp-tray-item-hover-bg, var(--dp-dock-item-hover-bg, rgba(255,255,255,0.12)));\r\n}\r\n.dp-system-tray-item:focus-visible {\r\n  outline: 2px solid var(--dp-tray-focus-ring, var(--dp-dock-focus-ring, rgba(118,190,255,0.95)));\r\n  outline-offset: 1px;\r\n}\r\n.dp-system-tray-item:disabled,\r\n.dp-system-tray-item[aria-disabled=\"true\"] {\r\n  opacity: var(--dp-tray-disabled-opacity, 0.45);\r\n  cursor: default;\r\n}\r\n.dp-system-tray-item--status {\r\n  cursor: default;\r\n}\r\n.dp-system-tray-icon {\r\n  display: inline-flex;\r\n  align-items: center;\r\n  justify-content: center;\r\n  width: var(--dp-tray-icon-size, 18px);\r\n  height: var(--dp-tray-icon-size, 18px);\r\n  font-size: var(--dp-tray-icon-font-size, 15px);\r\n  line-height: 1;\r\n  overflow: hidden;\r\n}\r\n.dp-system-tray-icon > img,\r\n.dp-system-tray-icon > svg,\r\n.dp-system-tray-icon > * {\r\n  width: 100%;\r\n  height: 100%;\r\n  object-fit: contain;\r\n}\r\n.dp-system-tray-badge {\r\n  position: absolute;\r\n  top: 0;\r\n  right: 0;\r\n  min-width: 14px;\r\n  height: 14px;\r\n  box-sizing: border-box;\r\n  padding: 0 3px;\r\n  border-radius: 7px;\r\n  background: var(--dp-tray-badge-bg, #dc2626);\r\n  color: var(--dp-tray-badge-color, #ffffff);\r\n  font-size: 9px;\r\n  font-weight: 700;\r\n  line-height: 14px;\r\n  text-align: center;\r\n}\r\n.dp-dock-left .dp-system-tray,\r\n.dp-dock-right .dp-system-tray {\r\n  width: 100%;\r\n  height: auto;\r\n  flex-direction: column;\r\n}\r\n";

    // ============================================================
    // DeskPane-Desktop — CSS 注入（僅注入一次）
    // ============================================================
    const STYLE_ID = 'dp-desktop-styles';
    function injectDesktopStyles() {
        injectRuntimeCSS({
            id: STYLE_ID,
            css: DESKTOP_CSS,
            hrefPart: 'deskpane-desktop.css',
            fingerprint: 'DeskPane-Desktop — Default Styles',
        });
    }

    // ============================================================
    // DeskPane-Desktop — Desktop
    // 桌面主容器：管理圖示區域 + Dock 工具列
    // ============================================================
    /** 群組預覽：每張卡片的預設寬高（px） */
    const PREVIEW_CARD_W = 160;
    const PREVIEW_CARD_H = 100;
    /**
     * 建立 Windows 風格群組縮略圖 popup。
     * 每個視窗（父 + 子）對應一張卡片，卡片含標題列與縮略圖。
     */
    function buildGroupPreview(opts) {
        const { anchorEl, dockPos, windowIds, getWindowEl, getWinState, cardW, cardH, onCardClick, onCardClose, mountEl } = opts;
        const HEADER_H = 26;
        const CARD_GAP = 6;
        const PADDING = 8;
        const popup = document.createElement('div');
        popup.className = `dp-dock-group-preview dp-dock-group-preview--${dockPos}`;
        for (const winId of windowIds) {
            const state = getWinState(winId);
            const winEl = getWindowEl(winId);
            const card = document.createElement('div');
            card.className = 'dp-dock-group-card';
            card.dataset.windowId = winId;
            // ── Header（標題 + 關閉鈕）──
            const header = document.createElement('div');
            header.className = 'dp-dock-group-card-header';
            const titleEl = document.createElement('span');
            titleEl.className = 'dp-dock-group-card-title';
            titleEl.textContent = state?.title ?? winId;
            titleEl.title = state?.title ?? winId;
            const closeBtn = document.createElement('button');
            closeBtn.className = 'dp-dock-group-card-close';
            closeBtn.setAttribute('aria-label', '關閉');
            closeBtn.textContent = '✕';
            closeBtn.addEventListener('mousedown', (e) => e.stopPropagation());
            closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                onCardClose(winId);
            });
            header.append(titleEl, closeBtn);
            // ── Thumbnail ──
            const thumb = document.createElement('div');
            thumb.className = 'dp-dock-group-card-thumb';
            thumb.style.width = `${cardW}px`;
            thumb.style.height = `${cardH}px`;
            if (winEl) {
                const winW = state?.width || winEl.offsetWidth || 640;
                const winH = state?.height || winEl.offsetHeight || 480;
                const scale = Math.min(cardW / winW, cardH / winH, 1);
                const scaleWrap = document.createElement('div');
                scaleWrap.style.cssText =
                    `position:absolute;top:0;left:0;width:${winW}px;height:${winH}px;` +
                        `transform:scale(${scale});transform-origin:top left;pointer-events:none;overflow:hidden;`;
                const clone = winEl.cloneNode(true);
                clone.classList.remove('dp-minimized', 'dp-maximized');
                clone.style.cssText =
                    'position:absolute;left:0;top:0;width:100%;height:100%;' +
                        'transform:none;transition:none;pointer-events:none;';
                scaleWrap.appendChild(clone);
                thumb.appendChild(scaleWrap);
            }
            card.append(header, thumb);
            card.addEventListener('click', () => onCardClick(winId));
            popup.appendChild(card);
        }
        // ── 定位 popup ──
        const cols = dockPos === 'left' || dockPos === 'right' ? 1 : windowIds.length;
        const rows = dockPos === 'left' || dockPos === 'right' ? windowIds.length : 1;
        const totalW = cols * cardW + (cols - 1) * CARD_GAP + PADDING * 2;
        const totalH = rows * (cardH + HEADER_H) + (rows - 1) * CARD_GAP + PADDING * 2;
        const rect = anchorEl.getBoundingClientRect();
        const MARGIN = 8;
        let x, y;
        if (dockPos === 'bottom') {
            x = rect.left + rect.width / 2 - totalW / 2;
            y = rect.top - totalH - MARGIN;
        }
        else if (dockPos === 'top') {
            x = rect.left + rect.width / 2 - totalW / 2;
            y = rect.bottom + MARGIN;
        }
        else if (dockPos === 'left') {
            x = rect.right + MARGIN;
            y = rect.top + rect.height / 2 - totalH / 2;
        }
        else {
            x = rect.left - totalW - MARGIN;
            y = rect.top + rect.height / 2 - totalH / 2;
        }
        x = Math.max(8, Math.min(window.innerWidth - totalW - 8, x));
        y = Math.max(8, Math.min(window.innerHeight - totalH - 8, y));
        // position:fixed inline — 防止外層 transform/will-change 建立新的 containing block
        // 座標系與 getBoundingClientRect() 一致（viewport 座標），與掛載點無關
        popup.style.cssText += `position:fixed;left:${x}px;top:${y}px;`;
        // 儲存最終採用的掛載元素（mountEl → 第一個 winEl 最近的 .v-application → body）
        // 掛在 CSS scope root 內確保 cloneNode 縮略圖繼承 Vuetify/Scoped CSS/CSS 變數
        const firstWinEl = windowIds.length > 0 ? getWindowEl(windowIds[0]) : undefined;
        const resolvedMount = mountEl ??
            (firstWinEl?.closest('.v-application') ?? null) ??
            document.body;
        popup._mountEl = resolvedMount;
        return popup;
    }
    /** 圖示自動排列：每欄最多幾個 icon */
    const AUTO_ROWS = 6;
    /** 圖示格子寬度（px） */
    const ICON_COL_W = 92;
    /** 圖示格子高度（px） */
    const ICON_ROW_H = 100;
    /** 起始邊距（px） */
    const ICON_MARGIN = 12;
    /** Dock 停靠列高度 / 寬度（px）；對齊 CSS .dp-dock-* */
    const DOCK_SIZE = 68;
    /** 計算第 index 個自動排列 icon 的位置 */
    function autoPosition(index) {
        const col = Math.floor(index / AUTO_ROWS);
        const row = index % AUTO_ROWS;
        return {
            x: ICON_MARGIN + col * ICON_COL_W,
            y: ICON_MARGIN + row * ICON_ROW_H,
        };
    }
    /** Dock 停靠位置對應的 icon 區域 inset（px） */
    function dockInset(position, dockSize) {
        return {
            top: position === 'top' ? dockSize : 0,
            bottom: position === 'bottom' ? dockSize : 0,
            left: position === 'left' ? dockSize : 0,
            right: position === 'right' ? dockSize : 0,
        };
    }
    class Desktop {
        constructor(config = {}) {
            this._icons = new Map();
            this._itemsView = null;
            this._itemsViewOff = null;
            this._guideV = null;
            this._guideH = null;
            this._iconSentinel = null;
            this._autoIconIndex = 0;
            this._dockSyncCleanup = null;
            if (config.injectStyles !== false)
                injectDesktopStyles();
            this._container = config.container ?? document.body;
            this._storageKey = config.storageKey ?? 'dp-desktop';
            this._dragThreshold = config.dragThreshold ?? 6;
            this._iconSnapEnabled = config.iconSnap ?? true;
            this._iconSnapThreshold = config.iconSnapThreshold ?? 20;
            this.events = new EventBus();
            // 桌面根元素
            this._desktopEl = document.createElement('div');
            this._desktopEl.className = 'dp-desktop';
            if (config.background) {
                this._desktopEl.style.background = config.background;
            }
            // 圖示區域
            this._iconAreaEl = document.createElement('div');
            this._iconAreaEl.className = 'dp-desktop-icon-area';
            this._desktopEl.appendChild(this._iconAreaEl);
            // 視窗區域：大小與 iconArea 相同（排除 Dock 佔用空間），
            // 作為 WindowManager 的 container，確保最大化時不超過 Dock
            this._windowAreaEl = document.createElement('div');
            this._windowAreaEl.className = 'dp-desktop-window-area';
            this._desktopEl.appendChild(this._windowAreaEl);
            // Snap guide 線（icon 拖曳吸附指示）
            if (this._iconSnapEnabled) {
                this._guideV = document.createElement('div');
                this._guideV.className = 'dp-snap-guide dp-snap-guide--v dp-icon-snap-guide';
                this._guideH = document.createElement('div');
                this._guideH.className = 'dp-snap-guide dp-snap-guide--h dp-icon-snap-guide';
                this._iconAreaEl.appendChild(this._guideV);
                this._iconAreaEl.appendChild(this._guideH);
            }
            // Sentinel：撐開 scrollHeight 讓 overflow:auto 能捲動到最遠的 icon
            this._iconSentinel = document.createElement('div');
            this._iconSentinel.style.cssText = 'position:absolute;width:1px;height:1px;pointer-events:none;';
            this._iconAreaEl.appendChild(this._iconSentinel);
            // Dock
            this._dock = new Dock(config.dock ?? {});
            this._desktopEl.appendChild(this._dock.getElement());
            // 根據 Dock 位置調整 icon 區域邊距；視窗區域故意全尺寸，讓視窗可滑入 Dock 下方
            const dockPos = config.dock?.position ?? 'bottom';
            const inset = dockInset(dockPos, DOCK_SIZE);
            this._applyInset(inset);
            // 點擊桌面空白處取消圖示選取
            this._desktopEl.addEventListener('mousedown', (e) => {
                if (e.target === this._desktopEl || e.target === this._iconAreaEl) {
                    this._iconAreaEl.querySelectorAll('.dp-icon-selected').forEach(el => {
                        el.classList.remove('dp-icon-selected');
                    });
                }
            });
            this._container.appendChild(this._desktopEl);
            // 掛載初始圖示。icons 保留相容性；itemsSource 是新的 Wijmo-style API。
            this.setItemsSource(config.itemsSource ?? config.icons ?? [], { emit: false, source: 'init' });
            this.events.emit('desktop:ready', {
                source: 'desktop',
                reason: 'ready',
                items: this.getItems(),
            });
        }
        // ── localStorage 位置記憶 ────────────────────────────────
        /**
         * 更新 icon 區域的 inset（避免 icon 被 Dock 遮住）。
         * 視窗區域維持全尺寸（0,0,0,0），讓視窗可自由滑入 Dock 下方，
         * 透過 CSS 變數 --dp-dock-inset-* 控制最大化時的邊界。
         */
        _applyInset(inset) {
            // icon 區域：跟著 dock 縮排
            this._iconAreaEl.style.top = `${inset.top}px`;
            this._iconAreaEl.style.bottom = `${inset.bottom}px`;
            this._iconAreaEl.style.left = `${inset.left}px`;
            this._iconAreaEl.style.right = `${inset.right}px`;
            // 視窗區域：永遠全尺寸，讓 backdrop-filter 能穿透看到視窗
            this._windowAreaEl.style.top = '0';
            this._windowAreaEl.style.bottom = '0';
            this._windowAreaEl.style.left = '0';
            this._windowAreaEl.style.right = '0';
            // 告知 CSS 目前 Dock 的 inset，供最大化視窗使用
            const s = this._desktopEl.style;
            s.setProperty('--dp-dock-inset-top', `${inset.top}px`);
            s.setProperty('--dp-dock-inset-bottom', `${inset.bottom}px`);
            s.setProperty('--dp-dock-inset-left', `${inset.left}px`);
            s.setProperty('--dp-dock-inset-right', `${inset.right}px`);
        }
        _loadPositions() {
            try {
                const raw = localStorage.getItem(`${this._storageKey}-icon-positions`);
                return raw ? JSON.parse(raw) : {};
            }
            catch {
                return {};
            }
        }
        _savePositions() {
            const positions = {};
            this._icons.forEach((icon, id) => {
                const el = icon.getElement();
                positions[id] = {
                    x: parseInt(el.style.left || '0', 10),
                    y: parseInt(el.style.top || '0', 10),
                };
            });
            try {
                localStorage.setItem(`${this._storageKey}-icon-positions`, JSON.stringify(positions));
            }
            catch {
                // 忽略 localStorage 寫入錯誤
            }
            this._updateSentinel();
        }
        /** 移動 sentinel 到最遠 icon 的右下角，撐開 scrollHeight/scrollWidth */
        _updateSentinel() {
            if (!this._iconSentinel)
                return;
            let maxX = 0;
            let maxY = 0;
            this._icons.forEach(icon => {
                const el = icon.getElement();
                const x = parseInt(el.style.left || '0', 10) + el.offsetWidth;
                const y = parseInt(el.style.top || '0', 10) + el.offsetHeight;
                if (x > maxX)
                    maxX = x;
                if (y > maxY)
                    maxY = y;
            });
            this._iconSentinel.style.left = `${maxX}px`;
            this._iconSentinel.style.top = `${maxY}px`;
        }
        // ── Snap helpers ─────────────────────────────────────────
        _makeSnapFn(draggingId) {
            return (x, y, w, h) => {
                // 收集所有其他 icon 的 rect
                const others = Array.from(this._icons.entries())
                    .filter(([id]) => id !== draggingId)
                    .map(([, icon]) => {
                    const el = icon.getElement();
                    return {
                        x: parseInt(el.style.left || '0', 10),
                        y: parseInt(el.style.top || '0', 10),
                        width: el.offsetWidth,
                        height: el.offsetHeight,
                    };
                });
                const containerW = this._iconAreaEl.offsetWidth;
                const containerH = this._iconAreaEl.offsetHeight;
                const result = snapPosition({ x, y, width: w, height: h }, { width: containerW, height: containerH }, others, this._iconSnapThreshold);
                // 更新 guide 線
                const guideV = this._guideV;
                const guideH = this._guideH;
                const vGuide = result.guides.find(g => g.axis === 'v');
                const hGuide = result.guides.find(g => g.axis === 'h');
                if (guideV) {
                    guideV.style.display = vGuide ? 'block' : 'none';
                    if (vGuide)
                        guideV.style.left = `${vGuide.pos}px`;
                }
                if (guideH) {
                    guideH.style.display = hGuide ? 'block' : 'none';
                    if (hGuide)
                        guideH.style.top = `${hGuide.pos}px`;
                }
                return { x: result.x, y: result.y };
            };
        }
        _hideSnapGuides() {
            if (this._guideV)
                this._guideV.style.display = 'none';
            if (this._guideH)
                this._guideH.style.display = 'none';
        }
        _emitItemsChanged(reason, source) {
            this.events.emit('items:changed', {
                source,
                reason,
                items: this.getItems(),
            });
        }
        _emitItemsRefreshed(reason, source) {
            this.events.emit('items:refreshed', {
                source,
                reason,
                items: this.getItems(),
            });
        }
        _clearIcons() {
            this._icons.forEach(icon => icon.destroy());
            this._icons.clear();
            this._autoIconIndex = 0;
            this._updateSentinel();
        }
        _renderItems(items) {
            this._clearIcons();
            items.forEach(item => this._mountIcon(item, false));
            this._updateSentinel();
        }
        _mountIcon(config, emit) {
            if (this._icons.has(config.id))
                return null;
            const savedPositions = this._loadPositions();
            const saved = savedPositions[config.id];
            let x = config.x ?? saved?.x;
            let y = config.y ?? saved?.y;
            if (x === undefined || y === undefined) {
                const auto = autoPosition(this._autoIconIndex++);
                x = x ?? auto.x;
                y = y ?? auto.y;
            }
            else {
                this._autoIconIndex++;
            }
            const item = { ...config, x, y };
            const snapFn = this._iconSnapEnabled ? this._makeSnapFn(config.id) : null;
            const icon = new DesktopIcon({
                ...item,
                action: () => {
                    const eventItem = this.getItem(config.id) ?? item;
                    this.events.emit('icon:activated', {
                        id: config.id,
                        item: eventItem,
                        items: this.getItems(),
                    });
                    config.action?.();
                },
            }, this._iconAreaEl, (id, nextX, nextY) => { this._handleIconMoved(id, nextX, nextY); }, this._dragThreshold, snapFn, snapFn ? () => { this._hideSnapGuides(); } : null, (id) => {
                const eventItem = this.getItem(id) ?? item;
                this.events.emit('icon:selected', {
                    id,
                    item: eventItem,
                    items: this.getItems(),
                });
            });
            icon.setPosition(x, y);
            this._iconAreaEl.appendChild(icon.getElement());
            this._icons.set(config.id, icon);
            this._updateSentinel();
            if (emit) {
                this.events.emit('icon:added', {
                    id: config.id,
                    item,
                    items: this.getItems(),
                });
            }
            return item;
        }
        _removeIconElement(id, emit) {
            const icon = this._icons.get(id);
            if (!icon)
                return undefined;
            const item = this.getItem(id) ?? icon.getConfig();
            icon.destroy();
            this._icons.delete(id);
            this._updateSentinel();
            if (emit) {
                this.events.emit('icon:removed', {
                    id,
                    item,
                    items: this.getItems(),
                });
            }
            return item;
        }
        _handleIconMoved(id, x, y) {
            this._savePositions();
            this._itemsView?.update(id, { x, y }, {
                source: 'desktop',
                emit: false,
            });
            const item = this.getItem(id);
            if (!item)
                return;
            this.events.emit('icon:moved', {
                id,
                x,
                y,
                item,
                items: this.getItems(),
            });
            this._emitItemsChanged('icon:moved', 'desktop');
        }
        // ── Public API ────────────────────────────────────────────
        setItemsSource(source, options = {}) {
            this._itemsViewOff?.();
            this._itemsViewOff = null;
            this._itemsView = source instanceof DesktopCollectionView
                ? source
                : new DesktopCollectionView(source);
            this._itemsViewOff = this._itemsView.collectionChanged.on('change', (change) => {
                if (change.source === 'desktop')
                    return;
                this._renderItems(this._itemsView?.items ?? []);
                this._emitItemsRefreshed(change.action, change.source || 'itemsSource');
                this._emitItemsChanged(change.action, change.source || 'itemsSource');
            });
            this._renderItems(this._itemsView.items);
            if (options.emit !== false) {
                this._emitItemsRefreshed('reset', options.source ?? 'api');
                this._emitItemsChanged('reset', options.source ?? 'api');
            }
        }
        getCollectionView() {
            return this._itemsView;
        }
        getItems() {
            const sourceItems = this._itemsView?.items ?? [];
            return sourceItems.map(item => {
                const icon = this._icons.get(item.id);
                if (!icon)
                    return { ...item };
                const el = icon.getElement();
                return {
                    ...item,
                    x: parseInt(el.style.left || `${item.x ?? 0}`, 10),
                    y: parseInt(el.style.top || `${item.y ?? 0}`, 10),
                };
            });
        }
        getItem(id) {
            return this.getItems().find(item => item.id === id);
        }
        setItems(items) {
            if (!this._itemsView) {
                this.setItemsSource(items, { source: 'api' });
                return;
            }
            this._itemsView.setSourceCollection(items, { source: 'desktop', emit: false });
            this._renderItems(this._itemsView.items);
            this._emitItemsRefreshed('reset', 'api');
            this._emitItemsChanged('reset', 'api');
        }
        refreshItems() {
            this._itemsView?.refresh({ source: 'desktop', emit: false });
            this._renderItems(this._itemsView?.items ?? []);
            this._emitItemsRefreshed('refresh', 'api');
        }
        refresh() {
            this.refreshItems();
        }
        updateItem(id, patch) {
            const item = this._itemsView?.update(id, patch, { source: 'desktop', emit: false });
            if (!item)
                return undefined;
            this._renderItems(this._itemsView?.items ?? []);
            this._emitItemsChanged('icon:update', 'api');
            return { ...item };
        }
        /**
         * 新增桌面圖示。
         * 位置優先順序：config.x/y > localStorage 記憶 > 自動排列
         */
        addIcon(config) {
            if (!this._itemsView)
                this.setItemsSource([], { emit: false });
            if (this._itemsView?.getItem(config.id))
                return;
            const item = this._mountIcon(config, true);
            if (!item)
                return;
            this._itemsView?.add(item, { source: 'desktop' });
            this._emitItemsChanged('icon:add', 'desktop');
        }
        /** 移除桌面圖示 */
        removeIcon(id) {
            const removed = this._removeIconElement(id, true);
            if (!removed)
                return;
            this._itemsView?.remove(id, { source: 'desktop' });
            this._emitItemsChanged('icon:remove', 'desktop');
        }
        /** 取得 Dock 實例，可動態增減 Dock 項目 */
        getDock() {
            return this._dock;
        }
        /**
         * 動態變更 Dock 停靠位置（top | bottom | left | right）。
         * 同時更新 icon 區域 inset，使 icon 不被 Dock 遮住。
         */
        setDockPosition(position) {
            this._dock.setPosition(position);
            this._applyInset(dockInset(position, DOCK_SIZE));
            this.events.emit('dock:position-changed', { position });
        }
        /**
         * 將 Dock 與 WindowManager 視窗生命週期同步。
         * - 開窗：新增 Dock item
         * - 關窗：移除 Dock item
         * - 點擊 Dock item：預設 focus 視窗（可覆寫）
         *
         * 這個方法只管理「同步產生」的 Dock item；使用者手動 addItem 的 launcher
         * 不會被 cleanup 移除。若要同一個 app 只顯示一個 running item，保留
         * `dedupeByAppId: true`；若每個視窗都要一個 Dock item，改成 false。
         */
        syncDockWithWindows(manager, options = {}) {
            this.unsyncDockWithWindows();
            // 預設把 `app-foo` 視為 appId `foo`，方便桌面 app 用穩定 app id 去重。
            // WorkspaceManager 會另外提供 `getAppIdFromWorkspaceWindowId()` 供跨工作區使用。
            const getAppIdFromWindowId = options.getAppIdFromWindowId ?? ((windowId) => {
                if (windowId.startsWith('app-'))
                    return windowId.slice(4);
                return windowId;
            });
            const getDockItem = options.getDockItem ?? ((appId, event) => ({
                label: event.label ?? event.title ?? appId,
                icon: event.icon ?? '🪟',
            }));
            const onDockItemClick = options.onDockItemClick;
            const dockItemIdPrefix = options.dockItemIdPrefix ?? 'running-';
            const dedupeByAppId = options.dedupeByAppId ?? true;
            const syncExisting = options.syncExisting ?? true;
            // runningDockIds 是本次 sync 建立的 Dock item 清單，cleanup 只移除這些。
            // dockIdToWindowId 記錄目前 Dock item 對應的最後一個 live window。
            const runningDockIds = new Set();
            const dockIdToWindowId = new Map();
            let activeDockId = null;
            const enablePreview = options.showWindowPreview !== false;
            const previewCardW = options.previewSize?.width ?? PREVIEW_CARD_W;
            const previewCardH = options.previewSize?.height ?? PREVIEW_CARD_H;
            const previewMountEl = options.previewMountEl; // undefined = 自動偵測 .v-application
            let previewEl = null;
            let previewShowTimer;
            let previewHideTimer;
            const hoverCleanups = [];
            const hideGroupPreview = () => {
                clearTimeout(previewShowTimer);
                clearTimeout(previewHideTimer);
                previewEl?.remove();
                previewEl = null;
            };
            const scheduleHide = () => {
                clearTimeout(previewHideTimer);
                previewHideTimer = setTimeout(hideGroupPreview, 120);
            };
            const showGroupPreview = (anchorEl, parentWindowId) => {
                clearTimeout(previewShowTimer);
                clearTimeout(previewHideTimer);
                previewShowTimer = setTimeout(() => {
                    hideGroupPreview();
                    // 收集父視窗 + 所有子視窗。子視窗不獨立出現在 Dock，但會在群組預覽中顯示。
                    const childIds = manager.getChildIds?.(parentWindowId) ?? [];
                    const windowIds = [parentWindowId, ...childIds];
                    const onCardClick = (winId) => {
                        manager.focus?.(winId);
                        hideGroupPreview();
                    };
                    const onCardClose = (winId) => {
                        // 若要關閉的視窗有 modal 子視窗，阻止並提示
                        if (manager.getChildIds) {
                            const children = manager.getChildIds(winId);
                            const modalChildId = children.find(cid => {
                                const cs = manager.getState?.(cid);
                                return cs?.modal === true;
                            });
                            if (modalChildId) {
                                // 搖晃 modal 子視窗本體
                                manager.shake?.(modalChildId);
                                // 搖晃群組預覽中對應的卡片
                                const card = previewEl?.querySelector(`[data-window-id="${modalChildId}"]`);
                                if (card) {
                                    card.classList.add('dp-group-card--shake');
                                    setTimeout(() => card.classList.remove('dp-group-card--shake'), 400);
                                }
                                return;
                            }
                        }
                        manager.close?.(winId);
                        // 移除已關閉的卡片
                        const card = previewEl?.querySelector(`[data-window-id="${winId}"]`);
                        card?.remove();
                        // 無卡片則關閉 popup
                        if (previewEl && previewEl.querySelectorAll('.dp-dock-group-card').length === 0) {
                            hideGroupPreview();
                        }
                    };
                    previewEl = buildGroupPreview({
                        anchorEl,
                        dockPos: this._dock.getPosition(),
                        windowIds,
                        getWindowEl: (id) => manager.getWindowElement?.(id),
                        getWinState: (id) => manager.getState?.(id),
                        cardW: previewCardW,
                        cardH: previewCardH,
                        onCardClick,
                        onCardClose,
                        mountEl: previewMountEl,
                    });
                    // Sticky hover：滑鼠移入 popup 時取消隱藏計時器
                    previewEl.addEventListener('mouseenter', () => clearTimeout(previewHideTimer));
                    previewEl.addEventListener('mouseleave', scheduleHide);
                    // 掛載到 _mountEl（.v-application 或 document.body），確保 CSS scope 繼承
                    const mount = previewEl._mountEl ?? document.body;
                    mount.appendChild(previewEl);
                    requestAnimationFrame(() => previewEl?.classList.add('dp-dock-group-preview--visible'));
                }, 280);
            };
            const attachGroupHover = (dockId, windowId) => {
                if (!enablePreview)
                    return;
                const itemEl = this._dock.getItemElement(dockId);
                if (!itemEl)
                    return;
                const enter = () => showGroupPreview(itemEl, windowId);
                const leave = () => scheduleHide();
                itemEl.addEventListener('mouseenter', enter);
                itemEl.addEventListener('mouseleave', leave);
                hoverCleanups.push(() => {
                    itemEl.removeEventListener('mouseenter', enter);
                    itemEl.removeEventListener('mouseleave', leave);
                });
            };
            /** Dock._render() 每次都重建 DOM，必須重綁所有 hover 事件 */
            const refreshAllPreviewHovers = () => {
                hoverCleanups.forEach(fn => fn());
                hoverCleanups.length = 0;
                runningDockIds.forEach(id => {
                    const wid = dockIdToWindowId.get(id);
                    if (wid)
                        attachGroupHover(id, wid);
                });
            };
            const toDockId = (appId, windowId) => {
                const key = dedupeByAppId ? appId : windowId;
                return `${dockItemIdPrefix}${key}`;
            };
            const addDockItemForWindow = (event) => {
                if (!event?.id)
                    return;
                // 子視窗（有 parentId）不在 Dock 獨立顯示；改由父視窗群組預覽呈現。
                if (event.parentId)
                    return;
                const appId = getAppIdFromWindowId(event.id);
                if (!appId)
                    return;
                const dockId = toDockId(appId, event.id);
                dockIdToWindowId.set(dockId, event.id);
                if (runningDockIds.has(dockId))
                    return;
                const item = getDockItem(appId, event);
                if (!item)
                    return;
                runningDockIds.add(dockId);
                this._dock.addItem({
                    id: dockId,
                    label: item.label,
                    icon: item.icon,
                    action: () => {
                        const liveWindowId = dockIdToWindowId.get(dockId) ?? event.id;
                        if (onDockItemClick) {
                            onDockItemClick(appId, liveWindowId);
                            return;
                        }
                        // 首先 focus 父視窗
                        manager.focus?.(liveWindowId);
                        // 同時确保所有子視窗也 restore + 置頂
                        if (manager.getChildIds) {
                            const childIds = manager.getChildIds(liveWindowId);
                            childIds.forEach(childId => {
                                manager.focus?.(childId);
                            });
                            // 最後再肁焦父視窗（讓子視窗繼續高於父）
                            if (childIds.length > 0) {
                                manager.focus?.(liveWindowId);
                            }
                        }
                    },
                });
                // 新視窗開啟後即為 active（WindowManager 不另外 emit window:focused）
                activeDockId = dockId;
                this._dock.setActiveItem(dockId);
                // hover 重綁由 onRender 統一處理（addItem 會觸發 _render → onRender）。
                // 不在這裡直接 attach，避免 Dock 重排 / render 後 listener 掛到舊 DOM。
            };
            const removeDockItemForWindow = (event) => {
                if (!event?.id)
                    return;
                const appId = getAppIdFromWindowId(event.id);
                if (!appId)
                    return;
                const dockId = toDockId(appId, event.id);
                dockIdToWindowId.delete(dockId);
                if (!runningDockIds.has(dockId))
                    return;
                runningDockIds.delete(dockId);
                this._dock.removeItem(dockId);
                // 若關閉的視窗正好是 active，清除高亮
                if (activeDockId === dockId) {
                    activeDockId = null;
                    this._dock.setActiveItem(null);
                }
            };
            const setFocused = (event) => {
                if (!event?.id)
                    return;
                const appId = getAppIdFromWindowId(event.id);
                if (!appId)
                    return;
                const dockId = toDockId(appId, event.id);
                activeDockId = runningDockIds.has(dockId) ? dockId : null;
                this._dock.setActiveItem(activeDockId);
            };
            const offOpened = manager.events.on('window:opened', addDockItemForWindow);
            const offClosed = manager.events.on('window:closed', removeDockItemForWindow);
            const offFocused = manager.events.on('window:focused', setFocused);
            // 拖曳排序後 Dock 重建 DOM，需重綁所有 hover
            const offRender = enablePreview ? this._dock.onRender(refreshAllPreviewHovers) : () => { };
            if (syncExisting && manager.getWindowIds) {
                manager.getWindowIds().forEach((id) => {
                    const state = manager.getState?.(id);
                    addDockItemForWindow({
                        id,
                        title: state?.title,
                        label: state?.label,
                        icon: state?.icon,
                        parentId: state?.parentId, // 正確過濾已存在的子視窗
                    });
                });
            }
            const cleanup = () => {
                offOpened();
                offClosed();
                offFocused();
                offRender();
                hideGroupPreview();
                hoverCleanups.forEach(fn => fn());
                hoverCleanups.length = 0;
                runningDockIds.forEach((dockId) => this._dock.removeItem(dockId));
                runningDockIds.clear();
                dockIdToWindowId.clear();
                activeDockId = null;
                this._dock.setActiveItem(null);
                if (this._dockSyncCleanup === cleanup) {
                    this._dockSyncCleanup = null;
                }
            };
            this._dockSyncCleanup = cleanup;
            return cleanup;
        }
        /** 停止 Dock 與 WindowManager 同步，並移除同步產生的 Dock items。 */
        unsyncDockWithWindows() {
            this._dockSyncCleanup?.();
            this._dockSyncCleanup = null;
        }
        /** 取得視窗區域元素（排除 Dock，供 WindowManager 使用） */
        getElement() {
            return this._windowAreaEl;
        }
        /** 取得桌面根元素（含 Dock） */
        getDesktopElement() {
            return this._desktopEl;
        }
        /** 取得圖示區域元素 */
        getIconArea() {
            return this._iconAreaEl;
        }
        /** 銷毀桌面，清除所有 DOM */
        destroy() {
            this.unsyncDockWithWindows();
            this._itemsViewOff?.();
            this._itemsViewOff = null;
            this._icons.forEach(icon => icon.destroy());
            this._icons.clear();
            this._itemsView = null;
            this._dock.destroy();
            this._desktopEl.remove();
            this.events.emit('desktop:destroyed', {
                source: 'desktop',
                reason: 'destroy',
                items: [],
            });
            this.events.clearAll();
        }
    }

    var WORKSPACE_CSS = "/* ============================================================\r\n   DeskPane — Workspace Styles\r\n   工作區容器佈局 + 左右滑入動畫\r\n   ============================================================ */\r\n\r\n/* ── Root container ──────────────────────────────────────── */\r\n\r\n/**\r\n * WorkspaceManager 掛載的根容器。\r\n * position:relative + overflow:hidden 讓工作區在裡面滑動。\r\n * pointer-events:none 讓空白處事件穿透到下方的 icon-area。\r\n */\r\n.dp-workspace-root {\r\n  position: relative;\r\n  overflow: hidden;\r\n  width: 100%;\r\n  height: 100%;\r\n  pointer-events: none;\r\n}\r\n\r\n/* ── Workspace container ─────────────────────────────────── */\r\n\r\n.dp-workspace {\n  /* !important：防止 .dp-isolated { position: relative } 被後注入的 Core CSS 覆蓋 */\n  position: absolute !important;\n  inset: 0;\n  display: none;\n  width: 100%;\n  height: 100%;\n  /* 非活躍工作區：平移到可見範圍外 */\r\n  transform: translateX(100%);\r\n  /* 切換時滑入 */\r\n  transition: transform var(--dp-workspace-animation-ms, 250ms) cubic-bezier(0.4, 0, 0.2, 1);\r\n  /* 非活躍時不接受滑鼠事件，避免誤觸 */\r\n  pointer-events: none;\n  visibility: hidden;\n}\n\n.dp-workspace[hidden] {\n  display: none !important;\n  visibility: hidden !important;\n  pointer-events: none !important;\n}\n\n.dp-workspace.dp-workspace--active,\n.dp-workspace.dp-workspace--enter-right,\n.dp-workspace.dp-workspace--enter-left,\n.dp-workspace.dp-workspace--leave-left,\n.dp-workspace.dp-workspace--leave-right {\n  display: block;\n  visibility: visible;\n}\n\n.dp-workspace.dp-workspace--active {\n  transform: translateX(0);\n  pointer-events: none;\n}\n\n/* Only the active workspace may receive window interactions.\n   This matters when frameworks keep offscreen workspace DOM mounted\n   for state preservation (Vue KeepAlive / Teleport, React portals, etc.). */\n.dp-workspace .dp-window {\n  pointer-events: none;\n}\n\n.dp-workspace.dp-workspace--active .dp-window {\n  pointer-events: auto;\n}\n\n/* 從右往左：下一個工作區（切換到更大 index）初始位置在右側 */\n.dp-workspace.dp-workspace--enter-right {\n  transform: translateX(100%);\r\n}\r\n\r\n/* 從左往右：下一個工作區（切換到更小 index）初始位置在左側 */\r\n.dp-workspace.dp-workspace--enter-left {\r\n  transform: translateX(-100%);\r\n}\r\n\r\n/* 離開動畫：向左滑出 */\r\n.dp-workspace.dp-workspace--leave-left {\r\n  transform: translateX(-100%);\r\n}\r\n\r\n/* 離開動畫：向右滑出 */\r\n.dp-workspace.dp-workspace--leave-right {\r\n  transform: translateX(100%);\r\n}\r\n\r\n/* ── Workspace indicator bar ─────────────────────────────── */\r\n\r\n.dp-workspace-indicator {\r\n  position: absolute;\r\n  bottom: 8px;\r\n  left: 50%;\r\n  transform: translateX(-50%);\r\n  display: flex;\r\n  gap: 6px;\r\n  z-index: 9990;\r\n  pointer-events: none;\r\n}\r\n\r\n.dp-workspace-dot {\r\n  width: 6px;\r\n  height: 6px;\r\n  border-radius: 50%;\r\n  background: var(--dp-workspace-dot-bg, rgba(255, 255, 255, 0.4));\r\n  transition: background 0.2s, transform 0.2s;\r\n}\r\n\r\n.dp-workspace-dot.dp-workspace-dot--active {\r\n  background: var(--dp-workspace-dot-active-bg, rgba(255, 255, 255, 0.9));\r\n  transform: scale(1.3);\r\n}\r\n";

    // ============================================================
    // DeskPane — WorkspaceManager
    // 管理多個虛擬工作區（每個工作區有獨立的 WindowManager + 容器）
    // 支援：
    //   • addWorkspace / removeWorkspace / switchTo
    //   • 左右滑入動畫（CSS transform）
    //   • 工作區指示點（可選）
    //   • EventBus：workspace:added / workspace:removed / workspace:switched
    // ============================================================
    const WORKSPACE_STYLE_ID = 'dp-workspace-styles';
    const WORKSPACE_WINDOW_ID_SEPARATOR = '::app-';
    function injectWorkspaceStyles() {
        injectRuntimeCSS({
            id: WORKSPACE_STYLE_ID,
            css: WORKSPACE_CSS,
            hrefPart: 'deskpane-workspace.css',
            fingerprint: 'DeskPane — Workspace CSS',
        });
    }
    /**
     * Build a window id that is unique across workspaces for the same app id.
     * 格式預設為 `workspaceId::app-appId`，讓同一個 app 可在不同工作區同時存在。
     */
    function createWorkspaceWindowId(workspaceId, appId, options = {}) {
        const separator = options.separator ?? WORKSPACE_WINDOW_ID_SEPARATOR;
        return `${workspaceId}${separator}${appId}`;
    }
    /** Parse an id created by `createWorkspaceWindowId()`; raw window id 會回傳 null。 */
    function parseWorkspaceWindowId(windowId, options = {}) {
        const separator = options.separator ?? WORKSPACE_WINDOW_ID_SEPARATOR;
        const index = windowId.indexOf(separator);
        if (index <= 0)
            return null;
        const workspaceId = windowId.slice(0, index);
        const appId = windowId.slice(index + separator.length);
        if (!workspaceId || !appId)
            return null;
        return { workspaceId, appId };
    }
    /**
     * Return the app id from a scoped window id, or a sensible fallback.
     * Dock sync 會用 app id 做去重；因此 workspace-scoped id 必須能拆回穩定 app id。
     */
    function getAppIdFromWorkspaceWindowId(windowId, options = {}) {
        return parseWorkspaceWindowId(windowId, options)?.appId
            ?? (windowId.startsWith('app-') ? windowId.slice(4) : windowId);
    }
    class WorkspaceManager {
        constructor(container, options = {}) {
            this._workspaces = new Map();
            this._windowManagers = new Map();
            this._windowManagerCleanups = new Map();
            this._currentId = null;
            this._isAnimating = false;
            this._indicatorEl = null;
            const el = typeof container === 'string'
                ? (() => {
                    const found = document.querySelector(container);
                    if (!found)
                        throw new Error(`[WorkspaceManager] Container not found: ${container}`);
                    return found;
                })()
                : container;
            this._animationMs = options.animationMs ?? 250;
            this._wmOptions = {
                ...(options.windowManagerOptions ?? {}),
                injectStyles: options.windowManagerOptions?.injectStyles ?? options.injectStyles,
            };
            this._warnOnDuplicateWindowIds = options.warnOnDuplicateWindowIds ?? true;
            this.events = new EventBus();
            if (options.injectStyles !== false)
                injectWorkspaceStyles();
            // Wrap the container. 使用額外 root 而不是直接改傳入元素，可讓 destroy() 乾淨移除 DeskPane DOM。
            this._root = document.createElement('div');
            this._root.className = 'dp-workspace-root';
            // Pass animation duration as CSS variable
            this._root.style.setProperty('--dp-workspace-animation-ms', `${this._animationMs}ms`);
            el.appendChild(this._root);
        }
        // ── Public API ─────────────────────────────────────────────
        /** 所有工作區的唯讀清單 */
        get workspaces() {
            return [...this._workspaces.values()];
        }
        /** 目前活躍的工作區，若尚無工作區則為 null */
        get current() {
            return this._currentId ? (this._workspaces.get(this._currentId) ?? null) : null;
        }
        /**
         * 新增工作區。
         * 若目前沒有活躍工作區，自動切換到新建的工作區。
         */
        addWorkspace(config) {
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
            const state = {
                id: config.id,
                label: config.label ?? config.id,
                icon: config.icon,
                container: wsEl,
            };
            this._workspaces.set(config.id, state);
            this._windowManagers.set(config.id, wm);
            this._updateIndicator();
            this.events.emit('workspace:added', state);
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
        removeWorkspace(id) {
            const state = this._workspaces.get(id);
            if (!state)
                return;
            const wm = this._windowManagers.get(id);
            wm?.destroy();
            this._windowManagerCleanups.get(id)?.forEach(dispose => dispose());
            this._windowManagerCleanups.delete(id);
            state.container.remove();
            this._workspaces.delete(id);
            this._windowManagers.delete(id);
            this._updateIndicator();
            this.events.emit('workspace:removed', { id });
            // If current was removed, switch to nearest remaining workspace
            if (this._currentId === id) {
                this._currentId = null;
                const remaining = [...this._workspaces.keys()];
                if (remaining.length > 0) {
                    this._activateImmediate(remaining[0]);
                    this.events.emit('workspace:switched', {
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
        switchTo(id) {
            if (id === this._currentId)
                return;
            if (this._isAnimating)
                return;
            const next = this._workspaces.get(id);
            if (!next)
                throw new Error(`[WorkspaceManager] Workspace not found: ${id}`);
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
                this.events.emit('workspace:switched', {
                    from: prevId,
                    to: id,
                });
            };
            if (this._animationMs > 0) {
                let cleanupCalled = false;
                const safeCleanup = () => {
                    if (cleanupCalled)
                        return;
                    cleanupCalled = true;
                    nextEl.removeEventListener('transitionend', safeCleanup);
                    cleanup();
                };
                nextEl.addEventListener('transitionend', safeCleanup, { once: true });
                // Fallback: ensure cleanup fires even if transitionend doesn't fire
                setTimeout(safeCleanup, this._animationMs + 50);
            }
            else {
                cleanup();
            }
        }
        /**
         * 取得指定工作區的 WindowManager。
         * 用於直接呼叫 wm.open() / wm.close() 等操作。
         */
        getWindowManager(workspaceId) {
            const wm = this._windowManagers.get(workspaceId);
            if (!wm)
                throw new Error(`[WorkspaceManager] Workspace not found: ${workspaceId}`);
            return wm;
        }
        /**
         * Build a workspace-scoped window id for an app.
         * Defaults to the current workspace when `workspaceId` is omitted.
         */
        createWindowId(appId, workspaceId = this._currentId) {
            if (!workspaceId)
                throw new Error('[WorkspaceManager] No active workspace');
            return createWorkspaceWindowId(workspaceId, appId);
        }
        /**
         * Open a window in a workspace.
         * Prefer `appId` over manually reusing raw ids across workspaces; DeskPane
         * will generate a scoped id such as `ws-2::app-counter`.
         */
        openWindow(config) {
            const workspaceId = config.workspaceId ?? this._currentId;
            if (!workspaceId)
                throw new Error('[WorkspaceManager] No active workspace');
            const wm = this.getWindowManager(workspaceId);
            const { workspaceId: _workspaceId, appId, ...windowConfig } = config;
            const id = config.id ?? (appId ? createWorkspaceWindowId(workspaceId, appId) : null);
            if (!id) {
                throw new Error('[WorkspaceManager] openWindow() requires either id or appId');
            }
            return wm.open({
                ...windowConfig,
                id,
            });
        }
        /**
         * 啟用工作區指示點（小圓點）。
         * 會在根容器底部顯示，指示當前所在工作區。
         */
        enableIndicator() {
            if (this._indicatorEl)
                return;
            const bar = document.createElement('div');
            bar.className = 'dp-workspace-indicator';
            this._root.appendChild(bar);
            this._indicatorEl = bar;
            this._updateIndicator();
        }
        disableIndicator() {
            this._indicatorEl?.remove();
            this._indicatorEl = null;
        }
        /** 銷毀所有工作區並清理資源 */
        destroy() {
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
        _activateImmediate(id) {
            const state = this._workspaces.get(id);
            if (!state)
                return;
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
        _setWorkspaceInteractive(el, interactive) {
            // 非 active workspace 保留 DOM 但禁止互動，避免點擊穿透或 tab focus 跑進隱藏桌面。
            el.inert = !interactive;
            if (interactive) {
                el.removeAttribute('aria-hidden');
            }
            else {
                el.setAttribute('aria-hidden', 'true');
            }
        }
        _setWorkspaceVisible(el, visible) {
            // hidden 控制 layout/可見性；inert/aria-hidden 控制互動與輔助技術。
            // 兩者分開是因為動畫期間 next workspace 需要 visible 但還沒 active。
            el.hidden = !visible;
        }
        _subscribeWindowManager(workspaceId, wm) {
            if (!this._warnOnDuplicateWindowIds)
                return;
            const offOpened = wm.events.on('window:opened', (state) => {
                if (!state?.id)
                    return;
                this._warnDuplicateWindowId(workspaceId, state.id);
            });
            this._windowManagerCleanups.set(workspaceId, [offOpened]);
        }
        _warnDuplicateWindowId(workspaceId, windowId) {
            // raw id 在不同 workspace 重複時，Portal/Teleport 和 Dock sync 很容易對到錯視窗。
            // 這裡只警告不阻擋，保留低階 API 的彈性；推薦使用 openWindow({ appId })。
            if (parseWorkspaceWindowId(windowId))
                return;
            const duplicates = [];
            this._windowManagers.forEach((wm, otherWorkspaceId) => {
                if (otherWorkspaceId === workspaceId)
                    return;
                if (wm.getState(windowId))
                    duplicates.push(otherWorkspaceId);
            });
            if (duplicates.length === 0)
                return;
            const scopedExample = createWorkspaceWindowId(workspaceId, getAppIdFromWorkspaceWindowId(windowId));
            console.warn(`[WorkspaceManager] Window id "${windowId}" is also open in workspace(s): ${duplicates.join(', ')}. ` +
                `Duplicate raw ids across workspaces can confuse Dock sync and framework Portal/Teleport targets. ` +
                `Use WorkspaceManager.openWindow({ appId: "${getAppIdFromWorkspaceWindowId(windowId)}", ... }) ` +
                `or createWorkspaceWindowId("${workspaceId}", "${getAppIdFromWorkspaceWindowId(windowId)}") ` +
                `for an id like "${scopedExample}".`);
        }
        /** 更新底部指示點 */
        _updateIndicator() {
            if (!this._indicatorEl)
                return;
            this._indicatorEl.innerHTML = '';
            this._workspaces.forEach((_, id) => {
                const dot = document.createElement('div');
                dot.className = 'dp-workspace-dot' + (id === this._currentId ? ' dp-workspace-dot--active' : '');
                this._indicatorEl.appendChild(dot);
            });
        }
    }

    var TASKVIEW_CSS = "/* ============================================================\r\n   DeskPane — TaskView Styles\r\n   Task View overlay for virtual desktop switching\r\n   ============================================================ */\r\n\r\n/* ── 覆蓋層 ── */\r\n.dp-task-view {\n  position: fixed;\n  inset: 0;\r\n  z-index: 99999;\r\n  display: flex;\r\n  align-items: center;\r\n  justify-content: center;\r\n  background: rgba(0, 0, 0, 0.55);\r\n  backdrop-filter: blur(8px);\r\n  -webkit-backdrop-filter: blur(8px);\r\n  opacity: 0;\r\n  pointer-events: none;\r\n  transition: opacity 0.2s;\n}\n.dp-task-view[hidden] {\n  display: none !important;\n  pointer-events: none !important;\n}\n.dp-task-view--open {\n  opacity: 1;\n  pointer-events: auto;\n}\n\r\n/* ── 面板 ── */\r\n.dp-task-view-panel {\r\n  display: flex;\r\n  align-items: flex-end;\r\n  gap: 14px;\r\n  padding: 20px 24px;\r\n  background: rgba(22, 28, 42, 0.92);\r\n  border: 1px solid rgba(255, 255, 255, 0.1);\r\n  border-radius: 16px;\r\n  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.65);\r\n  transform: translateY(16px);\r\n  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);\r\n  max-width: 90vw;\r\n  overflow-x: auto;\r\n}\r\n.dp-task-view--open .dp-task-view-panel {\r\n  transform: translateY(0);\r\n}\r\n\r\n/* ── 工作區卡片 ── */\r\n.dp-tv-card {\r\n  flex-shrink: 0;\r\n  display: flex;\r\n  flex-direction: column;\r\n  align-items: center;\r\n  gap: 8px;\r\n  cursor: pointer;\r\n  position: relative;\r\n}\r\n.dp-tv-preview {\r\n  width: 210px;\r\n  height: 132px;\r\n  background: rgba(255, 255, 255, 0.04);\r\n  border: 2px solid rgba(255, 255, 255, 0.14);\r\n  border-radius: 8px;\r\n  overflow: hidden;\r\n  transition: border-color 0.15s, box-shadow 0.15s;\r\n  position: relative;\r\n}\r\n.dp-tv-card:hover .dp-tv-preview {\r\n  border-color: rgba(255, 255, 255, 0.45);\r\n}\r\n.dp-tv-card--active .dp-tv-preview {\r\n  border-color: #0078d4;\r\n  box-shadow: 0 0 0 2px rgba(0, 120, 212, 0.35);\r\n}\r\n.dp-tv-label {\r\n  font-family: system-ui, sans-serif;\r\n  font-size: 12px;\r\n  color: rgba(255, 255, 255, 0.8);\r\n  white-space: nowrap;\r\n}\r\n.dp-tv-card--active .dp-tv-label {\r\n  color: #59aeff;\r\n  font-weight: 600;\r\n}\r\n\r\n/* ── 刪除按鈕 ── */\r\n.dp-tv-delete {\r\n  position: absolute;\r\n  top: -7px;\r\n  right: -7px;\r\n  width: 20px;\r\n  height: 20px;\r\n  border-radius: 50%;\r\n  background: rgba(50, 50, 55, 0.95);\r\n  border: 1px solid rgba(255, 255, 255, 0.18);\r\n  color: rgba(255, 255, 255, 0.7);\r\n  font-size: 11px;\r\n  cursor: pointer;\r\n  display: none;\r\n  align-items: center;\r\n  justify-content: center;\r\n  z-index: 1;\r\n  transition: background 0.1s;\r\n}\r\n.dp-tv-card:hover .dp-tv-delete { display: flex; }\r\n.dp-tv-delete:hover { background: #c42b1c; color: #fff; }\r\n\r\n/* ── 新增桌面按鈕 ── */\r\n.dp-tv-add-wrap {\r\n  flex-shrink: 0;\r\n  display: flex;\r\n  flex-direction: column;\r\n  align-items: center;\r\n  gap: 8px;\r\n  cursor: pointer;\r\n}\r\n.dp-tv-add {\r\n  width: 210px;\r\n  height: 132px;\r\n  border: 2px dashed rgba(255, 255, 255, 0.18);\r\n  border-radius: 8px;\r\n  display: flex;\r\n  align-items: center;\r\n  justify-content: center;\r\n  font-size: 36px;\r\n  color: rgba(255, 255, 255, 0.35);\r\n  transition: border-color 0.15s, color 0.15s;\r\n}\r\n.dp-tv-add-wrap:hover .dp-tv-add {\r\n  border-color: rgba(255, 255, 255, 0.5);\r\n  color: rgba(255, 255, 255, 0.7);\r\n}\r\n.dp-tv-add-label {\r\n  font-family: system-ui, sans-serif;\r\n  font-size: 12px;\r\n  color: rgba(255, 255, 255, 0.45);\r\n}\r\n.dp-tv-add-wrap:hover .dp-tv-add-label { color: rgba(255, 255, 255, 0.7); }\r\n";

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
    const TASKVIEW_STYLE_ID = 'dp-taskview-styles';
    function injectTaskViewStyles() {
        injectRuntimeCSS({
            id: TASKVIEW_STYLE_ID,
            css: TASKVIEW_CSS,
            hrefPart: 'deskpane-taskview.css',
            fingerprint: 'DeskPane — TaskView CSS',
        });
    }
    class TaskView {
        constructor(wsMgr, options = {}) {
            this._isOpen = false;
            this._wsCounter = 0;
            this._wsMgr = wsMgr;
            this._opts = {
                target: options.target ?? document.body,
                allowAdd: options.allowAdd ?? true,
                allowDelete: options.allowDelete ?? true,
                keyboard: options.keyboard ?? true,
                closeOnBackdrop: options.closeOnBackdrop ?? true,
                injectStyles: options.injectStyles ?? true,
                showButton: options.showButton ?? true,
                buttonLabel: options.buttonLabel ?? '虛擬桌面',
                buttonIcon: options.buttonIcon ?? '⧉',
                buttonId: options.buttonId ?? 'dp-tv-button',
                onCreateWorkspace: options.onCreateWorkspace,
                dock: options.dock,
            };
            this._buttonId = this._opts.buttonId;
            if (this._opts.injectStyles)
                injectTaskViewStyles();
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
                    id: this._buttonId,
                    label: this._opts.buttonLabel,
                    icon: this._opts.buttonIcon,
                    action: () => this.toggle(),
                }, 0);
            }
            // ── 綁定事件 ───────────────────────────────────────────
            if (this._opts.closeOnBackdrop) {
                this._overlayEl.addEventListener('click', (e) => {
                    if (e.target === this._overlayEl)
                        this.close();
                });
            }
            this._onKeyDown = (e) => {
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
                if (this._isOpen)
                    this._render();
            };
            this._wsMgr.events.on('workspace:switched', this._onSwitched);
            // 計算初始 wsCounter（讓新增的桌面編號不重複）
            this._syncCounter();
        }
        // ── Public API ─────────────────────────────────────────────
        get isOpen() { return this._isOpen; }
        open() {
            if (this._isOpen)
                return;
            this._isOpen = true;
            this._overlayEl.hidden = false;
            this._render();
            this._overlayEl.classList.add('dp-task-view--open');
            this.events.emit('taskview:open', undefined);
        }
        close() {
            if (!this._isOpen) {
                this._overlayEl.classList.remove('dp-task-view--open');
                this._overlayEl.hidden = true;
                return;
            }
            this._isOpen = false;
            this._overlayEl.classList.remove('dp-task-view--open');
            this._overlayEl.hidden = true;
            this.events.emit('taskview:close', undefined);
        }
        toggle() {
            this._isOpen ? this.close() : this.open();
        }
        /** 銷毀 Task View，移除 DOM 與事件監聽 */
        destroy() {
            this.close();
            document.removeEventListener('keydown', this._onKeyDown);
            this._wsMgr.events.off('workspace:switched', this._onSwitched);
            if (this._opts.dock && this._opts.showButton) {
                this._opts.dock.removeItem(this._buttonId);
            }
            this._overlayEl.remove();
        }
        // ── Private ────────────────────────────────────────────────
        _syncCounter() {
            this._wsMgr.workspaces.forEach(ws => {
                const m = ws.id.match(/^ws-(\d+)$/);
                if (m) {
                    const n = parseInt(m[1], 10);
                    if (n > this._wsCounter)
                        this._wsCounter = n;
                }
            });
        }
        _render() {
            // 每次 open 或 workspace 切換都重建卡片，確保縮略圖反映最新 DOM。
            // 這裡不做長期 cache，因為視窗內容可能由 Vue/React portal 動態改變。
            this._panelEl.innerHTML = '';
            const workspaces = this._wsMgr.workspaces;
            const currentId = this._wsMgr.current?.id;
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
                lbl.className = 'dp-tv-label';
                lbl.textContent = ws.label;
                card.appendChild(lbl);
                // 刪除按鈕（需 allowDelete，且 > 1 個工作區才顯示）
                if (this._opts.allowDelete && workspaces.length > 1) {
                    const del = document.createElement('button');
                    del.className = 'dp-tv-delete';
                    del.textContent = '✕';
                    del.title = '刪除此桌面';
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
                addWrap.title = '新增虛擬桌面';
                const addBox = document.createElement('div');
                addBox.className = 'dp-tv-add';
                addBox.textContent = '+';
                const addLbl = document.createElement('div');
                addLbl.className = 'dp-tv-add-label';
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
        _defaultWorkspaceConfig() {
            this._wsCounter++;
            return { id: `ws-${this._wsCounter}`, label: `桌面 ${this._wsCounter}` };
        }
        /** DOM clone + CSS scale 縮略圖 */
        _buildPreview(preview, container) {
            const vw = container.offsetWidth || window.innerWidth;
            const vh = container.offsetHeight || window.innerHeight;
            const pw = 210;
            const ph = 132;
            const scale = Math.min(pw / vw, ph / vh);
            const wrapper = document.createElement('div');
            wrapper.style.cssText =
                `position:absolute;top:0;left:0;width:${vw}px;height:${vh}px;` +
                    `transform:scale(${scale});transform-origin:top left;` +
                    `pointer-events:none;overflow:hidden;`;
            const clone = container.cloneNode(true);
            // 原 workspace 可能是 hidden/inert/aria-hidden；縮略圖 clone 必須解除這些狀態才看得到。
            // pointer-events:none 則確保 clone 只是預覽，不會攔截 TaskView 的卡片點擊。
            clone.hidden = false;
            clone.inert = false;
            clone.removeAttribute('hidden');
            clone.removeAttribute('inert');
            clone.removeAttribute('aria-hidden');
            clone.classList.remove('dp-workspace--enter-right', 'dp-workspace--enter-left', 'dp-workspace--leave-left', 'dp-workspace--leave-right');
            clone.classList.add('dp-workspace--active');
            clone.style.cssText =
                'position:absolute;inset:0;width:100%;height:100%;' +
                    'transform:translateX(0);visibility:visible;transition:none;pointer-events:none;';
            wrapper.appendChild(clone);
            preview.appendChild(wrapper);
        }
    }

    const WM_DATA_KEY = 'dpWindowManager';
    const DESKTOP_DATA_KEY = 'dpDesktop';
    const WORKSPACE_DATA_KEY = 'dpWorkspaceManager';
    const TASKVIEW_DATA_KEY = 'dpTaskView';
    /**
     * Adapter 只需要 jQuery-like 的最小能力，而不是硬綁完整 jQuery 型別。
     * 這讓 Cash、Zepto 或測試 double 只要提供 each/data/length 也能工作。
     */
    function isJQueryLike(value) {
        return !!value
            && typeof value === 'object'
            && typeof value.each === 'function'
            && typeof value.data === 'function'
            && typeof value.length === 'number';
    }
    /**
     * 不使用 `instanceof WindowManager`，因為 UMD/ESM 分包或多份 deskpane bundle
     * 會讓 instanceof 失效。Duck typing 對 CDN 和 bundler mixed mode 比較穩。
     */
    function isWindowManagerLike(value) {
        return !!value
            && typeof value === 'object'
            && typeof value.open === 'function'
            && typeof value.close === 'function'
            && typeof value.getBodyElement === 'function';
    }
    function isWorkspaceManagerLike(value) {
        return !!value
            && typeof value === 'object'
            && typeof value.addWorkspace === 'function'
            && typeof value.switchTo === 'function'
            && typeof value.getWindowManager === 'function';
    }
    function firstElement(value) {
        if (!value)
            return null;
        if (typeof value === 'string') {
            const template = document.createElement('template');
            template.innerHTML = value.trim();
            return template.content.firstElementChild;
        }
        if (isJQueryLike(value))
            return value[0] ?? null;
        return value;
    }
    function normalizeWindowConfig(config, fallbackContent) {
        const content = firstElement(config.content) ?? fallbackContent ?? document.createElement('div');
        return {
            ...config,
            content,
        };
    }
    function getManagerApiFromElement($, el) {
        return $(el).data(WM_DATA_KEY);
    }
    function resolveManager($, manager) {
        // manager 可傳 instance、API wrapper、selector、HTMLElement 或 jQuery object。
        // resolve 順序由最明確到最寬鬆，避免 selector 字串誤判。
        if (isWindowManagerLike(manager))
            return manager;
        if (typeof manager === 'object' && manager && 'manager' in manager) {
            return manager.manager;
        }
        if (typeof manager === 'string') {
            const el = document.querySelector(manager);
            const api = el ? getManagerApiFromElement($, el) : undefined;
            if (api)
                return api.manager;
        }
        if (manager instanceof HTMLElement) {
            const api = getManagerApiFromElement($, manager);
            if (api)
                return api.manager;
        }
        if (isJQueryLike(manager)) {
            const api = manager.data(WM_DATA_KEY);
            if (api)
                return api.manager;
        }
        throw new Error('DeskPane jQuery adapter: manager was not found.');
    }
    function resolveDesktopApi($, desktop) {
        if (!desktop)
            return undefined;
        if (typeof desktop === 'object' && 'desktop' in desktop)
            return desktop;
        if (typeof desktop === 'string') {
            const el = document.querySelector(desktop);
            return el ? $(el).data(DESKTOP_DATA_KEY) : undefined;
        }
        if (desktop instanceof HTMLElement)
            return $(desktop).data(DESKTOP_DATA_KEY);
        if (isJQueryLike(desktop))
            return desktop.data(DESKTOP_DATA_KEY);
        return undefined;
    }
    function resolveWorkspaceApi($, workspace) {
        if (isWorkspaceManagerLike(workspace)) {
            return createWorkspaceManagerApi($, workspace, {});
        }
        if (typeof workspace === 'object' && workspace && 'workspaceManager' in workspace) {
            return workspace;
        }
        if (typeof workspace === 'string') {
            const el = document.querySelector(workspace);
            const api = el ? $(el).data(WORKSPACE_DATA_KEY) : undefined;
            if (api)
                return api;
        }
        if (workspace instanceof HTMLElement) {
            const api = $(workspace).data(WORKSPACE_DATA_KEY);
            if (api)
                return api;
        }
        if (isJQueryLike(workspace)) {
            const api = workspace.data(WORKSPACE_DATA_KEY);
            if (api)
                return api;
        }
        throw new Error('DeskPane jQuery adapter: workspace manager was not found.');
    }
    function createWindowManagerApi(manager) {
        return {
            manager,
            open(config) {
                return manager.open(normalizeWindowConfig(config));
            },
            close(id) { manager.close(id); },
            minimize(id) { manager.minimize(id); },
            maximize(id) { manager.maximize(id); },
            restore(id) { manager.restore(id); },
            focus(id) { manager.focus(id); },
            destroy() { manager.destroy(); },
            getBodyElement(id) { return manager.getBodyElement(id); },
            getState(id) { return manager.getState(id); },
        };
    }
    function callWindowManagerMethod(api, method, args) {
        switch (method) {
            case 'instance': return api;
            case 'open': return api.open(args[0]);
            case 'close': return api.close(String(args[0]));
            case 'minimize': return api.minimize(String(args[0]));
            case 'maximize': return api.maximize(String(args[0]));
            case 'restore': return api.restore(String(args[0]));
            case 'focus': return api.focus(String(args[0]));
            case 'destroy': return api.destroy();
            case 'getBodyElement': return api.getBodyElement(String(args[0]));
            case 'getState': return api.getState(String(args[0]));
            default:
                throw new Error(`DeskPane jQuery adapter: unknown WindowManager method "${method}".`);
        }
    }
    function createDesktopApi(desktop, options) {
        let windowManager;
        let dockSyncCleanup = null;
        const api = {
            desktop,
            get windowManager() { return windowManager; },
            get dockSyncCleanup() { return dockSyncCleanup; },
            set dockSyncCleanup(cleanup) { dockSyncCleanup = cleanup; },
            getWindowManager(wmOptions = {}) {
                // Lazy 建立 WindowManager，讓使用者可以只用 Desktop/Dock/Icon，不一定開視窗。
                if (!windowManager) {
                    windowManager = new WindowManager({
                        container: desktop.getElement(),
                        isolated: true,
                        ...wmOptions,
                    });
                }
                return windowManager;
            },
            syncDockWithWindows(manager, syncOptions = {}) {
                const wm = manager ?? api.getWindowManager();
                // 同一個 Desktop 只保留一組 sync，避免重複監聽 WindowManager events 造成 Dock item 疊加。
                dockSyncCleanup?.();
                dockSyncCleanup = desktop.syncDockWithWindows(wm, syncOptions);
                return dockSyncCleanup;
            },
            addIcon(config) { desktop.addIcon(config); },
            removeIcon(id) { desktop.removeIcon(id); },
            destroy() {
                dockSyncCleanup?.();
                dockSyncCleanup = null;
                windowManager?.destroy();
                windowManager = undefined;
                desktop.destroy();
            },
        };
        if (options.windowManager !== false) {
            api.getWindowManager(options.windowManager ?? {});
        }
        if (options.syncDock) {
            api.syncDockWithWindows(undefined, options.syncDock === true ? {} : options.syncDock);
        }
        return api;
    }
    function callDesktopMethod(api, method, args) {
        switch (method) {
            case 'instance': return api;
            case 'windowManager': return api.getWindowManager(args[0]);
            case 'addIcon': return api.addIcon(args[0]);
            case 'removeIcon': return api.removeIcon(String(args[0]));
            case 'syncDockWithWindows': return api.syncDockWithWindows(isWindowManagerLike(args[0]) ? args[0] : undefined, (isWindowManagerLike(args[0]) ? args[1] : args[0]));
            case 'destroy': return api.destroy();
            default:
                throw new Error(`DeskPane jQuery adapter: unknown Desktop method "${method}".`);
        }
    }
    function normalizeWorkspaceWindowConfig(config, fallbackContent) {
        const content = firstElement(config.content) ?? fallbackContent ?? document.createElement('div');
        return {
            ...config,
            content,
        };
    }
    function createWorkspaceManagerApi($, workspaceManager, options) {
        const desktopApi = resolveDesktopApi($, options.desktop);
        let dockSyncCleanup = null;
        let taskView = null;
        const api = {
            workspaceManager,
            get taskView() { return taskView; },
            set taskView(value) { taskView = value ?? null; },
            get dockSyncCleanup() { return dockSyncCleanup; },
            set dockSyncCleanup(cleanup) { dockSyncCleanup = cleanup; },
            addWorkspace(config) { return workspaceManager.addWorkspace(config); },
            removeWorkspace(id) { workspaceManager.removeWorkspace(id); },
            switchTo(id) { workspaceManager.switchTo(id); },
            currentWindowManager() {
                const current = workspaceManager.current;
                if (!current)
                    throw new Error('DeskPane jQuery adapter: no active workspace.');
                return workspaceManager.getWindowManager(current.id);
            },
            windowManager(workspaceId) {
                return workspaceManager.getWindowManager(workspaceId ?? workspaceManager.current?.id ?? '');
            },
            openWindow(config) {
                return workspaceManager.openWindow(normalizeWorkspaceWindowConfig(config));
            },
            syncDock(syncOptions = {}) {
                if (!desktopApi) {
                    throw new Error('DeskPane jQuery adapter: syncDock requires a dpDesktop instance.');
                }
                const current = workspaceManager.current;
                if (!current)
                    throw new Error('DeskPane jQuery adapter: no active workspace.');
                dockSyncCleanup?.();
                dockSyncCleanup = desktopApi.desktop.syncDockWithWindows(workspaceManager.getWindowManager(current.id), syncOptions);
                return dockSyncCleanup;
            },
            createTaskView(taskViewOptions = {}) {
                taskView?.destroy();
                const taskViewDesktopApi = resolveDesktopApi($, taskViewOptions.desktop) ?? desktopApi;
                taskView = new TaskView(workspaceManager, {
                    ...taskViewOptions,
                    dock: taskViewOptions.dock ?? taskViewDesktopApi?.desktop.getDock(),
                });
                return taskView;
            },
            destroy() {
                dockSyncCleanup?.();
                dockSyncCleanup = null;
                taskView?.destroy();
                taskView = null;
                workspaceManager.destroy();
            },
        };
        workspaceManager.events.on('workspace:switched', () => {
            // syncDock 只同步目前 active workspace；切換桌面時需重新綁到新的 WindowManager。
            if (options.syncDock) {
                api.syncDock(options.syncDock === true ? {} : options.syncDock);
            }
        });
        options.workspaces?.forEach(config => workspaceManager.addWorkspace(config));
        if (options.indicator)
            workspaceManager.enableIndicator();
        if (options.syncDock)
            api.syncDock(options.syncDock === true ? {} : options.syncDock);
        if (options.taskView)
            api.createTaskView(options.taskView === true ? {} : options.taskView);
        return api;
    }
    function callWorkspaceMethod(api, method, args) {
        switch (method) {
            case 'instance': return api;
            case 'addWorkspace': return api.addWorkspace(args[0]);
            case 'removeWorkspace': return api.removeWorkspace(String(args[0]));
            case 'switchTo': return api.switchTo(String(args[0]));
            case 'current': return api.workspaceManager.current;
            case 'workspaces': return api.workspaceManager.workspaces;
            case 'currentWindowManager': return api.currentWindowManager();
            case 'windowManager': return api.windowManager(args[0] ? String(args[0]) : undefined);
            case 'openWindow': return api.openWindow(args[0]);
            case 'syncDock': return api.syncDock(args[0]);
            case 'taskView': return api.createTaskView(args[0]);
            case 'destroy': return api.destroy();
            default:
                throw new Error(`DeskPane jQuery adapter: unknown WorkspaceManager method "${method}".`);
        }
    }
    function createTaskViewApi(taskView) {
        return {
            taskView,
            open() { taskView.open(); },
            close() { taskView.close(); },
            toggle() { taskView.toggle(); },
            destroy() { taskView.destroy(); },
        };
    }
    function callTaskViewMethod(api, method) {
        switch (method) {
            case 'instance': return api;
            case 'open': return api.open();
            case 'close': return api.close();
            case 'toggle': return api.toggle();
            case 'destroy': return api.destroy();
            default:
                throw new Error(`DeskPane jQuery adapter: unknown TaskView method "${method}".`);
        }
    }
    function install($) {
        if (!$ || !$.fn) {
            throw new Error('DeskPane jQuery adapter requires a jQuery-compatible $.fn object.');
        }
        $.fn.dpWindowManager = function dpWindowManager(optionsOrMethod, ...args) {
            if (typeof optionsOrMethod === 'string') {
                const api = this.data(WM_DATA_KEY);
                if (!api)
                    throw new Error('DeskPane jQuery adapter: call dpWindowManager(options) before using methods.');
                return callWindowManagerMethod(api, optionsOrMethod, args);
            }
            return this.each(function initWindowManager() {
                const manager = new WindowManager({
                    container: this,
                    isolated: true,
                    ...(optionsOrMethod ?? {}),
                });
                const api = createWindowManagerApi(manager);
                $(this).data(WM_DATA_KEY, api);
            });
        };
        $.fn.dpWindow = function dpWindow(options) {
            const states = [];
            this.each(function openElementWindow(index) {
                const manager = resolveManager($, options.manager);
                const { manager: _manager, clone: _clone, ...windowOptions } = options;
                // 預設會把原元素搬進 DeskPane window；傳 clone:true 才會複製。
                // 這符合 jQuery plugin 常見「把目前 selection 變成 widget」的使用方式。
                const source = options.content
                    ? firstElement(options.content)
                    : options.clone
                        ? this.cloneNode(true)
                        : this;
                const id = options.id ?? this.id ?? `dp-window-${index + 1}`;
                states.push(manager.open(normalizeWindowConfig({
                    ...windowOptions,
                    id,
                    content: source,
                })));
            });
            return states.length === 1 ? states[0] : states;
        };
        $.fn.dpDesktop = function dpDesktop(optionsOrMethod, ...args) {
            if (typeof optionsOrMethod === 'string') {
                const api = this.data(DESKTOP_DATA_KEY);
                if (!api)
                    throw new Error('DeskPane jQuery adapter: call dpDesktop(options) before using methods.');
                return callDesktopMethod(api, optionsOrMethod, args);
            }
            return this.each(function initDesktop() {
                const options = optionsOrMethod ?? {};
                const desktop = new Desktop({
                    ...options,
                    container: this,
                });
                const api = createDesktopApi(desktop, options);
                $(this).data(DESKTOP_DATA_KEY, api);
            });
        };
        $.fn.dpWorkspaceManager = function dpWorkspaceManager(optionsOrMethod, ...args) {
            if (typeof optionsOrMethod === 'string') {
                const api = this.data(WORKSPACE_DATA_KEY);
                if (!api)
                    throw new Error('DeskPane jQuery adapter: call dpWorkspaceManager(options) before using methods.');
                return callWorkspaceMethod(api, optionsOrMethod, args);
            }
            return this.each(function initWorkspaceManager() {
                const options = optionsOrMethod ?? {};
                const desktopApi = resolveDesktopApi($, options.desktop);
                const container = desktopApi?.desktop.getElement() ?? this;
                const workspaceManager = new WorkspaceManager(container, options);
                const api = createWorkspaceManagerApi($, workspaceManager, options);
                $(this).data(WORKSPACE_DATA_KEY, api);
            });
        };
        $.fn.dpWorkspaceWindow = function dpWorkspaceWindow(options) {
            const states = [];
            this.each(function openWorkspaceWindow(index) {
                const workspaceApi = resolveWorkspaceApi($, options.workspace);
                const { workspace: _workspace, clone: _clone, ...windowOptions } = options;
                // workspace 視窗優先使用 appId 產生 scoped id，避免跨 workspace raw id 重複。
                const source = options.content
                    ? firstElement(options.content)
                    : options.clone
                        ? this.cloneNode(true)
                        : this;
                const fallbackId = this.id || undefined;
                const fallbackAppId = this.id || `dp-window-${index + 1}`;
                states.push(workspaceApi.openWindow({
                    ...windowOptions,
                    id: options.id ?? fallbackId,
                    appId: options.appId ?? fallbackAppId,
                    content: source,
                }));
            });
            return states.length === 1 ? states[0] : states;
        };
        $.fn.dpTaskView = function dpTaskView(optionsOrMethod) {
            if (typeof optionsOrMethod === 'string') {
                const api = this.data(TASKVIEW_DATA_KEY);
                if (!api)
                    throw new Error('DeskPane jQuery adapter: call dpTaskView(options) before using methods.');
                return callTaskViewMethod(api, optionsOrMethod);
            }
            return this.each(function initTaskView() {
                const options = optionsOrMethod ?? {};
                const workspaceApi = options.workspace
                    ? resolveWorkspaceApi($, options.workspace)
                    : $(this).data(WORKSPACE_DATA_KEY);
                if (!workspaceApi)
                    throw new Error('DeskPane jQuery adapter: dpTaskView requires a dpWorkspaceManager instance.');
                const taskView = workspaceApi.createTaskView(options);
                $(this).data(TASKVIEW_DATA_KEY, createTaskViewApi(taskView));
            });
        };
    }
    const DeskPaneJQuery = { install };
    const browserGlobal = globalThis;
    const autoJQuery = browserGlobal.jQuery ?? browserGlobal.$;
    if (autoJQuery?.fn)
        install(autoJQuery);
    browserGlobal.DeskPaneJQuery = DeskPaneJQuery;

    exports.DeskPaneJQuery = DeskPaneJQuery;
    exports.install = install;

}));
//# sourceMappingURL=deskpane-jquery.umd.js.map
