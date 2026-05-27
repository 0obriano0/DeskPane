// rollup.lib.config.mjs — Library build
// Outputs:
//   dist/webos-core.es.js        ES Module  (import { WindowManager } from '...')
//   dist/webos-core.es.min.js    ES Module  (minified)
//   dist/webos-core.umd.js       UMD bundle (<script src="..."> → window.WebOS)
//   dist/webos-core.umd.min.js   UMD bundle (minified)
//   dist/index.d.ts              TypeScript declaration (core)
//
//   dist/webos-desktop.es.js     ES Module  (import { Desktop } from '...')
//   dist/webos-desktop.es.min.js ES Module  (minified)
//   dist/webos-desktop.umd.js    UMD bundle (<script src="..."> → window.WebOSDesktop)
//   dist/webos-desktop.umd.min.js UMD bundle (minified)
//   dist/desktop.d.ts            TypeScript declaration (desktop)
//
//   dist/webos-workspace.es.js   ES Module  (import { WorkspaceManager } from '...')
//   dist/webos-workspace.es.min.js ES Module (minified)
//   dist/webos-workspace.umd.js  UMD bundle (<script src="..."> → window.WebOSWorkspace)
//   dist/webos-workspace.umd.min.js UMD bundle (minified)
//   dist/workspace.d.ts          TypeScript declaration (workspace)
//
// ⚠️  Desktop + Workspace bundles 不包含 core，使用時需先載入 webos-core.*

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
        file: 'dist/webos-core.es.js',
        format: 'es',
        sourcemap: true,
      },
      {
        file: 'dist/webos-core.umd.js',
        format: 'umd',
        name: 'WebOS',
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
        file: 'dist/webos-core.es.min.js',
        format: 'es',
        sourcemap: false,
      },
      {
        file: 'dist/webos-core.umd.min.js',
        format: 'umd',
        name: 'WebOS',
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
        file: 'dist/webos-desktop.es.js',
        format: 'es',
        sourcemap: true,
      },
      {
        file: 'dist/webos-desktop.umd.js',
        format: 'umd',
        name: 'WebOSDesktop',   // → window.WebOSDesktop in browser
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
        file: 'dist/webos-desktop.es.min.js',
        format: 'es',
        sourcemap: false,
      },
      {
        file: 'dist/webos-desktop.umd.min.js',
        format: 'umd',
        name: 'WebOSDesktop',
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
        file: 'dist/webos-workspace.es.js',
        format: 'es',
        sourcemap: true,
      },
      {
        file: 'dist/webos-workspace.umd.js',
        format: 'umd',
        name: 'WebOSWorkspace',   // → window.WebOSWorkspace in browser
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
        file: 'dist/webos-workspace.es.min.js',
        format: 'es',
        sourcemap: false,
      },
      {
        file: 'dist/webos-workspace.umd.min.js',
        format: 'umd',
        name: 'WebOSWorkspace',
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
]
