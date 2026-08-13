const dependencies = require('../resources/dependencies');
const modules = require('../resources/esm');

module.exports = function(grunt) {

    process.env.CHROME_BIN = require('puppeteer').executablePath();

    function karmaPreprocessors(files) {
        // 'sourcemap' must run first: it attaches the bundle's map to the karma file,
        // which is what lets karma-coverage remap the results onto src/
        const preprocessors = ['sourcemap', 'coverage'];
        return files.reduce(function(files, file) {
            files[file] = preprocessors;
            return files;
        }, {});
    }

    function karmaCoverageReporters(name) {
        let reporters;
        let check;
        let reporter = grunt.option('reporter') || '';
        if (!reporter && grunt.cli.tasks.indexOf('test:coverage') !== -1) {
            reporter = 'html';
        }
        switch (reporter) {
            case 'lcov':
                reporters = [{ type: 'lcovonly', subdir: '.', file: `${name}.lcov` }];
                check = grunt.file.readJSON('coverage.json')[name];
                break;
            case 'html':
                reporters = [{ type: 'html' }];
                check = grunt.file.readJSON('coverage.json')[name];
                break;
            case '':
                reporters = [{ type: 'text-summary' }];
                check = grunt.file.readJSON('coverage.json')[name];
                break;
            default:
                grunt.log.error(`Invalid reporter "${reporter}". Use "lcov" or "html".`);
                process.exit(1);
                return;
        }
        return { dir: `coverage/${name}`, reporters, check };
    }

    return {
        options: {
            basePath: '',
            autoWatch: false,
            frameworks: ['sinon', 'qunit'],
            browsers: ['ChromeHeadless_custom'],
            customLaunchers: {
                ChromeHeadless_custom: {
                    base: 'ChromeHeadless',
                    flags: [
                        '--no-sandbox',
                        '--headless',
                        '--disable-gpu',
                        '--disable-dev-shm-usage'
                    ]
                }
            },
            reporters: ['progress', 'coverage'],
            // Change to false when debugging
            singleRun: true,
            exclude: [
                'test/**/require.js',
                'test/**/browserify.js'
            ]
        },
        geometry: {
            options: {
                files: [
                    modules.geometry.test,
                    'test/geometry/*.js'
                ],
                preprocessors: karmaPreprocessors([modules.geometry.test]),
                coverageReporter: karmaCoverageReporters('geometry')
            },
        },
        vectorizer: {
            options: {
                files: [
                    modules.geometry.test,
                    modules.vectorizer.test,
                    'test/geometry/*.js',
                    'test/vectorizer/*.js',
                ],
                preprocessors: karmaPreprocessors([modules.vectorizer.test]),
                coverageReporter: karmaCoverageReporters('vectorizer')
            }
        },
        joint: {
            options: {
                files: [
                    dependencies,
                    modules.geometry.test,
                    modules.vectorizer.test,
                    modules.joint.noDependencies,
                    'test/utils.js',
                    'test/jointjs/**/*.js'
                ],
                preprocessors: karmaPreprocessors([modules.joint.noDependencies]),
                coverageReporter: karmaCoverageReporters('joint')
            }
        }
    };
};
