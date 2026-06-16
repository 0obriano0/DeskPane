import { defineConfig } from 'vite'
import type { Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import os from 'node:os'
import path from 'node:path'
import fs from 'node:fs'

const RAW_SUFFIX = '?raw-dp'
const deskpaneSrcDir = path.normalize(fileURLToPath(new URL('../../src', import.meta.url)))
const deskpaneStylesDir = path.normalize(fileURLToPath(new URL('../../src/styles', import.meta.url)))

// Intercepts CSS imports from DeskPane src and returns them as raw strings.
// Must use resolveId+load (not just load) because Vite's built-in CSS plugin
// intercepts .css files before a plain load() hook can run.
function rawCssPlugin(): Plugin {
  return {
    name: 'vite-raw-css-for-deskpane',
    enforce: 'pre' as const,
    async resolveId(source: string, importer: string | undefined) {
      if (!source.endsWith('.css')) return
      if (!importer) return

      const importerPath = path.normalize(importer)
      if (!importerPath.startsWith(deskpaneSrcDir + path.sep)) return

      const resolved = await this.resolve(source, importer, { skipSelf: true })
      if (!resolved) return

      const cssPath = path.normalize(resolved.id)
      if (!cssPath.startsWith(deskpaneStylesDir + path.sep)) return

      return resolved.id + RAW_SUFFIX
    },
    load(id: string) {
      if (!id.endsWith(RAW_SUFFIX)) return
      const filePath = id.slice(0, -RAW_SUFFIX.length)
      const content = fs.readFileSync(filePath, 'utf-8')
      return `export default ${JSON.stringify(content)}`
    },
  }
}

export default defineConfig({
  base: './',
  plugins: [rawCssPlugin(), vue()],
  resolve: {
    alias: {
      '@deskpane': fileURLToPath(new URL('../../src', import.meta.url)),
    },
  },
  cacheDir: path.join(os.tmpdir(), 'vite-deskpane-vue-demo'),
  server: { port: 3001, open: true },
  build: { outDir: 'dist', emptyOutDir: false },
})
