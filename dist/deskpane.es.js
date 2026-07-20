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
const STYLE_ID$1 = 'dp-core-styles';
/** 回傳 Core CSS 字串，供 injectStyles:false 的使用者自行管理樣式注入 */
function getCoreCSS() {
    return BASE_CSS;
}
function injectStyles() {
    injectRuntimeCSS({
        id: STYLE_ID$1,
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
/** 全域單例 */
const eventBus = new EventBus();

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
const STYLE_ID = 'dp-layout-styles';
/** 回傳 Layout CSS 字串，供 injectStyles:false 的使用者自行管理樣式注入 */
function getLayoutCSS() {
    return LAYOUT_CSS;
}
function injectLayoutStyles() {
    if (document.getElementById(STYLE_ID))
        return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
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
// DeskPane — Theme Switcher
// 動態切換主題 CSS 的工具函式
// ============================================================
/**
 * 動態切換 DeskPane 主題。
 *
 * 第一次呼叫時，若頁面中不存在指定 id 的 `<link>` 元素，
 * 會自動建立一個並插入 `<head>`。
 *
 * @param preset  `'light'`、`'dark'`、`'win7'` 或 `'medieval-pixel'`
 * @param options 選填設定（basePath / linkId）
 *
 * @example
 * // ESM
 * import { setTheme } from 'deskpane';
 * setTheme('dark');
 *
 * // UMD
 * DeskPane.setTheme('dark');
 *
 * // 自訂路徑（例如主題放在 /assets/themes/）
 * setTheme('dark', { basePath: '/assets/themes' });
 */
function setTheme(preset, options = {}) {
    const { basePath = 'themes', linkId = 'dp-theme' } = options;
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

export { BorderLayout, EventBus, Panel, WindowManager, eventBus, getCoreCSS, getLayoutCSS, setTheme, snapPosition };
//# sourceMappingURL=deskpane.es.js.map
