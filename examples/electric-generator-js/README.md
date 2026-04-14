# JointJS: Electric generator

Do you want to animate elements in a diagram? You can use the transition feature on the model attributes or write a custom element view and take advantage of the fact that JointJS shapes are made up of SVG, which can be set in motion using the browser's Animation API. See the latter approach in action in this demo.

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
