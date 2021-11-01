module.exports = {
    'extends': [
        '../.eslintrc.js',
        'plugin:@typescript-eslint/recommended'
    ],
    'globals': {
        'joint': true,
        'V': true,
        'g': true,
        '$': true,
        'Backbone': true,
        '_': true,
        'JQuery': true
    },
    'plugins': [
        '@typescript-eslint',
    ],
    'parser': '@typescript-eslint/parser',
    'rules': {
        '@typescript-eslint/type-annotation-spacing': ['error', { 'after': true }]
    },
    'overrides': [{
        'files': ['./**/*'],
        'rules': {
            'no-unused-vars': 'off',
            'no-dupe-class-members': 'off',
            'no-var': 'off',
            '@typescript-eslint/no-empty-interface': 'off',
            '@typescript-eslint/ban-types': 'off',
            '@typescript-eslint/no-unused-vars': 'off',
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/triple-slash-reference': 'off'
        }
    }]
};
