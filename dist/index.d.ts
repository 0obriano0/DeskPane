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

/** 回傳 Core CSS 字串，供 injectStyles:false 的使用者自行管理樣式注入 */
declare function getCoreCSS(): string;

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
/** 全域單例 */
declare const eventBus: EventBus;

/** WindowManager 事件清單 */
type WinEvent = 'window:opened' | 'window:closed' | 'window:focused' | 'window:minimized' | 'window:maximized' | 'window:restored' | 'window:maximized-drag-restored' | 'window:edge-snapped' | 'window:moved' | 'window:resized' | 'window:child-opened' | 'window:child-closed';
type EdgeSnapTarget = 'maximize' | 'left' | 'right';
type EdgeSnapEvent = WindowState & {
    edgeSnapTarget: EdgeSnapTarget;
};
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

interface SnapRect {
    x: number;
    y: number;
    width: number;
    height: number;
}
interface SnapGuide {
    /** 'v' = 垂直線（固定 x），'h' = 水平線（固定 y） */
    axis: 'v' | 'h';
    /** 線在容器座標系的位置（px） */
    pos: number;
}
interface SnapResult {
    x: number;
    y: number;
    guides: SnapGuide[];
}
/**
 * 計算拖曳視窗的吸附位置。
 *
 * @param drag          拖曳中視窗的建議位置與大小
 * @param containerSize 容器的寬高（isolated 用容器；否則用 viewport）
 * @param others        其他非最小化 / 非最大化視窗的位置與大小
 * @param threshold     吸附感應距離（px）
 * @param gap           視窗與視窗之間的間距（px），預設 0；容器邊緣不套用
 */
declare function snapPosition(drag: SnapRect, containerSize: {
    width: number;
    height: number;
}, others: SnapRect[], threshold: number, gap?: number): SnapResult;

/** 內建主題名稱 */
type WosThemePreset = 'light' | 'dark' | 'medieval-pixel';
interface SetThemeOptions {
    /**
     * 主題 CSS 檔案所在目錄路徑（不含結尾 `/`）。
     * 預設為 `'themes'`，對應 `dist/themes/` 相對位置。
     */
    basePath?: string;
    /**
     * 用來識別主題 `<link>` 元素的 id。
     * 預設為 `'dp-theme'`。
     */
    linkId?: string;
}
/**
 * 動態切換 DeskPane 主題。
 *
 * 第一次呼叫時，若頁面中不存在指定 id 的 `<link>` 元素，
 * 會自動建立一個並插入 `<head>`。
 *
 * @param preset  `'light'`、`'dark'` 或 `'medieval-pixel'`
 * @param options 選填設定（basePath / linkId）
 *
 * @example
 * // ESM
 * import { setTheme } from 'deskpane';
 * setTheme('dark');
 *
 * // UMD
 * DeskPane.setTheme('dark');
 *
 * // 自訂路徑（例如主題放在 /assets/themes/）
 * setTheme('dark', { basePath: '/assets/themes' });
 */
declare function setTheme(preset: WosThemePreset, options?: SetThemeOptions): void;

type LayoutRegion = 'north' | 'south' | 'east' | 'west' | 'center';
type SplitterKey = Exclude<LayoutRegion, 'center'>;
interface RegionConfig {
    /** Width (east/west) or height (north/south) in px */
    size?: number;
    minSize?: number;
    collapsible?: boolean;
    collapsed?: boolean;
    /** Title shown in region header bar */
    title?: string;
    /** Icon shown before title (emoji or text) */
    icon?: string;
    /** Content element (used in JS-first mode) */
    content?: HTMLElement;
}
interface BorderLayoutOptions {
    /** Container element or CSS selector */
    container: HTMLElement | string;
    /** Splitter thickness in px (default: 5) */
    splitterSize?: number;
    /** Region header height in px (default: 28) */
    headerSize?: number;
    north?: RegionConfig;
    south?: RegionConfig;
    east?: RegionConfig;
    west?: RegionConfig;
    center?: RegionConfig;
}
declare class BorderLayout {
    private container;
    private splitterSize;
    private headerSize;
    private regions;
    private splitterEls;
    private _childLayouts;
    private resizeObserver;
    private cleanups;
    constructor(options: BorderLayoutOptions);
    private _parseHTMLRegions;
    private _buildDOM;
    private _applyLayout;
    /** Set region outer el + inner body positions */
    private _setRegionRect;
    private _applyRect;
    private _initChildLayouts;
    private _attachEvents;
    private _startDrag;
    toggleCollapse(name: SplitterKey): void;
    private _collapseIcon;
    /** 取得指定 region 的 body 元素（內容區） */
    getRegionEl(name: LayoutRegion): HTMLElement | undefined;
    /** 手動觸發重新計算（容器尺寸已改變時使用） */
    resize(): void;
    /** 銷毀：移除事件、observer；child layouts 遞迴 destroy */
    destroy(): void;
}

interface PanelOptions {
    /** Container element or CSS selector */
    container: HTMLElement | string;
    /** Title text shown in the header bar */
    title?: string;
    /** Show collapse/expand toggle button (default: false) */
    collapsible?: boolean;
    /** Initially collapsed (default: false) */
    collapsed?: boolean;
}
declare class Panel {
    private container;
    private headerEl;
    private bodyEl;
    private toggleBtn;
    private _collapsed;
    private _collapsible;
    private cleanups;
    constructor(options: PanelOptions);
    get collapsed(): boolean;
    toggle(): void;
    expand(): void;
    collapse(): void;
    setTitle(title: string): void;
    /** 取得內容區元素 */
    getBodyEl(): HTMLElement;
    destroy(): void;
}

/** 回傳 Layout CSS 字串，供 injectStyles:false 的使用者自行管理樣式注入 */
declare function getLayoutCSS(): string;

export { BorderLayout, EventBus, Panel, WindowManager, eventBus, getCoreCSS, getLayoutCSS, setTheme, snapPosition };
export type { BorderLayoutOptions, EdgeSnapEvent, EdgeSnapTarget, EventCallback, LayoutRegion, PanelOptions, RegionConfig, SetThemeOptions, SlotType, SnapGuide, SnapRect, SnapResult, WinEvent, WindowConfig, WindowManagerOptions, WindowState, WosThemePreset };
