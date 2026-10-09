const path = require('path');

module.exports = {
    resolve: {
        extensions: ['.ts', '.tsx', '.js'],
    },
    entry: './src/index.ts',
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist'),
        // Resolved from the bundle's own URL - the ELK worker is a file of its own,
        // loaded from next to it wherever the demo is served.
        publicPath: 'auto',
    },
    mode: 'development',
    module: {
        rules: [
            {
                test: /\.m?js$/,
                resolve: {
                    fullySpecified: false,
                },
            },
            { test: /\.ts$/, loader: 'ts-loader' },
            {
                test: /\.s[ac]ss$/i,
                use: [
                    'style-loader',
                    'css-loader',
                    'sass-loader',
                ],
            },
        ],
    },
    devServer: {
        static: {
            directory: __dirname,
        },
        devMiddleware: {
            publicPath: '/dist/',
        },
        compress: true,
    },
};
