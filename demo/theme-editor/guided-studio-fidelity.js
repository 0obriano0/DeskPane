(function polishGuidedStudio() {
  const basicButton = document.querySelector('.mode-btn[data-mode="basic"]');
  const advancedButton = document.querySelector('.mode-btn[data-mode="advanced"]');
  const modeToggle = document.querySelector('.mode-toggle');
  const guide = document.querySelector('.studio-guide');
  const zoomControls = document.querySelector('.studio-zoom');

  guide?.remove();
  if (zoomControls) {
    const nativeStatus = document.createElement('span');
    nativeStatus.textContent = 'DeskPane 原生拖曳與縮放';
    zoomControls.replaceWith(nativeStatus);
  }

  if (basicButton) basicButton.innerHTML = '<i class="ph ph-arrow-left" aria-hidden="true"></i><span>視覺設定</span>';
  if (advancedButton) advancedButton.innerHTML = '<span>進階 CSS</span><i class="ph ph-code" aria-hidden="true"></i>';

  modeToggle?.addEventListener('click', () => {
    requestAnimationFrame(() => {
      const inAdvancedMode = document.getElementById('panel-advanced')?.classList.contains('active');
      document.body.classList.toggle('studio-advanced-mode', Boolean(inAdvancedMode));
    });
  });

  const previewBodies = document.querySelectorAll('#core-preview-area .dp-body');
  const previewParagraphs = document.querySelectorAll('#core-preview-area .dp-body p');
  if (previewParagraphs[0]) previewParagraphs[0].textContent = '視窗樣式由右側設定即時控制。';
  if (previewBodies[1]) previewBodies[1].textContent = '次要視窗示範。邊框、陰影與標題列樣式會隨右側設定即時更新。';

  const restoreButton = [...(previewBodies[0]?.querySelectorAll('button') || [])]
    .find((button) => button.textContent.trim() === '還原');
  if (restoreButton) {
    restoreButton.onclick = () => {
      const mainWindow = document.querySelector('#core-preview-area .dp-window');
      if (mainWindow?.classList.contains('dp-maximized')) {
        mainWindow.querySelector('.dp-btn-max')?.click();
      }
    };
  }
})();
