# JointJS: Microsoft Adaptive Cards

This demo implements a custom view responsible for rendering interactive HTML cards (Microsoft Adaptive Cards) inside foreign objects and synchronizing the size of the view and the model, since the size of the HTML may change over the lifetime of the card. It also demonstrates the use of the markdown language inside the shapes using the markdown-it library.

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
