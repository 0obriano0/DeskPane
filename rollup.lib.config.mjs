// rollup.lib.config.mjs — Library build
// Outputs:
//   dist/deskpane.es.js        ES Module  (import { WindowManager } from '...')
//   dist/deskpane.es.min.js    ES Module  (minified)
//   dist/deskpane.umd.js       UMD bundle (<script src="..."> → window.DeskPane)
//   dist/deskpane.umd.min.js   UMD bundle (minified)
//   dist/index.d.ts              TypeScript declaration (core)
//
//   dist/deskpane-desktop.es.js     ES Module  (import { Desktop } from '...')
//   dist/deskpane-desktop.es.min.js ES Module  (minified)
//   dist/deskpane-desktop.umd.js    UMD bundle (<script src="..."> → window.DeskPaneDesktop)
//   dist/deskpane-desktop.umd.min.js UMD bundle (minified)
//   dist/desktop.d.ts            TypeScript declaration (desktop)
//
//   dist/deskpane-workspace.es.js   ES Module  (import { WorkspaceManager } from '...')
//   dist/deskpane-workspace.es.min.js ES Module (minified)
//   dist/deskpane-workspace.umd.js  UMD bundle (<script src="..."> → window.DeskPaneWorkspace)
//   dist/deskpane-workspace.umd.min.js UMD bundle (minified)
//   dist/workspace.d.ts          TypeScript declaration (workspace)
//
//   dist/deskpane-vue.es.js      ES Module  (import { DpDesktop } from 'deskpane/vue')
//   dist/vue.d.ts                TypeScript declaration (Vue adapter)
//
// ⚠️  Desktop + Workspace bundles 不包含 core，使用時需先載入 deskpane.*

import resolve from '@rollup/plugin-node-resolve'
import typescript from '@rollup/plugin-typescript'
import terser from '@rollup/plugin-terser'
import dts from 'rollup-plugin-dts'

/** Inline plugin: import CSS files as raw strings */
function rawCss() {
  return {
    name: 'raw-css',
    transform(code, id) {
      if (!id.endsWith('.css')) return null;
      return {
        code: `export default ${JSON.stringify(code)};`,
        map: { mappings: '' },
      };
    },
  };
}

const coreInput      = 'src/index.ts'
const desktopInput   = 'src/desktop/index.ts'
const workspaceInput = 'src/workspace/index.ts'
const vueInput       = 'src/adapters/vue/index.ts'
const external       = ['vue', 'react', 'react-dom']   // peer deps — not bundled

export default [
  // ════════════════════════════════════════════════════════
  // CORE — ESM + UMD (unminified)
  // ════════════════════════════════════════════════════════
  {
    input: coreInput,
    external,
    plugins: [
      rawCss(),
      resolve(),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false,
        declarationMap: false,
        sourceMap: true,
      }),
    ],
    output: [
      {
        file: 'dist/deskpane.es.js',
        format: 'es',
        sourcemap: true,
      },
      {
        file: 'dist/deskpane.umd.js',
        format: 'umd',
        name: 'DeskPane',
        globals: { vue: 'Vue', react: 'React', 'react-dom': 'ReactDOM' },
        sourcemap: true,
      },
    ],
  },
  // ── CORE — ESM + UMD (minified) ─────────────────────────
  {
    input: coreInput,
    external,
    plugins: [
      rawCss(),
      resolve(),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false,
        declarationMap: false,
        sourceMap: false,
      }),
      terser(),
    ],
    output: [
      {
        file: 'dist/deskpane.es.min.js',
        format: 'es',
        sourcemap: false,
      },
      {
        file: 'dist/deskpane.umd.min.js',
        format: 'umd',
        name: 'DeskPane',
        globals: { vue: 'Vue', react: 'React', 'react-dom': 'ReactDOM' },
        sourcemap: false,
      },
    ],
  },
  // ── CORE — TypeScript declarations ──────────────────────
  {
    input: coreInput,
    external,
    plugins: [dts()],
    output: {
      file: 'dist/index.d.ts',
      format: 'es',
    },
  },

  // ════════════════════════════════════════════════════════
  // DESKTOP — ESM + UMD (unminified)
  // ════════════════════════════════════════════════════════
  {
    input: desktopInput,
    external,
    plugins: [
      rawCss(),
      resolve(),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false,
        declarationMap: false,
        sourceMap: true,
      }),
    ],
    output: [
      {
        file: 'dist/deskpane-desktop.es.js',
        format: 'es',
        sourcemap: true,
      },
      {
        file: 'dist/deskpane-desktop.umd.js',
        format: 'umd',
        name: 'DeskPaneDesktop',   // → window.DeskPaneDesktop in browser
        sourcemap: true,
      },
    ],
  },
  // ── DESKTOP — ESM + UMD (minified) ──────────────────────
  {
    input: desktopInput,
    external,
    plugins: [
      rawCss(),
      resolve(),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false,
        declarationMap: false,
        sourceMap: false,
      }),
      terser(),
    ],
    output: [
      {
        file: 'dist/deskpane-desktop.es.min.js',
        format: 'es',
        sourcemap: false,
      },
      {
        file: 'dist/deskpane-desktop.umd.min.js',
        format: 'umd',
        name: 'DeskPaneDesktop',
        sourcemap: false,
      },
    ],
  },
  // ── DESKTOP — TypeScript declarations ───────────────────
  {
    input: desktopInput,
    external,
    plugins: [dts()],
    output: {
      file: 'dist/desktop.d.ts',
      format: 'es',
    },
  },

  // ════════════════════════════════════════════════════════
  // WORKSPACE — ESM + UMD (unminified)
  // ════════════════════════════════════════════════════════
  {
    input: workspaceInput,
    external,
    plugins: [
      rawCss(),
      resolve(),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false,
        declarationMap: false,
        sourceMap: true,
      }),
    ],
    output: [
      {
        file: 'dist/deskpane-workspace.es.js',
        format: 'es',
        sourcemap: true,
      },
      {
        file: 'dist/deskpane-workspace.umd.js',
        format: 'umd',
        name: 'DeskPaneWorkspace',   // → window.DeskPaneWorkspace in browser
        sourcemap: true,
      },
    ],
  },
  // ── WORKSPACE — ESM + UMD (minified) ────────────────────
  {
    input: workspaceInput,
    external,
    plugins: [
      rawCss(),
      resolve(),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false,
        declarationMap: false,
        sourceMap: false,
      }),
      terser(),
    ],
    output: [
      {
        file: 'dist/deskpane-workspace.es.min.js',
        format: 'es',
        sourcemap: false,
      },
      {
        file: 'dist/deskpane-workspace.umd.min.js',
        format: 'umd',
        name: 'DeskPaneWorkspace',
        sourcemap: false,
      },
    ],
  },
  // ── WORKSPACE — TypeScript declarations ─────────────────
  {
    input: workspaceInput,
    external,
    plugins: [dts()],
    output: {
      file: 'dist/workspace.d.ts',
      format: 'es',
    },
  },

  // ════════════════════════════════════════════════════════
  // VUE ADAPTER — ESM + TypeScript declarations
  // ════════════════════════════════════════════════════════
  {
    input: vueInput,
    external,
    plugins: [
      rawCss(),
      resolve(),
      typescript({
        tsconfig: './tsconfig.vue.json',
        declaration: false,
        declarationMap: false,
        sourceMap: true,
      }),
    ],
    output: {
      file: 'dist/deskpane-vue.es.js',
      format: 'es',
      sourcemap: true,
    },
  },
  {
    input: vueInput,
    external,
    plugins: [dts({ tsconfig: './tsconfig.vue.json' })],
    output: {
      file: 'dist/vue.d.ts',
      format: 'es',
    },
  },
]
