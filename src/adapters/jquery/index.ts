import { WindowManager } from '../../core/WindowManager.js';
import { Desktop } from '../../desktop/Desktop.js';
import { WorkspaceManager } from '../../workspace/WorkspaceManager.js';
import { TaskView } from '../../workspace/TaskView.js';
import type { WindowConfig, WindowState } from '../../core/types.js';
import type { WindowManagerOptions } from '../../core/WindowManager.js';
import type { DesktopIconConfig, DockSyncOptions } from '../../desktop/types.js';
import type {
  DpDesktopApi,
  DpDesktopMethod,
  DpDesktopOptions,
  DpTaskViewApi,
  DpTaskViewMethod,
  DpTaskViewOptions,
  DpWindowManagerApi,
  DpWindowManagerMethod,
  DpWindowManagerOptions,
  DpWindowOptions,
  DpWorkspaceManagerApi,
  DpWorkspaceManagerMethod,
  DpWorkspaceManagerOptions,
  DpWorkspaceWindowOptions,
  JQueryLike,
  JQueryStaticLike,
  JQueryWorkspaceWindowConfig,
  JQueryWindowConfig,
} from './types.js';

export type {
  DeskPaneJQueryPlugin,
  DpDesktopApi,
  DpDesktopMethod,
  DpDesktopOptions,
  DpTaskViewApi,
  DpTaskViewMethod,
  DpTaskViewOptions,
  DpWindowManagerApi,
  DpWindowManagerMethod,
  DpWindowManagerOptions,
  DpWindowOptions,
  DpWorkspaceManagerApi,
  DpWorkspaceManagerMethod,
  DpWorkspaceManagerOptions,
  DpWorkspaceWindowOptions,
  JQueryLike,
  JQueryStaticLike,
  JQueryWorkspaceWindowConfig,
  JQueryWindowConfig,
} from './types.js';

const WM_DATA_KEY = 'dpWindowManager';
const DESKTOP_DATA_KEY = 'dpDesktop';
const WORKSPACE_DATA_KEY = 'dpWorkspaceManager';
const TASKVIEW_DATA_KEY = 'dpTaskView';

function isJQueryLike(value: unknown): value is JQueryLike {
  return !!value
    && typeof value === 'object'
    && typeof (value as JQueryLike).each === 'function'
    && typeof (value as JQueryLike).data === 'function'
    && typeof (value as JQueryLike).length === 'number';
}

function isWindowManagerLike(value: unknown): value is WindowManager {
  return !!value
    && typeof value === 'object'
    && typeof (value as WindowManager).open === 'function'
    && typeof (value as WindowManager).close === 'function'
    && typeof (value as WindowManager).getBodyElement === 'function';
}

function isWorkspaceManagerLike(value: unknown): value is WorkspaceManager {
  return !!value
    && typeof value === 'object'
    && typeof (value as WorkspaceManager).addWorkspace === 'function'
    && typeof (value as WorkspaceManager).switchTo === 'function'
    && typeof (value as WorkspaceManager).getWindowManager === 'function';
}

function firstElement(value: HTMLElement | JQueryLike | string | null | undefined): HTMLElement | null {
  if (!value) return null;
  if (typeof value === 'string') {
    const template = document.createElement('template');
    template.innerHTML = value.trim();
    return template.content.firstElementChild as HTMLElement | null;
  }
  if (isJQueryLike(value)) return value[0] ?? null;
  return value;
}

function normalizeWindowConfig(config: JQueryWindowConfig, fallbackContent?: HTMLElement): WindowConfig {
  const content = firstElement(config.content) ?? fallbackContent ?? document.createElement('div');
  return {
    ...config,
    content,
  };
}

function getManagerApiFromElement($: JQueryStaticLike, el: HTMLElement): DpWindowManagerApi | undefined {
  return $(el).data(WM_DATA_KEY) as DpWindowManagerApi | undefined;
}

function resolveManager($: JQueryStaticLike, manager: DpWindowOptions['manager']): WindowManager {
  if (isWindowManagerLike(manager)) return manager;
  if (typeof manager === 'object' && manager && 'manager' in manager) {
    return (manager as DpWindowManagerApi).manager;
  }
  if (typeof manager === 'string') {
    const el = document.querySelector<HTMLElement>(manager);
    const api = el ? getManagerApiFromElement($, el) : undefined;
    if (api) return api.manager;
  }
  if (manager instanceof HTMLElement) {
    const api = getManagerApiFromElement($, manager);
    if (api) return api.manager;
  }
  if (isJQueryLike(manager)) {
    const api = manager.data(WM_DATA_KEY) as DpWindowManagerApi | undefined;
    if (api) return api.manager;
  }
  throw new Error('DeskPane jQuery adapter: manager was not found.');
}

function resolveDesktopApi($: JQueryStaticLike, desktop: DpWorkspaceManagerOptions['desktop'] | DpTaskViewOptions['desktop']): DpDesktopApi | undefined {
  if (!desktop) return undefined;
  if (typeof desktop === 'object' && 'desktop' in desktop) return desktop as DpDesktopApi;
  if (typeof desktop === 'string') {
    const el = document.querySelector<HTMLElement>(desktop);
    return el ? ($(el).data(DESKTOP_DATA_KEY) as DpDesktopApi | undefined) : undefined;
  }
  if (desktop instanceof HTMLElement) return $(desktop).data(DESKTOP_DATA_KEY) as DpDesktopApi | undefined;
  if (isJQueryLike(desktop)) return desktop.data(DESKTOP_DATA_KEY) as DpDesktopApi | undefined;
  return undefined;
}

function resolveWorkspaceApi($: JQueryStaticLike, workspace: DpWorkspaceWindowOptions['workspace'] | DpTaskViewOptions['workspace']): DpWorkspaceManagerApi {
  if (isWorkspaceManagerLike(workspace)) {
    return createWorkspaceManagerApi($, workspace, {});
  }
  if (typeof workspace === 'object' && workspace && 'workspaceManager' in workspace) {
    return workspace as DpWorkspaceManagerApi;
  }
  if (typeof workspace === 'string') {
    const el = document.querySelector<HTMLElement>(workspace);
    const api = el ? ($(el).data(WORKSPACE_DATA_KEY) as DpWorkspaceManagerApi | undefined) : undefined;
    if (api) return api;
  }
  if (workspace instanceof HTMLElement) {
    const api = $(workspace).data(WORKSPACE_DATA_KEY) as DpWorkspaceManagerApi | undefined;
    if (api) return api;
  }
  if (isJQueryLike(workspace)) {
    const api = workspace.data(WORKSPACE_DATA_KEY) as DpWorkspaceManagerApi | undefined;
    if (api) return api;
  }
  throw new Error('DeskPane jQuery adapter: workspace manager was not found.');
}

function createWindowManagerApi(manager: WindowManager): DpWindowManagerApi {
  return {
    manager,
    open(config) {
      return manager.open(normalizeWindowConfig(config));
    },
    close(id) { manager.close(id); },
    minimize(id) { manager.minimize(id); },
    maximize(id) { manager.maximize(id); },
    restore(id) { manager.restore(id); },
    focus(id) { manager.focus(id); },
    destroy() { manager.destroy(); },
    getBodyElement(id) { return manager.getBodyElement(id); },
    getState(id) { return manager.getState(id); },
  };
}

function callWindowManagerMethod(
  api: DpWindowManagerApi,
  method: DpWindowManagerMethod,
  args: unknown[],
): unknown {
  switch (method) {
    case 'instance': return api;
    case 'open': return api.open(args[0] as JQueryWindowConfig);
    case 'close': return api.close(String(args[0]));
    case 'minimize': return api.minimize(String(args[0]));
    case 'maximize': return api.maximize(String(args[0]));
    case 'restore': return api.restore(String(args[0]));
    case 'focus': return api.focus(String(args[0]));
    case 'destroy': return api.destroy();
    case 'getBodyElement': return api.getBodyElement(String(args[0]));
    case 'getState': return api.getState(String(args[0]));
    default:
      throw new Error(`DeskPane jQuery adapter: unknown WindowManager method "${method}".`);
  }
}

function createDesktopApi(desktop: Desktop, options: DpDesktopOptions): DpDesktopApi {
  let windowManager: WindowManager | undefined;
  let dockSyncCleanup: (() => void) | null = null;

  const api: DpDesktopApi = {
    desktop,
    get windowManager() { return windowManager; },
    get dockSyncCleanup() { return dockSyncCleanup; },
    set dockSyncCleanup(cleanup) { dockSyncCleanup = cleanup; },
    getWindowManager(wmOptions = {}) {
      if (!windowManager) {
        windowManager = new WindowManager({
          container: desktop.getElement(),
          isolated: true,
          ...wmOptions,
        });
      }
      return windowManager;
    },
    syncDockWithWindows(manager, syncOptions = {}) {
      const wm = manager ?? api.getWindowManager();
      dockSyncCleanup?.();
      dockSyncCleanup = desktop.syncDockWithWindows(wm, syncOptions);
      return dockSyncCleanup;
    },
    addIcon(config) { desktop.addIcon(config); },
    removeIcon(id) { desktop.removeIcon(id); },
    destroy() {
      dockSyncCleanup?.();
      dockSyncCleanup = null;
      windowManager?.destroy();
      windowManager = undefined;
      desktop.destroy();
    },
  };

  if (options.windowManager !== false) {
    api.getWindowManager(options.windowManager ?? {});
  }
  if (options.syncDock) {
    api.syncDockWithWindows(undefined, options.syncDock === true ? {} : options.syncDock);
  }

  return api;
}

function callDesktopMethod(api: DpDesktopApi, method: DpDesktopMethod, args: unknown[]): unknown {
  switch (method) {
    case 'instance': return api;
    case 'windowManager': return api.getWindowManager(args[0] as WindowManagerOptions | undefined);
    case 'addIcon': return api.addIcon(args[0] as DesktopIconConfig);
    case 'removeIcon': return api.removeIcon(String(args[0]));
    case 'syncDockWithWindows': return api.syncDockWithWindows(
      isWindowManagerLike(args[0]) ? args[0] : undefined,
      (isWindowManagerLike(args[0]) ? args[1] : args[0]) as DockSyncOptions | undefined,
    );
    case 'destroy': return api.destroy();
    default:
      throw new Error(`DeskPane jQuery adapter: unknown Desktop method "${method}".`);
  }
}

function normalizeWorkspaceWindowConfig(config: JQueryWorkspaceWindowConfig, fallbackContent?: HTMLElement) {
  const content = firstElement(config.content) ?? fallbackContent ?? document.createElement('div');
  return {
    ...config,
    content,
  };
}

function createWorkspaceManagerApi(
  $: JQueryStaticLike,
  workspaceManager: WorkspaceManager,
  options: DpWorkspaceManagerOptions,
): DpWorkspaceManagerApi {
  const desktopApi = resolveDesktopApi($, options.desktop);
  let dockSyncCleanup: (() => void) | null = null;
  let taskView: TaskView | null = null;

  const api: DpWorkspaceManagerApi = {
    workspaceManager,
    get taskView() { return taskView; },
    set taskView(value) { taskView = value ?? null; },
    get dockSyncCleanup() { return dockSyncCleanup; },
    set dockSyncCleanup(cleanup) { dockSyncCleanup = cleanup; },
    addWorkspace(config) { return workspaceManager.addWorkspace(config); },
    removeWorkspace(id) { workspaceManager.removeWorkspace(id); },
    switchTo(id) { workspaceManager.switchTo(id); },
    currentWindowManager() {
      const current = workspaceManager.current;
      if (!current) throw new Error('DeskPane jQuery adapter: no active workspace.');
      return workspaceManager.getWindowManager(current.id);
    },
    windowManager(workspaceId) {
      return workspaceManager.getWindowManager(workspaceId ?? workspaceManager.current?.id ?? '');
    },
    openWindow(config) {
      return workspaceManager.openWindow(normalizeWorkspaceWindowConfig(config));
    },
    syncDock(syncOptions = {}) {
      if (!desktopApi) {
        throw new Error('DeskPane jQuery adapter: syncDock requires a dpDesktop instance.');
      }
      const current = workspaceManager.current;
      if (!current) throw new Error('DeskPane jQuery adapter: no active workspace.');
      dockSyncCleanup?.();
      dockSyncCleanup = desktopApi.desktop.syncDockWithWindows(workspaceManager.getWindowManager(current.id), syncOptions);
      return dockSyncCleanup;
    },
    createTaskView(taskViewOptions = {}) {
      taskView?.destroy();
      const taskViewDesktopApi = resolveDesktopApi($, taskViewOptions.desktop) ?? desktopApi;
      taskView = new TaskView(workspaceManager, {
        ...taskViewOptions,
        dock: taskViewOptions.dock ?? taskViewDesktopApi?.desktop.getDock(),
      });
      return taskView;
    },
    destroy() {
      dockSyncCleanup?.();
      dockSyncCleanup = null;
      taskView?.destroy();
      taskView = null;
      workspaceManager.destroy();
    },
  };

  workspaceManager.events.on('workspace:switched', () => {
    if (options.syncDock) {
      api.syncDock(options.syncDock === true ? {} : options.syncDock);
    }
  });

  options.workspaces?.forEach(config => workspaceManager.addWorkspace(config));
  if (options.indicator) workspaceManager.enableIndicator();
  if (options.syncDock) api.syncDock(options.syncDock === true ? {} : options.syncDock);
  if (options.taskView) api.createTaskView(options.taskView === true ? {} : options.taskView);

  return api;
}

function callWorkspaceMethod(api: DpWorkspaceManagerApi, method: DpWorkspaceManagerMethod, args: unknown[]): unknown {
  switch (method) {
    case 'instance': return api;
    case 'addWorkspace': return api.addWorkspace(args[0] as Parameters<DpWorkspaceManagerApi['addWorkspace']>[0]);
    case 'removeWorkspace': return api.removeWorkspace(String(args[0]));
    case 'switchTo': return api.switchTo(String(args[0]));
    case 'current': return api.workspaceManager.current;
    case 'workspaces': return api.workspaceManager.workspaces;
    case 'currentWindowManager': return api.currentWindowManager();
    case 'windowManager': return api.windowManager(args[0] ? String(args[0]) : undefined);
    case 'openWindow': return api.openWindow(args[0] as JQueryWorkspaceWindowConfig);
    case 'syncDock': return api.syncDock(args[0] as DockSyncOptions | undefined);
    case 'taskView': return api.createTaskView(args[0] as DpTaskViewOptions | undefined);
    case 'destroy': return api.destroy();
    default:
      throw new Error(`DeskPane jQuery adapter: unknown WorkspaceManager method "${method}".`);
  }
}

function createTaskViewApi(taskView: TaskView): DpTaskViewApi {
  return {
    taskView,
    open() { taskView.open(); },
    close() { taskView.close(); },
    toggle() { taskView.toggle(); },
    destroy() { taskView.destroy(); },
  };
}

function callTaskViewMethod(api: DpTaskViewApi, method: DpTaskViewMethod): unknown {
  switch (method) {
    case 'instance': return api;
    case 'open': return api.open();
    case 'close': return api.close();
    case 'toggle': return api.toggle();
    case 'destroy': return api.destroy();
    default:
      throw new Error(`DeskPane jQuery adapter: unknown TaskView method "${method}".`);
  }
}

export function install($: JQueryStaticLike): void {
  if (!$ || !$.fn) {
    throw new Error('DeskPane jQuery adapter requires a jQuery-compatible $.fn object.');
  }

  $.fn.dpWindowManager = function dpWindowManager(
    this: JQueryLike,
    optionsOrMethod?: DpWindowManagerOptions | DpWindowManagerMethod,
    ...args: unknown[]
  ) {
    if (typeof optionsOrMethod === 'string') {
      const api = this.data(WM_DATA_KEY) as DpWindowManagerApi | undefined;
      if (!api) throw new Error('DeskPane jQuery adapter: call dpWindowManager(options) before using methods.');
      return callWindowManagerMethod(api, optionsOrMethod, args);
    }

    return this.each(function initWindowManager(this: HTMLElement) {
      const manager = new WindowManager({
        container: this,
        isolated: true,
        ...(optionsOrMethod ?? {}),
      });
      const api = createWindowManagerApi(manager);
      ($(this) as JQueryLike).data(WM_DATA_KEY, api);
    });
  };

  $.fn.dpWindow = function dpWindow(
    this: JQueryLike,
    options: DpWindowOptions,
  ) {
  const states: WindowState[] = [];
  this.each(function openElementWindow(this: HTMLElement, index: number) {
    const manager = resolveManager($, options.manager);
    const { manager: _manager, clone: _clone, ...windowOptions } = options;
    const source = options.content
      ? firstElement(options.content)
      : options.clone
          ? this.cloneNode(true) as HTMLElement
          : this;
    const id = options.id ?? this.id ?? `dp-window-${index + 1}`;
    states.push(manager.open(normalizeWindowConfig({
      ...windowOptions,
      id,
      content: source,
    })));
    });
    return states.length === 1 ? states[0] : states;
  };

  $.fn.dpDesktop = function dpDesktop(
    this: JQueryLike,
    optionsOrMethod?: DpDesktopOptions | DpDesktopMethod,
    ...args: unknown[]
  ) {
    if (typeof optionsOrMethod === 'string') {
      const api = this.data(DESKTOP_DATA_KEY) as DpDesktopApi | undefined;
      if (!api) throw new Error('DeskPane jQuery adapter: call dpDesktop(options) before using methods.');
      return callDesktopMethod(api, optionsOrMethod, args);
    }

    return this.each(function initDesktop(this: HTMLElement) {
      const options = optionsOrMethod ?? {};
      const desktop = new Desktop({
        ...options,
        container: this,
      });
      const api = createDesktopApi(desktop, options);
      ($(this) as JQueryLike).data(DESKTOP_DATA_KEY, api);
    });
  };

  $.fn.dpWorkspaceManager = function dpWorkspaceManager(
    this: JQueryLike,
    optionsOrMethod?: DpWorkspaceManagerOptions | DpWorkspaceManagerMethod,
    ...args: unknown[]
  ) {
    if (typeof optionsOrMethod === 'string') {
      const api = this.data(WORKSPACE_DATA_KEY) as DpWorkspaceManagerApi | undefined;
      if (!api) throw new Error('DeskPane jQuery adapter: call dpWorkspaceManager(options) before using methods.');
      return callWorkspaceMethod(api, optionsOrMethod, args);
    }

    return this.each(function initWorkspaceManager(this: HTMLElement) {
      const options = optionsOrMethod ?? {};
      const desktopApi = resolveDesktopApi($, options.desktop);
      const container = desktopApi?.desktop.getElement() ?? this;
      const workspaceManager = new WorkspaceManager(container, options);
      const api = createWorkspaceManagerApi($, workspaceManager, options);
      ($(this) as JQueryLike).data(WORKSPACE_DATA_KEY, api);
    });
  };

  $.fn.dpWorkspaceWindow = function dpWorkspaceWindow(
    this: JQueryLike,
    options: DpWorkspaceWindowOptions,
  ) {
    const states: WindowState[] = [];
    this.each(function openWorkspaceWindow(this: HTMLElement, index: number) {
      const workspaceApi = resolveWorkspaceApi($, options.workspace);
      const { workspace: _workspace, clone: _clone, ...windowOptions } = options;
      const source = options.content
        ? firstElement(options.content)
        : options.clone
          ? this.cloneNode(true) as HTMLElement
          : this;
      const fallbackId = this.id || undefined;
      const fallbackAppId = this.id || `dp-window-${index + 1}`;
      states.push(workspaceApi.openWindow({
        ...windowOptions,
        id: options.id ?? fallbackId,
        appId: options.appId ?? fallbackAppId,
        content: source,
      }));
    });
    return states.length === 1 ? states[0] : states;
  };

  $.fn.dpTaskView = function dpTaskView(
    this: JQueryLike,
    optionsOrMethod?: DpTaskViewOptions | DpTaskViewMethod,
  ) {
    if (typeof optionsOrMethod === 'string') {
      const api = this.data(TASKVIEW_DATA_KEY) as DpTaskViewApi | undefined;
      if (!api) throw new Error('DeskPane jQuery adapter: call dpTaskView(options) before using methods.');
      return callTaskViewMethod(api, optionsOrMethod);
    }

    return this.each(function initTaskView(this: HTMLElement) {
      const options = optionsOrMethod ?? {};
      const workspaceApi = options.workspace
        ? resolveWorkspaceApi($, options.workspace)
        : ($(this).data(WORKSPACE_DATA_KEY) as DpWorkspaceManagerApi | undefined);
      if (!workspaceApi) throw new Error('DeskPane jQuery adapter: dpTaskView requires a dpWorkspaceManager instance.');
      const taskView = workspaceApi.createTaskView(options);
      ($(this) as JQueryLike).data(TASKVIEW_DATA_KEY, createTaskViewApi(taskView));
    });
  };
}

export const DeskPaneJQuery = { install };

const browserGlobal = globalThis as typeof globalThis & {
  jQuery?: JQueryStaticLike;
  $?: JQueryStaticLike;
  DeskPaneJQuery?: typeof DeskPaneJQuery;
};

const autoJQuery = browserGlobal.jQuery ?? browserGlobal.$;
if (autoJQuery?.fn) install(autoJQuery);

declare global {
  interface Window {
    DeskPaneJQuery?: typeof DeskPaneJQuery;
  }
}

browserGlobal.DeskPaneJQuery = DeskPaneJQuery;
