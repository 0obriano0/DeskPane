// ============================================================
// WebOS-Desktop — Desktop
// 桌面主容器：管理圖示區域 + Dock 工具列
// ============================================================

import {
  DesktopConfig,
  DesktopIconConfig,
  DockPosition,
  DockSyncOptions,
  DockSyncWindowEvent,
  WindowManagerLike,
} from './types.js';
import { Dock } from './Dock.js';
import { DesktopIcon, IconSnapFn } from './DesktopIcon.js';
import { injectDesktopStyles } from './styles.js';
import { snapPosition } from '../core/SnapHelper.js';

/** 圖示自動排列：每欄最多幾個 icon */
const AUTO_ROWS = 6;
/** 圖示格子寬度（px） */
const ICON_COL_W = 92;
/** 圖示格子高度（px） */
const ICON_ROW_H = 100;
/** 起始邊距（px） */
const ICON_MARGIN = 12;

/** 計算第 index 個自動排列 icon 的位置 */
function autoPosition(index: number): { x: number; y: number } {
  const col = Math.floor(index / AUTO_ROWS);
  const row = index % AUTO_ROWS;
  return {
    x: ICON_MARGIN + col * ICON_COL_W,
    y: ICON_MARGIN + row * ICON_ROW_H,
  };
}

/** Dock 停靠位置對應的 icon 區域 inset（px） */
function dockInset(position: DockPosition, dockSize: number): { top: number; bottom: number; left: number; right: number } {
  return {
    top: position === 'top' ? dockSize : 0,
    bottom: position === 'bottom' ? dockSize : 0,
    left: position === 'left' ? dockSize : 0,
    right: position === 'right' ? dockSize : 0,
  };
}

export class Desktop {
  private readonly _container: HTMLElement;
  private readonly _desktopEl: HTMLElement;
  private readonly _iconAreaEl: HTMLElement;
  private readonly _dock: Dock;
  private readonly _icons = new Map<string, DesktopIcon>();
  private readonly _storageKey: string;
  private readonly _dragThreshold: number;
  private readonly _iconSnapEnabled: boolean;
  private readonly _iconSnapThreshold: number;
  private _guideV: HTMLElement | null = null;
  private _guideH: HTMLElement | null = null;
  private _iconSentinel: HTMLElement | null = null;
  private _autoIconIndex = 0;
  private _dockSyncCleanup: (() => void) | null = null;

  constructor(config: DesktopConfig = {}) {
    injectDesktopStyles();

    this._container = config.container ?? document.body;
    this._storageKey = config.storageKey ?? 'wos-desktop';
    this._dragThreshold = config.dragThreshold ?? 6;
    this._iconSnapEnabled = config.iconSnap ?? true;
    this._iconSnapThreshold = config.iconSnapThreshold ?? 20;

    // 桌面根元素
    this._desktopEl = document.createElement('div');
    this._desktopEl.className = 'wos-desktop';
    if (config.background) {
      this._desktopEl.style.background = config.background;
    }

    // 圖示區域
    this._iconAreaEl = document.createElement('div');
    this._iconAreaEl.className = 'wos-desktop-icon-area';
    this._desktopEl.appendChild(this._iconAreaEl);

    // Snap guide 線（icon 拖曳吸附指示）
    if (this._iconSnapEnabled) {
      this._guideV = document.createElement('div');
      this._guideV.className = 'wos-snap-guide wos-snap-guide--v wos-icon-snap-guide';
      this._guideH = document.createElement('div');
      this._guideH.className = 'wos-snap-guide wos-snap-guide--h wos-icon-snap-guide';
      this._iconAreaEl.appendChild(this._guideV);
      this._iconAreaEl.appendChild(this._guideH);
    }

    // Sentinel：撐開 scrollHeight 讓 overflow:auto 能捲動到最遠的 icon
    this._iconSentinel = document.createElement('div');
    this._iconSentinel.style.cssText = 'position:absolute;width:1px;height:1px;pointer-events:none;';
    this._iconAreaEl.appendChild(this._iconSentinel);

    // Dock
    this._dock = new Dock(config.dock ?? {});
    this._desktopEl.appendChild(this._dock.getElement());

    // 根據 Dock 位置調整 icon 區域邊距
    const dockPos = config.dock?.position ?? 'bottom';
    const DOCK_SIZE = 68;  // 對齊 CSS .wos-dock-* 的高/寬
    const inset = dockInset(dockPos, DOCK_SIZE);
    const areaStyle = this._iconAreaEl.style;
    areaStyle.top = `${inset.top}px`;
    areaStyle.bottom = `${inset.bottom}px`;
    areaStyle.left = `${inset.left}px`;
    areaStyle.right = `${inset.right}px`;

    // 點擊桌面空白處取消圖示選取
    this._desktopEl.addEventListener('mousedown', (e) => {
      if (e.target === this._desktopEl || e.target === this._iconAreaEl) {
        this._iconAreaEl.querySelectorAll('.wos-icon-selected').forEach(el => {
          el.classList.remove('wos-icon-selected');
        });
      }
    });

    this._container.appendChild(this._desktopEl);

    // 掛載初始圖示
    (config.icons ?? []).forEach(icon => this.addIcon(icon));
  }

  // ── localStorage 位置記憶 ────────────────────────────────

  private _loadPositions(): Record<string, { x: number; y: number }> {
    try {
      const raw = localStorage.getItem(`${this._storageKey}-icon-positions`);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  private _savePositions(): void {
    const positions: Record<string, { x: number; y: number }> = {};
    this._icons.forEach((icon, id) => {
      const el = icon.getElement();
      positions[id] = {
        x: parseInt(el.style.left || '0', 10),
        y: parseInt(el.style.top || '0', 10),
      };
    });
    try {
      localStorage.setItem(
        `${this._storageKey}-icon-positions`,
        JSON.stringify(positions)
      );
    } catch {
      // 忽略 localStorage 寫入錯誤
    }
    this._updateSentinel();
  }

  /** 移動 sentinel 到最遠 icon 的右下角，撐開 scrollHeight/scrollWidth */
  private _updateSentinel(): void {
    if (!this._iconSentinel) return;
    let maxX = 0;
    let maxY = 0;
    this._icons.forEach(icon => {
      const el = icon.getElement();
      const x = parseInt(el.style.left || '0', 10) + el.offsetWidth;
      const y = parseInt(el.style.top || '0', 10) + el.offsetHeight;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    });
    this._iconSentinel.style.left = `${maxX}px`;
    this._iconSentinel.style.top = `${maxY}px`;
  }

  // ── Snap helpers ─────────────────────────────────────────

  private _makeSnapFn(draggingId: string): IconSnapFn {
    return (x: number, y: number, w: number, h: number) => {
      // 收集所有其他 icon 的 rect
      const others = Array.from(this._icons.entries())
        .filter(([id]) => id !== draggingId)
        .map(([, icon]) => {
          const el = icon.getElement();
          return {
            x: parseInt(el.style.left || '0', 10),
            y: parseInt(el.style.top || '0', 10),
            width: el.offsetWidth,
            height: el.offsetHeight,
          };
        });

      const containerW = this._iconAreaEl.offsetWidth;
      const containerH = this._iconAreaEl.offsetHeight;

      const result = snapPosition(
        { x, y, width: w, height: h },
        { width: containerW, height: containerH },
        others,
        this._iconSnapThreshold,
      );

      // 更新 guide 線
      const guideV = this._guideV;
      const guideH = this._guideH;
      const vGuide = result.guides.find(g => g.axis === 'v');
      const hGuide = result.guides.find(g => g.axis === 'h');

      if (guideV) {
        if (vGuide != null) {
          guideV.style.left = `${vGuide.pos}px`;
          guideV.style.display = 'block';
        } else {
          guideV.style.display = 'none';
        }
      }
      if (guideH) {
        if (hGuide != null) {
          guideH.style.top = `${hGuide.pos}px`;
          guideH.style.display = 'block';
        } else {
          guideH.style.display = 'none';
        }
      }

      return { x: result.x, y: result.y };
    };
  }

  private _hideSnapGuides(): void {
    if (this._guideV) this._guideV.style.display = 'none';
    if (this._guideH) this._guideH.style.display = 'none';
  }

  // ── Public API ────────────────────────────────────────────

  /**
   * 新增桌面圖示。
   * 位置優先順序：config.x/y > localStorage 記憶 > 自動排列
   */
  addIcon(config: DesktopIconConfig): void {
    if (this._icons.has(config.id)) return;

    const savedPositions = this._loadPositions();
    const saved = savedPositions[config.id];

    let x = config.x ?? saved?.x;
    let y = config.y ?? saved?.y;

    if (x === undefined || y === undefined) {
      const auto = autoPosition(this._autoIconIndex++);
      x = x ?? auto.x;
      y = y ?? auto.y;
    } else {
      this._autoIconIndex++;
    }

    const snapFn = this._iconSnapEnabled ? this._makeSnapFn(config.id) : null;
    const icon = new DesktopIcon(
      config,
      this._iconAreaEl,
      () => { this._savePositions(); },
      this._dragThreshold,
      snapFn,
      snapFn ? () => { this._hideSnapGuides(); } : null,
    );
    icon.setPosition(x, y);
    this._iconAreaEl.appendChild(icon.getElement());
    this._icons.set(config.id, icon);
    this._updateSentinel();
  }

  /** 移除桌面圖示 */
  removeIcon(id: string): void {
    const icon = this._icons.get(id);
    if (icon) {
      icon.destroy();
      this._icons.delete(id);
      this._updateSentinel();
    }
  }

  /** 取得 Dock 實例，可動態增減 Dock 項目 */
  getDock(): Dock {
    return this._dock;
  }

  /**
   * 將 Dock 與 WindowManager 視窗生命週期同步。
   * - 開窗：新增 Dock item
   * - 關窗：移除 Dock item
   * - 點擊 Dock item：預設 focus 視窗（可覆寫）
   */
  syncDockWithWindows(manager: WindowManagerLike, options: DockSyncOptions = {}): () => void {
    this.unsyncDockWithWindows();

    const getAppIdFromWindowId = options.getAppIdFromWindowId ?? ((windowId: string) => {
      if (windowId.startsWith('app-')) return windowId.slice(4);
      return windowId;
    });
    const getDockItem = options.getDockItem ?? ((appId: string, event: DockSyncWindowEvent) => ({
      label: event.title ?? appId,
      icon: '🪟',
    }));
    const onDockItemClick = options.onDockItemClick;
    const dockItemIdPrefix = options.dockItemIdPrefix ?? 'running-';
    const dedupeByAppId = options.dedupeByAppId ?? true;
    const syncExisting = options.syncExisting ?? true;

    const runningDockIds = new Set<string>();
    const dockIdToWindowId = new Map<string, string>();
    let activeDockId: string | null = null;

    const toDockId = (appId: string, windowId: string): string => {
      const key = dedupeByAppId ? appId : windowId;
      return `${dockItemIdPrefix}${key}`;
    };

    const addDockItemForWindow = (event?: DockSyncWindowEvent): void => {
      if (!event?.id) return;
      const appId = getAppIdFromWindowId(event.id);
      if (!appId) return;

      const dockId = toDockId(appId, event.id);
      dockIdToWindowId.set(dockId, event.id);
      if (runningDockIds.has(dockId)) return;

      const item = getDockItem(appId, event);
      if (!item) return;

      runningDockIds.add(dockId);
      this._dock.addItem({
        id: dockId,
        label: item.label,
        icon: item.icon,
        action: () => {
          const liveWindowId = dockIdToWindowId.get(dockId) ?? event.id;
          if (onDockItemClick) {
            onDockItemClick(appId, liveWindowId);
            return;
          }
          manager.focus?.(liveWindowId);
        },
      });
      // 新視窗開啟後即為 active（WindowManager 不另外 emit window:focused）
      activeDockId = dockId;
      this._dock.setActiveItem(dockId);
    };

    const removeDockItemForWindow = (event?: DockSyncWindowEvent): void => {
      if (!event?.id) return;
      const appId = getAppIdFromWindowId(event.id);
      if (!appId) return;

      const dockId = toDockId(appId, event.id);
      dockIdToWindowId.delete(dockId);
      if (!runningDockIds.has(dockId)) return;
      runningDockIds.delete(dockId);
      this._dock.removeItem(dockId);
      // 若關閉的視窗正好是 active，清除高亮
      if (activeDockId === dockId) {
        activeDockId = null;
        this._dock.setActiveItem(null);
      }
    };

    const setFocused = (event?: DockSyncWindowEvent): void => {
      if (!event?.id) return;
      const appId = getAppIdFromWindowId(event.id);
      if (!appId) return;
      const dockId = toDockId(appId, event.id);
      activeDockId = runningDockIds.has(dockId) ? dockId : null;
      this._dock.setActiveItem(activeDockId);
    };

    const offOpened = manager.events.on<DockSyncWindowEvent>('window:opened', addDockItemForWindow);
    const offClosed = manager.events.on<DockSyncWindowEvent>('window:closed', removeDockItemForWindow);
    const offFocused = manager.events.on<DockSyncWindowEvent>('window:focused', setFocused);

    if (syncExisting && manager.getWindowIds) {
      manager.getWindowIds().forEach((id) => {
        const state = manager.getState?.(id);
        addDockItemForWindow({
          id,
          title: state?.title,
        });
      });
    }

    const cleanup = () => {
      offOpened();
      offClosed();
      offFocused();
      runningDockIds.forEach((dockId) => this._dock.removeItem(dockId));
      runningDockIds.clear();
      dockIdToWindowId.clear();
      activeDockId = null;
      this._dock.setActiveItem(null);
      if (this._dockSyncCleanup === cleanup) {
        this._dockSyncCleanup = null;
      }
    };

    this._dockSyncCleanup = cleanup;
    return cleanup;
  }

  /** 停止 Dock 與 WindowManager 同步，並移除同步產生的 Dock items。 */
  unsyncDockWithWindows(): void {
    this._dockSyncCleanup?.();
    this._dockSyncCleanup = null;
  }

  /** 取得桌面根元素（可作為 WindowManager 的 container） */
  getElement(): HTMLElement {
    return this._desktopEl;
  }

  /** 取得圖示區域元素 */
  getIconArea(): HTMLElement {
    return this._iconAreaEl;
  }

  /** 銷毀桌面，清除所有 DOM */
  destroy(): void {
    this.unsyncDockWithWindows();
    this._icons.forEach(icon => icon.destroy());
    this._icons.clear();
    this._dock.destroy();
    this._desktopEl.remove();
  }
}
