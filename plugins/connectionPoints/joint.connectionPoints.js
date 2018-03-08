(function(joint, util, g, V) {

    joint.connectionPoints = {

        anchor: function(anchor) {
            return anchor.clone();
        },

        nearest: function(anchor, ref, bbox) {
            return bbox.pointNearestToPoint(ref);
        },

        boundary: function(anchor, ref, bbox) {
            var line = new g.Line(ref, anchor);
            var intersections = line.intersect(bbox);
            if (!intersections) return anchor;
            return intersections[0];
        },

        geometricPrecision: function(anchor, ref, bbox, magnet, opt) {
            var node, connectionPoint;
            var selector = opt.selector;
            var paper = this.paper;
            if (typeof selector === 'string') {
                var view = paper.findView(magnet);
                node = view.findBySelector(selector)[0];
            } else if (Array.isArray(selector)) {
                node = util.getByPath(magnet, selector);
            } else {
                node = magnet;
                while (node && node.tagName.toUpperCase() === 'G') node = node.firstChild;
            }
            if (node instanceof Element) {
                // TODO: take anchor into account!
                // + caching
                connectionPoint =  V(node).findIntersection(ref, paper.viewport);
            }
            return connectionPoint || bbox.center();
        }
    };

})(joint, joint.util, g, V);
