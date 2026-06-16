import { cpSync, existsSync, mkdirSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pagesDir = path.join(root, '.pages');

function copyRequired(from, to) {
  const src = path.join(root, from);
  if (!existsSync(src)) {
    throw new Error(`Missing required Pages input: ${from}`);
  }
  cpSync(src, path.join(pagesDir, to), { recursive: true });
}

function resetPagesDir() {
  try {
    rmSync(pagesDir, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
    return;
  } catch (error) {
    if (!existsSync(pagesDir)) return;
    const staleDir = path.join(root, `.pages-stale-${Date.now()}`);
    console.warn(`Could not remove .pages directly; moving old output to ${path.basename(staleDir)}.`);
    renameSync(pagesDir, staleDir);
  }
}

resetPagesDir();
mkdirSync(pagesDir, { recursive: true });

writeFileSync(
  path.join(pagesDir, 'index.html'),
  '<!doctype html><meta charset="utf-8"><meta http-equiv="refresh" content="0; url=demo/index.html"><title>DeskPane Demo</title><a href="demo/index.html">DeskPane Demo</a>\n',
);

copyRequired('dist', 'dist');

copyRequired('demo/index.html', 'demo/index.html');
copyRequired('demo/shared', 'demo/shared');
copyRequired('demo/desktop', 'demo/desktop');
copyRequired('demo/theme-editor', 'demo/theme-editor');
copyRequired('demo/vanilla', 'demo/vanilla');
copyRequired('demo/jquery', 'demo/jquery');
copyRequired('demo/layout', 'demo/layout');

copyRequired('demo/vue/dist', 'demo/vue/dist');
copyRequired('demo/react/dist', 'demo/react/dist');
copyRequired('demo/docs/dist', 'demo/docs/dist');

console.log(`Prepared GitHub Pages artifact at ${path.relative(root, pagesDir)}`);
