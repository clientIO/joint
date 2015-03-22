if (typeof exports === 'object') {
    var joint = require('jointjs');
    var Backbone = require('backbone');
    var _ = require('lodash');
    var g = require('../../src/geometry');
    var V = require('../../src/vectorizer').V;
}

//      JointJS library.
//      (c) 2011-2013 client IO

joint.connectors.normal = function(sourcePoint, targetPoint, vertices) {

    // Construct the `d` attribute of the `<path>` element.
    var d = ['M', sourcePoint.x, sourcePoint.y];

    _.each(vertices, function(vertex) {

        d.push(vertex.x, vertex.y);
    });

    d.push(targetPoint.x, targetPoint.y);

    return d.join(' ');
};

if (typeof exports === 'object') {

    module.exports = joint.connectors.normal;
}
