import { Path, Point } from '../g/index.mjs';

export const Directions = {
    AUTO: 'auto',
    HORIZONTAL: 'horizontal',
    VERTICAL: 'vertical',
    LEGACY: 'legacy'
};

function legacyPoints(sourcePoint, targetPoint) {
    if ((Math.abs(sourcePoint.x - targetPoint.x)) >= (Math.abs(sourcePoint.y - targetPoint.y))) {
        const controlPointX = (sourcePoint.x + targetPoint.x) / 2;

        return [new Point(controlPointX, sourcePoint.y), new Point(controlPointX, targetPoint.y)];
    } else {
        const controlPointY = (sourcePoint.y + targetPoint.y) / 2;

        return [new Point(sourcePoint.x, controlPointY), new Point(targetPoint.x, controlPointY)];
    }    
}

function autoDirectionPoints(linkView, sourcePoint, targetPoint, minOffset) {
    const { sourceBBox, targetBBox } = linkView;
    const sourceSide = sourceBBox.sideNearestToPoint(linkView.getEndConnectionPoint('source'));
    const targetSide = targetBBox.sideNearestToPoint(linkView.getEndConnectionPoint('target'));
 
    const centerOffsetX = Math.abs(sourcePoint.x - ((sourcePoint.x + targetPoint.x) / 2));
    const offsetX = Math.max(centerOffsetX, minOffset);

    const centerOffsetY = Math.abs(sourcePoint.x - ((sourcePoint.x + targetPoint.x) / 2));
    const offsetY = Math.max(centerOffsetY, minOffset);

    let cp1x;
    let cp1y;
    let cp2x;
    let cp2y;
    switch (sourceSide) {
        case 'top':
            cp1x = sourcePoint.x;
            cp1y = sourcePoint.y - offsetY;
            break;
        case 'bottom':
            cp1x = sourcePoint.x;
            cp1y = sourcePoint.y + offsetY;
            break;
        case 'right':
            cp1x = sourcePoint.x + offsetX;
            cp1y = sourcePoint.y;
            break;
        case 'left':
            cp1x = sourcePoint.x - offsetX;
            cp1y = sourcePoint.y;
            break;
    }
    switch (targetSide) {
        case 'top':
            cp2x = targetPoint.x;
            cp2y = targetPoint.y - offsetY;
            break;
        case 'bottom':
            cp2x = targetPoint.x;
            cp2y = targetPoint.y + offsetY;
            break;
        case 'right':
            cp2x = targetPoint.x + offsetX;
            cp2y = targetPoint.y;
            break;
        case 'left':
            cp2x = targetPoint.x - offsetX;
            cp2y = targetPoint.y;
            break;
    }

    return [new Point(cp1x, cp1y), new Point(cp2x, cp2y)];
}

function horizontalDirectionPoints(linkView, sourcePoint, targetPoint, minOffset) {
    const { sourceBBox, targetBBox } = linkView;
    const sourceSide = sourceBBox.sideNearestToPoint(linkView.getEndConnectionPoint('source'));
    const targetSide = targetBBox.sideNearestToPoint(linkView.getEndConnectionPoint('target'));

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

    return [new Point(cp1x, cp1y), new Point(cp2x, cp2y)];
}

function verticalDirectionPoints(linkView, sourcePoint, targetPoint, minOffset) { 
    const { sourceBBox, targetBBox } = linkView;
    const sourceSide = sourceBBox.sideNearestToPoint(linkView.getEndConnectionPoint('source'));
    const targetSide = targetBBox.sideNearestToPoint(linkView.getEndConnectionPoint('target'));

    let cp1x;
    let cp1y;
    let cp2x;
    let cp2y;

    const centerOffset = Math.abs(sourcePoint.x - ((sourcePoint.x + targetPoint.x) / 2));
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

    return [new Point(cp1x, cp1y), new Point(cp2x, cp2y)];
}

export const smooth = function(sourcePoint, targetPoint, route = [], opt = {}) {
    const linkView = this;

    const raw = Boolean(opt.raw);
    // minOffset - minimal proximal control point offset.
    // tension - coefficient which increases the distance between control points.
    const { minOffset = 100, direction = Directions.AUTO, tension = 0 } = opt;

    let path = new Path();
    path.appendSegment(Path.createSegment('M', sourcePoint));

    let points = [];
    switch (direction) {
        case Directions.LEGACY: 
            points = legacyPoints(sourcePoint, targetPoint);
            break;
        case Directions.HORIZONTAL:
            points = horizontalDirectionPoints(linkView, sourcePoint, targetPoint, minOffset);
            break;
        case Directions.VERTICAL:
            points = verticalDirectionPoints(linkView, sourcePoint, targetPoint, minOffset);
            break;
        case Directions.AUTO:
        default:
            points = autoDirectionPoints(linkView, sourcePoint, targetPoint, minOffset);
            break;
    }
 
    const curvePoints = route.concat([targetPoint]);
    const cps = [points[0], null, null];
    for (let i = 0; i < curvePoints.length; i++) {
        cps[2] = curvePoints[i];
        if (!cps[1]) {
            if (i === curvePoints.length - 1) {
                cps[1] = points[1];
            }
            else {
                const next = curvePoints[i];
                const tension1x = (next.x - cps[0].x) / 6 * tension;
                const tension1y = (next.y - cps[0].y) / 6 * tension;         
                cps[1] = new Point(cps[0].x - tension1x, cps[0].y - tension1y);
            }
        }
        
        path.appendSegment(Path.createSegment('C', cps[0], cps[1], cps[2]));

        cps[0] = new Point(cps[2].x + (cps[2].x - cps[1].x), cps[2].y + (cps[2].y - cps[1].y));
        cps[1] = null;
    }

    return (raw) ? path : path.serialize();
};
