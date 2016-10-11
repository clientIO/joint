(function() {

var graph = new joint.dia.Graph;
var paper = new joint.dia.Paper({ el: $('#paper-parent-restriction'), width: 650, height: 250, gridSize: 1, model: graph });

var r1 = new joint.shapes.basic.Rect({
    position: { x: 20, y: 20 },
    size: { width: 200, height: 200 },
    attrs: { rect: { fill: '#E74C3C' }, text: { text: 'Parent' } }
});
var r2 = new joint.shapes.basic.Rect({
    position: { x: 70, y: 30 },
    size: { width: 100, height: 80 },
    attrs: { rect: { fill: '#F1C40F' }, text: { text: 'Child' } }
});

r1.embed(r2);
graph.addCells([r1, r2]);

graph.on('change:position', function(cell) {

    var parentId = cell.get('parent');
    if (!parentId) return;

    var parent = graph.getCell(parentId);
    var parentBbox = parent.getBBox();
    var cellBbox = cell.getBBox();

    if (parentBbox.containsPoint(cellBbox.origin()) &&
        parentBbox.containsPoint(cellBbox.topRight()) &&
        parentBbox.containsPoint(cellBbox.corner()) &&
        parentBbox.containsPoint(cellBbox.bottomLeft())) {

        // All the four corners of the child are inside
        // the parent area.
        return;
    }

    // Revert the child position.
    cell.set('position', cell.previous('position'));
});

}());