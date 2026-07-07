import { readFileSync } from 'node:fs';

// JointJS banner.
// - see `joint-core/grunt/resources/banner.js`
const packageJson = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const today = new Date();
const formattedDate = `${today.toLocaleDateString('en-US', { year: 'numeric' })}-${today.toLocaleDateString('en-US', { month: '2-digit' })}-${today.toLocaleDateString('en-US', { day: '2-digit' })}`;
export const bannerText = `/*! ${packageJson.title} v${packageJson.version} (${formattedDate}) - ${packageJson.description}\n\nThis Source Code Form is subject to the terms of the Mozilla Public\nLicense, v. 2.0. If a copy of the MPL was not distributed with this\nfile, You can obtain one at http://mozilla.org/MPL/2.0/.\n*/\n\n`;
