import * as g from '../g/index.mjs';

function getPointBox(p) {
    return new g.Rect(p.x, p.y, 0, 0);
}

function getSourceAnchor(linkView) {

    if (linkView.sourceAnchor) return linkView.sourceAnchor;

    // fallback: center of bbox    
    return linkView.sourceBBox.center();
}

function getTargetAnchor(linkView) {

    if (linkView.targetAnchor) return linkView.targetAnchor;

    // fallback: center of bbox    
    return linkView.targetBBox.center();
}

function getConnectionDirection(from, to) {
    const distX = to.x - from.x;
    const distY = to.y - from.y;
    if (distX < 0) {
        if (Math.abs(distY) < Math.abs(distX)) return 'W';
        if (distY > 0) return 'S';
        if (distY <= 0) return 'N';
    }
    if (distX >= 0) {
        if (Math.abs(distY) < Math.abs(distX)) return 'E';
        if (distY > 0) return 'S';
        if (distY <= 0) return 'N';
    }
    return null;
}

function getConnectionPoint(bearing, bbox) {
    switch (bearing) {
        case 'N':
            return g.Point(bbox.x + bbox.width / 2, bbox.y);
        case 'S':
            return g.Point(bbox.x + bbox.width / 2, bbox.y + bbox.height);
        case 'W':
            return g.Point(bbox.x, bbox.y + bbox.height / 2);
        case 'E':
            return g.Point(bbox.x + bbox.width, bbox.y + bbox.height / 2);
    }
}

export const smooth = function(sourcePoint, targetPoint, route, opt) {
    if (!opt) {
        opt = {};
    }

    var raw = !!opt.raw;
    var path;

    if (route && route.length !== 0) {

        var points = [sourcePoint].concat(route).concat([targetPoint]);
        var curves = g.Curve.throughPoints(points);

        path = new g.Path(curves);

    } else {
        // if we have no route, use a default cubic bezier curve
        // cubic bezier requires two control points
        // the control points have `x` midway between source and target
        // this produces an S-like curve

        if (opt.mode === 'stepDirection') {
            let sourceBBox = this.sourceBBox.clone();
            let targetBBox = this.targetBBox.clone();
        
            const sourceAnchor = getSourceAnchor(this);
            const targetAnchor = getTargetAnchor(this);
        
            // if anchor lies outside of bbox, the bbox expands to include it
            sourceBBox = sourceBBox.union(getPointBox(sourceAnchor));
            targetBBox = targetBBox.union(getPointBox(targetAnchor));
            
            const sourceBearing = getConnectionDirection(sourceAnchor, targetAnchor);
            const targetBearing = getConnectionDirection(targetAnchor, sourceAnchor);
            
            sourcePoint = getConnectionPoint(sourceBearing, sourceBBox);
            targetPoint = getConnectionPoint(targetBearing, targetBBox);

            let cp1x;
            let cp1y;
            let cp2x;
            let cp2y;
            switch (sourceBearing) {
                case 'N':
                case 'S':
                    cp1x = sourcePoint.x;
                    cp1y = (sourcePoint.y + targetPoint.y) / 2;
                    break;
                case 'W':
                case 'E':
                    cp1x = (sourcePoint.x + targetPoint.x) / 2;
                    cp1y = sourcePoint.y;
                    break;
            }
            switch (targetBearing) {
                case 'N':
                case 'S':
                    cp2x = targetPoint.x;
                    cp2y = (sourcePoint.y + targetPoint.y) / 2;
                    break;
                case 'W':
                case 'E':
                    cp2x = (sourcePoint.x + targetPoint.x) / 2;
                    cp2y = targetPoint.y;
                    break;
            }

            path = new g.Path();
            path.appendSegment(g.Path.createSegment('M', sourcePoint));
            path.appendSegment(g.Path.createSegment('C', cp1x, cp1y, cp2x, cp2y, targetPoint.x, targetPoint.y));
        }
        else {
            path = new g.Path();

            var segment;

            segment = g.Path.createSegment('M', sourcePoint);
            path.appendSegment(segment);

            if ((Math.abs(sourcePoint.x - targetPoint.x)) >= (Math.abs(sourcePoint.y - targetPoint.y))) {
                var controlPointX = (sourcePoint.x + targetPoint.x) / 2;

                segment = g.Path.createSegment('C', controlPointX, sourcePoint.y, controlPointX, targetPoint.y, targetPoint.x, targetPoint.y);
                path.appendSegment(segment);

            } else {
                var controlPointY = (sourcePoint.y + targetPoint.y) / 2;

                segment = g.Path.createSegment('C', sourcePoint.x, controlPointY, targetPoint.x, controlPointY, targetPoint.x, targetPoint.y);
                path.appendSegment(segment);

            }    
        }
    }

    return (raw) ? path : path.serialize();
};
