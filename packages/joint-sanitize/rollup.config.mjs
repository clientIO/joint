import packageJson from './package.json' with { type: 'json' };
import banner from 'rollup-plugin-banner2';
import terser from '@rollup/plugin-terser';
import { nodeResolve } from '@rollup/plugin-node-resolve';

// JointJS banner.
// - see `joint-core/grunt/resources/banner.js`
const today = new Date();
const formattedDate = `${today.toLocaleDateString('en-US', { year: 'numeric' })}-${today.toLocaleDateString('en-US', { month: '2-digit' })}-${today.toLocaleDateString('en-US', { day: '2-digit' })}`;
const bannerText = `/*! ${packageJson.title} v${packageJson.version} (${formattedDate}) - ${packageJson.description}\n\nThis Source Code Form is subject to the terms of the Mozilla Public\nLicense, v. 2.0. If a copy of the MPL was not distributed with this\nfile, You can obtain one at http://mozilla.org/MPL/2.0/.\n*/\n\n`;

const input = ['./src/index.mjs'];

export default [
    {
        input,
        external: [
            '@joint/core'
        ],
        output: [
            {
                file: 'dist/sanitize.js',
                format: 'umd',
                name: 'joint.util',
                extend: true,
                globals: {
                    '@joint/core': 'joint'
                },
                plugins: [
                    // Add JointJS banner to all distribution files.
                    banner(() => bannerText)
                ]
            },
            {
                file: 'dist/sanitize.min.js',
                format: 'umd',
                name: 'joint.util',
                extend: true,
                globals: {
                    '@joint/core': 'joint'
                },
                plugins: [
                    // Uglify.
                    // - see `joint-core/grunt/config/uglify.js`
                    terser({
                        // preserve `'use strict'` inside minified files:
                        compress: {
                            module: false
                        },
                        format: {
                            ascii_only: true
                        }
                    }),
                    // Add JointJS banner to all distribution files.
                    banner(() => bannerText)
                ]
            },
            // Source-mapped bundle for unit tests (see `karma.conf.js`)
            {
                file: 'build/test/sanitize.js',
                format: 'umd',
                name: 'joint.util',
                extend: true,
                globals: {
                    '@joint/core': 'joint'
                },
                sourcemap: true
            },
        ],
        plugins: [
            nodeResolve()
        ]
    }
];
