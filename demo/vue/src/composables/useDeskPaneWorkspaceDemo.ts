import { onMounted, onUnmounted, ref, shallowRef } from 'vue'
import { Desktop } from '@deskpane/desktop'
import type { WindowManager } from '@deskpane/core/WindowManager'
import { getAppIdFromWorkspaceWindowId, TaskView, WorkspaceManager } from '@deskpane/workspace'
import { createDesktopIcons, demoAppMap, demoApps } from '../appCatalog'
import type { WindowTeleportEntry } from '../types'

const WINDOW_SYNC_EVENTS = [
  'window:opened',
  'window:closed',
  'window:focused',
  'window:minimized',
  'window:maximized',
  'window:restored',
] as const

function getAppIdFromWindowId(windowId: string): string {
  return getAppIdFromWorkspaceWindowId(windowId)
}

export function useDeskPaneWorkspaceDemo() {
  const desktopRootEl = ref<HTMLElement | null>(null)
  const windows = shallowRef<WindowTeleportEntry[]>([])

  let desktop: Desktop | null = null
  let workspaceManager: WorkspaceManager | null = null
  let taskView: TaskView | null = null
  const cleanup: Array<() => void> = []
  const subscribedWorkspaces = new Set<string>()
  const windowEntries = new Map<string, WindowTeleportEntry>()

  function openApp(appId: string) {
    const app = demoAppMap.get(appId)
    if (!app) return

    const current = workspaceManager?.current
    if (!current) return

    workspaceManager.openWindow({
      workspaceId: current.id,
      appId: app.id,
      title: app.title,
      icon: app.icon,
      label: app.label,
      slotType: 'vue',
      content: null,
      width: app.width,
      height: app.height,
      x: app.x,
      y: app.y,
    })

    syncWorkspaceWindows(current.id)
  }

  function publishWindowEntries() {
    windows.value = Array.from(windowEntries.values())
  }

  function syncWorkspaceWindows(workspaceId: string) {
    if (!workspaceManager) return

    try {
      const wm = workspaceManager.getWindowManager(workspaceId) as unknown as WindowManager
      const liveKeys = new Set<string>()

      wm.getWindowIds().forEach(id => {
        const bodyEl = wm.getBodyElement(id)
        if (!bodyEl) return

        const appId = getAppIdFromWindowId(id)
        const app = demoAppMap.get(appId)
        if (!app) return

        const key = `${workspaceId}:${id}`
        liveKeys.add(key)
        windowEntries.set(key, {
          workspaceId,
          id,
          bodyEl,
          component: app.component,
        })
      })

      Array.from(windowEntries.keys())
        .filter(key => key.startsWith(`${workspaceId}:`) && !liveKeys.has(key))
        .forEach(key => windowEntries.delete(key))

      publishWindowEntries()
    } catch {
      // Ignore transient sync calls while a workspace is being created/destroyed.
    }
  }

  function syncAllWorkspaceWindows() {
    workspaceManager?.workspaces.forEach(workspace => syncWorkspaceWindows(workspace.id))
  }

  function subscribeWorkspace(workspaceId: string) {
    if (!workspaceManager || subscribedWorkspaces.has(workspaceId)) return
    subscribedWorkspaces.add(workspaceId)

    const wm = workspaceManager.getWindowManager(workspaceId)
    WINDOW_SYNC_EVENTS.forEach(event => {
      cleanup.push(wm.events.on(event, () => syncWorkspaceWindows(workspaceId)))
    })
  }

  function mountDeskPane() {
    if (!desktopRootEl.value) return

    desktop = new Desktop({
      container: desktopRootEl.value,
      injectStyles: false,
      dragThreshold: 10,
      dock: { position: 'bottom', showLabels: true, iconSize: 44, items: [] },
      icons: createDesktopIcons(openApp),
    })

    workspaceManager = new WorkspaceManager(desktop.getElement(), {
      injectStyles: false,
      animationMs: 220,
      windowManagerOptions: { isolated: true, snap: true, injectStyles: false },
    })

    workspaceManager.addWorkspace({ id: 'ws-1', label: '桌面 1' })
    subscribeWorkspace('ws-1')
    desktop.syncDockWithWindows(workspaceManager.getWindowManager('ws-1'), {
      getAppIdFromWindowId,
    })

    cleanup.push(workspaceManager.events.on('workspace:added', ({ id }: { id: string }) => {
      subscribeWorkspace(id)
    }))

    cleanup.push(workspaceManager.events.on('workspace:switched', ({ to }: { to: string }) => {
      if (!desktop || !workspaceManager) return
      const wm = workspaceManager.getWindowManager(to) as unknown as WindowManager
      desktop.syncDockWithWindows(wm, {
        getAppIdFromWindowId,
      })
      wm.activateTopWindow()
      syncAllWorkspaceWindows()
    }))

    taskView = new TaskView(workspaceManager, { dock: desktop.getDock(), injectStyles: false })
    openApp(demoApps[0].id)
  }

  function disposeDeskPane() {
    cleanup.splice(0).forEach(dispose => dispose())
    taskView?.destroy()
    workspaceManager?.destroy()
    desktop?.destroy()
    taskView = null
    workspaceManager = null
    desktop = null
    subscribedWorkspaces.clear()
    windowEntries.clear()
    windows.value = []
  }

  onMounted(mountDeskPane)
  onUnmounted(disposeDeskPane)

  return {
    desktopRootEl,
    windows,
    openApp,
    getDesktop: () => desktop,
    getWorkspaceManager: () => workspaceManager,
  }
}
