module.exports = {
    'plugins': [
        '@typescript-eslint',
    ],
    'parser': '@typescript-eslint/parser',
    'rules': {
        '@typescript-eslint/type-annotation-spacing': ['error', { 'after': true }]
    },
    'globals': {
        'joint': true,
        'Vectorizer': true,
        'g': true,
        '$': true,
        'Backbone': true,
        '_': true,
        'JQuery': true
    },
    'overrides': [{
        'files': [ './*'],
        'rules': {
            'no-unused-vars': 'off',
            'no-dupe-class-members': 'off',
            'no-redeclare': 'off'
        }
    }]
};
