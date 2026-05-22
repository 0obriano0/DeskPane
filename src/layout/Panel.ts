// ============================================================
// WebOS-Core — Panel Component
// 為任意元素加上可折疊的標題列（EasyUI panel 風格）
// 支援：
//   • data-panel 宣告式自動初始化
//   • JS-first: new Panel({ container, title, collapsible })
//   • 折疊 / 展開（動畫 height）
// ============================================================

const PANEL_STYLE_ID = 'wos-panel-styles';

const PANEL_CSS = `
.wos-panel {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-sizing: border-box;
  width: 100%;
  height: 100%;
}
.wos-panel-header {
  display: flex;
  align-items: center;
  height: 30px;
  min-height: 30px;
  padding: 0 8px;
  background: var(--wos-header-bg, #f5f5f5);
  border-bottom: 1px solid var(--wos-header-border, #e0e0e0);
  user-select: none;
  flex-shrink: 0;
  cursor: default;
}
.wos-panel-title {
  flex: 1;
  font-size: 12px;
  font-weight: 600;
  color: var(--wos-title-color, #333);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.wos-panel-toggle {
  width: 20px;
  height: 20px;
  border-radius: 3px;
  background: transparent;
  border: 1px solid transparent;
  cursor: pointer;
  font-size: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--wos-btn-color, #555);
  flex-shrink: 0;
  transition: background 0.1s;
  line-height: 1;
}
.wos-panel-toggle:hover {
  background: var(--wos-btn-hover-bg, #e0e0e0);
  border-color: var(--wos-border, #d0d0d0);
}
.wos-panel-body {
  flex: 1;
  overflow: auto;
  box-sizing: border-box;
  transition: max-height 0.2s ease;
}
.wos-panel-body.wos-panel-collapsed {
  max-height: 0 !important;
  overflow: hidden;
}
`;

export interface PanelOptions {
  /** Container element or CSS selector */
  container: HTMLElement | string;
  /** Title text shown in the header bar */
  title?: string;
  /** Show collapse/expand toggle button (default: false) */
  collapsible?: boolean;
  /** Initially collapsed (default: false) */
  collapsed?: boolean;
}

function injectPanelStyles(): void {
  if (document.getElementById(PANEL_STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = PANEL_STYLE_ID;
  style.textContent = PANEL_CSS;
  document.head.appendChild(style);
}

export class Panel {
  private container: HTMLElement;
  private headerEl:  HTMLElement | null = null;
  private bodyEl:    HTMLElement;
  private toggleBtn: HTMLButtonElement | null = null;
  private _collapsed: boolean;
  private _collapsible: boolean;
  private cleanups: (() => void)[] = [];

  constructor(options: PanelOptions) {
    injectPanelStyles();

    this.container = typeof options.container === 'string'
      ? (() => {
          const el = document.querySelector<HTMLElement>(options.container);
          if (!el) throw new Error(`[Panel] Container not found: ${options.container}`);
          return el;
        })()
      : options.container;

    this._collapsed   = options.collapsed   ?? false;
    this._collapsible = options.collapsible ?? false;

    // Collect existing children to move into body
    const children = Array.from(this.container.childNodes);

    // Clear container
    this.container.innerHTML = '';
    this.container.classList.add('wos-panel');

    // Header (always shown when title provided; or when collapsible)
    const hasHeader = !!options.title || this._collapsible;
    if (hasHeader) {
      const hdr = document.createElement('div');
      hdr.className = 'wos-panel-header';

      const ttl = document.createElement('span');
      ttl.className = 'wos-panel-title';
      ttl.textContent = options.title ?? '';
      hdr.appendChild(ttl);

      if (this._collapsible) {
        const btn = document.createElement('button');
        btn.className = 'wos-panel-toggle';
        btn.setAttribute('aria-label', '切換面板');
        btn.textContent = this._collapsed ? '▶' : '▼';
        hdr.appendChild(btn);
        this.toggleBtn = btn;

        const onToggle = () => this.toggle();
        btn.addEventListener('click', onToggle);
        // Also allow clicking title to toggle
        hdr.style.cursor = 'pointer';
        hdr.addEventListener('click', (e) => {
          if ((e.target as HTMLElement).closest('.wos-panel-toggle')) return;
          this.toggle();
        });
        this.cleanups.push(() => btn.removeEventListener('click', onToggle));
      }

      this.container.appendChild(hdr);
      this.headerEl = hdr;
    }

    // Body
    const body = document.createElement('div');
    body.className = 'wos-panel-body';

    // Restore original children
    children.forEach(c => body.appendChild(c));

    if (this._collapsed) {
      body.classList.add('wos-panel-collapsed');
    }

    this.container.appendChild(body);
    this.bodyEl = body;
  }

  // ── Public API ─────────────────────────────────────────────
  get collapsed(): boolean { return this._collapsed; }

  toggle(): void {
    this._collapsed = !this._collapsed;
    this.bodyEl.classList.toggle('wos-panel-collapsed', this._collapsed);
    if (this.toggleBtn) {
      this.toggleBtn.textContent = this._collapsed ? '▶' : '▼';
    }
  }

  expand(): void {
    if (this._collapsed) this.toggle();
  }

  collapse(): void {
    if (!this._collapsed) this.toggle();
  }

  setTitle(title: string): void {
    const ttl = this.headerEl?.querySelector<HTMLElement>('.wos-panel-title');
    if (ttl) ttl.textContent = title;
  }

  /** 取得內容區元素 */
  getBodyEl(): HTMLElement {
    return this.bodyEl;
  }

  destroy(): void {
    this.cleanups.forEach(fn => fn());
    this.cleanups = [];
    this.container.classList.remove('wos-panel');
  }
}
