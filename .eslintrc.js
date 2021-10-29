
module.exports = {
    'root': true,
    'parser': '@typescript-eslint/parser',
    'plugins': [
        '@typescript-eslint',
    ],
    'extends': [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended'
    ],
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
        '@typescript-eslint/type-annotation-spacing': ['error', { 'after': true }]
    },
    'env': {
        'browser': true,
        'node': true
    },
    'globals': {
        'Uint8Array': true,
        'CDATASection': true
    },
    'parserOptions': {
        'ecmaVersion': 6,
        sourceType: 'module'
    }
};
