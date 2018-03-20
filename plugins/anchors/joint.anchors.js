(function(joint, util) {

    function bboxWrapper(method) {
        return function (cellView, magnet, ref, opt) {
            var bbox = cellView.getNodeBBox(magnet);
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
            return anchor;
        }
    }

    function resolveRefAsBBoxCenter(fn) {
        return function(cellView, magnet, ref, opt, linkView) {
            if (ref instanceof Element) {
                var refView = this.paper.findView(ref);
                var refPoint = refView.getNodeBBox(ref).center();
                return fn.call(this, cellView, magnet, refPoint, opt, linkView)
            }
            return fn.apply(this, arguments);
        }
    }

    function perpendicular(cellView, magnet, refPoint, opt) {
        var cell = cellView.model;
        var angle = cell.angle();
        var bbox = cellView.getNodeBBox(magnet);
        var anchor = bbox.center();
        var topLeft = bbox.origin();
        var bottomRight = bbox.corner();
        var padding = opt.padding
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

    function midSide(cellView, magnet, refPoint, opt) {
        var bbox = cellView.getNodeBBox(magnet);
        var padding = opt.padding;
        if (isFinite(padding)) bbox.inflate(padding);
        var side = bbox.sideNearestToPoint(refPoint);
        switch (side) {
            case 'left': return bbox.leftMiddle();
            case 'right': return bbox.rightMiddle();
            case 'top': return bbox.topMiddle();
            case 'bottom': return bbox.bottomMiddle();
        }
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
        midSide: resolveRefAsBBoxCenter(midSide)
    }

})(joint, joint.util);
