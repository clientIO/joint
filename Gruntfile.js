module.exports = function(grunt) {

    require('time-grunt')(grunt);
    require('load-grunt-tasks')(grunt);

    var banner = '/*! <%= pkg.title %> v<%= pkg.version %> - <%= pkg.description %>  <%= grunt.template.today("yyyy-mm-dd") %> \n\n\nThis Source Code Form is subject to the terms of the Mozilla Public\nLicense, v. 2.0. If a copy of the MPL was not distributed with this\nfile, You can obtain one at http://mozilla.org/MPL/2.0/.\n */\n';

    var js = {

        core: [
            'src/core.js',
            'src/joint.dia.graph.js',
            'src/joint.dia.cell.js',
            'src/joint.dia.element.js',
            'src/joint.dia.link.js',
            'src/joint.dia.paper.js',
            'plugins/joint.shapes.basic.js',
            'plugins/routers/joint.routers.orthogonal.js',
            'plugins/routers/joint.routers.manhattan.js',
            'plugins/routers/joint.routers.metro.js',
            'plugins/connectors/joint.connectors.normal.js',
            'plugins/connectors/joint.connectors.rounded.js',
            'plugins/connectors/joint.connectors.smooth.js'
        ],

        geometry: ['src/geometry.js'],
        vectorizer: ['src/vectorizer.js'],

        plugins: {

            'shapes.erd': ['plugins/joint.shapes.erd.js'],
            'shapes.fsa': ['plugins/joint.shapes.fsa.js'],
            'shapes.org': ['plugins/joint.shapes.org.js'],
            'shapes.chess': ['plugins/joint.shapes.chess.js'],
            'shapes.pn': ['plugins/joint.shapes.pn.js'],
            'shapes.devs': ['plugins/joint.shapes.devs.js'],
            'shapes.uml': ['plugins/joint.shapes.uml.js'],
            'shapes.logic': ['plugins/joint.shapes.logic.js'],

            'layout.DirectedGraph': ['plugins/layout/DirectedGraph/joint.layout.DirectedGraph.js']
        }
    };

    var css = {

        core: ['joint.css'],

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

    function jointDependencies() {

        return [
            'lib/jquery/jquery.js',
            'lib/lodash/dist/lodash.js', 'lib/backbone/backbone.js'
        ].concat(
            js.vectorizer,
            js.geometry
        );
    }

    function jointMinifiedDependencies() {

        return [
            'lib/jquery/jquery.min.js',
            'lib/lodash/dist/lodash.min.js', 'lib/backbone/backbone-min.js',
            'build/min/vectorizer.min.js',
            'build/min/geometry.min.js'
        ];
    }

    grunt.template.addDelimiters('square', '[%', '%]');

    var config = {

        pkg: grunt.file.readJSON('package.json'),

        browserify: {
            joint: {
                files: {
                    'dist/joint.browserify-bundle.js': 'dist/joint.clean.min.js'
                },
                options: {
                    browserifyOptions: {
                        standalone: 'joint'
                    }
                }
            }
        },
        concat: {
            options: {
                banner: banner,
                process: {
                    delimiters: 'square'
                }
            },
            geometry: {
                files: {
                    'dist/geometry.js': js.geometry,
                    'dist/geometry.min.js': 'build/min/geometry.min.js'
                }
            },
            vectorizer: {
                files: {
                    'dist/vectorizer.js': js.vectorizer,
                    'dist/vectorizer.min.js': 'build/min/vectorizer.min.js'
                }
            },
            joint: {
                files: {
                    'dist/joint.js': [].concat(
                        ['build/wrappers/joint.head.js'],
                        jointDependencies(),
                        js.core,
                        allJSPlugins(),
                        ['build/wrappers/foot.js']
                    ),
                    'dist/joint.min.js': [].concat(
                        ['build/wrappers/joint.head.js'],
                        jointMinifiedDependencies(),
                        'build/min/joint.min.js',
                        allMinifiedJSPlugins(),
                        ['build/wrappers/foot.js']
                    ),
                    'dist/joint.clean.js': [].concat(
                        ['build/wrappers/joint.clean.head.js'],
                        js.core,
                        allJSPlugins(),
                        ['build/wrappers/foot.js']
                    ),
                    'dist/joint.clean.min.js': [].concat(
                        ['build/wrappers/joint.clean.head.js'],
                        'build/min/joint.min.js',
                        allMinifiedJSPlugins(),
                        ['build/wrappers/foot.js']
                    ),
                    'dist/joint.css': [].concat(
                        css.core,
                        allCSSPlugins()
                    ),
                    'dist/joint.min.css': [].concat(
                        'build/min/joint.min.css',
                        allMinifiedCSSPlugins()
                    )
                }
            }
        },
        copy: {

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
                'src/*.js',
                'plugins/*.js',
                'plugins/connectors/*.js',
                'plugins/routers/*.js',
                'plugins/layout/DirectedGraph/*.js'
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
            all: ['test/**/*.html'],
            joint: ['test/jointjs/*.html'],
            geometry: ['test/geometry/*.html'],
            vectorizer: ['test/vectorizer/*.html']
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

    // Create targets for all the plugins.
    Object.keys(js.plugins).forEach(function(name) {

        config.concat[name] = { files: {} };
        config.uglify[name] = { files: {} };

        config.concat[name].files['dist/joint.' + name + '.js'] = js.plugins[name];
        config.uglify[name].files['build/min/joint.' + name + '.min.js'] = js.plugins[name];
        config.copy[name] = { files: [] };

        config.copy[name].files.push({
            nonull: true,
            src: ['build/min/joint.' + name + '.min.js'],
            dest: 'dist/joint.' + name + '.min.js'
        });

        if (css.plugins[name]) {

            config.cssmin[name] = { files: {} };

            config.concat[name].files['dist/joint.' + name + '.css'] = css.plugins[name];
            config.cssmin[name].files['build/min/joint.' + name + '.min.css'] = css.plugins[name];
            config.copy[name].files.push({
                nonull: true,
                src: ['build/min/joint.' + name + '.min.css'],
                dest: 'dist/joint.' + name + '.min.css'
            });
        }
    });

    grunt.initConfig(config);

    var allPluginTasks = {
        concat: [],
        copy: [],
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

        pluginTasks.push('newer:copy:' + name);
        allPluginTasks.copy.push('newer:copy:' + name);

        grunt.registerTask(name, pluginTasks);
    });

    grunt.registerTask('concat:plugins', allPluginTasks.concat);
    grunt.registerTask('copy:plugins', allPluginTasks.copy);
    grunt.registerTask('cssmin:plugins', allPluginTasks.cssmin);
    grunt.registerTask('uglify:plugins', allPluginTasks.uglify);

    grunt.registerTask('build:plugins', [
        'uglify:plugins',
        'cssmin:plugins',
        'concat:plugins',
        'copy:plugins'
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
    grunt.registerTask('all', ['build', 'newer:browserify']);

    grunt.registerTask('test:server', ['mochaTest:server']);
    grunt.registerTask('test:client', ['qunit:all', 'jscs']);
    grunt.registerTask('test', ['test:server', 'test:client']);

    grunt.registerTask('default', ['build', 'watch']);
};
