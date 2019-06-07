const dependecies = require('../resources/dependencies');
const modules = require('../resources/esm');

module.exports = function(grunt) {

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
                    modules.geometry.umd,
                    'test/geometry/*.js'
                ],
                preprocessors: karmaPreprocessors([modules.geometry.umd]),
                coverageReporter: karmaCoverageReporters('geometry')
            },
        },
        vectorizer: {
            options: {
                files: [
                    modules.geometry.umd,
                    modules.vectorizer.umd,
                    'test/geometry/*.js',
                    'test/vectorizer/*.js',
                ],
                preprocessors: karmaPreprocessors([modules.vectorizer.umd]),
                coverageReporter: karmaCoverageReporters('vectorizer')
            }
        },
        joint: {
            options: {
                files: [
                    dependecies,
                    modules.geometry.umd,
                    modules.vectorizer.umd,
                    modules.joint.noDependencies,
                    'test/utils.js',
                    'test/jointjs/**/*.js'
                ],
                preprocessors: karmaPreprocessors([modules.joint.noDependencies]),
                coverageReporter: karmaCoverageReporters('joint')
            }
        }
    }
};

