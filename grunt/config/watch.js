module.exports = function(grunt) {

    const watchOptions = process.platform === 'win32' ? {
        spawn: false,
        interval: 1500
    } : {};

    return {
        docs: {
            files: [
                'docs/**/*'
            ],
            options: watchOptions,
            tasks: ['build:docs']
        },
        joint: {
            files: [
                './plugins/**/*.js',
                './src/**/*.js'
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
