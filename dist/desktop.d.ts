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
    action: () => void;
    /**
     * 拖曳感應距離（px）。
     * 滑鼠按下後需移動超過此距離才進入拖曳模式；低於此值的位移視為點擊。
     * 預設 6。
     */
    dragThreshold?: number;
}
/** Dock 工具列項目設定 */
interface DockItemConfig {
    id: string;
    label: string;
    /** URL、emoji 字元、或內聯 SVG 字串 */
    icon: string;
    action: () => void;
}
/** WindowManager 事件資料（最小需求） */
interface DockSyncWindowEvent {
    id: string;
    title?: string;
    /** 視窗圖示（來自 WindowConfig.icon），供 Dock 預設同步使用 */
    icon?: string;
    /** Dock 顯示標籤（來自 WindowConfig.label）；有值時優先於 title */
    label?: string;
}
/** WindowManager 最小介面（duck typing，避免直接依賴 core bundle） */
interface WindowManagerLike {
    events: {
        on<T = unknown>(event: string, cb: (data?: T) => void): () => void;
    };
    focus?: (id: string) => void;
    getWindowIds?: () => string[];
    getState?: (id: string) => DockSyncWindowEvent | undefined;
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
    /** CSS background 值，預設使用 --wos-desktop-bg */
    background?: string;
    /** localStorage key 前綴，用於記憶圖示位置，預設 'wos-desktop' */
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
}

declare class Dock {
    private readonly _el;
    private _items;
    private readonly _position;
    private readonly _iconSize;
    private readonly _showLabels;
    private _dragSrcIndex;
    constructor(config?: DockConfig);
    private _render;
    private _createItemEl;
    private _clearDragover;
    addItem(item: DockItemConfig): void;
    /**
     * 設定目前 active（focused）的 item。
     * 傳 null 清除所有高亮。
     */
    setActiveItem(id: string | null): void;
    private _activeId;
    private _applyActive;
    removeItem(id: string): void;
    /** 取得目前排列順序的 items（含拖曳後的結果） */
    getItems(): DockItemConfig[];
    getElement(): HTMLElement;
    destroy(): void;
}

declare class Desktop {
    private readonly _container;
    private readonly _desktopEl;
    private readonly _iconAreaEl;
    private readonly _dock;
    private readonly _icons;
    private readonly _storageKey;
    private readonly _dragThreshold;
    private readonly _iconSnapEnabled;
    private readonly _iconSnapThreshold;
    private _guideV;
    private _guideH;
    private _iconSentinel;
    private _autoIconIndex;
    private _dockSyncCleanup;
    constructor(config?: DesktopConfig);
    private _loadPositions;
    private _savePositions;
    /** 移動 sentinel 到最遠 icon 的右下角，撐開 scrollHeight/scrollWidth */
    private _updateSentinel;
    private _makeSnapFn;
    private _hideSnapGuides;
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
     * 將 Dock 與 WindowManager 視窗生命週期同步。
     * - 開窗：新增 Dock item
     * - 關窗：移除 Dock item
     * - 點擊 Dock item：預設 focus 視窗（可覆寫）
     */
    syncDockWithWindows(manager: WindowManagerLike, options?: DockSyncOptions): () => void;
    /** 停止 Dock 與 WindowManager 同步，並移除同步產生的 Dock items。 */
    unsyncDockWithWindows(): void;
    /** 取得桌面根元素（可作為 WindowManager 的 container） */
    getElement(): HTMLElement;
    /** 取得圖示區域元素 */
    getIconArea(): HTMLElement;
    /** 銷毀桌面，清除所有 DOM */
    destroy(): void;
}

type IconMoveCallback = (id: string, x: number, y: number) => void;
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
    private _isDragging;
    private _hasMoved;
    private _dragOffX;
    private _dragOffY;
    private _startX;
    private _startY;
    private readonly _onMouseMoveBound;
    private readonly _onMouseUpBound;
    constructor(config: DesktopIconConfig, containerEl: HTMLElement, onMove: IconMoveCallback, dragThreshold?: number, snapFn?: IconSnapFn | null, onDragEnd?: (() => void) | null);
    private _createElement;
    private _onMouseDown;
    private _onMouseMove;
    private _onMouseUp;
    setPosition(x: number, y: number): void;
    getElement(): HTMLElement;
    destroy(): void;
}

export { Desktop, DesktopIcon, Dock };
export type { DesktopConfig, DesktopIconConfig, DockConfig, DockItemConfig, DockPosition, DockSyncOptions, DockSyncWindowEvent, WindowManagerLike };
