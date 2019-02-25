import commonjs from 'rollup-plugin-commonjs';
import babel from 'rollup-plugin-babel';
import path from 'path';

export default [
    {
        input: './src/geometry.js',
        output: [{
            file: './build/iife/geometry.js',
            format: 'iife',
            name: 'g',
            freeze: false
        }],
        plugins: [
            babel({
                exclude: 'node_modules/**'
            }),
            commonjs()
        ]
    }
]
