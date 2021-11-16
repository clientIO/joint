import * as g from '../g/index.mjs';

function defaultPath(sourcePoint, targetPoint) {
    let path = new g.Path();

    let segment;

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

    return path;
}

function autoDirectionPath(linkView, sourcePoint, targetPoint) {
    let path = new g.Path();

    const sourceSide = linkView.sourceBBox.sideNearestToPoint(linkView.getEndConnectionPoint('source'));
    const targetSide = linkView.targetBBox.sideNearestToPoint(linkView.getEndConnectionPoint('target'));
 
    let cp1x;
    let cp1y;
    let cp2x;
    let cp2y;
    switch (sourceSide) {
        case 'top':
        case 'bottom':
            cp1x = sourcePoint.x;
            cp1y = (sourcePoint.y + targetPoint.y) / 2;
            break;
        case 'right':
        case 'left':
            cp1x = (sourcePoint.x + targetPoint.x) / 2;
            cp1y = sourcePoint.y;
            break;
    }
    switch (targetSide) {
        case 'top':
        case 'bottom':
            cp2x = targetPoint.x;
            cp2y = (sourcePoint.y + targetPoint.y) / 2;
            break;
        case 'right':
        case 'left':
            cp2x = (sourcePoint.x + targetPoint.x) / 2;
            cp2y = targetPoint.y;
            break;
    }

    path = new g.Path();
    path.appendSegment(g.Path.createSegment('M', sourcePoint));
    path.appendSegment(g.Path.createSegment('C', cp1x, cp1y, cp2x, cp2y, targetPoint.x, targetPoint.y));

    return path;
}

export const smooth = function(sourcePoint, targetPoint, route, opt) {
    const linkView = this;

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

        switch (opt.direction) {
            case 'auto': 
                path = autoDirectionPath(linkView, sourcePoint, targetPoint);
                break;
            case 'horizontal':
                break;
            default:
                path = defaultPath(sourcePoint, targetPoint);
                break;
        }
        /* if (opt.mode === 'stepDirection') {
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
        } */
    }

    return (raw) ? path : path.serialize();
};
