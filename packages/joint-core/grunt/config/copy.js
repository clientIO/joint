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
                    '!joint.core.js',
                    '!api-extractor',
                    '!docs',
                    '!min',
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
        },
        docs: {
            files: [
                {
                    expand: true,
                    cwd: 'docs/',
                    src: [
                        'css/**/*',
                        'demo/**/*',
                        'js/**/*',
                        'images/**/*',
                        'fonts/**/*'
                    ],
                    dest: 'build/docs/'
                },
                {
                    nonull: true,
                    src: 'node_modules/jquery/dist/jquery.min.js',
                    dest: 'build/docs/js/lib/jquery.min.js'
                },
                {
                    nonull: true,
                    src: 'build/min/lodash.min.js',
                    dest: 'build/docs/js/lib/lodash.min.js'
                },
                {
                    nonull: true,
                    src: 'build/joint.min.js',
                    dest: 'build/docs/js/lib/joint.min.js'
                },
                {
                    nonull: true,
                    src: 'node_modules/prism-themes/themes/prism-one-light.css',
                    dest: 'build/docs/css/prism.css'
                }
            ]
        }
    };
};
