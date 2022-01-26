import { Path, Point, Curve } from '../g/index.mjs';

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

function autoDirectionTangents(linkView, route, minTangentMagnitude) {
    const { sourceBBox, targetBBox } = linkView;
    const last = route.length - 1;

    const sourceSide = sourceBBox.sideNearestToPoint(route[0]);
    const targetSide = targetBBox.sideNearestToPoint(route[last]);

    const routeStartPoint = route[1];
    const routeTargetPoint = route[last - 1];

    const startDistance = route[0].distance(routeStartPoint);
    const endDistance = route[last].distance(routeTargetPoint);
    const coeff = 0.6;

    let tangentStart;
    let tangentTarget;
    switch (sourceSide) {
        case 'top':
            tangentStart = new Point(0, -startDistance * coeff);
            break;
        case 'bottom':
            tangentStart = new Point(0, startDistance * coeff);
            break;
        case 'right':
            tangentStart = new Point(startDistance * coeff, 0);
            break;
        case 'left':
            tangentStart = new Point(-startDistance * coeff, 0);
            break;
    }
    switch (targetSide) {
        case 'top':
            tangentTarget = new Point(0, -endDistance * coeff);
            break;
        case 'bottom':
            tangentTarget = new Point(0, endDistance * coeff);
            break;
        case 'right':
            tangentTarget = new Point(endDistance * coeff, 0);
            break;
        case 'left':
            tangentTarget = new Point(-endDistance * coeff, 0);
            break;
    }

    return [tangentStart, tangentTarget];
}

function horizontalDirectionTangents(linkView, route, minOffset) {
    const { sourceBBox, targetBBox } = linkView;
    const sourceSide = sourceBBox.sideNearestToPoint(linkView.getEndConnectionPoint('source'));
    const targetSide = targetBBox.sideNearestToPoint(linkView.getEndConnectionPoint('target'));

    let sourceX;
    let targetX;

    const last = route.length - 1;
    const startDistance = route[0].distance(route[1]);
    const endDistance = route[last].distance(route[last - 1]);
    const coeff = 0.6;
    switch (sourceSide) {
        case 'left':
            sourceX = -startDistance * coeff;
            break;
        case 'right':
        default:
            sourceX = startDistance * coeff;
            break;
    }

    switch (targetSide) {
        case 'left':
            targetX = -endDistance * coeff;
            break;
        case 'right':
        default:
            targetX = endDistance * coeff;
            break;
    }

    return [new Point(sourceX, 0), new Point(targetX, 0)];
}

function verticalDirectionTangents(linkView, route, minOffset) {
    const { sourceBBox, targetBBox } = linkView;
    const sourceSide = sourceBBox.sideNearestToPoint(linkView.getEndConnectionPoint('source'));
    const targetSide = targetBBox.sideNearestToPoint(linkView.getEndConnectionPoint('target'));

    let sourceY;
    let targetY;

    const last = route.length - 1;
    const startDistance = route[0].distance(route[1]);
    const endDistance = route[last].distance(route[last - 1]);
    const coeff = 0.6;
    switch (sourceSide) {
        case 'top':
            sourceY = -startDistance * coeff;
            break;
        case 'bottom':
        default:
            sourceY = startDistance * coeff;
            break;
    }

    switch (targetSide) {
        case 'top':
            targetY = -endDistance * coeff;
            break;
        case 'bottom':
        default:
            targetY = endDistance * coeff;
            break;
    }

    return [new Point(0, sourceY), new Point(0, targetY)];
}

export const smooth = function(sourcePoint, targetPoint, route = [], opt = {}) {
    const linkView = this;

    const raw = Boolean(opt.raw);
    // minOffset - minimal proximal control point offset.
    const { minTangentMagnitude = 20, direction = Directions.AUTO } = opt;

    let path = new Path();
    path.appendSegment(Path.createSegment('M', sourcePoint));

    const completeRoute = [sourcePoint, ...route.map(p => new Point(p)), targetPoint];

    let tangents = [];
    switch (direction) {
        case Directions.LEGACY:
            tangents = legacyPoints(sourcePoint, targetPoint);
            break;
        case Directions.HORIZONTAL:
            tangents = horizontalDirectionTangents(linkView, completeRoute, minTangentMagnitude);
            break;
        case Directions.VERTICAL:
            tangents = verticalDirectionTangents(linkView, completeRoute, minTangentMagnitude);
            break;
        case Directions.AUTO:
        default:
            tangents = autoDirectionTangents(linkView, completeRoute, minTangentMagnitude);
            break;
    }

    const catmullRomCurves = createCatmullRomCurves([sourcePoint, ...route.map(p => new Point(p)), targetPoint], tangents[0], tangents[1], 0.5);
    const bezierCurves = catmullRomCurves.map(curve => catmullRomToBezier(curve, 0.5));
    path = new Path(bezierCurves);

    return (raw) ? path : path.serialize();
};

function rotateVector(vector, angle) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const x = cos * vector.x - sin * vector.y;
    const y = sin * vector.x + cos * vector.y;
    vector.x = x;
    vector.y = y;
}

function angleBetweenVectors(v1, v2) {
    let cos = v1.dot(v2) / (v1.magnitude() * v2.magnitude());
    if (cos < -1) cos = -1;
    if (cos > 1) cos = 1;
    return Math.acos(cos);
}

function determinant(v1, v2) {
    return v1.x * v2.y - v1.y * v2.x;
}

function createCatmullRomCurves(points, startTangent, endTangent, tension) {
    const tau = tension;
    const distances = [];
    const tangents = [];
    const catmullRomCurves = [];    
    const n = points.length - 1;

    for (let i = 0; i < n; i++) {
        distances[i] = points[i].distance(points[i + 1]);
    }

    tangents[0] = startTangent;
    tangents[n] = endTangent;      

    for (let i = 1; i < n; i++) {
        let tpPrev;
        let tpNext;
        if (i === 1) {
            tpPrev = points[i - 1].clone().offset(tangents[i - 1].x, tangents[i - 1].y);
        } else {
            tpPrev = points[i - 1].clone();
        }
        if (i === n - 1) {
            tpNext = points[i + 1].clone().offset(tangents[i + 1].x, tangents[i + 1].y); 
        } else {
            tpNext = points[i + 1].clone();
        }
        const v1 = tpPrev.difference(points[i]).normalize();
        const v2 = tpNext.difference(points[i]).normalize();
        const vAngle = angleBetweenVectors(v1, v2); 

        let rot = (Math.PI - vAngle) / 2;
        let t;
        const vectorDeterminant = determinant(v1, v2);
        if (vectorDeterminant < 0) {
            rot = -rot;
        }
        t = v2.clone();
        rotateVector(t, rot);

        let pointsDeterminant;
        if (n > 2) {
            pointsDeterminant = determinant(points[i].difference(tpNext), points[i].difference(tpPrev));
        } else {
            pointsDeterminant = determinant(points[i].difference(points[i + 1]), points[i].difference(points[i - 1]));
        }
        if ((rot < 0 && pointsDeterminant < 0) || (rot > 0 && pointsDeterminant > 0)) {
            t.x = -t.x;
            t.y = -t.y;
        }
        
        const t1 = t.clone();
        const scaleFactor1 = Math.max(distances[i - 1] / 1.5, 20);
        t1.scale(scaleFactor1, scaleFactor1);

        const t2 = t.clone();
        const scaleFactor2 = Math.max(distances[i] / 1.5, 20);
        t2.scale(scaleFactor2, scaleFactor2);

        tangents[i] = [t1, t2];
    }

    for (let i = 0; i < n; i++) {
        let p0;
        let p3;
        if (i === 0) {
            p0 = points[i + 1].difference(tangents[i].x / tau, tangents[i].y / tau); 
        } else {
            p0 = points[i + 1].difference(tangents[i][1].x / tau, tangents[i][1].y / tau);
        }
        if (i === n - 1) {
            p3 = points[i].clone().offset(tangents[i + 1].x / tau, tangents[i + 1].y / tau);
        } else {
            p3 = points[i].difference(tangents[i + 1][0].x / tau, tangents[i + 1][0].y / tau);
        }

        catmullRomCurves[i] = [p0, points[i], points[i + 1], p3];
    }
    return catmullRomCurves;
}

function catmullRomToBezier(points, tension) {
    const tau = tension;

    const bcp1 = new Point();
    bcp1.x = points[1].x + (points[2].x - points[0].x) / (6 * tau);
    bcp1.y = points[1].y + (points[2].y - points[0].y) / (6 * tau);

    const bcp2 = new Point();
    bcp2.x = points[2].x + (points[3].x - points[1].x) / (6 * tau);
    bcp2.y = points[2].y + (points[3].y - points[1].y) / (6 * tau);
    return new Curve(
        points[1],
        bcp1,
        bcp2,
        points[2]
    );
}