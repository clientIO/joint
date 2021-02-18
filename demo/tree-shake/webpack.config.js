const path = process.cwd() + '/dist';

module.exports = {
    entry: './index.S.ts',
    mode: 'development',
    output: {
        path,
        filename: 'bundle.js'
    },
    resolve: {
        extensions: ['.ts', '.js'],
        alias: {
            'underscore': 'lodash'
        }
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: [{ loader: 'ts-loader', options: { allowTsInNodeModules: true }}]
            }
        ]
    }
};
