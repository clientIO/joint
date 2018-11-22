'use strict';

var path = require('path');
module.exports = function(grunt) {

    var utils = require('./grunt/utils')(grunt);

    require('time-grunt')(grunt);
    require('load-grunt-tasks')(grunt);

    require('load-grunt-config')(grunt, {
        configPath: path.join(process.cwd(), 'grunt/config'),
        postProcess: function(config) {
            config.pkg = utils.pkg;
        }
    });

    grunt.loadTasks('./grunt/tasks');
};
