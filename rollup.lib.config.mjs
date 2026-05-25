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
// ⚠️  Desktop bundle 不包含 core，使用時需先載入 webos-core.*

import resolve from '@rollup/plugin-node-resolve'
import typescript from '@rollup/plugin-typescript'
import terser from '@rollup/plugin-terser'
import dts from 'rollup-plugin-dts'

const coreInput    = 'src/index.ts'
const desktopInput = 'src/desktop/index.ts'
const external     = ['vue', 'react', 'react-dom']   // peer deps — not bundled

export default [
  // ════════════════════════════════════════════════════════
  // CORE — ESM + UMD (unminified)
  // ════════════════════════════════════════════════════════
  {
    input: coreInput,
    external,
    plugins: [
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
]
