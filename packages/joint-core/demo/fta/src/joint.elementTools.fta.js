(function(joint) {

    var boundary = null;

    joint.elementTools.FTABoundary = joint.elementTools.Boundary.extend({
        attributes: {
            'fill': 'none',
            'pointer-events': 'none',
            'stroke-width': 2,
            'stroke': ' #31d0c6',
            'rx': 5,
            'ry': 5
        }
    }, {
        factory: function() {
            if (!boundary) boundary = new this();
            return boundary;
        }
    });

})(joint);
