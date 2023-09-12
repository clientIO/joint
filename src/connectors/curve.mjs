import { Path, Point, Curve } from '../g/index.mjs';

const Directions = {
    AUTO: 'auto',
    HORIZONTAL: 'horizontal',
    VERTICAL: 'vertical',
    CLOSEST_POINT: 'closest-point',
    OUTWARDS: 'outwards'
};

const TangentDirections = {
    UP: 'up',
    DOWN: 'down',
    LEFT: 'left',
    RIGHT: 'right',
    AUTO: 'auto',
    CLOSEST_POINT: 'closest-point',
    OUTWARDS: 'outwards'
};

export const curve = function(sourcePoint, targetPoint, route = [], opt = {}, linkView) {
    const raw = Boolean(opt.raw);
    // distanceCoefficient - a coefficient of the tangent vector length relative to the distance between points.
    // angleTangentCoefficient - a coefficient of the end tangents length in the case of angles larger than 45 degrees.
    // tension - a Catmull-Rom curve tension parameter.
    // sourceTangent - a tangent vector along the curve at the sourcePoint.
    // sourceDirection - a unit direction vector along the curve at the sourcePoint.
    // targetTangent - a tangent vector along the curve at the targetPoint.
    // targetDirection - a unit direction vector along the curve at the targetPoint.
    // precision - a rounding precision for path values.
    const { direction = Directions.AUTO, precision = 3 } = opt;
    const options = {
        coeff: opt.distanceCoefficient || 0.6,
        angleTangentCoefficient: opt.angleTangentCoefficient || 80,
        tau: opt.tension || 0.5,
        sourceTangent: opt.sourceTangent ? new Point(opt.sourceTangent) : null,
        targetTangent: opt.targetTangent ? new Point(opt.targetTangent) : null,
        rotate: Boolean(opt.rotate)
    };
    if (typeof opt.sourceDirection === 'string')
        options.sourceDirection = opt.sourceDirection;
    else if (typeof opt.sourceDirection === 'number')
        options.sourceDirection = new Point(1, 0).rotate(null, opt.sourceDirection);
    else
        options.sourceDirection = opt.sourceDirection ? new Point(opt.sourceDirection).normalize() : null;

    if (typeof opt.targetDirection === 'string')
        options.targetDirection = opt.targetDirection;
    else if (typeof opt.targetDirection === 'number')
        options.targetDirection = new Point(1, 0).rotate(null, opt.targetDirection);
    else
        options.targetDirection = opt.targetDirection ? new Point(opt.targetDirection).normalize() : null;

    const completeRoute = [sourcePoint, ...route, targetPoint].map(p => new Point(p));

    // The calculation of a sourceTangent
    let sourceTangent;
    if (options.sourceTangent) {
        sourceTangent = options.sourceTangent;
    } else {
        const sourceDirection = getSourceTangentDirection(linkView, completeRoute, direction, options);
        const tangentLength = completeRoute[0].distance(completeRoute[1]) * options.coeff;
        const pointsVector = completeRoute[1].difference(completeRoute[0]).normalize();
        const angle = angleBetweenVectors(sourceDirection, pointsVector);
        if (angle > Math.PI / 4) {
            const updatedLength = tangentLength + (angle - Math.PI / 4) * options.angleTangentCoefficient;
            sourceTangent = sourceDirection.clone().scale(updatedLength, updatedLength);
        } else {
            sourceTangent = sourceDirection.clone().scale(tangentLength, tangentLength);
        }
    }

    // The calculation of a targetTangent
    let targetTangent;
    if (options.targetTangent) {
        targetTangent = options.targetTangent;
    } else {
        const targetDirection = getTargetTangentDirection(linkView, completeRoute, direction, options);
        const last = completeRoute.length - 1;
        const tangentLength = completeRoute[last - 1].distance(completeRoute[last]) * options.coeff;
        const pointsVector = completeRoute[last - 1].difference(completeRoute[last]).normalize();
        const angle = angleBetweenVectors(targetDirection, pointsVector);
        if (angle > Math.PI / 4) {
            const updatedLength = tangentLength + (angle - Math.PI / 4) * options.angleTangentCoefficient;
            targetTangent = targetDirection.clone().scale(updatedLength, updatedLength);
        } else {
            targetTangent = targetDirection.clone().scale(tangentLength, tangentLength);
        }
    }

    const catmullRomCurves = createCatmullRomCurves(completeRoute, sourceTangent, targetTangent, options);
    const bezierCurves = catmullRomCurves.map(curve => catmullRomToBezier(curve, options));
    const path = new Path(bezierCurves).round(precision);

    return (raw) ? path : path.serialize();
};
curve.Directions = Directions;
curve.TangentDirections = TangentDirections;

function getHorizontalSourceDirection(linkView, route, options) {
    const { sourceBBox } = linkView;

    let sourceSide;
    let rotation;
    if (!linkView.sourceView) {
        if (sourceBBox.x > route[1].x)
            sourceSide = 'right';
        else
            sourceSide = 'left';
    } else {
        rotation = linkView.sourceView.model.angle();
        if (options.rotate && rotation) {
            const unrotatedBBox = linkView.sourceView.getNodeUnrotatedBBox(linkView.sourceView.el);
            const sourcePoint = route[0].clone();
            sourcePoint.rotate(sourceBBox.center(), rotation);
            sourceSide = unrotatedBBox.sideNearestToPoint(sourcePoint);
        } else {
            sourceSide = sourceBBox.sideNearestToPoint(route[0]);
        }
    }

    let direction;
    switch (sourceSide) {
        case 'left':
            direction = new Point(-1, 0);
            break;
        case 'right':
        default:
            direction = new Point(1, 0);
            break;
    }

    if (options.rotate && rotation) {
        direction.rotate(null, -rotation);
    }

    return direction;
}

function getHorizontalTargetDirection(linkView, route, options) {
    const { targetBBox } = linkView;

    let targetSide;
    let rotation;
    if (!linkView.targetView) {
        if (targetBBox.x > route[route.length - 2].x)
            targetSide = 'left';
        else
            targetSide = 'right';
    } else {
        rotation = linkView.targetView.model.angle();
        if (options.rotate && rotation) {
            const unrotatedBBox = linkView.targetView.getNodeUnrotatedBBox(linkView.targetView.el);
            const targetPoint = route[route.length - 1].clone();
            targetPoint.rotate(targetBBox.center(), rotation);
            targetSide = unrotatedBBox.sideNearestToPoint(targetPoint);
        } else {
            targetSide = targetBBox.sideNearestToPoint(route[route.length - 1]);
        }
    }

    let direction;
    switch (targetSide) {
        case 'left':
            direction = new Point(-1, 0);
            break;
        case 'right':
        default:
            direction = new Point(1, 0);
            break;
    }

    if (options.rotate && rotation) {
        direction.rotate(null, -rotation);
    }

    return direction;
}

function getVerticalSourceDirection(linkView, route, options) {
    const { sourceBBox } = linkView;

    let sourceSide;
    let rotation;
    if (!linkView.sourceView) {
        if (sourceBBox.y > route[1].y)
            sourceSide = 'bottom';
        else
            sourceSide = 'top';
    } else {
        rotation = linkView.sourceView.model.angle();
        if (options.rotate && rotation) {
            const unrotatedBBox = linkView.sourceView.getNodeUnrotatedBBox(linkView.sourceView.el);
            const sourcePoint = route[0].clone();
            sourcePoint.rotate(sourceBBox.center(), rotation);
            sourceSide = unrotatedBBox.sideNearestToPoint(sourcePoint);
        } else {
            sourceSide = sourceBBox.sideNearestToPoint(route[0]);
        }
    }

    let direction;
    switch (sourceSide) {
        case 'top':
            direction = new Point(0, -1);
            break;
        case 'bottom':
        default:
            direction = new Point(0, 1);
            break;
    }

    if (options.rotate && rotation) {
        direction.rotate(null, -rotation);
    }

    return direction;
}

function getVerticalTargetDirection(linkView, route, options) {
    const { targetBBox } = linkView;

    let targetSide;
    let rotation;
    if (!linkView.targetView) {
        if (targetBBox.y > route[route.length - 2].y)
            targetSide = 'top';
        else
            targetSide = 'bottom';
    } else {
        rotation = linkView.targetView.model.angle();
        if (options.rotate && rotation) {
            const unrotatedBBox = linkView.targetView.getNodeUnrotatedBBox(linkView.targetView.el);
            const targetPoint = route[route.length - 1].clone();
            targetPoint.rotate(targetBBox.center(), rotation);
            targetSide = unrotatedBBox.sideNearestToPoint(targetPoint);
        } else {
            targetSide = targetBBox.sideNearestToPoint(route[route.length - 1]);
        }
    }


    let direction;
    switch (targetSide) {
        case 'top':
            direction = new Point(0, -1);
            break;
        case 'bottom':
        default:
            direction = new Point(0, 1);
            break;
    }

    if (options.rotate && rotation) {
        direction.rotate(null, -rotation);
    }

    return direction;
}

function getAutoSourceDirection(linkView, route, options) {
    const { sourceBBox } = linkView;

    let sourceSide;
    let rotation;
    if (!linkView.sourceView) {
        sourceSide = sourceBBox.sideNearestToPoint(route[1]);
    } else {
        rotation = linkView.sourceView.model.angle();
        if (options.rotate && rotation) {
            const unrotatedBBox = linkView.sourceView.getNodeUnrotatedBBox(linkView.sourceView.el);
            const sourcePoint = route[0].clone();
            sourcePoint.rotate(sourceBBox.center(), rotation);
            sourceSide = unrotatedBBox.sideNearestToPoint(sourcePoint);
        } else {
            sourceSide = sourceBBox.sideNearestToPoint(route[0]);
        }
    }

    let direction;
    switch (sourceSide) {
        case 'top':
            direction = new Point(0, -1);
            break;
        case 'bottom':
            direction = new Point(0, 1);
            break;
        case 'right':
            direction = new Point(1, 0);
            break;
        case 'left':
            direction = new Point(-1, 0);
            break;
    }

    if (options.rotate && rotation) {
        direction.rotate(null, -rotation);
    }

    return direction;
}

function getAutoTargetDirection(linkView, route, options) {
    const { targetBBox } = linkView;

    let targetSide;
    let rotation;
    if (!linkView.targetView) {
        targetSide = targetBBox.sideNearestToPoint(route[route.length - 2]);
    } else {
        rotation = linkView.targetView.model.angle();
        if (options.rotate && rotation) {
            const unrotatedBBox = linkView.targetView.getNodeUnrotatedBBox(linkView.targetView.el);
            const targetPoint = route[route.length - 1].clone();
            targetPoint.rotate(targetBBox.center(), rotation);
            targetSide = unrotatedBBox.sideNearestToPoint(targetPoint);
        } else {
            targetSide = targetBBox.sideNearestToPoint(route[route.length - 1]);
        }
    }

    let direction;
    switch (targetSide) {
        case 'top':
            direction = new Point(0, -1);
            break;
        case 'bottom':
            direction = new Point(0, 1);
            break;
        case 'right':
            direction = new Point(1, 0);
            break;
        case 'left':
            direction = new Point(-1, 0);
            break;
    }

    if (options.rotate && rotation) {
        direction.rotate(null, -rotation);
    }

    return direction;
}

function getClosestPointSourceDirection(linkView, route, options) {
    return route[1].difference(route[0]).normalize();
}

function getClosestPointTargetDirection(linkView, route, options) {
    const last = route.length - 1;
    return route[last - 1].difference(route[last]).normalize();
}

function getOutwardsSourceDirection(linkView, route, options) {
    const { sourceBBox } = linkView;
    const sourceCenter = sourceBBox.center();
    return route[0].difference(sourceCenter).normalize();
}

function getOutwardsTargetDirection(linkView, route, options) {
    const { targetBBox } = linkView;
    const targetCenter = targetBBox.center();
    return route[route.length - 1].difference(targetCenter).normalize();
}

function getSourceTangentDirection(linkView, route, direction, options) {
    if (options.sourceDirection) {
        switch (options.sourceDirection) {
            case TangentDirections.UP:
                return new Point(0, -1);
            case TangentDirections.DOWN:
                return new Point(0, 1);
            case TangentDirections.LEFT:
                return new Point(-1, 0);
            case TangentDirections.RIGHT:
                return new Point(1, 0);
            case TangentDirections.AUTO:
                return getAutoSourceDirection(linkView, route, options);
            case TangentDirections.CLOSEST_POINT:
                return getClosestPointSourceDirection(linkView, route, options);
            case TangentDirections.OUTWARDS:
                return getOutwardsSourceDirection(linkView, route, options);
            default:
                return options.sourceDirection;
        }
    }

    switch (direction) {
        case Directions.HORIZONTAL:
            return getHorizontalSourceDirection(linkView, route, options);
        case Directions.VERTICAL:
            return getVerticalSourceDirection(linkView, route, options);
        case Directions.CLOSEST_POINT:
            return getClosestPointSourceDirection(linkView, route, options);
        case Directions.OUTWARDS:
            return getOutwardsSourceDirection(linkView, route, options);
        case Directions.AUTO:
        default:
            return getAutoSourceDirection(linkView, route, options);
    }
}

function getTargetTangentDirection(linkView, route, direction, options) {
    if (options.targetDirection) {
        switch (options.targetDirection) {
            case TangentDirections.UP:
                return new Point(0, -1);
            case TangentDirections.DOWN:
                return new Point(0, 1);
            case TangentDirections.LEFT:
                return new Point(-1, 0);
            case TangentDirections.RIGHT:
                return new Point(1, 0);
            case TangentDirections.AUTO:
                return getAutoTargetDirection(linkView, route, options);
            case TangentDirections.CLOSEST_POINT:
                return getClosestPointTargetDirection(linkView, route, options);
            case TangentDirections.OUTWARDS:
                return getOutwardsTargetDirection(linkView, route, options);
            default:
                return options.targetDirection;
        }
    }

    switch (direction) {
        case Directions.HORIZONTAL:
            return getHorizontalTargetDirection(linkView, route, options);
        case Directions.VERTICAL:
            return getVerticalTargetDirection(linkView, route, options);
        case Directions.CLOSEST_POINT:
            return getClosestPointTargetDirection(linkView, route, options);
        case Directions.OUTWARDS:
            return getOutwardsTargetDirection(linkView, route, options);
        case Directions.AUTO:
        default:
            return getAutoTargetDirection(linkView, route, options);
    }
}

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

function createCatmullRomCurves(points, sourceTangent, targetTangent, options) {
    const { tau, coeff } = options;
    const distances = [];
    const tangents = [];
    const catmullRomCurves = [];
    const n = points.length - 1;

    for (let i = 0; i < n; i++) {
        distances[i] = points[i].distance(points[i + 1]);
    }

    tangents[0] = sourceTangent;
    tangents[n] = targetTangent;

    // The calculation of tangents of vertices
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
        let pointsDeterminant;
        pointsDeterminant = determinant(points[i].difference(points[i + 1]), points[i].difference(points[i - 1]));
        if (vectorDeterminant < 0) {
            rot = -rot;
        }
        if ((vAngle < Math.PI / 2) && ((rot < 0 && pointsDeterminant < 0) || (rot > 0 && pointsDeterminant > 0))) {
            rot = rot - Math.PI;
        }
        t = v2.clone();
        rotateVector(t, rot);

        const t1 = t.clone();
        const t2 = t.clone();
        const scaleFactor1 = distances[i - 1] * coeff;
        const scaleFactor2 = distances[i] * coeff;
        t1.scale(scaleFactor1, scaleFactor1);
        t2.scale(scaleFactor2, scaleFactor2);

        tangents[i] = [t1, t2];
    }

    // The building of a Catmull-Rom curve based of tangents of points
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

// The function to convert Catmull-Rom curve to Bezier curve using the tension (tau)
function catmullRomToBezier(points, options) {
    const { tau } = options;

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
