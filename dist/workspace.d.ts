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
     * 啟用後容器會自動加上 wos-isolated CSS class。
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
     * 設為 false 時不注入任何樣式，由使用者完全自行控制 CSS。
     * 可搭配 `getCoreCSS()` 取得預設 CSS 作為修改基礎。
     */
    injectStyles?: boolean;
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
    private _guideV;
    private _guideH;
    /** 追蹤自動建立的 BorderLayout / Panel 實例，視窗關閉時 destroy */
    private readonly _layouts;
    private _resizeObserver;
    readonly events: EventBus;
    constructor(opts?: WindowManagerOptions);
    /**
     * 開啟視窗。若 ID 已存在，恢復並聚焦；否則建立新視窗。
     */
    open(config: WindowConfig): WindowState;
    /**
     * 關閉並銷毀視窗
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
     */
    focus(id: string): void;
    /**
     * 最小化（隱藏 DOM，保留狀態）
     */
    minimize(id: string): void;
    /**
     * 最大化
     */
    maximize(id: string): void;
    /**
     * 還原：
     * - 若視窗是「最大化狀態下被最小化」→ 僅移除最小化，保持最大化
     * - 若只是最大化 → 還原到最大化前的幾何
     * - 若只是最小化 → 還原到原始幾何
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
     * Dock 按鈕的唯一 ID，預設「wos-tv-button」。
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
     */
    injectStyles?: boolean;
    /**
     * 傳給每個 WindowManager 的選項（snap、throttle 等）。
     * 每個工作區的 WindowManager 都套用相同選項。
     */
    windowManagerOptions?: WindowManagerOptions;
}

/** 取得 WorkspaceManager CSS（供 SSR 或自訂注入使用） */
declare function getWorkspaceCSS(): string;
type WorkspaceEvent = 'workspace:added' | 'workspace:removed' | 'workspace:switched';
declare class WorkspaceManager {
    private readonly _root;
    private readonly _animationMs;
    private readonly _wmOptions;
    private readonly _workspaces;
    private readonly _windowManagers;
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
     * 啟用工作區指示點（小圓點）。
     * 會在根容器底部顯示，指示當前所在工作區。
     */
    enableIndicator(): void;
    disableIndicator(): void;
    /** 銷毀所有工作區並清理資源 */
    destroy(): void;
    /** 無動畫直接啟用（初始化或移除當前工作區時使用） */
    private _activateImmediate;
    /** 更新底部指示點 */
    private _updateIndicator;
}

/** 取得 TaskView CSS（供 SSR 或自訂注入使用） */
declare function getTaskViewCSS(): string;
type TaskViewEvent = 'taskview:open' | 'taskview:close';
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

/**
 * 單一視窗的幾何與元資料快照（可 JSON 序列化）。
 * `content` 不可序列化，改以 `appId + props` 描述如何重建。
 */
interface WindowSnapshot {
    id: string;
    title: string;
    icon?: string;
    label?: string;
    /** 對應 AppRegistry 的鍵值，還原時用來重建 content */
    appId: string;
    x: number;
    y: number;
    width: number;
    height: number;
    zIndex: number;
    isMinimized: boolean;
    isMaximized: boolean;
    resizable: boolean;
    props?: Record<string, unknown>;
}
/** 單一工作區快照（含所有視窗） */
interface WorkspaceSnapshot {
    id: string;
    label: string;
    icon?: string;
    windows: WindowSnapshot[];
}
/** 完整 session 快照（含工作區與當前頁） */
interface SessionSnapshot {
    version: 1;
    currentWorkspaceId: string | null;
    /** 多工作區模式下的快照陣列 */
    workspaces?: WorkspaceSnapshot[];
    /** 單一 WindowManager 模式下直接存視窗陣列 */
    windows?: WindowSnapshot[];
}
/**
 * 應用程式登錄表。
 * key = appId（與 WindowSnapshot.appId 對應）
 * value = 工廠函式：傳入 props，回傳視窗 content（HTMLElement / Vue / React 元件）
 */
type AppRegistry = Record<string, (props?: Record<string, unknown>) => unknown>;

declare class SessionManager {
    /**
     * 序列化單一 WindowManager 的視窗狀態，回傳 JSON 字串。
     * 僅保留可序列化的幾何與元資料；content 不保存。
     * 若視窗的 props.appId 不存在，該視窗會被略過（無法還原）。
     */
    static serializeWindows(wm: WindowManager): string;
    /**
     * 序列化 WorkspaceManager（含所有工作區與各自的視窗），回傳 JSON 字串。
     */
    static serializeWorkspaces(wsm: WorkspaceManager): string;
    /**
     * 從 JSON 字串還原視窗到指定 WindowManager。
     * content 透過 registry[appId](props) 重建。
     * 無法在 registry 找到對應 appId 的視窗會被略過（跳過並 console.warn）。
     */
    static restoreWindows(json: string, registry: AppRegistry, wm: WindowManager): void;
    /**
     * 從 JSON 字串還原多工作區狀態到 WorkspaceManager。
     * 每個工作區若已存在則直接使用，若不存在則新建。
     * 所有工作區還原完畢後，切換到快照記錄的活躍工作區。
     */
    static restoreWorkspaces(json: string, registry: AppRegistry, wsm: WorkspaceManager): void;
    private static _snapshotWindows;
    private static _restoreWindowList;
    private static _parse;
}

export { SessionManager, TaskView, WorkspaceManager, getTaskViewCSS, getWorkspaceCSS };
export type { AppRegistry, DockLike, SessionSnapshot, TaskViewEvent, TaskViewOptions, WindowSnapshot, WorkspaceConfig, WorkspaceEvent, WorkspaceManagerOptions, WorkspaceSnapshot, WorkspaceState };
