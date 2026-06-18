import type { WindowConfig, WindowState } from '../../core/types.js';
import type { WindowManager, WindowManagerOptions } from '../../core/WindowManager.js';
import type { DesktopConfig, DesktopIconConfig, DockSyncOptions } from '../../desktop/types.js';
import type { Desktop } from '../../desktop/Desktop.js';

export interface JQueryLike {
  length: number;
  [index: number]: HTMLElement;
  each(callback: (this: HTMLElement, index: number, element: HTMLElement) => void): JQueryLike;
  data(key: string): unknown;
  data(key: string, value: unknown): JQueryLike;
  removeData(key: string): JQueryLike;
}

export interface JQueryStaticLike {
  (element: HTMLElement): JQueryLike;
  fn: Record<string, unknown>;
}

export interface DpWindowManagerApi {
  manager: WindowManager;
  open(config: JQueryWindowConfig): WindowState;
  close(id: string): void;
  minimize(id: string): void;
  maximize(id: string): void;
  restore(id: string): void;
  focus(id: string): void;
  destroy(): void;
  getBodyElement(id: string): HTMLElement | undefined;
  getState(id: string): Readonly<WindowState> | undefined;
}

export type DpWindowManagerMethod =
  | 'instance'
  | 'open'
  | 'close'
  | 'minimize'
  | 'maximize'
  | 'restore'
  | 'focus'
  | 'destroy'
  | 'getBodyElement'
  | 'getState';

export type DpWindowManagerOptions = WindowManagerOptions;

export interface JQueryWindowConfig extends Omit<WindowConfig, 'content'> {
  content?: HTMLElement | JQueryLike | string | null;
}

export interface DpWindowOptions extends Omit<JQueryWindowConfig, 'content'> {
  manager: WindowManager | DpWindowManagerApi | JQueryLike | string | HTMLElement;
  content?: HTMLElement | JQueryLike | string | null;
  clone?: boolean;
}

export interface DpDesktopApi {
  desktop: Desktop;
  windowManager?: WindowManager;
  dockSyncCleanup?: (() => void) | null;
  getWindowManager(options?: WindowManagerOptions): WindowManager;
  syncDockWithWindows(manager?: WindowManager, options?: DockSyncOptions): () => void;
  addIcon(config: DesktopIconConfig): void;
  removeIcon(id: string): void;
  destroy(): void;
}

export interface DpDesktopOptions extends DesktopConfig {
  windowManager?: false | WindowManagerOptions;
  syncDock?: boolean | DockSyncOptions;
}

export type DpDesktopMethod =
  | 'instance'
  | 'windowManager'
  | 'addIcon'
  | 'removeIcon'
  | 'syncDockWithWindows'
  | 'destroy';

export interface DeskPaneJQueryPlugin {
  install($: JQueryStaticLike): void;
}

declare global {
  interface JQuery {
    dpWindowManager(options?: DpWindowManagerOptions): JQuery;
    dpWindowManager(method: 'instance'): DpWindowManagerApi;
    dpWindowManager(method: 'open', config: JQueryWindowConfig): WindowState;
    dpWindowManager(method: 'getBodyElement', id: string): HTMLElement | undefined;
    dpWindowManager(method: 'getState', id: string): Readonly<WindowState> | undefined;
    dpWindowManager(method: Exclude<DpWindowManagerMethod, 'instance' | 'open' | 'getBodyElement' | 'getState'>, id?: string): void;

    dpWindow(options: DpWindowOptions): WindowState | WindowState[];

    dpDesktop(options?: DpDesktopOptions): JQuery;
    dpDesktop(method: 'instance'): DpDesktopApi;
    dpDesktop(method: 'windowManager', options?: WindowManagerOptions): WindowManager;
    dpDesktop(method: 'addIcon', config: DesktopIconConfig): void;
    dpDesktop(method: 'removeIcon', id: string): void;
    dpDesktop(method: 'syncDockWithWindows', options?: DockSyncOptions): () => void;
    dpDesktop(method: 'destroy'): void;
  }
}
