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

const external = [
    '@joint/core',
    'elkjs/lib/elk.bundled.js',
    'elkjs/lib/elk-api.js'
];

const globals = {
    '@joint/core': 'joint',
    'elkjs/lib/elk.bundled.js': 'ELK',
    'elkjs/lib/elk-api.js': 'ELK'
};

export default [
    {
        input,
        external,
        output: [
            {
                file: 'dist/umd/index.js',
                format: 'umd',
                name: 'joint.layout.ELK',
                extend: true,
                globals,
                plugins: [
                    banner(() => bannerText)
                ]
            },
            {
                file: 'dist/umd/index.min.js',
                format: 'umd',
                name: 'joint.layout.ELK',
                extend: true,
                globals,
                plugins: [
                    terser({ format: { ascii_only: true }}),
                    banner(() => bannerText)
                ]
            },
        ],
        plugins: [
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
        external,
        output: [
            {
                file: 'build/test/index.js',
                format: 'umd',
                name: 'joint.layout.ELK',
                extend: true,
                globals,
                sourcemap: true
            }
        ],
        plugins: [
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
