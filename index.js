'use strict';

var fs = require('fs');

var filePath = ['./build/joint.js', './dist/joint.js'].find(function(filePath) {

    try {
        fs.accessSync(__dirname + '/' + filePath, fs.F_OK);
    } catch (error) {
        return false;
    }

    return true;
});

if (!filePath) {
    throw new Error('JointJS build file not found.');
}

module.exports = require(filePath);
