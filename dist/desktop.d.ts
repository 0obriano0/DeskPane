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

type DesktopCollectionChangeAction = 'reset' | 'refresh' | 'add' | 'remove' | 'update';
interface DesktopCollectionChangedEvent<TItem extends {
    id: string;
}> {
    action: DesktopCollectionChangeAction;
    source: string;
    items: TItem[];
    item?: TItem;
    previousItem?: TItem;
    id?: string;
    index?: number;
}
interface DesktopCollectionViewOptions<TItem extends {
    id: string;
}> {
    /** Custom key getter. Defaults to `item.id`. */
    getKey?: (item: TItem) => string;
    /**
     * Track added / removed / edited items when mutations go through the view.
     * Direct sourceCollection mutations still require refresh().
     */
    trackChanges?: boolean;
}
interface DesktopCollectionMutationOptions {
    /** Describes who initiated the change. */
    source?: string;
    /** Set false when the caller wants to batch or emit manually. */
    emit?: boolean;
}
declare class DesktopCollectionView<TItem extends {
    id: string;
}> {
    sourceCollection: TItem[];
    items: TItem[];
    readonly collectionChanged: EventBus;
    readonly currentChanged: EventBus;
    readonly trackChanges: boolean;
    readonly addedItems: TItem[];
    readonly removedItems: TItem[];
    readonly editedItems: TItem[];
    private readonly _getKey;
    private _deferLevel;
    private _pendingChange;
    constructor(sourceCollection?: TItem[], options?: DesktopCollectionViewOptions<TItem>);
    get length(): number;
    getItem(id: string): TItem | undefined;
    setSourceCollection(sourceCollection: TItem[], options?: DesktopCollectionMutationOptions): void;
    refresh(options?: DesktopCollectionMutationOptions): void;
    beginUpdate(): void;
    endUpdate(): void;
    deferUpdate(fn: () => void): void;
    add(item: TItem, options?: DesktopCollectionMutationOptions): void;
    remove(idOrItem: string | TItem, options?: DesktopCollectionMutationOptions): TItem | undefined;
    update(idOrItem: string | TItem, patch: Partial<TItem>, options?: DesktopCollectionMutationOptions): TItem | undefined;
    clearChanges(): void;
    snapshot(): TItem[];
    dispose(): void;
    private _emit;
}

/** Desktop icon content accepted by the built-in renderer. */
type DesktopIconContent = string | Node;
/** Context passed to a custom desktop icon renderer. */
interface DesktopIconRendererContext {
    /** Current desktop item. Treat this object as read-only. */
    item: Readonly<DesktopIconConfig>;
    /** Existing `.dp-desktop-icon-img` host element. */
    container: HTMLElement;
}
/**
 * Custom desktop icon renderer.
 *
 * Return a string to use the normal URL / inline SVG / emoji resolver, return
 * a DOM Node to mount it, or append directly to `context.container` and return
 * nothing.
 */
type DesktopIconRenderer = (context: DesktopIconRendererContext) => DesktopIconContent | null | undefined | void;
/** 桌面圖示設定 */
interface DesktopIconConfig {
    id: string;
    label: string;
    /**
     * URL、emoji、inline SVG 字串，或真實 DOM Node。
     * 傳入 Node 時，DesktopIcon 會接管並掛載該節點；多個 icon 請勿共用同一 Node。
     */
    icon?: DesktopIconContent;
    /**
     * 自訂 icon renderer。優先於 `icon`，適合 Canvas、Web Component、
     * 帶事件的 HTML 或每次 render 都需要新節點的情境。
     */
    iconRenderer?: DesktopIconRenderer;
    /** 初始 X 位置（px）。未指定則自動排列 */
    x?: number;
    /** 初始 Y 位置（px）。未指定則自動排列 */
    y?: number;
    /** 點擊圖示時觸發的動作 */
    action?: () => void;
    /**
     * 拖曳感應距離（px）。
     * 滑鼠按下後需移動超過此距離才進入拖曳模式；低於此值的位移視為點擊。
     * 預設 6。
     */
    dragThreshold?: number;
}
type DesktopItemsSource = DesktopIconConfig[] | DesktopCollectionView<DesktopIconConfig>;
type DesktopEvent = 'desktop:ready' | 'desktop:destroyed' | 'items:changed' | 'items:refreshed' | 'icon:added' | 'icon:removed' | 'icon:moved' | 'icon:activated' | 'icon:selected' | 'dock:position-changed';
interface DesktopItemsEvent {
    source: string;
    reason: string;
    items: DesktopIconConfig[];
}
interface DesktopIconEvent {
    id: string;
    item: DesktopIconConfig;
    items: DesktopIconConfig[];
}
interface DesktopIconMoveEvent extends DesktopIconEvent {
    x: number;
    y: number;
}
/** Dock 工具列項目設定 */
interface DockItemConfig {
    id: string;
    label: string;
    /** URL、emoji 字元、或內聯 SVG 字串 */
    icon: string;
    action: () => void;
}
/** Dock slot position relative to the center item strip. */
type DockSlotName = 'leading' | 'trailing';
/** Context passed whenever a Dock slot renderer is invoked. */
interface DockSlotRendererContext {
    /** Slot being rendered. */
    slot: DockSlotName;
    /** Current Dock edge; useful for orientation-aware content. */
    position: DockPosition;
    /** Existing slot host element. Append content here or return a Node. */
    container: HTMLElement;
}
/**
 * Render custom Dock chrome such as a Start button, system tray, or clock.
 * Return a Node, or append directly to `context.container` and return nothing.
 */
type DockSlotRenderer = (context: DockSlotRendererContext) => Node | null | undefined | void;
/** Static DOM content or a renderer for one Dock edge slot. */
type DockSlotContent = Node | DockSlotRenderer;
/** WindowManager 事件資料（最小需求） */
interface DockSyncWindowEvent {
    id: string;
    title?: string;
    /** 視窗圖示（來自 WindowConfig.icon），供 Dock 預設同步使用 */
    icon?: string;
    /** Dock 顯示標籤（來自 WindowConfig.label）；有值時優先於 title */
    label?: string;
    /**
     * 父視窗 ID。有此欄位表示此視窗是子視窗，
     * syncDockWithWindows 會自動跳過不加入 Dock。
     */
    parentId?: string;
    /**
     * 獨佔模式。群組預覽關閉按鈕安全判斷用。
     */
    modal?: boolean;
}
/** WindowManager 最小介面（duck typing，避免直接依賴 core bundle） */
interface WindowManagerLike {
    events: {
        on<T = unknown>(event: string, cb: (data?: T) => void): () => void;
    };
    focus?: (id: string) => void;
    /** 關閉視窗（子視窗關閉時會自動移除 modal overlay） */
    close?: (id: string) => void;
    /** 讓視窗出現搖晃動畫（提示 modal 阻擋） */
    shake?: (id: string) => void;
    getWindowIds?: () => string[];
    getState?: (id: string) => DockSyncWindowEvent | undefined;
    /** 取得視窗的完整 DOM 元素（含標題列），供 hover 預覽使用 */
    getWindowElement?: (id: string) => HTMLElement | undefined;
    /** 取得父視窗的所有子視窗 ID（供 Dock click 群組 restore 使用） */
    getChildIds?: (parentId: string) => string[];
}
/** Dock 與 WindowManager 同步設定 */
interface DockSyncOptions {
    /**
     * 由視窗 ID 解析 appId。
     * 預設：id 以 app- 開頭時取後段，否則回傳原 id。
     */
    getAppIdFromWindowId?: (windowId: string) => string | null;
    /**
     * 依 appId / 視窗資訊產生 Dock item 外觀。
     * 回傳 null 可跳過該視窗不加入 Dock。
     */
    getDockItem?: (appId: string, event: DockSyncWindowEvent) => Omit<DockItemConfig, 'id' | 'action'> | null;
    /** 點擊 Dock item 的自訂行為；未提供時預設 focus 對應視窗。 */
    onDockItemClick?: (appId: string, windowId: string) => void;
    /** Dock item id 前綴，預設 running- */
    dockItemIdPrefix?: string;
    /** true: 同 appId 僅保留一個 Dock item（預設 true） */
    dedupeByAppId?: boolean;
    /** true: 綁定後同步目前已開啟視窗（預設 true） */
    syncExisting?: boolean;
    /**
     * 滑鼠懸停 Dock 圖標時是否顯示視窗縮略圖預覽（預設 true）。
     * 需要 manager 提供 `getWindowElement` 方法。
     */
    showWindowPreview?: boolean;
    /**
     * 預覽縮略圖的最大尺寸（px）。
     * 縮略圖會按比例縮放，不超過此寬高。預設 `{ width: 160, height: 100 }`。
     */
    previewSize?: {
        width: number;
        height: number;
    };
    /**
     * 群組預覽 popup 的掛載元素。
     * 預設：自動偵測 `winEl` 最近的 `.v-application`，找不到則 fallback 到 `document.body`。
     * 使用 Vue+Vuetify 時通常不需設定；如果你的 CSS scope root 不是 `.v-application`，
     * 請傳入你的應用根元素（例如 `document.getElementById('app')`），以確保
     * cloneNode 後的縮略圖仍在 CSS 作用域內（Vuetify/Scoped CSS/CSS 變數均可繼承）。
     */
    previewMountEl?: HTMLElement;
}
/** Dock 停靠位置 */
type DockPosition = 'bottom' | 'top' | 'left' | 'right';
/** Dock 工具列設定 */
interface DockConfig {
    /** 停靠位置，預設 'bottom' */
    position?: DockPosition;
    items?: DockItemConfig[];
    /** Content before the center item strip (left/top depending on Dock position). */
    leading?: DockSlotContent;
    /** Content after the center item strip (right/bottom depending on Dock position). */
    trailing?: DockSlotContent;
    /** 圖示大小（px），預設 44 */
    iconSize?: number;
    /** 是否顯示文字標籤，預設 true */
    showLabels?: boolean;
}
/** 桌面主設定 */
interface DesktopConfig {
    /** 容器元素，預設 document.body */
    container?: HTMLElement;
    dock?: DockConfig;
    icons?: DesktopIconConfig[];
    /**
     * Wijmo-style data source for desktop icons.
     * Plain arrays are wrapped in DesktopCollectionView automatically.
     */
    itemsSource?: DesktopItemsSource;
    /** CSS background 值，預設使用 --dp-desktop-bg */
    background?: string;
    /** localStorage key 前綴，用於記憶圖示位置，預設 'dp-desktop' */
    storageKey?: string;
    /**
     * 全域拖曳感應距離（px），可被個別 icon 的 dragThreshold 覆寫。
     * 滑鼠按下後需移動超過此距離才進入拖曳模式。預設 6。
     */
    dragThreshold?: number;
    /**
     * 是否啟用桌面圖示拖曳 Snap 吸附（吸附至容器邊緣與其他圖示邊緣）。
     * 預設 true。
     */
    iconSnap?: boolean;
    /**
     * 桌面圖示 Snap 吸附感應距離（px）。預設 20。
     */
    iconSnapThreshold?: number;
    /**
     * 是否自動注入 Desktop CSS 樣式，預設 true。
     * 若已用 <link> 或 bundler import 載入 deskpane-desktop.css，runtime 會自動略過重複注入。
     * 設為 false 時完全不注入樣式，由使用者自行控制 CSS 載入順序。
     * 可搭配 `getDesktopCSS()` 取得預設 CSS 作為修改基礎。
     */
    injectStyles?: boolean;
}

declare class Dock {
    private readonly _el;
    private _items;
    private _position;
    private readonly _iconSize;
    private readonly _showLabels;
    private _leading;
    private _trailing;
    private _dragSrcIndex;
    private _activeId;
    private readonly _renderCallbacks;
    constructor(config?: DockConfig);
    private _render;
    private _hasSlots;
    private _createSlotEl;
    private _createItemEl;
    private _clearDragover;
    addItem(item: DockItemConfig): void;
    /** 在指定索引位置插入 item（0 = 最左/最上）。超出範圍時自動夾緊。 */
    addItemAt(item: DockItemConfig, index: number): void;
    /**
     * 設定目前 active（focused）的 item。
     * 傳 null 清除所有高亮。
     */
    setActiveItem(id: string | null): void;
    private _applyActive;
    removeItem(id: string): void;
    /** 取得目前排列順序的 items（含拖曳後的結果） */
    getItems(): DockItemConfig[];
    /** 動態變更 Dock 停靠位置 */
    setPosition(position: DockPosition): void;
    /**
     * Replace one optional Dock slot. Pass null to clear it.
     * When both slots are clear, Dock restores the legacy direct-item DOM.
     */
    setSlot(slot: DockSlotName, content: DockSlotContent | null): void;
    setLeading(content: DockSlotContent | null): void;
    setTrailing(content: DockSlotContent | null): void;
    /** Return a slot host when slotted mode is active. */
    getSlotElement(slot: DockSlotName): HTMLElement | null;
    /**
     * Return the scrollable center item strip.
     * Legacy mode returns the Dock root because items remain direct children.
     */
    getItemsElement(): HTMLElement;
    /** 取得特定 item 的 DOM 元素 */
    getItemElement(id: string): HTMLElement | null;
    /** 取得目前 Dock 停靠位置 */
    getPosition(): DockPosition;
    getElement(): HTMLElement;
    /**
     * 每次 Dock 重新渲染（addItem / addItemAt / removeItem / 拖曳排序）後觸發 cb。
     * 回傳取消訂閱函式。
     */
    onRender(cb: () => void): () => void;
    destroy(): void;
}

declare class Desktop {
    private readonly _container;
    private readonly _desktopEl;
    private readonly _iconAreaEl;
    private readonly _windowAreaEl;
    private readonly _dock;
    private readonly _icons;
    private _itemsView;
    private _itemsViewOff;
    private readonly _storageKey;
    private readonly _dragThreshold;
    private readonly _iconSnapEnabled;
    private readonly _iconSnapThreshold;
    private _guideV;
    private _guideH;
    private _iconSentinel;
    private _autoIconIndex;
    private _dockSyncCleanup;
    readonly events: EventBus;
    constructor(config?: DesktopConfig);
    /**
     * 更新 icon 區域的 inset（避免 icon 被 Dock 遮住）。
     * 視窗區域維持全尺寸（0,0,0,0），讓視窗可自由滑入 Dock 下方，
     * 透過 CSS 變數 --dp-dock-inset-* 控制最大化時的邊界。
     */
    private _applyInset;
    private _loadPositions;
    private _savePositions;
    /** 移動 sentinel 到最遠 icon 的右下角，撐開 scrollHeight/scrollWidth */
    private _updateSentinel;
    private _makeSnapFn;
    private _hideSnapGuides;
    private _emitItemsChanged;
    private _emitItemsRefreshed;
    private _clearIcons;
    private _renderItems;
    private _mountIcon;
    private _removeIconElement;
    private _handleIconMoved;
    setItemsSource(source: DesktopItemsSource, options?: {
        source?: string;
        emit?: boolean;
    }): void;
    getCollectionView(): DesktopCollectionView<DesktopIconConfig> | null;
    getItems(): DesktopIconConfig[];
    getItem(id: string): DesktopIconConfig | undefined;
    setItems(items: DesktopIconConfig[]): void;
    refreshItems(): void;
    refresh(): void;
    updateItem(id: string, patch: Partial<DesktopIconConfig>): DesktopIconConfig | undefined;
    /**
     * 新增桌面圖示。
     * 位置優先順序：config.x/y > localStorage 記憶 > 自動排列
     */
    addIcon(config: DesktopIconConfig): void;
    /** 移除桌面圖示 */
    removeIcon(id: string): void;
    /** 取得 Dock 實例，可動態增減 Dock 項目 */
    getDock(): Dock;
    /**
     * 動態變更 Dock 停靠位置（top | bottom | left | right）。
     * 同時更新 icon 區域 inset，使 icon 不被 Dock 遮住。
     */
    setDockPosition(position: DockPosition): void;
    /**
     * 將 Dock 與 WindowManager 視窗生命週期同步。
     * - 開窗：新增 Dock item
     * - 關窗：移除 Dock item
     * - 點擊 Dock item：預設 focus 視窗（可覆寫）
     *
     * 這個方法只管理「同步產生」的 Dock item；使用者手動 addItem 的 launcher
     * 不會被 cleanup 移除。若要同一個 app 只顯示一個 running item，保留
     * `dedupeByAppId: true`；若每個視窗都要一個 Dock item，改成 false。
     */
    syncDockWithWindows(manager: WindowManagerLike, options?: DockSyncOptions): () => void;
    /** 停止 Dock 與 WindowManager 同步，並移除同步產生的 Dock items。 */
    unsyncDockWithWindows(): void;
    /** 取得視窗區域元素（排除 Dock，供 WindowManager 使用） */
    getElement(): HTMLElement;
    /** 取得桌面根元素（含 Dock） */
    getDesktopElement(): HTMLElement;
    /** 取得圖示區域元素 */
    getIconArea(): HTMLElement;
    /** 銷毀桌面，清除所有 DOM */
    destroy(): void;
}

type IconMoveCallback = (id: string, x: number, y: number) => void;
type IconSelectCallback = (id: string) => void;
/** 傳入建議座標與大小，回傳吸附後座標（guides 更新由 Desktop 閉包處理） */
type IconSnapFn = (x: number, y: number, w: number, h: number) => {
    x: number;
    y: number;
};
declare class DesktopIcon {
    private readonly _el;
    private readonly _config;
    private readonly _containerEl;
    private readonly _onMove;
    private readonly _dragThreshold;
    private readonly _snapFn;
    private readonly _onDragEnd;
    private readonly _onSelect;
    private _isDragging;
    private _hasMoved;
    private _dragOffX;
    private _dragOffY;
    private _startX;
    private _startY;
    private readonly _onMouseMoveBound;
    private readonly _onMouseUpBound;
    constructor(config: DesktopIconConfig, containerEl: HTMLElement, onMove: IconMoveCallback, dragThreshold?: number, snapFn?: IconSnapFn | null, onDragEnd?: (() => void) | null, onSelect?: IconSelectCallback | null);
    private _createElement;
    private _onMouseDown;
    private _onMouseMove;
    private _onMouseUp;
    setPosition(x: number, y: number): void;
    getElement(): HTMLElement;
    getConfig(): DesktopIconConfig;
    destroy(): void;
}

/** 回傳 Desktop CSS 字串，供 injectStyles:false 的使用者自行管理樣式注入 */
declare function getDesktopCSS(): string;

export { Desktop, DesktopCollectionView, DesktopIcon, Dock, getDesktopCSS };
export type { DesktopCollectionChangeAction, DesktopCollectionChangedEvent, DesktopCollectionMutationOptions, DesktopCollectionViewOptions, DesktopConfig, DesktopEvent, DesktopIconConfig, DesktopIconContent, DesktopIconEvent, DesktopIconMoveEvent, DesktopIconRenderer, DesktopIconRendererContext, DesktopItemsEvent, DesktopItemsSource, DockConfig, DockItemConfig, DockPosition, DockSlotContent, DockSlotName, DockSlotRenderer, DockSlotRendererContext, DockSyncOptions, DockSyncWindowEvent, WindowManagerLike };
