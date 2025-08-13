const CopyPlugin = require('copy-webpack-plugin');
const path = process.cwd() + '/dist';
const folder = process.env.USE_WEB_WORKERS ? 'web-worker' : 'ui-thread';

module.exports = {
    entry: `./src/${folder}/index.js`,
    mode: 'development',
    target: 'web',
    output: {
        path: path,
        filename: 'bundle.js',
    },
    resolve: {
        extensions: ['.js'],
    },
    devtool: 'source-map',
    devServer: {
        watchFiles: ['*'],
        hot: true,
        port: process.env.PORT || 8080,
        host: process.env.HOST || 'localhost',
        open: {
            target: ['index.html'],
        }
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
                        options: { outputPath: 'css/', name: '[name].css' },
                    },
                    'sass-loader',
                ],
            }
        ]
    },
    plugins: [
        new CopyPlugin([
            { from: './index.html', to: './' },
            { from: './node_modules/libavoid-js/dist/libavoid.wasm', to: './' },
        ]),
    ],
};
