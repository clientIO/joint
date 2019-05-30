// const plugins = require('../resources/plugins');
const core = require('../resources/core');
const polyfills = require('../resources/polyfills');
const modules = require('../resources/es6');

module.exports = function(grunt) {

    const utils = require('../resources/utils')(grunt);

    return {
        types: {
            src: [
                'types/joint.head.d.ts',
                'types/geometry.d.ts',
                'types/vectorizer.d.ts',
                'types/joint.d.ts'
            ],
            dest:
                'build/joint.d.ts'
        },
        joint: {
            options: {
                process: {
                    options: {
                        data: utils.pkg
                    },
                    delimiters: 'square'
                }
            },
            files: {
                'build/joint.core.css':
                    [].concat(
                        core.css
                    ),
                'build/joint.core.min.css':
                    [].concat(
                        ['build/min/joint.min.css']
                    ),
                'build/joint.css':
                    [].concat(
                        core.css,
                    ),
                'build/joint.min.css':
                    [].concat(
                        ['build/min/joint.min.css'],
                    ),
                'build/joint.nowrap.js':
                    [].concat(
                        polyfills,
                        modules.geometry.iife,
                        modules.vectorizer.iife,
                        modules.joint.iife
                    ),
                'build/joint.nowrap.min.js':
                    [].concat(
                        ['build/min/polyfills.min.js'],
                        ['build/min/geometry.min.js'],
                        ['build/min/vectorizer.min.js'],
                        ['build/min/joint.min.js'],
                        // allMinifiedJSPlugins
                    )
            }
        }
    }
};
