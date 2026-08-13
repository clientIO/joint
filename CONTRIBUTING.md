# Contributing to JointJS

Thank you for your interest in contributing to JointJS! This document provides guidelines and instructions for contributing.

## Development Setup

### Prerequisites

- Node.js 22.14.0 (managed via [Volta](https://volta.sh/))
- Yarn 4.18.0

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
- [ ] If the change is releasable, you've added a changeset (`yarn changeset`)

### Commit Message Format

We use conventional commits. Format: `type(scope): description`

Examples:
- `fix(dia.Graph): correct batch event options`
- `feat(dia.Paper): add new zoom feature`
- `docs: update contributing guide`

Types: `feat`, `fix`, `style`, `refactor`, `test`, `chore`, `example`

## Changesets

Versions and changelogs are managed by [Changesets](https://changesets.dev).
Every package keeps its own `CHANGELOG.md`, and each package is versioned
independently.

If your PR changes releasable code, add a changeset:

```bash
yarn changeset
```

Pick the affected package and the bump type (`patch`, `minor`, `major`), then
write a short summary. If your change affects multiple packages and you need
each to be summarized differently, add a separate changeset for each package.
The summary line(s) are what ends up in a package's `CHANGELOG.md`, so write
them for users of the package - we a `scope - description` style:

```markdown
---
"@joint/core": minor
---

dia.Paper: add `originX` and `originY` options to `getFitToContentArea()`
```

Commit the generated `.changeset/*.md` file with your PR.

CI runs `changeset status --since=origin/master` and fails a PR that changes
releasable code in a public package without a changeset. Test-, docs-, demo- and build-config-only changes are exempt - the exact list can be found in
`changedFilePatterns` in [.changeset/config.json](.changeset/config.json). If a
PR touches releasable files but should not trigger a release, add an empty
changeset:

```bash
yarn changeset add --empty
```

## Releasing (maintainers)

Releasing is automated by
[.github/workflows/release.yml](.github/workflows/release.yml), which runs on
every push to `master`:

1. **Version** - while there are pending changesets, the workflow keeps a
   `changeset-release/master` PR ("Version Packages") up to date. That PR applies the
   version bumps, writes the per-package `CHANGELOG.md` entries and deletes the consumed
   changesets.
2. **Publish** - merging that PR is the release. The workflow then builds the workspace,
   runs `changeset publish` (which publishes through `yarn npm publish`), and creates a git
   tag plus a GitHub Release for every published package.

Notes:

- Private packages are never versioned or published.
- Packages depending on `@joint/core` with a `workspace:~` range
  (`@joint/layout-directed-graph`, `@joint/layout-msagl`) get an automatic
  release whenever `@joint/core` gets a minor release, because their dependency
  range has to move.
- `@joint/core`, `@joint/layout-directed-graph` and `@joint/layout-msagl` are
  **linked**, so any of them released together share one version (the highest
  bump type in the run, applied to the group's highest current version). Every
  other package versions independently.
- Prereleases use the standard changesets pre mode:
  `yarn changeset pre enter beta` on `master`, release as usual, then
  `yarn changeset pre exit`.
- Snapshot releases: `yarn changeset version --snapshot` +
  `yarn changeset publish --tag`.

## Code Style

- TypeScript strict mode is enabled
- ESLint flat config (v9) via `@joint/eslint-config`
- Run `yarn lint-fix` before committing

## Questions?

- Open an issue on [GitHub](https://github.com/clientIO/joint/issues)
- Visit [jointjs.com](https://jointjs.com) for documentation
