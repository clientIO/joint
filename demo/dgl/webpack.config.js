var CopyPlugin = require('copy-webpack-plugin');
var path = process.cwd() + '/dist';

module.exports = {
    entry: './index.js',
    mode: 'development',
    target: 'web',
    output: {
        path: path,
        filename: 'bundle.js'
    },
    resolve: {
        extensions: ['.js', '.mjs'],
        alias: {
            'underscore': 'lodash'
        }
    },
    devtool: 'source-map',
    devServer: {
        watchFiles: ['*'],
        hot: true,
        port: process.env.PORT || 8080,
        host: process.env.HOST || 'localhost'
    },
    module: {
        rules: [
            {
                test: /\.css$/i,
                use: ['style-loader', 'css-loader'],
            },
            {
                test: /\.s[ac]ss$/i,
                use: [
                    {
                        loader: 'file-loader',
                        options: { outputPath: 'css/', name: '[name].css' }
                    },
                    'sass-loader'
                ]
            },
            {
                test: /\.m?js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env']
                    }
                }
            }
        ]
    },
    plugins: [
        new CopyPlugin([
            { from: './index.html', to: './' }
        ])
    ]
};
