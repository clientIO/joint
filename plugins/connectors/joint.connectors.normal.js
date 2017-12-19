joint.connectors.normal = function(sourcePoint, targetPoint, vertices) {

    var points = [sourcePoint].concat(vertices).concat([targetPoint]);

    var polyline = new g.Polyline(points);
    var path = new g.Path(polyline);

    return path.serialize();
};
