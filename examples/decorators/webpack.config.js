const path = require('path');

module.exports = {
    resolve: {
        extensions: ['.ts', '.tsx', '.js']
    },
    devtool: 'inline-source-map',
    entry: './src/index.ts',
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist'),
        publicPath: '/dist/'
    },
    mode: 'development',
    module: {
        rules: [
            { test: /\.ts?$/, loader: 'ts-loader' }
        ]
    },
    devServer: {
        static: {
            directory: __dirname,
        },
        compress: true
    },
};
