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
        { id: 'troubleshooting', label: t('nav.troubleshooting') },
      ],
    },
    {
      label: t('nav.coreApi'),
      items: [
        { id: 'wm-options', label: t('nav.wmOptions') },
        { id: 'open-close', label: t('nav.openClose') },
        { id: 'dom-content', label: t('nav.domContent') },
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
  ]
}
