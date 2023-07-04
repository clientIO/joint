const core = require('../resources/core');

module.exports = function(grunt) {

    return {
        joint: {
            files: {
                'build/joint.core.css':
                    [].concat(
                        core.css
                    ),
                'build/joint.css':
                    [].concat(
                        core.css
                    )
            }
        }
    };
};
