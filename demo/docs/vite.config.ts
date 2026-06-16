import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import os from 'node:os'
import path from 'node:path'
import { readFileSync } from 'node:fs'

// Virtual module prefix — intentionally does NOT end in .css so Vite's CSS
// pipeline is not triggered on the virtual module.
const VIRTUAL_PREFIX = '\0deskpane-raw-css:'
const deskpaneSrcDir = path.normalize(fileURLToPath(new URL('../../src', import.meta.url))).replace(/\\/g, '/')

// Vite plugin: treat CSS files imported from DeskPane src TS files as raw string exports.
const srcCssRaw = {
  name: 'deskpane-src-css-raw',
  enforce: 'pre' as const,
  resolveId(id: string, importer?: string) {
    if (!id.endsWith('.css') || id.includes('?')) return
    const importerNorm = (importer ?? '').replace(/\\/g, '/')
    if (!importerNorm.startsWith(deskpaneSrcDir + '/')) return
    // Replace .css suffix with .rawcss so Vite's CSS pipeline doesn't intercept
    const cssAbsPath = path.resolve(path.dirname(importer!), id).replace(/\\/g, '/').replace(/\.css$/, '.rawcss')
    return VIRTUAL_PREFIX + cssAbsPath
  },
  load(id: string) {
    if (!id.startsWith(VIRTUAL_PREFIX)) return
    const cssPath = id.slice(VIRTUAL_PREFIX.length).replace(/\.rawcss$/, '.css')
    return `export default ${JSON.stringify(readFileSync(cssPath, 'utf-8'))};`
  },
}

export default defineConfig({
  base: './',
  plugins: [srcCssRaw, vue()],
  resolve: {
    alias: {
      '@deskpane': fileURLToPath(new URL('../../src', import.meta.url)),
    },
  },
  // Dropbox 同步安全：將 Vite 快取移至系統暫存目錄
  cacheDir: path.join(os.tmpdir(), 'vite-deskpane-docs'),
  server: {
    port: 3002,
    open: true,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: false,
  },
})
