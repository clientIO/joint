joint.connectors.normal = function(sourcePoint, targetPoint, vertices) {

    // Construct the `d` attribute of the `<path>` element.
    var d = ['M', sourcePoint.x, sourcePoint.y];

    joint.util.toArray(vertices).forEach(function(vertex) {

        d.push(vertex.x, vertex.y);
    });

    d.push(targetPoint.x, targetPoint.y);

    return d.join(' ');
};
