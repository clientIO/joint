# Changesets

This folder holds pending changesets. Versions, `CHANGELOG.md` files and npm
publishing are driven from them by
[`@changesets/cli`](https://github.com/changesets/changesets)
- see [CONTRIBUTING.md](../CONTRIBUTING.md#changesets) for the full workflow and
  [Changeset format](../CONTRIBUTING.md#changeset-format) for the rules this
  project expects.

Add one with `yarn changeset`, or write the file by hand:

```markdown
---
"@joint/core": minor
---

dia.Paper - add `originX` and `originY` options to `getFitToContentArea()`
```

The short version of the format:

- **Frontmatter** - which packages this changeset releases, and the bump type
  (`patch`, `minor`, `major`). Listing several packages is rare: the body is
  copied verbatim into each one's changelog. Prefer one changeset per package.
- **Body** - the changelog entry, one line, `scope - description`. One changeset
  becomes exactly one changelog bullet (later lines are folded into that same
  bullet, not turned into new ones) - so write no `-`/`*` bullets of your own
  and add another changeset file for each further changelog line.
- **Scope** - usually `namespace.Class` (`dia.Paper`, `elementTools.Control`,
  `mvc.View`, `layout.MSAGL`), or the component/hook for `@joint/react`
  (`<Paper />`, `useCells`). A bare `namespace` (`anchors`, `connectionPoints`)
  when the change covers all of it; no scope at all for package-wide,
  architectural changes.
- **Description** - less than ~100 characters, lowercase, no trailing period,
  verb first. Code artifacts in backticks (`` `changeId` ``,
  `` `batch:start` ``, `` `initializeUnmounted: true` ``); functions and
  methods always with `()`.

An empty changeset (`yarn changeset add --empty`) marks a PR that touches
releasable files but should not trigger a release.
