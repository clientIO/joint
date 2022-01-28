module.exports = {
    'extends': [
        '../.eslintrc.js',
    ],
    'globals': {
        'joint': true,
        'g': true,
        'V': true,
        '$': true,
        '_': true
    },
    'overrides': [{
        'files': [
            'js/pipes.js'
        ],
        'rules': {
            // Exceptions currently used in tutorial directory
            'no-unused-vars': ['off']
        }
    }],
    'parserOptions': {
        'ecmaVersion': 'latest',
        'sourceType': 'module'
    }
};
