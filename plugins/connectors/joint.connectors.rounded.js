joint.connectors.rounded = function(sourcePoint, targetPoint, vertices, opts) {

    opts = opts || {};

    var offset = opts.radius || 10;

    var c1, c2, d1, d2, prev, next;

    // Construct the `d` attribute of the `<path>` element.
    var d = ['M', sourcePoint.x, sourcePoint.y];

    _.each(vertices, function(vertex, index) {

        // the closest vertices
        prev = vertices[index - 1] || sourcePoint;
        next = vertices[index + 1] || targetPoint;

        // a half distance to the closest vertex
        d1 = d2 || g.point(vertex).distance(prev) / 2;
        d2 = g.point(vertex).distance(next) / 2;

        // control points
        c1 = g.point(vertex).move(prev, -Math.min(offset, d1)).round();
        c2 = g.point(vertex).move(next, -Math.min(offset, d2)).round();

        d.push(c1.x, c1.y, 'S', vertex.x, vertex.y, c2.x, c2.y, 'L');
    });

    d.push(targetPoint.x, targetPoint.y);

    return d.join(' ');
};
