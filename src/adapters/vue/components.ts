// ============================================================
// DeskPane — Vue 3 Declarative Components
// ============================================================

import {
  Teleport,
  defineComponent,
  h,
  inject,
  onBeforeUnmount,
  onMounted,
  provide,
  ref,
  shallowRef,
  watch,
  type PropType,
  type Slots,
} from 'vue';
import { WindowManager, type WindowManagerOptions } from '../../core/WindowManager.js';
import type { WindowConfig, WindowState } from '../../core/types.js';
import { Desktop } from '../../desktop/Desktop.js';
import type {
  DesktopConfig,
  DesktopIconConfig,
  DesktopIconEvent,
  DesktopIconMoveEvent,
  DesktopItemsEvent,
  DesktopItemsSource,
} from '../../desktop/types.js';

interface VueDesktopContext {
  registerIcon(config: DesktopIconConfig): void;
  updateIcon(id: string, config: DesktopIconConfig): void;
  unregisterIcon(id: string): void;
  getDesktop(): Desktop | null;
}

interface VueWindowRegistration {
  id: string;
  slots: Slots;
  isOpen(): boolean;
  getConfig(): WindowConfig;
  onInitialized(state: WindowState, bodyEl: HTMLElement, windowManager: WindowManager): void;
  onOpened(state: WindowState): void;
  onClosed(payload: { id: string }): void;
  onFocused(state: WindowState): void;
  onMinimized(state: WindowState): void;
  onMaximized(state: WindowState): void;
  onRestored(state: WindowState): void;
}

interface VueWindowManagerContext {
  registerWindow(reg: VueWindowRegistration): void;
  updateWindow(reg: VueWindowRegistration): void;
  unregisterWindow(id: string): void;
  closeWindow(id: string): void;
  getWindowManager(): WindowManager | null;
}

interface VueWindowRenderEntry {
  id: string;
  bodyEl: HTMLElement;
  slots: Slots;
}

const DesktopContextKey = Symbol('DeskPaneVueDesktop');
const WindowManagerContextKey = Symbol('DeskPaneVueWindowManager');

function makeDesktopIconConfig(props: {
  id: string;
  label: string;
  icon: string;
  x?: number;
  y?: number;
  dragThreshold?: number;
}, action?: () => void): DesktopIconConfig {
  return {
    id: props.id,
    label: props.label,
    icon: props.icon,
    x: props.x,
    y: props.y,
    dragThreshold: props.dragThreshold,
    action,
  };
}

export const DpDesktop = defineComponent({
  name: 'DpDesktop',
  props: {
    items: { type: Array as PropType<DesktopIconConfig[] | undefined>, default: undefined },
    itemsSource: { type: [Array, Object] as PropType<DesktopItemsSource | undefined>, default: undefined },
    dock: { type: Object as PropType<DesktopConfig['dock']>, default: undefined },
    background: { type: String, default: undefined },
    storageKey: { type: String, default: undefined },
    dragThreshold: { type: Number, default: undefined },
    iconSnap: { type: Boolean, default: undefined },
    iconSnapThreshold: { type: Number, default: undefined },
    injectStyles: { type: Boolean, default: undefined },
    autoRefresh: { type: Boolean, default: true },
  },
  emits: [
    'initialized',
    'ready',
    'update:items',
    'itemsChanged',
    'itemsRefreshed',
    'iconAdded',
    'iconRemoved',
    'iconMoved',
    'iconActivated',
    'iconSelected',
  ],
  setup(props, { emit, slots, attrs }) {
    const hostEl = ref<HTMLElement | null>(null);
    const pendingIcons = new Map<string, DesktopIconConfig>();
    const eventCleanups: Array<() => void> = [];
    let desktop: Desktop | null = null;

    const resolveSource = (): DesktopItemsSource => {
      return props.itemsSource ?? props.items ?? [];
    };

    const bindEvents = (instance: Desktop) => {
      eventCleanups.push(
        instance.events.on<DesktopItemsEvent>('items:changed', (event) => {
          emit('update:items', event.items);
          emit('itemsChanged', event);
        }),
        instance.events.on<DesktopItemsEvent>('items:refreshed', (event) => {
          emit('itemsRefreshed', event);
        }),
        instance.events.on<DesktopIconEvent>('icon:added', event => emit('iconAdded', event)),
        instance.events.on<DesktopIconEvent>('icon:removed', event => emit('iconRemoved', event)),
        instance.events.on<DesktopIconMoveEvent>('icon:moved', event => emit('iconMoved', event)),
        instance.events.on<DesktopIconEvent>('icon:activated', event => emit('iconActivated', event)),
        instance.events.on<DesktopIconEvent>('icon:selected', event => emit('iconSelected', event)),
      );
    };

    const ctx: VueDesktopContext = {
      registerIcon(config) {
        pendingIcons.set(config.id, config);
        desktop?.addIcon(config);
      },
      updateIcon(id, config) {
        pendingIcons.set(id, config);
        desktop?.updateItem(id, config);
      },
      unregisterIcon(id) {
        pendingIcons.delete(id);
        desktop?.removeIcon(id);
      },
      getDesktop() {
        return desktop;
      },
    };
    provide(DesktopContextKey, ctx);

    onMounted(() => {
      if (!hostEl.value) return;
      desktop = new Desktop({
        container: hostEl.value,
        itemsSource: resolveSource(),
        dock: props.dock,
        background: props.background,
        storageKey: props.storageKey,
        dragThreshold: props.dragThreshold,
        iconSnap: props.iconSnap,
        iconSnapThreshold: props.iconSnapThreshold,
        injectStyles: props.injectStyles,
      });
      bindEvents(desktop);
      pendingIcons.forEach(icon => desktop?.addIcon(icon));
      emit('initialized', desktop);
      emit('ready', desktop);
    });

    watch(
      () => props.items,
      (items) => {
        if (!desktop || !props.autoRefresh || props.itemsSource || !items) return;
        desktop.setItems(items);
      },
      { deep: true },
    );

    watch(
      () => props.itemsSource,
      (source) => {
        if (!desktop || !props.autoRefresh || !source) return;
        desktop.setItemsSource(source);
      },
      { deep: true },
    );

    onBeforeUnmount(() => {
      eventCleanups.splice(0).forEach(fn => fn());
      desktop?.destroy();
      desktop = null;
      pendingIcons.clear();
    });

    return () => h('div', {
      ...attrs,
      ref: hostEl,
      class: ['dp-vue-desktop-host', attrs.class],
    }, slots.default?.());
  },
});

export const DpDesktopIcon = defineComponent({
  name: 'DpDesktopIcon',
  props: {
    id: { type: String, required: true },
    label: { type: String, required: true },
    icon: { type: String, required: true },
    x: { type: Number, default: undefined },
    y: { type: Number, default: undefined },
    dragThreshold: { type: Number, default: undefined },
  },
  emits: ['activate'],
  setup(props, { emit }) {
    const desktop = inject<VueDesktopContext | null>(DesktopContextKey, null);

    const config = () => makeDesktopIconConfig(props, () => {
      emit('activate', {
        id: props.id,
        label: props.label,
        icon: props.icon,
        x: props.x,
        y: props.y,
      });
    });

    onMounted(() => desktop?.registerIcon(config()));
    watch(
      () => ({ ...props }),
      () => desktop?.updateIcon(props.id, config()),
      { deep: true },
    );
    onBeforeUnmount(() => desktop?.unregisterIcon(props.id));

    return () => null;
  },
});

export const DpWindowManager = defineComponent({
  name: 'DpWindowManager',
  props: {
    isolated: { type: Boolean, default: true },
    throttleMs: { type: Number, default: undefined },
    snap: { type: Boolean, default: undefined },
    snapThreshold: { type: Number, default: undefined },
    snapGap: { type: Number, default: undefined },
    injectStyles: { type: Boolean, default: undefined },
  },
  emits: ['initialized', 'ready'],
  setup(props, { emit, slots, attrs }) {
    const hostEl = ref<HTMLElement | null>(null);
    const renderEntries = shallowRef<VueWindowRenderEntry[]>([]);
    const registrations = new Map<string, VueWindowRegistration>();
    const eventCleanups: Array<() => void> = [];
    let wm: WindowManager | null = null;

    const removeEntry = (id: string) => {
      renderEntries.value = renderEntries.value.filter(entry => entry.id !== id);
    };

    const openRegistration = (reg: VueWindowRegistration) => {
      if (!wm || !reg.isOpen()) return;
      const existing = wm.getState(reg.id);
      if (existing) {
        wm.setTitle(reg.id, reg.getConfig().title);
        return;
      }
      const state = wm.open(reg.getConfig());
      const bodyEl = wm.getBodyElement(reg.id);
      if (bodyEl) {
        removeEntry(reg.id);
        renderEntries.value = [
          ...renderEntries.value,
          { id: reg.id, bodyEl, slots: reg.slots },
        ];
        reg.onInitialized(state, bodyEl, wm);
      }
      reg.onOpened(state);
    };

    const ctx: VueWindowManagerContext = {
      registerWindow(reg) {
        registrations.set(reg.id, reg);
        openRegistration(reg);
      },
      updateWindow(reg) {
        registrations.set(reg.id, reg);
        if (!wm) return;
        const state = wm.getState(reg.id);
        if (state) {
          wm.setTitle(reg.id, reg.getConfig().title);
        } else {
          openRegistration(reg);
        }
      },
      unregisterWindow(id) {
        registrations.delete(id);
        removeEntry(id);
        wm?.close(id);
      },
      closeWindow(id) {
        wm?.close(id);
      },
      getWindowManager() {
        return wm;
      },
    };
    provide(WindowManagerContextKey, ctx);

    onMounted(() => {
      if (!hostEl.value) return;
      const options: WindowManagerOptions = {
        container: hostEl.value,
        isolated: props.isolated,
        throttleMs: props.throttleMs,
        snap: props.snap,
        snapThreshold: props.snapThreshold,
        snapGap: props.snapGap,
        injectStyles: props.injectStyles,
      };
      wm = new WindowManager(options);
      eventCleanups.push(
        wm.events.on<{ id: string }>('window:closed', (payload) => {
          removeEntry(payload.id);
          registrations.get(payload.id)?.onClosed(payload);
        }),
        wm.events.on<WindowState>('window:focused', state => registrations.get(state.id)?.onFocused(state)),
        wm.events.on<WindowState>('window:minimized', state => registrations.get(state.id)?.onMinimized(state)),
        wm.events.on<WindowState>('window:maximized', state => registrations.get(state.id)?.onMaximized(state)),
        wm.events.on<WindowState>('window:restored', state => registrations.get(state.id)?.onRestored(state)),
      );
      registrations.forEach(openRegistration);
      emit('initialized', wm);
      emit('ready', wm);
    });

    onBeforeUnmount(() => {
      eventCleanups.splice(0).forEach(fn => fn());
      wm?.destroy();
      wm = null;
      registrations.clear();
      renderEntries.value = [];
    });

    return () => h('div', {
      ...attrs,
      ref: hostEl,
      class: ['dp-vue-window-manager-host', attrs.class],
    }, [
      slots.default?.(),
      ...renderEntries.value.map(entry => h(Teleport as any, { to: entry.bodyEl }, entry.slots.default?.())),
    ]);
  },
});

export const DpWindow = defineComponent({
  name: 'DpWindow',
  props: {
    id: { type: String, required: true },
    title: { type: String, required: true },
    icon: { type: String, default: undefined },
    label: { type: String, default: undefined },
    x: { type: Number, default: undefined },
    y: { type: Number, default: undefined },
    width: { type: Number, default: undefined },
    height: { type: Number, default: undefined },
    resizable: { type: Boolean, default: undefined },
    parentId: { type: String, default: undefined },
    modal: { type: Boolean, default: undefined },
    open: { type: Boolean, default: true },
  },
  emits: [
    'update:open',
    'initialized',
    'opened',
    'closed',
    'focused',
    'minimized',
    'maximized',
    'restored',
  ],
  setup(props, { emit, slots }) {
    const manager = inject<VueWindowManagerContext | null>(WindowManagerContextKey, null);

    const registration: VueWindowRegistration = {
      id: props.id,
      slots,
      isOpen: () => props.open,
      getConfig: () => ({
        id: props.id,
        title: props.title,
        icon: props.icon,
        label: props.label,
        x: props.x,
        y: props.y,
        width: props.width,
        height: props.height,
        resizable: props.resizable,
        parentId: props.parentId,
        modal: props.modal,
        slotType: 'vue',
        content: null,
      }),
      onInitialized: (state, bodyEl, windowManager) => emit('initialized', {
        state,
        bodyEl,
        windowManager,
      }),
      onOpened: state => emit('opened', state),
      onClosed: payload => {
        emit('update:open', false);
        emit('closed', payload);
      },
      onFocused: state => emit('focused', state),
      onMinimized: state => emit('minimized', state),
      onMaximized: state => emit('maximized', state),
      onRestored: state => emit('restored', state),
    };

    onMounted(() => {
      if (props.open) manager?.registerWindow(registration);
    });

    watch(
      () => props.open,
      (open) => {
        if (open) manager?.registerWindow(registration);
        else manager?.closeWindow(props.id);
      },
    );

    watch(
      () => ({
        id: props.id,
        title: props.title,
        icon: props.icon,
        label: props.label,
        x: props.x,
        y: props.y,
        width: props.width,
        height: props.height,
        resizable: props.resizable,
        parentId: props.parentId,
        modal: props.modal,
      }),
      () => manager?.updateWindow(registration),
      { deep: true },
    );

    onBeforeUnmount(() => manager?.unregisterWindow(props.id));

    return () => null;
  },
});
