module.exports = {
    'extends': '../.eslintrc.js',
    'rules': {
        'indent': 0,//['error', 4, { 'SwitchCase': 1 }],
        'space-before-function-paren': 0,//['warn', 'never'],
        'no-unused-vars': ['error', { 'vars': 'local', 'args': 'none' }]
    },
    'globals': {
        '_': true,
        'QUnit': true,
        'sinon': true,
        'blanket': true,
        'it': true,
        'describe': true,
        'before': true,
        'after': true,
        'simulate': true
    }
};
