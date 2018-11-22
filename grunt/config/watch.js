const res = require('../resources');
const js = res.js;
const css = res.css;

module.exports = function(grunt) {

    const watchOptions = process.platform === 'win32' ? {
        spawn: false,
        interval: 1500
    } : {};

    let allJSPlugins = [];
    let allCSSPlugins = [];

    Object.keys(js.plugins).forEach(function(name) {
        allJSPlugins = allJSPlugins.concat(js.plugins[name]);
    });

    Object.keys(css.plugins).forEach(function(name) {
        allCSSPlugins = allCSSPlugins.concat(css.plugins[name]);
    });

    return {
        docs: {
            files: [
                'docs/**/*'
            ],
            options: watchOptions,
            tasks: ['build:docs']
        },
        joint: {
            files: [].concat(
                js.polyfills,
                js.geometry,
                js.vectorizer,
                js.core,
                allJSPlugins,
                css.core,
                allCSSPlugins
            ),
            options: watchOptions,
            tasks: ['build']
        },
        types: {
            options: watchOptions,
            files: [
                'types/**/*'
            ],
            tasks: ['newer:concat:types']
        }
    };
};
