module.exports = {
    'extends': [
        '../.eslintrc.js',
    ],
    'parserOptions': {
        'ecmaVersion': '2022'
    },
    'globals': {
        'joint': true,
        'g': true,
        'V': true,
        '$': true,
        'Backbone': true,
        'Vue': true,
        'd3': true
    },
    'ignorePatterns': ['/ts-demo/vendor/**'],
    'overrides': [{
        'files': [
            'rough/src/rough.js',
            'ports/port-z-index.js',
            'ports/port-layouts-defaults.js',
            'expand/expand.paper.js',
            'chess/src/garbochess.js',
            'vuejs/demo.js',
            'petri-nets/src/pn.js',
            'org/src/org.js',
            'custom-router.js',
            'archive/links.js',
            'embedding/nested-clone.js',
            'expand/index.js',
            'expand/shapes.js',
            'vectorizer/vectorizer.js'
        ],
        // Globals contained in HTML script, etc
        'globals': {
            'rough': true,
            'createPaper': true,
            'paper': true
        },
        'rules': {
            // Exceptions currently used in demo directory
            'no-redeclare': ['off'],
            'no-unused-vars': ['off'],
            'no-console': ['off']
        }
    }]
};

