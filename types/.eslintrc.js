module.exports = {
    'root': true,
    'plugins': [
        '@typescript-eslint',
    ],
    'parser': '@typescript-eslint/parser',
    'extends': [],
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
        '@typescript-eslint/type-annotation-spacing': ['error', { 'after': true }]
    }
};
