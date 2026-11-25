# JointJS: Alpha Preview

Select any number of cells and see them rendered on two separate canvases next to the paper: as outlines and as a single filled silhouette. Tick *Ignore labels* to leave element labels (`<text>`) and link labels (`[label-idx]` groups) out via the `ignore` option of `toAlpha()`. Every selected view is turned into an all-white copy with `cellView.toAlpha()`, the copies are combined into a single SVG `<mask>`, and the mask is applied to one rectangle covering the whole selection. The preview is always drawn with the selection's top-left corner at `(0,0)`, so a single `translate` is enough to place it anywhere, e.g. under the pointer while dragging. The same technique can drive a lightweight "outlines only" ghost while dragging a selection.

## Install

From the root of the monorepo, install all dependencies:

```bash
yarn install
yarn run build
````

## Development

Run the development server from this example directory:

```bash
yarn dev
```

Then open the URL printed in the terminal (usually `http://localhost:5173`).

## Build

Create a production build:

```bash
yarn build
```

The output will be generated in the `dist/` directory.

## Preview

Preview the production build locally:

```bash
yarn preview
```
