const puppeteer = require('puppeteer');
const coverageThresholds = require('./coverage.json');

// Used for starting Chrome if using ChromeHeadless in Jenkins
process.env.CHROME_BIN = puppeteer.executablePath();

// Coverage is collected for this and source-mapped to `DirectedGraph.mjs`
const TEST_BUNDLE = './build/test/DirectedGraph.js';

// Which path should .lcov files record as root they are relative to?
// - SonarQube (`.github/workflows/sonar.yml`) needs this to be the repo root
const REPOSITORY_ROOT = '../..';

module.exports = function(config) {
    config.set({
        basePath: '.',
        files: [
            './node_modules/@dagrejs/graphlib/dist/graphlib.js',
            './node_modules/@dagrejs/dagre/dist/dagre.js',
            './node_modules/@joint/core/build/joint.js',
            TEST_BUNDLE,

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
            [TEST_BUNDLE]: ['sourcemap', 'coverage']
        },
        coverageReporter: {
            // specify a common output directory
            dir: 'coverage/',
            // coverage baseline - falling below any of these fails the test
            check: coverageThresholds,
            reporters: ((process.env.COVERAGE_REPORTER === 'lcov')
                ? [{ type: 'lcovonly', subdir: '.', file: 'lcov.info', projectRoot: REPOSITORY_ROOT }]
                : [
                    { type: 'html', subdir: '.' },
                    { type: 'text-summary' }
                ])
        }
    });
};
