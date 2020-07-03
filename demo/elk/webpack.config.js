var CopyPlugin = require('copy-webpack-plugin');
var path = process.cwd() + '/dist';

module.exports = {
    entry: './index.js',
    mode: 'development',
    output: {
        path: path,
        filename: 'bundle.js'
    },
    resolve: {
        extensions: ['.js']
    },
    devtool: 'source-map',
    watch: true,
    devServer: {
        contentBase: path,
        watchContentBase: true,
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
            }
        ]
    },
    plugins: [
        new CopyPlugin([
            { from: './index.html', to: './' }
        ])
    ]
};
