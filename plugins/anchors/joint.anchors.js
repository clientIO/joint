(function(joint, util) {

    function bboxWrapper(method) {

        return function(view, magnet, ref, opt) {

            var rotate = !!opt.rotate;
            var bbox = (rotate) ? view.getNodeUnrotatedBBox(magnet) : view.getNodeBBox(magnet);
            var anchor = bbox[method]();

            var dx = opt.dx;
            if (dx) {
                var dxPercentage = util.isPercentage(dx);
                dx = parseFloat(dx);
                if (isFinite(dx)) {
                    if (dxPercentage) {
                        dx /= 100;
                        dx *= bbox.width;
                    }
                    anchor.x += dx;
                }
            }

            var dy = opt.dy;
            if (dy) {
                var dyPercentage = util.isPercentage(dy);
                dy = parseFloat(dy);
                if (isFinite(dy)) {
                    if (dyPercentage) {
                        dy /= 100;
                        dy *= bbox.height;
                    }
                    anchor.y += dy;
                }
            }

            return (rotate) ? anchor.rotate(view.model.getBBox().center(), -view.model.angle()) : anchor;
        };
    }

    function resolveRefAsBBoxCenter(fn) {

        return function(view, magnet, ref, opt) {

            if (ref instanceof Element) {
                var refView = this.paper.findView(ref);
                var refPoint = (refView)
                    ? refView.getNodeBBox(ref).center()
                    : new g.Point();

                return fn.call(this, view, magnet, refPoint, opt);
            }

            return fn.apply(this, arguments);
        };
    }

    function perpendicular(view, magnet, refPoint, opt) {

        var angle = view.model.angle();
        var bbox = view.getNodeBBox(magnet);
        var anchor = bbox.center();
        var topLeft = bbox.origin();
        var bottomRight = bbox.corner();

        var padding = opt.padding;
        if (!isFinite(padding)) padding = 0;

        if ((topLeft.y + padding) <= refPoint.y && refPoint.y <= (bottomRight.y - padding)) {
            var dy = (refPoint.y - anchor.y);
            anchor.x += (angle === 0 || angle === 180) ? 0 : dy * 1 / Math.tan(g.toRad(angle));
            anchor.y += dy;
        } else if ((topLeft.x + padding) <= refPoint.x && refPoint.x <= (bottomRight.x - padding)) {
            var dx = (refPoint.x - anchor.x);
            anchor.y += (angle === 90 || angle === 270) ? 0 : dx * Math.tan(g.toRad(angle));
            anchor.x += dx;
        }

        return anchor;
    }

    function midSide(view, magnet, refPoint, opt) {

        var rotate = !!opt.rotate;
        var bbox, angle, center;
        if (rotate) {
            bbox = view.getNodeUnrotatedBBox(magnet);
            center = view.model.getBBox().center();
            angle = view.model.angle();
        } else {
            bbox = view.getNodeBBox(magnet);
        }

        var padding = opt.padding;
        if (isFinite(padding)) bbox.inflate(padding);

        if (rotate) refPoint.rotate(center, angle);

        var side = bbox.sideNearestToPoint(refPoint);
        var anchor;
        switch (side) {
            case 'left': anchor = bbox.leftMiddle(); break;
            case 'right': anchor = bbox.rightMiddle(); break;
            case 'top': anchor = bbox.topMiddle(); break;
            case 'bottom': anchor = bbox.bottomMiddle(); break;
        }

        return (rotate) ? anchor.rotate(center, -angle) : anchor;
    }

    // Can find anchor from model, when there is no selector or the link end
    // is connected to a port
    function modelCenter(view, magnet) {

        var model = view.model;
        var bbox = model.getBBox();
        var center = bbox.center();
        var angle = model.angle();

        var portId = view.findAttribute('port', magnet);
        if (portId) {
            var portGroup = model.portProp(portId, 'group');
            var portsPositions = model.getPortsPositions(portGroup);
            var anchor = new g.Point(portsPositions[portId]).offset(bbox.origin());
            anchor.rotate(center, -angle);
            return anchor;
        }

        return center;
    }

    joint.anchors = {
        center: bboxWrapper('center'),
        top: bboxWrapper('topMiddle'),
        bottom: bboxWrapper('bottomMiddle'),
        left: bboxWrapper('leftMiddle'),
        right: bboxWrapper('rightMiddle'),
        topLeft: bboxWrapper('origin'),
        topRight: bboxWrapper('topRight'),
        bottomLeft: bboxWrapper('bottomLeft'),
        bottomRight: bboxWrapper('corner'),
        perpendicular: resolveRefAsBBoxCenter(perpendicular),
        midSide: resolveRefAsBBoxCenter(midSide),
        modelCenter: modelCenter
    };

    function connectionRatio(view, _magnet, _refPoint, opt) {

        if (!view.model.isLink()) return view.model.getBBox().center();
        var ratio = ('ratio' in opt) ? opt.ratio : 0.5;
        return view.getPointAtRatio(ratio);
    }

    function connectionLength(view, _magnet, _refPoint, opt) {

        if (!view.model.isLink()) return view.model.getBBox().center();
        var length = ('length' in opt) ? opt.length : 20;
        return view.getPointAtLength(length);
    }

    function closestIntersection(intersections, refPoint) {

        if (intersections.length === 1) return intersections[0];
        return util.sortBy(intersections, function(i) { return i.squaredDistance(refPoint); })[0];
    }

    function connectionPerpendicular(view, _magnet, refPoint, opt) {

        var OFFSET = 1e6;
        var path = view.getConnection();
        var segmentSubdivisions =  view.getConnectionSubdivisions();
        var verticalLine = new g.Line(refPoint.clone().offset(0, OFFSET), refPoint.clone().offset(0, -OFFSET));
        var horizontalLine = new g.Line(refPoint.clone().offset(OFFSET, 0), refPoint.clone().offset(-OFFSET, 0));
        var verticalIntersections = verticalLine.intersect(path, { segmentSubdivisions: segmentSubdivisions });
        var horizontalIntersections = horizontalLine.intersect(path, { segmentSubdivisions: segmentSubdivisions });
        var intersections = [];
        if (verticalIntersections) Array.prototype.push.apply(intersections, verticalIntersections);
        if (horizontalIntersections) Array.prototype.push.apply(intersections, horizontalIntersections);
        if (intersections.length > 0) return closestIntersection(intersections, refPoint);
        // fallback
        if ('fallbackAt' in opt) {
            var atValue = parseFloat(opt.fallbackAt);
            if (util.isPercentage(opt.fallbackAt)) {
                return view.getPointAtRatio(atValue / 100);
            } else {
                return view.getPointAtLength(atValue);
            }
        }
        return connectionClosest(view, _magnet, refPoint, opt);
    }

    function connectionClosest(view, _magnet, refPoint, _opt) {

        var closestPoint = view.getClosestPoint(refPoint);
        if (closestPoint) return closestPoint;
        return view.getConnection().start;
    }

    function resolveRefAsConnectionCenter(fn) {

        return function(view, magnet, ref, opt) {

            if (ref instanceof Element) {
                var refView = this.paper.findView(ref);
                var refPoint = (refView)
                    ? refView.getPointAtRatio(0.5)
                    : new g.Point();

                return fn.call(this, view, magnet, refPoint, opt);
            }

            return fn.apply(this, arguments);
        };
    }

    joint.linkAnchors = {
        connectionRatio: connectionRatio,
        connectionLength: connectionLength,
        connectionPerpendicular: resolveRefAsConnectionCenter(connectionPerpendicular),
        connectionClosest: resolveRefAsConnectionCenter(connectionClosest)
    };

})(joint, joint.util);
