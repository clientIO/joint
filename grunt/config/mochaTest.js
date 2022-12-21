module.exports = {
    e2e: {
        src: [
            'e2e/*.js'
        ],
        options: {
            reporter: 'spec',
            timeout: 180000,
            clearRequireCache: true
        }
    },
    server: {
        src: [
            'packages/core/test/*-nodejs/*'
        ],
        options: {
            reporter: 'spec'
        }
    }
};
