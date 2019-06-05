import commonjs from 'rollup-plugin-commonjs';
import buble from 'rollup-plugin-buble'
import path from 'path';
import resolve from 'rollup-plugin-node-resolve';
import replace from 'rollup-plugin-replace';
import externalGlobals from 'rollup-plugin-external-globals';

const modules = require('./grunt/resources/es6');
const pkg = require('./package.json');

let plugins = [
    replace({
        include: 'src/core.mjs',
        VERSION: pkg.version
    }),

    // prevent injecting 'dagre' into ES5 bundle
    externalGlobals({
        'dagre': 'dagre'
    }),
    buble()
];

let JOINT_FOOTER = 'if (typeof joint !== \'undefined\') { var g = joint.g, V = joint.V; }';

const GLOBALS_MAP = {
    vectorizer: {
        name: 'V',
        src: path.resolve(modules.vectorizer.src)
    },
    geometry: {
        name: 'g',
        src: path.resolve(modules.geometry.src)
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

export const vectorizer = {
    input: modules.vectorizer.src,
    output: [{
        file: modules.vectorizer.umd,
        format: 'umd',
        name: 'V',
        freeze: false,
        footer: 'if (typeof V !== \'undefined\') { var g = V.g; };\n'
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
    plugins: plugins
};

export const jointNoDependencies = {
    input: modules.joint.src,
    external: [
        'jquery',
        'backbone',
        'lodash',
        GLOBALS_MAP.geometry.src,
        GLOBALS_MAP.vectorizer.src
    ],
    output: [{
        file: modules.joint.noDependencies,
        format: 'iife',
        name: 'joint',
        footer: JOINT_FOOTER,
        freeze: false,
        globals: ((map) => {
            const globals = {
                'jquery': '$',
                'backbone': 'Backbone',
                'lodash': '_'
            };
            globals[map.geometry.src] = 'g';
            globals[map.vectorizer.src] = 'V';
            return globals;
        })(GLOBALS_MAP)
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

export const jointPlugins = Object.keys(modules.jointPlugins).reduce((res, key) => {

    const item = modules.jointPlugins[key];
    res.push({
        input: item.src,
        external: [
            'jquery',
            'backbone',
            'lodash',
            GLOBALS_MAP.geometry.src,
            GLOBALS_MAP.vectorizer.src
        ],
        output: [{
            file: item.iife,
            format: 'iife',
            extend: true,
            name: key,
            globals: ((map) => {
                const globals = {
                    'jquery': '$',
                    'backbone': 'Backbone',
                    'lodash': '_'
                };
                globals[map.geometry.src] = 'g';
                globals[map.vectorizer.src] = 'V';
                return globals;
            })(GLOBALS_MAP),
        }],
        plugins: plugins
    });

    return res;
}, []);

