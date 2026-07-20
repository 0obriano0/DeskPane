/** 視窗內容的渲染策略 */
type SlotType = 'dom' | 'vue' | 'react';
/** 視窗完整狀態 */
interface WindowState {
    id: string;
    title: string;
    /** 視窗圖示：emoji 字元或圖片 URL，供 Dock 同步使用 */
    icon?: string;
    /**
     * Dock / 工具列顯示用的短標籤。
     * 有值時 Dock 優先顯示此欄位，否則 fallback 到 title。
     */
    label?: string;
    slotType: SlotType;
    /** 視窗內容：HTMLElement | Vue 元件定義 | React 元件 */
    content: any;
    x: number;
    y: number;
    width: number;
    height: number;
    zIndex: number;
    isMaximized: boolean;
    isMinimized: boolean;
    isActive: boolean;
    /**
     * 允許使用者調整視窗大小（拖曳邊框 + 最大化按鈕）。
     * 預設 true。設為 false 時邊框不可拖曳、最大化按鈕 disabled。
     */
    resizable: boolean;
    /**
     * 父視窗 ID。設定後此視窗成為子視窗，不在 Dock 獨立顯示。
     * 子視窗隨父視窗最小化 / restore，z-index 永遠高於父視窗。
     */
    parentId?: string;
    /**
     * 獨佔模式（Modal）。需同時設定 parentId。
     * true = 父視窗加上半透明遮罩，必須先關閉此子視窗才能操作父視窗。
     * 預設 false。
     */
    modal: boolean;
    /** 傳遞給內部組件的初始參數 */
    props?: Record<string, unknown>;
    /** 最大化 / 最小化前的幾何快照，用於 restore */
    _savedGeometry?: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
}
/** open() 時傳入的設定（id 與 content 必填） */
interface WindowConfig {
    id: string;
    title: string;
    /** 視窗圖示：emoji 字元或圖片 URL，供 Dock 自動同步使用 */
    icon?: string;
    /**
     * Dock / 工具列顯示用的短標籤。
     * 有值時 Dock 優先顯示此欄位，否則 fallback 到 title。
     */
    label?: string;
    slotType?: SlotType;
    content: any;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    props?: Record<string, unknown>;
    /**
     * 允許使用者調整視窗大小（拖曳邊框 + 最大化按鈕）。
     * 預設 true。設為 false 時邊框不可拖曳、最大化按鈕 disabled。
     */
    resizable?: boolean;
    /**
     * 父視窗 ID。設定後此視窗成為子視窗，不在 Dock 獨立顯示。
     * 子視窗隨父視窗最小化 / restore，z-index 永遠高於父視窗。
     */
    parentId?: string;
    /**
     * 獨佔模式（Modal）。需同時設定 parentId。
     * true = 父視窗加上半透明遮罩，必須先關閉此子視窗才能操作父視窗。
     * 預設 false。
     */
    modal?: boolean;
}
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

interface WindowManagerOptions {
    /** 視窗容器，預設為 document.body */
    container?: HTMLElement;
    /** 節流毫秒數，預設 16 */
    throttleMs?: number;
    /**
     * Isolated 模式：視窗改用 position:absolute，限制在容器範圍內。
     * 適合文件頁面的內嵌 demo 區塊，或頁面中的局部桌面。
     * 啟用後容器會自動加上 dp-isolated CSS class。
     */
    isolated?: boolean;
    /**
     * 啟用視窗拖曳時的 Snap 吸附功能，預設 true。
     * 拖曳到容器邊緣或其他視窗邊緣時，自動對齊並顯示藍色 guide 線。
     */
    snap?: boolean;
    /**
     * Snap 吸附感應距離（px），預設 20。
     * 視窗距離吸附目標小於此值時觸發吸附。
     */
    snapThreshold?: number;
    /**
     * 視窗與視窗之間的吸附間距（px），預設 0。
     * 大於 0 時，兩視窗對齊後會保留指定像素的空隙；容器邊緣不受影響。
     */
    snapGap?: number;
    /**
     * Windows-like edge snap preview. When enabled, dragging a resizable window pointer
     * to the top edge previews maximize; left/right pointer edges preview half-screen placement.
     * Requires `snap !== false`. Default true.
     */
    edgeSnap?: boolean;
    /**
     * Pointer distance from container edge that activates edge snap preview. Defaults to snapThreshold.
     */
    edgeSnapThreshold?: number;
    /**
     * 是否自動注入 Core CSS 樣式，預設 true。
     * 若已用 <link> 或 bundler import 載入 deskpane.css，runtime 會自動略過重複注入。
     * 設為 false 時完全不注入樣式，由使用者自行控制 CSS 載入順序。
     * 可搭配 `getCoreCSS()` 取得預設 CSS 作為修改基礎。
     */
    injectStyles?: boolean;
    /**
     * 最大化視窗從標題列拖曳超過此距離後，自動解除最大化並接續拖曳。
     * 預設 12px；設為較大值可避免輕微誤拖，設為 0 可立即觸發。
     */
    maximizedDragRestoreThreshold?: number;
}
declare class WindowManager {
    private readonly _wins;
    private _zCounter;
    private _cascadeCount;
    private readonly _container;
    private readonly _throttleMs;
    private readonly _isolated;
    private readonly _snapEnabled;
    private readonly _snapThreshold;
    private _snapGap;
    private readonly _edgeSnapEnabled;
    private readonly _edgeSnapThreshold;
    private readonly _maximizedDragRestoreThreshold;
    private _guideV;
    private _guideH;
    private _edgeSnapPreviewEl;
    private _activeEdgeSnap;
    /** 追蹤自動建立的 BorderLayout / Panel 實例，視窗關閉時 destroy */
    private readonly _layouts;
    /** 父視窗 → 子視窗 ID Set（一對多） */
    private readonly _children;
    /** Modal 子視窗 → 它在父視窗上的遮罩 DOM 元素 */
    private readonly _modalOverlays;
    private _resizeObserver;
    readonly events: EventBus;
    constructor(opts?: WindowManagerOptions);
    /**
     * 開啟視窗。若 ID 已存在，恢復並聚焦；否則建立新視窗。
     *
     * 維護注意：
     * - `WindowState` 是內部可變狀態；事件一律 emit 淺拷貝，避免外部改到內部。
     * - `parentId/modal` 必須在 DOM 建立後才掛 overlay，因為 overlay 掛在父視窗 root。
     * - `content` 可能是使用者的 HTMLElement，也可能被 layout auto-detect 移動子節點。
     */
    open(config: WindowConfig): WindowState;
    /**
     * 關閉並銷毀視窗
     *
     * 關閉父視窗時會遞迴關閉子視窗；關閉子視窗時只解除父子關係與 modal overlay。
     * 順序很重要：先移除目前視窗，再 cascade 子視窗，可避免 child close 再次碰到已移除的父 DOM。
     */
    close(id: string): void;
    /**
     * 當 z-index 計數器逼近上限時，將所有視窗的 z-index 正規化回
     * [BASE_Z+1 … BASE_Z+N]，保留原本的堆疊順序。
     * 確保視窗 z-index 永遠低於 Dock/Toolbar（9999）。
     */
    private _normalizeZ;
    /**
     * 聚焦視窗：置頂 zIndex，設定 isActive
     *
     * 子視窗有兩個特殊規則：
     * - 聚焦父視窗時，所有子視窗一起置頂，保持「子永遠高於父」。
     * - 聚焦子視窗時，父視窗也要接近頂層，但 z-index 仍低於子視窗。
     */
    focus(id: string): void;
    /**
     * Re-emit focus for the topmost visible window.
     * Useful when a preserved workspace becomes active again and its previous
     * active window needs to resync dock/focus state.
     */
    activateTopWindow(): void;
    /**
     * 最小化（隱藏 DOM，保留狀態）
     *
     * 注意：minimize 會清掉 isActive。這讓使用者點 Dock restore 時，
     * focus() 不會因為「已 active」而提早返回。
     */
    minimize(id: string): void;
    /**
     * 最大化
     *
     * 最大化不直接寫入 left/top/width/height，而是交給 CSS class `dp-maximized`。
     * 原始幾何存在 `_savedGeometry`，讓 restore 可以回到最大化前的位置與大小。
     */
    maximize(id: string): void;
    /**
     * 從「最大化標題列拖曳」解除最大化。
     *
     * Windows-like 行為重點：
     * - 用滑鼠在最大化視窗寬度中的比例 ratioX，換算還原後視窗的 x。
     * - y 則保留滑鼠在標題列內的 offset，讓拖曳不跳手。
     * - 移除 dp-maximized 後立即 applyGeometry，DragResizeHandler 同一輪 move 會接著更新位置。
     */
    private _restoreMaximizedForDrag;
    /**
     * 還原：
     * - 若視窗是「最大化狀態下被最小化」→ 僅移除最小化，保持最大化
     * - 若只是最大化 → 還原到最大化前的幾何
     * - 若只是最小化 → 還原到原始幾何
     *
     * 這裡不直接呼叫 focus()；呼叫端通常已經知道是否要聚焦。
     * open(existing) 會 restore 後再 focus，以避免最小化視窗恢復但 Dock active 狀態不同步。
     */
    restore(id: string): void;
    /** 取得視窗目前狀態快照（唯讀副本） */
    getState(id: string): Readonly<WindowState> | undefined;
    /** 取得視窗 Body DOM 節點，供外部 Wijmo / jQuery 附加內容 */
    getBodyElement(id: string): HTMLElement | undefined;
    getWindowElement(id: string): HTMLElement | undefined;
    /** 取得所有視窗 ID 清單 */
    getWindowIds(): string[];
    /** 更新視窗標題 */
    setTitle(id: string, title: string): void;
    /**
     * 動態更新視窗與視窗之間的吸附間距（px）。
     * 設為 0 表示緊貼（預設行為）。
     */
    setSnapGap(gap: number): void;
    /** 取得所有視窗狀態的快照陣列（供序列化使用） */
    getAllStates(): WindowState[];
    /** 取得特定視窗的子視窗 ID 清單 */
    getChildIds(parentId: string): string[];
    /** 取得某個視窗所屬的最頂層根視窗 ID */
    getRootWindowId(id: string): string;
    /** 讓視窗出現「搖晃」動畫，提示使用者需先關閉子視窗 */
    shake(id: string): void;
    /** 銷毀所有視窗，清除事件 */
    destroy(): void;
    /** 延遲建立 snap guide 元素（僅需要時才建立） */
    private _ensureGuides;
    /** 根據 SnapResult 顯示 / 隱藏 guide 線 */
    private _updateSnapGuides;
    /** 拖曳結束時隱藏所有 guide 線 */
    private _hideSnapGuides;
    /** 延遲建立 Windows-like edge snap 預覽區塊。 */
    private _ensureEdgeSnapPreview;
    /** 取得可用視窗區域；Desktop 會透過 CSS 變數提供 Dock inset。 */
    private _getWindowAreaBounds;
    private _getEdgeSnapRect;
    /** 根據目前滑鼠座標更新邊緣預覽。只預覽，mouseup 才真正套用。 */
    private _updateEdgeSnapPreview;
    private _hideEdgeSnapPreview;
    /** mouseup 時套用目前 edge snap 預覽。 */
    private _applyEdgeSnap;
    /**
     * 偵測 content 是否包含 BorderLayout 或 Panel 宣告，並自動初始化。
     * - content 有 [data-region] 直接子元素 → BorderLayout（body 作為容器）
     * - content 本身有 data-panel 屬性 → Panel（body 作為容器）
     */
    private _tryAutoLayout;
    /**
     * 在父視窗插入 Modal 遮罩層。
     * overlay 附同子視窗 ID 記錄，點擊時觸發對應子視窗的 shake 動畫。
     *
     * overlay 掛在父視窗 root，而不是全域 body。這樣在 isolated workspace、
     * TaskView clone、Desktop 內嵌 demo 中，遮罩都只限制在父視窗範圍。
     */
    private _attachModalOverlay;
    /**
     * 移除由 childId 產生的 modal 遮罩。
     */
    private _detachModalOverlay;
    private _deactivateOthers;
    private _focusTopWindow;
    /** 監聽容器尺寸變化，自動將視窗夾回可視範圍 */
    private _setupResizeObserver;
    /** 將所有非最大化、非最小化視窗的位置夾回容器範圍 */
    private _clampAllWindows;
    /** 取得可供 snap 計算用的其他視窗矩形（排除 excludeId 及最小化/最大化視窗） */
    private _getOtherWindows;
    /** 建立拖曳 snap 函式（用於 DragResizeHandler.snapFn） */
    private _buildSnapFn;
    /** 建立 resize snap 函式（用於 DragResizeHandler.resizeSnapFn） */
    private _buildResizeSnapFn;
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
/** Dock 工具列項目設定 */
interface DockItemConfig {
    id: string;
    label: string;
    /** URL、emoji 字元、或內聯 SVG 字串 */
    icon: string;
    action: () => void;
}
/** Built-in visual arrangement for Dock items. */
type DockItemLayout = 'dock' | 'taskbar';
/** Context passed whenever custom Dock item content is rendered. */
interface DockItemRendererContext {
    /** Item whose managed `.dp-dock-item` host is being rendered. */
    item: Readonly<DockItemConfig>;
    /** Current item index after any drag reordering. */
    index: number;
    /** Current Dock edge. */
    position: DockPosition;
    /** Current built-in item layout. */
    layout: DockItemLayout;
    /** Managed item host. Attach presentation content here, not click handlers. */
    container: HTMLElement;
    /** Append the standard icon and label/tooltip content once. */
    renderDefault: () => void;
}
/**
 * Render presentation content inside a managed Dock item host.
 * Return a Node, or append directly to `context.container` and return nothing.
 */
type DockItemRenderer = (context: DockItemRendererContext) => Node | null | undefined | void;
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
    /** Built-in item arrangement. `dock` preserves the classic icon-first layout. */
    itemLayout?: DockItemLayout;
    /** Optional renderer for the presentation inside every managed item host. */
    itemRenderer?: DockItemRenderer;
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
    private _itemLayout;
    private _itemRenderer;
    private _leading;
    private _trailing;
    private _dragSrcIndex;
    private _activeId;
    private readonly _renderCallbacks;
    constructor(config?: DockConfig);
    private _render;
    private _syncItemLayoutClass;
    private _hasSlots;
    private _createSlotEl;
    private _renderDefaultItemContent;
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
    /** Switch between the classic Dock arrangement and a horizontal taskbar button layout. */
    setItemLayout(layout: DockItemLayout): void;
    getItemLayout(): DockItemLayout;
    /** Replace the custom item content renderer. Pass null to restore built-in content. */
    setItemRenderer(renderer: DockItemRenderer | null): void;
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

/** 建立工作區時的設定 */
interface WorkspaceConfig {
    /** 唯一識別碼（必填） */
    id: string;
    /** 顯示名稱，用於指示器 / aria-label */
    label?: string;
    /** 工作區圖示（emoji 或圖片 URL） */
    icon?: string;
}
/** 工作區的執行時狀態 */
interface WorkspaceState {
    id: string;
    label: string;
    icon?: string;
    /** 工作區的 DOM 容器（已掛載到 WorkspaceManager 根容器內） */
    container: HTMLElement;
}
/**
 * Window config for `WorkspaceManager.openWindow()`.
 * Use `appId` to let DeskPane generate a workspace-scoped window id.
 */
interface WorkspaceOpenWindowConfig extends Omit<WindowConfig, 'id'> {
    /**
     * Logical application id. When provided, DeskPane opens the window with a
     * workspace-scoped id such as `ws-2::app-counter`.
     */
    appId?: string;
    /**
     * Explicit window id. If omitted, `appId` is required and a scoped id is
     * generated automatically.
     */
    id?: string;
    /** Target workspace. Defaults to the current workspace. */
    workspaceId?: string;
}
/** Dock 最小介面（duck typing，避免 workspace 直接依賴 desktop bundle） */
interface DockLike {
    addItem(item: {
        id: string;
        label: string;
        icon: string;
        action: () => void;
    }): void;
    /** 在指定索引插入按鈕（0 = 最左/最上）。超出範圍自動夾緊。 */
    addItemAt(item: {
        id: string;
        label: string;
        icon: string;
        action: () => void;
    }, index: number): void;
    removeItem(id: string): void;
}
/** TaskView 建構選項 */
interface TaskViewOptions {
    /**
     * 覆蓋層掛載的 DOM 目標，預設 document.body。
     */
    target?: HTMLElement;
    /**
     * 是否顯示「新增桌面」按鈕，預設 true。
     */
    allowAdd?: boolean;
    /**
     * 是否顯示「刪除桌面」按鈕，預設 true。
     */
    allowDelete?: boolean;
    /**
     * 是否監聽 Escape 鍵關閉 Task View，預設 true。
     */
    keyboard?: boolean;
    /**
     * 點擊遮罩背景時是否關閉，預設 true。
     */
    closeOnBackdrop?: boolean;
    /**
     * 新增工作區時的設定產生器。
     * 若不提供，預設自動產生 id='ws-N'、label='桌面 N'。
     */
    onCreateWorkspace?: () => WorkspaceConfig;
    /**
     * 是否自動注入 TaskView CSS，預設 true。
     */
    injectStyles?: boolean;
    /**
     * Dock 實例。提供後 TaskView 可自動管理「虛擬桌面」按鈕。
     */
    dock?: DockLike;
    /**
     * 是否在 Dock 顯示「虛擬桌面」按鈕，預設 true。
     * 設為 false 時按鈕不會加入 Dock，但 `open()` / `toggle()` 仍可呼叫。
     */
    showButton?: boolean;
    /**
     * Dock 按鈕標籤文字，預設「虛擬桌面」。
     */
    buttonLabel?: string;
    /**
     * Dock 按鈕圖示（emoji 或 URL），預設「⧉」。
     */
    buttonIcon?: string;
    /**
     * Dock 按鈕的唯一 ID，預設「dp-tv-button」。
     */
    buttonId?: string;
}
/** WorkspaceManager 建構選項 */
interface WorkspaceManagerOptions {
    /**
     * 切換動畫持續時間（ms），預設 250。
     * 設為 0 則直接切換（無動畫）。
     */
    animationMs?: number;
    /**
     * 是否自動注入 Workspace CSS，預設 true。
     * 設為 false 時也會套用到內部建立的 WindowManager，
     * 除非 windowManagerOptions.injectStyles 明確指定其他值。
     */
    injectStyles?: boolean;
    /**
     * 傳給每個 WindowManager 的選項（snap、throttle 等）。
     * 每個工作區的 WindowManager 都套用相同選項。
     */
    windowManagerOptions?: WindowManagerOptions;
    /**
     * Warn when the same raw window id exists in more than one workspace.
     * This helps catch Dock/Portal/Teleport identity bugs early.
     * Default: true.
     */
    warnOnDuplicateWindowIds?: boolean;
}

declare class WorkspaceManager {
    private readonly _root;
    private readonly _animationMs;
    private readonly _wmOptions;
    private readonly _warnOnDuplicateWindowIds;
    private readonly _workspaces;
    private readonly _windowManagers;
    private readonly _windowManagerCleanups;
    private _currentId;
    private _isAnimating;
    private _indicatorEl;
    readonly events: EventBus;
    constructor(container: HTMLElement | string, options?: WorkspaceManagerOptions);
    /** 所有工作區的唯讀清單 */
    get workspaces(): WorkspaceState[];
    /** 目前活躍的工作區，若尚無工作區則為 null */
    get current(): WorkspaceState | null;
    /**
     * 新增工作區。
     * 若目前沒有活躍工作區，自動切換到新建的工作區。
     */
    addWorkspace(config: WorkspaceConfig): WorkspaceState;
    /**
     * 移除工作區（同時銷毀其 WindowManager）。
     * 若移除的是目前工作區，自動切換到前一個（或後一個）。
     */
    removeWorkspace(id: string): void;
    /**
     * 切換到指定工作區，附帶左右滑入動畫。
     * 若目前正在切換動畫中，忽略此次呼叫。
     */
    switchTo(id: string): void;
    /**
     * 取得指定工作區的 WindowManager。
     * 用於直接呼叫 wm.open() / wm.close() 等操作。
     */
    getWindowManager(workspaceId: string): WindowManager;
    /**
     * Build a workspace-scoped window id for an app.
     * Defaults to the current workspace when `workspaceId` is omitted.
     */
    createWindowId(appId: string, workspaceId?: string | null): string;
    /**
     * Open a window in a workspace.
     * Prefer `appId` over manually reusing raw ids across workspaces; DeskPane
     * will generate a scoped id such as `ws-2::app-counter`.
     */
    openWindow(config: WorkspaceOpenWindowConfig): WindowState;
    /**
     * 啟用工作區指示點（小圓點）。
     * 會在根容器底部顯示，指示當前所在工作區。
     */
    enableIndicator(): void;
    disableIndicator(): void;
    /** 銷毀所有工作區並清理資源 */
    destroy(): void;
    /** 無動畫直接啟用（初始化或移除當前工作區時使用） */
    private _activateImmediate;
    private _setWorkspaceInteractive;
    private _setWorkspaceVisible;
    private _subscribeWindowManager;
    private _warnDuplicateWindowId;
    /** 更新底部指示點 */
    private _updateIndicator;
}

declare class TaskView {
    private readonly _wsMgr;
    private readonly _opts;
    private readonly _overlayEl;
    private readonly _panelEl;
    private _isOpen;
    private _wsCounter;
    private readonly _buttonId;
    private readonly _onKeyDown;
    private readonly _onSwitched;
    readonly events: EventBus;
    constructor(wsMgr: WorkspaceManager, options?: TaskViewOptions);
    get isOpen(): boolean;
    open(): void;
    close(): void;
    toggle(): void;
    /** 銷毀 Task View，移除 DOM 與事件監聽 */
    destroy(): void;
    private _syncCounter;
    private _render;
    /** 預設新增桌面設定：ws-N / 桌面 N */
    private _defaultWorkspaceConfig;
    /** DOM clone + CSS scale 縮略圖 */
    private _buildPreview;
}

interface JQueryLike {
    length: number;
    [index: number]: HTMLElement;
    each(callback: (this: HTMLElement, index: number, element: HTMLElement) => void): JQueryLike;
    data(key: string): unknown;
    data(key: string, value: unknown): JQueryLike;
    removeData(key: string): JQueryLike;
}
interface JQueryStaticLike {
    (element: HTMLElement): JQueryLike;
    fn: Record<string, unknown>;
}
interface DpWindowManagerApi {
    manager: WindowManager;
    open(config: JQueryWindowConfig): WindowState;
    close(id: string): void;
    minimize(id: string): void;
    maximize(id: string): void;
    restore(id: string): void;
    focus(id: string): void;
    destroy(): void;
    getBodyElement(id: string): HTMLElement | undefined;
    getState(id: string): Readonly<WindowState> | undefined;
}
type DpWindowManagerMethod = 'instance' | 'open' | 'close' | 'minimize' | 'maximize' | 'restore' | 'focus' | 'destroy' | 'getBodyElement' | 'getState';
type DpWindowManagerOptions = WindowManagerOptions;
interface JQueryWindowConfig extends Omit<WindowConfig, 'content'> {
    content?: HTMLElement | JQueryLike | string | null;
}
interface DpWindowOptions extends Omit<JQueryWindowConfig, 'content'> {
    manager: WindowManager | DpWindowManagerApi | JQueryLike | string | HTMLElement;
    content?: HTMLElement | JQueryLike | string | null;
    clone?: boolean;
}
interface DpDesktopApi {
    desktop: Desktop;
    windowManager?: WindowManager;
    dockSyncCleanup?: (() => void) | null;
    getWindowManager(options?: WindowManagerOptions): WindowManager;
    syncDockWithWindows(manager?: WindowManager, options?: DockSyncOptions): () => void;
    addIcon(config: DesktopIconConfig): void;
    removeIcon(id: string): void;
    destroy(): void;
}
interface DpDesktopOptions extends DesktopConfig {
    windowManager?: false | WindowManagerOptions;
    syncDock?: boolean | DockSyncOptions;
}
type DpDesktopMethod = 'instance' | 'windowManager' | 'addIcon' | 'removeIcon' | 'syncDockWithWindows' | 'destroy';
interface DpWorkspaceManagerApi {
    workspaceManager: WorkspaceManager;
    taskView?: TaskView | null;
    dockSyncCleanup?: (() => void) | null;
    addWorkspace(config: WorkspaceConfig): WorkspaceState;
    removeWorkspace(id: string): void;
    switchTo(id: string): void;
    currentWindowManager(): WindowManager;
    windowManager(workspaceId?: string): WindowManager;
    openWindow(config: JQueryWorkspaceWindowConfig): WindowState;
    syncDock(options?: DockSyncOptions): () => void;
    createTaskView(options?: DpTaskViewOptions): TaskView;
    destroy(): void;
}
interface DpWorkspaceManagerOptions extends WorkspaceManagerOptions {
    workspaces?: WorkspaceConfig[];
    indicator?: boolean;
    syncDock?: boolean | DockSyncOptions;
    taskView?: boolean | DpTaskViewOptions;
    desktop?: DpDesktopApi | JQueryLike | string | HTMLElement;
}
interface JQueryWorkspaceWindowConfig extends Omit<WorkspaceOpenWindowConfig, 'content'> {
    content?: HTMLElement | JQueryLike | string | null;
}
interface DpWorkspaceWindowOptions extends Omit<JQueryWorkspaceWindowConfig, 'content'> {
    workspace: WorkspaceManager | DpWorkspaceManagerApi | JQueryLike | string | HTMLElement;
    content?: HTMLElement | JQueryLike | string | null;
    clone?: boolean;
}
type DpWorkspaceManagerMethod = 'instance' | 'addWorkspace' | 'removeWorkspace' | 'switchTo' | 'current' | 'workspaces' | 'currentWindowManager' | 'windowManager' | 'openWindow' | 'syncDock' | 'taskView' | 'destroy';
interface DpTaskViewOptions extends TaskViewOptions {
    workspace?: WorkspaceManager | DpWorkspaceManagerApi | JQueryLike | string | HTMLElement;
    desktop?: DpDesktopApi | JQueryLike | string | HTMLElement;
}
interface DpTaskViewApi {
    taskView: TaskView;
    open(): void;
    close(): void;
    toggle(): void;
    destroy(): void;
}
type DpTaskViewMethod = 'instance' | 'open' | 'close' | 'toggle' | 'destroy';
interface DeskPaneJQueryPlugin {
    install($: JQueryStaticLike): void;
}
declare global {
    interface JQuery {
        dpWindowManager(options?: DpWindowManagerOptions): JQuery;
        dpWindowManager(method: 'instance'): DpWindowManagerApi;
        dpWindowManager(method: 'open', config: JQueryWindowConfig): WindowState;
        dpWindowManager(method: 'getBodyElement', id: string): HTMLElement | undefined;
        dpWindowManager(method: 'getState', id: string): Readonly<WindowState> | undefined;
        dpWindowManager(method: Exclude<DpWindowManagerMethod, 'instance' | 'open' | 'getBodyElement' | 'getState'>, id?: string): void;
        dpWindow(options: DpWindowOptions): WindowState | WindowState[];
        dpDesktop(options?: DpDesktopOptions): JQuery;
        dpDesktop(method: 'instance'): DpDesktopApi;
        dpDesktop(method: 'windowManager', options?: WindowManagerOptions): WindowManager;
        dpDesktop(method: 'addIcon', config: DesktopIconConfig): void;
        dpDesktop(method: 'removeIcon', id: string): void;
        dpDesktop(method: 'syncDockWithWindows', options?: DockSyncOptions): () => void;
        dpDesktop(method: 'destroy'): void;
        dpWorkspaceManager(options?: DpWorkspaceManagerOptions): JQuery;
        dpWorkspaceManager(method: 'instance'): DpWorkspaceManagerApi;
        dpWorkspaceManager(method: 'addWorkspace', config: WorkspaceConfig): WorkspaceState;
        dpWorkspaceManager(method: 'removeWorkspace' | 'switchTo', id: string): void;
        dpWorkspaceManager(method: 'current'): WorkspaceState | null;
        dpWorkspaceManager(method: 'workspaces'): WorkspaceState[];
        dpWorkspaceManager(method: 'currentWindowManager'): WindowManager;
        dpWorkspaceManager(method: 'windowManager', workspaceId?: string): WindowManager;
        dpWorkspaceManager(method: 'openWindow', config: JQueryWorkspaceWindowConfig): WindowState;
        dpWorkspaceManager(method: 'syncDock', options?: DockSyncOptions): () => void;
        dpWorkspaceManager(method: 'taskView', options?: DpTaskViewOptions): TaskView;
        dpWorkspaceManager(method: 'destroy'): void;
        dpWorkspaceWindow(options: DpWorkspaceWindowOptions): WindowState | WindowState[];
        dpTaskView(options?: DpTaskViewOptions): JQuery;
        dpTaskView(method: 'instance'): DpTaskViewApi;
        dpTaskView(method: 'open' | 'close' | 'toggle' | 'destroy'): void;
    }
}

declare function install($: JQueryStaticLike): void;
declare const DeskPaneJQuery: {
    install: typeof install;
};
declare global {
    interface Window {
        DeskPaneJQuery?: typeof DeskPaneJQuery;
    }
}

export { DeskPaneJQuery, install };
export type { DeskPaneJQueryPlugin, DpDesktopApi, DpDesktopMethod, DpDesktopOptions, DpTaskViewApi, DpTaskViewMethod, DpTaskViewOptions, DpWindowManagerApi, DpWindowManagerMethod, DpWindowManagerOptions, DpWindowOptions, DpWorkspaceManagerApi, DpWorkspaceManagerMethod, DpWorkspaceManagerOptions, DpWorkspaceWindowOptions, JQueryLike, JQueryStaticLike, JQueryWindowConfig, JQueryWorkspaceWindowConfig };
