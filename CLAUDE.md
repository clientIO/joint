# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with
code in this repository.

## Project Overview

JointJS is a JavaScript/TypeScript diagramming library for building visual and
no-code/low-code applications. It's a Yarn workspace monorepo with multiple
packages.

**Stack:** Node 22.14.0, Yarn 4.18.0, TypeScript 5.8 (5.9 in `joint-react`),
Grunt (build), QUnit/Karma/Mocha/Jest (testing)

## Common Commands

```bash
# Install dependencies
yarn install

# Build distribution files (runs Grunt)
yarn dist

# Run all tests (QUnit + Jest + TypeScript checks)
yarn test

# Run specific test types
yarn test-server       # Server-side tests (Node.js)
yarn test-client       # Client-side tests (Browser with Karma)
yarn test-ts           # TypeScript type definition tests
yarn test-e2e          # End-to-end tests (Puppeteer)

# Linting
yarn lint              # Check all packages
yarn lint-fix          # Auto-fix errors

# Build bundles
yarn build
yarn build-bundles
```

### Running Single Tests

For joint-react Jest tests:
```bash
cd packages/joint-react
yarn jest --testPathPatterns="ComponentName"
```

## Architecture

### Monorepo Packages (`/packages`)

- **@joint/core** - Main diagramming library (MVC architecture, SVG rendering)
- **@joint/react** - React bindings and hooks (Rollup + esbuild, Storybook)
- **@joint/layout-directed-graph** - Graph layout algorithms
- **@joint/layout-msagl** - Microsoft MSAGL layout integration
- **@joint/shapes-general** - General-purpose diagram shapes
- **@joint/eslint-config** - Shared ESLint configuration

### Core Library Structure (`/packages/joint-core/src`)

The library follows an MVC pattern:

- **`mvc/`** - Base MVC components: Model, View, Collection, Events, Dom
- **`dia/`** - Diagramming API built on MVC:
  - `Graph.mjs` - Graph data structure and cell management
  - `Paper.mjs` - SVG canvas and rendering engine
  - `Element.mjs` / `ElementView.mjs` - Diagram nodes
  - `Link.mjs` / `LinkView.mjs` - Connections between elements
- **`g/`** - Geometry library (points, lines, curves, polygons, matrices)
- **`V/`** - Vectorizer for SVG manipulation
- **`connectors/`** - Link path strategies (line, curve, bezier, jumpover)
- **`routers/`** - Link routing algorithms (manhattan, orthogonal, metro)
- **`anchors/`** - Connection point anchors on elements
- **`highlighters/`** - Visual highlighting mechanisms
- **`linkTools/`**, **`elementTools/`** - Interactive manipulation tools
- **`shapes/`** - Built-in shapes (standard)
- **`layout/`** - Built-in layouts (port, port label)
- **`alg/`** - Graph algorithms (DFS, BFS, shortest path)

### Main Export (`/packages/joint-core/src/core.mjs`)

```javascript
export { anchors, linkAnchors, config, connectionPoints, connectionStrategies,
         connectors, dia, env, highlighters, layout, mvc, routers, setTheme,
         util, version, linkTools, elementTools, V, Vectorizer, g };
```

## Test Organization

- **`/packages/joint-core/test/jointjs/`** - QUnit tests for core functionality
- **`/packages/joint-core/test/jointjs-nodejs/`** - Mocha tests run by
  `test-server`
- **`/packages/joint-core/test/geometry/`** - Geometry library tests
- **`/packages/joint-core/test/vectorizer/`** - SVG vectorizer tests
- **`/packages/joint-core/test/ts/`**, **`test/ts-exports/`** - TypeScript
  definition validation
- **`/packages/joint-core/test/e2e/`** - Puppeteer E2E tests
- **`/packages/joint-react/src/`** - Jest tests with @testing-library/react,
  colocated in `__tests__` folders

## Changesets

Releasable changes need a changeset in `/.changeset`. Before writing one, read
the **Changeset format** section of `CONTRIBUTING.md` - it defines the required
frontmatter, the `scope - description` changelog style (`dia.Paper`, `anchors`,
`<Paper />`, ...), and the backtick/`()` conventions - and follow it exactly.

## Key Patterns

- **Change tracking:** Models emit `change:*` events; `changeId` event triggers
  only when ID actually changes
- **Workspace commands:** Use `yarn workspaces foreach --all -tvv run <cmd>`
  for cross-package operations
- **TypeScript:** Strict mode enabled; the settings are per package, not
  repo-wide. `tsconfig.common.json` adds `noUnusedLocals`,
  `noUnusedParameters` and `noImplicitReturns`, and is used by `joint-cli`,
  `joint-decorators` and the `shapes-general` packages - `joint-core` and
  `joint-react` each have their own
- **ESLint:** Uses flat config format (v9) via `@joint/eslint-config`
