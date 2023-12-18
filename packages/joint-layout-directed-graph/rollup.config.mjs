import { nodeResolve } from '@rollup/plugin-node-resolve';

const input = ['./DirectedGraph.mjs'];

export default [
    {
        input,
        external: [
            'dagre',
            'graphlib',
            'jointjs'
        ],
        output: {
            file: 'build/DirectedGraph.js',
            format: 'iife',
            // hack to expose named exports in browser without a namespace
            // (equivalent to `import { namedExport, ... } from 'this-package'`)
            // see https://github.com/rollup/rollup/issues/494
            name: 'window',
            extend: true,
            globals: {
                'dagre': 'dagre',
                'graphlib': 'graphlib',
                'jointjs': 'joint'
            }
        },
        plugins: [nodeResolve()]
    }
];
