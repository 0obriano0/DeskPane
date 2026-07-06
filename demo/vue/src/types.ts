import type { Component } from 'vue'

export interface DemoAppDefinition {
  id: string
  icon: string
  labelKey: string
  titleKey: string
  component: Component
  width: number
  height: number
  x: number
  y: number
  showInDesktop?: boolean
  resizable?: boolean
}

export interface WindowTeleportEntry {
  workspaceId: string
  id: string
  bodyEl: HTMLElement
  component: Component
  props?: Record<string, unknown>
}
