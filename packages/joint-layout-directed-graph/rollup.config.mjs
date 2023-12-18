import { nodeResolve } from '@rollup/plugin-node-resolve';

const input = ['./DirectedGraph.mjs'];

export default [
    {
        input,
        external: [
            '@dagrejs/dagre',
            '@dagrejs/graphlib',
            'jointjs'
        ],
        output: {
            file: 'build/DirectedGraph.umd.js',
            format: 'umd',
            name: 'joint.layout',
            extend: true,
            globals: {
                '@dagrejs/dagre': 'dagre',
                '@dagrejs/graphlib': 'graphlib',
                'jointjs': 'joint'
            }
        },
        plugins: [nodeResolve()]
    }
];
