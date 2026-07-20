import { WindowManager } from '../../dist/deskpane.es.js';
import { Desktop } from '../../dist/deskpane-desktop.es.js';
import { ContextMenu, StartMenu } from '../../dist/deskpane-menu.es.js';

const root = document.getElementById('desktop-root');
const shell = document.getElementById('win7-root');

function icon(name) {
  const palettes = {
    computer: ['#55a9ed', '#0a3b73'],
    network: ['#8b99c3', '#293d66'],
    monitor: ['#ad7393', '#4a2448'],
  };
  const [a, b] = palettes[name] ?? palettes.computer;
  const mark = name === 'computer'
    ? '<path d="M4 38 L48 10 L48 20 L4 48 Z" fill="rgba(255,255,255,.9)"/>'
    : name === 'monitor'
      ? '<path d="M17 17 L37 37 M37 17 L17 37" stroke="rgba(255,255,255,.95)" stroke-width="4" stroke-linecap="round"/>'
      : '<rect x="16" y="18" width="22" height="16" fill="rgba(255,255,255,.92)"/>';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 54 48" aria-hidden="true">
    <defs><linearGradient id="g-${name}" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>
    <rect x="1" y="1" width="52" height="46" rx="4" fill="url(#g-${name})" stroke="rgba(255,255,255,.78)"/>
    <path d="M2 7 C16 0 33 0 52 6" fill="none" stroke="rgba(255,255,255,.38)" stroke-width="3"/>
    ${mark}
  </svg>`;
}

function createStartButton() {
  const button = document.createElement('button');
  button.id = 'start-button';
  button.className = 'win7-start-button';
  button.type = 'button';
  button.setAttribute('aria-label', 'Open Start menu');
  button.innerHTML = '<span aria-hidden="true"></span>Start';
  return button;
}

function createTray() {
  const tray = document.createElement('div');
  tray.className = 'win7-tray';
  tray.setAttribute('aria-label', 'System tray');

  const clock = document.createElement('time');
  clock.id = 'win7-clock';
  clock.className = 'win7-clock';
  tray.appendChild(clock);

  return { element: tray, clock };
}

const startButton = createStartButton();
const tray = createTray();
const clock = tray.clock;

const desktop = new Desktop({
  container: root,
  injectStyles: true,
  storageKey: 'dp-win7-demo',
  dragThreshold: 10,
  dock: {
    position: 'bottom',
    showLabels: true,
    iconSize: 42,
    itemLayout: 'taskbar',
    items: [],
    leading: startButton,
    trailing: tray.element,
  },
  icons: [
    { id: 'icon-computer', label: 'Computer', icon: icon('computer'), x: 28, y: 22, action: () => openApp('computer') },
    { id: 'icon-network', label: 'Network', icon: icon('network'), x: 28, y: 122, action: () => openApp('network') },
    { id: 'icon-monitor', label: 'Monitor', icon: icon('monitor'), x: 28, y: 222, action: () => openApp('monitor') },
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
    icon: event.icon ?? '🪟',
  }),
});

const apps = {
  computer: { id: 'app-computer', title: 'Computer', label: 'Computer', icon: '▣', width: 980, height: 600, x: 470, y: 135, content: makeComputer },
  network: { id: 'app-network', title: 'Network', label: 'Network', icon: '🔍', width: 680, height: 420, x: 560, y: 170, content: makeNetwork },
  monitor: { id: 'app-monitor', title: 'System Monitor', label: 'Monitor', icon: '?', width: 700, height: 460, x: 590, y: 190, content: makeMonitor },
  settings: { id: 'app-settings', title: '系統設定', label: '設定', icon: '⚙', width: 420, height: 320, x: 320, y: 150, content: makeSettings },
};

const startMenu = new StartMenu({
  anchor: startButton,
  target: shell,
  header: { label: 'DeskPane', icon: 'DP' },
  items: [
    { id: 'computer', label: 'Computer', icon: '▣', action: () => openApp('computer') },
    { id: 'documents', label: 'Documents', icon: '□', action: () => openApp('documents') },
    { id: 'network', label: 'Network', icon: '🔍', action: () => openApp('network') },
    { id: 'monitor', label: 'System Monitor', icon: '📊', action: () => openApp('monitor') },
    { type: 'separator' },
    {
      id: 'programs',
      label: 'All Programs',
      icon: '▦',
      children: [
        { id: 'grid', label: 'Data Grid', icon: '▦', action: () => openApp('grid') },
        { id: 'settings', label: 'System Settings', icon: '⚙', action: () => openApp('settings') },
      ],
    },
  ],
  secondaryItems: [
    { id: 'secondary-computer', label: 'Computer', action: () => openApp('computer') },
    { id: 'secondary-network', label: 'Network', action: () => openApp('network') },
    { id: 'help', label: 'Help and Support', action: () => openApp('computer', { tab: 'about' }) },
  ],
  footerItems: [
    { id: 'shutdown', label: 'Shut down', icon: '⏻', action: () => Object.values(apps).forEach(app => wm.close(app.id)) },
  ],
});

const desktopMenu = new ContextMenu({
  target: shell,
  items: [
    { id: 'open-computer', label: 'Open Computer', icon: '▣', action: () => openApp('computer') },
    { id: 'open-network', label: 'Open Network', icon: '🔍', action: () => openApp('network') },
    { type: 'separator' },
    { id: 'refresh', label: 'Refresh', shortcut: 'F5', action: () => desktop.refresh() },
    { id: 'settings', label: 'System Settings', icon: '⚙', action: () => openApp('settings') },
  ],
});
desktopMenu.bindTo(root.querySelector('.dp-desktop-icon-area') ?? root);

function openApp(name, options = {}) {
  if (name === 'documents') return openApp('computer', { tab: 'about' });
  if (name === 'grid') return openApp('computer', { tab: 'grid' });

  const app = apps[name];
  if (!app) return;
  const existing = wm.getState(app.id);
  if (existing) {
    wm.focus(app.id);
    if (name === 'computer' && options.tab) selectComputerTab(options.tab);
    return;
  }

  wm.open({
    id: app.id,
    title: app.title,
    label: app.label,
    icon: app.icon,
    width: Math.min(app.width, Math.max(360, window.innerWidth - 130)),
    height: Math.min(app.height, Math.max(280, window.innerHeight - 94)),
    x: Math.min(app.x, Math.max(8, window.innerWidth - app.width - 18)),
    y: Math.min(app.y, Math.max(8, window.innerHeight - app.height - 58)),
    slotType: 'dom',
    content: app.content(),
  });

  if (name === 'computer') selectComputerTab(options.tab ?? 'grid');
}

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([key, value]) => {
    if (key === 'class') node.className = value;
    else if (key === 'style') node.style.cssText = value;
    else if (key === 'html') node.innerHTML = value;
    else if (key.startsWith('on') && typeof value === 'function') node.addEventListener(key.slice(2).toLowerCase(), value);
    else node.setAttribute(key, value);
  });
  children.forEach(child => node.append(child instanceof Node ? child : document.createTextNode(child)));
  return node;
}

function makeComputer() {
  const wrap = el('div', { class: 'win7-app computer-app' });
  const tree = el('aside', { class: 'win7-pane west-pane' }, [
    el('div', { class: 'pane-title' }, ['West']),
    el('div', { class: 'win7-tree' }, [
      el('ul', {}, [
        el('li', { class: 'selected' }, ['▣ Computer', el('ul', {}, [
          el('li', { 'data-tab': 'grid' }, ['▦ DataGrid']),
          el('li', { 'data-tab': 'about' }, ['□ Documents']),
        ])]),
        el('li', { onclick: () => openApp('network') }, ['🔍 Network']),
        el('li', { onclick: () => openApp('monitor') }, ['? Monitor']),
      ]),
    ]),
  ]);

  const center = el('section', { class: 'win7-pane center-pane' }, [
    el('div', { class: 'pane-title' }, ['Center']),
    el('div', {}, [
      el('div', { class: 'win7-tabs' }, [
        el('button', { class: 'win7-tab', 'data-tab-button': 'about', onclick: () => selectComputerTab('about') }, ['About']),
        el('button', { class: 'win7-tab', 'data-tab-button': 'grid', onclick: () => selectComputerTab('grid') }, ['DataGrid']),
      ]),
      el('section', { class: 'tab-panel about-panel', 'data-tab-panel': 'about' }, [
        el('h2', {}, ['DeskPane Desktop']),
        el('p', {}, ['這個 Windows 7 風格桌面使用 DeskPane Desktop、WindowManager、Dock sync 與普通 HTML/CSS 組合而成。視窗可以拖曳、縮放、最大化、最小化，也支援 Windows-like 邊緣預覽吸附。']),
      ]),
      el('section', { class: 'tab-panel', 'data-tab-panel': 'grid' }, [makeGrid(createRows())]),
    ]),
  ]);

  wrap.append(tree, center);
  wrap.querySelectorAll('[data-tab]').forEach(item => item.addEventListener('click', () => selectComputerTab(item.dataset.tab)));
  return wrap;
}

function selectComputerTab(name) {
  const body = wm.getBodyElement?.('app-computer');
  if (!body) return;
  body.querySelectorAll('[data-tab-button]').forEach(btn => btn.classList.toggle('active', btn.dataset.tabButton === name));
  body.querySelectorAll('[data-tab-panel]').forEach(panel => panel.classList.toggle('active', panel.dataset.tabPanel === name));
}

function makeGrid(rows) {
  const headers = ['Item ID', 'Product ID', 'List Price', 'Unit Cost', 'Attribute', 'Status'];
  const keys = ['item', 'product', 'price', 'stock', 'attribute', 'status'];
  return el('table', { class: 'win7-grid' }, [
    el('thead', {}, [el('tr', {}, headers.map(h => el('th', {}, [h])))]),
    el('tbody', {}, rows.map(row => el('tr', {}, keys.map(key => el('td', {}, [String(row[key])]))))),
  ]);
}

function makeNetworkTable(rows) {
  const headers = ['裝置名稱', '類型', 'IP 位址', '狀態'];
  const keys = ['device', 'type', 'address', 'status'];
  return el('table', { class: 'win7-grid' }, [
    el('thead', {}, [el('tr', {}, headers.map(h => el('th', {}, [h])))]),
    el('tbody', {}, rows.map(row => el('tr', {}, keys.map(key => el('td', {}, [String(row[key])]))))),
  ]);
}

function makeNetwork() {
  return el('div', { class: 'win7-app intro-app' }, [
    el('header', { class: 'window-intro' }, [
      el('h2', {}, ['Network']),
      el('p', {}, ['區域網路上目前可用的裝置與連線狀態。']),
    ]),
    el('div', { class: 'network-list' }, [makeNetworkTable(createNetworkRows())]),
  ]);
}

function makeMonitor() {
  const rows = createMonitorRows();
  return el('div', { class: 'win7-app intro-app' }, [
    el('header', { class: 'window-intro' }, [
      el('h2', {}, ['System Monitor']),
      el('p', {}, ['最近六個時間點的 CPU、Memory 與 Disk 使用率。']),
    ]),
    el('div', { class: 'chart-wrap' }, [
      el('div', { class: 'chart' }, rows.map(row => el('div', {}, [
        el('div', { class: 'bar-group' }, [
          el('div', { class: 'bar cpu', style: `height:${row.cpu}%` }),
          el('div', { class: 'bar memory', style: `height:${row.memory}%` }),
          el('div', { class: 'bar disk', style: `height:${row.disk}%` }),
        ]),
        el('div', { class: 'chart-label' }, [row.time]),
      ]))),
      el('div', { class: 'legend' }, [
        el('span', { class: 'cpu-l' }, ['CPU']),
        el('span', { class: 'memory-l' }, ['Memory']),
        el('span', { class: 'disk-l' }, ['Disk']),
      ]),
    ]),
  ]);
}

function makeSettings() {
  return el('div', { class: 'win7-app settings-app' }, [
    el('h2', {}, ['系統設定']),
    el('div', { class: 'setting-row' }, [
      el('label', {}, ['視窗吸附間距']),
      el('input', { type: 'number', min: '0', max: '48', value: '0', oninput: event => wm.setSnapGap(Number(event.target.value) || 0) }),
    ]),

    el('p', {}, ['這個 demo 使用官方 StartMenu、ContextMenu 與 Dock leading/trailing slots；Start、執行中視窗和系統時鐘都由 DeskPane Dock 管理。']),
  ]);
}

function createRows() {
  return [
    { item: 'BST-1', product: 'FI-SW-01', price: 36.5, stock: 10, attribute: 'Large', status: 'P' },
    { item: 'BST-10', product: 'K9-DL-01', price: 18.5, stock: 12, attribute: 'Spotted Adult Female', status: 'P' },
    { item: 'BST-11', product: 'RP-SN-01', price: 38.5, stock: 12, attribute: 'Venomless', status: 'P' },
    { item: 'BST-12', product: 'RP-SN-01', price: 26.5, stock: 12, attribute: 'Rattleless', status: 'P' },
    { item: 'BST-13', product: 'RP-LL-02', price: 35.5, stock: 12, attribute: 'Green Adult', status: 'P' },
    { item: 'BST-14', product: 'FL-DSH-01', price: 158.5, stock: 12, attribute: 'Tailless', status: 'P' },
    { item: 'BST-15', product: 'FL-DLH-01', price: 83.5, stock: 12, attribute: 'With tail', status: 'P' },
    { item: 'BST-16', product: 'FL-DLH-02', price: 23.5, stock: 12, attribute: 'Adult Female', status: 'P' },
  ];
}

function createNetworkRows() {
  return [
    { device: 'OFFICE-PC', type: 'Computer', address: '192.168.1.12', status: 'Online' },
    { device: 'NAS-STORAGE', type: 'Storage', address: '192.168.1.20', status: 'Online' },
    { device: 'MEETING-TV', type: 'Display', address: '192.168.1.35', status: 'Standby' },
    { device: 'LASER-PRINTER', type: 'Printer', address: '192.168.1.42', status: 'Online' },
    { device: 'GUEST-LAPTOP', type: 'Computer', address: '192.168.1.58', status: 'Limited' },
  ];
}

function createMonitorRows() {
  return [
    { time: '10:00', cpu: 28, memory: 48, disk: 18 },
    { time: '10:05', cpu: 35, memory: 51, disk: 22 },
    { time: '10:10', cpu: 64, memory: 58, disk: 35 },
    { time: '10:15', cpu: 46, memory: 61, disk: 28 },
    { time: '10:20', cpu: 72, memory: 66, disk: 44 },
    { time: '10:25', cpu: 53, memory: 63, disk: 31 },
  ];
}

function updateClock() {
  clock.textContent = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit' }).format(new Date());
}


updateClock();
setInterval(updateClock, 1000);
openApp('computer', { tab: 'grid' });

window.deskpaneWin7Demo = { desktop, wm, startMenu, desktopMenu, openApp };
