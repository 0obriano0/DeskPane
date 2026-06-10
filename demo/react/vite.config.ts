import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'
import os from 'node:os'
import path from 'node:path'
import fs from 'node:fs'

const RAW_SUFFIX = '?raw-dp'

function rawCssPlugin() {
  return {
    name: 'vite-raw-css-for-deskpane',
    enforce: 'pre' as const,
    async resolveId(source: string, importer: string | undefined) {
      if (!source.endsWith('.css')) return
      if (!importer?.includes('WebOS/src/') && !importer?.includes('WebOS\\src\\')) return
      const resolved = await this.resolve(source, importer, { skipSelf: true })
      if (resolved) return resolved.id + RAW_SUFFIX
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
  plugins: [rawCssPlugin(), react()],
  resolve: {
    alias: {
      '@deskpane': fileURLToPath(new URL('../../src', import.meta.url)),
    },
  },
  cacheDir: path.join(os.tmpdir(), 'vite-deskpane-react-demo'),
  server: { port: 3002, open: true },
  build: { outDir: 'dist' },
})