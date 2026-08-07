#!/usr/bin/env node
// Print release metadata derived from the pending `.changeset/*.md` files, for
// the release workflow to build the commit/PR title. Run BEFORE `changeset version`.
//
// Emits `KEY=VALUE` lines to stdout, and also appends them to $GITHUB_OUTPUT when set:
//   core_version=<new @joint/core version>
//   core_changed=<true|false>   (is @joint/core in the release plan?)
//   release_title=Release v<ver> (<pkg>), ...   (documented packages only)
//   released=<comma-separated pkg@version for ALL released packages>

import { appendFileSync } from 'node:fs';
import { getPackages } from '@manypkg/get-packages';
import readChangesetsMod from '@changesets/read';
import assembleReleasePlanMod from '@changesets/assemble-release-plan';
import { read as readConfig } from '@changesets/config';

const readChangesets = readChangesetsMod.default ?? readChangesetsMod;
const assembleReleasePlan = assembleReleasePlanMod.default ?? assembleReleasePlanMod;

// Keep in sync with DOCUMENTED_PACKAGES in changelog-from-changesets.mjs.
const DOCUMENTED_PACKAGES = [
    '@joint/react',
    '@joint/core',
    '@joint/layout-directed-graph',
    '@joint/layout-msagl',
];

const cwd = process.cwd();
const packages = await getPackages(cwd);
const config = await readConfig(cwd, packages);
const changesets = await readChangesets(cwd);
const plan = assembleReleasePlan(changesets, packages, config, undefined);

const released = plan.releases.filter((r) => r.type !== 'none');
const versionByPkg = new Map(released.map((r) => [r.name, r.newVersion]));

const core = versionByPkg.get('@joint/core');
const coreVersion = core ?? packages.packages.find((p) => p.packageJson.name === '@joint/core').packageJson.version;
const coreChanged = versionByPkg.has('@joint/core');

const titleParts = DOCUMENTED_PACKAGES.filter((p) => versionByPkg.has(p)).map(
    (p) => `v${versionByPkg.get(p)} (${p})`
);
// Fall back to any released package so the title is never empty (still starts with "Release v").
if (titleParts.length === 0) {
    for (const r of released) titleParts.push(`v${r.newVersion} (${r.name})`);
}
const releaseTitle = `Release ${titleParts.join(', ')}`;
const releasedList = released.map((r) => `${r.name}@${r.newVersion}`).join(',');

const out = [
    `core_version=${coreVersion}`,
    `core_changed=${coreChanged}`,
    `release_title=${releaseTitle}`,
    `released=${releasedList}`,
];

for (const line of out) console.log(line);
if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, out.join('\n') + '\n');
