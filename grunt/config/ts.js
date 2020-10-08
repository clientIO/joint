module.exports = {
    test: {
        src: ['test/ts/*.ts'],
        options: {
            noImplicitAny: true,
            forceConsistentCasingInFileNames: true,
            noImplicitReturns: true,
            noImplicitThis: true,
            strictNullChecks: false,
            suppressImplicitAnyIndexErrors: true,
            noUnusedLocals: true
        }
    }
};
