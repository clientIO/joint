import commonjs from 'rollup-plugin-commonjs';
import babel from 'rollup-plugin-babel';
import path from 'path';

export default [
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
    },
    {
        input: './wrappers/vectorizer.iife.js',
        external: [
            './geometry.js'
        ],
        output: [{
            file: './build/iife/vectorizer.js',
            format: 'iife',
            name: 'V',
            freeze: false,
            globals: function(resource) {
                const localDependencies = {};
                localDependencies[path.resolve('./src/geometry.js')] = 'g';
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

]
