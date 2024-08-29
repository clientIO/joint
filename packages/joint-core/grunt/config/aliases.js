module.exports = function(grunt) {

    return {
        'default': [
            'install',
            'watch'
        ],
        'install': [
            'shell:rollup-dist',
            'build',
            'uglify:all'
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
            'uglify:all'
        ],
        'build:joint': [
            'shell:rollup-joint',
            'shell:api-extractor-dts-bundle',
            'newer:concat:types'
        ],
        'uglify:all':[
            'newer:uglify:deps',
            'newer:uglify:geometry',
            'newer:uglify:vectorizer',
            'newer:uglify:joint',
            'newer:uglify:jointNoWrap',
            'newer:uglify:plugins'
        ],
        'build:bundles': [
            'newer:browserify',
            'webpack'
        ],

        // TESTS
        'test': [
            'shell:rollup-test-bundle',
            'test:server',
            'test:client',
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
