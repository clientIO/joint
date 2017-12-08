joint.connectors.smooth = function(sourcePoint, targetPoint, vertices) {

    var path;

    if (vertices && vertices.length !== 0) {

        var points = [sourcePoint].concat(vertices).concat([targetPoint]);

        path = g.Path.parse(V.normalizePathData(g.bezier.curveThroughPoints(points)));

    } else {
        // if we have no vertices, use a default cubic bezier curve
        // cubic bezier requires two control points
        // the control points have `x` midway between source and target
        // sourceControlPoint.y is equal to sourcePoint.y
        // targetControlPoint.Y being equal to targetPoint.Y
        // this produces an S-like curve

        var seg;
        var prevSeg = null;

        if ((Math.abs(sourcePoint.x - targetPoint.x)) >= (Math.abs(sourcePoint.y - targetPoint.y))) {
            var controlPointX = (sourcePoint.x + targetPoint.x) / 2;

            path = new g.Path([]);

            seg = g.Path.segmentTypes['M'].fromCoords([sourcePoint.x, sourcePoint.y], prevSeg, null);
            path.appendSegment(seg);
            prevSeg = seg;

            seg = g.Path.segmentTypes['C'].fromCoords([controlPointX, sourcePoint.y, controlPointX, targetPoint.y, targetPoint.x, targetPoint.y], prevSeg, null);
            path.appendSegment(seg);

        } else {
            var controlPointY = (sourcePoint.y + targetPoint.y) / 2;

            path = new g.Path([]);

            seg = g.Path.segmentTypes['M'].fromCoords([sourcePoint.x, sourcePoint.y], prevSeg, null);
            path.appendSegment(seg);
            prevSeg = seg;

            seg = g.Path.segmentTypes['C'].fromCoords([sourcePoint.x, controlPointY, targetPoint.x, controlPointY, targetPoint.x, targetPoint.y], prevSeg, null);
            path.appendSegment(seg);

        }        
    }

    return path.serialize();
};
