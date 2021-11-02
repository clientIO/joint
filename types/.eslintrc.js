module.exports = {
    'extends': [
        '../.eslintrc.js',
        'plugin:@typescript-eslint/recommended'
    ],
    'plugins': [
        '@typescript-eslint',
    ],
    'parser': '@typescript-eslint/parser',
    'rules': {
        // note you must disable the base rule as it can report incorrect errors
        'comma-spacing': 'off',
        '@typescript-eslint/comma-spacing': ['error'],
        'space-before-function-paren': 'off',
        '@typescript-eslint/space-before-function-paren': ['error', 'never'],
        'semi': 'off',
        '@typescript-eslint/semi': ['error', 'always'],
        'object-curly-spacing': 'off',
        '@typescript-eslint/object-curly-spacing': ['error', 'always', { 'objectsInObjects': false }],
        // no equivalent rule
        'semi-spacing': ['error', { 'before': false, 'after': true }],
        'space-in-parens': ['error', 'never'],
        '@typescript-eslint/type-annotation-spacing': ['error', { 'after': true }],
        '@typescript-eslint/member-delimiter-style': [
            'error',
            {
                'multilineDetection': 'brackets',
                'overrides': {
                    'interface': {
                        'multiline': {
                            'delimiter': 'semi',
                            'requireLast': true
                        },
                        'singleline': {
                            'delimiter': 'semi',
                            'requireLast': true
                        },
                    },
                    'typeLiteral': {
                        'multiline': {
                            'delimiter': 'semi',
                            'requireLast': true
                        },
                        'singleline': {
                            'delimiter': 'comma',
                            'requireLast': false
                        },
                    }
                }
            }
        ]
    },
    'overrides': [{
        'files': ['./**/*'],
        'rules': {
            // Exceptions currently used in our declaration files
            'no-var': 'off',
            '@typescript-eslint/no-empty-interface': 'off',
            '@typescript-eslint/ban-types': 'off',
            '@typescript-eslint/no-unused-vars': 'off',
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/triple-slash-reference': 'off'
        }
    }]
};
