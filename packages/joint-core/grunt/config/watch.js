module.exports = function(grunt) {

    const watchOptions = process.platform === 'win32' ? {
        spawn: false,
        interval: 1500
    } : {};

    return {
        joint: {
            files: [
                './plugins/**/*.js',
                './plugins/**/*.mjs',
                './src/**/*.js',
                './src/**/*.mjs',
            ],
            options: watchOptions,
            tasks: ['build']
        },
        types: {
            options: watchOptions,
            files: [
                'types/**/*'
            ],
            tasks: ['newer:concat:types']
        }
    };
};
