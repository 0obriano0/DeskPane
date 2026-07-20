import { WindowManager } from '../../dist/deskpane.es.js';
import { Desktop, SystemTray } from '../../dist/deskpane-desktop.es.js';
import { ContextMenu, StartMenu } from '../../dist/deskpane-menu.es.js';

const root = document.getElementById('desktop-root');
const shell = document.getElementById('xp-shell');

function svgIcon(name) {
  const icons = {
    computer: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" aria-hidden="true"><defs><linearGradient id="xp-monitor" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#eef7ff"/><stop offset="1" stop-color="#6d92b6"/></linearGradient></defs><rect x="7" y="8" width="48" height="37" rx="3" fill="url(#xp-monitor)" stroke="#244a76" stroke-width="2"/><rect x="12" y="13" width="38" height="26" fill="#2d80c4"/><path d="M14 36 30 21l8 7 12-10v21H12Z" fill="#84c558"/><path d="M24 47h15l3 7H20Z" fill="#d6dce4" stroke="#5b6b79"/><rect x="17" y="54" width="30" height="4" rx="2" fill="#647484"/></svg>`,
    documents: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" aria-hidden="true"><path d="M5 19h22l5-7h25v40a5 5 0 0 1-5 5H10a5 5 0 0 1-5-5Z" fill="#e8b42f" stroke="#875e00" stroke-width="2"/><path d="M6 23h51l-6 31H11Z" fill="#ffd86a"/><path d="M18 28h31v21H18Z" fill="#fffdf2" stroke="#8295aa"/><path d="M23 34h21M23 40h17" stroke="#6e8fb3" stroke-width="2"/></svg>`,
    network: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="29" r="22" fill="#4c9ad7" stroke="#174f84" stroke-width="2"/><path d="M10 29h44M32 7c8 8 11 15 11 22S40 44 32 51M32 7c-8 8-11 15-11 22s3 15 11 22" fill="none" stroke="#eaf7ff" stroke-width="2"/><rect x="38" y="40" width="20" height="15" rx="2" fill="#e8eef5" stroke="#405a75" stroke-width="2"/><rect x="42" y="44" width="12" height="7" fill="#51a86c"/></svg>`,
    recycle: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" aria-hidden="true"><path d="M14 17h36l-4 41H18Z" fill="#dff2f5" fill-opacity=".9" stroke="#527a86" stroke-width="2"/><path d="M11 13h42v6H11Zm12-7h18l4 7H19Z" fill="#a9d4dc" stroke="#527a86" stroke-width="2"/><path d="m26 27 5-5 5 5-3 1 4 7-5 3-4-7-2 2Zm15 16-2 7h-8v-6h5l-2-3Zm-18 6-4-6 4-7 5 3-3 5h4v6Z" fill="#3b9d56"/></svg>`,
    notepad: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" aria-hidden="true"><rect x="12" y="8" width="40" height="49" rx="3" fill="#fff" stroke="#526b86" stroke-width="2"/><path d="M19 20h26M19 28h26M19 36h22M19 44h18" stroke="#6593c5" stroke-width="2"/><path d="M18 5v8M28 5v8M38 5v8M48 5v8" stroke="#35536e" stroke-width="3"/></svg>`,
    control: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="25" fill="#f0efe7" stroke="#677b8e" stroke-width="2"/><path d="M32 14v7M32 43v7M14 32h7M43 32h7M19 19l5 5M40 40l5 5M45 19l-5 5M24 40l-5 5" stroke="#2474c5" stroke-width="5" stroke-linecap="round"/><circle cx="32" cy="32" r="10" fill="#ffc84b" stroke="#8b6400" stroke-width="2"/></svg>`,
  };
  return icons[name] ?? icons.computer;
}

function createIconNode(name) {
  const node = document.createElement('span');
  node.className = `xp-custom-icon xp-custom-icon--${name}`;
  node.innerHTML = svgIcon(name);
  return node;
}

function createStartButton() {
  const button = document.createElement('button');
  button.id = 'start-button';
  button.className = 'xp-start-button';
  button.type = 'button';
  button.setAttribute('aria-label', 'Open Start menu');
  button.innerHTML = '<span class="xp-start-mark" aria-hidden="true">DP</span><span>start</span>';
  return button;
}

const startButton = createStartButton();
const tray = new SystemTray({
  items: [
    { id: 'network', label: 'Network connected', icon: '↔', action: () => openApp('network') },
    { id: 'volume', label: 'Volume', icon: '♪', action: () => openApp('control') },
    {
      id: 'clock',
      label: 'Current time',
      interactive: false,
      renderer: () => {
        const clock = document.createElement('time');
        clock.className = 'xp-clock';
        return clock;
      },
    },
  ],
});
tray.getElement().classList.add('xp-tray');

const desktop = new Desktop({
  container: root,
  injectStyles: true,
  storageKey: 'dp-xp-demo',
  dragThreshold: 10,
  dock: {
    position: 'bottom',
    showLabels: true,
    iconSize: 30,
    itemLayout: 'taskbar',
    items: [],
    leading: startButton,
    trailing: tray.getElement(),
  },
  icons: [
    // Direct HTMLElement ownership remains stable until the item is removed.
    { id: 'icon-computer', label: 'My Computer', icon: createIconNode('computer'), x: 22, y: 18, action: () => openApp('computer') },
    // Renderers are best when collection refreshes should create fresh content.
    { id: 'icon-documents', label: 'My Documents', iconRenderer: () => createIconNode('documents'), x: 22, y: 112, action: () => openApp('documents') },
    { id: 'icon-network', label: 'My Network', iconRenderer: ({ container }) => { container.dataset.iconKind = 'network'; return createIconNode('network'); }, x: 22, y: 206, action: () => openApp('network') },
    { id: 'icon-recycle', label: 'Recycle Bin', iconRenderer: () => createIconNode('recycle'), x: 22, y: 300, action: () => openApp('recycle') },
  ],
});

const wm = new WindowManager({
  container: desktop.getElement(),
  isolated: true,
  snap: true,
  edgeSnap: true,
  injectStyles: true,
});

desktop.syncDockWithWindows(wm, {
  showWindowPreview: true,
  getDockItem: (_appId, event) => ({
    label: event.label ?? event.title ?? 'Window',
    icon: event.icon ?? svgIcon('computer'),
  }),
});

const apps = {
  computer: { id: 'xp-computer', title: 'My Computer', label: 'My Computer', icon: svgIcon('computer'), width: 760, height: 500, x: 260, y: 88, content: makeComputer },
  documents: { id: 'xp-documents', title: 'My Documents', label: 'My Documents', icon: svgIcon('documents'), width: 650, height: 430, x: 330, y: 118, content: makeDocuments },
  network: { id: 'xp-network', title: 'My Network Places', label: 'My Network', icon: svgIcon('network'), width: 620, height: 420, x: 380, y: 142, content: makeNetwork },
  recycle: { id: 'xp-recycle', title: 'Recycle Bin', label: 'Recycle Bin', icon: svgIcon('recycle'), width: 540, height: 350, x: 430, y: 165, content: makeRecycle },
  notepad: { id: 'xp-notepad', title: 'Untitled - DeskPad', label: 'DeskPad', icon: svgIcon('notepad'), width: 560, height: 390, x: 390, y: 105, content: makeNotepad },
  control: { id: 'xp-control', title: 'Control Panel', label: 'Control Panel', icon: svgIcon('control'), width: 620, height: 430, x: 350, y: 125, content: makeControlPanel },
  about: { id: 'xp-about', title: 'About DeskPane XP-like', label: 'About', icon: 'DP', width: 430, height: 300, x: 455, y: 180, content: makeAbout },
};

const startMenu = new StartMenu({
  anchor: startButton,
  target: shell,
  header: { label: 'DeskPane XP', icon: 'DP' },
  items: [
    { id: 'browser', label: 'My Computer', icon: svgIcon('computer'), action: () => openApp('computer') },
    { id: 'notepad', label: 'DeskPad', icon: svgIcon('notepad'), action: () => openApp('notepad') },
    { id: 'control', label: 'Control Panel', icon: svgIcon('control'), action: () => openApp('control') },
    { type: 'separator' },
    {
      id: 'programs',
      label: 'All Programs',
      icon: '▦',
      children: [
        { id: 'program-computer', label: 'Explorer', icon: svgIcon('computer'), action: () => openApp('computer') },
        { id: 'program-notepad', label: 'DeskPad', icon: svgIcon('notepad'), action: () => openApp('notepad') },
        { id: 'program-control', label: 'System Tools', icon: svgIcon('control'), action: () => openApp('control') },
      ],
    },
  ],
  secondaryItems: [
    { id: 'secondary-documents', label: 'My Documents', icon: svgIcon('documents'), action: () => openApp('documents') },
    { id: 'secondary-computer', label: 'My Computer', icon: svgIcon('computer'), action: () => openApp('computer') },
    { id: 'secondary-network', label: 'My Network Places', icon: svgIcon('network'), action: () => openApp('network') },
    { type: 'separator' },
    { id: 'secondary-control', label: 'Control Panel', icon: svgIcon('control'), action: () => openApp('control') },
    { id: 'help', label: 'Help and Support', icon: '?', action: () => openApp('about') },
  ],
  footerItems: [
    { id: 'logoff', label: 'Log Off', icon: '↪', action: () => openApp('about') },
    { id: 'shutdown', label: 'Shut Down', icon: '●', action: closeAllWindows },
  ],
});

const desktopMenu = new ContextMenu({
  target: shell,
  items: [
    { id: 'arrange', label: 'Arrange Icons By', children: [
      { id: 'arrange-name', label: 'Name', checked: true, action: () => desktop.refresh() },
      { id: 'arrange-grid', label: 'Align to Grid', checked: true, action: () => desktop.refresh() },
    ] },
    { id: 'refresh', label: 'Refresh', shortcut: 'F5', action: () => desktop.refresh() },
    { type: 'separator' },
    { id: 'new-note', label: 'New DeskPad Document', icon: svgIcon('notepad'), action: () => openApp('notepad') },
    { type: 'separator' },
    { id: 'properties', label: 'Properties', icon: svgIcon('control'), action: () => openApp('control') },
  ],
});
desktopMenu.bindTo(root.querySelector('.dp-desktop-icon-area') ?? root);

function openApp(name) {
  const app = apps[name];
  if (!app) return;
  if (wm.getState(app.id)) {
    wm.restore(app.id);
    wm.focus(app.id);
    return;
  }

  const bounds = desktop.getElement().getBoundingClientRect();
  const width = Math.min(app.width, Math.max(300, bounds.width - 24));
  const height = Math.min(app.height, Math.max(240, bounds.height - 56));
  const x = Math.max(4, Math.min(app.x, bounds.width - width - 8));
  const y = Math.max(4, Math.min(app.y, bounds.height - height - 44));

  wm.open({
    id: app.id,
    title: app.title,
    label: app.label,
    icon: app.icon,
    width,
    height,
    x,
    y,
    slotType: 'dom',
    content: app.content(),
  });
}

function closeAllWindows() {
  Object.values(apps).forEach(app => wm.close(app.id));
}

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([key, value]) => {
    if (key === 'class') node.className = value;
    else if (key === 'html') node.innerHTML = value;
    else if (key.startsWith('on') && typeof value === 'function') node.addEventListener(key.slice(2).toLowerCase(), value);
    else node.setAttribute(key, value);
  });
  children.forEach(child => node.append(child instanceof Node ? child : document.createTextNode(child)));
  return node;
}

function makeExplorerShell(title, hint, content) {
  return el('div', { class: 'xp-app xp-explorer' }, [
    el('div', { class: 'xp-menubar' }, ['File', '  Edit', '  View', '  Favorites', '  Tools', '  Help']),
    el('div', { class: 'xp-toolbar' }, [
      el('button', { type: 'button' }, ['← Back']),
      el('button', { type: 'button' }, ['→']),
      el('span', { class: 'xp-toolbar-separator' }),
      el('button', { type: 'button' }, ['Search']),
      el('button', { type: 'button' }, ['Folders']),
    ]),
    el('div', { class: 'xp-address' }, [el('span', {}, ['Address']), el('strong', {}, [title])]),
    el('div', { class: 'xp-explorer-content' }, [
      el('aside', { class: 'xp-tasks' }, [
        el('section', {}, [el('h3', {}, ['System Tasks']), el('a', { href: '#', onclick: event => event.preventDefault() }, ['View system information']), el('a', { href: '#', onclick: event => event.preventDefault() }, ['Add or remove programs'])]),
        el('section', {}, [el('h3', {}, ['Details']), el('p', {}, [hint])]),
      ]),
      el('section', { class: 'xp-folder-view' }, [content]),
    ]),
    el('div', { class: 'xp-statusbar' }, ['DeskPane Web Desktop']),
  ]);
}

function makeComputer() {
  const groups = el('div', { class: 'xp-drive-groups' }, [
    el('h2', {}, ['Files Stored on This Computer']),
    el('div', { class: 'xp-folder-grid' }, [
      folderTile('Shared Documents', svgIcon('documents')),
      folderTile('DeskPane Documents', svgIcon('documents')),
    ]),
    el('h2', {}, ['Hard Disk Drives']),
    el('div', { class: 'xp-folder-grid' }, [
      driveTile('Local Disk (C:)', 68),
      driveTile('Projects (D:)', 42),
    ]),
  ]);
  return makeExplorerShell('My Computer', 'Displays the files, folders, and modules available in this DeskPane demo.', groups);
}

function makeDocuments() {
  const files = el('div', { class: 'xp-folder-grid' }, [
    folderTile('DeskPane Examples', svgIcon('documents')),
    folderTile('Theme Drafts', svgIcon('documents')),
    folderTile('Release Notes.txt', svgIcon('notepad')),
    folderTile('Window Layouts', svgIcon('documents')),
  ]);
  return makeExplorerShell('My Documents', 'Contains sample documents generated for this original XP-like experience.', files);
}

function makeNetwork() {
  const devices = el('div', { class: 'xp-folder-grid' }, [
    folderTile('DESKPANE-DEV', svgIcon('computer')),
    folderTile('BUILD-SERVER', svgIcon('computer')),
    folderTile('DOCS-PREVIEW', svgIcon('network')),
  ]);
  return makeExplorerShell('My Network Places', 'Shows demonstration devices on the local DeskPane network.', devices);
}

function makeRecycle() {
  return makeExplorerShell('Recycle Bin', 'No files have been deleted in this demo session.', el('div', { class: 'xp-empty' }, [
    el('div', { html: svgIcon('recycle') }),
    el('strong', {}, ['The Recycle Bin is empty.']),
  ]));
}

function folderTile(label, icon) {
  return el('button', { class: 'xp-folder-tile', type: 'button' }, [el('span', { html: icon }), el('strong', {}, [label])]);
}

function driveTile(label, used) {
  return el('button', { class: 'xp-drive-tile', type: 'button' }, [
    el('span', { class: 'xp-drive-icon' }, ['▰']),
    el('span', {}, [el('strong', {}, [label]), el('i', {}, [`${100 - used} GB free`]), el('span', { class: 'xp-capacity' }, [el('span', { style: `width:${used}%` })])]),
  ]);
}

function makeNotepad() {
  return el('div', { class: 'xp-app xp-notepad' }, [
    el('div', { class: 'xp-menubar' }, ['File   Edit   Format   View   Help']),
    el('textarea', { spellcheck: 'false', 'aria-label': 'DeskPad editor' }, ['DeskPane XP-like demo\n\nThis window is real DOM content managed by WindowManager.\nTry dragging it to the top, left, or right edge.']),
  ]);
}

function makeControlPanel() {
  const options = [
    ['Display', 'Change desktop and theme appearance.'],
    ['Taskbar and System Tray', 'Inspect the official Dock slots and SystemTray module.'],
    ['Network Connections', 'View demonstration network devices.'],
    ['Window Behavior', 'Drag, resize, minimize, maximize, and edge snap.'],
  ];
  return el('div', { class: 'xp-app xp-control-panel' }, [
    el('header', {}, [el('h2', {}, ['Pick a category']), el('p', {}, ['These controls demonstrate ordinary DOM content inside DeskPane windows.'])]),
    el('div', { class: 'xp-control-grid' }, options.map(([title, desc], index) => el('button', { type: 'button', onclick: () => index === 2 ? openApp('network') : openApp('about') }, [
      el('span', { html: index === 2 ? svgIcon('network') : svgIcon('control') }),
      el('span', {}, [el('strong', {}, [title]), el('small', {}, [desc])]),
    ]))),
  ]);
}

function makeAbout() {
  return el('div', { class: 'xp-app xp-about' }, [
    el('div', { class: 'xp-about-logo' }, ['DP']),
    el('div', {}, [
      el('h2', {}, ['DeskPane XP-like']),
      el('p', {}, ['An original nostalgic desktop built with DeskPane Desktop, WindowManager, Dock synchronization, StartMenu, and ContextMenu.']),
      el('p', {}, ['No Windows system files, logos, icons, or virtual machine images are included.']),
    ]),
  ]);
}

function updateClock() {
  const clock = tray.getItemElement('clock')?.querySelector('.xp-clock');
  if (clock) clock.textContent = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(new Date());
}

updateClock();
setInterval(updateClock, 1000);
openApp('computer');

window.deskpaneXpDemo = { desktop, wm, startMenu, desktopMenu, openApp };
