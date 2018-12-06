module.exports = {

    js: [
        'src/core.js',
        'src/joint.mvc.view.js',
        'src/joint.dia.graph.js',
        'src/joint.dia.attributes.js',
        'src/joint.dia.tools.js',
        'src/joint.dia.cell.js',
        'src/joint.dia.element.js',
        'src/joint.dia.link.js',
        'src/joint.dia.paper.js',
        'src/ports.js',
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
