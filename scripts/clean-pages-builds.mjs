import { existsSync, renameSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const targets = [
  'demo/vue/dist',
  'demo/react/dist',
  'demo/docs/dist',
  '.pages',
];

function removeOrStash(relativePath) {
  const target = path.join(root, relativePath);
  if (!existsSync(target)) return;

  try {
    rmSync(target, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
    return;
  } catch (error) {
    if (!existsSync(target)) return;
    const safeName = relativePath.replace(/[\\/]/g, '-').replace(/^\./, 'dot-');
    const staleTarget = path.join(root, `.pages-stale-${safeName}-${Date.now()}`);
    console.warn(`Could not remove ${relativePath}; moving old output to ${path.basename(staleTarget)}.`);
    renameSync(target, staleTarget);
  }
}

targets.forEach(removeOrStash);
console.log('Cleaned Pages demo build outputs.');
