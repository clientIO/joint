const res = require('../resources');
const js = res.js;
const css = res.css;

const plugins = function() {

    const config = {};

    Object.keys(js.plugins).forEach(function(name) {

        config[name] = { files: {} };

        config[name].files['build/joint.' + name + '.js'] = js.plugins[name];
        config[name].files['build/joint.' + name + '.min.js'] = ['build/min/joint.' + name + '.min.js'];
    });

    Object.keys(css.plugins).forEach(function(name) {

        config[name] = config[name] || { files: {} };

        config[name].files['build/joint.' + name + '.css'] = css.plugins[name];
        config[name].files['build/joint.' + name + '.min.css'] = ['build/min/joint.' + name + '.min.css'];
    });

    return config;
};

module.exports = function(grunt) {

    const utils = require('../utils')(grunt);

    let allJSPlugins = [];
    let allCSSPlugins = [];

    const allMinifiedJSPlugins = [];
    const allMinifiedCSSPlugins = [];

    Object.keys(js.plugins).forEach(function(name) {
        allJSPlugins = allJSPlugins.concat(js.plugins[name]);
        allMinifiedJSPlugins.push('build/min/joint.' + name + '.min.js');
    });

    Object.keys(css.plugins).forEach(function(name) {
        allMinifiedCSSPlugins.push('build/min/joint.' + name + '.min.css');
        allCSSPlugins = allCSSPlugins.concat(css.plugins[name]);
    });

    return Object.assign({}, plugins(), {
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
                        js.geometry,
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
                        js.vectorizer,
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
                        js.polyfills,
                        js.geometry,
                        js.vectorizer,
                        js.core,
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
                        css.core
                    ),
                'build/joint.core.min.css':
                    [].concat(
                        ['build/min/joint.min.css']
                    ),
                'build/joint.js':
                    [].concat(
                        ['wrappers/joint.head.js.partial'],
                        js.polyfills,
                        js.geometry,
                        js.vectorizer,
                        js.core,
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
                        css.core,
                        allCSSPlugins
                    ),
                'build/joint.min.css':
                    [].concat(
                        ['build/min/joint.min.css'],
                        allMinifiedCSSPlugins
                    ),
                'build/joint.nowrap.js':
                    [].concat(
                        js.polyfills,
                        js.geometry,
                        js.vectorizer,
                        js.core,
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
