joint.connectors.rounded = function(sourcePoint, targetPoint, route, opt) {

    opt || (opt = {});

    var offset = opt.radius || 10;
    var raw = opt.raw;
    var path = new g.Path();
    var segment;

    segment = g.Path.createSegment('M', sourcePoint);
    path.appendSegment(segment);

    var _13 = 1 / 3;
    var _23 = 2 / 3;

    var curr;
    var prev, next;
    var prevDistance, nextDistance;
    var startMove, endMove;
    var roundedStart, roundedEnd;
    var control1, control2;

    for (var index = 0, n = route.length; index < n; index++) {

        curr = new g.Point(route[index]);

        prev = route[index - 1] || sourcePoint;
        next = route[index + 1] || targetPoint;

        prevDistance = nextDistance || (curr.distance(prev) / 2);
        nextDistance = curr.distance(next) / 2;

        startMove = -Math.min(offset, prevDistance);
        endMove = -Math.min(offset, nextDistance);

        roundedStart = curr.clone().move(prev, startMove).round();
        roundedEnd = curr.clone().move(next, endMove).round();

        control1 = new g.Point((_13 * roundedStart.x) + (_23 * curr.x), (_23 * curr.y) + (_13 * roundedStart.y));
        control2 = new g.Point((_13 * roundedEnd.x) + (_23 * curr.x), (_23 * curr.y) + (_13 * roundedEnd.y));

        segment = g.Path.createSegment('L', roundedStart);
        path.appendSegment(segment);

        segment = g.Path.createSegment('C', control1, control2, roundedEnd);
        path.appendSegment(segment);
    }

    segment = g.Path.createSegment('L', targetPoint);
    path.appendSegment(segment);

    return (raw) ? path : path.serialize();
};
