module.exports = function(grunt) {

    // Configurable area.
    // ------------------

    var js = {
        
        libs: {
            jquery: ['lib/jquery.js'],
            backbone: ['lib/lodash.js', 'lib/backbone.js'],
            helpers: ['lib/jquery.sortElements.js']
        },
        
        core: [
            'src/core.js', 'src/vectorizer.js', 'src/geometry.js', 'src/joint.dia.graph.js', 'src/joint.dia.cell.js', 'src/joint.dia.element.js', 'src/joint.dia.link.js', 'src/joint.dia.paper.js',
            'plugins/joint.shapes.basic.js'
        ],

        plugins: {

            'shapes.erd': ['plugins/joint.shapes.erd.js'],
            'shapes.fsa': ['plugins/joint.shapes.fsa.js'],
            'shapes.org': ['plugins/joint.shapes.org.js'],
            'shapes.chess': ['plugins/joint.shapes.chess.js'],
            'shapes.pn': ['plugins/joint.shapes.pn.js'],
            'shapes.devs': ['plugins/joint.shapes.devs.js'],
            'shapes.uml': ['plugins/joint.shapes.uml.js'],

            'layout.DirectedGraph': ['plugins/layout/DirectedGraph/lib/dagre.js', 'plugins/layout/DirectedGraph/joint.layout.DirectedGraph.js']
        }
    };

    var css = {

        core: ['joint.css'],

        plugins: {

        }
    };

    // Main.
    // -----

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
    
    
    var config = {
        
        pkg: grunt.file.readJSON('package.json'),
        
        qunit: {
            all: ['test/**/*.html']
        },
        
        concat: {
            options: {
                banner: '/*! <%= pkg.title %> v<%= pkg.version %> - <%= pkg.description %>  <%= grunt.template.today("yyyy-mm-dd") %> \n\n\nThis Source Code Form is subject to the terms of the Mozilla Public\nLicense, v. 2.0. If a copy of the MPL was not distributed with this\nfile, You can obtain one at http://mozilla.org/MPL/2.0/.\n */\n'
            },
            dist: {
                files: {
                    'dist/joint.js': [].concat(
                        js.libs.jquery, js.libs.backbone, js.libs.helpers,
                        js.core
                    ),
                    'dist/joint.css': [].concat(
                        css.core
                    )
                }
            },
            allinone: {
                files: {
                    'dist/joint.all.js': [].concat(
                        js.libs.jquery, js.libs.backbone, js.libs.helpers,
                        js.core, allJSPlugins()
                    ),
                    'dist/joint.all.css': [].concat(
                        css.core, allCSSPlugins()
                    )
                }
            },
            nojquery: {
                files: {
                    'dist/joint.nojquery.js': [].concat(
                        js.libs.backbone, js.libs.helpers,
                        js.core
                    ),
                    'dist/joint.nojquery.css': [].concat(
                        css.core
                    )
                }
            },
            nobackbone: {
                files: {
                    'dist/joint.nobackbone.js': [].concat(
                        js.libs.jquery, js.libs.helpers,
                        js.core
                    ),
                    'dist/joint.nojquery.css': [].concat(
                        css.core
                    )
                }
            },
            nojquerynobackbone: {
                files: {
                    'dist/joint.nojquerynobackbone.js': [].concat(
                        js.libs.helpers,
                        js.core
                    ),
                    'dist/joint.nojquerynobackbone.css': [].concat(
                        css.core
                    )
                }
            }
        },
        uglify: {
            options: {
                report: 'min',
                banner: '/*! <%= pkg.title %> v<%= pkg.version %> - <%= pkg.description %>  <%= grunt.template.today("yyyy-mm-dd") %> \n\n\nThis Source Code Form is subject to the terms of the Mozilla Public\nLicense, v. 2.0. If a copy of the MPL was not distributed with this\nfile, You can obtain one at http://mozilla.org/MPL/2.0/.\n */\n'
            },
            
            dist: {
                files: {
                    'dist/joint.min.js': [].concat(
                        js.libs.jquery, js.libs.backbone, js.libs.helpers,
                        js.core
                    )
                }
            },
            allinone: {
                files: {
                    'dist/joint.all.min.js': [].concat(
                        js.libs.jquery, js.libs.backbone, js.libs.helpers,
                        js.core, allJSPlugins()
                    )
                }
            },
            nojquery: {
                files: {
                    'dist/joint.nojquery.min.js': [].concat(
                        js.libs.backbone, js.libs.helpers,
                        js.core
                    )
                }
            },
            nobackbone: {
                files: {
                    'dist/joint.nobackbone.min.js': [].concat(
                        js.libs.jquery, js.libs.helpers,
                        js.core
                    )
                }
            },
            nojquerynobackbone: {
                files: {
                    'dist/joint.nojquerynobackbone.min.js': [].concat(
                        js.libs.helpers,
                        js.core
                    )
                }
            }
        },
        cssmin: {
            options: {
                report: 'min',
                banner: '/*! <%= pkg.title %> v<%= pkg.version %> - <%= pkg.description %>  <%= grunt.template.today("yyyy-mm-dd") %> \n\n\nThis Source Code Form is subject to the terms of the Mozilla Public\nLicense, v. 2.0. If a copy of the MPL was not distributed with this\nfile, You can obtain one at http://mozilla.org/MPL/2.0/.\n */\n'
            },
            dist: {
                files: {
                    'dist/joint.min.css': [].concat(
                        css.core
                    )
                }
            },
            allinone: {
                files: {
                    'dist/joint.all.min.css': [].concat(
                        css.core, allCSSPlugins()
                    )
                }
            },
            nojquery: {
                files: {
                    'dist/joint.nojquery.min.css': [].concat(
                        css.core
                    )
                }
            },
            nobackbone: {
                files: {
                    'dist/joint.nojquery.min.css': [].concat(
                        css.core
                    )
                }
            },
            nojquerynobackbone: {
                files: {
                    'dist/joint.nojquerynobackbone.min.css': [].concat(
                        css.core
                    )
                }
            }
        }
    };

    // Create a separate target for all the plugins.
    Object.keys(js.plugins).forEach(function(name) {

        config.concat[name] = { files: {} };
        config.uglify[name] = { files: {} };
        
        config.concat[name].files['dist/joint.' + name + '.js'] = js.plugins[name];
        config.uglify[name].files['dist/joint.' + name + '.min.js'] = js.plugins[name];
        
        if (css.plugins[name]) {
            
            config.concat[name].files['dist/joint.' + name + '.css'] = css.plugins[name];
            config.cssmin[name] = { files: {} };
            config.cssmin[name].files['dist/joint.' + name + '.min.css'] = css.plugins[name];
        }
    });

    grunt.initConfig(config);

    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-qunit');

    // Default task(s).
    grunt.registerTask('default', ['concat:dist', 'uglify:dist', 'cssmin:dist']);
    grunt.registerTask('allinone', ['concat:allinone', 'uglify:allinone', 'cssmin:allinone']);

    // Separate tasks for all the plugins.
    Object.keys(js.plugins).forEach(function(name) {

        grunt.registerTask(name, ['concat:' + name, 'uglify:' + name].concat(css.plugins[name] ? ['cssmin:' + name] : []));
    });

    // One task that build everything but separately. Compare this to the 'all' task that builds
    // everything into one file (for JS and CSS).

    var allTasks = [
        'concat:dist', 'uglify:dist', 'cssmin:dist',
        'concat:nojquery', 'uglify:nojquery', 'cssmin:nojquery',
        'concat:nobackbone', 'uglify:nobackbone', 'cssmin:nobackbone',
        'concat:nojquerynobackbone', 'uglify:nojquerynobackbone', 'cssmin:nojquerynobackbone'
    ];

    Object.keys(js.plugins).forEach(function(name) {

        allTasks = allTasks.concat(['concat:' + name, 'uglify:' + name].concat(css.plugins[name] ? ['cssmin:' + name] : []));
    });

    grunt.registerTask('all', allTasks);
};
