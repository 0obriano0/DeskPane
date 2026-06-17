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

export const demoApps: DemoAppDefinition[] = [
  { id: 'guide', icon: '🧩', label: 'Vue 指南', title: 'Vue 3 整合指南', component: markRaw(GuideApp), width: 520, height: 420, x: 60, y: 40 },
  { id: 'settings', icon: '⚙️', label: '系統設定', title: '系統設定', component: markRaw(SettingsApp), width: 520, height: 430, x: 90, y: 60 },
  { id: 'editor', icon: '📝', label: '文字編輯', title: 'Vue 文字編輯器', component: markRaw(EditorApp), width: 560, height: 380, x: 100, y: 60 },
  { id: 'todo', icon: '✅', label: '待辦清單', title: 'Vue 待辦清單', component: markRaw(TodoApp), width: 360, height: 440, x: 140, y: 80 },
  { id: 'counter', icon: '🔢', label: 'Keep-Alive', title: 'Keep-Alive 計數器', component: markRaw(CounterApp), width: 320, height: 380, x: 180, y: 100 },
  { id: 'calc', icon: '🧮', label: '計算機', title: 'Vue 計算機', component: markRaw(CalcApp), width: 300, height: 400, x: 220, y: 60 },
  { id: 'settings-confirm', icon: '🔴', label: '確認操作', title: '確認操作', component: markRaw(SettingsConfirmDialog), width: 340, height: 220, x: 160, y: 120, showInDesktop: false, resizable: false },
  { id: 'settings-properties', icon: '🔵', label: '進階屬性', title: '進階屬性', component: markRaw(SettingsPropertiesPanel), width: 300, height: 260, x: 180, y: 140, showInDesktop: false },
]

export const demoAppMap = new Map(demoApps.map(app => [app.id, app]))

export function createDesktopIcons(openApp: (appId: string) => void): DesktopIconConfig[] {
  return demoApps.filter(app => app.showInDesktop !== false).map(app => ({
    id: 'icon-' + app.id,
    label: app.label,
    icon: app.icon,
    action: () => openApp(app.id),
  }))
}
