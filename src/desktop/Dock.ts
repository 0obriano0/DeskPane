// ============================================================
// WebOS-Desktop — Dock
// 工具列：支援圖示新增/移除 + 拖曳排序
// ============================================================

import { DockConfig, DockItemConfig, DockPosition } from './types.js';

function resolveIconEl(icon: string, size: number): HTMLElement {
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
  } else if (icon.trim().startsWith('<svg')) {
    el.innerHTML = icon;
  } else {
    el.textContent = icon;
  }
  return el;
}

export class Dock {
  private readonly _el: HTMLElement;
  private _items: DockItemConfig[];
  private readonly _position: DockPosition;
  private readonly _iconSize: number;
  private readonly _showLabels: boolean;
  private _dragSrcIndex = -1;

  constructor(config: DockConfig = {}) {
    this._items = [...(config.items ?? [])];
    this._position = config.position ?? 'bottom';
    this._iconSize = config.iconSize ?? 44;
    this._showLabels = config.showLabels ?? true;

    this._el = document.createElement('div');
    this._el.className = `wos-dock wos-dock-${this._position}`;
    this._render();
  }

  // ── Private ───────────────────────────────────────────────

  private _render(): void {
    this._el.innerHTML = '';
    this._items.forEach((item, index) => {
      this._el.appendChild(this._createItemEl(item, index));
    });
  }

  private _createItemEl(item: DockItemConfig, index: number): HTMLElement {
    const el = document.createElement('div');
    el.className = 'wos-dock-item';
    el.draggable = true;
    el.dataset.index = String(index);
    el.dataset.id = item.id;
    el.title = '';   // 使用自訂 tooltip，避免瀏覽器原生 title

    el.appendChild(resolveIconEl(item.icon, this._iconSize));

    if (this._showLabels) {
      const label = document.createElement('div');
      label.className = 'wos-dock-label';
      label.textContent = item.label;
      el.appendChild(label);
    } else {
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
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
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

  private _clearDragover(): void {
    this._el.querySelectorAll('.wos-dock-dragover').forEach(el => {
      el.classList.remove('wos-dock-dragover');
    });
  }

  // ── Public API ────────────────────────────────────────────

  addItem(item: DockItemConfig): void {
    this._items.push(item);
    this._render();
    // 恢復 active 狀態
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

  private _activeId: string | null = null;

  private _applyActive(id: string | null): void {
    this._el.querySelectorAll<HTMLElement>('.wos-dock-item').forEach(el => {
      el.classList.toggle('wos-dock-active', !!id && el.dataset.id === id);
    });
  }

  removeItem(id: string): void {
    const idx = this._items.findIndex(i => i.id === id);
    if (idx !== -1) {
      this._items.splice(idx, 1);
      this._render();
    }
  }

  /** 取得目前排列順序的 items（含拖曳後的結果） */
  getItems(): DockItemConfig[] {
    return [...this._items];
  }

  getElement(): HTMLElement {
    return this._el;
  }

  destroy(): void {
    this._el.remove();
  }
}
