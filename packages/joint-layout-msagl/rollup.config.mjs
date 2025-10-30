import packageJson from './package.json' with { type: 'json' };
import banner from 'rollup-plugin-banner2';
import terser from '@rollup/plugin-terser';
import { nodeResolve } from '@rollup/plugin-node-resolve';

// JointJS banner.
// - see `joint-core/grunt/resources/banner.js`
const today = new Date();
const formattedDate = `${today.toLocaleDateString('en-US', { year: 'numeric' })}-${today.toLocaleDateString('en-US', { month: '2-digit' })}-${today.toLocaleDateString('en-US', { day: '2-digit' })}`;
const bannerText = `/*! ${packageJson.title} v${packageJson.version} (${formattedDate}) - ${packageJson.description}\n\nThis Source Code Form is subject to the terms of the Mozilla Public\nLicense, v. 2.0. If a copy of the MPL was not distributed with this\nfile, You can obtain one at http://mozilla.org/MPL/2.0/.\n*/\n\n`;

const input = ['./dist/esm/index.mjs'];

export default [
    {
        input,
        external: [
            '@joint/core',
            '@msagl/core'
        ],
        output: [
            {
                file: 'dist/umd/index.js',
                format: 'umd',
                name: 'joint.layout.MSAGL',
                extend: true,
                globals: {
                    '@joint/core': 'joint',
                    '@msagl/core': 'msagl'
                },
                plugins: [
                    banner(() => bannerText)
                ]
            },
            {
                file: 'dist/umd/index.min.js',
                format: 'umd',
                name: 'joint.layout.MSAGL',
                extend: true,
                globals: {
                    '@joint/core': 'joint',
                    '@msagl/core': 'msagl'
                },
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
    }
];
