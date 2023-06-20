const path = require('path');

module.exports = {
    resolve: {
        extensions: ['.ts', '.tsx', '.js']
    },
    entry: './src/index.ts',
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist'),
        publicPath: '/dist/'
    },
    mode: 'development',
    module: {
        rules: [
            { test: /\.ts?$/, loader: 'ts-loader' },
            // `sideEffects: true` = prevent tree-shaking to import css
            // https://webpack.js.org/guides/tree-shaking/#mark-the-file-as-side-effect-free
            { test: /\.css$/, sideEffects: true, use: ['style-loader', 'css-loader'] }
        ]
    },
    devServer: {
        static: {
            directory: __dirname,
        },
        compress: true
    },
};
