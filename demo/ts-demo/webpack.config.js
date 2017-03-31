module.exports = {
    entry: './index.ts',
    output: {
        filename: 'build/bundle.js'
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js']
    },
    module: {
        loaders: [
            {
                test: /\.tsx?$/,
                loader: 'ts-loader',
                options: {
                }
            }
        ]
    }
};
