const path = require('path');

module.exports = {
    resolve: {
        extensions: ['.js']
    },
    entry: './src/index.js',
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist'),
        publicPath: '/dist/'
    },
    mode: 'development',
    module: {
        rules: [
            {
                test: /\.css$/,
                sideEffects: true,
                use: ['style-loader', 'css-loader'],
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
