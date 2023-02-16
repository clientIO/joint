function createEverything(selector, modulus, callback) {

    var graph = new joint.dia.Graph;
    var addCell = callback.bind(null, graph);

    var paper = new joint.dia.Paper({
        el: document.getElementById(selector),
        width: 900,
        height: 350,
        gridSize: 1,
        model: graph,
        async: true,
        defaultLink: function() {
            return new joint.shapes.standard.Link();
        }
    });

    var rectangle = new joint.shapes.standard.Rectangle({
        position: { x: 100, y: 50 },
        size: { width: 70, height: 30 },
        attrs: {
            body: { fill: 'lightgray' },
            label: { text: selector, magnet: true }
        }
    });

    for (var i = 0; i < 6; i++) {

        var r1 = rectangle.clone();
        r1.translate(i * 100, i * 10);
        addCell(r1);

        var r2 = r1.clone();
        r2.translate(0, 200);
        addCell(r2);

        var connectionLink = new joint.shapes.standard.Link({
            source: { id: r1.id },
            target: { id: r2.id }
        });

        if (i % modulus === 0) {
            connectionLink.set('connector', { name: 'jumpover', args: { 'jump': 'gap' }});
            connectionLink.attr('line/stroke', 'red');
        }

        addCell(connectionLink);
    }

    var crossRectA = rectangle.clone().position(0, 100);
    addCell(crossRectA);

    var crossRectB = rectangle.clone().position(0, 200);
    addCell(crossRectB);

    var crossLink = new joint.shapes.standard.Link({
        source: { id: crossRectA.id },
        target: { id: crossRectB.id },
        connector: { name: 'jumpover' },
        attrs: {
            line: {
                stroke: 'red'
            }
        },
        vertices: [
            { x: 700, y: 190 },
            { x: 700, y: 280 }
        ]
    });

    addCell(crossLink);

    return paper;
}

window.paper1 = createEverything('paper1', 2, function(graph, cell) {
    graph.addCell(cell);
});

var cellsToReset = [];
var graph2 = null;
window.paper2 = createEverything('paper2', 3, function(graph, cell) {
    graph2 = graph;
    cellsToReset.push(cell);
});

graph2.resetCells(cellsToReset);
// TMP FIX
graph2.getLinks().forEach(function(link) {
    link.findView(window.paper2).update();
});
