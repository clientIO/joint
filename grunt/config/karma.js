const plugins = require('../resources/plugins');
const geometry = require('../resources/geometry');
const vectorizer = require('../resources/vectorizer');
const core = require('../resources/core');
const polyfills = require('../resources/polyfills');
const dependecies = require('../resources/dependencies');

module.exports = function(grunt) {

    let allJSPlugins = [];

    Object.keys(plugins).forEach(function(name) {
        allJSPlugins = allJSPlugins.concat(plugins[name]);
    });

    function karmaBrowsers() {
        const browser = grunt.option('browser') || 'PhantomJS';
        return [browser];
    }

    function karmaPreprocessors(files) {
        const preprocessors = ['coverage'];
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
                break;
            case 'html':
                reporters = [{ type: 'html' }];
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
            browsers: karmaBrowsers(),
            reporters: ['progress', 'coverage'],
            singleRun: true,
            exclude: [
                'test/**/require.js',
                'test/**/browserify.js'
            ]
        },
        geometry: {
            options: {
                files: [
                    geometry,
                    'test/geometry/*.js'
                ],
                preprocessors: karmaPreprocessors(geometry),
                coverageReporter: karmaCoverageReporters('geometry')
            },
        },
        vectorizer: {
            options: {
                files: [
                    geometry,
                    vectorizer,
                    'test/vectorizer/*.js',
                ],
                preprocessors: karmaPreprocessors(vectorizer),
                coverageReporter: karmaCoverageReporters('vectorizer')
            }
        },
        joint: {
            options: {
                files: [
                    dependecies,
                    geometry,
                    vectorizer,
                    polyfills,
                    core.js,
                    allJSPlugins,
                    'test/utils.js',
                    'test/jointjs/**/*.js'
                ],
                preprocessors: karmaPreprocessors([].concat(core.js, allJSPlugins)),
                coverageReporter: karmaCoverageReporters('joint')
            }
        }
    }
};

