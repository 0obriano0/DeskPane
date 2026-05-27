// ============================================================
// WebOS-Core — Panel Component
// 為任意元素加上可折疊的標題列（EasyUI panel 風格）
// 支援：
//   • data-panel 宣告式自動初始化
//   • JS-first: new Panel({ container, title, collapsible })
//   • 折疊 / 展開（動畫 height）
// ============================================================

import { injectLayoutStyles } from './styles.js';

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

export class Panel {
  private container: HTMLElement;
  private headerEl:  HTMLElement | null = null;
  private bodyEl:    HTMLElement;
  private toggleBtn: HTMLButtonElement | null = null;
  private _collapsed: boolean;
  private _collapsible: boolean;
  private cleanups: (() => void)[] = [];

  constructor(options: PanelOptions) {
    injectLayoutStyles();

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

