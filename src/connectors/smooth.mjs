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

function autoDirectionPoints(linkView, sourcePoint, targetPoint) {
    const { sourceBBox, targetBBox } = linkView;
    const sourceSide = sourceBBox.sideNearestToPoint(linkView.getEndConnectionPoint('source'));
    const targetSide = targetBBox.sideNearestToPoint(linkView.getEndConnectionPoint('target'));
 
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

    return [new Point(cp1x, cp1y), new Point(cp2x, cp2y)];
}

function horizontalDirectionPoints(linkView, sourcePoint, targetPoint, offset) {
    const { sourceBBox, targetBBox } = linkView;
    const sourceSide = sourceBBox.sideNearestToPoint(linkView.getEndConnectionPoint('source'));
    const targetSide = targetBBox.sideNearestToPoint(linkView.getEndConnectionPoint('target'));

    let cp1x;
    let cp1y;
    let cp2x;
    let cp2y;

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

function verticalDirectionPoints(linkView, sourcePoint, targetPoint, offset) { 
    const { sourceBBox, targetBBox } = linkView;
    const sourceSide = sourceBBox.sideNearestToPoint(linkView.getEndConnectionPoint('source'));
    const targetSide = targetBBox.sideNearestToPoint(linkView.getEndConnectionPoint('target'));

    let cp1x;
    let cp1y;
    let cp2x;
    let cp2y;

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
    // offset - proximpal curve point offset.
    const { offset = 100, direction = Directions.AUTO } = opt;

    let path = new Path();
    path.appendSegment(Path.createSegment('M', sourcePoint));

    let points = [];
    switch (direction) {
        case Directions.LEGACY: 
            points = legacyPoints(sourcePoint, targetPoint);
            break;
        case Directions.HORIZONTAL:
            points = horizontalDirectionPoints(linkView, sourcePoint, targetPoint, offset);
            break;
        case Directions.VERTICAL:
            points = verticalDirectionPoints(linkView, sourcePoint, targetPoint, offset);
            break;
        case Directions.AUTO:
        default:
            points = autoDirectionPoints(linkView, sourcePoint, targetPoint);
            break;
    }

    const curvePoints = [sourcePoint, points[0]].concat(route).concat([points[1], targetPoint]);
    const tension = 0.8;

    for (let i = 0; i < curvePoints.length - 1; i += 1) {
        const p0 = i ? curvePoints[i - 1] : curvePoints[0];
        const p1 = curvePoints[i];
        const p2 = curvePoints[i + 1];
        const p3 = i !== curvePoints.length - 2 ? curvePoints[i + 2] : p2;

        const cp1 = new Point(p1.x + ((p2.x - p0.x) / 6) * tension, p1.y + ((p2.y - p0.y) / 6) * tension);
        const cp2 = new Point(p2.x - ((p3.x - p1.x) / 6) * tension, p2.y - ((p3.y - p1.y) / 6) * tension);

        path.appendSegment(Path.createSegment('C', cp1, cp2, p2));
    }

    /*if (route && route.length !== 0) {
        const curvePoints = [sourcePoint, points[0]].concat(route).concat([points[1], targetPoint]);
        const tension = 1;

        for (let i = 0; i < curvePoints.length - 1; i++) {
            const p0 = i ? curvePoints[i - 1] : curvePoints[0];
            const p1 = curvePoints[0];
            const p2 = curvePoints[i + 1];
            const p3 = i !== curvePoints.length - 2 ? curvePoints[i + 2] : p2;

            const cp1 = new Point(p1.x + ((p2.x - p0.x) / 6) * tension, p1.y + ((p2.y - p0.y) / 6) * tension);
            const cp2 = new Point(p2.x - ((p3.x - p1.x) / 6) * tension, p2.y - ((p3.y - p1.y) / 6) * tension);

            path.appendSegment(Path.createSegment('C', cp1, cp2, p2));
        }
        const curves = Curve.throughPoints(curvePoints);
        path = new Path(curves);
    } else {
        path.appendSegment(Path.createSegment('C', points[0], points[1], targetPoint));
    } */

    return (raw) ? path : path.serialize();
};
