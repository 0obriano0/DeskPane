// ============================================================
// DeskPane-Desktop — DesktopIcon
// 桌面圖示：可拖曳自由定位，點擊觸發 action
// ============================================================

import { DesktopIconConfig } from './types.js';
import { appendIconContent } from './iconUtils.js';

export type IconMoveCallback = (id: string, x: number, y: number) => void;
export type IconSelectCallback = (id: string) => void;
/** 傳入建議座標與大小，回傳吸附後座標（guides 更新由 Desktop 閉包處理） */
export type IconSnapFn = (x: number, y: number, w: number, h: number) => { x: number; y: number };

function resolveIconEl(icon: string): HTMLElement {
  const el = document.createElement('div');
  el.className = 'dp-desktop-icon-img';
  appendIconContent(el, icon);
  return el;
}

export class DesktopIcon {
  private readonly _el: HTMLElement;
  private readonly _config: DesktopIconConfig;
  private readonly _containerEl: HTMLElement;
  private readonly _onMove: IconMoveCallback;
  private readonly _dragThreshold: number;
  private readonly _snapFn: IconSnapFn | null;
  private readonly _onDragEnd: (() => void) | null;
  private readonly _onSelect: IconSelectCallback | null;

  private _isDragging = false;
  private _hasMoved = false;
  private _dragOffX = 0;
  private _dragOffY = 0;
  private _startX = 0;
  private _startY = 0;

  private readonly _onMouseMoveBound: (e: MouseEvent) => void;
  private readonly _onMouseUpBound: (e: MouseEvent) => void;

  constructor(
    config: DesktopIconConfig,
    containerEl: HTMLElement,
    onMove: IconMoveCallback,
    dragThreshold = 6,
    snapFn: IconSnapFn | null = null,
    onDragEnd: (() => void) | null = null,
    onSelect: IconSelectCallback | null = null
  ) {
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

  private _createElement(): HTMLElement {
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

  private _onMouseDown(e: MouseEvent): void {
    if (e.button !== 0) return;
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

  private _onMouseMove(e: MouseEvent): void {
    if (!this._isDragging) return;

    if (!this._hasMoved) {
      const dx = e.clientX - this._startX;
      const dy = e.clientY - this._startY;
      if (Math.sqrt(dx * dx + dy * dy) < this._dragThreshold) return;
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

  private _onMouseUp(_e: MouseEvent): void {
    document.removeEventListener('mousemove', this._onMouseMoveBound);
    document.removeEventListener('mouseup', this._onMouseUpBound);

    this._el.classList.remove('dp-icon-dragging');
    this._onDragEnd?.();

    if (!this._hasMoved) {
      // 純點擊，觸發 action
      this._config.action?.();
    } else {
      // 拖曳結束，通知 Desktop 儲存位置
      const x = parseInt(this._el.style.left || '0', 10);
      const y = parseInt(this._el.style.top || '0', 10);
      this._onMove(this._config.id, x, y);
    }

    this._isDragging = false;
    this._hasMoved = false;
  }

  setPosition(x: number, y: number): void {
    this._el.style.left = `${x}px`;
    this._el.style.top = `${y}px`;
  }

  getElement(): HTMLElement {
    return this._el;
  }

  getConfig(): DesktopIconConfig {
    return { ...this._config };
  }

  destroy(): void {
    document.removeEventListener('mousemove', this._onMouseMoveBound);
    document.removeEventListener('mouseup', this._onMouseUpBound);
    this._el.remove();
  }
}
