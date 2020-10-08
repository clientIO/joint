module.exports = {
    joint: {
        src: [
            'src/**/*.js',
            'src/**/*.mjs'
        ],
        options: {
            configFile: '.eslintrc.js'
        }
    },
    test: {
        src: [
            'test/**/*.js',
            '!test/ts/*.js',
            '!test/**/lodash3/**'
        ],
        options: {
            configFile: 'test/.eslintrc.js'
        }
    }
};

