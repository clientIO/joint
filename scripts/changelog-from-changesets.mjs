#!/usr/bin/env node
// Render the root `CHANGELOG` (and `RELEASE_NOTES.md`) from the pending
// `.changeset/*.md` files, in JointJS's bespoke format.
//
// Why this exists: Changesets owns *versioning* (bumps + `workspace:` ranges +
// rule-based dependent bumps), but it writes per-package `CHANGELOG.md` files in
// its own format. JointJS wants a single root `CHANGELOG` grouped by version with
// a specific class-hierarchy ordering, so we disable Changesets' changelog
// (`"changelog": false` in .changeset/config.json) and render it ourselves.
//
// Run this BEFORE `changeset version` (the changesets must still exist). It reads
// the changesets, computes the resulting versions via Changesets' own release-plan
// API (so the numbers match exactly what `changeset version` will write, including
// the `updateInternalDependents: "out-of-range"` cascade), and prepends the entry
// to `CHANGELOG` / writes `RELEASE_NOTES.md`. It does NOT bump anything or delete
// changesets — that is `changeset version`'s job, run right after.
//
// Usage:
//   node scripts/changelog-from-changesets.mjs [--dry-run] [--date DD-MM-YYYY]
//        [--changelog CHANGELOG] [--release-notes RELEASE_NOTES.md] [--repo owner/name]
//
// Changeset body convention (see .changeset/README.md), one row per line:
//   <feat|fix>(<class>)[!]: <final row text>
// e.g.
//   feat(dia.Paper): add `originX` and `originY` options to `getFitToContentArea()`
//   fix(routers.rightAngle): to allow zero-value margins and un-clamp `minPathMargin`
//   feat(dia.Graph)!: drop the deprecated `cellNamespace` setter
//   feat: packaging changes                 <- no class -> sorts first
// Non feat/fix lines are ignored (they never reach the CHANGELOG).
//
// The GitHub Release notes (RELEASE_NOTES.md) automatically link each row to the
// commit on the base branch that introduced its changeset (the PR's merge/squash
// commit). The root CHANGELOG never carries links. Requires git history — run in a
// non-shallow checkout; links are silently omitted when a commit can't be resolved
// (e.g. an uncommitted changeset in a local dry run).

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { getPackages } from '@manypkg/get-packages';
import readChangesetsMod from '@changesets/read';
import assembleReleasePlanMod from '@changesets/assemble-release-plan';
import { read as readConfig } from '@changesets/config';

const readChangesets = readChangesetsMod.default ?? readChangesetsMod;
const assembleReleasePlan = assembleReleasePlanMod.default ?? assembleReleasePlanMod;

// ---------------------------------------------------------------------------
// Tunables — the JointJS "Section 2" hierarchy. Edit here to change ordering.
// ---------------------------------------------------------------------------

// Packages rendered into the root CHANGELOG / RELEASE_NOTES, in display order.
// Other publishable packages (cli, decorators, shapes-*, vitest-plugin, eslint-config)
// are still versioned & published by the pipeline, but are intentionally NOT
// listed in the human-facing CHANGELOG (matches historical convention).
const DOCUMENTED_PACKAGES = [
    '@joint/react',
    '@joint/core',
    '@joint/layout-directed-graph',
    '@joint/layout-msagl',
];

// Class (scope) namespace priority within a package section — the JointJS
// "Section 2" hierarchy, most-abstract to most-foundational. A row's namespace is
// the first dotted segment of its class (e.g. `dia.Paper` -> `dia`). Rows sort by:
//   1. rows with NO class listed (e.g. `feat: packaging changes`) come first,
//   2. then this namespace index,
//   3. within the namespace: the explicit SUBCLASS_ORDER if any, else alphabetical
//      by full class (so the bare namespace change comes first),
//   4. feat before fix within the exact same class,
//   5. authored order.
// Unknown namespaces (e.g. @joint/react's `<Paper />`, `useCells`) sort last,
// alphabetically among themselves.
const NAMESPACE_ORDER = [
    'shapes',
    'dia',
    'elementTools',
    'linkTools',
    'anchors',
    'linkAnchors',
    'highlighters',
    'layout',
    'connectionPoints',
    'connectionStrategies',
    'connectors',
    'routers',
    'mvc',
    'util',
    'config',
    'Vectorizer',
    'Geometry',
];

// Namespaces whose subclasses have a fixed (non-alphabetical) order. The bare
// namespace (index 0) comes first; classes not listed here sort after the listed
// ones, alphabetically.
const SUBCLASS_ORDER = {
    dia: [
        'dia',
        'dia.Paper',
        'dia.PaperLayer',
        'dia.ElementView',
        'dia.LinkView',
        'dia.CellView',
        'dia.Graph',
        'dia.Element',
        'dia.Link',
        'dia.Cell',
        'dia.attributes',
        'dia.ports',
        'dia.HighlighterView',
        'dia.ToolsView',
        'dia.ToolView',
    ],
    mvc: ['mvc', 'mvc.View', 'mvc.Listener'],
};

// Scope aliases -> canonical namespace (short commit-style scopes for the same class).
const NAMESPACE_ALIASES = {
    V: 'Vectorizer',
    g: 'Geometry',
    geometry: 'Geometry',
};

// ---------------------------------------------------------------------------

function parseArgs(argv) {
    const args = { dryRun: false, date: null, changelog: 'CHANGELOG', releaseNotes: 'RELEASE_NOTES.md', repo: 'clientIO/joint' };
    for (let i = 0; i < argv.length; i++) {
        const a = argv[i];
        if (a === '--dry-run') args.dryRun = true;
        else if (a === '--date') args.date = argv[++i];
        else if (a === '--changelog') args.changelog = argv[++i];
        else if (a === '--release-notes') args.releaseNotes = argv[++i];
        else if (a === '--repo') args.repo = argv[++i];
        else throw new Error(`Unknown argument: ${a}`);
    }
    return args;
}

function todayDDMMYYYY() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`;
}

// Parse a single changeset body line into a row, or null if it is not a
// feat/fix line (those are dropped from the changelog).
function parseRow(line, authoredIndex) {
    const m = line.match(/^\s*(feat|fix)\s*(?:\(([^)]*)\))?\s*(!)?\s*:\s*(.+?)\s*$/);
    if (!m) return null;
    const [, type, rawClass, bang, text] = m;
    return {
        type,
        className: (rawClass || '').trim(),
        breaking: Boolean(bang),
        text,
        commit: null, // resolved per changeset (see resolveCommitSha)
        authoredIndex,
    };
}

// Resolve the commit on the base branch that introduced a changeset file (the
// merge/squash commit of the PR that added it), for linking rows in the GitHub
// Release notes. Returns null when it can't be determined — e.g. the changeset is
// still uncommitted in the working tree (local dry run) or history is unavailable.
function resolveCommitSha(changesetId, cwd) {
    try {
        const out = execFileSync(
            'git',
            ['log', '--diff-filter=A', '-1', '--format=%H', '--', `.changeset/${changesetId}.md`],
            { cwd, stdio: ['ignore', 'pipe', 'ignore'] }
        )
            .toString()
            .trim();
        return out || null;
    } catch {
        return null;
    }
}

function namespaceKey(className) {
    const first = className.split('.')[0];
    return NAMESPACE_ALIASES[first] ?? first;
}

function namespaceIndex(className) {
    if (!className) return -1; // rows with no class listed sort first
    const idx = NAMESPACE_ORDER.indexOf(namespaceKey(className));
    return idx === -1 ? NAMESPACE_ORDER.length : idx;
}

// Order two rows already known to share a namespace: explicit SUBCLASS_ORDER
// position if any (listed classes first, in order), otherwise alphabetical by
// full class (so the bare namespace comes first).
function compareWithinNamespace(a, b) {
    const order = SUBCLASS_ORDER[namespaceKey(a.className)];
    if (order) {
        const ra = order.indexOf(a.className);
        const rb = order.indexOf(b.className);
        const na = ra === -1 ? Number.POSITIVE_INFINITY : ra;
        const nb = rb === -1 ? Number.POSITIVE_INFINITY : rb;
        if (na !== nb) return na - nb;
        // Both unlisted (or same rank): fall back to alphabetical.
    }
    if (a.className !== b.className) return a.className < b.className ? -1 : 1;
    return 0;
}

function compareRows(a, b) {
    const na = namespaceIndex(a.className);
    const nb = namespaceIndex(b.className);
    if (na !== nb) return na - nb;
    const withinNs = compareWithinNamespace(a, b);
    if (withinNs !== 0) return withinNs;
    const ta = a.type === 'feat' ? 0 : 1; // feat before fix within the same class
    const tb = b.type === 'feat' ? 0 : 1;
    if (ta !== tb) return ta - tb;
    return a.authoredIndex - b.authoredIndex;
}

// Render one CHANGELOG row body (without the leading "  * ").
function renderRowText(row) {
    const cls = row.className ? `${row.breaking ? '!' : ''}${row.className} - ` : '';
    const verb = row.type === 'fix' ? 'fix ' : '';
    return `${cls}${verb}${row.text}`;
}

async function main() {
    const args = parseArgs(process.argv.slice(2));
    const date = args.date || todayDDMMYYYY();
    const cwd = process.cwd();

    const packages = await getPackages(cwd);
    const config = await readConfig(cwd, packages);
    const changesets = await readChangesets(cwd);

    if (changesets.length === 0) {
        console.error('No changesets found — nothing to render.');
        process.exitCode = 1;
        return;
    }

    const plan = assembleReleasePlan(changesets, packages, config, undefined);
    const newVersionByPkg = new Map();
    for (const rel of plan.releases) {
        if (rel.type !== 'none') newVersionByPkg.set(rel.name, rel.newVersion);
    }

    // Collect rows per documented package.
    const documented = new Set(DOCUMENTED_PACKAGES);
    const rowsByPackage = new Map(); // pkg -> Row[]
    let authoredCounter = 0;
    for (const cs of changesets) {
        const targets = cs.releases.map((r) => r.name).filter((n) => documented.has(n));
        if (targets.length === 0) continue;
        const rows = cs.summary
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter(Boolean)
            .map((line) => parseRow(line, authoredCounter++))
            .filter(Boolean);
        if (rows.length === 0) continue;
        // All rows from this changeset link to the commit that added the changeset.
        const commit = resolveCommitSha(cs.id, cwd);
        for (const r of rows) r.commit = commit;
        for (const pkg of targets) {
            if (!rowsByPackage.has(pkg)) rowsByPackage.set(pkg, []);
            rowsByPackage.get(pkg).push(...rows.map((r) => ({ ...r })));
        }
    }

    if (rowsByPackage.size === 0) {
        console.error('No feat/fix rows for documented packages — CHANGELOG left unchanged.');
        // Still emit an empty RELEASE_NOTES so downstream steps have a file.
        if (!args.dryRun) writeFileSync(resolve(cwd, args.releaseNotes), '');
        return;
    }

    // Group documented packages by their new version -> version blocks.
    const blocksByVersion = new Map(); // version -> [{pkg, rows}]
    for (const pkg of DOCUMENTED_PACKAGES) {
        if (!rowsByPackage.has(pkg)) continue;
        const version = newVersionByPkg.get(pkg);
        if (!version) {
            console.error(`WARNING: ${pkg} has changelog rows but no version bump in the plan — skipping.`);
            continue;
        }
        const rows = rowsByPackage.get(pkg).sort(compareRows);
        if (!blocksByVersion.has(version)) blocksByVersion.set(version, []);
        blocksByVersion.get(version).push({ pkg, rows });
    }

    // Order blocks by version, highest first.
    const versions = [...blocksByVersion.keys()].sort(compareSemverDesc);

    // ---- Root CHANGELOG entry ------------------------------------------------
    const blockStrings = versions.map((version) => {
        const header = `${date} (v${version})`;
        const subsections = blocksByVersion
            .get(version)
            // package subsections in documented order
            .sort((a, b) => DOCUMENTED_PACKAGES.indexOf(a.pkg) - DOCUMENTED_PACKAGES.indexOf(b.pkg))
            .map(({ pkg, rows }) => {
                const lines = rows.map((r) => `  * ${renderRowText(r)}`);
                return `  ${pkg}\n${lines.join('\n')}`;
            });
        return `${header}\n\n${subsections.join('\n\n')}`;
    });
    const changelogEntry = blockStrings.join('\n\n');

    // ---- RELEASE_NOTES.md (GitHub Release body), grouped by package ----------
    const releaseNotes = DOCUMENTED_PACKAGES.filter((pkg) => rowsByPackage.has(pkg))
        .map((pkg) => {
            const version = newVersionByPkg.get(pkg);
            const rows = rowsByPackage.get(pkg).sort(compareRows);
            const lines = rows.map((r) => {
                const cls = r.className ? `**${r.breaking ? '!' : ''}${r.className}** — ` : '';
                const verb = r.type === 'fix' ? 'fix ' : '';
                const link = r.commit
                    ? ` ([\`${r.commit.slice(0, 7)}\`](https://github.com/${args.repo}/commit/${r.commit}))`
                    : '';
                return `- ${cls}${verb}${r.text}${link}`;
            });
            return `## ${pkg}@${version}\n\n${lines.join('\n')}`;
        })
        .join('\n\n');

    if (args.dryRun) {
        console.log('===== CHANGELOG entry =====\n');
        console.log(changelogEntry);
        console.log('\n===== RELEASE_NOTES.md =====\n');
        console.log(releaseNotes);
        console.log('\n===== released versions =====');
        for (const [name, v] of newVersionByPkg) console.log(`  ${name} -> ${v}`);
        return;
    }

    // Prepend to CHANGELOG.
    const changelogPath = resolve(cwd, args.changelog);
    const existing = readFileSync(changelogPath, 'utf8');
    writeFileSync(changelogPath, `${changelogEntry}\n\n${existing}`);

    // Write RELEASE_NOTES.md (overwrite).
    writeFileSync(resolve(cwd, args.releaseNotes), `${releaseNotes}\n`);

    console.error(`Rendered ${versions.length} version block(s) into ${args.changelog} and wrote ${args.releaseNotes}.`);
}

// Descending semver compare good enough for X.Y.Z[-tag.N].
function compareSemverDesc(a, b) {
    const parse = (v) => {
        const [core, pre] = v.split('-');
        const nums = core.split('.').map(Number);
        return { nums, pre: pre || null };
    };
    const pa = parse(a);
    const pb = parse(b);
    for (let i = 0; i < 3; i++) {
        if ((pa.nums[i] || 0) !== (pb.nums[i] || 0)) return (pb.nums[i] || 0) - (pa.nums[i] || 0);
    }
    // A version WITH a prerelease tag is lower than one without.
    if (pa.pre && !pb.pre) return 1;
    if (!pa.pre && pb.pre) return -1;
    if (pa.pre && pb.pre) return pa.pre < pb.pre ? 1 : pa.pre > pb.pre ? -1 : 0;
    return 0;
}

main().catch((err) => {
    console.error(err);
    process.exitCode = 1;
});
