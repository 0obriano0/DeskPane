// ============================================================
// WebOS-Desktop — CSS 注入（僅注入一次）
// ============================================================

const STYLE_ID = 'wos-desktop-styles';

const DESKTOP_CSS = `
/* ── Desktop container ───────────────────────────────── */
.wos-desktop {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: var(--wos-desktop-bg, linear-gradient(135deg, #1a2a4a 0%, #0d1b2a 100%));
  user-select: none;
  font-family: var(--wos-font, system-ui, -apple-system, sans-serif);
}

/* ── Icon area ───────────────────────────────────────── */
.wos-desktop-icon-area {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  overflow: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(255,255,255,0.2) transparent;
}

/* ── Icon area snap guides ───────────────────────────── */
.wos-icon-snap-guide {
  position: absolute;
  pointer-events: none;
  z-index: 9999;
  display: none;
  background: var(--wos-snap-guide-color, rgba(0, 120, 255, 0.55));
}
.wos-icon-snap-guide.wos-snap-guide--v {
  width: 1px;
  top: 0;
  bottom: 0;
}
.wos-icon-snap-guide.wos-snap-guide--h {
  height: 1px;
  left: 0;
  right: 0;
}

/* ── Desktop icon ────────────────────────────────────── */
.wos-desktop-icon {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 80px;
  padding: 8px 4px 6px;
  cursor: pointer;
  border-radius: 8px;
  transition: background 0.12s;
}
.wos-desktop-icon:hover {
  background: var(--wos-desktop-icon-hover-bg, rgba(255,255,255,0.15));
}
.wos-desktop-icon.wos-icon-selected {
  background: rgba(74,158,255,0.35);
  outline: 1px solid rgba(74,158,255,0.6);
}
.wos-desktop-icon.wos-icon-dragging {
  opacity: 0.45;
  z-index: 9999;
}
.wos-desktop-icon-img {
  width: 48px;
  height: 48px;
  font-size: 38px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  overflow: hidden;
  pointer-events: none;
}
.wos-desktop-icon-img img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
.wos-desktop-icon-label {
  margin-top: 4px;
  font-size: 11px;
  color: var(--wos-desktop-icon-text, #fff);
  text-align: center;
  line-height: 1.3;
  max-width: 76px;
  word-break: break-word;
  text-shadow: 0 1px 3px rgba(0,0,0,0.7);
  pointer-events: none;
}

/* ── Dock ────────────────────────────────────────────── */
.wos-dock {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 4px;
  background: var(--wos-dock-bg, rgba(20,30,50,0.75));
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border: 1px solid var(--wos-dock-border, rgba(255,255,255,0.1));
  padding: 6px 10px;
  z-index: 9999;
  box-sizing: border-box;
  /* 隱藏 scrollbar 但保留捲動能力 */
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.wos-dock::-webkit-scrollbar { display: none; }
.wos-dock.wos-dock-bottom {
  bottom: 0; left: 0; right: 0;
  flex-direction: row;
  height: 68px;
  border-top: 1px solid var(--wos-dock-border, rgba(255,255,255,0.1));
  overflow-x: auto;
  overflow-y: hidden;
}
.wos-dock.wos-dock-top {
  top: 0; left: 0; right: 0;
  flex-direction: row;
  height: 68px;
  border-bottom: 1px solid var(--wos-dock-border, rgba(255,255,255,0.1));
  overflow-x: auto;
  overflow-y: hidden;
}
.wos-dock.wos-dock-left {
  top: 0; left: 0; bottom: 0;
  flex-direction: column;
  width: 68px;
  align-items: center;
  justify-content: flex-start;
  padding: 10px 6px;
  border-right: 1px solid var(--wos-dock-border, rgba(255,255,255,0.1));
  overflow-y: auto;
  overflow-x: hidden;
}
.wos-dock.wos-dock-right {
  top: 0; right: 0; bottom: 0;
  flex-direction: column;
  width: 68px;
  align-items: center;
  justify-content: flex-start;
  padding: 10px 6px;
  border-left: 1px solid var(--wos-dock-border, rgba(255,255,255,0.1));
  overflow-y: auto;
  overflow-x: hidden;
}

/* ── Dock item ───────────────────────────────────────── */
.wos-dock-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 10px;
  padding: 4px 6px;
  position: relative;
  transition: transform 0.15s, background 0.12s;
  flex-shrink: 0;
}
.wos-dock-item:hover {
  background: var(--wos-dock-item-hover-bg, rgba(255,255,255,0.12));
  transform: scale(1.15) translateY(-3px);
}
.wos-dock-item.wos-dock-dragging {
  opacity: 0.4;
}
.wos-dock-item.wos-dock-dragover {
  background: rgba(74,158,255,0.25);
  outline: 2px dashed rgba(74,158,255,0.7);
  transform: scale(1.1);
}
.wos-dock-item.wos-dock-active {
  background: rgba(74,158,255,0.2);
}
.wos-dock-item.wos-dock-active::after {
  content: '';
  position: absolute;
  bottom: -5px;
  left: 50%;
  transform: translateX(-50%);
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: rgba(74,158,255,0.9);
}
.wos-dock.wos-dock-top .wos-dock-item.wos-dock-active::after {
  bottom: unset;
  top: -5px;
}
.wos-dock.wos-dock-left .wos-dock-item.wos-dock-active::after {
  bottom: unset;
  top: 50%;
  left: -5px;
  transform: translateY(-50%);
}
.wos-dock.wos-dock-right .wos-dock-item.wos-dock-active::after {
  bottom: unset;
  top: 50%;
  left: unset;
  right: -5px;
  transform: translateY(-50%);
}
.wos-dock-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  overflow: hidden;
  pointer-events: none;
}
.wos-dock-icon img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
.wos-dock-label {
  font-size: 10px;
  color: var(--wos-desktop-icon-text, rgba(255,255,255,0.85));
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 60px;
  pointer-events: none;
}
.wos-dock-tooltip {
  position: absolute;
  bottom: calc(100% + 6px);
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0,0,0,0.8);
  color: #fff;
  font-size: 11px;
  padding: 3px 8px;
  border-radius: 4px;
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.15s;
}
.wos-dock-item:hover .wos-dock-tooltip {
  opacity: 1;
}
.wos-dock.wos-dock-left .wos-dock-tooltip,
.wos-dock.wos-dock-right .wos-dock-tooltip {
  bottom: unset;
  top: 50%;
  transform: translateY(-50%);
}
.wos-dock.wos-dock-left .wos-dock-tooltip {
  left: calc(100% + 6px);
}
.wos-dock.wos-dock-right .wos-dock-tooltip {
  left: unset;
  right: calc(100% + 6px);
}
`;

export function injectDesktopStyles(): void {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = DESKTOP_CSS;
  document.head.appendChild(style);
}
