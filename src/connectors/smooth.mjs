import { Path, Point, Curve } from '../g/index.mjs';

export const Directions = {
    AUTO: 'auto',
    HORIZONTAL: 'horizontal',
    VERTICAL: 'vertical',
    CLOSEST_POINT: 'closestPoint',
    OUTWARDS: 'outwards'
};

export const Algorithms = {
    LEGACY: 'legacy',
    NEW: 'new'
};

export const TangentDirections = {
    UP: 'up',
    DOWN: 'down',
    LEFT: 'left',
    RIGHT: 'right',
    AUTO: 'auto',
    CLOSEST_POINT: 'closestPoint',
    OUTWARDS: 'outwards'
};

function getHorizontalSourceDirection(linkView, route, options) {
    const { sourceBBox } = linkView;

    const sourceSide = sourceBBox.sideNearestToPoint(route[0]);
    switch (sourceSide) {
        case 'left': {
            return new Point(-1, 0);
        }   
        case 'right':
        default: {
            return new Point(1, 0);
        }
    }
}

function getHorizontalTargetDirection(linkView, route, options) {
    const { targetBBox } = linkView;

    const targetSide = targetBBox.sideNearestToPoint(route[route.length - 1]);
    switch (targetSide) {
        case 'left': {
            return new Point(-1, 0);
        }   
        case 'right':
        default: {
            return new Point(1, 0);
        }
    }
}

function getVerticalSourceDirection(linkView, route, options) {
    const { sourceBBox } = linkView;

    const sourceSide = sourceBBox.sideNearestToPoint(route[0]);
    switch (sourceSide) {
        case 'top': {
            return new Point(0, -1);
        }   
        case 'bottom':
        default: {
            return new Point(0, 1);
        }
    }
}

function getVerticalTargetDirection(linkView, route, options) {
    const { targetBBox } = linkView;

    const targetSide = targetBBox.sideNearestToPoint(route[route.length - 1]);
    switch (targetSide) {
        case 'top': {
            return new Point(0, -1);
        }   
        case 'bottom':
        default: {
            return new Point(0, 1);
        }
    }
}

function getAutoSourceDirection(linkView, route, options) {
    const { sourceBBox } = linkView;

    const sourceSide = sourceBBox.sideNearestToPoint(route[0]);
    switch (sourceSide) {
        case 'top':
            return new Point(0, -1);
        case 'bottom':
            return new Point(0, 1);
        case 'right':
            return new Point(1, 0);
        case 'left':
            return new Point(-1, 0);
    }
}

function getAutoTargetDirection(linkView, route, options) {
    const { targetBBox } = linkView;

    const targetSide = targetBBox.sideNearestToPoint(route[route.length - 1]);
    switch (targetSide) {
        case 'top':
            return new Point(0, -1);
        case 'bottom':
            return new Point(0, 1);
        case 'right':
            return new Point(1, 0);
        case 'left':
            return new Point(-1, 0);
    }
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
        switch(options.sourceDirection) {
            case TangentDirections.UP:
                return new Point(0, -1);
            case TangentDirections.DOWN:
                return new Point(0, 1);
            case TangentDirections.LEFT:
                return new Point(-1, 0);
            case TangentDirections.RIGHT:
                return new Point(0, 1);
            case TangentDirections.AUTO:
                return getAutoSourceDirection(linkView, route, options);    
            case TangentDirections.CLOSEST_POINT:
                return getClosestPointSourceDirection(linkView, route, options);
            case TangentDirections.OUTWARDS: {
                return getOutwardsSourceDirection(linkView, route, options);
            }
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
        switch(options.targetDirection) {
            case TangentDirections.UP:
                return new Point(0, -1);
            case TangentDirections.DOWN:
                return new Point(0, 1);
            case TangentDirections.LEFT:
                return new Point(-1, 0);
            case TangentDirections.RIGHT:
                return new Point(0, 1);
            case TangentDirections.AUTO:
                return getAutoTargetDirection(linkView, route, options);    
            case TangentDirections.CLOSEST_POINT:
                return getClosestPointTargetDirection(linkView, route, options);
            case TangentDirections.OUTWARDS: {
                return getOutwardsTargetDirection(linkView, route, options);
            }
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

export const smooth = function(sourcePoint, targetPoint, route = [], opt = {}, linkView) {
    const { sourceBBox, targetBBox } = linkView;

    const raw = Boolean(opt.raw);
    // distanceCoefficient - coefficient of a relation between the points distance and tangents length.
    // angleTangentCoefficient - coefficient of an increasing of the end tangents depending on the angle between the tangent and a vector towards the next point.
    // tension - Catmull-Rom curve tension parameter.
    const { direction = Directions.AUTO, algorithm = Algorithms.LEGACY } = opt;
    const options = {
        coeff: opt.distanceCoefficient || 0.6,
        angleTangentCoefficient: opt.angleTangentCoefficient || 80,
        tau: opt.tension || 0.5
    };
    if (typeof opt.sourceTangent === 'string') 
        options.sourceTangent = opt.sourceTangent;
    else 
        options.sourceTangent = opt.sourceTangent ? new Point(opt.sourceTangent) : null;
    if (typeof opt.targetTangent === 'string') 
        options.targetTangent = opt.targetTangent;
    else 
        options.targetTangent = opt.targetTangent ? new Point(opt.targetTangent) : null;
    if (typeof opt.sourceDirection === 'string') 
        options.sourceDirection = opt.sourceDirection;
    else 
        options.sourceDirection = opt.sourceDirection ? new Point(opt.sourceDirection) : null;
    if (typeof opt.targetDirection === 'string') 
        options.targetDirection = opt.targetDirection;
    else 
        options.targetDirection = opt.targetDirection ? new Point(opt.targetDirection) : null;

    if ((!sourceBBox.width || !sourceBBox.height) && !options.sourceDirection) 
        options.sourceDirection = TangentDirections.CLOSEST_POINT;
    if ((!targetBBox.width || !targetBBox.height) && !options.targetDirection) 
        options.targetDirection = TangentDirections.CLOSEST_POINT;

    switch (algorithm) {
        case Algorithms.NEW: {
            const completeRoute = [sourcePoint, ...route.map(p => new Point(p)), targetPoint];
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
            const path = new Path(bezierCurves);
        
            return (raw) ? path : path.serialize();
        }
        case Algorithms.LEGACY:
        default: {
            let path;
            if (route && route.length !== 0) {
                const points = [sourcePoint].concat(route).concat([targetPoint]);
                const curves = Curve.throughPoints(points);
        
                path = new Path(curves);
            } else {
                path = legacyPathWithoutRoute(sourcePoint, targetPoint);
            }
            return (raw) ? path : path.serialize();
        }
    }
};

function legacyPathWithoutRoute(sourcePoint, targetPoint) {
    const path = new Path();

    let segment = Path.createSegment('M', sourcePoint);
    path.appendSegment(segment);

    if ((Math.abs(sourcePoint.x - targetPoint.x)) >= (Math.abs(sourcePoint.y - targetPoint.y))) {
        const controlPointX = (sourcePoint.x + targetPoint.x) / 2;

        segment = Path.createSegment('C', controlPointX, sourcePoint.y, controlPointX, targetPoint.y, targetPoint.x, targetPoint.y);
        path.appendSegment(segment);
    } else {
        const controlPointY = (sourcePoint.y + targetPoint.y) / 2;

        segment = Path.createSegment('C', sourcePoint.x, controlPointY, targetPoint.x, controlPointY, targetPoint.x, targetPoint.y);
        path.appendSegment(segment);
    }    

    return path;
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