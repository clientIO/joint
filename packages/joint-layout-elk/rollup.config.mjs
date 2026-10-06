import packageJson from './package.json' with { type: 'json' };
import banner from 'rollup-plugin-banner2';
import terser from '@rollup/plugin-terser';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';

// JointJS banner.
// - see `joint-core/grunt/resources/banner.js`
const today = new Date();
const formattedDate = `${today.toLocaleDateString('en-US', { year: 'numeric' })}-${today.toLocaleDateString('en-US', { month: '2-digit' })}-${today.toLocaleDateString('en-US', { day: '2-digit' })}`;
const bannerText = `/*! ${packageJson.title} v${packageJson.version} (${formattedDate}) - ${packageJson.description}\n\nThis Source Code Form is subject to the terms of the Mozilla Public\nLicense, v. 2.0. If a copy of the MPL was not distributed with this\nfile, You can obtain one at http://mozilla.org/MPL/2.0/.\n*/\n\n`;

const input = ['./dist/esm/index.mjs'];

// Replaces the module imported as `<name>.mjs` with `code`.
const replaceModule = (name, code) => {
    const id = `\0${name}`;
    const pattern = new RegExp(`(^|/)${name}\\.mjs$`);
    return {
        name: `replace-${name}`,
        resolveId(source) {
            return pattern.test(source) ? id : null;
        },
        load(loadId) {
            return (loadId === id) ? code : null;
        }
    };
};

// A UMD bundle has no way to locate a worker file of its own - replace the module that
// starts one (see `src/workerFactory.mts`) with one that doesn't, so `layout()` runs ELK
// on the main thread by default.
const noWorker = replaceModule('workerFactory', 'export function createElkWorker() { return undefined; }');

// The unit test bundle starts whichever worker a test hands it (`window.__createElkWorker`),
// so the default worker - and falling back from it - can be tested too (see `test/index.js`).
const testWorker = replaceModule(
    'workerFactory',
    'export function createElkWorker() { return window.__createElkWorker ? window.__createElkWorker() : undefined; }'
);

// A UMD bundle can't load a chunk of its own either - replace the module that imports
// main-thread ELK dynamically (see `src/mainThreadElk.mts`) with one importing it
// statically, i.e. the `ELK` global.
const staticMainThreadElk = replaceModule(
    'mainThreadElk',
    'import ElkConstructor from \'elkjs/lib/elk.bundled.js\'; export function loadMainThreadElk() { return Promise.resolve(ElkConstructor); }'
);

// The unit test bundle loads main-thread ELK the same way, unless a test hands it a loader
// of its own (`window.__loadMainThreadElk`), so failing to load it can be tested too.
const testMainThreadElk = replaceModule(
    'mainThreadElk',
    'import ElkConstructor from \'elkjs/lib/elk.bundled.js\'; export function loadMainThreadElk() { return window.__loadMainThreadElk ? window.__loadMainThreadElk() : Promise.resolve(ElkConstructor); }'
);

export default [
    {
        input,
        external: [
            '@joint/core',
            'elkjs/lib/elk.bundled.js'
        ],
        output: [
            {
                file: 'dist/umd/index.js',
                format: 'umd',
                name: 'joint.layout.ELK',
                extend: true,
                globals: {
                    '@joint/core': 'joint',
                    'elkjs/lib/elk.bundled.js': 'ELK'
                },
                plugins: [
                    banner(() => bannerText)
                ]
            },
            {
                file: 'dist/umd/index.min.js',
                format: 'umd',
                name: 'joint.layout.ELK',
                extend: true,
                globals: {
                    '@joint/core': 'joint',
                    'elkjs/lib/elk.bundled.js': 'ELK'
                },
                plugins: [
                    terser({ format: { ascii_only: true }}),
                    banner(() => bannerText)
                ]
            },
        ],
        plugins: [
            noWorker,
            staticMainThreadElk,
            nodeResolve({
                preferBuiltins: false
            })
        ]
    },
    // Source-mapped bundle for unit tests (see `karma.conf.js`)
    // - Compiles TypeScript directly instead of reusing from `dist`/`esm`
    // - (Because Rollup cannot follow inline maps left behind by `tsc`)
    {
        input: ['./src/index.mts'],
        external: [
            '@joint/core',
            'elkjs/lib/elk.bundled.js'
        ],
        output: [
            {
                file: 'build/test/index.js',
                format: 'umd',
                name: 'joint.layout.ELK',
                extend: true,
                globals: {
                    '@joint/core': 'joint',
                    'elkjs/lib/elk.bundled.js': 'ELK'
                },
                sourcemap: true
            }
        ],
        plugins: [
            testWorker,
            testMainThreadElk,
            nodeResolve({
                preferBuiltins: false
            }),
            typescript({
                tsconfig: './tsconfig.json',
                compilerOptions: {
                    // Rollup writes its own source map
                    inlineSourceMap: false,
                    inlineSources: false,
                    sourceMap: true,
                    declaration: false,
                    declarationMap: false,
                }
            })
        ]
    }
];
