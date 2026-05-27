// ============================================================
// WebOS-Desktop — Icon utilities (shared between Dock & DesktopIcon)
// ============================================================

/**
 * 依 icon 字串類型，將對應子節點（img / svg innerHTML / emoji text）
 * 附加至目標容器元素。
 * 支援：http/https URL、絕對路徑 /...、data: URI、SVG 字串、emoji / 文字。
 */
export function appendIconContent(container: HTMLElement, icon: string): void {
  if (icon.startsWith('http') || icon.startsWith('/') || icon.startsWith('data:')) {
    const img = document.createElement('img');
    img.src = icon;
    img.alt = '';
    container.appendChild(img);
  } else if (icon.trim().startsWith('<svg')) {
    container.innerHTML = icon;
  } else {
    container.textContent = icon;
  }
}
