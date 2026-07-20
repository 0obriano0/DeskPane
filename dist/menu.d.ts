/** 事件巴士回呼型別 */
type EventCallback<T = unknown> = (data: T) => void;

declare class EventBus {
    private readonly _listeners;
    /** 訂閱事件 */
    on<T = unknown>(event: string, cb: EventCallback<T>): () => void;
    /** 取消訂閱 */
    off<T = unknown>(event: string, cb: EventCallback<T>): void;
    /** 發送事件 */
    emit<T = unknown>(event: string, data?: T): void;
    /** 清除特定事件的所有訂閱 */
    clear(event: string): void;
    /** 清除全部訂閱 */
    clearAll(): void;
}

type MenuPlacement = 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end';
interface MenuActionItem {
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
interface MenuSeparatorItem {
    type: 'separator';
    id?: string;
}
type MenuItemConfig = MenuActionItem | MenuSeparatorItem;
interface MenuSelectEvent {
    id: string;
    item: MenuActionItem;
    originalEvent: Event;
}
type MenuCloseReason = 'api' | 'select' | 'outside' | 'escape' | 'destroy';
interface MenuOpenEvent {
    element: HTMLElement;
    source: 'api' | 'pointer' | 'anchor';
}
interface MenuCloseEvent {
    element: HTMLElement;
    reason: MenuCloseReason;
}
type MenuEvent = 'menu:open' | 'menu:close' | 'menu:select';
interface ContextMenuOptions {
    items?: MenuItemConfig[];
    target?: HTMLElement;
    injectStyles?: boolean;
    closeOnSelect?: boolean;
    className?: string;
}
interface StartMenuHeader {
    label?: string;
    icon?: string;
}
interface StartMenuOptions extends ContextMenuOptions {
    anchor: HTMLElement;
    secondaryItems?: MenuItemConfig[];
    footerItems?: MenuItemConfig[];
    header?: StartMenuHeader;
    placement?: MenuPlacement;
    offset?: number;
}

declare class ContextMenu {
    readonly events: EventBus;
    private readonly _surface;
    private readonly _bindings;
    constructor(options?: ContextMenuOptions);
    setItems(items: MenuItemConfig[]): void;
    showAt(clientX: number, clientY: number, items?: MenuItemConfig[]): void;
    showFor(anchor: HTMLElement, placement?: MenuPlacement, offset?: number, items?: MenuItemConfig[]): void;
    hide(): void;
    isOpen(): boolean;
    getElement(): HTMLElement;
    /** Bind the browser contextmenu gesture and return an unbind function. */
    bindTo(element: HTMLElement, getItems?: (event: MouseEvent) => MenuItemConfig[]): () => void;
    destroy(): void;
}

declare class StartMenu {
    readonly events: EventBus;
    private readonly _surface;
    private readonly _anchor;
    private readonly _placement;
    private readonly _offset;
    private readonly _previousHasPopup;
    private readonly _previousExpanded;
    constructor(options: StartMenuOptions);
    setItems(items: MenuItemConfig[]): void;
    setSecondaryItems(secondaryItems: MenuItemConfig[]): void;
    setFooterItems(footerItems: MenuItemConfig[]): void;
    setHeader(header: StartMenuHeader): void;
    open(): void;
    close(): void;
    toggle(): void;
    isOpen(): boolean;
    getElement(): HTMLElement;
    destroy(): void;
    private _setAnchorOpen;
    private _restoreAttribute;
    private readonly _onAnchorClick;
}

/** Return Menu CSS for applications that manage styles manually. */
declare function getMenuCSS(): string;

export { ContextMenu, StartMenu, getMenuCSS };
export type { ContextMenuOptions, MenuActionItem, MenuCloseEvent, MenuCloseReason, MenuEvent, MenuItemConfig, MenuOpenEvent, MenuPlacement, MenuSelectEvent, MenuSeparatorItem, StartMenuHeader, StartMenuOptions };
