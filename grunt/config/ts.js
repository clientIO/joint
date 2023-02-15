module.exports = {
    test: {
        src: ['test/ts/*.ts'],
        options: {
            strict: true,
            pretty: true,
            forceConsistentCasingInFileNames: true,
            noImplicitReturns: true,
            suppressImplicitAnyIndexErrors: true,
            noUnusedLocals: false,
            /* 
                'strict' is shorthand for the following options:
                    noImplicitAny: true,
                    noImplicitThis: true,
                    alwaysStrict: true,
                    strictBindCallApply: true,
                    strictNullChecks: true,
                    strictFunctionTypes: true,
                    strictPropertyInitialization: true,
                    useUnknownInCatchVariables: true,
            */    
        }
    }
};
