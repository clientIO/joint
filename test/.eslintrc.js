module.exports = {
    'extends': [
        '../.eslintrc.js',
    ],
    'plugins': [
        '@typescript-eslint',
    ],
    'parser': '@typescript-eslint/parser',
    'env': {
        'mocha': true
    },
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
        'simulate': true,
        'fixtures': true,
    },
    'overrides': [{
        'files': ['ts/*.ts'],
        'extends': [
            'plugin:@typescript-eslint/recommended'
        ],
        'rules': {
            // Exceptions currently used test/ts
            'prefer-const': 'off',
            'no-unused-vars': 'off',
            '@typescript-eslint/no-unused-vars': 'off'
        }
    }]
};
