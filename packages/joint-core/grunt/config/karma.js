const puppeteer = require('puppeteer');
const dependencies = require('../resources/dependencies');
const modules = require('../resources/esm');
const coverageThresholds = require('../../coverage.json');

// Used for starting Chrome if using ChromeHeadless in Jenkins
process.env.CHROME_BIN = puppeteer.executablePath();

// Which path should .lcov files record as root they are relative to?
// - SonarQube (`.github/workflows/sonar.yml`) needs this to be the repo root
const REPOSITORY_ROOT = '../..';

module.exports = function(grunt) {

    function karmaPreprocessors(files) {
        const preprocessors = ['sourcemap', 'coverage'];
        return files.reduce(function(files, file) {
            files[file] = preprocessors;
            return files;
        }, {});
    }

    function karmaCoverageReporters(name) {
        let reporters;
        let reporter = process.env.COVERAGE_REPORTER || '';
        if (!reporter && grunt.cli.tasks.indexOf('test:coverage') !== -1) {
            reporter = 'html';
        }
        switch (reporter) {
            case 'lcov':
                reporters = [{ type: 'lcovonly', subdir: '.', file: 'lcov.info', projectRoot: REPOSITORY_ROOT }];
                break;
            case 'html':
                reporters = [{ type: 'html', subdir: '.' }];
                break;
            case '':
                reporters = [{ type: 'text-summary' }];
                break;
            default:
                grunt.log.error(`Invalid COVERAGE_REPORTER "${reporter}". Use "lcov" or "html".`);
                process.exit(1);
                return;
        }
        return { dir: `coverage/${name}`, reporters, check: coverageThresholds[name] };
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
                    modules.joint.test,
                    'test/utils.js',
                    'test/jointjs/**/*.js'
                ],
                preprocessors: karmaPreprocessors([modules.joint.test]),
                coverageReporter: karmaCoverageReporters('joint')
            }
        }
    };
};
