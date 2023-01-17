module.exports = {
    e2e: {
        src: [
            '../../e2e/*.js'
        ],
        options: {
            reporter: 'spec',
            timeout: 180000,
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
