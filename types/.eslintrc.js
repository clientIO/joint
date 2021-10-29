module.exports = {
    'extends': ['../.eslintrc.js'],
    'parser': '@typescript-eslint/parser',
    'plugins': ['@typescript-eslint'],
    'globals': {
        'joint': true,
        'V': true,
        'g': true,
        '$': true,
        'Backbone': true,
        '_': true,
        'QUnit': true,
        'sinon': true,
        'blanket': true,
        'simulate': true
    },
    'rules': {
        '@typescript-eslint/type-annotation-spacing': ['error', { 'after': true }],
    },
};
