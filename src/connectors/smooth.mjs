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

    const path = new g.Path();
    path.appendSegment(g.Path.createSegment('M', sourcePoint));
    path.appendSegment(g.Path.createSegment('C', cp1x, cp1y, cp2x, cp2y, targetPoint.x, targetPoint.y));

    return path;
}

function horisontalDirectionPath(linkView, sourcePoint, targetPoint) {
    let offset = 100;
 
    const sourceSide = linkView.sourceBBox.sideNearestToPoint(linkView.getEndConnectionPoint('source'));
    const targetSide = linkView.targetBBox.sideNearestToPoint(linkView.getEndConnectionPoint('target'));

    let cp1x;
    let cp1y;
    let cp2x;
    let cp2y;
    const centerOffset = Math.abs(sourcePoint.x - ((sourcePoint.x + targetPoint.x) / 2));
    offset = Math.max(centerOffset, offset);

    switch (sourceSide) {
        case 'left':
            cp1x = sourcePoint.x - offset;
            cp1y = sourcePoint.y;
            break;
        case 'right':
            cp1x = sourcePoint.x + offset;
            cp1y = sourcePoint.y;
            break;
        default:
            cp1x = sourcePoint.x + offset;
            cp1y = sourcePoint.y;
            break;
    }

    switch (targetSide) {
        case 'left':
            cp2x = targetPoint.x - offset;
            cp2y = targetPoint.y;   
            break;
        case 'right':
            cp2x = targetPoint.x + offset;
            cp2y = targetPoint.y;   
            break;
        default:
            cp2x = targetPoint.x - offset;
            cp2y = targetPoint.y;   
            break;
    }

    const path = new g.Path();
    path.appendSegment(g.Path.createSegment('M', sourcePoint));
    path.appendSegment(g.Path.createSegment('C', cp1x, cp1y, cp2x, cp2y, targetPoint.x, targetPoint.y));

    return path;
}

function verticalDirectionPath(linkView, sourcePoint, targetPoint) {
    let offset = 100;
 
    const sourceSide = linkView.sourceBBox.sideNearestToPoint(linkView.getEndConnectionPoint('source'));
    const targetSide = linkView.targetBBox.sideNearestToPoint(linkView.getEndConnectionPoint('target'));

    let cp1x;
    let cp1y;
    let cp2x;
    let cp2y;
    const centerOffset = Math.abs(sourcePoint.y - ((sourcePoint.y + targetPoint.y) / 2));
    offset = Math.max(centerOffset, offset);

    switch (sourceSide) {
        case 'top':
            cp1x = sourcePoint.x;
            cp1y = sourcePoint.y - offset;
            break;
        case 'bottom':
            cp1x = sourcePoint.x;
            cp1y = sourcePoint.y + offset;
            break;
        default:
            cp1x = sourcePoint.x;
            cp1y = sourcePoint.y + offset;
            break;
    }

    switch (targetSide) {
        case 'top':
            cp2x = targetPoint.x;
            cp2y = targetPoint.y - offset;   
            break;
        case 'bottom':
            cp2x = targetPoint.x;
            cp2y = targetPoint.y + offset;   
            break;
        default:
            cp2x = targetPoint.x;
            cp2y = targetPoint.y - offset;   
            break;
    }

    const path = new g.Path();
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
                path = horisontalDirectionPath(linkView, sourcePoint, targetPoint);
                break;
            case 'vertical':
                path = verticalDirectionPath(linkView, sourcePoint, targetPoint);
                break;
            default:
                path = defaultPath(sourcePoint, targetPoint);
                break;
        }
    }

    return (raw) ? path : path.serialize();
};
