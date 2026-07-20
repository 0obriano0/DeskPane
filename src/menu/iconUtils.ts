// ============================================================
// DeskPane-Menu - Icon rendering helpers
// ============================================================

/** Render the same URL / inline SVG / emoji icon forms used by Desktop. */
export function appendMenuIcon(container: HTMLElement, icon: string): void {
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
