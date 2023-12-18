// Used for starting Chrome if using ChromeHeadless in Jenkins
process.env.CHROME_BIN = require('puppeteer').executablePath();

module.exports = function(config) {
    config.set({
        basePath: '.',
        files: [
            './node_modules/@dagrejs/graphlib/dist/graphlib.js',
            './node_modules/@dagrejs/dagre/dist/dagre.js',

            './node_modules/jointjs/build/geometry.js',
            './node_modules/jointjs/build/vectorizer.js',
            './node_modules/jointjs/build/joint.js',

            './build/DirectedGraph.umd.js',

            './test/**/*.js'
        ],
        singleRun: true,
        frameworks: ['sinon','qunit'],
        plugins: [
            'karma-qunit',
            'karma-coverage',
            'karma-chrome-launcher',
            'karma-sinon'
        ],
        reporters: ['progress', 'coverage'],
        proxies: {},
        browsers: ['ChromeHeadless_custom'],
        customLaunchers: {
            ChromeHeadless_custom: {
                base: 'ChromeHeadless',
                flags: [
                    // --no-sandbox needed for Jenkins build
                    '--no-sandbox',
                    '--headless',
                    '--disable-gpu',
                    '--disable-dev-shm-usage'
                ]
            }
        },
        exclude: [],
        preprocessors: {
            './build/DirectedGraph.umd.js': ['coverage']
        },
        coverageReporter: {
            // specify a common output directory
            dir: 'coverage/',
            reporters: [
                // reporters not supporting the `file` property
                { type: 'html', subdir: 'report-html' },
                { type: 'text-summary' }
            ]
        }
    });
};
