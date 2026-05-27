export interface NavItem {
  id: string
  label: string
}

export interface NavCategory {
  label: string
  items: NavItem[]
}

export function getNavConfig(t: (key: string) => string): NavCategory[] {
  return [
    {
      label: t('nav.gettingStarted'),
      items: [
        { id: 'overview',     label: t('nav.overview') },
        { id: 'installation', label: t('nav.installation') },
        { id: 'quick-start',  label: t('nav.quickStart') },
      ],
    },
    {
      label: t('nav.coreApi'),
      items: [
        { id: 'wm-options', label: t('nav.wmOptions') },
        { id: 'open-close', label: t('nav.openClose') },
        { id: 'min-max',    label: t('nav.minMax') },
        { id: 'snap',       label: t('nav.snap') },
        { id: 'events',     label: t('nav.events') },
      ],
    },
    {
      label: t('nav.theming'),
      items: [
        { id: 'theme-system', label: t('nav.themeSystem') },
      ],
    },
    {
      label: t('nav.desktopModule'),
      items: [
        { id: 'desktop',       label: t('nav.desktopDock') },
        { id: 'border-layout', label: t('nav.borderLayout') },
      ],
    },
    {
      label: t('nav.workspaceModule'),
      items: [
        { id: 'workspace-manager', label: t('nav.workspaceManager') },
        { id: 'task-view',         label: t('nav.taskView') },
        { id: 'session-manager',   label: t('nav.sessionManager') },
      ],
    },
    {
      label: t('nav.vanillaJs'),
      items: [
        { id: 'hello-world', label: t('nav.helloWorld') },
        { id: 'dom-content', label: t('nav.domContent') },
        { id: 'jquery',      label: t('nav.jquery') },
      ],
    },
    {
      label: t('nav.vue3'),
      items: [
        { id: 'vue-composable', label: t('nav.vueComposable') },
        { id: 'vue-keepalive',  label: t('nav.vueKeepAlive') },
      ],
    },
    {
      label: t('nav.react'),
      items: [
        { id: 'react', label: t('nav.reactComposable') },
      ],
    },
  ]
}
