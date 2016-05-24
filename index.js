'use strict';

var fs = require('fs');

var possiblePaths = ['./build/joint.js', './dist/joint.js'];
var filePath;

while ((filePath = possiblePaths.shift())) {

    try {
        fs.statSync(__dirname + '/' + filePath);
    } catch (error) {
        // Try another path.
        continue;
    }

    // Found a path that exists.
    break;
}

if (!filePath) {
    throw new Error('JointJS build file not found.');
}

module.exports = require(filePath);
