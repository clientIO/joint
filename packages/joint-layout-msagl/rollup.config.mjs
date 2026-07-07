import banner from 'rollup-plugin-banner2';
import terser from '@rollup/plugin-terser';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import { bannerText } from './scripts/banner.mjs';

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
