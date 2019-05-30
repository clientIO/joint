module.exports = function(grunt) {

    return {
        'default': [
            'install',
            'watch'
        ],
        'install': [
            'shell:libs-esm',
            'build:all'
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
            'build:all',
            'uglify:all',
            'concat:types'
        ],
        'build:all': [
            'build:joint',
            'build:bundles',
            'build:docs',
            'newer:copy:appsLibs'
        ],
        'build:joint': [
            'shell:rollup',
            'newer:concat:joint',
            'newer:concat:types'
        ],
        'uglify:all':[
            'uglify:deps',
            'uglify:geometry',
            'uglify:vectorizer',
            'uglify:joint',
            'uglify:jointCore',
            'uglify:jointNoWrap',
            'cssmin:joint',
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
            'test:server',
            'test:client',
            'test:code-style'
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
