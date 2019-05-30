import commonjs from 'rollup-plugin-commonjs';
import babel from 'rollup-plugin-babel';
import path from 'path';
import resolve from 'rollup-plugin-node-resolve';

const modules = require('./grunt/resources/es6');

let plugins = [
    babel({ exclude: 'node_modules/**' })
];

const GLOBALS_ALL_MAP = {
    lodash: '_',
    jquery: '$',
    backbone: 'Backbone',
    vectorizer: {
        name: 'V',
        destination: path.resolve(modules.vectorizer.src)
    },
    geometry: {
        name: 'g',
        destination: path.resolve(modules.geometry.src)
    }
};

export const geometry = {
    input: modules.geometry.src,
    output: [{
        file: modules.geometry.umd,
        format: 'umd',
        name: 'g',
        freeze: false
    }],
    plugins: plugins
};

export const dagre = {
    input: 'node_modules/dagre/index.js',
    external: ['lodash'],
    output: [{
        file: 'build/esm/dagre.mjs',
        format: 'esm',
        freeze: false
    }],
    plugins: [
        resolve(),
        commonjs()
    ]
};

export const jquery = {
    input: 'node_modules/jquery/dist/jquery.js',
    output: [{
        file: 'build/esm/jquery.mjs',
        format: 'esm',
        freeze: false
    }],
    plugins: [
        commonjs(),
        resolve()
    ]
};

export const lodash = {
    input: 'node_modules/lodash/index.js',
    output: [{
        file: 'build/esm/lodash.mjs',
        format: 'esm',
        freeze: false
    }],
    plugins: [
        commonjs(),
        resolve()
    ]
};

export const backbone = {
    input: 'node_modules/backbone/backbone.js',
    external: ['underscore', 'jquery'],
    output: [{
        file: 'build/esm/backbone.mjs',
        format: 'esm'
    }],
    plugins: [
        commonjs()
    ]
};

export const vectorizer = {
    input: modules.vectorizer.src,
    external: [GLOBALS_ALL_MAP.geometry.destination],
    output: [{
        file: modules.vectorizer.umd,
        format: 'umd',
        name: 'V',
        freeze: false,
        globals: ((map) => {
            const globals = {};
            globals[map.geometry.destination] = 'g';
            return globals;
        })(GLOBALS_ALL_MAP),
    }],
    plugins: plugins
};

export const joint = {
    input: modules.joint.src,
    external: [
        'jquery',
        'backbone',
        'lodash',
        'dagre'
    ],
    output: [{
        file: modules.joint.umd,
        format: 'umd',
        name: 'joint',
        freeze: false,
        footer: 'var g = joint.g; var V = joint.V;',
        globals: {
            'jquery': '$',
            'backbone': 'Backbone',
            'lodash': '_',
            'dagre': 'dagre'
        }
    }, {
        file: modules.joint.iife,
        format: 'iife',
        name: 'joint',
        freeze: false,
        globals: {
            'jquery': '$',
            'backbone': 'Backbone',
            'lodash': '_',
            'dagre': 'dagre'
        }
    }],
    plugins: plugins
};

export const jointCore = {
    input: modules.jointCore.src,
    external: [
        'jquery',
        'backbone',
        'lodash'
    ],
    output: [{
        file: modules.jointCore.umd,
        format: 'umd',
        name: 'joint',
        freeze: false,
        footer: 'var g = joint.g; var V = joint.V;',
        globals: {
            'jquery': '$',
            'backbone': 'Backbone',
            'lodash': '_'
        },
    }],
    plugins: plugins
};
