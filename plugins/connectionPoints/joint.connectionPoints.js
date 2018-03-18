(function(joint, util, g, V) {

    function closestIntersection(intersections, refPoint) {

        if (intersections.length === 1) return intersections[0];
        return util.sortBy(intersections, function(i) { return i.squaredDistance(refPoint) })[0];
    }

    function boundaryConnectionPoint(line, view, magnet) {

        var bbox = view.getMagnetBBox(magnet);
        var intersections = line.intersect(bbox);
        if (!intersections) return line.end;
        return closestIntersection(intersections, line.start);
    }

    joint.connectionPoints = {

        anchor: function(line) {

            return line.end;
        },

        nearest: function(line, view, magnet) {

            var bbox = view.getMagnetBBox(magnet);
            return bbox.pointNearestToPoint(line.end);
        },

        boundary: boundaryConnectionPoint,

        polygon: function(line, view, magnet) {

            var angle = view.model.angle();
            if (angle === 0) {
                return boundaryConnectionPoint(line, view, magnet);
            }

            var bboxWORotation = view.getMagnetUnrotatedBBox(magnet);
            var center = bboxWORotation.center();
            var lineWORotation = line.clone().rotate(center, angle);
            var intersections = lineWORotation.setLength(1e6).intersect(bboxWORotation);
            if (!intersections) return line.end;
            return closestIntersection(intersections, lineWORotation.start).rotate(center, -angle);
        },

        geometricPrecision: function(line, view, magnet, opt) {

            var node, connectionPoint;
            var selector = opt.selector;
            var paper = this.paper;
            if (typeof selector === 'string') {
                node = view.findBySelector(selector)[0];
            } else if (Array.isArray(selector)) {
                node = util.getByPath(magnet, selector);
            } else {
                node = magnet;
                while (node && node.tagName.toUpperCase() === 'G') node = node.firstChild;
            }
            if (node instanceof Element) {
                // if (typeof xxx === 'undefined') xxx = V('line', { stroke: 'red' }).appendTo(this.paper.viewport);
                // var ref = line.end;
                // var anchor = line.start;
                // xxx.attr({  x1: ref.x, y1: ref.y, x2: anchor.x, y2: anchor.y });
                // + caching
                connectionPoint =  V(node).findIntersection(line, paper.viewport, { precision: opt.precision });
            }
            return connectionPoint || line.end;
        }
    };

})(joint, joint.util, g, V);
