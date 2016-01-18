function createEverything(selector, modulus, callback) {
    var graph = new joint.dia.Graph;
    var addCell = callback.bind(null, graph);

    var paper = new joint.dia.Paper({
        el: $(selector),
        width: 900,
        height: 350,
        gridSize: 1,
        model: graph
    });


    var rectangle = new joint.shapes.basic.Rect({
        position: { x: 100, y: 50 },
        size: { width: 70, height: 30 },
        attrs: {
            rect: { fill: 'orange' },
            text: { text: selector, magnet: true }
        }
    });

    for (var i = 0; i < 6; i++) {
        var r1 = rectangle.clone();
        r1.translate(i * 100, i * 10);
        addCell(r1);

        var r2 = r1.clone();
        r2.translate(0, 200);
        addCell(r2);

        var connectionLink = new joint.dia.Link({
            source: { id: r1.id },
            target: { id: r2.id }
        });

        if (i % modulus === 0) {
            connectionLink.set('connector', { name: 'jumpover', args: { 'jump': 'gap' }});
            connectionLink.attr('.connection/stroke', 'red');
        }

        addCell(connectionLink);
    }

    var crossRectA = rectangle.clone().set({ 'position': { x: 0, y: 100 }});
    addCell(crossRectA);

    var crossRectB = rectangle.clone().set({ 'position': { x: 0, y: 200 }});
    addCell(crossRectB);

    var crossLink = new joint.dia.Link({
        source: { id: crossRectA.id },
        target: { id: crossRectB.id },
        connector: { name: 'jumpover' },
        vertices: [
            { x: 700, y: 190 },
            { x: 700, y: 280 }
        ]
    });
    crossLink.attr('.connection/stroke', 'red');

    addCell(crossLink);

    return paper;
}

window.paper1 = createEverything('#paper1', 2, function(graph, cell) {
    graph.addCell(cell);
});

var cellsToReset = [];
var graph2 = null;
window.paper2 = createEverything('#paper2', 3, function(graph, cell) {
    graph2 = graph;
    cellsToReset.push(cell);
});

graph2.resetCells(cellsToReset);
