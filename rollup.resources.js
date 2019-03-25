import commonjs from 'rollup-plugin-commonjs';
import babel from 'rollup-plugin-babel';
import path from 'path';

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
    },
    util: {
        name: 'joint.util',
        destination: path.resolve(modules.util.src)
    },
    // not es6 modules, yet. We are pretending they are there already
    cell: {
        name: 'joint.dia',
        destination: path.resolve('./src/joint.dia.cell.js')
    },
    element: {
        name: 'joint.dia',
        destination: path.resolve('./src/element.js')
    },
    elementView: {
        name: 'joint.dia',
        destination: path.resolve('./src/elementView.js')
    },
    link: {
        name: 'joint.dia',
        destination: path.resolve('./src/joint.dia.link.js')
    },
    shapes: {
        name: 'joint.shapes',
        destination: path.resolve('./plugins/shapes.js')
    },
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
    }],
    plugins: plugins
};

export const util = {
    input: modules.util.src,
    external: ['jquery', 'lodash', './vectorizer.js', './joint.dia.cell.js'],
    output: [{
        file: modules.util.iife,
        format: 'iife',
        name: 'joint_util',
        freeze: false,
        globals: resolveGlobals(['jquery', 'lodash', 'vectorizer', 'cell']),
        footer: 'joint.util = joint_util;'
    }],
    plugins: plugins
};

export const config = {
    input: modules.config.src,
    output: [{
        file: modules.config.iife,
        format: 'iife',
        name: 'joint_config',
        freeze: false,
        footer: 'joint.config = joint_config;'
    }],
    plugins: plugins
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
    }],
    plugins: plugins
};

export const graph = {
    input: modules.graph.src,
    external: ['backbone', './util.js', './joint.dia.cell.js', './element.js', './joint.dia.link.js', './geometry.js', '../plugins/shapes.js'],
    output: [{
        file: modules.graph.iife,
        format: 'iife',
        name: 'joint_graph_module',
        freeze: false,
        globals: resolveGlobals(['backbone', 'util', 'cell', 'element', 'link', 'geometry', 'shapes']),
        footer: 'joint.dia.Graph = joint_graph_module.Graph;'
    }],
    plugins: plugins
};

export const ports = {
    input: modules.ports.src,
    external: ['./util.js', './elementView.js', './element.js', './geometry.js', './vectorizer.js'],
    output: [{
        file: modules.ports.iife,
        format: 'iife',
        name: 'joint_ports',
        freeze: false,
        globals: resolveGlobals(['util', 'element', 'elementView', 'geometry', 'vectorizer'])
    }],
    plugins: plugins
};
