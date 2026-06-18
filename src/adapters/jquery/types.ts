import type { WindowConfig, WindowState } from '../../core/types.js';
import type { WindowManager, WindowManagerOptions } from '../../core/WindowManager.js';
import type { DesktopConfig, DesktopIconConfig, DockSyncOptions } from '../../desktop/types.js';
import type { Desktop } from '../../desktop/Desktop.js';
import type { WorkspaceManager } from '../../workspace/WorkspaceManager.js';
import type { TaskView } from '../../workspace/TaskView.js';
import type {
  TaskViewOptions,
  WorkspaceConfig,
  WorkspaceManagerOptions,
  WorkspaceOpenWindowConfig,
  WorkspaceState,
} from '../../workspace/types.js';

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

export interface DpWorkspaceManagerApi {
  workspaceManager: WorkspaceManager;
  taskView?: TaskView | null;
  dockSyncCleanup?: (() => void) | null;
  addWorkspace(config: WorkspaceConfig): WorkspaceState;
  removeWorkspace(id: string): void;
  switchTo(id: string): void;
  currentWindowManager(): WindowManager;
  windowManager(workspaceId?: string): WindowManager;
  openWindow(config: JQueryWorkspaceWindowConfig): WindowState;
  syncDock(options?: DockSyncOptions): () => void;
  createTaskView(options?: DpTaskViewOptions): TaskView;
  destroy(): void;
}

export interface DpWorkspaceManagerOptions extends WorkspaceManagerOptions {
  workspaces?: WorkspaceConfig[];
  indicator?: boolean;
  syncDock?: boolean | DockSyncOptions;
  taskView?: boolean | DpTaskViewOptions;
  desktop?: DpDesktopApi | JQueryLike | string | HTMLElement;
}

export interface JQueryWorkspaceWindowConfig extends Omit<WorkspaceOpenWindowConfig, 'content'> {
  content?: HTMLElement | JQueryLike | string | null;
}

export interface DpWorkspaceWindowOptions extends Omit<JQueryWorkspaceWindowConfig, 'content'> {
  workspace: WorkspaceManager | DpWorkspaceManagerApi | JQueryLike | string | HTMLElement;
  content?: HTMLElement | JQueryLike | string | null;
  clone?: boolean;
}

export type DpWorkspaceManagerMethod =
  | 'instance'
  | 'addWorkspace'
  | 'removeWorkspace'
  | 'switchTo'
  | 'current'
  | 'workspaces'
  | 'currentWindowManager'
  | 'windowManager'
  | 'openWindow'
  | 'syncDock'
  | 'taskView'
  | 'destroy';

export interface DpTaskViewOptions extends TaskViewOptions {
  workspace?: WorkspaceManager | DpWorkspaceManagerApi | JQueryLike | string | HTMLElement;
  desktop?: DpDesktopApi | JQueryLike | string | HTMLElement;
}

export interface DpTaskViewApi {
  taskView: TaskView;
  open(): void;
  close(): void;
  toggle(): void;
  destroy(): void;
}

export type DpTaskViewMethod =
  | 'instance'
  | 'open'
  | 'close'
  | 'toggle'
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

    dpWorkspaceManager(options?: DpWorkspaceManagerOptions): JQuery;
    dpWorkspaceManager(method: 'instance'): DpWorkspaceManagerApi;
    dpWorkspaceManager(method: 'addWorkspace', config: WorkspaceConfig): WorkspaceState;
    dpWorkspaceManager(method: 'removeWorkspace' | 'switchTo', id: string): void;
    dpWorkspaceManager(method: 'current'): WorkspaceState | null;
    dpWorkspaceManager(method: 'workspaces'): WorkspaceState[];
    dpWorkspaceManager(method: 'currentWindowManager'): WindowManager;
    dpWorkspaceManager(method: 'windowManager', workspaceId?: string): WindowManager;
    dpWorkspaceManager(method: 'openWindow', config: JQueryWorkspaceWindowConfig): WindowState;
    dpWorkspaceManager(method: 'syncDock', options?: DockSyncOptions): () => void;
    dpWorkspaceManager(method: 'taskView', options?: DpTaskViewOptions): TaskView;
    dpWorkspaceManager(method: 'destroy'): void;

    dpWorkspaceWindow(options: DpWorkspaceWindowOptions): WindowState | WindowState[];

    dpTaskView(options?: DpTaskViewOptions): JQuery;
    dpTaskView(method: 'instance'): DpTaskViewApi;
    dpTaskView(method: 'open' | 'close' | 'toggle' | 'destroy'): void;
  }
}
