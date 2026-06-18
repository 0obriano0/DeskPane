// ============================================================
// DeskPane-Desktop — Desktop
// 桌面主容器：管理圖示區域 + Dock 工具列
// ============================================================

import {
  DesktopConfig,
  DesktopIconConfig,
  DesktopIconEvent,
  DesktopIconMoveEvent,
  DesktopItemsEvent,
  DesktopItemsSource,
  DockPosition,
  DockSyncOptions,
  DockSyncWindowEvent,
  WindowManagerLike,
} from './types.js';
import { Dock } from './Dock.js';
import { DesktopIcon, IconSnapFn } from './DesktopIcon.js';
import { DesktopCollectionChangedEvent, DesktopCollectionView } from './DesktopCollectionView.js';
import { injectDesktopStyles } from './styles.js';
import { snapPosition } from '../core/SnapHelper.js';
import { EventBus } from '../core/EventBus.js';

/** 群組預覽：每張卡片的預設寬高（px） */
const PREVIEW_CARD_W = 160;
const PREVIEW_CARD_H = 100;

interface GroupPreviewOptions {
  anchorEl: HTMLElement;
  dockPos: DockPosition;
  /** [parentId, ...childIds] */
  windowIds: string[];
  getWindowEl: (id: string) => HTMLElement | undefined;
  getWinState: (id: string) => (DockSyncWindowEvent & { width?: number; height?: number }) | undefined;
  cardW: number;
  cardH: number;
  onCardClick: (id: string) => void;
  onCardClose: (id: string) => void;
  /**
   * popup 掛載元素。
   * 優先使用傳入值；否則自動偵測第一個 winEl 最近的 `.v-application`；
   * 都找不到則 fallback 到 `document.body`。
   * 掛在 CSS scope root 內可確保 cloneNode 縮略圖繼承 Vuetify / scoped CSS / CSS 變數。
   * popup 本身用 `position:fixed`，定位座標仍為 viewport 座標，不受此影響。
   */
  mountEl?: HTMLElement;
}

/**
 * 建立 Windows 風格群組縮略圖 popup。
 * 每個視窗（父 + 子）對應一張卡片，卡片含標題列與縮略圖。
 */
function buildGroupPreview(opts: GroupPreviewOptions): HTMLElement {
  const { anchorEl, dockPos, windowIds, getWindowEl, getWinState,
          cardW, cardH, onCardClick, onCardClose, mountEl } = opts;
  const HEADER_H = 26;
  const CARD_GAP = 6;
  const PADDING  = 8;

  const popup = document.createElement('div');
  popup.className = `dp-dock-group-preview dp-dock-group-preview--${dockPos}`;

  for (const winId of windowIds) {
    const state = getWinState(winId);
    const winEl = getWindowEl(winId);

    const card = document.createElement('div');
    card.className = 'dp-dock-group-card';
    card.dataset.windowId = winId;

    // ── Header（標題 + 關閉鈕）──
    const header = document.createElement('div');
    header.className = 'dp-dock-group-card-header';

    const titleEl = document.createElement('span');
    titleEl.className = 'dp-dock-group-card-title';
    titleEl.textContent = state?.title ?? winId;
    titleEl.title = state?.title ?? winId;

    const closeBtn = document.createElement('button');
    closeBtn.className = 'dp-dock-group-card-close';
    closeBtn.setAttribute('aria-label', '關閉');
    closeBtn.textContent = '✕';
    closeBtn.addEventListener('mousedown', (e) => e.stopPropagation());
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      onCardClose(winId);
    });

    header.append(titleEl, closeBtn);

    // ── Thumbnail ──
    const thumb = document.createElement('div');
    thumb.className = 'dp-dock-group-card-thumb';
    thumb.style.width  = `${cardW}px`;
    thumb.style.height = `${cardH}px`;

    if (winEl) {
      const winW = (state as any)?.width  || winEl.offsetWidth  || 640;
      const winH = (state as any)?.height || winEl.offsetHeight || 480;
      const scale = Math.min(cardW / winW, cardH / winH, 1);

      const scaleWrap = document.createElement('div');
      scaleWrap.style.cssText =
        `position:absolute;top:0;left:0;width:${winW}px;height:${winH}px;` +
        `transform:scale(${scale});transform-origin:top left;pointer-events:none;overflow:hidden;`;

      const clone = winEl.cloneNode(true) as HTMLElement;
      clone.classList.remove('dp-minimized', 'dp-maximized');
      clone.style.cssText =
        'position:absolute;left:0;top:0;width:100%;height:100%;' +
        'transform:none;transition:none;pointer-events:none;';

      scaleWrap.appendChild(clone);
      thumb.appendChild(scaleWrap);
    }

    card.append(header, thumb);
    card.addEventListener('click', () => onCardClick(winId));
    popup.appendChild(card);
  }

  // ── 定位 popup ──
  const cols      = dockPos === 'left' || dockPos === 'right' ? 1 : windowIds.length;
  const rows      = dockPos === 'left' || dockPos === 'right' ? windowIds.length : 1;
  const totalW    = cols * cardW + (cols - 1) * CARD_GAP + PADDING * 2;
  const totalH    = rows * (cardH + HEADER_H) + (rows - 1) * CARD_GAP + PADDING * 2;
  const rect      = anchorEl.getBoundingClientRect();
  const MARGIN    = 8;
  let x: number, y: number;

  if (dockPos === 'bottom') {
    x = rect.left + rect.width / 2 - totalW / 2;
    y = rect.top - totalH - MARGIN;
  } else if (dockPos === 'top') {
    x = rect.left + rect.width / 2 - totalW / 2;
    y = rect.bottom + MARGIN;
  } else if (dockPos === 'left') {
    x = rect.right + MARGIN;
    y = rect.top + rect.height / 2 - totalH / 2;
  } else {
    x = rect.left - totalW - MARGIN;
    y = rect.top + rect.height / 2 - totalH / 2;
  }

  x = Math.max(8, Math.min(window.innerWidth  - totalW - 8, x));
  y = Math.max(8, Math.min(window.innerHeight - totalH - 8, y));

  // position:fixed inline — 防止外層 transform/will-change 建立新的 containing block
  // 座標系與 getBoundingClientRect() 一致（viewport 座標），與掛載點無關
  popup.style.cssText += `position:fixed;left:${x}px;top:${y}px;`;

  // 儲存最終採用的掛載元素（mountEl → 第一個 winEl 最近的 .v-application → body）
  // 掛在 CSS scope root 內確保 cloneNode 縮略圖繼承 Vuetify/Scoped CSS/CSS 變數
  const firstWinEl = windowIds.length > 0 ? getWindowEl(windowIds[0]) : undefined;
  const resolvedMount: HTMLElement =
    mountEl ??
    (firstWinEl?.closest('.v-application') as HTMLElement | null ?? null) ??
    document.body;
  (popup as any)._mountEl = resolvedMount;

  return popup;
}


/** 圖示自動排列：每欄最多幾個 icon */
const AUTO_ROWS = 6;
/** 圖示格子寬度（px） */
const ICON_COL_W = 92;
/** 圖示格子高度（px） */
const ICON_ROW_H = 100;
/** 起始邊距（px） */
const ICON_MARGIN = 12;
/** Dock 停靠列高度 / 寬度（px）；對齊 CSS .dp-dock-* */
const DOCK_SIZE = 68;

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
  private readonly _windowAreaEl: HTMLElement;
  private readonly _dock: Dock;
  private readonly _icons = new Map<string, DesktopIcon>();
  private _itemsView: DesktopCollectionView<DesktopIconConfig> | null = null;
  private _itemsViewOff: (() => void) | null = null;
  private readonly _storageKey: string;
  private readonly _dragThreshold: number;
  private readonly _iconSnapEnabled: boolean;
  private readonly _iconSnapThreshold: number;
  private _guideV: HTMLElement | null = null;
  private _guideH: HTMLElement | null = null;
  private _iconSentinel: HTMLElement | null = null;
  private _autoIconIndex = 0;
  private _dockSyncCleanup: (() => void) | null = null;
  readonly events: EventBus;

  constructor(config: DesktopConfig = {}) {
    if (config.injectStyles !== false) injectDesktopStyles();

    this._container = config.container ?? document.body;
    this._storageKey = config.storageKey ?? 'dp-desktop';
    this._dragThreshold = config.dragThreshold ?? 6;
    this._iconSnapEnabled = config.iconSnap ?? true;
    this._iconSnapThreshold = config.iconSnapThreshold ?? 20;
    this.events = new EventBus();

    // 桌面根元素
    this._desktopEl = document.createElement('div');
    this._desktopEl.className = 'dp-desktop';
    if (config.background) {
      this._desktopEl.style.background = config.background;
    }

    // 圖示區域
    this._iconAreaEl = document.createElement('div');
    this._iconAreaEl.className = 'dp-desktop-icon-area';
    this._desktopEl.appendChild(this._iconAreaEl);

    // 視窗區域：大小與 iconArea 相同（排除 Dock 佔用空間），
    // 作為 WindowManager 的 container，確保最大化時不超過 Dock
    this._windowAreaEl = document.createElement('div');
    this._windowAreaEl.className = 'dp-desktop-window-area';
    this._desktopEl.appendChild(this._windowAreaEl);

    // Snap guide 線（icon 拖曳吸附指示）
    if (this._iconSnapEnabled) {
      this._guideV = document.createElement('div');
      this._guideV.className = 'dp-snap-guide dp-snap-guide--v dp-icon-snap-guide';
      this._guideH = document.createElement('div');
      this._guideH.className = 'dp-snap-guide dp-snap-guide--h dp-icon-snap-guide';
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

    // 根據 Dock 位置調整 icon 區域邊距；視窗區域故意全尺寸，讓視窗可滑入 Dock 下方
    const dockPos = config.dock?.position ?? 'bottom';
    const inset = dockInset(dockPos, DOCK_SIZE);
    this._applyInset(inset);

    // 點擊桌面空白處取消圖示選取
    this._desktopEl.addEventListener('mousedown', (e) => {
      if (e.target === this._desktopEl || e.target === this._iconAreaEl) {
        this._iconAreaEl.querySelectorAll('.dp-icon-selected').forEach(el => {
          el.classList.remove('dp-icon-selected');
        });
      }
    });

    this._container.appendChild(this._desktopEl);

    // 掛載初始圖示。icons 保留相容性；itemsSource 是新的 Wijmo-style API。
    this.setItemsSource(config.itemsSource ?? config.icons ?? [], { emit: false, source: 'init' });
    this.events.emit<DesktopItemsEvent>('desktop:ready', {
      source: 'desktop',
      reason: 'ready',
      items: this.getItems(),
    });
  }

  // ── localStorage 位置記憶 ────────────────────────────────

  /**
   * 更新 icon 區域的 inset（避免 icon 被 Dock 遮住）。
   * 視窗區域維持全尺寸（0,0,0,0），讓視窗可自由滑入 Dock 下方，
   * 透過 CSS 變數 --dp-dock-inset-* 控制最大化時的邊界。
   */
  private _applyInset(inset: { top: number; bottom: number; left: number; right: number }): void {
    // icon 區域：跟著 dock 縮排
    this._iconAreaEl.style.top    = `${inset.top}px`;
    this._iconAreaEl.style.bottom = `${inset.bottom}px`;
    this._iconAreaEl.style.left   = `${inset.left}px`;
    this._iconAreaEl.style.right  = `${inset.right}px`;

    // 視窗區域：永遠全尺寸，讓 backdrop-filter 能穿透看到視窗
    this._windowAreaEl.style.top    = '0';
    this._windowAreaEl.style.bottom = '0';
    this._windowAreaEl.style.left   = '0';
    this._windowAreaEl.style.right  = '0';

    // 告知 CSS 目前 Dock 的 inset，供最大化視窗使用
    const s = this._desktopEl.style;
    s.setProperty('--dp-dock-inset-top',    `${inset.top}px`);
    s.setProperty('--dp-dock-inset-bottom', `${inset.bottom}px`);
    s.setProperty('--dp-dock-inset-left',   `${inset.left}px`);
    s.setProperty('--dp-dock-inset-right',  `${inset.right}px`);
  }

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
        guideV.style.display = vGuide ? 'block' : 'none';
        if (vGuide) guideV.style.left = `${vGuide.pos}px`;
      }
      if (guideH) {
        guideH.style.display = hGuide ? 'block' : 'none';
        if (hGuide) guideH.style.top = `${hGuide.pos}px`;
      }

      return { x: result.x, y: result.y };
    };
  }

  private _hideSnapGuides(): void {
    if (this._guideV) this._guideV.style.display = 'none';
    if (this._guideH) this._guideH.style.display = 'none';
  }

  private _emitItemsChanged(reason: string, source: string): void {
    this.events.emit<DesktopItemsEvent>('items:changed', {
      source,
      reason,
      items: this.getItems(),
    });
  }

  private _emitItemsRefreshed(reason: string, source: string): void {
    this.events.emit<DesktopItemsEvent>('items:refreshed', {
      source,
      reason,
      items: this.getItems(),
    });
  }

  private _clearIcons(): void {
    this._icons.forEach(icon => icon.destroy());
    this._icons.clear();
    this._autoIconIndex = 0;
    this._updateSentinel();
  }

  private _renderItems(items: DesktopIconConfig[]): void {
    this._clearIcons();
    items.forEach(item => this._mountIcon(item, false));
    this._updateSentinel();
  }

  private _mountIcon(config: DesktopIconConfig, emit: boolean): DesktopIconConfig | null {
    if (this._icons.has(config.id)) return null;

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

    const item: DesktopIconConfig = { ...config, x, y };
    const snapFn = this._iconSnapEnabled ? this._makeSnapFn(config.id) : null;
    const icon = new DesktopIcon(
      {
        ...item,
        action: () => {
          const eventItem = this.getItem(config.id) ?? item;
          this.events.emit<DesktopIconEvent>('icon:activated', {
            id: config.id,
            item: eventItem,
            items: this.getItems(),
          });
          config.action?.();
        },
      },
      this._iconAreaEl,
      (id, nextX, nextY) => { this._handleIconMoved(id, nextX, nextY); },
      this._dragThreshold,
      snapFn,
      snapFn ? () => { this._hideSnapGuides(); } : null,
      (id) => {
        const eventItem = this.getItem(id) ?? item;
        this.events.emit<DesktopIconEvent>('icon:selected', {
          id,
          item: eventItem,
          items: this.getItems(),
        });
      },
    );
    icon.setPosition(x, y);
    this._iconAreaEl.appendChild(icon.getElement());
    this._icons.set(config.id, icon);
    this._updateSentinel();

    if (emit) {
      this.events.emit<DesktopIconEvent>('icon:added', {
        id: config.id,
        item,
        items: this.getItems(),
      });
    }

    return item;
  }

  private _removeIconElement(id: string, emit: boolean): DesktopIconConfig | undefined {
    const icon = this._icons.get(id);
    if (!icon) return undefined;
    const item = this.getItem(id) ?? icon.getConfig();
    icon.destroy();
    this._icons.delete(id);
    this._updateSentinel();
    if (emit) {
      this.events.emit<DesktopIconEvent>('icon:removed', {
        id,
        item,
        items: this.getItems(),
      });
    }
    return item;
  }

  private _handleIconMoved(id: string, x: number, y: number): void {
    this._savePositions();
    this._itemsView?.update(id, { x, y } as Partial<DesktopIconConfig>, {
      source: 'desktop',
      emit: false,
    });
    const item = this.getItem(id);
    if (!item) return;
    this.events.emit<DesktopIconMoveEvent>('icon:moved', {
      id,
      x,
      y,
      item,
      items: this.getItems(),
    });
    this._emitItemsChanged('icon:moved', 'desktop');
  }

  // ── Public API ────────────────────────────────────────────

  setItemsSource(
    source: DesktopItemsSource,
    options: { source?: string; emit?: boolean } = {},
  ): void {
    this._itemsViewOff?.();
    this._itemsViewOff = null;

    this._itemsView = source instanceof DesktopCollectionView
      ? source
      : new DesktopCollectionView(source);

    this._itemsViewOff = this._itemsView.collectionChanged.on<DesktopCollectionChangedEvent<DesktopIconConfig>>(
      'change',
      (change) => {
        if (change.source === 'desktop') return;
        this._renderItems(this._itemsView?.items ?? []);
        this._emitItemsRefreshed(change.action, change.source || 'itemsSource');
        this._emitItemsChanged(change.action, change.source || 'itemsSource');
      },
    );

    this._renderItems(this._itemsView.items);
    if (options.emit !== false) {
      this._emitItemsRefreshed('reset', options.source ?? 'api');
      this._emitItemsChanged('reset', options.source ?? 'api');
    }
  }

  getCollectionView(): DesktopCollectionView<DesktopIconConfig> | null {
    return this._itemsView;
  }

  getItems(): DesktopIconConfig[] {
    const sourceItems = this._itemsView?.items ?? [];
    return sourceItems.map(item => {
      const icon = this._icons.get(item.id);
      if (!icon) return { ...item };
      const el = icon.getElement();
      return {
        ...item,
        x: parseInt(el.style.left || `${item.x ?? 0}`, 10),
        y: parseInt(el.style.top || `${item.y ?? 0}`, 10),
      };
    });
  }

  getItem(id: string): DesktopIconConfig | undefined {
    return this.getItems().find(item => item.id === id);
  }

  setItems(items: DesktopIconConfig[]): void {
    if (!this._itemsView) {
      this.setItemsSource(items, { source: 'api' });
      return;
    }
    this._itemsView.setSourceCollection(items, { source: 'desktop', emit: false });
    this._renderItems(this._itemsView.items);
    this._emitItemsRefreshed('reset', 'api');
    this._emitItemsChanged('reset', 'api');
  }

  refreshItems(): void {
    this._itemsView?.refresh({ source: 'desktop', emit: false });
    this._renderItems(this._itemsView?.items ?? []);
    this._emitItemsRefreshed('refresh', 'api');
  }

  refresh(): void {
    this.refreshItems();
  }

  updateItem(id: string, patch: Partial<DesktopIconConfig>): DesktopIconConfig | undefined {
    const item = this._itemsView?.update(id, patch, { source: 'desktop', emit: false });
    if (!item) return undefined;
    this._renderItems(this._itemsView?.items ?? []);
    this._emitItemsChanged('icon:update', 'api');
    return { ...item };
  }

  /**
   * 新增桌面圖示。
   * 位置優先順序：config.x/y > localStorage 記憶 > 自動排列
   */
  addIcon(config: DesktopIconConfig): void {
    if (!this._itemsView) this.setItemsSource([], { emit: false });
    if (this._itemsView?.getItem(config.id)) return;
    const item = this._mountIcon(config, true);
    if (!item) return;
    this._itemsView?.add(item, { source: 'desktop' });
    this._emitItemsChanged('icon:add', 'desktop');
  }

  /** 移除桌面圖示 */
  removeIcon(id: string): void {
    const removed = this._removeIconElement(id, true);
    if (!removed) return;
    this._itemsView?.remove(id, { source: 'desktop' });
    this._emitItemsChanged('icon:remove', 'desktop');
  }

  /** 取得 Dock 實例，可動態增減 Dock 項目 */
  getDock(): Dock {
    return this._dock;
  }

  /**
   * 動態變更 Dock 停靠位置（top | bottom | left | right）。
   * 同時更新 icon 區域 inset，使 icon 不被 Dock 遮住。
   */
  setDockPosition(position: DockPosition): void {
    this._dock.setPosition(position);
    this._applyInset(dockInset(position, DOCK_SIZE));
    this.events.emit<{ position: DockPosition }>('dock:position-changed', { position });
  }

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
  syncDockWithWindows(manager: WindowManagerLike, options: DockSyncOptions = {}): () => void {
    this.unsyncDockWithWindows();

    // 預設把 `app-foo` 視為 appId `foo`，方便桌面 app 用穩定 app id 去重。
    // WorkspaceManager 會另外提供 `getAppIdFromWorkspaceWindowId()` 供跨工作區使用。
    const getAppIdFromWindowId = options.getAppIdFromWindowId ?? ((windowId: string) => {
      if (windowId.startsWith('app-')) return windowId.slice(4);
      return windowId;
    });
    const getDockItem = options.getDockItem ?? ((appId: string, event: DockSyncWindowEvent) => ({
      label: event.label ?? event.title ?? appId,
      icon: event.icon ?? '🪟',
    }));
    const onDockItemClick = options.onDockItemClick;
    const dockItemIdPrefix = options.dockItemIdPrefix ?? 'running-';
    const dedupeByAppId = options.dedupeByAppId ?? true;
    const syncExisting = options.syncExisting ?? true;

    // runningDockIds 是本次 sync 建立的 Dock item 清單，cleanup 只移除這些。
    // dockIdToWindowId 記錄目前 Dock item 對應的最後一個 live window。
    const runningDockIds = new Set<string>();
    const dockIdToWindowId = new Map<string, string>();
    let activeDockId: string | null = null;

    const enablePreview = options.showWindowPreview !== false;
    const previewCardW = options.previewSize?.width  ?? PREVIEW_CARD_W;
    const previewCardH = options.previewSize?.height ?? PREVIEW_CARD_H;
    const previewMountEl = options.previewMountEl;  // undefined = 自動偵測 .v-application
    let previewEl: HTMLElement | null = null;
    let previewShowTimer: ReturnType<typeof setTimeout> | undefined;
    let previewHideTimer: ReturnType<typeof setTimeout> | undefined;
    const hoverCleanups: Array<() => void> = [];

    const hideGroupPreview = () => {
      clearTimeout(previewShowTimer);
      clearTimeout(previewHideTimer);
      previewEl?.remove();
      previewEl = null;
    };

    const scheduleHide = () => {
      clearTimeout(previewHideTimer);
      previewHideTimer = setTimeout(hideGroupPreview, 120);
    };

    const showGroupPreview = (anchorEl: HTMLElement, parentWindowId: string) => {
      clearTimeout(previewShowTimer);
      clearTimeout(previewHideTimer);
      previewShowTimer = setTimeout(() => {
        hideGroupPreview();

        // 收集父視窗 + 所有子視窗。子視窗不獨立出現在 Dock，但會在群組預覽中顯示。
        const childIds = manager.getChildIds?.(parentWindowId) ?? [];
        const windowIds = [parentWindowId, ...childIds];

        const onCardClick = (winId: string) => {
          manager.focus?.(winId);
          hideGroupPreview();
        };

        const onCardClose = (winId: string) => {
          // 若要關閉的視窗有 modal 子視窗，阻止並提示
          if (manager.getChildIds) {
            const children = manager.getChildIds(winId);
            const modalChildId = children.find(cid => {
              const cs = manager.getState?.(cid) as { modal?: boolean } | undefined;
              return cs?.modal === true;
            });
            if (modalChildId) {
              // 搖晃 modal 子視窗本體
              manager.shake?.(modalChildId);
              // 搖晃群組預覽中對應的卡片
              const card = previewEl?.querySelector<HTMLElement>(`[data-window-id="${modalChildId}"]`);
              if (card) {
                card.classList.add('dp-group-card--shake');
                setTimeout(() => card.classList.remove('dp-group-card--shake'), 400);
              }
              return;
            }
          }
          manager.close?.(winId);
          // 移除已關閉的卡片
          const card = previewEl?.querySelector(`[data-window-id="${winId}"]`);
          card?.remove();
          // 無卡片則關閉 popup
          if (previewEl && previewEl.querySelectorAll('.dp-dock-group-card').length === 0) {
            hideGroupPreview();
          }
        };

        previewEl = buildGroupPreview({
          anchorEl,
          dockPos: this._dock.getPosition(),
          windowIds,
          getWindowEl: (id) => manager.getWindowElement?.(id),
          getWinState: (id) => manager.getState?.(id) as any,
          cardW: previewCardW,
          cardH: previewCardH,
          onCardClick,
          onCardClose,
          mountEl: previewMountEl,
        });

        // Sticky hover：滑鼠移入 popup 時取消隱藏計時器
        previewEl.addEventListener('mouseenter', () => clearTimeout(previewHideTimer));
        previewEl.addEventListener('mouseleave', scheduleHide);

        // 掛載到 _mountEl（.v-application 或 document.body），確保 CSS scope 繼承
        const mount: HTMLElement = (previewEl as any)._mountEl ?? document.body;
        mount.appendChild(previewEl);
        requestAnimationFrame(() => previewEl?.classList.add('dp-dock-group-preview--visible'));
      }, 280);
    };

    const attachGroupHover = (dockId: string, windowId: string) => {
      if (!enablePreview) return;
      const itemEl = this._dock.getItemElement(dockId);
      if (!itemEl) return;
      const enter = () => showGroupPreview(itemEl, windowId);
      const leave = () => scheduleHide();
      itemEl.addEventListener('mouseenter', enter);
      itemEl.addEventListener('mouseleave', leave);
      hoverCleanups.push(() => {
        itemEl.removeEventListener('mouseenter', enter);
        itemEl.removeEventListener('mouseleave', leave);
      });
    };

    /** Dock._render() 每次都重建 DOM，必須重綁所有 hover 事件 */
    const refreshAllPreviewHovers = () => {
      hoverCleanups.forEach(fn => fn());
      hoverCleanups.length = 0;
      runningDockIds.forEach(id => {
        const wid = dockIdToWindowId.get(id);
        if (wid) attachGroupHover(id, wid);
      });
    };


    const toDockId = (appId: string, windowId: string): string => {
      const key = dedupeByAppId ? appId : windowId;
      return `${dockItemIdPrefix}${key}`;
    };

    const addDockItemForWindow = (event?: DockSyncWindowEvent): void => {
      if (!event?.id) return;
      // 子視窗（有 parentId）不在 Dock 獨立顯示；改由父視窗群組預覽呈現。
      if (event.parentId) return;

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
          // 首先 focus 父視窗
          manager.focus?.(liveWindowId);
          // 同時确保所有子視窗也 restore + 置頂
          if (manager.getChildIds) {
            const childIds = manager.getChildIds(liveWindowId);
            childIds.forEach(childId => {
              manager.focus?.(childId);
            });
            // 最後再肁焦父視窗（讓子視窗繼續高於父）
            if (childIds.length > 0) {
              manager.focus?.(liveWindowId);
            }
          }
        },
      });
      // 新視窗開啟後即為 active（WindowManager 不另外 emit window:focused）
      activeDockId = dockId;
      this._dock.setActiveItem(dockId);
      // hover 重綁由 onRender 統一處理（addItem 會觸發 _render → onRender）。
      // 不在這裡直接 attach，避免 Dock 重排 / render 後 listener 掛到舊 DOM。
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
    // 拖曳排序後 Dock 重建 DOM，需重綁所有 hover
    const offRender = enablePreview ? this._dock.onRender(refreshAllPreviewHovers) : () => {};

    if (syncExisting && manager.getWindowIds) {
      manager.getWindowIds().forEach((id) => {
        const state = manager.getState?.(id);
        addDockItemForWindow({
          id,
          title:    state?.title,
          label:    state?.label,
          icon:     state?.icon,
          parentId: state?.parentId,  // 正確過濾已存在的子視窗
        });
      });
    }

    const cleanup = () => {
      offOpened();
      offClosed();
      offFocused();
      offRender();
      hideGroupPreview();
      hoverCleanups.forEach(fn => fn());
      hoverCleanups.length = 0;
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

  /** 取得視窗區域元素（排除 Dock，供 WindowManager 使用） */
  getElement(): HTMLElement {
    return this._windowAreaEl;
  }

  /** 取得桌面根元素（含 Dock） */
  getDesktopElement(): HTMLElement {
    return this._desktopEl;
  }

  /** 取得圖示區域元素 */
  getIconArea(): HTMLElement {
    return this._iconAreaEl;
  }

  /** 銷毀桌面，清除所有 DOM */
  destroy(): void {
    this.unsyncDockWithWindows();
    this._itemsViewOff?.();
    this._itemsViewOff = null;
    this._icons.forEach(icon => icon.destroy());
    this._icons.clear();
    this._itemsView = null;
    this._dock.destroy();
    this._desktopEl.remove();
    this.events.emit<DesktopItemsEvent>('desktop:destroyed', {
      source: 'desktop',
      reason: 'destroy',
      items: [],
    });
    this.events.clearAll();
  }
}
