const css = require('../resources').css;

module.exports = {
    joint: {
        files: {
            'build/min/joint.min.css': [].concat(css.core)
        }
    }
};
