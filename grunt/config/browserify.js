module.exports = {
    joint: {
        files: {
            'build/joint.browserify-bundle.js': 'build/joint.min.js'
        },
        options: {
            browserifyOptions: {
                standalone: 'joint'
            }
        }
    }
};
