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
- [ ] You've added a changeset (`yarn changeset`) if the change is releasable

### Commit Message Format

We use conventional commits. Format: `type(scope): description`

Examples:
- `fix(dia.Graph): correct batch event options`
- `feat(dia.Paper): add new zoom feature`
- `docs: update contributing guide`

Types: `feat`, `fix`, `style`, `refactor`, `test`, `chore`, `example`

### Changesets

Versioning and the changelog are driven by [Changesets](https://github.com/changesets/changesets).
If your PR changes releasable code, add a changeset:

```bash
yarn changeset
```

Pick the affected package(s) and bump type, then write the changelog line(s) in the
**same `type(scope): description` form as commits** — one row per line:

```markdown
---
"@joint/core": minor
---
feat(dia.Paper): add `originX` and `originY` options to `getFitToContentArea()`
fix(routers.rightAngle): to allow zero-value margins and un-clamp `minPathMargin`
```

Commit the generated `.changeset/*.md` with your PR. CI (`changeset status`) fails a PR that
changes releasable code without a changeset; docs-, test-, and demo-only PRs are exempt. Don't
add PR/commit links by hand — the GitHub Release notes link each row to its `master` commit
automatically. See [`.changeset/README.md`](.changeset/README.md) for the full body convention
(feat/fix filtering, `!` for breaking changes, which packages appear in the CHANGELOG).

### Releasing (maintainers)

Releases are automated in two phases; no manual npm/tag/GitHub-Release steps.

1. **Prepare** — dispatch the **Release (prepare)** workflow (`release.yml`). It renders the root
   `CHANGELOG` + `RELEASE_NOTES.md` from the pending changesets, applies the bumps
   (`changeset version`), and opens an auto-merging `release/next` PR to `master`.
2. **Publish** — merging that PR triggers **Release (publish)** (`publish.yml`), which publishes the
   changed packages to npm (via Yarn), tags `vX.Y.Z` + cuts one GitHub Release when `@joint/core`
   changed, and force-updates `prod` to the merged commit.

For a `beta`/`next` release, run `yarn changeset pre enter <tag>` on `master` before step 1 (and
`yarn changeset pre exit` to return to stable).

## Code Style

- TypeScript strict mode is enabled
- ESLint flat config (v9) via `@joint/eslint-config`
- Run `yarn lint-fix` before committing

## Questions?

- Open an issue on [GitHub](https://github.com/clientIO/joint/issues)
- Visit [jointjs.com](https://jointjs.com) for documentation
