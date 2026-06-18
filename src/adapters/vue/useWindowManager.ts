// ============================================================
// DeskPane — Vue 3 Adapter
// useWindowManager composable：將 WindowManager 橋接為 Vue 響應式狀態
// ============================================================

import { shallowRef, markRaw, onUnmounted } from 'vue';
import { WindowManager } from '../../core/WindowManager.js';
import type { WindowManagerOptions } from '../../core/WindowManager.js';
import type { WindowState } from '../../core/types.js';

/** 每個 Vue 視窗的執行時資料 */
export interface VueWindowEntry {
  id: string;
  /** 即時狀態快照（每次事件後更新） */
  state: WindowState;
  /** Vue 元件定義（已 markRaw） */
  component: any;
  /** 傳入元件的 props */
  props?: Record<string, unknown>;
  /** WM 視窗 body DOM 節點，供 <Teleport :to> 使用 */
  bodyEl: HTMLElement;
}

/** openVueWindow() 的設定參數 */
export interface VueWindowConfig {
  id: string;
  title: string;
  /** Vue 元件定義（SFC default export / defineComponent 回傳值） */
  component: any;
  props?: Record<string, unknown>;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

/**
 * Vue 3 Composable：封裝 WindowManager，提供響應式視窗清單與 Vue 元件開窗。
 *
 * @example
 * ```ts
 * const { windows, openVueWindow, close, minimize } = useWindowManager();
 * openVueWindow({ id: 'my-win', title: '我的視窗', component: MyComp });
 * ```
 */
export function useWindowManager(opts?: WindowManagerOptions) {
  // Composable 建立時即建立 WindowManager；若需要跟 ref container 綁定，
  // 請在呼叫前確保 container 已存在，或使用宣告式元件版本。
  const wm = new WindowManager(opts);

  /**
   * 響應式視窗清單，觸發 Vue 重新渲染。
   * shallowRef 避免 Vue 深層追蹤 WindowState/content/bodyEl，這些由 WindowManager 管理。
   */
  const windows = shallowRef<VueWindowEntry[]>([]);

  /** id → { component, props } 的映射表（不放入響應式以避免深層追蹤） */
  const _vueInfo = new Map<string, { component: any; props?: Record<string, unknown> }>();

  /** 從 WindowManager 同步最新狀態到 windows */
  function _sync() {
    // 每次同步都重新組陣列，讓 Vue v-for/Teleport 能更新。
    // bodyEl 必須來自 WindowManager，不能自己 create，否則內容會和視窗 DOM 分離。
    windows.value = wm.getWindowIds()
      .map(id => {
        const state = wm.getState(id);
        const bodyEl = wm.getBodyElement(id);
        if (!state || !bodyEl) return null;
        const info = _vueInfo.get(id);
        return {
          id,
          state: { ...state },           // 淺複製觸發響應
          component: info?.component ?? null,
          props: info?.props,
          bodyEl,
        } as VueWindowEntry;
      })
      .filter((w): w is VueWindowEntry => w !== null);
  }

  // 訂閱所有視窗事件，保持 windows 與 WM 狀態同步
  const SYNC_EVENTS = [
    'window:opened', 'window:closed', 'window:focused',
    'window:minimized', 'window:maximized', 'window:restored',
    'window:maximized-drag-restored',
    'window:edge-snapped',
  ] as const;
  SYNC_EVENTS.forEach(ev => wm.events.on(ev, _sync));

  /**
   * 開啟一個以 Vue 元件為內容的視窗。
   * 若 ID 已存在，則 restore + focus（不重複建立）。
   */
  function openVueWindow(config: VueWindowConfig): WindowState {
    // 儲存 Vue 元件資訊（使用 markRaw 避免 Vue 追蹤元件內部）
    _vueInfo.set(config.id, {
      component: markRaw(config.component),
      props: config.props,
    });
    // 以 slotType:'vue' 開窗，renderer 會留空 body 讓 Vue Teleport 填入。
    // 最小化/工作區切換只隱藏 DOM，不移除 bodyEl，因此 Vue 元件 state 會保留。
    return wm.open({
      id: config.id,
      title: config.title,
      slotType: 'vue',
      content: null,
      x: config.x,
      y: config.y,
      width: config.width,
      height: config.height,
    });
  }

  /** 元件卸載時自動銷毀所有視窗 */
  onUnmounted(() => wm.destroy());

  return {
    /** 底層 WindowManager 實例（進階使用） */
    wm,
    /** 響應式視窗清單，供 v-for 迭代 */
    windows,
    openVueWindow,
    close:    (id: string) => wm.close(id),
    minimize: (id: string) => wm.minimize(id),
    maximize: (id: string) => wm.maximize(id),
    restore:  (id: string) => wm.restore(id),
    focus:    (id: string) => wm.focus(id),
    setTitle: (id: string, title: string) => wm.setTitle(id, title),
    destroy:  () => wm.destroy(),
  };
}
