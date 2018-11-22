const css = require('../resources').css;

module.exports = function() {

    const config = {
        joint: {
            files: {
                'build/min/joint.min.css':
                    [].concat(css.core)
            }
        }
    };

    Object.keys(css.plugins).forEach(function(name) {

        config[name] = { files: {} };
        config[name].files['build/min/joint.' + name + '.min.css'] = css.plugins[name];
    });

    return config;
};
