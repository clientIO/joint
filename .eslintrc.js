module.exports = {
    'extends': 'eslint:recommended',
    'rules': {
        'indent': ['error', 4, { 'SwitchCase': 1 }],
        'space-before-function-paren': ['error', 'never'],
        'no-console': ['error', { 'allow': ['warn'] }],
        'no-constant-condition': 0,
        'no-undef': 2,
        'no-unused-vars': ['error', { 'vars': 'local', 'args': 'none' }]
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
