module.exports = {
    'extends': 'eslint:recommended',
    'rules': {
        'indent': ['error', 4, { 'SwitchCase': 1 }],
        'space-before-function-paren': ['error', 'never'],
        'no-console': ['error', { 'allow': ['warn'] }],
        'object-curly-spacing': ['error', 'always', { 'objectsInObjects': false }],
        'no-constant-condition': ['off'],
        'no-undef': ['error'],
        'no-unused-vars': ['error', { 'vars': 'local', 'args': 'none' }],
        'quotes': ['error', 'single'],
        'semi': ['error', 'always'],
        'no-prototype-builtins': ['off']
    },
    'env': {
        'browser': true,
        'node': true,
        'es6': true
    },
    'globals': {
        'Uint8Array': true,
        'CDATASection': true
    },
    'parserOptions': {
        'ecmaVersion': 2022,
        'sourceType': 'module'
    }
};
