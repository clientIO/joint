(function graphAndPaper() {

    var graph = new joint.dia.Graph;

    var paper = new joint.dia.Paper({
        el: document.getElementById('paper-graph-and-paper'),
        model: graph,
        width: 600,
        height: 100,
        gridSize: 10,
        drawGrid: true,
        background: {
            color: 'rgba(0, 255, 0, 0.3)'
        }
    });

    var rect = new joint.shapes.standard.Rectangle();
    rect.position(100, 30);
    rect.resize(100, 30);
    rect.attr({
        body: {
            fill: 'blue'
        },
        label: {
            text: 'Hello',
            style: {
                fill: 'white'
            }
        }
    });

    var rect2 = rect.clone();
    rect2.translate(300, 0);
    rect2.attr('label/text', 'World!');

    var link = new joint.shapes.standard.Link();
    link.source({ id: rect.id });
    link.target({ id: rect2.id });

    graph.addCells([rect, rect2, link]);

    graph.on('all', function(eventName, cell) {
        console.log(arguments);
    });
}());
