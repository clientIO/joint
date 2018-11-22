'use strict';

var path = require('path');

module.exports = function(grunt) {

    require('time-grunt')(grunt);
    require('load-grunt-tasks')(grunt);
    require('load-grunt-config')(grunt, {
        configPath: path.join(process.cwd(), 'grunt/config')
    });
    grunt.loadTasks('./grunt/tasks');
};
