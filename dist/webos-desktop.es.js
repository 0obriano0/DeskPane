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
    if (icon.startsWith('http') || icon.startsWith('/') || icon.startsWith('data:')) {
        const img = document.createElement('img');
        img.src = icon;
        img.alt = '';
        el.appendChild(img);
    }
    else if (icon.trim().startsWith('<svg')) {
        el.innerHTML = icon;
    }
    else {
        el.textContent = icon;
    }
    return el;
}
class Dock {
    constructor(config = {}) {
        this._dragSrcIndex = -1;
        this._activeId = null;
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
        // 恢復 active 狀態
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
    getElement() {
        return this._el;
    }
    destroy() {
        this._el.remove();
    }
}

// ============================================================
// WebOS-Desktop — DesktopIcon
// 桌面圖示：可拖曳自由定位，點擊觸發 action
// ============================================================
/** 判斷 icon 字串屬於哪種類型 */
function resolveIconEl(icon) {
    const el = document.createElement('div');
    el.className = 'wos-desktop-icon-img';
    if (icon.startsWith('http') || icon.startsWith('/') || icon.startsWith('data:')) {
        const img = document.createElement('img');
        img.src = icon;
        img.alt = '';
        el.appendChild(img);
    }
    else if (icon.trim().startsWith('<svg')) {
        el.innerHTML = icon;
    }
    else {
        el.textContent = icon;
    }
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

// ============================================================
// WebOS-Desktop — CSS 注入（僅注入一次）
// ============================================================
const STYLE_ID = 'wos-desktop-styles';
const DESKTOP_CSS = `
/* ── Desktop container ───────────────────────────────── */
.wos-desktop {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: var(--wos-desktop-bg, linear-gradient(135deg, #1a2a4a 0%, #0d1b2a 100%));
  user-select: none;
  font-family: var(--wos-font, system-ui, -apple-system, sans-serif);
}

/* ── Icon area ───────────────────────────────────────── */
.wos-desktop-icon-area {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  overflow: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(255,255,255,0.2) transparent;
}

/* ── Icon area snap guides ───────────────────────────── */
.wos-icon-snap-guide {
  position: absolute;
  pointer-events: none;
  z-index: 9999;
  display: none;
  background: var(--wos-snap-guide-color, rgba(0, 120, 255, 0.55));
}
.wos-icon-snap-guide.wos-snap-guide--v {
  width: 1px;
  top: 0;
  bottom: 0;
}
.wos-icon-snap-guide.wos-snap-guide--h {
  height: 1px;
  left: 0;
  right: 0;
}

/* ── Desktop icon ────────────────────────────────────── */
.wos-desktop-icon {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 80px;
  padding: 8px 4px 6px;
  cursor: pointer;
  border-radius: 8px;
  transition: background 0.12s;
}
.wos-desktop-icon:hover {
  background: var(--wos-desktop-icon-hover-bg, rgba(255,255,255,0.15));
}
.wos-desktop-icon.wos-icon-selected {
  background: rgba(74,158,255,0.35);
  outline: 1px solid rgba(74,158,255,0.6);
}
.wos-desktop-icon.wos-icon-dragging {
  opacity: 0.45;
  z-index: 9999;
}
.wos-desktop-icon-img {
  width: 48px;
  height: 48px;
  font-size: 38px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  overflow: hidden;
  pointer-events: none;
}
.wos-desktop-icon-img img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
.wos-desktop-icon-label {
  margin-top: 4px;
  font-size: 11px;
  color: var(--wos-desktop-icon-text, #fff);
  text-align: center;
  line-height: 1.3;
  max-width: 76px;
  word-break: break-word;
  text-shadow: 0 1px 3px rgba(0,0,0,0.7);
  pointer-events: none;
}

/* ── Dock ────────────────────────────────────────────── */
.wos-dock {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 4px;
  background: var(--wos-dock-bg, rgba(20,30,50,0.75));
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border: 1px solid var(--wos-dock-border, rgba(255,255,255,0.1));
  padding: 6px 10px;
  z-index: 9999;
  box-sizing: border-box;
  /* 隱藏 scrollbar 但保留捲動能力 */
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.wos-dock::-webkit-scrollbar { display: none; }
.wos-dock.wos-dock-bottom {
  bottom: 0; left: 0; right: 0;
  flex-direction: row;
  height: 68px;
  border-top: 1px solid var(--wos-dock-border, rgba(255,255,255,0.1));
  overflow-x: auto;
  overflow-y: hidden;
}
.wos-dock.wos-dock-top {
  top: 0; left: 0; right: 0;
  flex-direction: row;
  height: 68px;
  border-bottom: 1px solid var(--wos-dock-border, rgba(255,255,255,0.1));
  overflow-x: auto;
  overflow-y: hidden;
}
.wos-dock.wos-dock-left {
  top: 0; left: 0; bottom: 0;
  flex-direction: column;
  width: 68px;
  align-items: center;
  justify-content: flex-start;
  padding: 10px 6px;
  border-right: 1px solid var(--wos-dock-border, rgba(255,255,255,0.1));
  overflow-y: auto;
  overflow-x: hidden;
}
.wos-dock.wos-dock-right {
  top: 0; right: 0; bottom: 0;
  flex-direction: column;
  width: 68px;
  align-items: center;
  justify-content: flex-start;
  padding: 10px 6px;
  border-left: 1px solid var(--wos-dock-border, rgba(255,255,255,0.1));
  overflow-y: auto;
  overflow-x: hidden;
}

/* ── Dock item ───────────────────────────────────────── */
.wos-dock-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 10px;
  padding: 4px 6px;
  position: relative;
  transition: transform 0.15s, background 0.12s;
  flex-shrink: 0;
}
.wos-dock-item:hover {
  background: var(--wos-dock-item-hover-bg, rgba(255,255,255,0.12));
  transform: scale(1.15) translateY(-3px);
}
.wos-dock-item.wos-dock-dragging {
  opacity: 0.4;
}
.wos-dock-item.wos-dock-dragover {
  background: rgba(74,158,255,0.25);
  outline: 2px dashed rgba(74,158,255,0.7);
  transform: scale(1.1);
}
.wos-dock-item.wos-dock-active {
  background: rgba(74,158,255,0.2);
}
.wos-dock-item.wos-dock-active::after {
  content: '';
  position: absolute;
  bottom: -5px;
  left: 50%;
  transform: translateX(-50%);
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: rgba(74,158,255,0.9);
}
.wos-dock.wos-dock-top .wos-dock-item.wos-dock-active::after {
  bottom: unset;
  top: -5px;
}
.wos-dock.wos-dock-left .wos-dock-item.wos-dock-active::after {
  bottom: unset;
  top: 50%;
  left: -5px;
  transform: translateY(-50%);
}
.wos-dock.wos-dock-right .wos-dock-item.wos-dock-active::after {
  bottom: unset;
  top: 50%;
  left: unset;
  right: -5px;
  transform: translateY(-50%);
}
.wos-dock-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  overflow: hidden;
  pointer-events: none;
}
.wos-dock-icon img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
.wos-dock-label {
  font-size: 10px;
  color: var(--wos-desktop-icon-text, rgba(255,255,255,0.85));
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 60px;
  pointer-events: none;
}
.wos-dock-tooltip {
  position: absolute;
  bottom: calc(100% + 6px);
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0,0,0,0.8);
  color: #fff;
  font-size: 11px;
  padding: 3px 8px;
  border-radius: 4px;
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.15s;
}
.wos-dock-item:hover .wos-dock-tooltip {
  opacity: 1;
}
.wos-dock.wos-dock-left .wos-dock-tooltip,
.wos-dock.wos-dock-right .wos-dock-tooltip {
  bottom: unset;
  top: 50%;
  transform: translateY(-50%);
}
.wos-dock.wos-dock-left .wos-dock-tooltip {
  left: calc(100% + 6px);
}
.wos-dock.wos-dock-right .wos-dock-tooltip {
  left: unset;
  right: calc(100% + 6px);
}
`;
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
/** 圖示自動排列：每欄最多幾個 icon */
const AUTO_ROWS = 6;
/** 圖示格子寬度（px） */
const ICON_COL_W = 92;
/** 圖示格子高度（px） */
const ICON_ROW_H = 100;
/** 起始邊距（px） */
const ICON_MARGIN = 12;
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
        // 根據 Dock 位置調整 icon 區域邊距
        const dockPos = config.dock?.position ?? 'bottom';
        const DOCK_SIZE = 68; // 對齊 CSS .wos-dock-* 的高/寬
        const inset = dockInset(dockPos, DOCK_SIZE);
        const areaStyle = this._iconAreaEl.style;
        areaStyle.top = `${inset.top}px`;
        areaStyle.bottom = `${inset.bottom}px`;
        areaStyle.left = `${inset.left}px`;
        areaStyle.right = `${inset.right}px`;
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
                if (vGuide != null) {
                    guideV.style.left = `${vGuide.pos}px`;
                    guideV.style.display = 'block';
                }
                else {
                    guideV.style.display = 'none';
                }
            }
            if (guideH) {
                if (hGuide != null) {
                    guideH.style.top = `${hGuide.pos}px`;
                    guideH.style.display = 'block';
                }
                else {
                    guideH.style.display = 'none';
                }
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
        if (syncExisting && manager.getWindowIds) {
            manager.getWindowIds().forEach((id) => {
                const state = manager.getState?.(id);
                addDockItemForWindow({
                    id,
                    title: state?.title,
                });
            });
        }
        const cleanup = () => {
            offOpened();
            offClosed();
            offFocused();
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
    /** 取得桌面根元素（可作為 WindowManager 的 container） */
    getElement() {
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

export { Desktop, DesktopIcon, Dock };
//# sourceMappingURL=webos-desktop.es.js.map
