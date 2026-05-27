// ============================================================
// WebOS-Core — Layout CSS Injection
// ============================================================

import LAYOUT_CSS from '../styles/webos-layout.css';

const STYLE_ID = 'wos-layout-styles';

/** 回傳 Layout CSS 字串，供 injectStyles:false 的使用者自行管理樣式注入 */
export function getLayoutCSS(): string {
  return LAYOUT_CSS;
}

export function injectLayoutStyles(): void {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = LAYOUT_CSS;
  document.head.appendChild(style);
}
