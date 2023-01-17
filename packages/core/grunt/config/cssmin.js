const core = require('../resources/core');

module.exports = function() {

    return {
        joint: {
            files: {
                'build/joint.min.css': core.css,
                'build/joint.core.min.css': core.css,
            }
        }
    };
};
