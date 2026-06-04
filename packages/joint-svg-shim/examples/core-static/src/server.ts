/**
 * Static-HTML server for pure `@joint/core`.
 *
 * Per request it builds a diagram in Node, serializes it to SVG, and returns a
 * complete static HTML page embedding that SVG. There is NO React and NO client
 * `<script>` — the page is fully rendered on the server, in the JointJS style.
 */
/* eslint-disable no-console -- dev server entry logs startup */
import express from 'express';
import { buildDiagramSvg } from './diagram';

const port = Number(process.env.PORT ?? 5174);

const LOGO =
  'https://cdn.prod.website-files.com/63061d4ee85b5a18644f221c/633045c1d726c7116dcbe582_JJS_logo.svg';
const BACKDROP =
  'https://cdn.prod.website-files.com/63061d4ee85b5a18644f221c/69c684ee197b2040000acfa5_Homepage%20-%20React%20mobile.png';

const PAGE_STYLE = `
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    min-height: 100vh;
    color: #eef2f7;
    font-family: 'Inter', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
    background: #0a0e14;
  }
  /* Faint JointJS homepage backdrop + a red brand wash, behind everything. */
  body::before {
    content: '';
    position: fixed;
    inset: 0;
    background:
      linear-gradient(180deg, rgba(10,14,20,0.82), rgba(10,14,20,0.95)),
      radial-gradient(70rem 46rem at 78% -8%, rgba(237,41,57,0.20), transparent 60%),
      url('${BACKDROP}') center top / cover no-repeat fixed;
    z-index: -1;
  }
  main {
    max-width: 1180px;
    margin: 0 auto;
    padding: clamp(1.5rem, 3vw, 2.5rem) clamp(1.25rem, 4vw, 3rem) 2.5rem;
  }
  .brand { display: flex; align-items: center; gap: 0.6rem; margin-bottom: clamp(1rem, 2.5vw, 1.5rem); }
  .brand img { height: 30px; }
  .brand b { font-weight: 800; letter-spacing: -0.01em; color: #fff; }
  .brand span { color: #8a98ab; font-weight: 500; }
  .badges { display: flex; flex-wrap: wrap; gap: 0.75rem; margin-bottom: 1rem; }
  .badge {
    display: inline-flex; align-items: center; gap: 0.5rem;
    padding: 0.5rem 0.95rem;
    font-size: 0.72rem; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase;
    color: #ffd9d6;
    border: 1px solid rgba(237,41,57,0.55);
    background: rgba(237,41,57,0.07);
    clip-path: polygon(11px 0, 100% 0, 100% calc(100% - 11px), calc(100% - 11px) 100%, 0 100%, 0 11px);
  }
  .badge svg { width: 15px; height: 15px; color: #ed2939; }
  h1 {
    margin: 0 0 0.7rem;
    font-weight: 900;
    font-size: clamp(1.4rem, 3vw, 2.4rem);
    line-height: 1.04;
    letter-spacing: -0.02em;
    max-width: 18ch;
  }
  h1 .accent { color: #ed2939; }
  .lede { margin: 0; max-width: 60ch; color: #aab6c6; font-size: clamp(0.95rem, 1.4vw, 1.18rem); line-height: 1.6; }
  .lede code { color: #f0f4f8; background: rgba(255,255,255,0.08); padding: 0.06em 0.4em; border-radius: 5px; font-size: 0.92em; }
  .note {
    display: inline-flex; align-items: center; gap: 0.6rem;
    margin-top: 1.6rem; padding: 0.6rem 1rem;
    font-size: 0.9rem; color: #cbd5e1;
    border: 1px solid rgba(255,255,255,0.1); border-radius: 999px; background: rgba(255,255,255,0.03);
  }
  .note .dot { width: 8px; height: 8px; border-radius: 50%; background: #ed2939; box-shadow: 0 0 0 4px rgba(237,41,57,0.18); }
  .stage {
    margin-top: clamp(1.25rem, 2.5vw, 2rem);
    padding: clamp(1rem, 2.5vw, 1.75rem);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 18px;
    background: linear-gradient(180deg, rgba(18,24,33,0.66), rgba(11,15,21,0.66));
    box-shadow: 0 30px 80px rgba(0,0,0,0.45);
  }
  .stage svg { width: 100%; height: auto; }
  .caption { margin: 1rem 0 0; font-size: 0.84rem; color: #8492a6; text-align: center; }
  .caption code { color: #cbd5e1; }
  /* Marching-ants flow on the links — pure CSS, runs with JS disabled. */
  @keyframes flow-march { to { stroke-dashoffset: -22; } }
  .stage svg .flow-link { animation: flow-march 0.7s linear infinite; }
`;

/** Wrap the server-rendered SVG in the JointJS-styled static HTML document. */
function htmlShell(svg: string): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>@joint/core — Diagrams rendered on the server</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
    <style>${PAGE_STYLE}</style>
  </head>
  <body>
    <main>
      <div class="brand">
        <img src="${LOGO}" alt="JointJS" />
        <b>svg-shim</b><span>· server-side rendering</span>
      </div>

      <div class="badges">
        <span class="badge">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="7" rx="1"/><rect x="3" y="13" width="18" height="7" rx="1"/><path d="M7 7.5h.01M7 16.5h.01"/></svg>
          Pure @joint/core
        </span>
        <span class="badge">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4l16 16"/><path d="M9 4h11v11"/></svg>
          No client JavaScript
        </span>
      </div>

      <h1><span class="accent">Diagrams rendered</span><br />on the server.</h1>

      <p class="lede">
        This whole diagram is built in Node with pure <code>@joint/core</code> — no browser.
        <code>@joint/svg-shim</code> supplies the headless DOM and SVG geometry,
        <code>@napi-rs/canvas</code> measures the text, and <code>paper.svg.outerHTML</code>
        is serialized to static SVG and shipped as HTML. Instant first paint, SEO-ready,
        emailable.
      </p>

      <section class="stage">
        ${svg}
        <p class="caption">Built in Node · serialized with <code>paper.svg.outerHTML</code> · zero client runtime</p>
      </section>

      <div class="note"><span class="dot"></span> Static render — the diagram above was drawn entirely on the server, so it is <strong>not interactive</strong>.</div>
    </main>
  </body>
</html>`;
}

// eslint-disable-next-line sonarjs/x-powered-by
const app = express();

app.get('/', (_request, response) => {
  const svg = buildDiagramSvg();
  response
    .status(200)
    .set({ 'Content-Type': 'text/html; charset=utf-8' })
    .end(htmlShell(svg));
});

app.listen(port, () => {
  console.log(
    `🚀  @joint/core static example running at http://localhost:${port}`,
  );
});
