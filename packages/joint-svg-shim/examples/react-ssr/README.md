# @joint/react SSR example

Server-renders an interactive JointJS diagram with `@joint/react`, ships it to
the browser as a **complete SVG inside the HTML**, then **hydrates** it into the
live, draggable paper.

## What it shows

- The whole graph — nodes, links, ports, and each node's React content — is
  produced by `renderToString` on the **server**.
- Disable JavaScript and reload: the diagram is still there, because it shipped
  as plain SVG in the HTML (great for first paint and SEO).
- With JavaScript on, the client hydrates and the JointJS paper becomes fully
  interactive (drag nodes, click, events).

## How SSR is wired

`src/entry-server.tsx` imports `@joint/react/server` **as its first import** —
before `./page` (which pulls in `@joint/core`). That single import:

1. installs the `@joint/svg-shim` headless DOM + SVG-geometry shim, and
2. registers the `@joint/react` SSR paper renderer.

So when `<Paper>` renders on the server, it emits real, correctly-sized SVG.
`@napi-rs/canvas` is a dependency of `@joint/svg-shim` (so the example gets it
transitively) — link/node label text is measured with the real font and matches
the browser pixel-for-pixel.

The server (`server.ts`) is Express:

- **dev** — Vite in `middlewareMode`; `ssrLoadModule('/src/entry-server.tsx')`
  renders the app, injected into `index.html` via `transformIndexHtml`.
- **production** — serves the built `dist/client` and imports the built
  `dist/server/entry-server.js`.

## Run

From the monorepo root (after `yarn install` and building the libs):

```bash
yarn workspace @joint/svg-shim-example-react-ssr dev
# → http://localhost:5173
```

Build + preview the production bundles:

```bash
yarn workspace @joint/svg-shim-example-react-ssr build
yarn workspace @joint/svg-shim-example-react-ssr preview
```

Typecheck:

```bash
yarn workspace @joint/svg-shim-example-react-ssr typecheck
```

> The example consumes the **built** workspace packages (`@joint/react`,
> `@joint/svg-shim`, `@joint/core`) via its own dependencies — no source
> aliases. If the dev server can't resolve them, build the libs first:
> `yarn workspace @joint/svg-shim build && yarn workspace @joint/react build`.
