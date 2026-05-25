// ============================================================
// WebOS-Core — DOM Window Renderer
// 負責建立視窗外殼 DOM 節點、注入樣式
// ============================================================

import { WindowState } from '../core/types.js';

const STYLE_ID = 'wos-core-styles';

const BASE_CSS = `
.wos-window {
  position: fixed;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  border: 4px solid var(--wos-border, #d0d0d0);
  border-radius: 6px;
  box-shadow: var(--wos-shadow, 0 4px 24px rgba(0,0,0,0.18));
  background: var(--wos-window-bg, #d0d0d0);
  overflow: hidden;
  min-width: 200px;
  min-height: 120px;
  transition: box-shadow 0.15s, border-color 0.15s;
}
.wos-window.wos-active {
  border-color: var(--wos-border-active, #b0b8c8);
  box-shadow: var(--wos-shadow-active, 0 8px 36px rgba(0,0,0,0.28));
}
.wos-window.wos-minimized {
  display: none !important;
}
.wos-window.wos-maximized {
  left: 72px !important;
  top: 0 !important;
  width: calc(100vw - 72px) !important;
  height: calc(100vh - 48px) !important;
  border-radius: 0;
  border-width: 0;
}
/* ── Isolated container mode ──────────────────────────── */
.wos-isolated {
  position: relative;
  overflow: hidden;
}
.wos-isolated .wos-window {
  position: absolute;
}
.wos-isolated .wos-window.wos-maximized {
  left: 0 !important;
  top: 0 !important;
  width: 100% !important;
  height: 100% !important;
  border-radius: 0;
}
/* ─────────────────────────────────────────────────────── */
.wos-header {
  display: flex;
  align-items: center;
  padding: 0 8px;
  height: 36px;
  background: var(--wos-header-bg, #f5f5f5);
  border-bottom: 1px solid var(--wos-header-border, #e0e0e0);
  cursor: move;
  user-select: none;
  flex-shrink: 0;
}
.wos-title {
  flex: 1;
  font-size: 13px;
  font-weight: 600;
  color: var(--wos-title-color, #333333);
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.wos-btn {
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 4px;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: var(--wos-btn-color, #555555);
  margin-left: 2px;
  transition: background 0.1s;
}
.wos-btn:hover { background: var(--wos-btn-hover-bg, #e0e0e0); }
.wos-btn.wos-btn-close:hover { background: var(--wos-btn-close-hover-bg, #ff5f57); color: var(--wos-btn-close-hover-color, #ffffff); }
.wos-body {
  flex: 1;
  overflow: auto;
  position: relative;
  background: var(--wos-body-bg, #ffffff);
  color: var(--wos-body-color, #222222);
}
.wos-body.wos-has-layout {
  overflow: hidden;
}
/* ── Snap guide lines ─────────────────────────────── */
.wos-snap-guide {
  position: absolute;
  pointer-events: none;
  z-index: 2147483647;
  display: none;
  background: var(--wos-snap-guide-color, rgba(0, 120, 255, 0.55));
}
.wos-snap-guide--v {
  width: 1px;
  top: 0;
  bottom: 0;
}
.wos-snap-guide--h {
  height: 1px;
  left: 0;
  right: 0;
}
`;

export function injectStyles(): void {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = BASE_CSS;
  document.head.appendChild(style);
}

export interface WindowElements {
  root: HTMLElement;
  header: HTMLElement;
  title: HTMLElement;
  body: HTMLElement;
  btnMin: HTMLButtonElement;
  btnMax: HTMLButtonElement;
  btnClose: HTMLButtonElement;
}

/** 建立視窗外殼 DOM，回傳各主要元素參照 */
export function createWindowDOM(state: WindowState): WindowElements {
  const root = document.createElement('div');
  root.className = 'wos-window';
  root.dataset.wosId = state.id;
  applyGeometry(root, state);
  root.style.zIndex = String(state.zIndex);

  // ── Header ──
  const header = document.createElement('div');
  header.className = 'wos-header';

  const title = document.createElement('span');
  title.className = 'wos-title';
  title.textContent = state.title;

  const btnMin = createButton('－', 'wos-btn-min', '最小化');
  const btnMax = createButton('□', 'wos-btn-max', '最大化');
  const btnClose = createButton('✕', 'wos-btn-close', '關閉');

  header.append(title, btnMin, btnMax, btnClose);

  // ── Body ──
  const body = document.createElement('div');
  body.className = 'wos-body';

  root.append(header, body);

  // 注入視窗內容（DOM 型別）
  if (state.slotType === 'dom' && state.content instanceof HTMLElement) {
    body.appendChild(state.content);
  }

  return { root, header, title, body, btnMin, btnMax, btnClose };
}

function createButton(text: string, cls: string, ariaLabel: string): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.className = `wos-btn ${cls}`;
  btn.textContent = text;
  btn.setAttribute('aria-label', ariaLabel);
  return btn;
}

/** 將 WindowState 的幾何資訊套用到 DOM 元素 */
export function applyGeometry(el: HTMLElement, state: Partial<Pick<WindowState, 'x' | 'y' | 'width' | 'height'>>): void {
  if (state.x !== undefined) el.style.left = `${state.x}px`;
  if (state.y !== undefined) el.style.top = `${state.y}px`;
  if (state.width !== undefined) el.style.width = `${state.width}px`;
  if (state.height !== undefined) el.style.height = `${state.height}px`;
}
