const path = require('path');

module.exports = {
    joint: {
        entry: './build/joint.min.js',
        mode: 'production',
        output: {
            path: path.join(process.cwd(), 'build'),
            filename: 'joint.webpack-bundle.js',
            library: 'joint'
        },
        resolve: {
            alias: {
                underscore: 'lodash',
                g: './geometry.min.js',
                V: './vectorizer.min.js'
            }
        },
        performance: {
            maxAssetSize: 700000,
            maxEntrypointSize: 700000
        }
    }
};

