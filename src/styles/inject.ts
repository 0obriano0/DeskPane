// ============================================================
// DeskPane — Runtime CSS injection helpers
// ============================================================

export interface InjectStyleOptions {
  id: string;
  css: string;
  hrefPart: string;
  fingerprint: string;
}

function isDeskPaneStyleNode(node: Element): boolean {
  // DeskPane runtime style 都會加 data-dp-style；id fallback 是為了相容早期版本。
  if (node instanceof HTMLStyleElement) {
    if (node.dataset.dpStyle === 'true') return true;
    if (node.id.startsWith('dp-') && node.id.endsWith('-styles')) return true;
  }

  if (node instanceof HTMLLinkElement) {
    // 使用者可能手動 import/link DeskPane CSS。這些 link 也視為 DeskPane style，
    // 避免 runtime CSS 插在它們後面造成 override 順序反轉。
    const href = node.getAttribute('href') ?? '';
    return href.includes('/deskpane') || href.includes('\\deskpane') || href.includes('deskpane');
  }

  return false;
}

function hasManualStyleLoaded(options: InjectStyleOptions): boolean {
  const hrefPart = options.hrefPart.toLowerCase();

  for (const node of Array.from(document.querySelectorAll('style,link[rel~="stylesheet"]'))) {
    if (node instanceof HTMLStyleElement) {
      // id/fingerprint 任一命中都代表已載入同一份 core CSS。
      // fingerprint 讓 bundler raw CSS 或 SSR inline style 也能被偵測。
      if (node.id === options.id) return true;
      if (node.textContent?.includes(options.fingerprint)) return true;
      continue;
    }

    if (node instanceof HTMLLinkElement) {
      const href = (node.getAttribute('href') ?? '').toLowerCase();
      if (href.includes(hrefPart)) return true;
    }
  }

  return false;
}

function findInsertionAnchor(): Element | null {
  const styleNodes = Array.from(document.head.querySelectorAll('style,link[rel~="stylesheet"]'));
  // 插在第一個非 DeskPane style 前，讓 app stylesheet 保持較高優先順序。
  // 這是避免 runtime inject 壓過使用者 override 的關鍵。
  return styleNodes.find(node => !isDeskPaneStyleNode(node)) ?? null;
}

/**
 * Injects DeskPane runtime CSS only when the same stylesheet is not already
 * present. Runtime CSS is inserted before app-level stylesheets so project
 * overrides imported later remain authoritative.
 */
export function injectRuntimeCSS(options: InjectStyleOptions): void {
  if (hasManualStyleLoaded(options)) return;

  const style = document.createElement('style');
  style.id = options.id;
  style.dataset.dpStyle = 'true';
  style.textContent = options.css;

  const anchor = findInsertionAnchor();
  document.head.insertBefore(style, anchor);
}
