// ============================================================
// WebOS-Desktop — Type Definitions
// ============================================================

/** 桌面圖示設定 */
export interface DesktopIconConfig {
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
export interface DockItemConfig {
  id: string;
  label: string;
  /** URL、emoji 字元、或內聯 SVG 字串 */
  icon: string;
  action: () => void;
}

/** WindowManager 事件資料（最小需求） */
export interface DockSyncWindowEvent {
  id: string;
  title?: string;
  /** 視窗圖示（來自 WindowConfig.icon），供 Dock 預設同步使用 */
  icon?: string;
  /** Dock 顯示標籤（來自 WindowConfig.label）；有值時優先於 title */
  label?: string;
}

/** WindowManager 最小介面（duck typing，避免直接依賴 core bundle） */
export interface WindowManagerLike {
  events: {
    on<T = unknown>(event: string, cb: (data?: T) => void): () => void;
  };
  focus?: (id: string) => void;
  getWindowIds?: () => string[];
  getState?: (id: string) => DockSyncWindowEvent | undefined;
  /** 取得視窗的完整 DOM 元素（含標題列），供 hover 預覽使用 */
  getWindowElement?: (id: string) => HTMLElement | undefined;
}

/** Dock 與 WindowManager 同步設定 */
export interface DockSyncOptions {
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
   * 縮略圖會按比例縮放，不超過此寬高。預設 `{ width: 240, height: 150 }`。
   */
  previewSize?: { width: number; height: number };
}

/** Dock 停靠位置 */
export type DockPosition = 'bottom' | 'top' | 'left' | 'right';

/** Dock 工具列設定 */
export interface DockConfig {
  /** 停靠位置，預設 'bottom' */
  position?: DockPosition;
  items?: DockItemConfig[];
  /** 圖示大小（px），預設 44 */
  iconSize?: number;
  /** 是否顯示文字標籤，預設 true */
  showLabels?: boolean;
}

/** 桌面主設定 */
export interface DesktopConfig {
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
  /**
   * 是否自動注入 Desktop CSS 樣式，預設 true。
   * 設為 false 時不注入任何樣式，由使用者完全自行控制 CSS。
   * 可搭配 `getDesktopCSS()` 取得預設 CSS 作為修改基礎。
   */
  injectStyles?: boolean;
}
