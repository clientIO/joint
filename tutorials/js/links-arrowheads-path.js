(function linksArrowheadsPath() {

    var graph = new joint.dia.Graph;

    var paper = new joint.dia.Paper({
        el: document.getElementById('paper-links-arrowheads-path'),
        model: graph,
        width: 600,
        height: 100,
        gridSize: 10,
        drawGrid: true,
        background: {
            color: 'rgba(0, 255, 0, 0.3)'
        }
    });

    var link = new joint.shapes.standard.Link();
    link.source(new g.Point(100, 50));
    link.target(new g.Point(500, 50));
    link.attr({
        line: {
            sourceMarker: {
                'type': 'path',
                'd': 'M 20 -10 0 0 20 10 Z'
            },
            targetMarker: {
                'type': 'path',
                'stroke': 'green',
                'stroke-width': 2,
                'fill': 'yellow',
                'd': 'M 20 -10 0 0 20 10 Z'
            }
        }
    });
    link.addTo(graph);
}());
