'use strict';

var path = require('path');
module.exports = function(grunt) {

    grunt.template.addDelimiters('square', '[%', '%]');

    var utils = require('./grunt/resources/utils')(grunt);

    require('time-grunt')(grunt);

    // Every `grunt/config/<name>.js` is the config of task `<name>`, except
    // `aliases.js`, which maps each alias to the list of tasks it runs
    var configPath = path.join(process.cwd(), 'grunt/config');
    var config = { pkg: utils.pkg };
    var aliases = {};
    grunt.file.expand({ cwd: configPath }, '*.js').forEach(function(file) {
        var name = path.basename(file, '.js');
        var value = require(path.join(configPath, file));
        if (typeof value === 'function') value = value(grunt);
        if (name === 'aliases') {
            aliases = value;
        } else {
            config[name] = value;
        }
    });
    grunt.initConfig(config);

    // Load every grunt plugin listed in `devDependencies`
    Object.keys(utils.pkg.devDependencies).forEach(function(name) {
        if (name.indexOf('grunt-') === 0) grunt.loadNpmTasks(name);
    });

    Object.keys(aliases).forEach(function(name) {
        grunt.registerTask(name, aliases[name]);
    });
};
