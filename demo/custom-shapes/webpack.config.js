const path = require('path');

module.exports = [{
    entry: './src/custom-shapes.mjs',
    mode: 'development',
    target: 'web',
    output: {
        filename: 'custom-shapes-bundle.js',
        path: path.resolve(__dirname, 'dist'),
        publicPath: '/dist/'
    },
    resolve: {
        extensions: ['.js', '.mjs'],
        alias: {
            'underscore': 'lodash'
        }
    },
    devServer: {
        static: {
            directory: __dirname,
        },
        compress: true
    },
}];
