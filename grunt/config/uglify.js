const js = require('../resources').js;

module.exports = {
    options: {
        ASCIIOnly: true
    },
    deps: {
        files: {
            'build/min/lodash.min.js': 'node_modules/lodash/lodash.js'
        }
    },
    geometry: {
        src: js.geometry,
        dest: 'build/min/geometry.min.js'
    },
    joint: {
        src: js.core,
        dest: 'build/min/joint.min.js'
    },
    polyfills: {
        src: js.polyfills,
        dest: 'build/min/polyfills.min.js'
    },
    vectorizer: {
        src: js.vectorizer,
        dest: 'build/min/vectorizer.min.js'
    }
};
