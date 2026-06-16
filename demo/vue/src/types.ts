import type { Component } from 'vue'

export interface DemoAppDefinition {
  id: string
  icon: string
  label: string
  title: string
  component: Component
  width: number
  height: number
  x: number
  y: number
}

export interface WindowTeleportEntry {
  workspaceId: string
  id: string
  bodyEl: HTMLElement
  component: Component
}
