import commonjs from 'rollup-plugin-commonjs';
import buble from 'rollup-plugin-buble';
import path from 'path';
import json from 'rollup-plugin-json';
import fs from 'fs';
import resolve from 'rollup-plugin-node-resolve';
import externalGlobals from 'rollup-plugin-external-globals';
const modules = require('./grunt/resources/esm');

let plugins = [
    resolve(),
    commonjs(),
    // prevent injecting 'dagre' into ES5 bundle
    externalGlobals({
        'dagre': 'dagre'
    }),
    buble()
];

let JOINT_FOOTER = 'if (typeof joint !== \'undefined\') { var g = joint.g, V = joint.V, Vectorizer = joint.V; }';

// for the ES5 transpiling
// prevent Rollup to include the local references into the partial ES5 file
// e.g. joint.shapes.fsa shapes depends on `basic` shapes, but `basic` shapes shouldn't be
// included in the resulting joint.shapes.fsa.js file.
const readNamespace = function(namespace, global) {
    let location = './src/' + namespace;
    const list = fs.readdirSync(path.resolve(location));
    return list.reduce((res, item) => {
        res[path.resolve(location, item)] = global || 'joint.' + namespace;
        return res;
    }, {});
};

const G_REF = readNamespace('g', 'g');
const V_REF = readNamespace('V', 'V');
const LOCAL_EXTERNALS = Object.assign(
    {},
    Object.keys(modules.plugins).reduce((res, key) => {
        const item = modules.plugins[key];
        res[path.resolve(item.src)] = key;
        return res;
    }, {}),
    readNamespace('dia'),
    G_REF, V_REF,
    readNamespace('util')
);

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

export const vectorizer = {
    input: modules.vectorizer.src,
    output: [{
        file: modules.vectorizer.umd,
        format: 'umd',
        name: 'V',
        freeze: false,
        footer: 'if (typeof V !== \'undefined\') { var g = V.g; var Vectorizer = V; };\n'
    }],
    plugins: plugins
};

export const joint = {
    input: modules.joint.src,
    external: [
        'jquery',
        'backbone',
        'lodash'
    ],
    output: [{
        file: modules.joint.umd,
        format: 'umd',
        name: 'joint',
        freeze: false,
        footer: JOINT_FOOTER,
        globals: {
            'jquery': '$',
            'backbone': 'Backbone',
            'lodash': '_'
        }
    }, {
        file: modules.joint.iife,
        format: 'iife',
        name: 'joint',
        freeze: false,
        footer: JOINT_FOOTER,
        globals: {
            'jquery': '$',
            'backbone': 'Backbone',
            'lodash': '_'
        }
    }],
    plugins: plugins,
    treeshake: false
};

export const jointNoDependencies = {
    input: modules.joint.src,
    external: [
        'jquery',
        'backbone',
        'lodash'
    ].concat(Object.keys(G_REF)).concat(Object.keys(V_REF)),
    output: [{
        file: modules.joint.noDependencies,
        format: 'iife',
        name: 'joint',
        footer: JOINT_FOOTER,
        freeze: false,
        globals: Object.assign({
            'jquery': '$',
            'backbone': 'Backbone',
            'lodash': '_'
        }, G_REF, V_REF)
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
        footer: JOINT_FOOTER,
        globals: {
            'jquery': '$',
            'backbone': 'Backbone',
            'lodash': '_'
        }
    }],
    plugins: plugins
};

export const version = {
    input: 'wrappers/version.wrapper.mjs',
    output: [{
        file: 'dist/version.mjs',
        format: 'esm'
    }],
    plugins: [
        json()
    ]
};

export const jointPlugins = Object.keys(modules.plugins).reduce((res, namespace) => {
    const item = modules.plugins[namespace];

    if (item.export) {

        res.push({
            input: item.src,
            external: [
                'jquery',
                'backbone',
                'lodash',
            ].concat(Object.keys(LOCAL_EXTERNALS)),
            output: [{
                file: `build/${namespace}.js`,
                format: 'iife',
                extend: true,
                name: namespace,
                globals: Object.assign({
                    'jquery': '$',
                    'backbone': 'Backbone',
                    'lodash': '_',
                }, LOCAL_EXTERNALS)
            }],
            plugins: plugins
        });
    }

    return res;
}, []);


// dependencies
// -----------------------------------------------------------------------------------

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

