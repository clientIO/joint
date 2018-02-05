joint.connectors.normal = function(sourcePoint, targetPoint, route, opt) {

    var raw = opt && opt.raw;
    var points = [sourcePoint].concat(route).concat([targetPoint]);

    var polyline = new g.Polyline(points);
    var path = new g.Path(polyline);

    return (raw) ? path : path.serialize();
};
