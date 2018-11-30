import commonjs from 'rollup-plugin-commonjs';
import resolve from 'rollup-plugin-node-resolve';

export default [
    {
        input: './index.js',
        external: [
            'jquery',
            'backbone',
            'lodash'
        ],
        output: [{
            banner: '/* package without dependencies - include dependencies separately */',
            file: 'dist/index.rollup.js',
            format: 'iife',
            freeze: false, // opting-out of Object.freeze usage
            name: 'joint',
            globals: {
                'backbone': 'Backbone',
                'lodash': '_',
                'jquery': '$'
            }
        }],
        plugins: [
            resolve(),
            commonjs(),
        ]
    },
    {
        input: './index.js',
        output: [{
            banner: '/* bundle with all dependencies - jquery, lodash, backbone */',
            file: 'dist/index.rollup-bundle.js',
            freeze: false, // opting-out of Object.freeze usage
            format: 'iife',
            name: 'joint',
        }],
        plugins: [
            resolve(),
            commonjs(),
        ]
    }
]
