<p align="center">
  <img src="https://cdn.prod.website-files.com/63061d4ee85b5a18644f221c/633045c1d726c7116dcbe582_JJS_logo.svg" alt="JointJS" height="56" />
</p>

<h1 align="center">@joint/react</h1>

<p align="center">
  <strong>React-first diagramming.</strong> Build flowcharts, workflows, network maps, and graph UIs with an idiomatic React API on top of JointJS.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@joint/react"><img src="https://img.shields.io/npm/v/@joint/react?style=flat-square&color=0EA5E9" alt="npm" /></a>
  <a href="https://www.npmjs.com/package/@joint/react"><img src="https://img.shields.io/npm/types/@joint/react?style=flat-square&color=3178C6" alt="types" /></a>
  <a href="https://bundlephobia.com/package/@joint/react"><img src="https://img.shields.io/bundlephobia/minzip/@joint/react?style=flat-square&color=8B5CF6" alt="bundle" /></a>
  <a href="https://www.npmjs.com/package/@joint/react"><img src="https://img.shields.io/npm/dm/@joint/react?style=flat-square&color=F59E0B" alt="downloads" /></a>
  <a href="./LICENSE"><img src="https://img.shields.io/npm/l/@joint/react?style=flat-square&color=10B981" alt="license" /></a>
</p>

---

## Install

```bash
npm i @joint/react        # or
pnpm add @joint/react     # or
yarn add @joint/react     # or
bun add @joint/react
```

Peer dependency: React **>=18 <20**.

---

## Local development

This package lives in the [`clientIO/joint`](https://github.com/clientIO/joint) Yarn workspace monorepo.

```bash
# From the repo root
yarn install
yarn workspace @joint/core build   # joint-react depends on @joint/core
```

Then inside `packages/joint-react`:

```bash
yarn storybook          # dev server on http://localhost:6006
yarn build              # esbuild → dist/cjs, dist/esm, dist/types
yarn test               # typecheck + lint + jest
yarn jest --watch       # watch mode for tests
yarn docs:typedoc       # generate API reference
```

---

## Resources

- 📚 **API docs** — https://react.jointjs.com/api/index.html
- 🧪 **Storybook (live examples)** — https://react.jointjs.com/learn/?path=/docs/introduction--docs
- 🐛 **Issues** — https://github.com/clientIO/joint/issues
- 📰 **Releases** — https://github.com/clientIO/joint/releases
- 🌐 **JointJS** — https://www.jointjs.com

---

## License

MPL-2.0 © [ClientIO](https://www.client.io)
