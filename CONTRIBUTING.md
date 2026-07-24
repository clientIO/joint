# Contributing to JointJS

Thank you for your interest in contributing to JointJS! This document provides guidelines and instructions for contributing.

## Development Setup

### Prerequisites

- Node.js 22.14.0 (managed via [Volta](https://volta.sh/))
- Yarn 4.7.0

### Installation

```bash
git clone https://github.com/clientIO/joint.git
cd joint
yarn install
```

### Building

```bash
# Build distribution files
yarn dist

# Build all packages
yarn build
```

## Running Tests

```bash
# Run all tests
yarn test

# Run specific test types
yarn test-server       # Server-side tests (Node.js/Mocha)
yarn test-client       # Client-side tests (Browser/Karma/QUnit)
yarn test-ts           # TypeScript type definition tests
yarn test-e2e          # End-to-end tests (Puppeteer)

# Run tests for a specific file (joint-core)
cd packages/joint-core
npm run test-client -- --file=test/jointjs/graph.js
```

## Linting

```bash
# Check for linting errors
yarn lint

# Auto-fix linting errors
yarn lint-fix
```

## Project Structure

This is a Yarn workspace monorepo. Main packages:

- `packages/joint-core` - The main diagramming library
- `packages/joint-react` - React bindings
- `packages/joint-layout-directed-graph` - Graph layout algorithms
- `packages/joint-layout-msagl` - MSAGL layout integration

## Pull Request Guidelines

Before submitting a PR, please verify:

- [ ] Code is up-to-date with the `master` branch
- [ ] You've successfully run `yarn test` locally
- [ ] If applicable, there are new or updated unit tests validating the change
- [ ] If applicable, there are new or updated @types
- [ ] If applicable, documentation has been updated
- [ ] You've declared a version bump with `yarn version-check` and committed the generated `.yarn/versions/*.yml` file (or the change needs no release — e.g. tests/docs only)

### Versioning Your Change

We use [Yarn's deferred versioning](https://yarnpkg.com/features/release-workflow). Instead of
editing `"version"` in `package.json`, you declare *what kind* of release your change is and let
Yarn apply the actual bumps at release time.

Before opening a PR, run from the repo root:

```bash
yarn version-check   # opens an interactive prompt (yarn version check --interactive)
```

Pick a bump for each changed package and commit the file Yarn writes under `.yarn/versions/`:

- **patch** — a bug fix (`4.3.0` → `4.3.1`)
- **minor** — a new backwards-compatible feature (`4.3.0` → `4.4.0`)
- **major** — a breaking change (`4.3.0` → `5.0.0`)

Your conventional-commit type is a good hint: `fix` → patch, `feat` → minor, a breaking change → major.
When you bump a package, the prompt also lists the published packages that depend on it (e.g.
bumping `@joint/core` lists `@joint/decorators`, `@joint/layout-*`, `@joint/shapes-*`,
`@joint/react`, …); set those to the same bump so they track `@joint/core`, our ruling version.
Yarn then rewrites their `workspace:` ranges for you at release. Private example apps under
`examples/` have no version field and never appear. Changes to ignored paths (tests, docs,
`examples/`) need no bump. CI runs
`yarn version check` on every PR and will fail if a changed package is missing its version entry.

### Commit Message Format

We use conventional commits. Format: `type(scope): description`

Examples:
- `fix(dia.Graph): correct batch event options`
- `feat(dia.Paper): add new zoom feature`
- `docs: update contributing guide`

Types: `feat`, `fix`, `style`, `refactor`, `test`, `chore`, `example`

## Code Style

- TypeScript strict mode is enabled
- ESLint flat config (v9) via `@joint/eslint-config`
- Run `yarn lint-fix` before committing

## Questions?

- Open an issue on [GitHub](https://github.com/clientIO/joint/issues)
- Visit [jointjs.com](https://jointjs.com) for documentation
