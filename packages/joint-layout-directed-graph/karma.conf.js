// Used for starting Chrome if using ChromeHeadless in Jenkins
process.env.CHROME_BIN = require('puppeteer').executablePath();

// Coverage is collected against the sourcemapped test bundle and remapped onto
// DirectedGraph.mjs, so the reports describe the source rather than the bundle.
const TESTED_BUNDLE = './build/test/DirectedGraph.js';

const coverageThresholds = require('./coverage.json');

module.exports = function(config) {
    config.set({
        basePath: '.',
        files: [
            './node_modules/@dagrejs/graphlib/dist/graphlib.js',
            './node_modules/@dagrejs/dagre/dist/dagre.js',
            './node_modules/@joint/core/build/joint.js',
            TESTED_BUNDLE,

            './test/index.js'
        ],
        singleRun: true,
        frameworks: ['qunit'],
        plugins: [
            'karma-qunit',
            'karma-coverage',
            'karma-sourcemap-loader',
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
            // 'sourcemap' must run first: it attaches the bundle's map to the karma
            // file, which is what lets karma-coverage remap the results onto the source
            [TESTED_BUNDLE]: ['sourcemap', 'coverage']
        },
        coverageReporter: {
            // specify a common output directory
            dir: 'coverage/',
            // Coverage baseline, recorded as the floor of what the suite currently
            // reaches. Falling below any of these fails the run.
            check: coverageThresholds,
            reporters: process.env.COVERAGE_REPORTER === 'lcov'
                ? [{ type: 'lcovonly', subdir: '.', file: 'lcov.info' }]
                : [
                    // reporters not supporting the `file` property
                    { type: 'html', subdir: 'report-html' },
                    { type: 'text-summary' }
                ]
        }
    });
};
