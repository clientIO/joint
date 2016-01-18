require.config({
    baseUrl: '../../',
    paths: {
        // Dependencies for Joint:
        'jquery': 'lib/jquery/jquery',
        'backbone': 'lib/backbone/backbone',
        'lodash': 'lib/lodash/lodash'
    },
    map: {
        '*': {
            // Backbone requires underscore. This forces requireJS to load lodash instead:
            'underscore': 'lodash'
        }
    }
});

require(['jquery', 'dist/joint'], function($, joint) {

    var $paper = $('<div/>').appendTo($('#app'));

    var graph = new joint.dia.Graph;
    var paper = new joint.dia.Paper({
        el: $paper,
        width: 600,
        height: 400,
        model: graph
    });

    var rect = new joint.shapes.basic.Rect({
        position: { x: 50, y: 50 },
        size: { width: 100, height: 100 }
    });

    graph.addCell(rect);
});
