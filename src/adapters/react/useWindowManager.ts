// ============================================================
// DeskPane — React Adapter
// useWindowManager hook：將 WindowManager 橋接為 React 狀態
// ============================================================

import { useState, useCallback, useEffect, useRef } from 'react';
import type { ComponentType } from 'react';
import { WindowManager } from '../../core/WindowManager.js';
import type { WindowManagerOptions } from '../../core/WindowManager.js';
import type { WindowState } from '../../core/types.js';

/** 每個 React 視窗的執行時資料 */
export interface ReactWindowEntry {
  id: string;
  /** 即時狀態快照（每次事件後更新） */
  state: WindowState;
  /** React 元件定義 */
  component: ComponentType<any> | null;
  /** 傳入元件的 props */
  props?: Record<string, unknown>;
  /** WM 視窗 body DOM 節點，供 createPortal 使用 */
  bodyEl: HTMLElement;
}

/** openReactWindow() 的設定參數 */
export interface ReactWindowConfig {
  id: string;
  title: string;
  /** React 元件定義 */
  component: ComponentType<any>;
  props?: Record<string, unknown>;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

const SYNC_EVENTS = [
  'window:opened',
  'window:closed',
  'window:focused',
  'window:minimized',
  'window:maximized',
  'window:restored',
  'window:maximized-drag-restored',
] as const;

/**
 * React Hook：封裝 WindowManager，提供響應式視窗清單與 React 元件開窗。
 *
 * 使用 createPortal 將 React 元件渲染進 WM 管理的 DOM body 節點。
 * 因為視窗 body 元素在最小化時以 CSS 隱藏而非移除，React 元件狀態
 * 自動保留——無需 KeepAlive 等額外機制。
 *
 * @example
 * ```tsx
 * import { createPortal } from 'react-dom';
 * const { windows, openReactWindow } = useWindowManager();
 *
 * openReactWindow({ id: 'my-win', title: '我的視窗', component: MyComp });
 *
 * // In JSX:
 * {windows.map(win =>
 *   win.component
 *     ? createPortal(<win.component {...(win.props ?? {})} />, win.bodyEl)
 *     : null
 * )}
 * ```
 */
export function useWindowManager(opts?: WindowManagerOptions) {
  // 使用 ref 儲存 WM 實例，確保跨 render 穩定。
  // 不要在 render 中直接 new WindowManager，否則每次 render 都會重建 DOM 與事件。
  const wmRef = useRef<WindowManager | null>(null);
  if (!wmRef.current) wmRef.current = new WindowManager(opts);
  const wm = wmRef.current;

  // id → { component, props } 映射（不放入 state 以避免不必要的重渲染）
  const infoRef = useRef(
    new Map<string, { component: ComponentType<any>; props?: Record<string, unknown> }>()
  );

  const [windows, setWindows] = useState<ReactWindowEntry[]>([]);

  /** 從 WindowManager 同步最新狀態到 windows state */
  const sync = useCallback(() => {
    // bodyEl 是 createPortal 的目標。它由 WindowManager 建立與銷毀；
    // React 只負責把 component render 進去，不直接管理視窗外框 DOM。
    setWindows(
      wm.getWindowIds()
        .map(id => {
          const state = wm.getState(id);
          const bodyEl = wm.getBodyElement(id);
          if (!state || !bodyEl) return null;
          const info = infoRef.current.get(id);
          return {
            id,
            state: { ...state },
            component: info?.component ?? null,
            props: info?.props,
            bodyEl,
          } as ReactWindowEntry;
        })
        .filter((w): w is ReactWindowEntry => w !== null)
    );
  }, [wm]);

  useEffect(() => {
    // 訂閱一次即可；wmRef 保證 wm 穩定。cleanup 時 destroy WM，連同視窗 DOM 一起清掉。
    SYNC_EVENTS.forEach(ev => wm.events.on(ev, sync));
    return () => { wm.destroy(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * 開啟一個以 React 元件為內容的視窗。
   * 若 ID 已存在，則 restore + focus（不重複建立）。
   */
  const openReactWindow = useCallback((config: ReactWindowConfig): WindowState => {
    infoRef.current.set(config.id, {
      component: config.component,
      props: config.props,
    });
    return wm.open({
      id: config.id,
      title: config.title,
      slotType: 'react',
      // content 留 null：DOMRenderer 只建立空 body，React 後續用 createPortal 填入。
      content: null,
      x: config.x,
      y: config.y,
      width: config.width,
      height: config.height,
    });
  }, [wm]);

  return {
    /** 底層 WindowManager 實例（進階使用） */
    wm,
    /** 響應式視窗清單，供 createPortal 迭代 */
    windows,
    openReactWindow,
    close:    useCallback((id: string) => wm.close(id), [wm]),
    minimize: useCallback((id: string) => wm.minimize(id), [wm]),
    maximize: useCallback((id: string) => wm.maximize(id), [wm]),
    restore:  useCallback((id: string) => wm.restore(id), [wm]),
    focus:    useCallback((id: string) => wm.focus(id), [wm]),
    setTitle: useCallback((id: string, title: string) => wm.setTitle(id, title), [wm]),
    destroy:  useCallback(() => wm.destroy(), [wm]),
  };
}
