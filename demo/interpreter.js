var graph = new joint.dia.Graph;
var paper = new joint.dia.Paper({
    el: document.getElementById('paper'),
    width: 850,
    height: 600,
    model: graph,
    gridSize: 1
});

var a = new joint.shapes.standard.Rectangle({
    position: { x: 50, y: 50 },
    size: { width: 100, height: 40 },
    attrs: { label: { text: 'A' }}
});
var b = new joint.shapes.standard.Rectangle({
    position: { x: 250, y: 50 },
    size: { width: 100, height: 40 },
    attrs: { label: { text: 'B' }}
});
var c = new joint.shapes.standard.Rectangle({
    position: { x: 350, y: 150 },
    size: { width: 100, height: 40 },
    attrs: { text: { text: 'C' }}
});

var l1 = new joint.shapes.standard.Link({
    source: { id: a.id },
    target: { id: b.id }
});
var l2 = new joint.shapes.standard.Link({
    source: { id: b.id },
    target: { id: c.id }
});

graph.addCells([a, b, c, l1, l2]);

// Trigger signaling on element click.
paper.on('element:pointerdown', function(elementView) {
    var element = elementView.model;
    element.trigger('signal', element);
});


// Signaling.
// ----------

graph.on('signal', function(cell) {

    if (cell.isLink()) {

        var targetCell = graph.getCell(cell.get('target').id);

        var token = V('circle', { r: 7, fill: 'green' });
        cell.findView(paper).sendToken(token, 1000, function() {
	        targetCell.trigger('signal', targetCell);
        });

    } else {

        flash(cell);
        var outboundLinks = graph.getConnectedLinks(cell, { outbound: true });
        outboundLinks.forEach(function(link) {
            link.trigger('signal', link);
        });
    }
});

function flash(cell) {

    var cellView = paper.findViewByModel(cell);
    cellView.highlight();
    setTimeout(function() {
        cellView.unhighlight();
    }, 200);
}
