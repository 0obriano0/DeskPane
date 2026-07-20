(function initGuidedStudio() {
  'use strict';

  const icon = (name, label = '') => `<i class="ph ph-${name}" aria-hidden="true"></i>${label ? `<span>${label}</span>` : ''}`;
  const body = document.body;
  const header = document.querySelector('.dh');
  const teBody = document.querySelector('.te-body');
  const editor = document.getElementById('var-editor-scroll');
  const inspector = document.querySelector('.te-left');
  const preview = document.querySelector('.te-right');
  const themeSelect = document.getElementById('theme-select');

  if (!header || !teBody || !editor || !inspector || !preview || !themeSelect) return;

  body.classList.add('studio-ready');

  const back = header.querySelector('.dh-back');
  back.innerHTML = icon('arrow-left', '返回');
  back.setAttribute('aria-label', '返回示範列表');

  const logo = header.querySelector('.dh-logo');
  logo.innerHTML = icon('palette');
  logo.setAttribute('aria-hidden', 'true');
  header.querySelector('.dh-title').textContent = 'DeskPane Theme Editor';
  header.querySelector('.dh-badge').textContent = 'Guided Studio';

  const actions = header.querySelector('.dh-actions');
  const themeLabel = actions.querySelector('span');
  if (themeLabel) themeLabel.textContent = '目前樣板';
  themeSelect.setAttribute('aria-label', '目前樣板');

  const undoButton = document.createElement('button');
  undoButton.type = 'button';
  undoButton.className = 'd-btn studio-history-button';
  undoButton.id = 'studio-undo';
  undoButton.innerHTML = icon('arrow-counter-clockwise', '復原');
  undoButton.title = '復原上一個樣式變更';

  const redoButton = document.createElement('button');
  redoButton.type = 'button';
  redoButton.className = 'd-btn studio-history-button';
  redoButton.id = 'studio-redo';
  redoButton.innerHTML = icon('arrow-clockwise', '重做');
  redoButton.title = '重做樣式變更';

  const exportButton = document.createElement('button');
  exportButton.type = 'button';
  exportButton.className = 'd-btn d-btn-accent studio-export-btn';
  exportButton.id = 'studio-export';
  exportButton.innerHTML = icon('export', '匯出主題');

  const saveButton = document.getElementById('btn-save-theme');
  saveButton.innerHTML = icon('floppy-disk', '儲存主題');
  const deleteButton = document.getElementById('btn-delete-theme');
  deleteButton.innerHTML = icon('trash');
  deleteButton.setAttribute('aria-label', '刪除目前自訂主題');
  actions.insertBefore(undoButton, saveButton);
  actions.insertBefore(redoButton, saveButton);
  actions.appendChild(exportButton);

  const guide = document.createElement('aside');
  guide.className = 'studio-guide';
  guide.setAttribute('aria-label', '主題製作流程');
  guide.innerHTML = `
    <div class="studio-guide-inner">
      <section class="studio-step is-active" data-step="templates">
        <span class="studio-step-number">1</span>
        <h2 class="studio-step-title">選擇樣板</h2>
        <p class="studio-step-copy">從內建風格開始，再調整成自己的主題。</p>
        <div class="studio-template-list">
          <button class="studio-template" type="button" data-theme="preset-dark"><img src="./assets/presets/dark.jpg" alt="深色樣板預覽"><span>預設深色</span></button>
          <button class="studio-template" type="button" data-theme="preset-light"><img src="./assets/presets/light.jpg" alt="淺色樣板預覽"><span>明亮淺色</span></button>
          <button class="studio-template" type="button" data-theme="preset-blue"><img src="./assets/presets/midnight-blue.jpg" alt="午夜藍樣板預覽"><span>午夜藍</span></button>
          <button class="studio-template" type="button" data-theme="preset-solarized"><img src="./assets/presets/solarized.jpg" alt="Solarized 樣板預覽"><span>Solarized</span></button>
        </div>
      </section>
      <section class="studio-step" data-step="adjust" tabindex="0" role="button" aria-label="前往調整樣式">
        <span class="studio-step-number">2</span>
        <h2 class="studio-step-title">調整樣式</h2>
        <p class="studio-step-copy">使用右側分類設定，預覽會立即更新。</p>
      </section>
      <section class="studio-step" data-step="export" tabindex="0" role="button" aria-label="前往匯出使用">
        <span class="studio-step-number">3</span>
        <h2 class="studio-step-title">匯出使用</h2>
        <p class="studio-step-copy">複製或下載可直接使用的主題 CSS。</p>
      </section>
      <div class="studio-tip">${icon('lightbulb')}<span>先調整「色彩」與「視窗外觀」，通常就能完成大部分主題。</span></div>
    </div>`;
  teBody.insertBefore(guide, teBody.firstChild);
  teBody.appendChild(inspector);

  const previewHeading = document.createElement('div');
  previewHeading.className = 'studio-preview-heading';
  previewHeading.innerHTML = `
    <div><h1>即時預覽</h1><p>變更會立即套用到這個示範桌面。</p></div>
    <span class="studio-status">即時同步</span>`;
  preview.insertBefore(previewHeading, preview.firstChild);

  const previewFooter = document.createElement('div');
  previewFooter.className = 'studio-preview-footer';
  previewFooter.innerHTML = `
    <span>裝置 <strong>Desktop</strong></span>
    <div class="studio-zoom">
      <span>縮放</span>
      <button type="button" data-zoom="out" aria-label="縮小預覽">${icon('minus')}</button>
      <strong id="studio-zoom-value">100%</strong>
      <button type="button" data-zoom="in" aria-label="放大預覽">${icon('plus')}</button>
      <button type="button" data-zoom="fit" aria-label="符合視窗">${icon('arrows-out-simple')}</button>
    </div>`;
  preview.appendChild(previewFooter);

  const inspectorHeading = document.createElement('div');
  inspectorHeading.className = 'studio-inspector-heading';
  inspectorHeading.innerHTML = '<h2>調整樣式</h2><p>以常用設定快速完成主題，必要時再進入進階 CSS。</p>';
  inspector.insertBefore(inspectorHeading, inspector.firstChild);

  const basicModeButton = document.querySelector('[data-mode="basic"]');
  const advancedModeButton = document.querySelector('[data-mode="advanced"]');
  basicModeButton.innerHTML = icon('sliders-horizontal', '視覺設定');
  advancedModeButton.innerHTML = icon('code', '進階 CSS');
  document.querySelector('[data-preview="window"]').innerHTML = icon('app-window', '視窗');
  document.querySelector('[data-preview="desktop"]').innerHTML = icon('monitor', '桌面');

  const friendlyLabels = {
    '--dp-window-border': '一般邊框',
    '--dp-window-border-active': '焦點邊框',
    '--dp-window-shadow': '一般陰影',
    '--dp-window-shadow-active': '焦點陰影',
    '--dp-window-header-bg': '標題列背景',
    '--dp-window-header-border': '標題列分隔線',
    '--dp-window-title-color': '標題文字',
    '--dp-layout-header-bg': '面板標頭背景',
    '--dp-layout-header-border': '面板標頭分隔線',
    '--dp-layout-title-color': '面板標題文字',
    '--dp-layout-btn-color': '面板按鈕',
    '--dp-layout-btn-hover-bg': '面板按鈕滑過',
    '--dp-layout-splitter-bg': '分隔拖曳條',
    '--dp-layout-splitter-active': '分隔拖曳焦點',
    '--dp-window-btn-color': '視窗控制按鈕',
    '--dp-window-btn-hover-bg': '控制按鈕滑過',
    '--dp-window-btn-close-hover-bg': '關閉按鈕滑過',
    '--dp-window-btn-close-hover-color': '關閉按鈕圖示',
    '--dp-window-body-bg': '視窗內容背景',
    '--dp-window-body-color': '視窗內容文字',
    '--dp-snap-guide-color': '吸附引導線',
    '--dp-edge-snap-preview-bg': '吸附預覽背景',
    '--dp-edge-snap-preview-border': '吸附預覽邊框',
    '--dp-edge-snap-preview-inner-border': '吸附預覽內框',
    '--dp-edge-snap-preview-radius': '吸附預覽圓角',
    '--dp-desktop-bg': '桌面背景',
    '--dp-desktop-icon-text': '桌面圖示文字',
    '--dp-dock-bg': 'Dock 背景',
    '--dp-dock-backdrop-filter': 'Dock 模糊效果',
    '--dp-dock-border': 'Dock 邊框',
    '--dp-font': '介面字體',
    '--dp-desktop-icon-hover-bg': '桌面圖示滑過',
    '--dp-dock-item-hover-bg': 'Dock 項目滑過'
  };

  const categories = [
    {
      title: '色彩', hint: '主色、背景與文字', icon: 'palette', open: true,
      vars: ['--dp-window-border-active', '--dp-window-header-bg', '--dp-window-body-bg', '--dp-window-body-color', '--dp-layout-header-bg', '--dp-window-title-color']
    },
    {
      title: '視窗外觀', hint: '邊框、陰影與內容', icon: 'app-window',
      vars: ['--dp-window-border', '--dp-window-shadow', '--dp-window-shadow-active', '--dp-window-header-border']
    },
    {
      title: '標題列與面板', hint: '標題與區塊標頭', icon: 'rows',
      vars: ['--dp-layout-header-border', '--dp-layout-title-color', '--dp-layout-btn-color', '--dp-layout-btn-hover-bg', '--dp-layout-splitter-bg', '--dp-layout-splitter-active']
    },
    {
      title: '按鈕與控制項', hint: '視窗按鈕與互動狀態', icon: 'cursor-click',
      vars: ['--dp-window-btn-color', '--dp-window-btn-hover-bg', '--dp-window-btn-close-hover-bg', '--dp-window-btn-close-hover-color']
    },
    {
      title: '桌面與 Dock', hint: '桌面背景與快捷列', icon: 'monitor',
      vars: ['--dp-desktop-bg', '--dp-desktop-icon-text', '--dp-dock-bg', '--dp-dock-backdrop-filter', '--dp-dock-border', '--dp-desktop-icon-hover-bg', '--dp-dock-item-hover-bg']
    },
    {
      title: '字體', hint: '全域介面字體', icon: 'text-aa',
      vars: ['--dp-font']
    },
    {
      title: '吸附預覽', hint: '拖曳視窗時的提示', icon: 'selection',
      vars: ['--dp-snap-guide-color', '--dp-edge-snap-preview-bg', '--dp-edge-snap-preview-border', '--dp-edge-snap-preview-inner-border', '--dp-edge-snap-preview-radius']
    }
  ];

  const rowsByVariable = new Map();
  editor.querySelectorAll('.var-row').forEach((row) => {
    const label = row.querySelector('.var-label');
    const variable = label.textContent.trim();
    rowsByVariable.set(variable, row);
    label.textContent = friendlyLabels[variable] || variable;
    label.title = `${friendlyLabels[variable] || variable}\n${variable}`;
    const labelId = `label-${variable.slice(2).replace(/[^a-z0-9]+/gi, '-')}`;
    label.id = labelId;
    row.querySelectorAll('input, button').forEach((control) => {
      if (!control.getAttribute('aria-label') && !control.getAttribute('aria-labelledby')) {
        control.setAttribute('aria-labelledby', labelId);
      }
    });
  });

  const fragment = document.createDocumentFragment();
  categories.forEach((category, categoryIndex) => {
    const group = document.createElement('section');
    group.className = `var-group${category.open ? '' : ' is-collapsed'}`;
    const title = document.createElement('div');
    title.className = 'var-group-title';
    title.setAttribute('role', 'button');
    title.setAttribute('tabindex', '0');
    title.setAttribute('aria-expanded', category.open ? 'true' : 'false');
    title.innerHTML = `<span>${icon(category.icon)} <span>${category.title}<small>${category.hint}</small></span></span>${icon(category.open ? 'caret-up' : 'caret-down')}`;
    const groupBody = document.createElement('div');
    groupBody.className = 'var-group-body';
    category.vars.forEach((variable) => {
      const row = rowsByVariable.get(variable);
      if (row) groupBody.appendChild(row);
    });
    const toggle = () => {
      const collapsed = group.classList.toggle('is-collapsed');
      title.setAttribute('aria-expanded', String(!collapsed));
      title.lastElementChild.className = `ph ph-caret-${collapsed ? 'down' : 'up'}`;
      if (!collapsed) setActiveStep('adjust');
    };
    title.addEventListener('click', toggle);
    title.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); toggle(); }
    });
    group.append(title, groupBody);
    group.dataset.categoryIndex = String(categoryIndex);
    fragment.appendChild(group);
  });
  editor.replaceChildren(fragment);

  document.querySelector('.export-panel-title').innerHTML = icon('export', '匯出主題 CSS');
  document.getElementById('btn-copy-all').innerHTML = icon('copy', '完整 CSS');
  document.getElementById('btn-copy-core').textContent = '視窗 Core';
  document.getElementById('btn-copy-desktop').textContent = '桌面 Desktop';
  document.getElementById('btn-dl-all').innerHTML = icon('download-simple', '下載');

  document.getElementById('cfe-btn-apply').innerHTML = icon('play', '套用');
  document.getElementById('cfe-btn-reset').innerHTML = icon('arrow-counter-clockwise', '重置');
  document.getElementById('cfe-btn-copy').innerHTML = icon('copy', '複製');
  document.getElementById('cfe-btn-download').innerHTML = icon('download-simple', '下載');
  document.querySelectorAll('.cfe-preset-btn').forEach((button) => {
    button.textContent = button.textContent.replace(/^[^\w\u4e00-\u9fff]+/u, '').trim();
  });

  const steps = [...guide.querySelectorAll('.studio-step')];
  function setActiveStep(stepName) {
    steps.forEach((step) => step.classList.toggle('is-active', step.dataset.step === stepName));
  }

  function updateTemplateSelection() {
    guide.querySelectorAll('.studio-template').forEach((button) => {
      button.classList.toggle('is-selected', button.dataset.theme === themeSelect.value);
    });
  }

  guide.querySelectorAll('.studio-template').forEach((button) => {
    button.addEventListener('click', () => {
      themeSelect.value = button.dataset.theme;
      themeSelect.dispatchEvent(new Event('change', { bubbles: true }));
      updateTemplateSelection();
      setActiveStep('adjust');
      inspector.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });

  steps.find((step) => step.dataset.step === 'adjust').addEventListener('click', () => {
    setActiveStep('adjust');
    inspector.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    editor.querySelector('.var-group-title')?.focus();
  });
  steps.find((step) => step.dataset.step === 'export').addEventListener('click', () => {
    setActiveStep('export');
    document.querySelector('.export-panel').scrollIntoView({ behavior: 'smooth', block: 'end' });
    document.getElementById('btn-copy-all').focus();
  });

  let undoStack = [];
  let redoStack = [];
  let lastSnapshot = snapshot();
  let pendingBefore = null;
  let historyTimer = null;

  function snapshot() {
    return JSON.stringify({ core: coreValues, desktop: desktopValues });
  }

  function restore(snapshotValue) {
    const state = JSON.parse(snapshotValue);
    Object.assign(coreValues, state.core);
    Object.assign(desktopValues, state.desktop);
    applyAllVars(coreValues);
    applyAllVars(desktopValues);
    syncEditorToValues('var-editor-scroll', CORE_VAR_DEFS, coreValues);
    syncEditorToValues('var-editor-scroll', DESKTOP_VAR_DEFS, desktopValues);
    lastSnapshot = snapshot();
    updateHistoryButtons();
    markStatus('已復原變更', true);
  }

  function commitHistory() {
    historyTimer = null;
    const current = snapshot();
    if (pendingBefore && current !== pendingBefore) {
      undoStack.push(pendingBefore);
      if (undoStack.length > 60) undoStack.shift();
      redoStack = [];
      lastSnapshot = current;
      markStatus('尚未儲存', false);
      setActiveStep('adjust');
    }
    pendingBefore = null;
    updateHistoryButtons();
  }

  function updateHistoryButtons() {
    undoButton.disabled = undoStack.length === 0;
    redoButton.disabled = redoStack.length === 0;
  }

  function markStatus(text, saved) {
    const status = previewHeading.querySelector('.studio-status');
    status.textContent = text;
    status.style.color = saved ? '#86efac' : '#fbbf24';
  }

  editor.addEventListener('input', () => {
    if (!pendingBefore) pendingBefore = lastSnapshot;
    clearTimeout(historyTimer);
    historyTimer = setTimeout(commitHistory, 220);
  });

  undoButton.addEventListener('click', () => {
    if (!undoStack.length) return;
    redoStack.push(snapshot());
    restore(undoStack.pop());
  });
  redoButton.addEventListener('click', () => {
    if (!redoStack.length) return;
    undoStack.push(snapshot());
    restore(redoStack.pop());
  });

  themeSelect.addEventListener('change', () => {
    const current = snapshot();
    if (current !== lastSnapshot) undoStack.push(lastSnapshot);
    redoStack = [];
    lastSnapshot = current;
    updateHistoryButtons();
    updateTemplateSelection();
    markStatus('已套用樣板', true);
  });

  saveButton.addEventListener('click', () => markStatus('已儲存主題', true));
  exportButton.addEventListener('click', () => {
    setActiveStep('export');
    document.getElementById('btn-dl-all').click();
  });
  document.querySelector('.export-panel').addEventListener('click', () => setActiveStep('export'));

  let zoom = 100;
  const zoomValue = document.getElementById('studio-zoom-value');
  const previewSubs = [...document.querySelectorAll('.preview-sub')];
  function applyZoom(nextZoom) {
    zoom = Math.max(80, Math.min(120, nextZoom));
    previewSubs.forEach((sub) => {
      sub.style.transform = `scale(${zoom / 100})`;
      sub.style.transformOrigin = 'center center';
    });
    zoomValue.textContent = `${zoom}%`;
  }
  previewFooter.addEventListener('click', (event) => {
    const button = event.target.closest('[data-zoom]');
    if (!button) return;
    if (button.dataset.zoom === 'out') applyZoom(zoom - 10);
    if (button.dataset.zoom === 'in') applyZoom(zoom + 10);
    if (button.dataset.zoom === 'fit') applyZoom(100);
  });

  document.querySelector('.mode-toggle').addEventListener('click', (event) => {
    const modeButton = event.target.closest('.mode-btn');
    if (!modeButton) return;
    body.classList.toggle('studio-advanced-mode', modeButton.dataset.mode === 'advanced');
    setActiveStep('adjust');
  });

  updateTemplateSelection();
  updateHistoryButtons();
})();
