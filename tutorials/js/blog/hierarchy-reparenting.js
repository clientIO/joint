(function() {

var graph = new joint.dia.Graph;
var paper = new joint.dia.Paper({ el: $('#paper-reparenting'), width: 650, height: 250, gridSize: 1, model: graph });

var r1 = new joint.shapes.basic.Rect({
    position: { x: 20, y: 20 },
    size: { width: 200, height: 200 },
    attrs: { rect: { fill: '#E74C3C' }, text: { text: 'El A' } }
});
var r2 = new joint.shapes.basic.Rect({
    position: { x: 270, y: 30 },
    size: { width: 100, height: 80 },
    attrs: { rect: { fill: '#F1C40F' }, text: { text: 'El B' } }
});

graph.addCells([r1, r2]);
    
// First, unembed the cell that has just been grabbed by the user.
paper.on('cell:pointerdown', function(cellView, evt, x, y) {
    
    var cell = cellView.model;

    if (!cell.get('embeds') || cell.get('embeds').length === 0) {
        // Show the dragged element above all the other cells (except when the
        // element is a parent).
        cell.toFront();
    }
    
    if (cell.get('parent')) {
        graph.getCell(cell.get('parent')).unembed(cell);
    }
});

// When the dragged cell is dropped over another cell, let it become a child of the
// element below.
paper.on('cell:pointerup', function(cellView, evt, x, y) {

    var cell = cellView.model;
    var cellViewsBelow = paper.findViewsFromPoint(cell.getBBox().center());

    if (cellViewsBelow.length) {
        // Note that the findViewsFromPoint() returns the view for the `cell` itself.
        var cellViewBelow = _.find(cellViewsBelow, function(c) { return c.model.id !== cell.id });
    
        // Prevent recursive embedding.
        if (cellViewBelow && cellViewBelow.model.get('parent') !== cell.id) {
            cellViewBelow.model.embed(cell);
        }
    }
});
    
}());