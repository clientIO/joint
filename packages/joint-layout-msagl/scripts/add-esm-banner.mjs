import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { bannerText } from './banner.mjs';

// The ESM build is emitted by `tsc` (see `build:esm`), which cannot prepend a
// banner. Add the JointJS banner to the emitted `.mjs` files as a post-build
// step so the shipped ESM entry points carry it (the UMD build gets its banner
// from `rollup-plugin-banner2` in `rollup.config.mjs`).
const esmDir = fileURLToPath(new URL('../dist/esm', import.meta.url));

for (const fileName of readdirSync(esmDir)) {
    if (!fileName.endsWith('.mjs')) continue;
    const filePath = join(esmDir, fileName);
    const content = readFileSync(filePath, 'utf8');
    if (content.startsWith(bannerText)) continue;
    writeFileSync(filePath, bannerText + content);
}
