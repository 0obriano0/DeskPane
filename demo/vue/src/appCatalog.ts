import { markRaw } from 'vue'
import type { DesktopIconConfig } from '@deskpane/desktop'
import type { DemoAppDefinition } from './types'

import GuideApp from './windows/GuideApp.vue'
import EditorApp from './windows/EditorApp.vue'
import TodoApp from './windows/TodoApp.vue'
import CounterApp from './windows/CounterApp.vue'
import CalcApp from './windows/CalcApp.vue'

export const demoApps: DemoAppDefinition[] = [
  { id: 'guide', icon: '🧩', label: 'Vue 指南', title: 'Vue 3 整合指南', component: markRaw(GuideApp), width: 520, height: 420, x: 60, y: 40 },
  { id: 'editor', icon: '📝', label: '文字編輯', title: 'Vue 文字編輯器', component: markRaw(EditorApp), width: 560, height: 380, x: 100, y: 60 },
  { id: 'todo', icon: '✅', label: '待辦清單', title: 'Vue 待辦清單', component: markRaw(TodoApp), width: 360, height: 440, x: 140, y: 80 },
  { id: 'counter', icon: '🔢', label: 'Keep-Alive', title: 'Keep-Alive 計數器', component: markRaw(CounterApp), width: 320, height: 380, x: 180, y: 100 },
  { id: 'calc', icon: '🧮', label: '計算機', title: 'Vue 計算機', component: markRaw(CalcApp), width: 300, height: 400, x: 220, y: 60 },
]

export const demoAppMap = new Map(demoApps.map(app => [app.id, app]))

export function createDesktopIcons(openApp: (appId: string) => void): DesktopIconConfig[] {
  return demoApps.map(app => ({
    id: 'icon-' + app.id,
    label: app.label,
    icon: app.icon,
    action: () => openApp(app.id),
  }))
}
