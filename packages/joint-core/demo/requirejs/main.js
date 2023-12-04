require.config({
    baseUrl: '../../',
});

require(['build/joint'], function(joint) {

    var div = document.createElement('div');
    document.body.appendChild(div);

    var graph = new joint.dia.Graph({}, { namespace: joint.shapes });

    new joint.dia.Paper({
        el: div,
        width: 600,
        height: 400,
        model: graph
    });

    var rect = new joint.shapes.standard.Rectangle({
        position: { x: 50, y: 50 },
        size: { width: 100, height: 100 }
    });

    graph.addCell(rect);
});
