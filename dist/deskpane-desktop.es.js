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
        this._el = document.createElement('div');
        this._el.className = `dp-dock dp-dock-${this._position}`;
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
        el.className = 'dp-dock-item';
        el.draggable = true;
        el.dataset.index = String(index);
        el.dataset.id = item.id;
        el.title = ''; // 使用自訂 tooltip，避免瀏覽器原生 title
        el.appendChild(resolveIconEl$1(item.icon, this._iconSize));
        if (this._showLabels) {
            const label = document.createElement('div');
            label.className = 'dp-dock-label';
            label.textContent = item.label;
            el.appendChild(label);
        }
        else {
            const tooltip = document.createElement('div');
            tooltip.className = 'dp-dock-tooltip';
            tooltip.textContent = item.label;
            el.appendChild(tooltip);
        }
        // Click
        el.addEventListener('click', () => item.action());
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
function resolveIconEl(icon) {
    const el = document.createElement('div');
    el.className = 'dp-desktop-icon-img';
    appendIconContent(el, icon);
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
        el.appendChild(resolveIconEl(this._config.icon));
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

var DESKTOP_CSS = "/* ============================================================\r\n * DeskPane-Desktop — Default Styles\r\n * Version: 0.1.0\r\n *\r\n * Copy this file to your project and link it with:\r\n *   <link rel=\"stylesheet\" href=\"deskpane-desktop.css\">\r\n *\r\n * When using injectStyles: false option in Desktop config,\r\n * these styles will NOT be injected automatically — this file\r\n * is your starting point for customization.\r\n *\r\n * All values use CSS custom properties (--dp-*) so you can\r\n * override them in :root without touching this file.\r\n * ============================================================ */\r\n\r\n/* ── Desktop container ───────────────────────────────── */\r\n.dp-desktop {\r\n  position: relative;\r\n  width: 100%;\r\n  height: 100%;\r\n  overflow: clip;\r\n  background: var(--dp-desktop-bg, linear-gradient(135deg, #1a2a4a 0%, #0d1b2a 100%));\r\n  user-select: none;\r\n  font-family: var(--dp-font, system-ui, -apple-system, sans-serif);\r\n}\r\n\r\n/* ── Icon area ───────────────────────────────────────── */\r\n.dp-desktop-icon-area {\r\n  position: absolute;\r\n  top: 0; left: 0; right: 0; bottom: 0;\r\n  overflow: auto;\r\n  scrollbar-width: thin;\r\n  scrollbar-color: rgba(255,255,255,0.2) transparent;\r\n}\r\n\r\n/* ── Window area ─────────────────────────────────────── */\r\n.dp-desktop-window-area {\r\n  position: absolute !important;\r\n  top: 0; left: 0; right: 0; bottom: 0;\r\n  overflow: clip;\r\n  pointer-events: none;\r\n}\r\n.dp-desktop-window-area > * {\r\n  pointer-events: auto;\r\n}\r\n\r\n/* ── Icon snap guides ────────────────────────────────── */\r\n.dp-icon-snap-guide {\r\n  position: absolute;\r\n  pointer-events: none;\r\n  z-index: 9999;\r\n  display: none;\r\n  background: var(--dp-snap-guide-color, rgba(0, 120, 255, 0.55));\r\n}\r\n.dp-icon-snap-guide.dp-snap-guide--v {\r\n  width: 1px;\r\n  top: 0;\r\n  bottom: 0;\r\n}\r\n.dp-icon-snap-guide.dp-snap-guide--h {\r\n  height: 1px;\r\n  left: 0;\r\n  right: 0;\r\n}\r\n\r\n/* ── Desktop icon ────────────────────────────────────── */\r\n.dp-desktop-icon {\r\n  position: absolute;\r\n  display: flex;\r\n  flex-direction: column;\r\n  align-items: center;\r\n  width: 80px;\r\n  padding: 8px 4px 6px;\r\n  cursor: pointer;\r\n  border-radius: 8px;\r\n  transition: background 0.12s;\r\n}\r\n.dp-desktop-icon:hover {\r\n  background: var(--dp-desktop-icon-hover-bg, rgba(255,255,255,0.15));\r\n}\r\n.dp-desktop-icon.dp-icon-selected {\r\n  background: rgba(74,158,255,0.35);\r\n  outline: 1px solid rgba(74,158,255,0.6);\r\n}\r\n.dp-desktop-icon.dp-icon-dragging {\r\n  opacity: 0.45;\r\n  z-index: 9999;\r\n}\r\n.dp-desktop-icon-img {\r\n  width: 48px;\r\n  height: 48px;\r\n  font-size: 38px;\r\n  line-height: 1;\r\n  display: flex;\r\n  align-items: center;\r\n  justify-content: center;\r\n  border-radius: 10px;\r\n  overflow: hidden;\r\n  pointer-events: none;\r\n}\r\n.dp-desktop-icon-img img {\r\n  width: 100%;\r\n  height: 100%;\r\n  object-fit: contain;\r\n}\r\n.dp-desktop-icon-label {\r\n  margin-top: 4px;\r\n  font-size: 11px;\r\n  color: var(--dp-desktop-icon-text, #fff);\r\n  text-align: center;\r\n  line-height: 1.3;\r\n  max-width: 76px;\r\n  word-break: break-word;\r\n  text-shadow: 0 1px 3px rgba(0,0,0,0.7);\r\n  pointer-events: none;\r\n}\r\n\r\n/* ── Dock ────────────────────────────────────────────── */\r\n.dp-dock {\r\n  position: absolute;\r\n  display: flex;\r\n  align-items: center;\r\n  justify-content: flex-start;\r\n  gap: 4px;\r\n  background: var(--dp-dock-bg, rgba(20,30,50,0.75));\r\n  backdrop-filter: var(--dp-dock-backdrop-filter, blur(14px));\r\n  -webkit-backdrop-filter: var(--dp-dock-backdrop-filter, blur(14px));\r\n  border: 1px solid var(--dp-dock-border, rgba(255,255,255,0.1));\r\n  padding: 6px 10px;\r\n  z-index: 9999;\r\n  box-sizing: border-box;\r\n  scrollbar-width: none;\r\n  -ms-overflow-style: none;\r\n}\r\n.dp-dock::-webkit-scrollbar { display: none; }\r\n.dp-dock.dp-dock-bottom {\r\n  bottom: 0; left: 0; right: 0;\r\n  flex-direction: row;\r\n  height: 68px;\r\n  border-top: 1px solid var(--dp-dock-border, rgba(255,255,255,0.1));\r\n  overflow-x: auto;\r\n  overflow-y: hidden;\r\n}\r\n.dp-dock.dp-dock-top {\r\n  top: 0; left: 0; right: 0;\r\n  flex-direction: row;\r\n  height: 68px;\r\n  border-bottom: 1px solid var(--dp-dock-border, rgba(255,255,255,0.1));\r\n  overflow-x: auto;\r\n  overflow-y: hidden;\r\n}\r\n.dp-dock.dp-dock-left {\r\n  top: 0; left: 0; bottom: 0;\r\n  flex-direction: column;\r\n  width: 68px;\r\n  align-items: center;\r\n  justify-content: flex-start;\r\n  padding: 10px 6px;\r\n  border-right: 1px solid var(--dp-dock-border, rgba(255,255,255,0.1));\r\n  overflow-y: auto;\r\n  overflow-x: hidden;\r\n}\r\n.dp-dock.dp-dock-right {\r\n  top: 0; right: 0; bottom: 0;\r\n  flex-direction: column;\r\n  width: 68px;\r\n  align-items: center;\r\n  justify-content: flex-start;\r\n  padding: 10px 6px;\r\n  border-left: 1px solid var(--dp-dock-border, rgba(255,255,255,0.1));\r\n  overflow-y: auto;\r\n  overflow-x: hidden;\r\n}\r\n\r\n/* ── Dock item ───────────────────────────────────────── */\r\n.dp-dock-item {\r\n  display: flex;\r\n  flex-direction: column;\r\n  align-items: center;\r\n  justify-content: center;\r\n  cursor: pointer;\r\n  border-radius: 10px;\r\n  padding: 4px 6px;\r\n  position: relative;\r\n  transition: transform 0.15s, background 0.12s;\r\n  flex-shrink: 0;\r\n}\r\n.dp-dock-item:hover {\r\n  background: var(--dp-dock-item-hover-bg, rgba(255,255,255,0.12));\r\n  transform: scale(1.15) translateY(-3px);\r\n}\r\n.dp-dock-item.dp-dock-dragging {\r\n  opacity: 0.4;\r\n}\r\n.dp-dock-item.dp-dock-dragover {\r\n  background: rgba(74,158,255,0.25);\r\n  outline: 2px dashed rgba(74,158,255,0.7);\r\n  transform: scale(1.1);\r\n}\r\n.dp-dock-item.dp-dock-active {\r\n  background: rgba(74,158,255,0.2);\r\n}\r\n.dp-dock-item.dp-dock-active::after {\r\n  content: '';\r\n  position: absolute;\r\n  bottom: -5px;\r\n  left: 50%;\r\n  transform: translateX(-50%);\r\n  width: 5px;\r\n  height: 5px;\r\n  border-radius: 50%;\r\n  background: rgba(74,158,255,0.9);\r\n}\r\n.dp-dock.dp-dock-top .dp-dock-item.dp-dock-active::after {\r\n  bottom: unset;\r\n  top: -5px;\r\n}\r\n.dp-dock.dp-dock-left .dp-dock-item.dp-dock-active::after {\r\n  bottom: unset;\r\n  top: 50%;\r\n  left: -5px;\r\n  transform: translateY(-50%);\r\n}\r\n.dp-dock.dp-dock-right .dp-dock-item.dp-dock-active::after {\r\n  bottom: unset;\r\n  top: 50%;\r\n  left: unset;\r\n  right: -5px;\r\n  transform: translateY(-50%);\r\n}\r\n\r\n/* ── Dock icon & label ───────────────────────────────── */\r\n.dp-dock-icon {\r\n  display: flex;\r\n  align-items: center;\r\n  justify-content: center;\r\n  border-radius: 8px;\r\n  overflow: hidden;\r\n  pointer-events: none;\r\n}\r\n.dp-dock-icon img {\r\n  width: 100%;\r\n  height: 100%;\r\n  object-fit: contain;\r\n}\r\n.dp-dock-label {\r\n  font-size: 10px;\r\n  color: var(--dp-desktop-icon-text, rgba(255,255,255,0.85));\r\n  margin-top: 2px;\r\n  white-space: nowrap;\r\n  overflow: hidden;\r\n  text-overflow: ellipsis;\r\n  max-width: 60px;\r\n  pointer-events: none;\r\n}\r\n\r\n/* ── Dock tooltip ────────────────────────────────────── */\r\n.dp-dock-tooltip {\r\n  position: absolute;\r\n  bottom: calc(100% + 6px);\r\n  left: 50%;\r\n  transform: translateX(-50%);\r\n  background: rgba(0,0,0,0.8);\r\n  color: #fff;\r\n  font-size: 11px;\r\n  padding: 3px 8px;\r\n  border-radius: 4px;\r\n  white-space: nowrap;\r\n  pointer-events: none;\r\n  opacity: 0;\r\n  transition: opacity 0.15s;\r\n}\r\n.dp-dock-item:hover .dp-dock-tooltip {\r\n  opacity: 1;\r\n}\r\n.dp-dock.dp-dock-left .dp-dock-tooltip,\r\n.dp-dock.dp-dock-right .dp-dock-tooltip {\r\n  bottom: unset;\r\n  top: 50%;\r\n  transform: translateY(-50%);\r\n}\r\n.dp-dock.dp-dock-left .dp-dock-tooltip {\r\n  left: calc(100% + 6px);\r\n}\r\n.dp-dock.dp-dock-right .dp-dock-tooltip {\r\n  left: unset;\r\n  right: calc(100% + 6px);\r\n}\r\n\r\n/* ── Dock group preview (Windows-style thumbnails) ───── */\r\n.dp-dock-group-preview {\r\n  position: fixed;\r\n  z-index: 99998;\r\n  display: flex;\r\n  flex-direction: row;\r\n  gap: 6px;\r\n  padding: 8px;\r\n  border-radius: 10px;\r\n  background: rgba(18, 20, 26, 0.92);\r\n  border: 1px solid rgba(255, 255, 255, 0.12);\r\n  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.65);\r\n  backdrop-filter: blur(14px);\r\n  pointer-events: auto;\r\n  opacity: 0;\r\n  transform: translateY(8px);\r\n  transition: opacity 0.15s ease, transform 0.15s ease;\r\n}\r\n.dp-dock-group-preview--visible {\r\n  opacity: 1;\r\n  transform: translateY(0);\r\n}\r\n.dp-dock-group-preview--top {\r\n  transform: translateY(-8px);\r\n}\r\n.dp-dock-group-preview--top.dp-dock-group-preview--visible {\r\n  transform: translateY(0);\r\n}\r\n.dp-dock-group-preview--left,\r\n.dp-dock-group-preview--right {\r\n  flex-direction: column;\r\n  transform: translateX(0);\r\n}\r\n\r\n/* ── Group card ──────────────────────────────────────── */\r\n.dp-dock-group-card {\r\n  display: flex;\r\n  flex-direction: column;\r\n  cursor: pointer;\r\n  border-radius: 6px;\r\n  border: 1px solid transparent;\r\n  overflow: hidden;\r\n  transition: border-color 0.12s, background 0.12s;\r\n}\r\n.dp-dock-group-card:hover {\r\n  border-color: rgba(255, 255, 255, 0.25);\r\n  background: rgba(255, 255, 255, 0.07);\r\n}\r\n\r\n/* ── Card header ─────────────────────────────────────── */\r\n.dp-dock-group-card-header {\r\n  display: flex;\r\n  align-items: center;\r\n  gap: 4px;\r\n  padding: 4px 4px 4px 7px;\r\n  height: 26px;\r\n  flex-shrink: 0;\r\n}\r\n.dp-dock-group-card-title {\r\n  flex: 1;\r\n  font-size: 11px;\r\n  color: rgba(255, 255, 255, 0.82);\r\n  white-space: nowrap;\r\n  overflow: hidden;\r\n  text-overflow: ellipsis;\r\n}\r\n.dp-dock-group-card-close {\r\n  flex-shrink: 0;\r\n  width: 18px;\r\n  height: 18px;\r\n  border: none;\r\n  border-radius: 50%;\r\n  background: transparent;\r\n  color: rgba(255, 255, 255, 0.45);\r\n  font-size: 9px;\r\n  cursor: pointer;\r\n  display: flex;\r\n  align-items: center;\r\n  justify-content: center;\r\n  opacity: 0;\r\n  transition: background 0.1s, opacity 0.1s, color 0.1s;\r\n  padding: 0;\r\n  line-height: 1;\r\n}\r\n.dp-dock-group-card:hover .dp-dock-group-card-close {\r\n  opacity: 1;\r\n}\r\n.dp-dock-group-card-close:hover {\r\n  background: rgba(210, 40, 40, 0.85);\r\n  color: #fff;\r\n}\r\n\r\n/* ── Card thumbnail ──────────────────────────────────── */\r\n.dp-dock-group-card-thumb {\r\n  position: relative;\r\n  overflow: hidden;\r\n  flex-shrink: 0;\r\n  background: rgba(0, 0, 0, 0.35);\r\n}\r\n\r\n/* ── Modal-blocked card shake ────────────────────────── */\r\n@keyframes dp-group-card-shake {\r\n  0%, 100% { transform: translateX(0); }\r\n  20%       { transform: translateX(-5px); }\r\n  40%       { transform: translateX(5px); }\r\n  60%       { transform: translateX(-4px); }\r\n  80%       { transform: translateX(3px); }\r\n}\r\n.dp-group-card--shake {\r\n  animation: dp-group-card-shake 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;\r\n}\r\n\r\n";

// ============================================================
// DeskPane — Runtime CSS injection helpers
// ============================================================
function isDeskPaneStyleNode(node) {
    if (node instanceof HTMLStyleElement) {
        if (node.dataset.dpStyle === 'true')
            return true;
        if (node.id.startsWith('dp-') && node.id.endsWith('-styles'))
            return true;
    }
    if (node instanceof HTMLLinkElement) {
        const href = node.getAttribute('href') ?? '';
        return href.includes('/deskpane') || href.includes('\\deskpane') || href.includes('deskpane');
    }
    return false;
}
function hasManualStyleLoaded(options) {
    const hrefPart = options.hrefPart.toLowerCase();
    for (const node of Array.from(document.querySelectorAll('style,link[rel~="stylesheet"]'))) {
        if (node instanceof HTMLStyleElement) {
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
// DeskPane-Desktop — CSS 注入（僅注入一次）
// ============================================================
const STYLE_ID = 'dp-desktop-styles';
/** 回傳 Desktop CSS 字串，供 injectStyles:false 的使用者自行管理樣式注入 */
function getDesktopCSS() {
    return DESKTOP_CSS;
}
function injectDesktopStyles() {
    injectRuntimeCSS({
        id: STYLE_ID,
        css: DESKTOP_CSS,
        hrefPart: 'deskpane-desktop.css',
        fingerprint: 'DeskPane-Desktop — Default Styles',
    });
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
                // 收集父視窗 + 所有子視窗
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
            // 子視窗（有 parentId）不在 Dock 獨立顯示
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

export { Desktop, DesktopCollectionView, DesktopIcon, Dock, getDesktopCSS };
//# sourceMappingURL=deskpane-desktop.es.js.map
