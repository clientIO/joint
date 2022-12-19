module.exports = {
    e2e: {
        src: [
            'test/e2e/*.js'
        ],
        options: {
            reporter: 'spec',
            timeout: 120000,
            clearRequireCache: true
        }
    },
    server: {
        src: [
            'test/*-nodejs/*'
        ],
        options: {
            reporter: 'spec'
        }
    }
};
