const modules = require('../resources/es6');
const path = require('path');

module.exports = function() {

    return {
        options: {
            ASCIIOnly: true
        },
        deps: {
            files: {
                'build/min/lodash.min.js': 'node_modules/lodash/lodash.js'
            }
        },
        geometry: {
            src: modules.geometry.umd,
            dest: 'build/geometry.min.js'
        },
        joint: {
            src: modules.joint.umd,
            dest: 'build/joint.min.js'
        },
        jointCore: {
            src: modules.jointCore.umd,
            dest: 'build/joint.core.min.js'
        },
        jointNoWrap: {
            src: modules.joint.iife,
            dest: 'build/joint.nowrap.min.js'
        },
        vectorizer: {
            src: modules.vectorizer.umd,
            dest: 'build/vectorizer.min.js'
        },
        plugins: {
            files: [{
                expand: true,
                cwd: 'build',
                src: Object.keys(modules.jointPlugins).map(key => path.basename(modules.jointPlugins[key].iife)),
                dest: 'build',
                rename: function(dst, src) {
                    return dst + '/' + src.replace('.js', '.min.js');
                }
            }]
        }
    };
};
