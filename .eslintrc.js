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
    },
    'env': {
        'browser': true,
        'node': true
    },
    'globals': {
        'joint': true,
        'V': true,
        'g': true,
        '$': true,
        'Backbone': true,
        'Uint8Array': true
    }
};
