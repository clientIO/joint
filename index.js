'use strict';

try {
  module.exports = require('./build/joint.js');
}
catch (error) {
  try {
    // Try another path.
    module.exports = require('./dist/joint.js');
  }
  catch (error) {
    throw new Error('JointJS build file not found.');
  }
}
