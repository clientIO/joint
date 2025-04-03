const path = require('path');

module.exports = {
    resolve: {
        extensions: ['.ts', '.js']
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
            {
                test: /\.m?js/
            },
            { test: /\.ts$/, loader: 'ts-loader' },
            {
                test: /\.css$/,
                sideEffects: true,
                use: [
                    'style-loader',
                    'css-loader'
                ]
            }
        ]
    },
    devServer: {
        static: {
            directory: __dirname,
        },
        compress: true
    },
};
