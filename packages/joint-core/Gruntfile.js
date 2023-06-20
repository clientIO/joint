'use strict';

var path = require('path');
module.exports = function(grunt) {

    grunt.template.addDelimiters('square', '[%', '%]');

    var utils = require('./grunt/resources/utils')(grunt);

    require('time-grunt')(grunt);
    require('load-grunt-config')(grunt, {
        configPath: path.join(process.cwd(), 'grunt/config'),
        jitGrunt: true,
        postProcess: function(config) {
            config.pkg = utils.pkg;
        }
    });

    grunt.loadTasks('./grunt/tasks');
};
