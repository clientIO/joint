module.exports = {
    'test': {
        tsconfig: {
            tsconfig: 'test/ts/tsconfig.json',
            passThrough: true
        }
    },
    'test-exports': {
        tsconfig: {
            tsconfig: 'test/ts-exports/tsconfig.json',
            passThrough: true
        }
    }
};
