const plugins = require('../resources/plugins');
const geometry = require('../resources/geometry');
const vectorizer = require('../resources/vectorizer');
const core = require('../resources/core');
const polyfills = require('../resources/polyfills');

module.exports = function(grunt) {

    const watchOptions = process.platform === 'win32' ? {
        spawn: false,
        interval: 1500
    } : {};

    let allJSPlugins = [];

    Object.keys(plugins).forEach(function(name) {
        allJSPlugins = allJSPlugins.concat(plugins[name]);
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
                polyfills,
                geometry,
                vectorizer,
                core.js,
                allJSPlugins,
                core.css
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
