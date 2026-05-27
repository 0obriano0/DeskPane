// ============================================================
// WebOS-Desktop — Icon utilities (shared between Dock & DesktopIcon)
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
// WebOS-Desktop — Dock
// 工具列：支援圖示新增/移除 + 拖曳排序
// ============================================================
function resolveIconEl$1(icon, size) {
    const el = document.createElement('div');
    el.className = 'wos-dock-icon';
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
        this._el = document.createElement('div');
        this._el.className = `wos-dock wos-dock-${this._position}`;
        this._render();
    }
    // ── Private ───────────────────────────────────────────────
    _render() {
        this._el.innerHTML = '';
        this._items.forEach((item, index) => {
            this._el.appendChild(this._createItemEl(item, index));
        });
        this._renderCallbacks.forEach(cb => cb());
    }
    _createItemEl(item, index) {
        const el = document.createElement('div');
        el.className = 'wos-dock-item';
        el.draggable = true;
        el.dataset.index = String(index);
        el.dataset.id = item.id;
        el.title = ''; // 使用自訂 tooltip，避免瀏覽器原生 title
        el.appendChild(resolveIconEl$1(item.icon, this._iconSize));
        if (this._showLabels) {
            const label = document.createElement('div');
            label.className = 'wos-dock-label';
            label.textContent = item.label;
            el.appendChild(label);
        }
        else {
            const tooltip = document.createElement('div');
            tooltip.className = 'wos-dock-tooltip';
            tooltip.textContent = item.label;
            el.appendChild(tooltip);
        }
        // Click
        el.addEventListener('click', () => item.action());
        // ── HTML5 Drag-to-reorder ─────────────────────────────
        el.addEventListener('dragstart', (e) => {
            this._dragSrcIndex = index;
            el.classList.add('wos-dock-dragging');
            if (e.dataTransfer) {
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', String(index));
            }
        });
        el.addEventListener('dragend', () => {
            el.classList.remove('wos-dock-dragging');
            this._clearDragover();
        });
        el.addEventListener('dragover', (e) => {
            e.preventDefault();
            if (e.dataTransfer)
                e.dataTransfer.dropEffect = 'move';
            const targetIndex = parseInt(el.dataset.index ?? '0', 10);
            if (targetIndex !== this._dragSrcIndex) {
                this._clearDragover();
                el.classList.add('wos-dock-dragover');
            }
        });
        el.addEventListener('dragleave', () => {
            el.classList.remove('wos-dock-dragover');
        });
        el.addEventListener('drop', (e) => {
            e.preventDefault();
            el.classList.remove('wos-dock-dragover');
            const targetIndex = parseInt(el.dataset.index ?? '0', 10);
            if (this._dragSrcIndex >= 0 && this._dragSrcIndex !== targetIndex) {
                const [moved] = this._items.splice(this._dragSrcIndex, 1);
                this._items.splice(targetIndex, 0, moved);
                this._render();
            }
            this._dragSrcIndex = -1;
        });
        return el;
    }
    _clearDragover() {
        this._el.querySelectorAll('.wos-dock-dragover').forEach(el => {
            el.classList.remove('wos-dock-dragover');
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
        this._el.querySelectorAll('.wos-dock-item').forEach(el => {
            el.classList.toggle('wos-dock-active', !!id && el.dataset.id === id);
        });
    }
    removeItem(id) {
        const idx = this._items.findIndex(i => i.id === id);
        if (idx !== -1) {
            this._items.splice(idx, 1);
            this._render();
        }
    }
    /** 取得目前排列順序的 items（含拖曳後的結果） */
    getItems() {
        return [...this._items];
    }
    /** 動態變更 Dock 停靠位置 */
    setPosition(position) {
        this._el.classList.remove(`wos-dock-${this._position}`);
        this._position = position;
        this._el.classList.add(`wos-dock-${this._position}`);
    }
    /** 取得特定 item 的 DOM 元素 */
    getItemElement(id) {
        return this._el.querySelector(`.wos-dock-item[data-id="${CSS.escape(id)}"]`);
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
// WebOS-Desktop — DesktopIcon
// 桌面圖示：可拖曳自由定位，點擊觸發 action
// ============================================================
function resolveIconEl(icon) {
    const el = document.createElement('div');
    el.className = 'wos-desktop-icon-img';
    appendIconContent(el, icon);
    return el;
}
class DesktopIcon {
    constructor(config, containerEl, onMove, dragThreshold = 6, snapFn = null, onDragEnd = null) {
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
        this._onMouseMoveBound = this._onMouseMove.bind(this);
        this._onMouseUpBound = this._onMouseUp.bind(this);
        this._el = this._createElement();
    }
    _createElement() {
        const el = document.createElement('div');
        el.className = 'wos-desktop-icon';
        el.dataset.id = this._config.id;
        el.appendChild(resolveIconEl(this._config.icon));
        const label = document.createElement('div');
        label.className = 'wos-desktop-icon-label';
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
        this._containerEl.querySelectorAll('.wos-icon-selected').forEach(el => {
            el.classList.remove('wos-icon-selected');
        });
        this._el.classList.add('wos-icon-selected');
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
            this._el.classList.add('wos-icon-dragging');
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
        this._el.classList.remove('wos-icon-dragging');
        this._onDragEnd?.();
        if (!this._hasMoved) {
            // 純點擊，觸發 action
            this._config.action();
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
    destroy() {
        document.removeEventListener('mousemove', this._onMouseMoveBound);
        document.removeEventListener('mouseup', this._onMouseUpBound);
        this._el.remove();
    }
}

var DESKTOP_CSS = "/* ============================================================\r\n * WebOS-Desktop — Default Styles\r\n * Version: 0.1.0\r\n *\r\n * Copy this file to your project and link it with:\r\n *   <link rel=\"stylesheet\" href=\"webos-desktop.css\">\r\n *\r\n * When using injectStyles: false option in Desktop config,\r\n * these styles will NOT be injected automatically — this file\r\n * is your starting point for customization.\r\n *\r\n * All values use CSS custom properties (--wos-*) so you can\r\n * override them in :root without touching this file.\r\n * ============================================================ */\r\n\r\n/* ── Desktop container ───────────────────────────────── */\r\n.wos-desktop {\r\n  position: relative;\r\n  width: 100%;\r\n  height: 100%;\r\n  overflow: clip;\r\n  background: var(--wos-desktop-bg, linear-gradient(135deg, #1a2a4a 0%, #0d1b2a 100%));\r\n  user-select: none;\r\n  font-family: var(--wos-font, system-ui, -apple-system, sans-serif);\r\n}\r\n\r\n/* ── Icon area ───────────────────────────────────────── */\r\n.wos-desktop-icon-area {\r\n  position: absolute;\r\n  top: 0; left: 0; right: 0; bottom: 0;\r\n  overflow: auto;\r\n  scrollbar-width: thin;\r\n  scrollbar-color: rgba(255,255,255,0.2) transparent;\r\n}\r\n\r\n/* ── Window area ─────────────────────────────────────── */\r\n.wos-desktop-window-area {\r\n  position: absolute !important;\r\n  top: 0; left: 0; right: 0; bottom: 0;\r\n  overflow: clip;\r\n  pointer-events: none;\r\n}\r\n.wos-desktop-window-area > * {\r\n  pointer-events: auto;\r\n}\r\n\r\n/* ── Icon snap guides ────────────────────────────────── */\r\n.wos-icon-snap-guide {\r\n  position: absolute;\r\n  pointer-events: none;\r\n  z-index: 9999;\r\n  display: none;\r\n  background: var(--wos-snap-guide-color, rgba(0, 120, 255, 0.55));\r\n}\r\n.wos-icon-snap-guide.wos-snap-guide--v {\r\n  width: 1px;\r\n  top: 0;\r\n  bottom: 0;\r\n}\r\n.wos-icon-snap-guide.wos-snap-guide--h {\r\n  height: 1px;\r\n  left: 0;\r\n  right: 0;\r\n}\r\n\r\n/* ── Desktop icon ────────────────────────────────────── */\r\n.wos-desktop-icon {\r\n  position: absolute;\r\n  display: flex;\r\n  flex-direction: column;\r\n  align-items: center;\r\n  width: 80px;\r\n  padding: 8px 4px 6px;\r\n  cursor: pointer;\r\n  border-radius: 8px;\r\n  transition: background 0.12s;\r\n}\r\n.wos-desktop-icon:hover {\r\n  background: var(--wos-desktop-icon-hover-bg, rgba(255,255,255,0.15));\r\n}\r\n.wos-desktop-icon.wos-icon-selected {\r\n  background: rgba(74,158,255,0.35);\r\n  outline: 1px solid rgba(74,158,255,0.6);\r\n}\r\n.wos-desktop-icon.wos-icon-dragging {\r\n  opacity: 0.45;\r\n  z-index: 9999;\r\n}\r\n.wos-desktop-icon-img {\r\n  width: 48px;\r\n  height: 48px;\r\n  font-size: 38px;\r\n  line-height: 1;\r\n  display: flex;\r\n  align-items: center;\r\n  justify-content: center;\r\n  border-radius: 10px;\r\n  overflow: hidden;\r\n  pointer-events: none;\r\n}\r\n.wos-desktop-icon-img img {\r\n  width: 100%;\r\n  height: 100%;\r\n  object-fit: contain;\r\n}\r\n.wos-desktop-icon-label {\r\n  margin-top: 4px;\r\n  font-size: 11px;\r\n  color: var(--wos-desktop-icon-text, #fff);\r\n  text-align: center;\r\n  line-height: 1.3;\r\n  max-width: 76px;\r\n  word-break: break-word;\r\n  text-shadow: 0 1px 3px rgba(0,0,0,0.7);\r\n  pointer-events: none;\r\n}\r\n\r\n/* ── Dock ────────────────────────────────────────────── */\r\n.wos-dock {\r\n  position: absolute;\r\n  display: flex;\r\n  align-items: center;\r\n  justify-content: flex-start;\r\n  gap: 4px;\r\n  background: var(--wos-dock-bg, rgba(20,30,50,0.75));\r\n  backdrop-filter: var(--wos-dock-backdrop-filter, blur(14px));\r\n  -webkit-backdrop-filter: var(--wos-dock-backdrop-filter, blur(14px));\r\n  border: 1px solid var(--wos-dock-border, rgba(255,255,255,0.1));\r\n  padding: 6px 10px;\r\n  z-index: 9999;\r\n  box-sizing: border-box;\r\n  scrollbar-width: none;\r\n  -ms-overflow-style: none;\r\n}\r\n.wos-dock::-webkit-scrollbar { display: none; }\r\n.wos-dock.wos-dock-bottom {\r\n  bottom: 0; left: 0; right: 0;\r\n  flex-direction: row;\r\n  height: 68px;\r\n  border-top: 1px solid var(--wos-dock-border, rgba(255,255,255,0.1));\r\n  overflow-x: auto;\r\n  overflow-y: hidden;\r\n}\r\n.wos-dock.wos-dock-top {\r\n  top: 0; left: 0; right: 0;\r\n  flex-direction: row;\r\n  height: 68px;\r\n  border-bottom: 1px solid var(--wos-dock-border, rgba(255,255,255,0.1));\r\n  overflow-x: auto;\r\n  overflow-y: hidden;\r\n}\r\n.wos-dock.wos-dock-left {\r\n  top: 0; left: 0; bottom: 0;\r\n  flex-direction: column;\r\n  width: 68px;\r\n  align-items: center;\r\n  justify-content: flex-start;\r\n  padding: 10px 6px;\r\n  border-right: 1px solid var(--wos-dock-border, rgba(255,255,255,0.1));\r\n  overflow-y: auto;\r\n  overflow-x: hidden;\r\n}\r\n.wos-dock.wos-dock-right {\r\n  top: 0; right: 0; bottom: 0;\r\n  flex-direction: column;\r\n  width: 68px;\r\n  align-items: center;\r\n  justify-content: flex-start;\r\n  padding: 10px 6px;\r\n  border-left: 1px solid var(--wos-dock-border, rgba(255,255,255,0.1));\r\n  overflow-y: auto;\r\n  overflow-x: hidden;\r\n}\r\n\r\n/* ── Dock item ───────────────────────────────────────── */\r\n.wos-dock-item {\r\n  display: flex;\r\n  flex-direction: column;\r\n  align-items: center;\r\n  justify-content: center;\r\n  cursor: pointer;\r\n  border-radius: 10px;\r\n  padding: 4px 6px;\r\n  position: relative;\r\n  transition: transform 0.15s, background 0.12s;\r\n  flex-shrink: 0;\r\n}\r\n.wos-dock-item:hover {\r\n  background: var(--wos-dock-item-hover-bg, rgba(255,255,255,0.12));\r\n  transform: scale(1.15) translateY(-3px);\r\n}\r\n.wos-dock-item.wos-dock-dragging {\r\n  opacity: 0.4;\r\n}\r\n.wos-dock-item.wos-dock-dragover {\r\n  background: rgba(74,158,255,0.25);\r\n  outline: 2px dashed rgba(74,158,255,0.7);\r\n  transform: scale(1.1);\r\n}\r\n.wos-dock-item.wos-dock-active {\r\n  background: rgba(74,158,255,0.2);\r\n}\r\n.wos-dock-item.wos-dock-active::after {\r\n  content: '';\r\n  position: absolute;\r\n  bottom: -5px;\r\n  left: 50%;\r\n  transform: translateX(-50%);\r\n  width: 5px;\r\n  height: 5px;\r\n  border-radius: 50%;\r\n  background: rgba(74,158,255,0.9);\r\n}\r\n.wos-dock.wos-dock-top .wos-dock-item.wos-dock-active::after {\r\n  bottom: unset;\r\n  top: -5px;\r\n}\r\n.wos-dock.wos-dock-left .wos-dock-item.wos-dock-active::after {\r\n  bottom: unset;\r\n  top: 50%;\r\n  left: -5px;\r\n  transform: translateY(-50%);\r\n}\r\n.wos-dock.wos-dock-right .wos-dock-item.wos-dock-active::after {\r\n  bottom: unset;\r\n  top: 50%;\r\n  left: unset;\r\n  right: -5px;\r\n  transform: translateY(-50%);\r\n}\r\n\r\n/* ── Dock icon & label ───────────────────────────────── */\r\n.wos-dock-icon {\r\n  display: flex;\r\n  align-items: center;\r\n  justify-content: center;\r\n  border-radius: 8px;\r\n  overflow: hidden;\r\n  pointer-events: none;\r\n}\r\n.wos-dock-icon img {\r\n  width: 100%;\r\n  height: 100%;\r\n  object-fit: contain;\r\n}\r\n.wos-dock-label {\r\n  font-size: 10px;\r\n  color: var(--wos-desktop-icon-text, rgba(255,255,255,0.85));\r\n  margin-top: 2px;\r\n  white-space: nowrap;\r\n  overflow: hidden;\r\n  text-overflow: ellipsis;\r\n  max-width: 60px;\r\n  pointer-events: none;\r\n}\r\n\r\n/* ── Dock tooltip ────────────────────────────────────── */\r\n.wos-dock-tooltip {\r\n  position: absolute;\r\n  bottom: calc(100% + 6px);\r\n  left: 50%;\r\n  transform: translateX(-50%);\r\n  background: rgba(0,0,0,0.8);\r\n  color: #fff;\r\n  font-size: 11px;\r\n  padding: 3px 8px;\r\n  border-radius: 4px;\r\n  white-space: nowrap;\r\n  pointer-events: none;\r\n  opacity: 0;\r\n  transition: opacity 0.15s;\r\n}\r\n.wos-dock-item:hover .wos-dock-tooltip {\r\n  opacity: 1;\r\n}\r\n.wos-dock.wos-dock-left .wos-dock-tooltip,\r\n.wos-dock.wos-dock-right .wos-dock-tooltip {\r\n  bottom: unset;\r\n  top: 50%;\r\n  transform: translateY(-50%);\r\n}\r\n.wos-dock.wos-dock-left .wos-dock-tooltip {\r\n  left: calc(100% + 6px);\r\n}\r\n.wos-dock.wos-dock-right .wos-dock-tooltip {\r\n  left: unset;\r\n  right: calc(100% + 6px);\r\n}\r\n\r\n/* ── Dock window hover preview ───────────────────────── */\r\n.wos-dock-win-preview {\r\n  position: fixed;\r\n  z-index: 99998;\r\n  pointer-events: none;\r\n  border-radius: 8px;\r\n  overflow: hidden;\r\n  border: 1px solid rgba(255, 255, 255, 0.15);\r\n  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.55);\r\n  background: rgba(20, 20, 25, 0.95);\r\n  opacity: 0;\r\n  transform: translateY(6px);\r\n  transition: opacity 0.15s, transform 0.15s;\r\n}\r\n.wos-dock-win-preview.wos-dock-win-preview--visible {\r\n  opacity: 1;\r\n  transform: translateY(0);\r\n}\r\n/* adjust slide direction for non-bottom docks */\r\n.wos-dock-win-preview.wos-dock-win-preview--top {\r\n  transform: translateY(-6px);\r\n}\r\n.wos-dock-win-preview.wos-dock-win-preview--top.wos-dock-win-preview--visible {\r\n  transform: translateY(0);\r\n}\r\n.wos-dock-win-preview.wos-dock-win-preview--left,\r\n.wos-dock-win-preview.wos-dock-win-preview--right {\r\n  transform: translateX(0);\r\n}\r\n";

// ============================================================
// WebOS-Desktop — CSS 注入（僅注入一次）
// ============================================================
const STYLE_ID = 'wos-desktop-styles';
/** 回傳 Desktop CSS 字串，供 injectStyles:false 的使用者自行管理樣式注入 */
function getDesktopCSS() {
    return DESKTOP_CSS;
}
function injectDesktopStyles() {
    if (document.getElementById(STYLE_ID))
        return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = DESKTOP_CSS;
    document.head.appendChild(style);
}

// ============================================================
// WebOS-Core — Snap Helper
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

// ============================================================
// WebOS-Desktop — Desktop
// 桌面主容器：管理圖示區域 + Dock 工具列
// ============================================================
const PREVIEW_MAX_W = 240;
const PREVIEW_MAX_H = 150;
function buildDockPreview(winEl, anchorEl, dockPos, winState, maxW = PREVIEW_MAX_W, maxH = PREVIEW_MAX_H) {
    const winW = winState?.width || winEl.offsetWidth || 640;
    const winH = winState?.height || winEl.offsetHeight || 480;
    const scale = Math.min(maxW / winW, maxH / winH, 1);
    const previewW = Math.round(winW * scale);
    const previewH = Math.round(winH * scale);
    const popup = document.createElement('div');
    popup.className = `wos-dock-win-preview wos-dock-win-preview--${dockPos}`;
    popup.style.width = `${previewW}px`;
    popup.style.height = `${previewH}px`;
    const wrapper = document.createElement('div');
    wrapper.style.cssText =
        `position:absolute;top:0;left:0;width:${winW}px;height:${winH}px;` +
            `transform:scale(${scale});transform-origin:top left;pointer-events:none;overflow:hidden;`;
    const clone = winEl.cloneNode(true);
    clone.classList.remove('wos-minimized', 'wos-maximized');
    clone.style.cssText =
        'position:absolute;left:0;top:0;width:100%;height:100%;' +
            'transform:none;transition:none;pointer-events:none;';
    wrapper.appendChild(clone);
    popup.appendChild(wrapper);
    const rect = anchorEl.getBoundingClientRect();
    const MARGIN = 10;
    let x, y;
    if (dockPos === 'bottom') {
        x = rect.left + rect.width / 2 - previewW / 2;
        y = rect.top - previewH - MARGIN;
    }
    else if (dockPos === 'top') {
        x = rect.left + rect.width / 2 - previewW / 2;
        y = rect.bottom + MARGIN;
    }
    else if (dockPos === 'left') {
        x = rect.right + MARGIN;
        y = rect.top + rect.height / 2 - previewH / 2;
    }
    else {
        x = rect.left - previewW - MARGIN;
        y = rect.top + rect.height / 2 - previewH / 2;
    }
    x = Math.max(8, Math.min(window.innerWidth - previewW - 8, x));
    y = Math.max(8, Math.min(window.innerHeight - previewH - 8, y));
    popup.style.left = `${x}px`;
    popup.style.top = `${y}px`;
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
/** Dock 停靠列高度 / 寬度（px）；對齊 CSS .wos-dock-* */
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
        this._guideV = null;
        this._guideH = null;
        this._iconSentinel = null;
        this._autoIconIndex = 0;
        this._dockSyncCleanup = null;
        if (config.injectStyles !== false)
            injectDesktopStyles();
        this._container = config.container ?? document.body;
        this._storageKey = config.storageKey ?? 'wos-desktop';
        this._dragThreshold = config.dragThreshold ?? 6;
        this._iconSnapEnabled = config.iconSnap ?? true;
        this._iconSnapThreshold = config.iconSnapThreshold ?? 20;
        // 桌面根元素
        this._desktopEl = document.createElement('div');
        this._desktopEl.className = 'wos-desktop';
        if (config.background) {
            this._desktopEl.style.background = config.background;
        }
        // 圖示區域
        this._iconAreaEl = document.createElement('div');
        this._iconAreaEl.className = 'wos-desktop-icon-area';
        this._desktopEl.appendChild(this._iconAreaEl);
        // 視窗區域：大小與 iconArea 相同（排除 Dock 佔用空間），
        // 作為 WindowManager 的 container，確保最大化時不超過 Dock
        this._windowAreaEl = document.createElement('div');
        this._windowAreaEl.className = 'wos-desktop-window-area';
        this._desktopEl.appendChild(this._windowAreaEl);
        // Snap guide 線（icon 拖曳吸附指示）
        if (this._iconSnapEnabled) {
            this._guideV = document.createElement('div');
            this._guideV.className = 'wos-snap-guide wos-snap-guide--v wos-icon-snap-guide';
            this._guideH = document.createElement('div');
            this._guideH.className = 'wos-snap-guide wos-snap-guide--h wos-icon-snap-guide';
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
                this._iconAreaEl.querySelectorAll('.wos-icon-selected').forEach(el => {
                    el.classList.remove('wos-icon-selected');
                });
            }
        });
        this._container.appendChild(this._desktopEl);
        // 掛載初始圖示
        (config.icons ?? []).forEach(icon => this.addIcon(icon));
    }
    // ── localStorage 位置記憶 ────────────────────────────────
    /**
     * 更新 icon 區域的 inset（避免 icon 被 Dock 遮住）。
     * 視窗區域維持全尺寸（0,0,0,0），讓視窗可自由滑入 Dock 下方，
     * 透過 CSS 變數 --wos-dock-inset-* 控制最大化時的邊界。
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
        s.setProperty('--wos-dock-inset-top', `${inset.top}px`);
        s.setProperty('--wos-dock-inset-bottom', `${inset.bottom}px`);
        s.setProperty('--wos-dock-inset-left', `${inset.left}px`);
        s.setProperty('--wos-dock-inset-right', `${inset.right}px`);
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
    // ── Public API ────────────────────────────────────────────
    /**
     * 新增桌面圖示。
     * 位置優先順序：config.x/y > localStorage 記憶 > 自動排列
     */
    addIcon(config) {
        if (this._icons.has(config.id))
            return;
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
        const snapFn = this._iconSnapEnabled ? this._makeSnapFn(config.id) : null;
        const icon = new DesktopIcon(config, this._iconAreaEl, () => { this._savePositions(); }, this._dragThreshold, snapFn, snapFn ? () => { this._hideSnapGuides(); } : null);
        icon.setPosition(x, y);
        this._iconAreaEl.appendChild(icon.getElement());
        this._icons.set(config.id, icon);
        this._updateSentinel();
    }
    /** 移除桌面圖示 */
    removeIcon(id) {
        const icon = this._icons.get(id);
        if (icon) {
            icon.destroy();
            this._icons.delete(id);
            this._updateSentinel();
        }
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
    }
    /**
     * 將 Dock 與 WindowManager 視窗生命週期同步。
     * - 開窗：新增 Dock item
     * - 關窗：移除 Dock item
     * - 點擊 Dock item：預設 focus 視窗（可覆寫）
     */
    syncDockWithWindows(manager, options = {}) {
        this.unsyncDockWithWindows();
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
        const runningDockIds = new Set();
        const dockIdToWindowId = new Map();
        let activeDockId = null;
        const enablePreview = options.showWindowPreview !== false && !!manager.getWindowElement;
        const previewMaxW = options.previewSize?.width ?? PREVIEW_MAX_W;
        const previewMaxH = options.previewSize?.height ?? PREVIEW_MAX_H;
        let previewEl = null;
        let previewTimer;
        const hoverCleanups = [];
        const hidePreview = () => {
            clearTimeout(previewTimer);
            previewEl?.remove();
            previewEl = null;
        };
        const showPreview = (anchorEl, windowId) => {
            clearTimeout(previewTimer);
            previewTimer = setTimeout(() => {
                hidePreview();
                const winEl = manager.getWindowElement(windowId);
                if (!winEl)
                    return;
                const state = manager.getState?.(windowId);
                previewEl = buildDockPreview(winEl, anchorEl, this._dock.getPosition(), state, previewMaxW, previewMaxH);
                document.body.appendChild(previewEl);
                requestAnimationFrame(() => previewEl?.classList.add('wos-dock-win-preview--visible'));
            }, 300);
        };
        const attachPreviewHover = (dockId, windowId) => {
            if (!enablePreview)
                return;
            const itemEl = this._dock.getItemElement(dockId);
            if (!itemEl)
                return;
            const enter = () => showPreview(itemEl, windowId);
            const leave = () => hidePreview();
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
                    attachPreviewHover(id, wid);
            });
        };
        const toDockId = (appId, windowId) => {
            const key = dedupeByAppId ? appId : windowId;
            return `${dockItemIdPrefix}${key}`;
        };
        const addDockItemForWindow = (event) => {
            if (!event?.id)
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
                    manager.focus?.(liveWindowId);
                },
            });
            // 新視窗開啟後即為 active（WindowManager 不另外 emit window:focused）
            activeDockId = dockId;
            this._dock.setActiveItem(dockId);
            // hover 重綁由 onRender 統一處理（addItem 會觸發 _render → onRender）
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
                });
            });
        }
        const cleanup = () => {
            offOpened();
            offClosed();
            offFocused();
            offRender();
            hidePreview();
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
        this._icons.forEach(icon => icon.destroy());
        this._icons.clear();
        this._dock.destroy();
        this._desktopEl.remove();
    }
}

export { Desktop, DesktopIcon, Dock, getDesktopCSS };
//# sourceMappingURL=webos-desktop.es.js.map
