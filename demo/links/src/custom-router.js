var graph = new joint.dia.Graph;

var paper = new joint.dia.Paper({
    el: $('#paper'),
    width: 1000,
    height: 600,
    gridSize: 10,
    model: graph
});

// APPROACH 1:
// define the router inside joint.routers
// allows passing custom arguments
// can be serialized with `toJSON()`
joint.routers.randomWalk = function (vertices, args, linkView) {

    var NUM_BOUNCES = args.numBounces || 20;

    vertices = joint.util.toArray(vertices).map(g.Point);

    for (var i = 0; i < NUM_BOUNCES; i++) {

        var sourceCorner = linkView.sourceBBox.center();
        var targetCorner = linkView.targetBBox.center();

        var randomPoint = g.Point.random(sourceCorner.x, targetCorner.x, sourceCorner.y, targetCorner.y);
        vertices.push(randomPoint)
    }

    return vertices;
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
// pass by name under which it was saved in joint.routers namespace
link.router('randomWalk', {
    numBounces: 10,
})

// APPROACH 2:
// pass a function
// does not enable passing custom arguments
// cannot be serialized with `toJSON()`
/*link.router(function(vertices, args, linkView) {

    var NUM_BOUNCES = 20;

    vertices = joint.util.toArray(vertices).map(g.Point);

    for (var i = 0; i < NUM_BOUNCES; i++) {

        var sourceCorner = linkView.sourceBBox.center();
        var targetCorner = linkView.targetBBox.center();

        var randomPoint = g.Point.random(sourceCorner.x, targetCorner.x, sourceCorner.y, targetCorner.y);
        vertices.push(randomPoint)
    }

    return vertices;
});*/

graph.addCells([source, target, link]);
