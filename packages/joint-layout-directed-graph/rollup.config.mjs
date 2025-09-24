import packageJson from './package.json' with { type: 'json' };
import banner from 'rollup-plugin-banner2';
import terser from '@rollup/plugin-terser';
import { nodeResolve } from '@rollup/plugin-node-resolve';

const today = new Date();
const formattedDate = today.toLocaleDateString("en-US", { year: 'numeric' }) + "-" + today.toLocaleDateString("en-US", { month: '2-digit' }) + "-" + today.toLocaleDateString("en-US", { day: '2-digit' });
const bannerText = `/*! ${packageJson.title} v${packageJson.version} (${formattedDate}) - ${packageJson.description}\n\nThis Source Code Form is subject to the terms of the Mozilla Public\nLicense, v. 2.0. If a copy of the MPL was not distributed with this\nfile, You can obtain one at http://mozilla.org/MPL/2.0/.\n*/\n\n`;

const input = ['./DirectedGraph.mjs'];

export default [
    {
        input,
        external: [
            '@dagrejs/dagre',
            '@dagrejs/graphlib',
            '@joint/core'
        ],
        output: [
            {
                file: 'dist/DirectedGraph.js',
                format: 'umd',
                name: 'joint.layout',
                extend: true,
                globals: {
                    '@dagrejs/dagre': 'dagre',
                    '@dagrejs/graphlib': 'graphlib',
                    '@joint/core': 'joint'
                },
                plugins: [
                    // Add JointJS banner to all distribution files.
                    banner(() => bannerText)
                ]
            },
            {
                file: 'dist/DirectedGraph.min.js',
                format: 'umd',
                name: 'joint.layout',
                extend: true,
                globals: {
                    '@dagrejs/dagre': 'dagre',
                    '@dagrejs/graphlib': 'graphlib',
                    '@joint/core': 'joint'
                },
                plugins: [
                    // Uglify.
                    terser({ format: { ascii_only: true, preamble: `'use strict';` }}),
                    // Add JointJS banner to all distribution files.
                    banner(() => bannerText)
                ]
            },
        ],
        plugins: [
            nodeResolve()
        ]
    }
];
