import { WindowManager } from '../../core/WindowManager.js';
import { Desktop } from '../../desktop/Desktop.js';
import type { WindowConfig, WindowState } from '../../core/types.js';
import type { WindowManagerOptions } from '../../core/WindowManager.js';
import type { DesktopIconConfig, DockSyncOptions } from '../../desktop/types.js';
import type {
  DpDesktopApi,
  DpDesktopMethod,
  DpDesktopOptions,
  DpWindowManagerApi,
  DpWindowManagerMethod,
  DpWindowManagerOptions,
  DpWindowOptions,
  JQueryLike,
  JQueryStaticLike,
  JQueryWindowConfig,
} from './types.js';

export type {
  DeskPaneJQueryPlugin,
  DpDesktopApi,
  DpDesktopMethod,
  DpDesktopOptions,
  DpWindowManagerApi,
  DpWindowManagerMethod,
  DpWindowManagerOptions,
  DpWindowOptions,
  JQueryLike,
  JQueryStaticLike,
  JQueryWindowConfig,
} from './types.js';

const WM_DATA_KEY = 'dpWindowManager';
const DESKTOP_DATA_KEY = 'dpDesktop';

function isJQueryLike(value: unknown): value is JQueryLike {
  return !!value
    && typeof value === 'object'
    && typeof (value as JQueryLike).each === 'function'
    && typeof (value as JQueryLike).data === 'function'
    && typeof (value as JQueryLike).length === 'number';
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

function getManagerApiFromElement(el: HTMLElement): DpWindowManagerApi | undefined {
  return readData(el, WM_DATA_KEY) as DpWindowManagerApi | undefined;
}

function readData(el: HTMLElement, key: string): unknown {
  const maybeJQuery = (globalThis as { jQuery?: (element: HTMLElement) => JQueryLike }).jQuery;
  if (maybeJQuery) return maybeJQuery(el).data(key);
  return undefined;
}

function resolveManager(manager: DpWindowOptions['manager']): WindowManager {
  if (manager instanceof WindowManager) return manager;
  if (typeof manager === 'object' && manager && 'manager' in manager) {
    return (manager as DpWindowManagerApi).manager;
  }
  if (typeof manager === 'string') {
    const el = document.querySelector<HTMLElement>(manager);
    const api = el ? getManagerApiFromElement(el) : undefined;
    if (api) return api.manager;
  }
  if (manager instanceof HTMLElement) {
    const api = getManagerApiFromElement(manager);
    if (api) return api.manager;
  }
  if (isJQueryLike(manager)) {
    const api = manager.data(WM_DATA_KEY) as DpWindowManagerApi | undefined;
    if (api) return api.manager;
  }
  throw new Error('DeskPane jQuery adapter: manager was not found.');
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
      args[0] instanceof WindowManager ? args[0] : undefined,
      (args[0] instanceof WindowManager ? args[1] : args[0]) as DockSyncOptions | undefined,
    );
    case 'destroy': return api.destroy();
    default:
      throw new Error(`DeskPane jQuery adapter: unknown Desktop method "${method}".`);
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
      const manager = resolveManager(options.manager);
      const source = options.content
        ? firstElement(options.content)
        : options.clone
          ? this.cloneNode(true) as HTMLElement
          : this;
      const id = options.id ?? this.id ?? `dp-window-${index + 1}`;
      states.push(manager.open(normalizeWindowConfig({
        ...options,
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
}

export const DeskPaneJQuery = { install };

declare const window: { jQuery?: JQueryStaticLike; $?: JQueryStaticLike } | undefined;
const autoJQuery = typeof window !== 'undefined' ? (window.jQuery ?? window.$) : undefined;
if (autoJQuery?.fn) install(autoJQuery);

declare global {
  interface Window {
    DeskPaneJQuery?: typeof DeskPaneJQuery;
  }
}

if (typeof window !== 'undefined') {
  window.DeskPaneJQuery = DeskPaneJQuery;
}

