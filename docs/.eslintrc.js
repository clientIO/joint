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
            'demo/dia/Element/js/portZIndex.js',
            'demo/layout/DirectedGraph/js/clusters.js',
            'demo/layout/DirectedGraph/js/index.js',
            'demo/layout/Port/js/port.js',
            'demo/layout/Port/js/portRotationComp.js',
            'demo/layout/PortLabel/js/portLabel.js',
            'demo/shapes/shapes.devs.js'
        ],
        // Globals contained in HTML script, etc
        'globals': {
            'createPaper': true,
        },
        'rules': {
            // Exceptions currently used in docs directory
            'no-redeclare': ['off'],
            'no-unused-vars': ['off'],
            'no-console': ['off']
        }
    }]
};
