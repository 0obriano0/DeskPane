// ============================================================
// DeskPane-Desktop — Type Definitions
// ============================================================

import type { DesktopCollectionView } from './DesktopCollectionView.js';

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
  action?: () => void;
  /**
   * 拖曳感應距離（px）。
   * 滑鼠按下後需移動超過此距離才進入拖曳模式；低於此值的位移視為點擊。
   * 預設 6。
   */
  dragThreshold?: number;
}

export type DesktopItemsSource =
  | DesktopIconConfig[]
  | DesktopCollectionView<DesktopIconConfig>;

export type DesktopEvent =
  | 'desktop:ready'
  | 'desktop:destroyed'
  | 'items:changed'
  | 'items:refreshed'
  | 'icon:added'
  | 'icon:removed'
  | 'icon:moved'
  | 'icon:activated'
  | 'icon:selected'
  | 'dock:position-changed';

export interface DesktopItemsEvent {
  source: string;
  reason: string;
  items: DesktopIconConfig[];
}

export interface DesktopIconEvent {
  id: string;
  item: DesktopIconConfig;
  items: DesktopIconConfig[];
}

export interface DesktopIconMoveEvent extends DesktopIconEvent {
  x: number;
  y: number;
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
export interface WindowManagerLike {
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
   * 縮略圖會按比例縮放，不超過此寬高。預設 `{ width: 160, height: 100 }`。
   */
  previewSize?: { width: number; height: number };
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
