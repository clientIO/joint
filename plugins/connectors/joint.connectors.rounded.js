joint.connectors.rounded = function(sourcePoint, targetPoint, vertices, opt) {

    opt = opt || {};

    var offset = opt.radius || 10;

    var path = new g.Path([]);
    var segment;

    segment = g.Path.createSegment('M', sourcePoint);
    path.appendSegment(segment);

    var _13 = 1 / 3;
    var _23 = 2 / 3;

    var prev, next;
    var prevDistance, nextDistance;
    var startMove, endMove;
    var roundedStart, roundedEnd;
    var control1, control2;
    joint.util.toArray(vertices).forEach(function(vertex, index) {

        prev = vertices[index - 1] || sourcePoint;
        next = vertices[index + 1] || targetPoint;

        prevDistance = nextDistance || (vertex.distance(prev) / 2);
        nextDistance = vertex.distance(next) / 2;

        startMove = -Math.min(offset, prevDistance);
        endMove = -Math.min(offset, nextDistance);

        roundedStart = (new g.Point(vertex)).move(prev, startMove).round();
        roundedEnd = (new g.Point(vertex)).move(next, endMove).round();

        control1 = new g.Point((_13 * roundedStart.x) + (_23 * vertex.x), (_23 * vertex.y) + (_13 * roundedStart.y));
        control2 = new g.Point((_13 * roundedEnd.x) + (_23 * vertex.x), (_23 * vertex.y) + (_13 * roundedEnd.y));

        segment = g.Path.createSegment('L', roundedStart);
        path.appendSegment(segment);

        segment = g.Path.createSegment('C', control1, control2, roundedEnd);
        path.appendSegment(segment);
    });

    segment = g.Path.createSegment('L', targetPoint);
    path.appendSegment(segment);

    return path.serialize();
};
