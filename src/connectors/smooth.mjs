import * as g from '../g/index.mjs';

const directionMode = {
    HORIZONTAL: 'horizontal',
    VERTICAL: 'vertical',
    LEGACY: 'legacy'
};

function legacyPath(sourcePoint, targetPoint) {
    let path = new g.Path();

    let segment = g.Path.createSegment('M', sourcePoint);
    path.appendSegment(segment);

    if ((Math.abs(sourcePoint.x - targetPoint.x)) >= (Math.abs(sourcePoint.y - targetPoint.y))) {
        const controlPointX = (sourcePoint.x + targetPoint.x) / 2;

        segment = g.Path.createSegment('C', controlPointX, sourcePoint.y, controlPointX, targetPoint.y, targetPoint.x, targetPoint.y);
        path.appendSegment(segment);
    } else {
        const controlPointY = (sourcePoint.y + targetPoint.y) / 2;

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

function horizontalDirectionPath(linkView, sourcePoint, targetPoint, minOffset) {
    const sourceSide = linkView.sourceBBox.sideNearestToPoint(linkView.getEndConnectionPoint('source'));
    const targetSide = linkView.targetBBox.sideNearestToPoint(linkView.getEndConnectionPoint('target'));

    let cp1x;
    let cp1y;
    let cp2x;
    let cp2y;
    const centerOffset = Math.abs(sourcePoint.x - ((sourcePoint.x + targetPoint.x) / 2));
    const offset = Math.max(centerOffset, minOffset);

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

function verticalDirectionPath(linkView, sourcePoint, targetPoint, minOffset) { 
    const sourceSide = linkView.sourceBBox.sideNearestToPoint(linkView.getEndConnectionPoint('source'));
    const targetSide = linkView.targetBBox.sideNearestToPoint(linkView.getEndConnectionPoint('target'));

    let cp1x;
    let cp1y;
    let cp2x;
    let cp2y;
    const centerOffset = Math.abs(sourcePoint.y - ((sourcePoint.y + targetPoint.y) / 2));
    const offset = Math.max(centerOffset, minOffset);

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
    if (!opt) opt = {};

    const linkView = this;

    const raw = Boolean(opt.raw);
    let path;

    if (route && route.length !== 0) {

        const points = [sourcePoint].concat(route).concat([targetPoint]);
        const curves = g.Curve.throughPoints(points);

        path = new g.Path(curves);

    } else {
        // without route it will be rendered depending on direction option
        // if option is not presented it will change direction depending on 
        // source and target orientation

        // Min offset of curve point in case of source and target proximity
        let minOffset = 100;
        if (opt.minOffset != null)
            minOffset = opt.minOffset;

        switch (opt.direction) {
            case directionMode.LEGACY: 
                path = legacyPath(sourcePoint, targetPoint);
                break;
            case directionMode.HORIZONTAL:
                path = horizontalDirectionPath(linkView, sourcePoint, targetPoint, minOffset);
                break;
            case directionMode.VERTICAL:
                path = verticalDirectionPath(linkView, sourcePoint, targetPoint, minOffset);
                break;
            default:
                path = autoDirectionPath(linkView, sourcePoint, targetPoint);
                break;
        }
    }

    return (raw) ? path : path.serialize();
};
