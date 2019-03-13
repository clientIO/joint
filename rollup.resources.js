import commonjs from 'rollup-plugin-commonjs';
import babel from 'rollup-plugin-babel';
import path from 'path';

const modules = require('./grunt/resources/es6');

let plugins = [
    babel({
        exclude: 'node_modules/**'
    }),
    commonjs()
];

export const geometry = {
    input: modules.geometry.src,
    output: [{
        file: modules.geometry.iife,
        format: 'iife',
        name: 'g',
        freeze: false
    }],
    plugins: plugins
};

export const vectorizer = {
    input: './wrappers/vectorizer.iife.js',
    external: [
        './geometry.js'
    ],
    output: [{
        file: modules.vectorizer.iife,
        format: 'iife',
        name: 'V',
        freeze: false,
        globals: function(resource) {
            const localDependencies = {};
            localDependencies[path.resolve('./src/geometry.js')] = 'g';
            return localDependencies[path.resolve(resource)];
        }
    }],
    plugins: plugins
};
