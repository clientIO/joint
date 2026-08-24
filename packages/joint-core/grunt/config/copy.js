module.exports = function(grunt) {

    const banner = require('../resources/banner')(grunt);

    return {
        dist: {
            files: [{
                nonull: true,
                expand: true,
                cwd: 'build/',
                src: [
                    '*',
                    '!dts-generator',
                    '!min',
                    '!test', // source-mapped unit-test bundles
                    '!joint.browserify-bundle.js',
                    '!joint.webpack-bundle.js'
                ],
                dest: 'dist/'
            }],
            options: {
                process: function(content) {
                    // Add JointJS banner to all distribution files.
                    return banner + content;
                }
            }
        }
    };
};
