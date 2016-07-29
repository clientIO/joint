module.exports = {
    'extends': 'eslint:recommended',
    'rules': {
        'indent': ['error', 4, { 'SwitchCase': 1 }],
        'no-console': 0,
        'no-constant-condition': 0,
        'no-undef': 0,
        'no-unused-vars': ['error', { 'vars': 'local', 'args': 'none' }]
    }
};