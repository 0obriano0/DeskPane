import { cpSync, existsSync, mkdirSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pagesDir = path.join(root, '.pages');
const siteUrl = 'https://0obriano0.github.io/DeskPane';
const googleVerificationFile = 'google1691be481f713efe.html';

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

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
    for (let attempt = 1; attempt <= 10; attempt += 1) {
      try {
        renameSync(pagesDir, staleDir);
        return;
      } catch (renameError) {
        if (attempt === 10) throw renameError;
        sleep(200);
      }
    }
  }
}

resetPagesDir();
mkdirSync(pagesDir, { recursive: true });

writeFileSync(
  path.join(pagesDir, 'index.html'),
  `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="refresh" content="0; url=demo/index.html">
  <title>DeskPane Demos — Web Desktop Window Manager</title>
  <meta name="description" content="Interactive DeskPane demos for a framework-agnostic web desktop window manager with draggable, resizable windows, Dock, virtual desktops, Vue, React, and JavaScript examples.">
  <link rel="canonical" href="${siteUrl}/demo/">
  <meta property="og:type" content="website">
  <meta property="og:title" content="DeskPane Demos">
  <meta property="og:description" content="Framework-agnostic web desktop window manager demos for JavaScript, Vue, and React.">
  <meta property="og:url" content="${siteUrl}/demo/">
  <meta property="og:site_name" content="DeskPane">
  <meta name="twitter:card" content="summary">
</head>
<body>
  <h1>DeskPane Demos</h1>
  <p><a href="demo/index.html">Open DeskPane demos</a></p>
</body>
</html>
`,
);

writeFileSync(
  path.join(pagesDir, 'robots.txt'),
  `User-agent: *
Allow: /

Sitemap: ${siteUrl}/sitemap.xml
Sitemap: ${siteUrl}/sitemap.txt
`,
);

const sitemapUrls = [
  `${siteUrl}/demo/`,
  `${siteUrl}/demo/docs/dist/`,
  `${siteUrl}/demo/vue/dist/`,
  `${siteUrl}/demo/react/dist/`,
  `${siteUrl}/demo/vanilla/`,
  `${siteUrl}/demo/jquery/`,
  `${siteUrl}/demo/desktop/`,
  `${siteUrl}/demo/win7/`,
  `${siteUrl}/demo/xp/`,
  `${siteUrl}/demo/theme-editor/`,
  `${siteUrl}/demo/layout/`,
];

const today = new Date().toISOString().split('T')[0];

writeFileSync(
  path.join(pagesDir, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapUrls.map(url => `  <url><loc>${url}</loc><lastmod>${today}</lastmod></url>`).join('\n')}
</urlset>
`,
);

writeFileSync(
  path.join(pagesDir, 'sitemap.txt'),
  `${sitemapUrls.join('\n')}\n`,
);

writeFileSync(
  path.join(pagesDir, googleVerificationFile),
  `google-site-verification: ${googleVerificationFile}\n`,
);

copyRequired('dist', 'dist');

copyRequired('demo/index.html', 'demo/index.html');
copyRequired('demo/shared', 'demo/shared');
copyRequired('demo/desktop', 'demo/desktop');
copyRequired('demo/win7', 'demo/win7');
copyRequired('demo/xp', 'demo/xp');
copyRequired('demo/theme-editor', 'demo/theme-editor');
copyRequired('demo/vanilla', 'demo/vanilla');
copyRequired('demo/jquery', 'demo/jquery');
copyRequired('demo/layout', 'demo/layout');

copyRequired('demo/vue/dist', 'demo/vue/dist');
copyRequired('demo/react/dist', 'demo/react/dist');
copyRequired('demo/docs/dist', 'demo/docs/dist');

console.log(`Prepared GitHub Pages artifact at ${path.relative(root, pagesDir)}`);
