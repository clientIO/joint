import commonjs from 'rollup-plugin-commonjs';
import babel from 'rollup-plugin-babel';
import path from 'path';

export default [
    {
        input: './src/core.js',
        external: [
            'backbone',
            'jquery',
            'lodash'
        ],
        output: [{
            file: './build/iife/core.js',
            format: 'iife',
            name: 'joint',
            freeze: false, // opting-out of Object.freeze usage
            globals: {
                'backbone': 'Backbone',
                'jquery': '$',
                'lodash': '_'
            },
            footer: `joint.ui = {};\njoint.layout = {};\njoint.shapes = {};\njoint.format = {};\njoint.connectors = {};\njoint.highlighters = {};\njoint.routers = {};\njoint.anchors = {};\njoint.connectionPoints = {};\njoint.connectionStrategies = {};\njoint.linkTools = {};\nvar V = joint.V;\nvar g = joint.g;`
        }],
        plugins: [
            babel({
                exclude: 'node_modules/**'
            }),
            commonjs()
        ]
    },
    {
        input: './wrappers/vectorizer.iife.js',
        external: [
            './geometry'
        ],
        output: [{
            file: './build/iife/vectorizer.js',
            format: 'iife',
            name: 'V',
            freeze: false,
            globals: function(resource) {
                const localDependencies = {};
                localDependencies[path.resolve('./src/geometry')] = 'g';
                return localDependencies[path.resolve(resource)];
            }
        }],
        plugins: [
            babel({
                exclude: 'node_modules/**'
            }),
            commonjs()
        ]
    },
    {
        input: './src/geometry.js',
        output: [{
            file: './build/iife/geometry.js',
            format: 'iife',
            name: 'g',
            freeze: false
        }],
        plugins: [
            babel({
                exclude: 'node_modules/**'
            }),
            commonjs()
        ]
    }
]
