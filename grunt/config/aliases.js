module.exports = function(grunt) {

    return {
        'default': [
            'install',
            'build',
            'watch'
        ],
        'install': ['build:all'],
        'build': ['build:joint'],
        'dist': [
            'clean:dist',
            'clean:build',
            'build:all',
            'copy:dist',
            'concat:types'
        ],
        'build:all': [
            'build:joint',
            'build:bundles',
            'build:docs',
            'newer:copy:appsLibs'
        ],
        'build:joint': [
            'build:plugins',
            'newer:uglify:polyfills',
            'newer:uglify:deps',
            'newer:uglify:geometry',
            'newer:uglify:vectorizer',
            'newer:uglify:joint',
            'newer:cssmin:joint',
            'newer:concat:geometry',
            'newer:concat:vectorizer',
            'newer:concat:joint',
            'newer:concat:types'
        ],
        'build:plugins': [
            'uglify:plugins',
            'cssmin:plugins',
            'concat:plugins'
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
        'test:bundles': [
            'qunit:joint',
            'qunit:vectorizer',
            'qunit:geometry'
        ],
        'test:src': [
            'karma:geometry',
            'karma:vectorizer',
            'karma:joint'
        ],
        'test:coverage': ['test:src'],
        'test:code-style': ['eslint'],
        'test:server': ['mochaTest:server'],
        'test:client': [
            'test:src',
            'test:bundles'
        ],
        'test': [
            'test:server',
            'test:client',
            'test:code-style'
        ],
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
