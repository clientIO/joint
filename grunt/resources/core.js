module.exports = {

    js: [
        'build/iife/core.js',
        'plugins/shapes/joint.shapes.basic.js',
        'plugins/shapes/joint.shapes.standard.js',
        'plugins/routers/*.js',
        'plugins/connectors/joint.connectors.normal.js',
        'plugins/connectors/joint.connectors.rounded.js',
        'plugins/connectors/joint.connectors.smooth.js',
        'plugins/connectors/joint.connectors.jumpover.js',
        'plugins/layout/ports/*.js',
        'plugins/highlighters/*.js',
        'plugins/anchors/*.js',
        'plugins/connectionPoints/*.js',
        'plugins/connectionStrategies/*.js',
        'plugins/tools/*.js'
    ],

    css: [
        'css/layout.css',
        'css/themes/*.css'
    ]
};
