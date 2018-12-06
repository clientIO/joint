const plugins = require('../resources/plugins');
const geometry = require('../resources/geometry');
const vectorizer = require('../resources/vectorizer');
const core = require('../resources/core').js;
const polyfills = require('../resources/polyfills');

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
            src: geometry,
            dest: 'build/min/geometry.min.js'
        },
        joint: {
            src: core,
            dest: 'build/min/joint.min.js'
        },
        polyfills: {
            src: polyfills,
            dest: 'build/min/polyfills.min.js'
        },
        vectorizer: {
            src: vectorizer,
            dest: 'build/min/vectorizer.min.js'
        }
    });
};
