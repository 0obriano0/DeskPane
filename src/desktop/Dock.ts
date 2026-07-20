// ============================================================
// DeskPane-Desktop — Dock
// 工具列：支援圖示新增/移除 + 拖曳排序
// ============================================================

import {
  DockConfig,
  DockItemConfig,
  DockItemLayout,
  DockItemRenderer,
  DockPosition,
  DockSlotContent,
  DockSlotName,
} from './types.js';
import { appendIconContent } from './iconUtils.js';

function resolveIconEl(icon: string, size: number): HTMLElement {
  const el = document.createElement('div');
  el.className = 'dp-dock-icon';
  el.style.width = `${size}px`;
  el.style.height = `${size}px`;
  el.style.fontSize = `${Math.floor(size * 0.72)}px`;
  el.style.lineHeight = '1';
  appendIconContent(el, icon);
  return el;
}

export class Dock {
  private readonly _el: HTMLElement;
  private _items: DockItemConfig[];
  private _position: DockPosition;
  private readonly _iconSize: number;
  private readonly _showLabels: boolean;
  private _itemLayout: DockItemLayout;
  private _itemRenderer: DockItemRenderer | null;
  private _leading: DockSlotContent | null;
  private _trailing: DockSlotContent | null;
  private _dragSrcIndex = -1;
  private _activeId: string | null = null;
  private readonly _renderCallbacks = new Set<() => void>();

  constructor(config: DockConfig = {}) {
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

  private _render(): void {
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

  private _syncItemLayoutClass(): void {
    this._el.classList.toggle('dp-dock--taskbar', this._itemLayout === 'taskbar');
  }

  private _hasSlots(): boolean {
    return this._leading !== null || this._trailing !== null;
  }

  private _createSlotEl(slot: DockSlotName, content: DockSlotContent | null): HTMLElement {
    const el = document.createElement('div');
    el.className = `dp-dock-slot dp-dock-${slot}`;
    el.dataset.slot = slot;

    if (typeof content === 'function') {
      const rendered = content({ slot, position: this._position, container: el });
      if (rendered instanceof Node) el.appendChild(rendered);
    } else if (content instanceof Node) {
      el.appendChild(content);
    }

    return el;
  }

  private _renderDefaultItemContent(el: HTMLElement, item: DockItemConfig): void {
    el.appendChild(resolveIconEl(item.icon, this._iconSize));

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

  private _createItemEl(item: DockItemConfig, index: number): HTMLElement {
    const el = document.createElement('div');
    el.className = 'dp-dock-item';
    el.draggable = true;
    el.dataset.index = String(index);
    el.dataset.id = item.id;
    el.title = '';   // 使用自訂 tooltip，避免瀏覽器原生 title
    el.tabIndex = 0;
    el.setAttribute('role', 'button');
    el.setAttribute('aria-label', item.label);

    let defaultRendered = false;
    const renderDefault = () => {
      if (defaultRendered) return;
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
    } else {
      renderDefault();
    }

    // Click
    el.addEventListener('click', event => {
      if (!event.defaultPrevented) item.action();
    });
    el.addEventListener('keydown', event => {
      if (event.target !== el || (event.key !== 'Enter' && event.key !== ' ')) return;
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
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
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
        if (this._activeId) this._applyActive(this._activeId);
      }
      this._dragSrcIndex = -1;
    });

    return el;
  }

  private _clearDragover(): void {
    this._el.querySelectorAll('.dp-dock-dragover').forEach(el => {
      el.classList.remove('dp-dock-dragover');
    });
  }

  // ── Public API ────────────────────────────────────────────

  addItem(item: DockItemConfig): void {
    this._items.push(item);
    this._render();
    if (this._activeId) this._applyActive(this._activeId);
  }

  /** 在指定索引位置插入 item（0 = 最左/最上）。超出範圍時自動夾緊。 */
  addItemAt(item: DockItemConfig, index: number): void {
    const i = Math.max(0, Math.min(index, this._items.length));
    this._items.splice(i, 0, item);
    this._render();
    if (this._activeId) this._applyActive(this._activeId);
  }

  /**
   * 設定目前 active（focused）的 item。
   * 傳 null 清除所有高亮。
   */
  setActiveItem(id: string | null): void {
    this._activeId = id;
    this._applyActive(id);
  }

  private _applyActive(id: string | null): void {
    this._el.querySelectorAll<HTMLElement>('.dp-dock-item').forEach(el => {
      el.classList.toggle('dp-dock-active', !!id && el.dataset.id === id);
    });
  }

  removeItem(id: string): void {
    const idx = this._items.findIndex(i => i.id === id);
    if (idx !== -1) {
      this._items.splice(idx, 1);
      this._render();
      if (this._activeId) this._applyActive(this._activeId);
    }
  }

  /** 取得目前排列順序的 items（含拖曳後的結果） */
  getItems(): DockItemConfig[] {
    return [...this._items];
  }

  /** 動態變更 Dock 停靠位置 */
  setPosition(position: DockPosition): void {
    this._el.classList.remove(`dp-dock-${this._position}`);
    this._position = position;
    this._el.classList.add(`dp-dock-${this._position}`);
    if (this._hasSlots() || this._itemRenderer !== null) {
      this._render();
      if (this._activeId) this._applyActive(this._activeId);
    }
  }

  /** Switch between the classic Dock arrangement and a horizontal taskbar button layout. */
  setItemLayout(layout: DockItemLayout): void {
    if (layout === this._itemLayout) return;
    this._itemLayout = layout;
    this._syncItemLayoutClass();
    this._render();
    if (this._activeId) this._applyActive(this._activeId);
  }

  getItemLayout(): DockItemLayout {
    return this._itemLayout;
  }

  /** Replace the custom item content renderer. Pass null to restore built-in content. */
  setItemRenderer(renderer: DockItemRenderer | null): void {
    if (renderer === this._itemRenderer) return;
    this._itemRenderer = renderer;
    this._render();
    if (this._activeId) this._applyActive(this._activeId);
  }

  /**
   * Replace one optional Dock slot. Pass null to clear it.
   * When both slots are clear, Dock restores the legacy direct-item DOM.
   */
  setSlot(slot: DockSlotName, content: DockSlotContent | null): void {
    if (slot === 'leading') {
      this._leading = content;
    } else {
      this._trailing = content;
    }
    this._render();
    if (this._activeId) this._applyActive(this._activeId);
  }

  setLeading(content: DockSlotContent | null): void {
    this.setSlot('leading', content);
  }

  setTrailing(content: DockSlotContent | null): void {
    this.setSlot('trailing', content);
  }

  /** Return a slot host when slotted mode is active. */
  getSlotElement(slot: DockSlotName): HTMLElement | null {
    return this._el.querySelector<HTMLElement>(`:scope > .dp-dock-${slot}`);
  }

  /**
   * Return the scrollable center item strip.
   * Legacy mode returns the Dock root because items remain direct children.
   */
  getItemsElement(): HTMLElement {
    return this._el.querySelector<HTMLElement>(':scope > .dp-dock-items') ?? this._el;
  }

  /** 取得特定 item 的 DOM 元素 */
  getItemElement(id: string): HTMLElement | null {
    return this._el.querySelector<HTMLElement>(`.dp-dock-item[data-id="${CSS.escape(id)}"]`);
  }

  /** 取得目前 Dock 停靠位置 */
  getPosition(): DockPosition {
    return this._position;
  }

  getElement(): HTMLElement {
    return this._el;
  }

  /**
   * 每次 Dock 重新渲染（addItem / addItemAt / removeItem / 拖曳排序）後觸發 cb。
   * 回傳取消訂閱函式。
   */
  onRender(cb: () => void): () => void {
    this._renderCallbacks.add(cb);
    return () => this._renderCallbacks.delete(cb);
  }

  destroy(): void {
    this._el.remove();
  }
}
