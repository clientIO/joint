'use strict';

if (process.env.NODE_ENV !== 'production') {

    var grunt = require('grunt');

    grunt.cli.tasks = ['install'];
    grunt.cli();
}
