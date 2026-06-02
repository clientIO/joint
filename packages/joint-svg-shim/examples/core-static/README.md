# @joint/core static-SVG example

Runs **pure `@joint/core`** in Node — no browser, no React, no client JavaScript
— and serves a diagram as **static HTML** with the SVG embedded inline.

## What it shows

- `@joint/svg-shim` makes JointJS's SVG DOM work in Node: `new dia.Paper(...)`
  renders, and `paper.svg.outerHTML` is a complete, correctly-sized SVG.
- A couple of `shapes.standard.Rectangle` nodes connected by a labeled
  `shapes.standard.Link`. The link label's background is sized from the
  **measured text** — measured server-side (the shim's whole point). With
  `@napi-rs/canvas` installed, that measurement uses the real font.
- The response is a full HTML page with no `<script>`: rendered entirely on the
  server.

## How it's wired

`src/diagram.ts` imports `@joint/svg-shim/install` **first** (before
`@joint/core`), then builds the graph and returns `paper.svg.outerHTML`.
`src/server.ts` is a tiny Express server that wraps that SVG in an HTML shell.

## Run

From the monorepo root (after `yarn install` and building `@joint/svg-shim`):

```bash
yarn workspace @joint/svg-shim-example-core-static dev
# → http://localhost:5174
```

```bash
yarn workspace @joint/svg-shim-example-core-static typecheck
yarn workspace @joint/svg-shim-example-core-static build
```

> The example consumes the **built** workspace packages (`@joint/core`,
> `@joint/svg-shim`) via its own dependencies — no source aliases. Build the
> shim first if needed: `yarn workspace @joint/svg-shim build`.
