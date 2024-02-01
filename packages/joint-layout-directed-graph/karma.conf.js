// Used for starting Chrome if using ChromeHeadless in Jenkins
process.env.CHROME_BIN = require('puppeteer').executablePath();

module.exports = function(config) {
    config.set({
        basePath: '.',
        files: [
            './node_modules/@dagrejs/graphlib/dist/graphlib.js',
            './node_modules/@dagrejs/dagre/dist/dagre.js',
            './node_modules/@joint/core/build/joint.js',
            './dist/DirectedGraph.js',

            './test/index.js'
        ],
        singleRun: true,
        frameworks: ['qunit'],
        plugins: [
            'karma-qunit',
            'karma-coverage',
            'karma-chrome-launcher'
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
            './dist/DirectedGraph.js': ['coverage']
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
