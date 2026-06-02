<p align="center">
  <img src="https://cdn.prod.website-files.com/63061d4ee85b5a18644f221c/633045c1d726c7116dcbe582_JJS_logo.svg" alt="JointJS" height="56" />
</p>

<h1 align="center">@joint/svg-shim</h1>

<p align="center">
  <strong>Run JointJS SVG on the server.</strong> A headless DOM + SVG-geometry shim that lets
  <a href="https://www.npmjs.com/package/@joint/core">@joint/core</a> and
  <a href="https://www.npmjs.com/package/@joint/react">@joint/react</a> render real diagrams in Node — no browser.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@joint/svg-shim"><img src="https://img.shields.io/npm/v/@joint/svg-shim?style=flat-square&color=0EA5E9" alt="npm" /></a>
  <a href="https://www.npmjs.com/package/@joint/svg-shim"><img src="https://img.shields.io/npm/types/@joint/svg-shim?style=flat-square&color=3178C6" alt="types" /></a>
  <a href="https://bundlephobia.com/package/@joint/svg-shim"><img src="https://img.shields.io/bundlephobia/minzip/@joint/svg-shim?style=flat-square&color=8B5CF6" alt="bundle" /></a>
  <a href="./LICENSE"><img src="https://img.shields.io/npm/l/@joint/svg-shim?style=flat-square&color=10B981" alt="license" /></a>
</p>

---

## Why

JointJS builds diagrams from **real SVG DOM** and measures geometry through it — `getBBox()`,
`createSVGMatrix()`, text width. In Node there is no DOM, and even a headless DOM (jsdom, happy-dom)
implements **no SVG layout**: `getBBox()` returns `0`, matrices and text metrics are missing. So a paper
rendered server-side collapses — labels lose their size, links lose their geometry.

`@joint/svg-shim` plugs exactly those holes:

- Installs a headless DOM (jsdom by default) as Node globals.
- Polyfills the missing **SVG geometry** — `getBBox`, `SVGMatrix`/`SVGPoint`/`SVGTransform`, transform lists, font-size coercion.
- Measures **text** with a real font (via the bundled [`@napi-rs/canvas`](https://www.npmjs.com/package/@napi-rs/canvas)), so server-measured labels match the browser pixel-for-pixel.

The result: `new dia.Paper(...)` works in Node, and `paper.svg.outerHTML` is a complete, correctly-sized SVG.

## Install

```bash
yarn add @joint/svg-shim
```

`jsdom` (the DOM) and `@napi-rs/canvas` (pixel-exact text metrics) ship as dependencies — nothing else required.
One **optional** add-on, only if you want the alternative DOM backend:

```bash
# use happy-dom instead of jsdom (lighter, faster startup)
yarn add happy-dom
```

## Quick start — pure `@joint/core`

Install the shim **before** anything that pulls in `@joint/core` (ES modules evaluate in source order):

```ts
import '@joint/svg-shim/install';          // 1. headless DOM + SVG geometry — must be first
import { dia, shapes } from '@joint/core'; // 2. now safe to load

const graph = new dia.Graph({}, { cellNamespace: shapes });
const paper = new dia.Paper({
  model: graph,
  cellViewNamespace: shapes,
  width: 400,
  height: 200,
});

graph.addCell(
  new shapes.standard.Rectangle({
    position: { x: 40, y: 40 },
    size: { width: 120, height: 60 },
    attrs: { label: { text: 'Hello SSR' } },
  })
);

const svg = paper.svg.outerHTML; // → static SVG string, send it as HTML
```

Prefer to control _when_ it installs? Skip the side-effect entry and call it yourself:

```ts
import { installDomShim } from '@joint/svg-shim';
installDomShim();                          // idempotent
import { dia } from '@joint/core';
```

## Quick start — `@joint/react`

You don't use this package directly. `@joint/react/server` wires it for you — it installs the shim and
teaches it how the React theme sizes text:

```ts
import '@joint/react/server';              // installs @joint/svg-shim + registers the SSR paper renderer
import { renderToString } from 'react-dom/server';

// <GraphProvider><Paper renderElement={…} /></GraphProvider>
// → full diagram SVG inline, hydrates into the live paper on the client.
```

Just add `@joint/svg-shim` to the SSR app: `yarn add @joint/svg-shim`.

## DOM providers

The shim needs a DOM that creates **real `SVGElement` instances** (so their prototypes can be patched).

| Provider | How | Notes |
| --- | --- | --- |
| **jsdom** _(default)_ | bundled | Spec-compliant SVG DOM. Zero config. |
| **happy-dom** | `installDomShim({ provider: 'happy-dom' })` | Lighter & faster. Needs `yarn add happy-dom` (≥ 15; verified on 20.x). |
| **custom** | `installDomShim({ provider: () => myWindow })` | Bring your own window — must yield real `SVGElement`s. |

> Reusing an existing DOM (e.g. inside a jsdom test environment)? The shim detects it and only applies the
> SVG-geometry polyfills — it won't create a second window.

## Text measurement

Text is measured with the real font via the bundled [`@napi-rs/canvas`](https://www.npmjs.com/package/@napi-rs/canvas)
(Skia, prebuilt binaries — works in Node and Bun), matching the browser's `getBBox`. If canvas can't load for some
reason, the shim falls back to an average-glyph estimate — fine for layout, not pixel-exact.

If your text size comes from **CSS classes** (as `@joint/react`'s theme does), register a resolver so the shim
measures at the themed size:

```ts
import { setTextStyleResolver } from '@joint/svg-shim';

setTextStyleResolver((classAttribute) =>
  classAttribute.includes('my-label') ? { fontSize: '11px', fontFamily: 'Arial' } : {}
);
```

## API

| Export | Description |
| --- | --- |
| `import '@joint/svg-shim/install'` | Side-effect entry — installs the shim on import (use it **first**). |
| `installDomShim(options?)` | Installs the shim manually. Idempotent. Returns the `document`. |
| `isDomShimInstalled()` | Whether the shim has been installed. |
| `setTextStyleResolver(fn)` | Teach the shim how a `class` attribute maps to font size/family. |
| `measureText(text, options)` | Measure a string's box (width + ascent/descent). |
| `getNodeRequire()` | A CWD-anchored `require`, for resolving optional peers from the consumer. |
| `import { DOM_SHIM_FLAG } from '@joint/svg-shim/flag'` | The server-detection flag — a lone string constant on a **client-safe** subpath (zero Node imports), so browser code can detect a shim render without pulling the Node-only barrel. |
| `DomProvider` · `DomShimOptions` · `TextStyle` · `TextBox` … | Public types. |

## Examples

Runnable examples live in [`examples/`](./examples):

- **[`examples/core-static`](./examples/core-static)** — pure `@joint/core`: render a diagram to SVG on the server and serve it as **static HTML** (no client JS).
- **[`examples/react-ssr`](./examples/react-ssr)** — `@joint/react` + Vite: server-render an interactive diagram, ship it as SVG, then **hydrate** to the live paper. Works with JavaScript disabled.

```bash
# from the monorepo root
yarn workspace @joint/svg-shim-example-core-static dev
yarn workspace @joint/svg-shim-example-react-ssr dev
```

## Caveats

- **Node only.** It shims a browser DOM — not for the browser, not for edge runtimes (jsdom needs Node APIs).
- **Global DOM.** It sets `global.document` / `window`. Libraries that sniff `typeof document !== 'undefined'`
  to detect a browser may mis-detect the server. Keep it on the Node server runtime.
- **Element sizes come from the model** on the server — there's no layout engine to measure DOM boxes (only text is measured).

## License

[MPL-2.0](./LICENSE) © [client IO](https://client.io)
