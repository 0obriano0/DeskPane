// scripts/build-themes.mjs
// 將 src/themes/ 下的 CSS 檔案複製到 dist/themes/ 及各 demo 的 public/themes/
// 將 src/styles/ 下的 CSS 檔案複製到 dist/styles/

import { copyFileSync, cpSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const src  = join(root, 'src', 'themes');

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function retrySync(action, retries = 10, delayMs = 250) {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return action();
    } catch (error) {
      lastError = error;
      if (attempt < retries) sleep(delayMs);
    }
  }
  throw lastError;
}

const targets = [
  join(root, 'dist',          'themes'),
  join(root, 'demo', 'vue',   'public', 'themes'),
  join(root, 'demo', 'react', 'public', 'themes'),
];

for (const dest of targets) {
  mkdirSync(dest, { recursive: true });
  for (const file of readdirSync(src).filter((name) => name.endsWith('.css'))) {
    retrySync(() => copyFileSync(join(src, file), join(dest, file)));
  }
  const assetsSrc = join(src, 'assets');
  if (existsSync(assetsSrc)) {
    retrySync(() => cpSync(assetsSrc, join(dest, 'assets'), { recursive: true }));
  }
  console.log(`✅ ${dest.replace(root + '\\', '')} — 主題 CSS 已複製`);
}

// Copy src/styles/ → dist/styles/
const stylesSrc  = join(root, 'src', 'styles');
const stylesDest = join(root, 'dist', 'styles');
mkdirSync(stylesDest, { recursive: true });
retrySync(() => cpSync(stylesSrc, stylesDest, { recursive: true, filter: (s) => s === stylesSrc || s.endsWith('.css') }));
console.log(`✅ dist/styles — 預設樣式 CSS 已複製`);
