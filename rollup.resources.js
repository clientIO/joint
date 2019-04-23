import commonjs from 'rollup-plugin-commonjs';
import babel from 'rollup-plugin-babel';
import path from 'path';
import resolve from 'rollup-plugin-node-resolve';


const modules = require('./grunt/resources/es6');

let plugins = [
    babel({ exclude: 'node_modules/**' }),
    commonjs()
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

const resolveGlobals = function(externals) {

    return externals.reduce((res, item) => {

        const module = GLOBALS_ALL_MAP[item];

        if (!module) {
            throw new Error(`Local module ${item} is not defined`)
        }

        if (module.name) {
            res[module.destination] = module.name;
        } else {
            res[item] = module;
        }

        return res;
    }, {});
};

export const geometry = {
    input: modules.geometry.src,
    output: [{
        file: modules.geometry.iife,
        format: 'iife',
        name: 'g',
        freeze: false
    }, {
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
        file: 'build/esm/dagre.js',
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
        file: 'build/esm/jquery.js',
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
        file: 'build/esm/lodash.js',
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
    external: ['./geometry.js'],
    output: [{
        file: modules.vectorizer.iife,
        format: 'iife',
        name: 'V',
        freeze: false,
        globals: resolveGlobals(['geometry'])
    }, {
        file: modules.vectorizer.umd,
        format: 'iife',
        name: 'V',
        freeze: false,
        globals: resolveGlobals(['geometry'])
    }],
    plugins: plugins
};

export const joint = {
    input: modules.joint.src,
    external: [
        GLOBALS_ALL_MAP.geometry.destination,
        GLOBALS_ALL_MAP.vectorizer.destination,
        'jquery',
        'backbone',
        'lodash',
        'dagre'
    ],
    output: [{
        file: modules.joint.iife,
        format: 'iife',
        name: 'joint',
        freeze: false,
        globals: ((map) => {
            const globals = {
                'jquery': '$',
                'backbone': 'Backbone',
                'lodash': '_',
                'dagre': 'dagre'
            };
            globals[map.vectorizer.destination] = 'V';
            globals[map.geometry.destination] = 'g';
            return globals;
        })(GLOBALS_ALL_MAP),
    }],
    plugins: plugins
};

export const jointCore = {
    input: modules.jointCore.src,
    external: [
        GLOBALS_ALL_MAP.geometry.destination,
        GLOBALS_ALL_MAP.vectorizer.destination,
        'jquery',
        'backbone',
        'lodash'
    ],
    output: [{
        file: modules.jointCore.iife,
        format: 'iife',
        name: 'joint',
        freeze: false,
        globals: ((map) => {
            const globals = {
                'jquery': '$',
                'backbone': 'Backbone',
                'lodash': '_'
            };
            globals[map.vectorizer.destination] = 'V';
            globals[map.geometry.destination] = 'g';
            return globals;
        })(GLOBALS_ALL_MAP),
    }],
    plugins: plugins
};
