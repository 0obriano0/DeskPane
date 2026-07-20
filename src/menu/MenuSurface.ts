// ============================================================
// DeskPane-Menu - Shared menu surface and interaction engine
// ============================================================

import { EventBus } from '../core/EventBus.js';
import { appendMenuIcon } from './iconUtils.js';
import type {
  MenuActionItem,
  MenuCloseReason,
  MenuItemConfig,
  MenuPlacement,
  MenuSelectEvent,
  StartMenuHeader,
} from './types.js';

type MenuVariant = 'context' | 'start';

interface MenuSurfaceOptions {
  variant: MenuVariant;
  items: MenuItemConfig[];
  secondaryItems?: MenuItemConfig[];
  footerItems?: MenuItemConfig[];
  header?: StartMenuHeader;
  target?: HTMLElement;
  closeOnSelect: boolean;
  className?: string;
}

interface MenuGroups {
  items: MenuItemConfig[];
  secondaryItems?: MenuItemConfig[];
  footerItems?: MenuItemConfig[];
  header?: StartMenuHeader;
}

export class MenuSurface {
  readonly events = new EventBus();

  private readonly _el: HTMLElement;
  private readonly _target: HTMLElement;
  private readonly _variant: MenuVariant;
  private readonly _closeOnSelect: boolean;
  private readonly _outsideIgnore = new Set<HTMLElement>();
  private _groups: MenuGroups;
  private _destroyed = false;

  constructor(options: MenuSurfaceOptions) {
    this._variant = options.variant;
    this._target = options.target ?? document.body;
    this._closeOnSelect = options.closeOnSelect;
    this._groups = {
      items: [...options.items],
      secondaryItems: [...(options.secondaryItems ?? [])],
      footerItems: [...(options.footerItems ?? [])],
      header: options.header,
    };

    this._el = document.createElement('div');
    this._el.className = `dp-menu dp-${options.variant}-menu`;
    if (options.className) this._el.classList.add(...options.className.split(/\s+/).filter(Boolean));
    this._el.hidden = true;
    this._el.setAttribute('role', 'menu');
    this._el.setAttribute('aria-hidden', 'true');
    this._el.addEventListener('keydown', this._onKeyDown);
    this._target.appendChild(this._el);

    document.addEventListener('pointerdown', this._onDocumentPointerDown, true);
    window.addEventListener('resize', this._onViewportChange);
    window.addEventListener('blur', this._onViewportChange);
    this._render();
  }

  setGroups(groups: Partial<MenuGroups>): void {
    this._groups = {
      items: groups.items ? [...groups.items] : this._groups.items,
      secondaryItems: groups.secondaryItems ? [...groups.secondaryItems] : this._groups.secondaryItems,
      footerItems: groups.footerItems ? [...groups.footerItems] : this._groups.footerItems,
      header: groups.header === undefined ? this._groups.header : groups.header,
    };
    this._render();
  }

  addOutsideIgnore(element: HTMLElement): void {
    this._outsideIgnore.add(element);
  }

  showAt(clientX: number, clientY: number, source: 'api' | 'pointer' = 'api'): void {
    this._prepareOpen();
    this._position(clientX, clientY);
    this._finishOpen(source);
  }

  showFor(anchor: HTMLElement, placement: MenuPlacement, offset: number): void {
    this._prepareOpen();
    const anchorRect = anchor.getBoundingClientRect();
    const menuRect = this._el.getBoundingClientRect();
    let x = placement.endsWith('end') ? anchorRect.right - menuRect.width : anchorRect.left;
    let y = placement.startsWith('top')
      ? anchorRect.top - menuRect.height - offset
      : anchorRect.bottom + offset;

    const bounds = this._getBounds();
    if (placement.startsWith('top') && y < bounds.top) y = anchorRect.bottom + offset;
    if (placement.startsWith('bottom') && y + menuRect.height > bounds.bottom) {
      const above = anchorRect.top - menuRect.height - offset;
      if (above >= bounds.top) y = above;
    }

    this._position(x, y);
    this._finishOpen('anchor');
  }

  hide(reason: MenuCloseReason = 'api'): void {
    if (this._el.hidden) return;
    this._el.hidden = true;
    this._el.style.visibility = '';
    this._el.setAttribute('aria-hidden', 'true');
    this._el.querySelectorAll('.dp-menu-entry--expanded').forEach(node => {
      node.classList.remove('dp-menu-entry--expanded');
    });
    this.events.emit('menu:close', { element: this._el, reason });
  }

  isOpen(): boolean {
    return !this._el.hidden;
  }

  getElement(): HTMLElement {
    return this._el;
  }

  destroy(): void {
    if (this._destroyed) return;
    this._destroyed = true;
    this.hide('destroy');
    document.removeEventListener('pointerdown', this._onDocumentPointerDown, true);
    window.removeEventListener('resize', this._onViewportChange);
    window.removeEventListener('blur', this._onViewportChange);
    this._el.removeEventListener('keydown', this._onKeyDown);
    this._el.remove();
    this._outsideIgnore.clear();
    this.events.clearAll();
  }

  private _render(): void {
    this._el.innerHTML = '';

    if (this._variant === 'start') {
      if (this._groups.header?.label || this._groups.header?.icon) {
        this._el.appendChild(this._createHeader(this._groups.header));
      }

      const body = document.createElement('div');
      body.className = 'dp-start-menu-body';

      const primary = document.createElement('div');
      primary.className = 'dp-start-menu-primary';
      primary.appendChild(this._createList(this._groups.items));
      body.appendChild(primary);

      if (this._groups.secondaryItems?.length) {
        const secondary = document.createElement('div');
        secondary.className = 'dp-start-menu-secondary';
        secondary.appendChild(this._createList(this._groups.secondaryItems));
        body.appendChild(secondary);
      }

      this._el.appendChild(body);

      if (this._groups.footerItems?.length) {
        const footer = document.createElement('div');
        footer.className = 'dp-start-menu-footer';
        footer.appendChild(this._createList(this._groups.footerItems));
        this._el.appendChild(footer);
      }
      return;
    }

    this._el.appendChild(this._createList(this._groups.items));
  }

  private _createHeader(header: StartMenuHeader): HTMLElement {
    const el = document.createElement('div');
    el.className = 'dp-start-menu-header';

    if (header.icon) {
      const icon = document.createElement('span');
      icon.className = 'dp-start-menu-header-icon';
      appendMenuIcon(icon, header.icon);
      el.appendChild(icon);
    }

    if (header.label) {
      const label = document.createElement('span');
      label.className = 'dp-start-menu-header-label';
      label.textContent = header.label;
      el.appendChild(label);
    }

    return el;
  }

  private _createList(items: MenuItemConfig[]): HTMLUListElement {
    const list = document.createElement('ul');
    list.className = 'dp-menu-list';
    list.setAttribute('role', 'menu');

    items.forEach((item) => {
      if (item.type === 'separator') {
        const separator = document.createElement('li');
        separator.className = 'dp-menu-separator';
        separator.setAttribute('role', 'separator');
        if (item.id) separator.dataset.menuId = item.id;
        list.appendChild(separator);
        return;
      }

      const entry = document.createElement('li');
      entry.className = 'dp-menu-entry';
      entry.setAttribute('role', 'none');

      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'dp-menu-item';
      button.dataset.menuId = item.id;
      button.disabled = item.disabled === true;
      button.setAttribute('role', item.checked === undefined ? 'menuitem' : 'menuitemcheckbox');
      if (item.checked !== undefined) button.setAttribute('aria-checked', String(item.checked));

      const check = document.createElement('span');
      check.className = 'dp-menu-check';
      check.setAttribute('aria-hidden', 'true');
      check.textContent = item.checked ? '✓' : '';
      button.appendChild(check);

      const icon = document.createElement('span');
      icon.className = 'dp-menu-icon';
      icon.setAttribute('aria-hidden', 'true');
      if (item.icon) appendMenuIcon(icon, item.icon);
      button.appendChild(icon);

      const label = document.createElement('span');
      label.className = 'dp-menu-label';
      label.textContent = item.label;
      button.appendChild(label);

      if (item.shortcut) {
        const shortcut = document.createElement('span');
        shortcut.className = 'dp-menu-shortcut';
        shortcut.textContent = item.shortcut;
        button.appendChild(shortcut);
      }

      if (item.children?.length) {
        button.setAttribute('aria-haspopup', 'menu');
        button.setAttribute('aria-expanded', 'false');
        const arrow = document.createElement('span');
        arrow.className = 'dp-menu-submenu-arrow';
        arrow.setAttribute('aria-hidden', 'true');
        arrow.textContent = '›';
        button.appendChild(arrow);

        const submenu = document.createElement('div');
        submenu.className = 'dp-menu-submenu';
        submenu.appendChild(this._createList(item.children));
        entry.append(button, submenu);
        entry.addEventListener('pointerenter', () => this._positionSubmenu(entry, submenu));
        button.addEventListener('click', (event) => {
          event.preventDefault();
          this._positionSubmenu(entry, submenu);
          const expanded = entry.classList.toggle('dp-menu-entry--expanded');
          button.setAttribute('aria-expanded', String(expanded));
          if (expanded) this._focusFirst(submenu);
        });
      } else {
        entry.appendChild(button);
        button.addEventListener('click', (event) => this._selectItem(item, event));
      }

      list.appendChild(entry);
    });

    return list;
  }

  private _selectItem(item: MenuActionItem, originalEvent: Event): void {
    if (item.disabled) return;
    const event: MenuSelectEvent = { id: item.id, item, originalEvent };
    this.events.emit('menu:select', event);
    item.action?.(event);
    if (this._closeOnSelect) this.hide('select');
  }

  private _prepareOpen(): void {
    if (this._destroyed) throw new Error('Cannot open a destroyed menu.');
    this._el.hidden = false;
    this._el.style.position = 'fixed';
    this._el.style.visibility = 'hidden';
    this._el.style.left = '0px';
    this._el.style.top = '0px';
    this._el.setAttribute('aria-hidden', 'false');
  }

  private _finishOpen(source: 'api' | 'pointer' | 'anchor'): void {
    this._el.style.visibility = '';
    this._focusFirst(this._el);
    this.events.emit('menu:open', { element: this._el, source });
  }

  private _position(clientX: number, clientY: number): void {
    const rect = this._el.getBoundingClientRect();
    const bounds = this._getBounds();
    const margin = 4;
    const [minX, maxX] = this._getClampRange(
      bounds.left,
      bounds.right,
      rect.width,
      window.innerWidth,
      margin,
    );
    const [minY, maxY] = this._getClampRange(
      bounds.top,
      bounds.bottom,
      rect.height,
      window.innerHeight,
      margin,
    );
    const x = Math.min(Math.max(clientX, minX), maxX);
    const y = Math.min(Math.max(clientY, minY), maxY);
    this._el.style.left = `${Math.round(x)}px`;
    this._el.style.top = `${Math.round(y)}px`;
  }

  private _getClampRange(
    targetStart: number,
    targetEnd: number,
    size: number,
    viewportEnd: number,
    margin: number,
  ): [number, number] {
    const viewportMin = margin;
    const viewportMax = Math.max(viewportMin, viewportEnd - size - margin);
    const targetMin = Math.max(viewportMin, targetStart + margin);
    const targetMax = Math.min(viewportMax, targetEnd - size - margin);
    return targetMax >= targetMin
      ? [targetMin, targetMax]
      : [viewportMin, viewportMax];
  }

  private _getBounds(): DOMRect {
    if (this._target === document.body || this._target === document.documentElement) {
      return new DOMRect(0, 0, window.innerWidth, window.innerHeight);
    }
    return this._target.getBoundingClientRect();
  }

  private _focusFirst(scope: ParentNode): void {
    scope.querySelector<HTMLButtonElement>('.dp-menu-item:not(:disabled)')?.focus();
  }

  private _positionSubmenu(entry: HTMLElement, submenu: HTMLElement): void {
    submenu.classList.remove('dp-menu-submenu--flip');
    submenu.style.top = '-5px';
    submenu.style.display = 'block';
    submenu.style.visibility = 'hidden';

    const bounds = this._getBounds();
    const entryRect = entry.getBoundingClientRect();
    let submenuRect = submenu.getBoundingClientRect();
    const margin = 4;

    const visibleLeft = Math.max(0, bounds.left) + margin;
    const visibleRight = Math.min(window.innerWidth, bounds.right) - margin;
    if (
      submenuRect.right > visibleRight
      && entryRect.left - submenuRect.width >= visibleLeft
    ) {
      submenu.classList.add('dp-menu-submenu--flip');
      submenuRect = submenu.getBoundingClientRect();
    }

    const [minTop, maxTop] = this._getClampRange(
      bounds.top,
      bounds.bottom,
      submenuRect.height,
      window.innerHeight,
      margin,
    );
    const clampedTop = Math.min(Math.max(submenuRect.top, minTop), maxTop);
    submenu.style.top = `${Math.round(clampedTop - entryRect.top)}px`;
    submenu.style.display = '';
    submenu.style.visibility = '';
  }

  private _visibleButtons(list: Element): HTMLButtonElement[] {
    return Array.from(list.querySelectorAll<HTMLButtonElement>(':scope > .dp-menu-entry > .dp-menu-item:not(:disabled)'));
  }

  private readonly _onDocumentPointerDown = (event: PointerEvent): void => {
    if (this._el.hidden) return;
    const target = event.target;
    if (!(target instanceof Node)) return;
    if (this._el.contains(target)) return;
    if (Array.from(this._outsideIgnore).some(element => element.contains(target))) return;
    this.hide('outside');
  };

  private readonly _onViewportChange = (): void => {
    if (!this._el.hidden) this.hide('outside');
  };

  private readonly _onKeyDown = (event: KeyboardEvent): void => {
    const target = event.target;
    if (!(target instanceof HTMLButtonElement) || !target.classList.contains('dp-menu-item')) {
      if (event.key === 'Escape') this.hide('escape');
      return;
    }

    const list = target.closest('.dp-menu-list');
    if (!list) return;
    const buttons = this._visibleButtons(list);
    const index = buttons.indexOf(target);

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      let next = index;
      if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = buttons.length - 1;
      else if (event.key === 'ArrowDown') next = (index + 1) % buttons.length;
      else next = (index - 1 + buttons.length) % buttons.length;
      buttons[next]?.focus();
      return;
    }

    if (event.key === 'ArrowRight') {
      const entry = target.closest('.dp-menu-entry');
      const submenu = entry?.querySelector<HTMLElement>(':scope > .dp-menu-submenu');
      if (submenu && entry instanceof HTMLElement) {
        event.preventDefault();
        this._positionSubmenu(entry, submenu);
        entry.classList.add('dp-menu-entry--expanded');
        target.setAttribute('aria-expanded', 'true');
        this._focusFirst(submenu);
      }
      return;
    }

    if (event.key === 'ArrowLeft') {
      const submenu = target.closest('.dp-menu-submenu');
      const parentEntry = submenu?.parentElement;
      const parentButton = parentEntry?.querySelector<HTMLButtonElement>(':scope > .dp-menu-item');
      if (parentButton) {
        event.preventDefault();
        parentEntry?.classList.remove('dp-menu-entry--expanded');
        parentButton.setAttribute('aria-expanded', 'false');
        parentButton.focus();
      }
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      this.hide('escape');
    }
  };
}
