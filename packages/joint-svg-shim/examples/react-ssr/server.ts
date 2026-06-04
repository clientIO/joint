/**
 * Express SSR server for the @joint/react example.
 *
 * Dev: Vite runs in middleware mode. Each request transforms `index.html`,
 * loads the server entry via `ssrLoadModule`, renders the app to HTML, and
 * injects it into the document. HMR works through Vite's middlewares.
 *
 * Production (NODE_ENV=production): serves the pre-built client assets from
 * `dist/client` and imports the pre-built server bundle from `dist/server`.
 */
/* eslint-disable no-console -- dev server entry logs startup and request errors */
import { fileURLToPath } from 'node:url';
// eslint-disable-next-line unicorn/import-style
import { dirname, resolve } from 'node:path';
import { readFile } from 'node:fs/promises';
import express from 'express';

const __dirname = dirname(fileURLToPath(import.meta.url));
const isProduction = process.env.NODE_ENV === 'production';
const port = Number(process.env.PORT ?? 5173);

const APP_HTML_PLACEHOLDER = '<!--app-html-->';

/** Server entry contract: a `render()` that returns the app HTML string. */
interface ServerEntry {
  render: () => string;
}

async function createServer(): Promise<express.Express> {
  const app = express();

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      root: __dirname,
      server: { middlewareMode: true },
      appType: 'custom',
    });
    app.use(vite.middlewares);

    app.use(async (request, response, next) => {
      try {
        const url = request.originalUrl;
        const templateRaw = await readFile(resolve(__dirname, 'index.html'), 'utf8');
        const template = await vite.transformIndexHtml(url, templateRaw);
        const entry = (await vite.ssrLoadModule('/src/entry-server.tsx')) as ServerEntry;
        const appHtml = entry.render();
        const html = template.replace(APP_HTML_PLACEHOLDER, appHtml);
        response.status(200).set({ 'Content-Type': 'text/html' }).end(html);
      } catch (error) {
        if (error instanceof Error) vite.ssrFixStacktrace(error);
        next(error);
      }
    });

    app.listen(port, () => {
      console.log(`🚀  @joint/react SSR example (dev) running at http://localhost:${port}`);
    });
    return app;
  }

  // eslint-disable-next-line unicorn/prevent-abbreviations
  const clientDir = resolve(__dirname, 'dist/client');
  const template = await readFile(resolve(clientDir, 'index.html'), 'utf8');
  const serverEntryPath = resolve(__dirname, 'dist/server/entry-server.js');
  const entry = (await import(serverEntryPath)) as ServerEntry;

  app.use(express.static(clientDir, { index: false }));
  app.use((_request, response) => {
    const appHtml = entry.render();
    const html = template.replace(APP_HTML_PLACEHOLDER, appHtml);
    response.status(200).set({ 'Content-Type': 'text/html' }).end(html);
  });

  app.listen(port, () => {
    console.log(`🚀  @joint/react SSR example (production) running at http://localhost:${port}`);
  });
  return app;
}

 await createServer();
