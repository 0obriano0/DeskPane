// ============================================================
// DeskPane — Theme Switcher
// 動態切換主題 CSS 的工具函式
// ============================================================

/**
 * DeskPane theme name or a direct CSS path/URL.
 *
 * `light` and `dark` are the general-purpose bundled themes.
 * `medieval-pixel` remains available for backward compatibility.
 * Custom theme names are resolved relative to `basePath`.
 */
export type DeskPaneThemeName =
  | 'light'
  | 'dark'
  | 'medieval-pixel'
  | (string & Record<never, never>);

/** @deprecated Use `DeskPaneThemeName` instead. */
export type WosThemePreset = DeskPaneThemeName;

export interface SetThemeOptions {
  /**
   * 主題 CSS 檔案所在目錄路徑（不含結尾 `/`）。
   * 預設為 `'themes'`，對應 `dist/themes/` 相對位置。
   * 直接傳入 CSS 路徑或 URL 時不使用此選項。
   */
  basePath?: string;
  /**
   * 用來識別主題 `<link>` 元素的 id。
   * 預設為 `'dp-theme'`。
   */
  linkId?: string;
}

/**
 * 動態切換 DeskPane 主題。
 *
 * 第一次呼叫時，若頁面中不存在指定 id 的 `<link>` 元素，
 * 會自動建立一個並插入 `<head>`。
 *
 * A `.css` path or URL is used directly. Other values resolve as
 * `${basePath}/${theme}.css`.
 *
 * @param theme   Bundled theme name, custom theme name, or direct CSS path/URL.
 * @param options 選填設定（basePath / linkId）
 *
 * @example
 * // ESM
 * import { setTheme } from 'deskpane';
 * setTheme('dark');
 *
 * // UMD
 * DeskPane.setTheme('dark');
 *
 * // 自訂路徑（例如主題放在 /assets/themes/）
 * setTheme('dark', { basePath: '/assets/themes' });
 *
 * // Direct app or demo theme path
 * setTheme('/demo/win7/win7-theme.css');
 */
export function setTheme(theme: DeskPaneThemeName, options: SetThemeOptions = {}): void {
  const { basePath = 'themes', linkId = 'dp-theme' } = options;
  const directPath = /^(?:[a-z][a-z\d+.-]*:|\/|\.{1,2}\/)/i.test(theme)
    || /\.css(?:[?#].*)?$/i.test(theme);
  const href = directPath ? theme : `${basePath}/${theme}.css`;

  let link = document.getElementById(linkId) as HTMLLinkElement | null;

  if (!link) {
    link = document.createElement('link');
    link.id = linkId;
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }

  if (link.getAttribute('href') !== href) {
    link.href = href;
  }
}
