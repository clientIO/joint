module.exports = function(grunt) {

    return {
        'default': [
            'install',
            'watch'
        ],
        'install': [
            'shell:rollup-dist',
            'build',
            'uglify:all',
            'build:docs'
        ],
        'build': [
            'build:joint'
        ],
        'dist': [
            'clean:dist',
            'dist:prepare',
            'copy:dist',
        ],
        // dry dist - create dist files into the build folder - including min files
        'dist:prepare':[
            'clean:build',
            'build:joint',
            'shell:rollup-dist',
            'uglify:all',
            'build:docs'
        ],
        'build:joint': [
            'shell:rollup-joint',
            'newer:concat:joint',
            'newer:concat:types',
            'newer:copy:appsLibs'
        ],
        'uglify:all':[
            'newer:uglify:deps',
            'newer:uglify:geometry',
            'newer:uglify:vectorizer',
            'newer:uglify:joint',
            'newer:uglify:jointCore',
            'newer:uglify:jointNoWrap',
            'newer:uglify:plugins',
            'newer:cssmin:joint',
        ],
        'build:bundles': [
            'newer:browserify',
            'webpack'
        ],
        'build:docs': [
            'compileDocs:all',
            'syntaxHighlighting:docs',
            'newer:copy:docs'
        ],

        // TESTS
        'test': [
            'shell:rollup-test-bundle',
            'test:server',
            'test:client',
            'test:code-style',
            'ts:test'
        ],
        'test:server': ['mochaTest:server'],
        'test:client': [
            'test:src',
            'test:bundles'
        ],
        'test:src': [
            'karma:geometry',
            'karma:vectorizer',
            'karma:joint'
        ],
        'test:bundles': [
            'build:bundles',
            'qunit:joint',
            'qunit:vectorizer',
            'qunit:geometry'
        ],
        'test:code-style': ['eslint'],
        'test:coverage': ['test:src'],
        'test:e2e': ['mochaTest:e2e'],
        'test:e2e:all': [
            'test:e2e:chrome-linux',
            'test:e2e:chrome-windows7',
            'test:e2e:chrome-mac',
            'test:e2e:firefox-linux',
            'test:e2e:firefox-mac'
        ]
    };
};
