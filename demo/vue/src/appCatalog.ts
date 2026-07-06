import { markRaw } from 'vue'
import type { DesktopIconConfig } from '@deskpane/desktop'
import type { DemoAppDefinition } from './types'

import GuideApp from './windows/GuideApp.vue'
import EditorApp from './windows/EditorApp.vue'
import TodoApp from './windows/TodoApp.vue'
import CounterApp from './windows/CounterApp.vue'
import CalcApp from './windows/CalcApp.vue'
import SettingsApp from './windows/SettingsApp.vue'
import SettingsConfirmDialog from './windows/SettingsConfirmDialog.vue'
import SettingsPropertiesPanel from './windows/SettingsPropertiesPanel.vue'

export type Translate = (key: string) => string

export const demoApps: DemoAppDefinition[] = [
  { id: 'guide', icon: '🧩', labelKey: 'apps.guide.label', titleKey: 'apps.guide.title', component: markRaw(GuideApp), width: 520, height: 420, x: 60, y: 40 },
  { id: 'settings', icon: '⚙️', labelKey: 'apps.settings.label', titleKey: 'apps.settings.title', component: markRaw(SettingsApp), width: 520, height: 460, x: 90, y: 60 },
  { id: 'editor', icon: '📝', labelKey: 'apps.editor.label', titleKey: 'apps.editor.title', component: markRaw(EditorApp), width: 560, height: 380, x: 100, y: 60 },
  { id: 'todo', icon: '✅', labelKey: 'apps.todo.label', titleKey: 'apps.todo.title', component: markRaw(TodoApp), width: 360, height: 440, x: 140, y: 80 },
  { id: 'counter', icon: '🔢', labelKey: 'apps.counter.label', titleKey: 'apps.counter.title', component: markRaw(CounterApp), width: 320, height: 380, x: 180, y: 100 },
  { id: 'calc', icon: '🧮', labelKey: 'apps.calc.label', titleKey: 'apps.calc.title', component: markRaw(CalcApp), width: 300, height: 400, x: 220, y: 60 },
  { id: 'settings-confirm', icon: '🔴', labelKey: 'apps.settingsConfirm.label', titleKey: 'apps.settingsConfirm.title', component: markRaw(SettingsConfirmDialog), width: 340, height: 220, x: 160, y: 120, showInDesktop: false, resizable: false },
  { id: 'settings-properties', icon: '🔵', labelKey: 'apps.settingsProperties.label', titleKey: 'apps.settingsProperties.title', component: markRaw(SettingsPropertiesPanel), width: 300, height: 260, x: 180, y: 140, showInDesktop: false },
]

export const demoAppMap = new Map(demoApps.map(app => [app.id, app]))

export function getAppTitle(app: DemoAppDefinition, t: Translate): string {
  return t(app.titleKey)
}

export function getAppLabel(app: DemoAppDefinition, t: Translate): string {
  return t(app.labelKey)
}

export function createDesktopIcons(openApp: (appId: string) => void, t: Translate): DesktopIconConfig[] {
  return demoApps.filter(app => app.showInDesktop !== false).map(app => ({
    id: 'icon-' + app.id,
    label: getAppLabel(app, t),
    icon: app.icon,
    action: () => openApp(app.id),
  }))
}
