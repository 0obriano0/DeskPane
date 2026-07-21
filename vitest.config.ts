import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, URL } from "node:url";
import type { Plugin } from "vite";
import { defineConfig } from "vitest/config";

const RAW_SUFFIX = "?raw-dp-test";
const deskpaneSrcDir = path.normalize(
  fileURLToPath(new URL("./src", import.meta.url)),
);
const deskpaneStylesDir = path.normalize(
  fileURLToPath(new URL("./src/styles", import.meta.url)),
);

// DeskPane imports its core CSS as a runtime string. Keep that behavior in tests
// instead of letting Vite's normal CSS pipeline consume the default export.
function rawDeskPaneCss(): Plugin {
  return {
    name: "vitest-raw-css-for-deskpane",
    enforce: "pre",
    async resolveId(source, importer) {
      if (!source.endsWith(".css") || !importer) return;
      const importerPath = path.normalize(importer);
      if (!importerPath.startsWith(`${deskpaneSrcDir}${path.sep}`)) return;

      const resolved = await this.resolve(source, importer, { skipSelf: true });
      if (!resolved) return;
      const cssPath = path.normalize(resolved.id);
      if (!cssPath.startsWith(`${deskpaneStylesDir}${path.sep}`)) return;
      return `${resolved.id}${RAW_SUFFIX}`;
    },
    load(id) {
      if (!id.endsWith(RAW_SUFFIX)) return;
      const filePath = id.slice(0, -RAW_SUFFIX.length);
      return `export default ${JSON.stringify(fs.readFileSync(filePath, "utf8"))}`;
    },
  };
}

export default defineConfig({
  plugins: [rawDeskPaneCss()],
  cacheDir: path.join(os.tmpdir(), "vitest-deskpane"),
  test: {
    environment: "jsdom",
    environmentOptions: {
      jsdom: { url: "http://localhost/" },
    },
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.ts"],
    clearMocks: true,
    restoreMocks: true,
  },
});
