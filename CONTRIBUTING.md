# Contributing to JointJS

Thank you for your interest in contributing to JointJS! This document provides
guidelines and instructions for contributing.

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
Every package keeps its own `CHANGELOG.md`. Most packages are versioned
independently; the exception is `@joint/core`, `@joint/layout-directed-graph`
and `@joint/layout-msagl`, which are **linked** - whenever two or more of them
are released in the same run, they all land on one shared version number.
Linking only applies to the packages actually being released, so the three do
drift apart between releases. See [Releasing](#releasing-maintainers) for the
details.

If your PR changes releasable code, add a changeset:

```bash
yarn changeset
```

Pick the affected package and the bump type (`patch`, `minor`, `major`), then
write the summary as described in [Changeset format](#changeset-format) below.
Commit the generated `.changeset/*.md` file with your PR.

CI runs `changeset status --since=origin/master` and fails a PR that changes
releasable code in a public package without a changeset. Test-, docs-, demo- and
build-config-only changes are exempt - the exact list can be found in
`changedFilePatterns` in [.changeset/config.json](.changeset/config.json). If a
PR touches releasable files but should not trigger a release, add an empty
changeset:

```bash
yarn changeset add --empty
```

### Changeset format

A changeset is a Markdown file in [.changeset/](.changeset/) with YAML
frontmatter. The frontmatter says **which packages** the change releases; the
body is the **changelog entry** that gets written into each of those packages'
`CHANGELOG.md`:

```markdown
---
"@joint/core": minor
---

dia.Paper - add `originX` and `originY` options to `getFitToContentArea()`
```

**Keep the body to a single line - one changeset produces exactly one changelog
bullet.** Only the body's first line receives the `- ` marker; any further lines
are indented beneath it and render as continuation text of that same bullet
rather than as entries of their own. So do not write your own `-`/`*` bullets or
Markdown headings in the body, and add another changeset file for every
additional changelog line you need. Most often that happens because a PR touches
several packages - see [Frontmatter](#frontmatter) below.

#### Frontmatter

Each key is a package name, each value is the bump type (`patch`, `minor`,
`major`). **Listing more than one package in a single changeset should be
rare** - the body is copied unchanged into every listed package's changelog,
which is only correct when the exact same sentence is right for all of them.
When one commit touches several packages, write a separate changeset per
package, each with a body phrased for that package's users.

#### Body

Follow the changelog style already used in the packages' `CHANGELOG.md` files:
a scope, ` - ` (space-hyphen-space), then a short description.

**Scope.** Most commonly `namespace.Class`:

```markdown
dia.Paper - add `getCellView()` method for strict view lookup
mvc.View - add `classNamePrefix` instance property to override the `joint-` CSS class prefix
elementTools.Control - respect the `padding` option when computing the handle position
layout.DirectedGraph - add `rankSep` option
```

For `@joint/react`, the scope is the exported component or hook - components
written as JSX tags, hooks by name:

```markdown
<Paper /> - fix the visual grid to redraw reactively when `drawGrid` changes
useCells - fix ghost cells reported after `resetCells()`
```

Less commonly, a bare `namespace` when the change applies to everything in it
and repeating it per class would be noise:

```markdown
anchors - add `rotate` option to all built-in anchors
connectionPoints - fix stroke-width handling on transformed elements
```

Least commonly, **no scope at all** for overarching or architectural changes
that affect the whole package - then the body is just the description, with no
scope and no leading ` - `:

```markdown
drop support for Internet Explorer 11
publish native ESM alongside the UMD bundle
```

The one fixed exception is a brand-new package, which uses the literal scope
`new package`:

```markdown
new package - idiomatic React components and hooks for JointJS, built directly on the core engine
```

**Description.** Keep it to less than ~100 characters. Start lowercase, no
trailing period. Lead with a verb (`add`, `fix`, `deprecate`, `remove`,
`support`); a bug fix reads naturally as `fix <what>` or `fix to <do what>`.

**Code artifacts** mentioned in the description - and most descriptions mention
at least one - go in backticks: `` `changeId` ``, `` `batch:start` ``,
`` `initializeUnmounted: true` ``, `` `drawGrid` ``. Function and method names
always carry trailing parentheses:

| Write | Not |
| --- | --- |
| ``of `layout()` `` | of the layout function |
| ``of `layout()` `` | ``of `layout()` function`` |
| ``fix `toJSON()` to honor the option`` | fix `toJSON` to honor the option |

## Releasing (maintainers)

Releasing is automated by
[.github/workflows/release.yml](.github/workflows/release.yml), which runs on
every push to `master`:

1. **Version** - while there are pending changesets, the workflow keeps a
   `changeset-release/master` PR ("Version Packages") up to date. That PR
   applies the version bumps, writes the per-package `CHANGELOG.md` entries and
   deletes the consumed changesets.
2. **Publish** - merging that PR is the release. The workflow then builds the
   workspace, runs `changeset publish` (which publishes through
   `yarn npm publish`), and creates a git tag plus a GitHub Release for every
   published package.

Notes:

- Private packages are never versioned or published.
- A package is only dragged into a release by a dependency when the new version
  falls **outside** its declared range. `workspace:~` expands to
  `~<core's current version>`, so `@joint/layout-directed-graph`,
  `@joint/layout-msagl` and `@joint/decorators` get an automatic patch release
  on a `@joint/core` **minor** or major, but not on a `@joint/core` patch -
  `4.3.2` still satisfies `~4.3.1`. `@joint/react` uses `workspace:^`, so it
  only rides along on a `@joint/core` **major**.
- `@joint/core`, `@joint/layout-directed-graph` and `@joint/layout-msagl` are
  **linked**, so any of them released together share one version (the highest
  bump type in the run, applied to the group's highest current version).
  Linking only covers the packages in that run - a linked package with nothing
  to release keeps its current version, which is how `@joint/core` can sit at
  `4.3.1` while both layout packages are still at `4.3.0`. Every other package
  versions independently.
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
