const core = require('../resources/core');

module.exports = function() {

    const config = {
        joint: {
            files: {
                'build/min/joint.min.css': core.css
            }
        }
    };

    return config;
};
