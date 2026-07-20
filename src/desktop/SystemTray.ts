// ============================================================
// DeskPane-Desktop — SystemTray
// Optional status/action items designed for a Dock trailing slot.
// ============================================================

import { EventBus } from '../core/EventBus.js';
import { appendIconContent } from './iconUtils.js';

/** Visual badge content. Pass `null` to clear an existing badge. */
export type SystemTrayBadge = string | number | null;

/** Context emitted for activation and context-menu interactions. */
export interface SystemTrayItemEvent {
  id: string;
  item: Readonly<SystemTrayItemConfig>;
  element: HTMLElement;
  originalEvent: MouseEvent;
}

/** Context passed to custom item presentation renderers. */
export interface SystemTrayItemRendererContext {
  item: Readonly<SystemTrayItemConfig>;
  index: number;
  /** Managed `.dp-system-tray-item` host. Do not replace this element. */
  container: HTMLElement;
  /** Append the built-in icon and badge once. */
  renderDefault: () => void;
}

/**
 * Render presentation content inside a managed tray item host.
 * Return a Node, or append directly to `context.container` and return nothing.
 */
export type SystemTrayItemRenderer = (
  context: SystemTrayItemRendererContext,
) => Node | null | undefined | void;

/** One status or command item in a SystemTray. */
export interface SystemTrayItemConfig {
  id: string;
  /** Accessible label and default tooltip. */
  label: string;
  /** URL, inline SVG, emoji/text, or a DOM Node owned by this item. */
  icon?: string | Node;
  /** Optional compact counter or state marker. */
  badge?: SystemTrayBadge;
  /** Optional tooltip override. */
  title?: string;
  /** Disable activation while retaining the item in the tray. */
  disabled?: boolean;
  /**
   * Force interactive or status-only semantics.
   * Defaults to true when `action` is provided, otherwise false.
   */
  interactive?: boolean;
  /** Item-specific renderer. Takes precedence over the tray renderer. */
  renderer?: SystemTrayItemRenderer;
  /** Command invoked after `tray:item-activated` unless prevented. */
  action?: (event: SystemTrayItemEvent) => void;
}

export interface SystemTrayOptions {
  items?: SystemTrayItemConfig[];
  /** Accessible name for the tray toolbar. Defaults to `System tray`. */
  ariaLabel?: string;
  /** Fallback renderer used by items without their own renderer. */
  itemRenderer?: SystemTrayItemRenderer;
}

export type SystemTrayItemsChangeReason = 'set' | 'add' | 'update' | 'remove';

export interface SystemTrayItemsChangedEvent {
  reason: SystemTrayItemsChangeReason;
  items: SystemTrayItemConfig[];
}

export type SystemTrayEvent =
  | 'tray:item-activated'
  | 'tray:item-contextmenu'
  | 'tray:items-changed';

export type SystemTrayItemPatch = Partial<Omit<SystemTrayItemConfig, 'id'>>;

function copyItem(item: SystemTrayItemConfig): SystemTrayItemConfig {
  return { ...item };
}

export class SystemTray {
  readonly events = new EventBus();

  private readonly _el: HTMLElement;
  private _items: SystemTrayItemConfig[];
  private _itemRenderer: SystemTrayItemRenderer | null;

  constructor(options: SystemTrayOptions = {}) {
    this._items = (options.items ?? []).map(copyItem);
    this._assertUniqueIds(this._items);
    this._itemRenderer = options.itemRenderer ?? null;

    this._el = document.createElement('div');
    this._el.className = 'dp-system-tray';
    this._el.setAttribute('role', 'toolbar');
    this._el.setAttribute('aria-label', options.ariaLabel ?? 'System tray');
    this._render();
  }

  private _assertUniqueIds(items: SystemTrayItemConfig[]): void {
    const ids = new Set<string>();
    for (const item of items) {
      if (!item.id) throw new Error('[SystemTray] Item id must not be empty.');
      if (ids.has(item.id)) throw new Error(`[SystemTray] Duplicate item id: "${item.id}".`);
      ids.add(item.id);
    }
  }

  private _render(): void {
    this._el.replaceChildren();
    this._items.forEach((item, index) => {
      this._el.appendChild(this._createItemElement(item, index));
    });
  }

  private _createItemElement(item: SystemTrayItemConfig, index: number): HTMLElement {
    const interactive = item.interactive ?? typeof item.action === 'function';
    const element = document.createElement(interactive ? 'button' : 'div');
    element.className = 'dp-system-tray-item';
    element.dataset.id = item.id;
    element.dataset.index = String(index);
    element.classList.toggle('dp-system-tray-item--status', !interactive);
    element.title = item.title ?? item.label;

    const badgeText = item.badge === null || item.badge === undefined || item.badge === ''
      ? ''
      : String(item.badge);
    element.setAttribute('aria-label', badgeText ? `${item.label} (${badgeText})` : item.label);

    if (element instanceof HTMLButtonElement) {
      element.type = 'button';
      element.disabled = item.disabled ?? false;
      element.addEventListener('click', event => this._activate(item, element, event));
    } else {
      element.setAttribute('role', 'status');
      if (item.disabled) element.setAttribute('aria-disabled', 'true');
    }

    element.addEventListener('contextmenu', event => {
      const mouseEvent = event as MouseEvent;
      this.events.emit<SystemTrayItemEvent>('tray:item-contextmenu', {
        id: item.id,
        item: copyItem(item),
        element,
        originalEvent: mouseEvent,
      });
    });

    let defaultRendered = false;
    const renderDefault = () => {
      if (defaultRendered) return;
      defaultRendered = true;
      this._renderDefaultContent(element, item, badgeText);
    };

    const renderer = item.renderer ?? this._itemRenderer;
    if (renderer) {
      const rendered = renderer({ item, index, container: element, renderDefault });
      if (rendered instanceof Node && rendered !== element && !element.contains(rendered)) {
        element.appendChild(rendered);
      }
    } else {
      renderDefault();
    }

    return element;
  }

  private _renderDefaultContent(
    element: HTMLElement,
    item: SystemTrayItemConfig,
    badgeText: string,
  ): void {
    if (item.icon !== undefined) {
      const icon = document.createElement('span');
      icon.className = 'dp-system-tray-icon';
      icon.setAttribute('aria-hidden', 'true');
      if (item.icon instanceof Node) {
        icon.appendChild(item.icon);
      } else {
        appendIconContent(icon, item.icon);
      }
      element.appendChild(icon);
    }

    if (badgeText) {
      const badge = document.createElement('span');
      badge.className = 'dp-system-tray-badge';
      badge.setAttribute('aria-hidden', 'true');
      badge.textContent = badgeText;
      element.appendChild(badge);
    }
  }

  private _activate(item: SystemTrayItemConfig, element: HTMLElement, originalEvent: MouseEvent): void {
    if (item.disabled) return;
    const event: SystemTrayItemEvent = {
      id: item.id,
      item: copyItem(item),
      element,
      originalEvent,
    };
    this.events.emit<SystemTrayItemEvent>('tray:item-activated', event);
    if (!originalEvent.defaultPrevented) item.action?.(event);
  }

  private _emitItemsChanged(reason: SystemTrayItemsChangeReason): void {
    this.events.emit<SystemTrayItemsChangedEvent>('tray:items-changed', {
      reason,
      items: this.getItems(),
    });
  }

  setItems(items: SystemTrayItemConfig[]): void {
    const next = items.map(copyItem);
    this._assertUniqueIds(next);
    this._items = next;
    this._render();
    this._emitItemsChanged('set');
  }

  addItem(item: SystemTrayItemConfig, index = this._items.length): void {
    if (this._items.some(current => current.id === item.id)) {
      throw new Error(`[SystemTray] Duplicate item id: "${item.id}".`);
    }
    const insertionIndex = Math.max(0, Math.min(index, this._items.length));
    this._items.splice(insertionIndex, 0, copyItem(item));
    this._render();
    this._emitItemsChanged('add');
  }

  updateItem(id: string, patch: SystemTrayItemPatch): boolean {
    const index = this._items.findIndex(item => item.id === id);
    if (index === -1) return false;
    this._items[index] = { ...this._items[index], ...patch, id };
    this._render();
    this._emitItemsChanged('update');
    return true;
  }

  removeItem(id: string): boolean {
    const index = this._items.findIndex(item => item.id === id);
    if (index === -1) return false;
    this._items.splice(index, 1);
    this._render();
    this._emitItemsChanged('remove');
    return true;
  }

  setBadge(id: string, badge: SystemTrayBadge): boolean {
    return this.updateItem(id, { badge });
  }

  setDisabled(id: string, disabled: boolean): boolean {
    return this.updateItem(id, { disabled });
  }

  setItemRenderer(renderer: SystemTrayItemRenderer | null): void {
    if (renderer === this._itemRenderer) return;
    this._itemRenderer = renderer;
    this._render();
  }

  /** Re-run renderers without changing item data. */
  refresh(): void {
    this._render();
  }

  getItems(): SystemTrayItemConfig[] {
    return this._items.map(copyItem);
  }

  getItem(id: string): SystemTrayItemConfig | undefined {
    const item = this._items.find(current => current.id === id);
    return item ? copyItem(item) : undefined;
  }

  getItemElement(id: string): HTMLElement | null {
    return this._el.querySelector<HTMLElement>(
      `.dp-system-tray-item[data-id="${CSS.escape(id)}"]`,
    );
  }

  getElement(): HTMLElement {
    return this._el;
  }

  destroy(): void {
    this.events.clearAll();
    this._el.remove();
  }
}
