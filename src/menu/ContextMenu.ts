// ============================================================
// DeskPane-Menu - ContextMenu
// ============================================================

import { MenuSurface } from './MenuSurface.js';
import { injectMenuStyles } from './styles.js';
import type { ContextMenuOptions, MenuItemConfig, MenuPlacement } from './types.js';

export class ContextMenu {
  readonly events;

  private readonly _surface: MenuSurface;
  private readonly _bindings = new Set<() => void>();

  constructor(options: ContextMenuOptions = {}) {
    if (options.injectStyles !== false) injectMenuStyles();
    this._surface = new MenuSurface({
      variant: 'context',
      items: options.items ?? [],
      target: options.target,
      closeOnSelect: options.closeOnSelect ?? true,
      className: options.className,
    });
    this.events = this._surface.events;
  }

  setItems(items: MenuItemConfig[]): void {
    this._surface.setGroups({ items });
  }

  showAt(clientX: number, clientY: number, items?: MenuItemConfig[]): void {
    if (items) this.setItems(items);
    this._surface.showAt(clientX, clientY);
  }

  showFor(
    anchor: HTMLElement,
    placement: MenuPlacement = 'bottom-start',
    offset = 4,
    items?: MenuItemConfig[],
  ): void {
    if (items) this.setItems(items);
    this._surface.showFor(anchor, placement, offset);
  }

  hide(): void {
    this._surface.hide('api');
  }

  isOpen(): boolean {
    return this._surface.isOpen();
  }

  getElement(): HTMLElement {
    return this._surface.getElement();
  }

  /** Bind the browser contextmenu gesture and return an unbind function. */
  bindTo(element: HTMLElement, getItems?: (event: MouseEvent) => MenuItemConfig[]): () => void {
    const handler = (event: MouseEvent): void => {
      event.preventDefault();
      const items = getItems?.(event);
      if (items) this.setItems(items);
      this._surface.showAt(event.clientX, event.clientY, 'pointer');
    };
    element.addEventListener('contextmenu', handler);
    const cleanup = (): void => {
      element.removeEventListener('contextmenu', handler);
      this._bindings.delete(cleanup);
    };
    this._bindings.add(cleanup);
    return cleanup;
  }

  destroy(): void {
    Array.from(this._bindings).forEach(cleanup => cleanup());
    this._surface.destroy();
  }
}
