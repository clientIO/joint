(function(joint, g) {

    joint.connectionPoints = {

        anchor: function(anchor) {
            return anchor.clone();
        },

        nearest: function(anchor, ref, bbox) {
            return bbox.pointNearestToPoint(ref);
        },

        boundary: function(anchor, ref, bbox) {
            //return shape.intersectionWithLine(new g.Line(ref, anchor)) || anchor;
            var line = new g.Line(ref, anchor);
            var intersections = line.intersect(bbox);
            if (!intersections) return anchor;
            return intersections[0];
        }
    };

})(joint, g);
