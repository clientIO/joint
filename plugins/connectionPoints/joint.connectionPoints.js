(function(joint, util, g, V) {

    function closestIntersection(intersections, refPoint) {

        if (intersections.length === 1) return intersections[0];
        return util.sortBy(intersections, function(i) { return i.squaredDistance(refPoint) })[0];
    }

    function offset(p1, p2, offset) {

        if (!isFinite(offset)) return p1;
        var length = p1.distance(p2);
        if (offset === 0 && length > 0) return p1;
        return p1.move(p2, -Math.min(offset, length - 1));
    }

    function stroke(magnet) {

        var stroke = magnet.getAttribute('stroke-width');
        if (stroke === null) return 0;
        return parseFloat(stroke) || 0;
    }

    // Connection Points

    function anchor(line, view, magnet, opt) {

        return offset(line.end, line.start, opt.offset);
    }

    function bboxIntersection(line, view, magnet, opt) {

        var bbox = view.getNodeBBox(magnet);
        if (opt.stroke) bbox.inflate(stroke(magnet) / 2);
        var intersections = line.intersect(bbox);
        var cp = (intersections)
            ? closestIntersection(intersections, line.start)
            : line.end;
        return offset(cp, line.start, opt.offset);
    }

    function rectangleIntersection(line, view, magnet, opt) {

        var angle = view.model.angle();
        if (angle === 0) {
            return bboxIntersection(line, view, magnet, opt);
        }

        var bboxWORotation = view.getNodeUnrotatedBBox(magnet);
        if (opt.stroke) bboxWORotation.inflate(stroke(magnet) / 2);
        var center = bboxWORotation.center();
        var lineWORotation = line.clone().rotate(center, angle);
        var intersections = lineWORotation.setLength(1e6).intersect(bboxWORotation);
        var cp = (intersections)
            ? closestIntersection(intersections, lineWORotation.start).rotate(center, -angle)
            : line.end;
        return offset(cp, line.start, opt.offset);
    }

    var BNDR_SUBDIVISIONS = 'segmentSubdivisons';
    var BNDR_SHAPE_BBOX = 'shapeBBox';

    function boundaryIntersection(line, view, magnet, opt) {

        var node, intersection;
        var selector = opt.selector;
        var anchor = line.end;

        if (typeof selector === 'string') {
            node = view.findBySelector(selector)[0];
        } else if (Array.isArray(selector)) {
            node = util.getByPath(magnet, selector);
        } else {
            // Find the closest non-group descendant
            node = magnet;
            do {
                var tagName = node.tagName.toUpperCase();
                if (tagName === 'G') {
                    node = node.firstChild;
                } else if (tagName === 'TITLE') {
                    node = node.nextSibling;
                } else break;
            } while (node)
        }

        if (!(node instanceof Element)) return anchor;

        var localShape = view.getNodeShape(node);
        var magnetMatrix = view.getNodeMatrix(node);
        var translateMatrix = view.getRootTranslateMatrix();
        var rotateMatrix = view.getRootRotateMatrix();
        var targetMatrix = translateMatrix.multiply(rotateMatrix).multiply(magnetMatrix);
        var localMatrix = targetMatrix.inverse();
        var localLine = V.transformLine(line, localMatrix);
        var localRef = localLine.start.clone();
        var data = view.getNodeData(node);

        if (opt.insideout === false) {
            if (!data[BNDR_SHAPE_BBOX]) data[BNDR_SHAPE_BBOX] = localShape.bbox();
            var localBBox = data[BNDR_SHAPE_BBOX];
            if (localBBox.containsPoint(localRef)) return anchor;
        }

        // Caching segment subdivisions for paths
        var pathOpt
        if (localShape instanceof g.Path) {
            var precision = opt.precision || 2;
            if (!data[BNDR_SUBDIVISIONS]) data[BNDR_SUBDIVISIONS] = localShape.getSegmentSubdivisions({ precision: precision });
            pathOpt = {
                precision: precision,
                segmentSubdivisions: data[BNDR_SUBDIVISIONS]
            }
        }

        if (opt.extrapolate === true) localLine.setLength(1e6);

        intersection = localLine.intersect(localShape, pathOpt);
        if (intersection) {
            // More than one intersection
            if (V.isArray(intersection)) intersection = closestIntersection(intersection, localRef);
        } else if (opt.sticky === true) {
            // No intersection, find the closest point instead
            if (localShape instanceof g.Rect) {
                intersection = localShape.pointNearestToPoint(localRef);
            } else if (localShape instanceof g.Ellipse) {
                intersection = localShape.intersectionWithLineFromCenterToPoint(localRef);
            } else {
                intersection = localShape.closestPoint(localRef, pathOpt);
            }
        }

        var cp = (intersection) ? V.transformPoint(intersection, targetMatrix) : anchor;
        var cpOffset = opt.offset || 0;
        if (opt.stroke) cpOffset += stroke(node) / 2;

        return offset(cp, line.start, cpOffset);
    }

    joint.connectionPoints = {
        anchor: anchor,
        bbox: bboxIntersection,
        rectangle: rectangleIntersection,
        boundary: boundaryIntersection
    }

})(joint, joint.util, g, V);
