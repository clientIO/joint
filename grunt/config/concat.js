const plugins = require('../resources/plugins');
const geometry = require('../resources/geometry');
const vectorizer = require('../resources/vectorizer');
const core = require('../resources/core');
const polyfills = require('../resources/polyfills');

const getPlugins = function() {

    const config = {};

    Object.keys(plugins).forEach(function(name) {

        config[name] = { files: {} };

        config[name].files['build/joint.' + name + '.js'] = plugins[name];
        config[name].files['build/joint.' + name + '.min.js'] = ['build/min/joint.' + name + '.min.js'];
    });

    return config;
};

module.exports = function(grunt) {

    const utils = require('../resources/utils')(grunt);

    let allJSPlugins = [];
    let allCSSPlugins = [];

    const allMinifiedJSPlugins = [];
    const allMinifiedCSSPlugins = [];

    Object.keys(plugins).forEach(function(name) {
        allJSPlugins = allJSPlugins.concat(plugins[name]);
        allMinifiedJSPlugins.push('build/min/joint.' + name + '.min.js');
    });

    return Object.assign({}, getPlugins(), {
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
        geometry: {
            files: {
                'build/geometry.js':
                    [].concat(
                        ['wrappers/geometry.head.js.partial'],
                        geometry,
                        ['wrappers/geometry.foot.js.partial']
                    ),
                'build/geometry.min.js':
                    [].concat(
                        ['wrappers/geometry.head.js.partial'],
                        ['build/min/geometry.min.js'],
                        ['wrappers/geometry.foot.js.partial']
                    )
            }
        },
        vectorizer: {
            files: {
                'build/vectorizer.js':
                    [].concat(
                        ['wrappers/vectorizer.head.js.partial'],
                        vectorizer,
                        ['wrappers/vectorizer.foot.js.partial']
                    ),
                'build/vectorizer.min.js':
                    [].concat(
                        ['wrappers/vectorizer.head.js.partial'],
                        ['build/min/vectorizer.min.js'],
                        ['wrappers/vectorizer.foot.js.partial']
                    )
            }
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
                'build/joint.core.js':
                    [].concat(
                        ['wrappers/joint.head.js.partial'],
                        polyfills,
                        geometry,
                        vectorizer,
                        core.js,
                        ['wrappers/joint.foot.js.partial']
                    ),
                'build/joint.core.min.js':
                    [].concat(
                        ['wrappers/joint.head.js.partial'],
                        ['build/min/polyfills.min.js'],
                        ['build/min/geometry.min.js'],
                        ['build/min/vectorizer.min.js'],
                        ['build/min/joint.min.js'],
                        ['wrappers/joint.foot.js.partial']
                    ),
                'build/joint.core.css':
                    [].concat(
                        core.css
                    ),
                'build/joint.core.min.css':
                    [].concat(
                        ['build/min/joint.min.css']
                    ),
                'build/joint.js':
                    [].concat(
                        ['wrappers/joint.head.js.partial'],
                        polyfills,
                        geometry,
                        vectorizer,
                        core.js,
                        allJSPlugins,
                        ['wrappers/joint.foot.js.partial']
                    ),
                'build/joint.min.js':
                    [].concat(
                        ['wrappers/joint.head.js.partial'],
                        ['build/min/polyfills.min.js'],
                        ['build/min/geometry.min.js'],
                        ['build/min/vectorizer.min.js'],
                        ['build/min/joint.min.js'],
                        allMinifiedJSPlugins,
                        ['wrappers/joint.foot.js.partial']
                    ),
                'build/joint.css':
                    [].concat(
                        core.css,
                        allCSSPlugins
                    ),
                'build/joint.min.css':
                    [].concat(
                        ['build/min/joint.min.css'],
                        allMinifiedCSSPlugins
                    ),
                'build/joint.nowrap.js':
                    [].concat(
                        polyfills,
                        geometry,
                        vectorizer,
                        core.js,
                        allJSPlugins
                    ),
                'build/joint.nowrap.min.js':
                    [].concat(
                        ['build/min/polyfills.min.js'],
                        ['build/min/geometry.min.js'],
                        ['build/min/vectorizer.min.js'],
                        ['build/min/joint.min.js'],
                        allMinifiedJSPlugins
                    )
            }
        }
    });
};
