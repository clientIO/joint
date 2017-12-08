joint.connectors.normal = function(sourcePoint, targetPoint, vertices) {

    var points = [sourcePoint].concat(vertices).concat([targetPoint]);

    var polyline = g.Polyline(points);
    var path = polyline.toPath();

    return path.serialize();
};
