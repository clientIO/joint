# Changesets

This folder is managed by [Changesets](https://github.com/changesets/changesets). A
changeset is a small Markdown file that records, at PR time, **which packages to bump**
and **what to write in the changelog** for a change.

## Adding a changeset

Run:

```bash
yarn changeset
```

Pick the package(s) your change affects and the bump type (`patch` / `minor` / `major`),
then write the changelog line(s). This creates a `.changeset/<random-name>.md` file — commit
it with your PR. CI (`changeset status`) fails a PR that changes releasable code but adds no
changeset. Docs-, test-, and demo-only PRs don't need one (see below); if CI still asks for
one, add an empty changeset with `yarn changeset --empty`.

### Which file changes require a changeset (`changedFilePatterns`)

`config.json`'s `changedFilePatterns` decides whether a PR touched *releasable* code. The rule
is **allow everything, then subtract an ignore list** (`"**"` + `"!…"` negations) — a file in a
publishable package triggers a bump requirement **unless** it matches an ignore pattern. This
mirrors the previous Yarn `changesetIgnorePatterns` setup (where a file counted unless ignored),
so a brand-new kind of shipped file requires a changeset by default. JSON can't hold comments,
so the annotated intent lives here:

A change to a publishable package requires a changeset when it touches **distributed source,
types, an entry file, or the manifest** — for reference, the paths that *do* trigger a bump:

- `**/src/**` — source (all packages)
- `**/types/**` — `@joint/core` public type tree
- `**/*.d.ts` — hand-written type decls (e.g. `svg.d.ts`, `DirectedGraph.d.ts`)
- `**/package.json` — dependencies / exports / manifest
- `**/wrappers/**` — `@joint/core` build-time bundle wrappers
- `**/mocks/**` — `@joint/vitest-plugin-mock-svg` shipped mocks
- `**/index.js`, `**/index.mjs`, `**/joint.mjs`, `**/DirectedGraph.mjs` — package entry files
- `**/eslint.config.*.mjs` — `@joint/eslint-config` product configs (note: `eslint.config.mjs`,
  the per-package lint config, is **ignored**)

Everything else is **ignored** (never triggers a bump), grouped as:

- **Tests / mocks / benchmarks / demos / stories** (not shipped):
  `**/*.test.{js,jsx,ts,tsx,mjs}`, `**/test/**`, `**/__mocks__/**`, `**/bench/**`, `**/demo/**`,
  `**/stories/**`, `**/.storybook/**`
- **Generated output & caches**: `**/dist/**`, `**/build/**`, `**/coverage/**`, `**/coverage.json`,
  `**/.tscache/**`
- **Build & tooling scripts / config**: `**/scripts/**`, `**/grunt/**`, `**/Gruntfile.js`,
  `**/Makefile`, `**/rollup.config.*`, `**/rollup.resources.mjs`, `**/vite.config.*`,
  `**/vitest.workspace.*`, `**/jest.config.js`, `**/jest.react18.config.mjs`, `**/karma.conf.js`,
  `**/tsconfig*.json`, `**/dts-generator.config.js`, `**/api-extractor.json`, `**/knip.json`,
  `**/typedoc.*`, `**/.prettierrc*`, `**/.gitignore`, `**/eslint.config.mjs`
- **Documentation & metadata**: `**/*.md`, `**/LICENSE`

> Test files are matched by **naming convention** (`*.test.{js,jsx,ts,tsx,mjs}`), which covers
> `@joint/react`'s `.ts`/`.tsx` tests under `src/**/__tests__/` without blanket-ignoring the
> directory (the lone non-`.test` file there, a `.md` benchmark, is already ignored by `**/*.md`).
> Because patterns are matched **per package** (relative to each package dir), the ignore
> negations override the broad `"**"` — e.g. a `demo/index.js` does not require a changeset even
> though it lives in a publishable package.

## Body convention (important — our renderer depends on it)

We render the root `CHANGELOG` ourselves (`"changelog": false` in `config.json`,
`scripts/changelog-from-changesets.mjs`), so the changeset **body** must follow our
semantic-commit convention — the same `type(scope): description` you already use in commits.
Write **one changelog row per line**:

```
<feat|fix>(<class>)[!]: <final row text>
```

- **`type`** — `feat` or `fix`. Any other line (`docs`, `chore`, `refactor`, plain prose, …)
  is ignored by the renderer and never reaches the changelog. `feat` rows print as-is;
  `fix` rows get the word `fix ` prepended, so phrase the text to read well after it
  (e.g. `fix(util): to guard against prototype pollution` → `util - fix to guard …`).
- **`class`** — the scope, e.g. `dia.Paper`, `routers.rightAngle`, `<Paper />`. It becomes
  the row prefix (`dia.Paper - …`) and drives ordering (see `NAMESPACE_ORDER` /
  `SUBCLASS_ORDER` in the renderer, which encode the "Section 2" class hierarchy).
- **`!`** before the `:` marks a **breaking** change; it renders as a leading `!` on the
  class (`!dia.Graph - …`).

Don't add PR or commit references by hand. The root `CHANGELOG` never carries links, and the
**GitHub Release notes (`RELEASE_NOTES.md`) link each row automatically** to the commit on
`master` that introduced its changeset (the PR's merge/squash commit).

### Frontmatter vs. body

- **Frontmatter** = the per-package version bumps (Changesets' native meaning). This is what
  gets released.
- **Body** = the changelog rows. Rows are attributed to the package(s) named in the
  frontmatter. **Keep a changeset focused on one documented package**; if a single PR needs
  distinct rows for different packages, write separate changeset files.

### Which packages appear in the CHANGELOG

Only these four are rendered into the root `CHANGELOG` / `RELEASE_NOTES.md`, in this order:

1. `@joint/react`
2. `@joint/core`
3. `@joint/layout-directed-graph`
4. `@joint/layout-msagl`

Other publishable packages (`@joint/cli`, `@joint/decorators`, `@joint/shapes-general`,
`@joint/shapes-general-tools`, `@joint/vitest-plugin-mock-svg`, `@joint/eslint-config`) are
still **versioned and published** when a changeset names them (or when they're bumped as a
dependent), but they are intentionally **omitted from the human-facing CHANGELOG**. Add them
to `DOCUMENTED_PACKAGES` in the renderer if that ever needs to change.

## Example

```markdown
---
"@joint/core": minor
---
feat(dia.Paper): add `originX` and `originY` options to `getFitToContentArea()`
fix(routers.rightAngle): to allow zero-value margins and un-clamp `minPathMargin`
```

## Dependent bumps

`config.json` uses `updateInternalDependents: "out-of-range"`, so a package is auto-bumped
only when a dependency's **new version falls outside its declared `workspace:` range**:

- `@joint/react` depends on `@joint/core` via `workspace:^` → ignores core **patch and minor**
  bumps (only a core **major** cascades to react).
- Everything else depends on core via `workspace:~` → ignores core **patch** bumps (a core
  **minor** or **major** cascades).

Cascaded packages are published but, having no authored rows, don't appear in the CHANGELOG.

## Releasing

Releases are driven by the `release.yml` / `publish.yml` GitHub Actions workflows, not by
`changeset publish`. See `CONTRIBUTING.md` → *Releasing*.
