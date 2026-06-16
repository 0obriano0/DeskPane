// ============================================================
// DeskPane — Border Layout Manager
// EasyUI 風格東南西北+中間佈局，支援：
//   • HTML data-region 宣告式初始化
//   • 任意層巢狀（region 內再放 data-region）
//   • Splitter 拖曳 resize
//   • 可折疊面板（折疊按鈕在 header 右端，EasyUI 風格）
//   • Region 標題列（data-title）+ 圖示（data-icon）
//   • ResizeObserver 自動重排
// ============================================================

import { injectLayoutStyles } from './styles.js';

export type LayoutRegion = 'north' | 'south' | 'east' | 'west' | 'center';
type SplitterKey = Exclude<LayoutRegion, 'center'>;

export interface RegionConfig {
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

export interface BorderLayoutOptions {
  /** Container element or CSS selector */
  container: HTMLElement | string;
  /** Splitter thickness in px (default: 5) */
  splitterSize?: number;
  /** Region header height in px (default: 28) */
  headerSize?: number;
  north?:  RegionConfig;
  south?:  RegionConfig;
  east?:   RegionConfig;
  west?:   RegionConfig;
  center?: RegionConfig;
}

interface RegionState {
  el:          HTMLElement;
  bodyEl:      HTMLElement;  // the scrollable inner body
  headerEl:    HTMLElement | null;  // header bar element (if title set)
  size:        number;
  minSize:     number;
  collapsible: boolean;
  collapsed:   boolean;
  savedSize:   number;
  hasHeader:   boolean;
}

const REGION_DEFAULTS: Record<LayoutRegion, { size: number; minSize: number }> = {
  north:  { size: 48,  minSize: 24 },
  south:  { size: 120, minSize: 24 },
  east:   { size: 200, minSize: 60 },
  west:   { size: 200, minSize: 60 },
  center: { size: 0,   minSize: 40 },
};

export class BorderLayout {
  private container:    HTMLElement;
  private splitterSize: number;
  private headerSize:   number;
  private regions:      Map<LayoutRegion, RegionState> = new Map();
  private splitterEls:  Map<SplitterKey, HTMLElement>  = new Map();
  private _childLayouts: BorderLayout[] = [];
  private resizeObserver: ResizeObserver | null = null;
  private cleanups: (() => void)[] = [];

  constructor(options: BorderLayoutOptions) {
    injectLayoutStyles();

    // Resolve container
    this.container = typeof options.container === 'string'
      ? (() => {
          const el = document.querySelector<HTMLElement>(options.container);
          if (!el) throw new Error(`[BorderLayout] Container not found: ${options.container}`);
          return el;
        })()
      : options.container;

    this.splitterSize = options.splitterSize ?? 5;
    this.headerSize   = options.headerSize   ?? 28;

    // Parse HTML data-region children
    const htmlMap = this._parseHTMLRegions();

    // Build merged region states
    const ALL_REGIONS: LayoutRegion[] = ['north', 'south', 'east', 'west', 'center'];
    for (const name of ALL_REGIONS) {
      const opt  = options[name];
      const html = htmlMap[name];
      if (!opt && !html) continue;

      const merged: RegionConfig = { ...html?.cfg, ...opt };
      const def = REGION_DEFAULTS[name];
      const size = merged.size ?? def.size;

      // Create outer region el
      const el = document.createElement('div');
      el.className = `dp-layout-region dp-layout-region--${name}`;
      el.dataset.dpRegion = name;

      // Optional region header
      const hasHeader = !!merged.title;
      let headerEl: HTMLElement | null = null;
      if (hasHeader) {
        headerEl = document.createElement('div');
        headerEl.className = 'dp-region-header';

        // Optional icon
        if (merged.icon) {
          const iconSpan = document.createElement('span');
          iconSpan.className = 'dp-region-icon';
          iconSpan.textContent = merged.icon;
          headerEl.appendChild(iconSpan);
        }

        // Title
        const ttl = document.createElement('span');
        ttl.className = 'dp-region-title';
        ttl.textContent = merged.title!;
        headerEl.appendChild(ttl);

        // Collapse button (right end of header)
        if (merged.collapsible) {
          const btn = document.createElement('button');
          btn.className = 'dp-region-collapse-btn';
          btn.dataset.dpCollapseFor = name;
          btn.setAttribute('aria-label', `切換 ${name} 面板`);
          btn.textContent = this._collapseIcon(name as LayoutRegion, merged.collapsed ?? false);
          headerEl.appendChild(btn);
        }

        el.appendChild(headerEl);
      }

      // Body (scrollable inner)
      const bodyEl = document.createElement('div');
      bodyEl.className = 'dp-region-body';

      // Move content in
      if (html?.contentEl) {
        while (html.contentEl.firstChild) bodyEl.appendChild(html.contentEl.firstChild);
      } else if (merged.content) {
        bodyEl.appendChild(merged.content);
      }

      el.appendChild(bodyEl);

      this.regions.set(name, {
        el, bodyEl, headerEl, size,
        minSize:     merged.minSize     ?? def.minSize,
        collapsible: merged.collapsible ?? false,
        collapsed:   merged.collapsed   ?? false,
        savedSize:   size,
        hasHeader,
      });

      // Apply initial collapsed class
      if (merged.collapsed) el.classList.add('dp-layout-region--collapsed');
    }

    this._buildDOM();
    this._applyLayout();
    this._attachEvents();
    this._initChildLayouts();
  }

  // ── Parse HTML [data-region] direct children ───────────────
  private _parseHTMLRegions(): Partial<Record<LayoutRegion, { cfg: RegionConfig; contentEl: HTMLElement }>> {
    const result: Partial<Record<LayoutRegion, { cfg: RegionConfig; contentEl: HTMLElement }>> = {};
    const children = Array.from(this.container.children) as HTMLElement[];
    for (const child of children) {
      const name = child.dataset.region as LayoutRegion | undefined;
      if (!name || !REGION_DEFAULTS[name]) continue;
      const cfg: RegionConfig = {};
      if (child.dataset.size)    cfg.size        = +child.dataset.size;
      if (child.dataset.minSize) cfg.minSize      = +child.dataset.minSize;
      if ('collapsible' in child.dataset) cfg.collapsible = true;
      if ('collapsed'   in child.dataset) cfg.collapsed   = true;
      if (child.dataset.title)   cfg.title        = child.dataset.title;
      if (child.dataset.icon)    cfg.icon         = child.dataset.icon;
      result[name] = { cfg, contentEl: child };
    }
    return result;
  }

  // ── Build DOM ──────────────────────────────────────────────
  private _buildDOM(): void {
    this.container.innerHTML = '';
    this.container.classList.add('dp-layout');

    // Append region elements
    for (const state of this.regions.values()) {
      this.container.appendChild(state.el);
    }

    // Create splitters between defined non-center regions
    const splitterRegions: SplitterKey[] = ['north', 'south', 'east', 'west'];
    for (const name of splitterRegions) {
      if (!this.regions.has(name)) continue;
      const isV = name === 'east' || name === 'west';
      const sp = document.createElement('div');
      sp.className = `dp-layout-splitter dp-layout-splitter--${isV ? 'v' : 'h'}`;
      sp.dataset.dpSplitter = name;

      this.splitterEls.set(name, sp);
      this.container.appendChild(sp);
    }
  }

  // ── Compute & apply all positions ─────────────────────────
  private _applyLayout(): void {
    const W   = this.container.clientWidth;
    const H   = this.container.clientHeight;
    const sp  = this.splitterSize;
    const hdr = this.headerSize;

    const north  = this.regions.get('north');
    const south  = this.regions.get('south');
    const east   = this.regions.get('east');
    const west   = this.regions.get('west');
    const center = this.regions.get('center');

    const nH = north  ? (north.collapsed  ? this.headerSize : north.size)  : 0;
    const sH = south  ? (south.collapsed  ? this.headerSize : south.size)  : 0;
    const eW = east   ? (east.collapsed   ? this.headerSize : east.size)   : 0;
    const wW = west   ? (west.collapsed   ? this.headerSize : west.size)   : 0;

    const nSp = north ? sp : 0;
    const sSp = south ? sp : 0;
    const eSp = east  ? sp : 0;
    const wSp = west  ? sp : 0;

    // ── North
    if (north) {
      this._setRegionRect(north, 0, 0, W, nH);
      const spEl = this.splitterEls.get('north')!;
      this._applyRect(spEl, { top: nH, left: 0, width: W, height: sp });
    }

    // ── South
    if (south) {
      this._setRegionRect(south, 0, H - sH, W, sH);
      const spEl = this.splitterEls.get('south')!;
      this._applyRect(spEl, { top: H - sH - sp, left: 0, width: W, height: sp });
    }

    // Vertical band
    const bandTop = nH + nSp;
    const bandH   = H - nH - nSp - sH - sSp;

    // ── West
    if (west) {
      this._setRegionRect(west, 0, bandTop, wW, bandH);
      const spEl = this.splitterEls.get('west')!;
      this._applyRect(spEl, { top: bandTop, left: wW, width: sp, height: bandH });
    }

    // ── East
    if (east) {
      this._setRegionRect(east, W - eW, bandTop, eW, bandH);
      const spEl = this.splitterEls.get('east')!;
      this._applyRect(spEl, { top: bandTop, left: W - eW - sp, width: sp, height: bandH });
    }

    // ── Center
    if (center) {
      const cLeft = wW + wSp;
      const cW    = W - cLeft - eW - eSp;
      this._setRegionRect(center, cLeft, bandTop, cW, bandH);
    }
  }

  /** Set region outer el + inner body positions */
  private _setRegionRect(state: RegionState, x: number, y: number, w: number, h: number): void {
    const el = state.el;
    el.style.left   = `${x}px`;
    el.style.top    = `${y}px`;
    el.style.width  = `${Math.max(0, w)}px`;
    el.style.height = `${Math.max(0, h)}px`;

    // body offset: leave room for header if present
    const bodyTop = state.hasHeader ? this.headerSize : 0;
    state.bodyEl.style.top    = `${bodyTop}px`;
    state.bodyEl.style.height = `${Math.max(0, h - bodyTop)}px`;
  }

  private _applyRect(el: HTMLElement, r: { top: number; left: number; width: number; height: number }): void {
    el.style.top    = `${r.top}px`;
    el.style.left   = `${r.left}px`;
    el.style.width  = `${Math.max(0, r.width)}px`;
    el.style.height = `${Math.max(0, r.height)}px`;
  }

  // ── Recursive child layout detection ──────────────────────
  private _initChildLayouts(): void {
    for (const state of this.regions.values()) {
      const hasNested = Array.from(state.bodyEl.children).some(
        c => (c as HTMLElement).dataset.region !== undefined
      );
      if (hasNested) {
        const child = new BorderLayout({
          container:    state.bodyEl,
          splitterSize: this.splitterSize,
          headerSize:   this.headerSize,
        });
        this._childLayouts.push(child);
      }
    }
  }

  // ── Event Listeners ───────────────────────────────────────
  private _attachEvents(): void {
    // Splitter drag
    for (const [name, spEl] of this.splitterEls) {
      const onDown = (e: MouseEvent) => {
        if ((e.target as HTMLElement).closest('.dp-region-collapse-btn')) return;
        this._startDrag(e, name);
      };
      spEl.addEventListener('mousedown', onDown);
      this.cleanups.push(() => spEl.removeEventListener('mousedown', onDown));
    }

    // Collapse buttons — delegated on container (button lives in region header)
    const onCollapseClick = (e: MouseEvent) => {
      const btn = (e.target as HTMLElement).closest('[data-dp-collapse-for]') as HTMLElement | null;
      if (!btn) return;
      this.toggleCollapse(btn.dataset.dpCollapseFor as SplitterKey);
    };
    this.container.addEventListener('click', onCollapseClick);
    this.cleanups.push(() => this.container.removeEventListener('click', onCollapseClick));

    // ResizeObserver
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => this._applyLayout());
      this.resizeObserver.observe(this.container);
    }
  }

  private _startDrag(e: MouseEvent, name: SplitterKey): void {
    e.preventDefault();
    const state = this.regions.get(name)!;
    if (state.collapsed) return;
    const spEl      = this.splitterEls.get(name)!;
    const isV       = name === 'east' || name === 'west';
    const startPos  = isV ? e.clientX : e.clientY;
    const startSize = state.size;
    const totalSize = isV ? this.container.clientWidth : this.container.clientHeight;

    spEl.classList.add('dp-splitter-dragging');

    const onMove = (ev: MouseEvent) => {
      const delta = isV ? (ev.clientX - startPos) : (ev.clientY - startPos);
      let newSize = (name === 'east' || name === 'south')
        ? startSize - delta
        : startSize + delta;

      newSize = Math.max(state.minSize, Math.min(totalSize * 0.85, newSize));
      state.size      = newSize;
      state.savedSize = newSize;
      this._applyLayout();
    };

    const onUp = () => {
      spEl.classList.remove('dp-splitter-dragging');
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }

  // ── Collapse / Expand ──────────────────────────────────────
  toggleCollapse(name: SplitterKey): void {
    const state = this.regions.get(name);
    if (!state?.collapsible) return;

    state.collapsed = !state.collapsed;
    state.el.classList.toggle('dp-layout-region--collapsed', state.collapsed);

    if (!state.collapsed && state.size < state.minSize) {
      state.size = state.savedSize > 0 ? state.savedSize : REGION_DEFAULTS[name].size;
    }

    // Update button icon — button lives in headerEl
    const btn = state.headerEl?.querySelector<HTMLElement>('[data-dp-collapse-for]');
    if (btn) btn.textContent = this._collapseIcon(name, state.collapsed);

    this._applyLayout();
  }

  private _collapseIcon(name: LayoutRegion, collapsed: boolean): string {
    if (name === 'west')  return collapsed ? '»' : '«';
    if (name === 'east')  return collapsed ? '«' : '»';
    if (name === 'north') return collapsed ? '⋁' : '⋀';
    if (name === 'south') return collapsed ? '⋀' : '⋁';
    return '';
  }

  // ── Public API ─────────────────────────────────────────────
  /** 取得指定 region 的 body 元素（內容區） */
  getRegionEl(name: LayoutRegion): HTMLElement | undefined {
    return this.regions.get(name)?.bodyEl;
  }

  /** 手動觸發重新計算（容器尺寸已改變時使用） */
  resize(): void {
    this._applyLayout();
  }

  /** 銷毀：移除事件、observer；child layouts 遞迴 destroy */
  destroy(): void {
    this._childLayouts.forEach(c => c.destroy());
    this._childLayouts = [];
    this.cleanups.forEach(fn => fn());
    this.cleanups = [];
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.container.classList.remove('dp-layout');
  }
}
