// ============================================================
// DeskPane-Workspace — Public Entry Point
// ============================================================

export {
  WorkspaceManager,
  createWorkspaceWindowId,
  getAppIdFromWorkspaceWindowId,
  getWorkspaceCSS,
  parseWorkspaceWindowId,
} from './WorkspaceManager.js';
export type {
  WorkspaceConfig,
  WorkspaceManagerOptions,
  WorkspaceOpenWindowConfig,
  WorkspaceState,
  WorkspaceWindowIdOptions,
  WorkspaceWindowIdParts,
} from './types.js';
export type { WorkspaceEvent } from './WorkspaceManager.js';

export { TaskView, getTaskViewCSS } from './TaskView.js';
export type { TaskViewOptions, DockLike } from './types.js';
export type { TaskViewEvent } from './TaskView.js';

export { SessionManager } from '../session/SessionManager.js';
export type { WindowSnapshot, WorkspaceSnapshot, SessionSnapshot, AppRegistry } from '../session/types.js';
