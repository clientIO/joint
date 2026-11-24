const puppeteer = require('puppeteer');

module.exports = async function(config) {
    // Karma's ChromeHeadless launcher starts the browser at `CHROME_BIN` - the one
    // Puppeteer installs, whose path it only resolves asynchronously
    process.env.CHROME_BIN = await puppeteer.executablePath();

    config.set({
        basePath: '.',
        files: [
            './node_modules/@joint/core/build/joint.js',
            // libavoid-js only ships an ES module build, so it (and the wasm
            // binary it loads) must be served and loaded as a module -
            // see `test/libavoid-loader.mjs`.
            { pattern: './node_modules/libavoid-js/dist/*', included: false, served: true, watched: false },
            { pattern: './test/libavoid-loader.mjs', type: 'module' },
            { pattern: './dist/umd/index.js', type: 'module' },

            { pattern: './test/index.js', type: 'module' }
        ],
        singleRun: true,
        frameworks: ['qunit'],
        plugins: [
            'karma-qunit',
            'karma-coverage',
            'karma-chrome-launcher'
        ],
        reporters: ['progress', 'coverage'],
        browsers: ['ChromeHeadless_custom'],
        customLaunchers: {
            ChromeHeadless_custom: {
                base: 'ChromeHeadless',
                flags: [
                    // --no-sandbox needed for Jenkins build
                    '--no-sandbox',
                    '--headless',
                    '--disable-gpu',
                    '--disable-dev-shm-usage',
                    // Keep macOS from asking for the keychain password on launch
                    '--use-mock-keychain'
                ]
            }
        },
        exclude: [],
        preprocessors: {
            './dist/umd/index.js': ['coverage']
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
