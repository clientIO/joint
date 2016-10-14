var graph = new joint.dia.Graph;
var paper = new joint.dia.Paper({ el: $('#paper-vertices'), width: 650, height: 400, gridSize: 1, model: graph });

var r1 = new joint.shapes.basic.Rect({
    position: { x: 20, y: 100 },
    size: { width: 100, height: 40 },
    attrs: { rect: { rx: 2, ry: 2, fill: '#2ECC71', stroke: '#27AE60', 'stroke-width': 2 }},
});
var r2 = r1.clone().translate(200, 100);
var r3 = r1.clone().translate(100, 200);

var l1 = new joint.dia.Link({
    source: { id: r1.id },
    target: { id: r2.id },
    attrs: { '.connection': { 'stroke-width': 3, stroke: '#222' }, '.marker-vertices': { display: 'none' }},
    smooth: true, // We'are using a bezier curve
    z: -1 // The links are always lying under the elements.
});
var l2 = l1.clone();
var l3 = l1.clone();
var l4 = l1.clone();
var l5 = l1.clone();

function adjustVertices(graph, cell) {

    // If the cell is a view, find its model.
    cell = cell.model || cell;

    if (cell instanceof joint.dia.Element) {

        _.chain(graph.getConnectedLinks(cell)).groupBy(function(link) {
            // the key of the group is the model id of the link's source or target, but not our cell id.
            return _.omit([link.get('source').id, link.get('target').id], cell.id)[0];
        }).each(function(group, key) {
            // If the member of the group has both source and target model adjust vertices.
            if (key !== 'undefined') adjustVertices(graph, _.first(group));
        }).value();

        return;
    }

    // The cell is a link. Let's find its source and target models.
    var srcId = cell.get('source').id || cell.previous('source').id;
    var trgId = cell.get('target').id || cell.previous('target').id;

    // If one of the ends is not a model, the link has no siblings.
    if (!srcId || !trgId) return;

    var siblings = _.filter(graph.getLinks(), function(sibling) {

        var _srcId = sibling.get('source').id;
        var _trgId = sibling.get('target').id;

        return (_srcId === srcId && _trgId === trgId) || (_srcId === trgId && _trgId === srcId);
    });

    switch (siblings.length) {

    case 0:
        // The link was removed and had no siblings.
        break;

    case 1:
        // There is only one link between the source and target. No vertices needed.
        cell.unset('vertices');
        break;

    default:

        // There is more than one siblings. We need to create vertices.

        // First of all we'll find the middle point of the link.
        var srcCenter = graph.getCell(srcId).getBBox().center();
        var trgCenter = graph.getCell(trgId).getBBox().center();
        var midPoint = g.line(srcCenter, trgCenter).midpoint();

        // Then find the angle it forms.
        var theta = srcCenter.theta(trgCenter);

        // This is the maximum distance between links
        var gap = 20;

        _.each(siblings, function(sibling, index) {

            // We want the offset values to be calculated as follows 0, 20, 20, 40, 40, 60, 60 ..
            var offset = gap * Math.ceil(index / 2);

            // Now we need the vertices to be placed at points which are 'offset' pixels distant
            // from the first link and forms a perpendicular angle to it. And as index goes up
            // alternate left and right.
            //
            //  ^  odd indexes 
            //  |
            //  |---->  index 0 line (straight line between a source center and a target center.
            //  |
            //  v  even indexes
            var sign = index % 2 ? 1 : -1;
            var angle = g.toRad(theta + sign * 90);

            // We found the vertex.
            var vertex = g.point.fromPolar(offset, angle, midPoint);

            sibling.set('vertices', [{ x: vertex.x, y: vertex.y }]);
        });
    }
};

var myAdjustVertices = _.partial(adjustVertices, graph);

// adjust vertices when a cell is removed or its source/target was changed
graph.on('add remove change:source change:target', myAdjustVertices);

// also when an user stops interacting with an element.
paper.on('cell:pointerup', myAdjustVertices);

graph.addCells([r1,r2,r3,l1,l2,l3,l4,l5]);
