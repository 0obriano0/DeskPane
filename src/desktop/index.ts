// ============================================================
// DeskPane-Desktop — Public Entry Point
// ============================================================

export { Desktop } from './Desktop.js';
export { Dock } from './Dock.js';
export { DesktopIcon } from './DesktopIcon.js';
export { SystemTray } from './SystemTray.js';
export { DesktopCollectionView } from './DesktopCollectionView.js';
export { getDesktopCSS } from './styles.js';
export type {
  DesktopConfig,
  DesktopEvent,
  DesktopIconEvent,
  DesktopIconMoveEvent,
  DockConfig,
  DockSyncOptions,
  DockSyncWindowEvent,
  DockItemConfig,
  DockItemLayout,
  DockItemRenderer,
  DockItemRendererContext,
  DockSlotContent,
  DockSlotName,
  DockSlotRenderer,
  DockSlotRendererContext,
  DesktopIconConfig,
  DesktopIconContent,
  DesktopIconRenderer,
  DesktopIconRendererContext,
  DesktopItemsEvent,
  DesktopItemsSource,
  DockPosition,
  WindowManagerLike,
} from './types.js';
export type {
  DesktopCollectionChangedEvent,
  DesktopCollectionChangeAction,
  DesktopCollectionMutationOptions,
  DesktopCollectionViewOptions,
} from './DesktopCollectionView.js';
export type {
  SystemTrayBadge,
  SystemTrayEvent,
  SystemTrayItemConfig,
  SystemTrayItemEvent,
  SystemTrayItemPatch,
  SystemTrayItemRenderer,
  SystemTrayItemRendererContext,
  SystemTrayItemsChangedEvent,
  SystemTrayItemsChangeReason,
  SystemTrayOptions,
} from './SystemTray.js';
