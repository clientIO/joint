'use strict';

var phantomjs = require('phantomjs-prebuilt');
var path = require('path');

module.exports = function(grunt) {

    require('time-grunt')(grunt);
    require('load-grunt-tasks')(grunt);
    var loadedConfig = require('load-grunt-config')(grunt, {
        configPath: path.join(process.cwd(), 'grunt/config')
    });
    grunt.loadTasks('./grunt/tasks');

    grunt.template.addDelimiters('square', '[%', '%]');

    var pkg = grunt.file.readJSON('package.json');
    var banner = grunt.template.process('/*! <%= pkg.title %> v<%= pkg.version %> (<%= grunt.template.today("yyyy-mm-dd") %>) - <%= pkg.description %>\n\n\nThis Source Code Form is subject to the terms of the Mozilla Public\nLicense, v. 2.0. If a copy of the MPL was not distributed with this\nfile, You can obtain one at http://mozilla.org/MPL/2.0/.\n*/\n', { data: { pkg: pkg }, delimiter: 'default' });

    var js = require('./grunt/resources').js;
    var css = require('./grunt/resources').css;

    function allJSPlugins() {

        var ret = [];
        for (var name in js.plugins) {
            ret = ret.concat(js.plugins[name]);
        }
        return ret;
    }

    function allCSSPlugins() {

        var ret = [];
        for (var name in css.plugins) {
            ret = ret.concat(css.plugins[name]);
        }
        return ret;
    }

    function allMinifiedJSPlugins() {

        var files = [];

        for (var name in js.plugins) {
            files.push('build/min/joint.' + name + '.min.js');
        }

        return files;
    }

    function allMinifiedCSSPlugins() {

        var files = [];

        for (var name in css.plugins) {
            files.push('build/min/joint.' + name + '.min.css');
        }

        return files;
    }

    var watchOptions = process.platform === 'win32' ? {
        spawn: false,
        interval: 1500
    } : {};

    var config = {

        pkg: pkg,

        concat: {
            types: {
                src: [
                    'types/joint.head.d.ts',
                    'types/geometry.d.ts',
                    'types/vectorizer.d.ts',
                    'types/joint.d.ts'
                ],
                dest: 'build/joint.d.ts'
            },
            geometry: {
                files: {
                    'build/geometry.js': [].concat(
                        ['wrappers/geometry.head.js.partial'],
                        js.geometry,
                        ['wrappers/geometry.foot.js.partial']
                    ),
                    'build/geometry.min.js': [].concat(
                        ['wrappers/geometry.head.js.partial'],
                        ['build/min/geometry.min.js'],
                        ['wrappers/geometry.foot.js.partial']
                    )
                }
            },
            vectorizer: {
                files: {
                    'build/vectorizer.js': [].concat(
                        ['wrappers/vectorizer.head.js.partial'],
                        js.vectorizer,
                        ['wrappers/vectorizer.foot.js.partial']
                    ),
                    'build/vectorizer.min.js': [].concat(
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
                            data: pkg
                        },
                        delimiters: 'square'
                    }
                },
                files: {
                    'build/joint.core.js': [].concat(
                        ['wrappers/joint.head.js.partial'],
                        js.polyfills,
                        js.geometry,
                        js.vectorizer,
                        js.core,
                        ['wrappers/joint.foot.js.partial']
                    ),
                    'build/joint.core.min.js': [].concat(
                        ['wrappers/joint.head.js.partial'],
                        ['build/min/polyfills.min.js'],
                        ['build/min/geometry.min.js'],
                        ['build/min/vectorizer.min.js'],
                        ['build/min/joint.min.js'],
                        ['wrappers/joint.foot.js.partial']
                    ),
                    'build/joint.core.css': [].concat(
                        css.core
                    ),
                    'build/joint.core.min.css': [].concat(
                        ['build/min/joint.min.css']
                    ),
                    'build/joint.js': [].concat(
                        ['wrappers/joint.head.js.partial'],
                        js.polyfills,
                        js.geometry,
                        js.vectorizer,
                        js.core,
                        allJSPlugins(),
                        ['wrappers/joint.foot.js.partial']
                    ),
                    'build/joint.min.js': [].concat(
                        ['wrappers/joint.head.js.partial'],
                        ['build/min/polyfills.min.js'],
                        ['build/min/geometry.min.js'],
                        ['build/min/vectorizer.min.js'],
                        ['build/min/joint.min.js'],
                        allMinifiedJSPlugins(),
                        ['wrappers/joint.foot.js.partial']
                    ),
                    'build/joint.css': [].concat(
                        css.core,
                        allCSSPlugins()
                    ),
                    'build/joint.min.css': [].concat(
                        ['build/min/joint.min.css'],
                        allMinifiedCSSPlugins()
                    ),
                    'build/joint.nowrap.js': [].concat(
                        js.polyfills,
                        js.geometry,
                        js.vectorizer,
                        js.core,
                        allJSPlugins()
                    ),
                    'build/joint.nowrap.min.js': [].concat(
                        ['build/min/polyfills.min.js'],
                        ['build/min/geometry.min.js'],
                        ['build/min/vectorizer.min.js'],
                        ['build/min/joint.min.js'],
                        allMinifiedJSPlugins()
                    )
                }
            }
        },
        copy: {
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
                    { nonull: true, src: 'build/joint.min.css', dest: 'demo/ts-demo/vendor/joint.css' }
                ]
            }
        },
        watch: {
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
                    allJSPlugins(),
                    css.core,
                    allCSSPlugins()
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
        },
        env: {

        }
    };

    // Create targets for all the plugins.
    Object.keys(js.plugins).forEach(function(name) {

        config.concat[name] = { files: {}};
        config.uglify[name] = { files: {}};

        config.uglify[name].files['build/min/joint.' + name + '.min.js'] = js.plugins[name];
        config.concat[name].files['build/joint.' + name + '.js'] = js.plugins[name];
        config.concat[name].files['build/joint.' + name + '.min.js'] = ['build/min/joint.' + name + '.min.js'];

        if (css.plugins[name]) {

            config.cssmin[name] = { files: {}};
            config.cssmin[name].files['build/min/joint.' + name + '.min.css'] = css.plugins[name];
            config.concat[name].files['build/joint.' + name + '.css'] = css.plugins[name];
            config.concat[name].files['build/joint.' + name + '.min.css'] = ['build/min/joint.' + name + '.min.css'];
        }
    });

    grunt.initConfig(Object.assign({}, config, loadedConfig));

    var allPluginTasks = {
        concat: [],
        cssmin: [],
        uglify: []
    };

    // Register tasks for all the plugins.
    Object.keys(js.plugins).forEach(function(name) {

        var pluginTasks = [
            'newer:concat:' + name,
            'newer:uglify:' + name
        ];

        allPluginTasks.concat.push('newer:concat:' + name);
        allPluginTasks.uglify.push('newer:uglify:' + name);

        if (css.plugins[name]) {
            pluginTasks.push('newer:cssmin:' + name);
            allPluginTasks.cssmin.push('newer:cssmin:' + name);
        }


        grunt.registerTask(name, pluginTasks);
    });

    grunt.registerTask('concat:plugins', allPluginTasks.concat);
    grunt.registerTask('cssmin:plugins', allPluginTasks.cssmin);
    grunt.registerTask('uglify:plugins', allPluginTasks.uglify);

    var e2eBrowsers = {
        'chrome': {
            'browserName': 'chrome',
            'name': 'Chrome'
        },
        'chrome-linux': {
            'browserName': 'chrome',
            'platform': 'linux',
            'name': 'Chrome on Linux'
        },
        'chrome-windows7': {
            'browserName': 'chrome',
            'platform': 'windows',
            'name': 'Chrome on Windows 7'
        },
        'chrome-mac': {
            'browserName': 'chrome',
            'platform': 'mac',
            'name': 'Chrome on Mac'
        },
        'firefox': {
            'browserName': 'firefox',
            'name': 'Firefox'
        },
        'firefox-linux': {
            'browserName': 'firefox',
            'platform': 'linux',
            'name': 'Firefox on Linux'
        },
        'firefox-mac': {
            'browserName': 'firefox',
            'platform': 'mac',
            'name': 'Firefox on Mac'
        },
        'phantomjs': {
            'browserName': 'phantomjs',
            // Set the path to the PhantomJS binary.
            // Can be in different places depending upon the current environment.
            // For example, if phantomjs is on the current user's PATH (with the correct version).
            'phantomjs.binary.path': phantomjs.path,
            'name': 'PhantomJS'
        }
    };

    Object.keys(e2eBrowsers).forEach(function(key) {

        var browser = e2eBrowsers[key];

        config.env[key] = {
            E2E_DESIRED: JSON.stringify(browser)
        };
    });

    Object.keys(e2eBrowsers).forEach(function(key) {
        grunt.registerTask('test:e2e:' + key, [
            'env:' + key,
            'mochaTest:e2e'
        ]);
    });
};
