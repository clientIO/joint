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

const GLOBALS_ALL_MAP = {
    lodash: '_',
    jquery: '$',
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
    external: ['jquery', 'lodash', './vectorizer.js'],
    output: [{
        file: modules.util.iife,
        format: 'iife',
        name: 'joint_util',
        freeze: false,
        globals: resolveGlobals(['jquery', 'lodash', 'vectorizer']),
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
