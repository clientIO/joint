var graph = new joint.dia.Graph;

var paper = new joint.dia.Paper({
    el: $('#paper'),
    width: 1000,
    height: 600,
    gridSize: 10,
    model: graph
});

// APPROACH 1:
// define the connector inside joint.connectors
// allows passing custom arguments
// can be serialized with `toJSON()`
joint.connectors.wobble = function(sourcePoint, targetPoint, vertices, args, linkView) {

    var SPREAD = args.spread || 20;

    var points = vertices.concat(targetPoint)
    var prev = sourcePoint;
    var path = new g.Path(g.Path.createSegment('M', prev));

    var n = points.length;
    for (var i = 0; i < n; i++) {

        var next = points[i];
        var distance = prev.distance(next);

        var d = SPREAD;
        while (d < distance) {
            var current = prev.clone().move(next, -d);
            current.offset(
                Math.floor(7 * Math.random()) - 3,
                Math.floor(7 * Math.random()) - 3
            );
            path.appendSegment(g.Path.createSegment('L', current));
            d += SPREAD;
        }

        path.appendSegment(g.Path.createSegment('L', next));
        prev = next;
    }

    return path.serialize();
}

var source = new joint.shapes.standard.Rectangle();
source.position(50, 50);
source.resize(140, 70);
source.attr('label/text', 'Source');

var target = source.clone();
target.translate(700, 400)
target.attr('label/text', 'Target');

var link = new joint.shapes.standard.Link();
link.source(source);
link.target(target);

// APPROACH 1:
// pass by name under which it was saved in joint.connectors namespace
link.connector('wobble', {
    spread: 10
});

// APPROACH 2:
// pass a function
// does not enable passing custom arguments
// cannot be serialized with `toJSON()`
/*link.connector(function(sourcePoint, targetPoint, vertices, args, linkView) {

    var SPREAD = 20;

    var points = vertices.concat(targetPoint)
    var prev = sourcePoint;
    var path = new g.Path(g.Path.createSegment('M', prev));

    var n = points.length;
    for (var i = 0; i < n; i++) {

        var next = points[i];
        var distance = prev.distance(next);

        var d = SPREAD;
        while (d < distance) {
            var current = prev.clone().move(next, -d);
            current.offset(
                Math.floor(7 * Math.random()) - 3,
                Math.floor(7 * Math.random()) - 3
            );
            path.appendSegment(g.Path.createSegment('L', current));
            d += SPREAD;
        }

        path.appendSegment(g.Path.createSegment('L', next));
        prev = next;
    }

    return path.serialize();
});*/

graph.addCells([source, target, link]);
