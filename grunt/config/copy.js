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
                        'images/**/*'
                    ],
                    dest: 'build/docs/'
                },
                {
                    nonull: true,
                    src: 'node_modules/backbone/backbone-min.js',
                    dest: 'build/docs/js/lib/backbone.min.js'
                },
                {
                    nonull: true,
                    src: 'node_modules/dagre/dist/dagre.min.js',
                    dest: 'build/docs/js/lib/dagre.min.js'
                },
                {
                    nonull: true,
                    src: 'node_modules/graphlib/dist/graphlib.min.js',
                    dest: 'build/docs/js/lib/graphlib.min.js'
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
                    src: 'build/joint.min.css',
                    dest: 'build/docs/css/lib/joint.min.css'
                },
                {
                    expand: true,
                    flatten: true,
                    cwd: 'node_modules/open-sans-fontface/',
                    src: [
                        'fonts/**/*.{ttf,eot,svg,woff,woff2}'
                    ],
                    dest: 'build/docs/fonts/OpenSans/'
                },
                {
                    src: 'node_modules/prismjs/themes/prism.css',
                    dest: 'build/docs/css/prism.css'
                }
            ]
        },
        appsLibs: {
            files: [
                { nonull: true, src: 'build/joint.d.ts', dest: 'demo/ts-demo/vendor/joint.d.ts' },
                { nonull: true, src: 'build/joint.js', dest: 'demo/ts-demo/vendor/joint.js' },
                { nonull: true, src: 'build/joint.css', dest: 'demo/ts-demo/vendor/joint.css' }
            ]
        }
    }
};
