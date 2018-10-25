const path = require('path');

module.exports = {
    entry: './index.ts',
    mode: 'development',
    output: {
        filename: 'bundle.js'
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js'],
        alias: {
            joint: path.resolve(__dirname, 'vendor/joint.js')
        }
    },
    module: {
        rules: [
            { test: /\.ts$/, use: 'ts-loader' }
        ]
    }
};
