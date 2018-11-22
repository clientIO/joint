module.exports = {

    js: {
        core: [
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

        geometry: [
            'src/geometry.js'
        ],

        vectorizer: [
            'src/vectorizer.js'
        ],

        polyfills: [
            'plugins/polyfills/base64.js',
            'plugins/polyfills/typedArray.js',
            'plugins/polyfills/xhrResponse.js',
            'plugins/polyfills/array.js',
            'plugins/polyfills/string.js',
            'plugins/polyfills/number.js'
        ],

        plugins: {
            'shapes.erd': ['plugins/shapes/joint.shapes.erd.js'],
            'shapes.fsa': ['plugins/shapes/joint.shapes.fsa.js'],
            'shapes.org': ['plugins/shapes/joint.shapes.org.js'],
            'shapes.chess': ['plugins/shapes/joint.shapes.chess.js'],
            'shapes.pn': ['plugins/shapes/joint.shapes.pn.js'],
            'shapes.devs': ['plugins/shapes/joint.shapes.devs.js'],
            'shapes.uml': ['plugins/shapes/joint.shapes.uml.js'],
            'shapes.logic': ['plugins/shapes/joint.shapes.logic.js'],
            'layout.DirectedGraph': ['plugins/layout/DirectedGraph/joint.layout.DirectedGraph.js']
        },

        dependecies: [
            'node_modules/jquery/dist/jquery.js',
            'node_modules/lodash/lodash.js',
            'node_modules/backbone/backbone.js',
            'node_modules/graphlib/dist/graphlib.core.js',
            'node_modules/dagre/dist/dagre.core.js',
        ]
    },

    css: {
        core: [
            'css/layout.css',
            'css/themes/*.css'
        ],

        plugins: {}
    }
};
