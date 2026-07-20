// ============================================================
// DeskPane-Menu - StartMenu
// ============================================================

import { MenuSurface } from './MenuSurface.js';
import { injectMenuStyles } from './styles.js';
import type { MenuItemConfig, MenuPlacement, StartMenuHeader, StartMenuOptions } from './types.js';

export class StartMenu {
  readonly events;

  private readonly _surface: MenuSurface;
  private readonly _anchor: HTMLElement;
  private readonly _placement: MenuPlacement;
  private readonly _offset: number;
  private readonly _previousHasPopup: string | null;
  private readonly _previousExpanded: string | null;

  constructor(options: StartMenuOptions) {
    if (options.injectStyles !== false) injectMenuStyles();
    this._anchor = options.anchor;
    this._placement = options.placement ?? 'top-start';
    this._offset = options.offset ?? 6;
    this._previousHasPopup = this._anchor.getAttribute('aria-haspopup');
    this._previousExpanded = this._anchor.getAttribute('aria-expanded');

    this._surface = new MenuSurface({
      variant: 'start',
      items: options.items ?? [],
      secondaryItems: options.secondaryItems,
      footerItems: options.footerItems,
      header: options.header,
      target: options.target,
      closeOnSelect: options.closeOnSelect ?? true,
      className: options.className,
    });
    this.events = this._surface.events;
    this._surface.addOutsideIgnore(this._anchor);

    this._anchor.setAttribute('aria-haspopup', 'menu');
    this._anchor.setAttribute('aria-expanded', 'false');
    this._anchor.addEventListener('click', this._onAnchorClick);
    this._surface.events.on('menu:open', () => this._setAnchorOpen(true));
    this._surface.events.on('menu:close', () => this._setAnchorOpen(false));
  }

  setItems(items: MenuItemConfig[]): void {
    this._surface.setGroups({ items });
  }

  setSecondaryItems(secondaryItems: MenuItemConfig[]): void {
    this._surface.setGroups({ secondaryItems });
  }

  setFooterItems(footerItems: MenuItemConfig[]): void {
    this._surface.setGroups({ footerItems });
  }

  setHeader(header: StartMenuHeader): void {
    this._surface.setGroups({ header });
  }

  open(): void {
    this._surface.showFor(this._anchor, this._placement, this._offset);
  }

  close(): void {
    this._surface.hide('api');
  }

  toggle(): void {
    if (this.isOpen()) this.close();
    else this.open();
  }

  isOpen(): boolean {
    return this._surface.isOpen();
  }

  getElement(): HTMLElement {
    return this._surface.getElement();
  }

  destroy(): void {
    this._anchor.removeEventListener('click', this._onAnchorClick);
    this._surface.destroy();
    this._restoreAttribute('aria-haspopup', this._previousHasPopup);
    this._restoreAttribute('aria-expanded', this._previousExpanded);
    this._anchor.classList.remove('dp-start-button-active');
  }

  private _setAnchorOpen(open: boolean): void {
    this._anchor.setAttribute('aria-expanded', String(open));
    this._anchor.classList.toggle('dp-start-button-active', open);
  }

  private _restoreAttribute(name: string, value: string | null): void {
    if (value === null) this._anchor.removeAttribute(name);
    else this._anchor.setAttribute(name, value);
  }

  private readonly _onAnchorClick = (event: MouseEvent): void => {
    event.preventDefault();
    this.toggle();
  };
}
