'use strict';

module.exports = function(grunt) {

    require('time-grunt')(grunt);
    require('load-grunt-tasks')(grunt);

    grunt.template.addDelimiters('square', '[%', '%]');

    var pkg = grunt.file.readJSON('package.json');
    var banner = grunt.template.process('/*! <%= pkg.title %> v<%= pkg.version %> - <%= pkg.description %>  <%= grunt.template.today("yyyy-mm-dd") %> \n\n\nThis Source Code Form is subject to the terms of the Mozilla Public\nLicense, v. 2.0. If a copy of the MPL was not distributed with this\nfile, You can obtain one at http://mozilla.org/MPL/2.0/.\n */\n', { data: { pkg: pkg }, delimiter: 'default' });

    var js = {

        core: [
            'src/core.js',
            'src/joint.mvc.view.js',
            'src/joint.dia.graph.js',
            'src/joint.dia.cell.js',
            'src/joint.dia.element.js',
            'src/joint.dia.link.js',
            'src/joint.dia.paper.js',
            'plugins/shapes/joint.shapes.basic.js',
            'plugins/routers/*.js',
            'plugins/connectors/joint.connectors.normal.js',
            'plugins/connectors/joint.connectors.rounded.js',
            'plugins/connectors/joint.connectors.smooth.js',
            'plugins/connectors/joint.connectors.jumpover.js',
            'plugins/highlighters/*.js'
        ],

        geometry: ['src/geometry.js'],
        vectorizer: ['src/vectorizer.js'],

        plugins: {

            'shapes.erd': ['plugins/shapes/joint.shapes.erd.js'],
            'shapes.fsa': ['plugins/shapes/joint.shapes.fsa.js'],
            'shapes.org': ['plugins/shapes/joint.shapes.org.js'],
            'shapes.chess': ['plugins/shapes/joint.shapes.chess.js'],
            'shapes.pn': ['plugins/shapes/joint.shapes.pn.js'],
            'shapes.devs': ['plugins/shapes/joint.shapes.devs.js'],
            'shapes.uml': ['plugins/shapes/joint.shapes.uml.js'],
            'shapes.logic': ['plugins/shapes/joint.shapes.logic.js'],

            'layout.DirectedGraph': ['plugins/layout/DirectedGraph/joint.layout.DirectedGraph.js']
        }
    };

    var css = {

        core: [
            'css/layout.css',
            'css/themes/*.css'
        ],

        plugins: {

        }
    };

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

    var config = {

        pkg: pkg,

        webpack: {
            joint: {
                files: {
                   './build/joint.webpack-bundle.js' : './build/joint.min.js'
                },
                entry: './build/joint.min.js',
                output: {
                    path: './build/',
                    filename: 'joint.webpack-bundle.js',
                    library: 'joint'
                },
                resolve: {
                    alias: {
                        g: './geometry.min.js',
                        V: './vectorizer.min.js'
                    }
                }
            }
        },
        browserify: {
            joint: {
                files: {
                    'build/joint.browserify-bundle.js': 'build/joint.min.js'
                },
                options: {
                    browserifyOptions: {
                        standalone: 'joint'
                    }
                }
            }
        },
        clean: {
            dist: ['dist']
        },
        concat: {
            geometry: {
                files: {
                    'build/geometry.js': [].concat(
                        ['wrappers/geometry.head.js'],
                        js.geometry,
                        ['wrappers/geometry.foot.js']
                    ),
                    'build/geometry.min.js': [].concat(
                        ['wrappers/geometry.head.js'],
                        ['build/min/geometry.min.js'],
                        ['wrappers/geometry.foot.js']
                    )
                }
            },
            vectorizer: {
                files: {
                    'build/vectorizer.js': [].concat(
                        ['wrappers/vectorizer.head.js'],
                        js.vectorizer,
                        ['wrappers/vectorizer.foot.js']
                    ),
                    'build/vectorizer.min.js': [].concat(
                        ['wrappers/vectorizer.head.js'],
                        ['build/min/vectorizer.min.js'],
                        ['wrappers/vectorizer.foot.js']
                    )
                }
            },
            joint: {
                options: {
                    process: {
                        options: {
                            data: pkg,
                        },
                        delimiters: 'square'
                    }
                },
                files: {
                    'build/joint.core.js': [].concat(
                        ['wrappers/joint.head.js'],
                        js.geometry,
                        js.vectorizer,
                        js.core,
                        ['wrappers/joint.foot.js']
                    ),
                    'build/joint.core.min.js': [].concat(
                        ['wrappers/joint.head.js'],
                        ['build/min/geometry.min.js'],
                        ['build/min/vectorizer.min.js'],
                        ['build/min/joint.min.js'],
                        ['wrappers/joint.foot.js']
                    ),
                    'build/joint.core.css': [].concat(
                        css.core
                    ),
                    'build/joint.core.min.css': [].concat(
                        ['build/min/joint.min.css']
                    ),
                    'build/joint.js': [].concat(
                        ['wrappers/joint.head.js'],
                        js.geometry,
                        js.vectorizer,
                        js.core,
                        allJSPlugins(),
                        ['wrappers/joint.foot.js']
                    ),
                    'build/joint.min.js': [].concat(
                        ['wrappers/joint.head.js'],
                        ['build/min/geometry.min.js'],
                        ['build/min/vectorizer.min.js'],
                        ['build/min/joint.min.js'],
                        allMinifiedJSPlugins(),
                        ['wrappers/joint.foot.js']
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
                        js.geometry,
                        js.vectorizer,
                        js.core,
                        allJSPlugins()
                    ),
                    'build/joint.nowrap.min.js': [].concat(
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
                        '!min'
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
        },
        cssmin: {
            joint: {
                files: {
                    'build/min/joint.min.css': [].concat(
                        css.core
                    )
                }
            }
        },
        jscs: {
            options: {
                config: '.jscsrc'
            },
            src: [
                // All plugins:
                'plugins/**/*.js',

                // Ignore third-party dependencies in plugins:
                '!plugins/**/lib/**/*.js',

                // Core jointjs:
                'src/**/*.js',

                // Tests:
                'test/**/*.js'
            ]
        },
        mochaTest: {
            server: {
                src: [
                    'test/*-nodejs/*'
                ],
                options: {
                    reporter: 'spec'
                }
            }
        },
        qunit: {
            all: [
                'test/**/*.html',
                '!test/**/coverage.html'
            ],
            all_coverage: ['test/**/coverage.html'],
            joint: [
                'test/jointjs/*.html',
                '!test/jointjs/coverage.html'
            ],
            joint_coverage: ['test/jointjs/coverage.html'],
            geometry: ['test/geometry/*.html'],
            vectorizer: ['test/vectorizer/*.html']
        },
        shell: {

            /*
                Run `bower install` in the context of the given directory.
            */
            bowerInstall: {
                command: function(dir, environment) {

                    var flags = environment && environment === 'production' ? ' --production': '';
                    var cmd = 'cd ' + dir + ' && bower --allow-root install' + flags;

                    return cmd;
                }
            }
        },
        uglify: {
            geometry: {
                src: js.geometry,
                dest: 'build/min/geometry.min.js'
            },
            joint: {
                src: js.core,
                dest: 'build/min/joint.min.js'
            },
            vectorizer: {
                src: js.vectorizer,
                dest: 'build/min/vectorizer.min.js'
            }
        },
        watch: {
            joint: {
                files: [].concat(
                    js.geometry,
                    js.vectorizer,
                    js.core,
                    allJSPlugins(),
                    css.core,
                    allCSSPlugins()
                ),
                tasks: ['build']
            }
        }
    };

    function enableCodeCoverage() {

        // Replace all qunit configurations with the 'urls' method.
        // Append all URLs with ?coverage=true&grunt
        // This will run all qunit tests with test coverage enabled and report results back to grunt.

        var reporter = grunt.option('reporter') || 'lcov';

        // Serve up the test files via an express app.
        var express = require('express');
        var serveStatic = require('serve-static');
        var app = express();
        var host = 'localhost';
        var port = 3000;

        app.use('/', serveStatic(__dirname));
        app.listen(port, host);

        var name, files;

        for (name in config.qunit) {

            // Resolve the paths for all files referenced in the task.
            files = grunt.file.expand(config.qunit[name + '_coverage'] || config.qunit[name]);

            config.qunit[name] = { options: { urls: [] } };

            files.forEach(function(file) {

                var url = 'http://' + host + ':' + port + '/' + file + '?coverage=true&reporter=' + reporter;

                config.qunit[name].options.urls.push(url);
            });
        }

        var reporterToFileExtension = {
            lcov: 'info'
        };

        var reports = [];

        grunt.event.on('qunit.report', function(data) {

            reports.push(data);
        });

        var fs = require('fs');

        process.on('exit', function() {

            var ext = reporterToFileExtension[reporter];
            var outputFile = grunt.option('output') || 'coverage' + (ext ? '.' + ext : '');
            var data;

            switch (reporter) {
                case 'lcov':
                    data = reports.join('\n');
                break;
            }

            fs.writeFileSync(outputFile, data);
        });
    }

    // Create targets for all the plugins.
    Object.keys(js.plugins).forEach(function(name) {

        config.concat[name] = { files: {} };
        config.uglify[name] = { files: {} };

        config.uglify[name].files['build/min/joint.' + name + '.min.js'] = js.plugins[name];
        config.concat[name].files['build/joint.' + name + '.js'] = js.plugins[name];
        config.concat[name].files['build/joint.' + name + '.min.js'] = ['build/min/joint.' + name + '.min.js'];

        if (css.plugins[name]) {

            config.cssmin[name] = { files: {} };
            config.cssmin[name].files['build/min/joint.' + name + '.min.css'] = css.plugins[name];
            config.concat[name].files['build/joint.' + name + '.css'] = css.plugins[name];
            config.concat[name].files['build/joint.' + name + '.min.css'] = ['build/min/joint.' + name + '.min.css'];
        }
    });

    grunt.initConfig(config);

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

    if (grunt.option('coverage')) {
        enableCodeCoverage();
    }

    grunt.registerTask('concat:plugins', allPluginTasks.concat);
    grunt.registerTask('cssmin:plugins', allPluginTasks.cssmin);
    grunt.registerTask('uglify:plugins', allPluginTasks.uglify);

    grunt.registerTask('build:plugins', [
        'uglify:plugins',
        'cssmin:plugins',
        'concat:plugins'
    ]);

    grunt.registerTask('build:joint', [
        'build:plugins',
        'newer:uglify:geometry',
        'newer:uglify:vectorizer',
        'newer:uglify:joint',
        'newer:cssmin:joint',
        'newer:concat:geometry',
        'newer:concat:vectorizer',
        'newer:concat:joint'
    ]);

    grunt.registerTask('build', ['build:joint']);

    grunt.registerTask('build:bundles', [
        'newer:browserify',
        'newer:webpack'
    ]);

    grunt.registerTask('build:all', [
        'build:joint',
        'build:bundles'
    ]);

    grunt.registerTask('dist', [
        'build:all',
        'clean:dist',
        'copy:dist'
    ]);

    grunt.registerTask('test:server', ['mochaTest:server']);
    grunt.registerTask('test:client', ['qunit:all']);
    grunt.registerTask('test:code-style', ['jscs']);
    grunt.registerTask('test', ['test:server', 'test:client', 'test:code-style']);

    grunt.registerTask('bowerInstall', [
        'shell:bowerInstall:.'
    ]);

    grunt.registerTask('install', ['bowerInstall', 'build:all']);
    grunt.registerTask('default', ['install', 'build', 'watch']);
};
