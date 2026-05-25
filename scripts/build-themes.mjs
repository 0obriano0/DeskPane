// scripts/build-themes.mjs
// 將 src/themes/ 下的 CSS 檔案複製到 dist/themes/ 及各 demo 的 public/themes/

import { cpSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const src  = join(root, 'src', 'themes');

const targets = [
  join(root, 'dist',          'themes'),
  join(root, 'demo', 'vue',   'public', 'themes'),
  join(root, 'demo', 'react', 'public', 'themes'),
];

for (const dest of targets) {
  mkdirSync(dest, { recursive: true });
  cpSync(src, dest, { recursive: true, filter: (s) => !s.endsWith('.ts') });
  console.log(`✅ ${dest.replace(root + '\\', '')} — 主題 CSS 已複製`);
}
