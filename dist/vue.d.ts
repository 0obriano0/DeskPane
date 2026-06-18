import * as vue from 'vue';
import { PropType } from 'vue';

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
    private readonly _maximizedDragRestoreThreshold;
    private _guideV;
    private _guideH;
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

/** 每個 Vue 視窗的執行時資料 */
interface VueWindowEntry {
    id: string;
    /** 即時狀態快照（每次事件後更新） */
    state: WindowState;
    /** Vue 元件定義（已 markRaw） */
    component: any;
    /** 傳入元件的 props */
    props?: Record<string, unknown>;
    /** WM 視窗 body DOM 節點，供 <Teleport :to> 使用 */
    bodyEl: HTMLElement;
}
/** openVueWindow() 的設定參數 */
interface VueWindowConfig {
    id: string;
    title: string;
    /** Vue 元件定義（SFC default export / defineComponent 回傳值） */
    component: any;
    props?: Record<string, unknown>;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
}
/**
 * Vue 3 Composable：封裝 WindowManager，提供響應式視窗清單與 Vue 元件開窗。
 *
 * @example
 * ```ts
 * const { windows, openVueWindow, close, minimize } = useWindowManager();
 * openVueWindow({ id: 'my-win', title: '我的視窗', component: MyComp });
 * ```
 */
declare function useWindowManager(opts?: WindowManagerOptions): {
    /** 底層 WindowManager 實例（進階使用） */
    wm: WindowManager;
    /** 響應式視窗清單，供 v-for 迭代 */
    windows: vue.ShallowRef<VueWindowEntry[], VueWindowEntry[]>;
    openVueWindow: (config: VueWindowConfig) => WindowState;
    close: (id: string) => void;
    minimize: (id: string) => void;
    maximize: (id: string) => void;
    restore: (id: string) => void;
    focus: (id: string) => void;
    setTitle: (id: string, title: string) => void;
    destroy: () => void;
};

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

/** 桌面圖示設定 */
interface DesktopIconConfig {
    id: string;
    label: string;
    /** URL、emoji 字元、或內聯 SVG 字串 */
    icon: string;
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
/** Dock 停靠位置 */
type DockPosition = 'bottom' | 'top' | 'left' | 'right';
/** Dock 工具列設定 */
interface DockConfig {
    /** 停靠位置，預設 'bottom' */
    position?: DockPosition;
    items?: DockItemConfig[];
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

declare const DpDesktop: vue.DefineComponent<vue.ExtractPropTypes<{
    items: {
        type: PropType<DesktopIconConfig[] | undefined>;
        default: undefined;
    };
    itemsSource: {
        type: PropType<DesktopItemsSource | undefined>;
        default: undefined;
    };
    dock: {
        type: PropType<DesktopConfig["dock"]>;
        default: undefined;
    };
    background: {
        type: StringConstructor;
        default: undefined;
    };
    storageKey: {
        type: StringConstructor;
        default: undefined;
    };
    dragThreshold: {
        type: NumberConstructor;
        default: undefined;
    };
    iconSnap: {
        type: BooleanConstructor;
        default: undefined;
    };
    iconSnapThreshold: {
        type: NumberConstructor;
        default: undefined;
    };
    injectStyles: {
        type: BooleanConstructor;
        default: undefined;
    };
    autoRefresh: {
        type: BooleanConstructor;
        default: boolean;
    };
}>, () => vue.VNode<vue.RendererNode, vue.RendererElement, {
    [key: string]: any;
}>, {}, {}, {}, vue.ComponentOptionsMixin, vue.ComponentOptionsMixin, ("initialized" | "ready" | "update:items" | "itemsChanged" | "itemsRefreshed" | "iconAdded" | "iconRemoved" | "iconMoved" | "iconActivated" | "iconSelected")[], "initialized" | "ready" | "update:items" | "itemsChanged" | "itemsRefreshed" | "iconAdded" | "iconRemoved" | "iconMoved" | "iconActivated" | "iconSelected", vue.PublicProps, Readonly<vue.ExtractPropTypes<{
    items: {
        type: PropType<DesktopIconConfig[] | undefined>;
        default: undefined;
    };
    itemsSource: {
        type: PropType<DesktopItemsSource | undefined>;
        default: undefined;
    };
    dock: {
        type: PropType<DesktopConfig["dock"]>;
        default: undefined;
    };
    background: {
        type: StringConstructor;
        default: undefined;
    };
    storageKey: {
        type: StringConstructor;
        default: undefined;
    };
    dragThreshold: {
        type: NumberConstructor;
        default: undefined;
    };
    iconSnap: {
        type: BooleanConstructor;
        default: undefined;
    };
    iconSnapThreshold: {
        type: NumberConstructor;
        default: undefined;
    };
    injectStyles: {
        type: BooleanConstructor;
        default: undefined;
    };
    autoRefresh: {
        type: BooleanConstructor;
        default: boolean;
    };
}>> & Readonly<{
    onInitialized?: ((...args: any[]) => any) | undefined;
    onReady?: ((...args: any[]) => any) | undefined;
    "onUpdate:items"?: ((...args: any[]) => any) | undefined;
    onItemsChanged?: ((...args: any[]) => any) | undefined;
    onItemsRefreshed?: ((...args: any[]) => any) | undefined;
    onIconAdded?: ((...args: any[]) => any) | undefined;
    onIconRemoved?: ((...args: any[]) => any) | undefined;
    onIconMoved?: ((...args: any[]) => any) | undefined;
    onIconActivated?: ((...args: any[]) => any) | undefined;
    onIconSelected?: ((...args: any[]) => any) | undefined;
}>, {
    dock: DockConfig | undefined;
    items: DesktopIconConfig[] | undefined;
    itemsSource: DesktopItemsSource | undefined;
    background: string;
    storageKey: string;
    dragThreshold: number;
    iconSnap: boolean;
    iconSnapThreshold: number;
    injectStyles: boolean;
    autoRefresh: boolean;
}, {}, {}, {}, string, vue.ComponentProvideOptions, true, {}, any>;
declare const DpDesktopIcon: vue.DefineComponent<vue.ExtractPropTypes<{
    id: {
        type: StringConstructor;
        required: true;
    };
    label: {
        type: StringConstructor;
        required: true;
    };
    icon: {
        type: StringConstructor;
        required: true;
    };
    x: {
        type: NumberConstructor;
        default: undefined;
    };
    y: {
        type: NumberConstructor;
        default: undefined;
    };
    dragThreshold: {
        type: NumberConstructor;
        default: undefined;
    };
}>, () => null, {}, {}, {}, vue.ComponentOptionsMixin, vue.ComponentOptionsMixin, "activate"[], "activate", vue.PublicProps, Readonly<vue.ExtractPropTypes<{
    id: {
        type: StringConstructor;
        required: true;
    };
    label: {
        type: StringConstructor;
        required: true;
    };
    icon: {
        type: StringConstructor;
        required: true;
    };
    x: {
        type: NumberConstructor;
        default: undefined;
    };
    y: {
        type: NumberConstructor;
        default: undefined;
    };
    dragThreshold: {
        type: NumberConstructor;
        default: undefined;
    };
}>> & Readonly<{
    onActivate?: ((...args: any[]) => any) | undefined;
}>, {
    dragThreshold: number;
    x: number;
    y: number;
}, {}, {}, {}, string, vue.ComponentProvideOptions, true, {}, any>;
declare const DpWindowManager: vue.DefineComponent<vue.ExtractPropTypes<{
    isolated: {
        type: BooleanConstructor;
        default: boolean;
    };
    throttleMs: {
        type: NumberConstructor;
        default: undefined;
    };
    snap: {
        type: BooleanConstructor;
        default: undefined;
    };
    snapThreshold: {
        type: NumberConstructor;
        default: undefined;
    };
    snapGap: {
        type: NumberConstructor;
        default: undefined;
    };
    injectStyles: {
        type: BooleanConstructor;
        default: undefined;
    };
}>, () => vue.VNode<vue.RendererNode, vue.RendererElement, {
    [key: string]: any;
}>, {}, {}, {}, vue.ComponentOptionsMixin, vue.ComponentOptionsMixin, ("initialized" | "ready")[], "initialized" | "ready", vue.PublicProps, Readonly<vue.ExtractPropTypes<{
    isolated: {
        type: BooleanConstructor;
        default: boolean;
    };
    throttleMs: {
        type: NumberConstructor;
        default: undefined;
    };
    snap: {
        type: BooleanConstructor;
        default: undefined;
    };
    snapThreshold: {
        type: NumberConstructor;
        default: undefined;
    };
    snapGap: {
        type: NumberConstructor;
        default: undefined;
    };
    injectStyles: {
        type: BooleanConstructor;
        default: undefined;
    };
}>> & Readonly<{
    onInitialized?: ((...args: any[]) => any) | undefined;
    onReady?: ((...args: any[]) => any) | undefined;
}>, {
    injectStyles: boolean;
    isolated: boolean;
    throttleMs: number;
    snap: boolean;
    snapThreshold: number;
    snapGap: number;
}, {}, {}, {}, string, vue.ComponentProvideOptions, true, {}, any>;
declare const DpWindow: vue.DefineComponent<vue.ExtractPropTypes<{
    id: {
        type: StringConstructor;
        required: true;
    };
    title: {
        type: StringConstructor;
        required: true;
    };
    icon: {
        type: StringConstructor;
        default: undefined;
    };
    label: {
        type: StringConstructor;
        default: undefined;
    };
    x: {
        type: NumberConstructor;
        default: undefined;
    };
    y: {
        type: NumberConstructor;
        default: undefined;
    };
    width: {
        type: NumberConstructor;
        default: undefined;
    };
    height: {
        type: NumberConstructor;
        default: undefined;
    };
    resizable: {
        type: BooleanConstructor;
        default: undefined;
    };
    parentId: {
        type: StringConstructor;
        default: undefined;
    };
    modal: {
        type: BooleanConstructor;
        default: undefined;
    };
    open: {
        type: BooleanConstructor;
        default: boolean;
    };
}>, () => null, {}, {}, {}, vue.ComponentOptionsMixin, vue.ComponentOptionsMixin, ("initialized" | "update:open" | "opened" | "closed" | "focused" | "minimized" | "maximized" | "restored" | "maximizedDragRestored")[], "initialized" | "update:open" | "opened" | "closed" | "focused" | "minimized" | "maximized" | "restored" | "maximizedDragRestored", vue.PublicProps, Readonly<vue.ExtractPropTypes<{
    id: {
        type: StringConstructor;
        required: true;
    };
    title: {
        type: StringConstructor;
        required: true;
    };
    icon: {
        type: StringConstructor;
        default: undefined;
    };
    label: {
        type: StringConstructor;
        default: undefined;
    };
    x: {
        type: NumberConstructor;
        default: undefined;
    };
    y: {
        type: NumberConstructor;
        default: undefined;
    };
    width: {
        type: NumberConstructor;
        default: undefined;
    };
    height: {
        type: NumberConstructor;
        default: undefined;
    };
    resizable: {
        type: BooleanConstructor;
        default: undefined;
    };
    parentId: {
        type: StringConstructor;
        default: undefined;
    };
    modal: {
        type: BooleanConstructor;
        default: undefined;
    };
    open: {
        type: BooleanConstructor;
        default: boolean;
    };
}>> & Readonly<{
    onInitialized?: ((...args: any[]) => any) | undefined;
    "onUpdate:open"?: ((...args: any[]) => any) | undefined;
    onOpened?: ((...args: any[]) => any) | undefined;
    onClosed?: ((...args: any[]) => any) | undefined;
    onFocused?: ((...args: any[]) => any) | undefined;
    onMinimized?: ((...args: any[]) => any) | undefined;
    onMaximized?: ((...args: any[]) => any) | undefined;
    onRestored?: ((...args: any[]) => any) | undefined;
    onMaximizedDragRestored?: ((...args: any[]) => any) | undefined;
}>, {
    label: string;
    icon: string;
    x: number;
    y: number;
    width: number;
    height: number;
    resizable: boolean;
    parentId: string;
    modal: boolean;
    open: boolean;
}, {}, {}, {}, string, vue.ComponentProvideOptions, true, {}, any>;

export { DpDesktop, DpDesktopIcon, DpWindow, DpWindowManager, useWindowManager };
export type { VueWindowConfig, VueWindowEntry };
