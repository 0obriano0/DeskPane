export type MenuPlacement = 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end';

export interface MenuActionItem {
  type?: 'item';
  id: string;
  label: string;
  icon?: string;
  shortcut?: string;
  disabled?: boolean;
  checked?: boolean;
  children?: MenuItemConfig[];
  action?: (event: MenuSelectEvent) => void;
}

export interface MenuSeparatorItem {
  type: 'separator';
  id?: string;
}

export type MenuItemConfig = MenuActionItem | MenuSeparatorItem;

export interface MenuSelectEvent {
  id: string;
  item: MenuActionItem;
  originalEvent: Event;
}

export type MenuCloseReason = 'api' | 'select' | 'outside' | 'escape' | 'destroy';

export interface MenuOpenEvent {
  element: HTMLElement;
  source: 'api' | 'pointer' | 'anchor';
}

export interface MenuCloseEvent {
  element: HTMLElement;
  reason: MenuCloseReason;
}

export type MenuEvent = 'menu:open' | 'menu:close' | 'menu:select';

export interface ContextMenuOptions {
  items?: MenuItemConfig[];
  target?: HTMLElement;
  injectStyles?: boolean;
  closeOnSelect?: boolean;
  className?: string;
}

export interface StartMenuHeader {
  label?: string;
  icon?: string;
}

export interface StartMenuOptions extends ContextMenuOptions {
  anchor: HTMLElement;
  secondaryItems?: MenuItemConfig[];
  footerItems?: MenuItemConfig[];
  header?: StartMenuHeader;
  placement?: MenuPlacement;
  offset?: number;
}
