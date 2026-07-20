// ============================================================
// DeskPane-Menu - CSS injection
// ============================================================

import MENU_CSS from '../styles/deskpane-menu.css';
import { injectRuntimeCSS } from '../styles/inject.js';

const STYLE_ID = 'dp-menu-styles';

/** Return Menu CSS for applications that manage styles manually. */
export function getMenuCSS(): string {
  return MENU_CSS;
}

export function injectMenuStyles(): void {
  injectRuntimeCSS({
    id: STYLE_ID,
    css: MENU_CSS,
    hrefPart: 'deskpane-menu.css',
    fingerprint: 'DeskPane-Menu - Default Styles',
  });
}
