const plugins = require('../resources/plugins');
const polyfills = require('../resources/polyfills')
const modules = require('../resources/es6');


module.exports = function() {

    const config = {};

    Object.keys(plugins).forEach(function(name) {
        config[name] = { files: {} };
        config[name].files['build/min/joint.' + name + '.min.js'] = plugins[name];
    });

    return Object.assign({}, config, {

        options: {
            ASCIIOnly: true
        },
        deps: {
            files: {
                'build/min/lodash.min.js': 'node_modules/lodash/lodash.js'
            }
        },
        geometry: {
            src: modules.geometry.iife,
            dest: 'build/min/geometry.min.js'
        },
        joint: {
            src: modules.joint.umd,
            dest: 'build/joint.min.js'
        },
        polyfills: {
            src: polyfills,
            dest: 'build/min/polyfills.min.js'
        },
        vectorizer: {
            src: modules.vectorizer.iife,
            dest: 'build/min/vectorizer.min.js'
        }
    });
};
