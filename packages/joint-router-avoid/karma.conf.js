// Used for starting Chrome if using ChromeHeadless in Jenkins
process.env.CHROME_BIN = require('puppeteer').executablePath();

module.exports = function(config) {
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
        // The wasm loader resolves its binary relative to the document
        // (module scripts don't set `document.currentScript`), so it always
        // requests it from the server root.
        proxies: {
            '/libavoid.wasm': '/base/node_modules/libavoid-js/dist/libavoid.wasm'
        },
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
                    '--disable-dev-shm-usage'
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
