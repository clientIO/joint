import { Path, Point, Curve } from '../g/index.mjs';

export const Directions = {
    AUTO: 'auto',
    HORIZONTAL: 'horizontal',
    VERTICAL: 'vertical',
    CENTRAL: 'central'
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
    CENTRAL: 'central'
};

function getTangentDirection(tangentDirectionOption, p1, p2) {
    switch(tangentDirectionOption) {
        case TangentDirections.UP:
            return new Point(0, -1);
        case TangentDirections.DOWN:
            return new Point(0, 1);
        case TangentDirections.LEFT:
            return new Point(-1, 0);
        case TangentDirections.RIGHT:
            return new Point(0, 1);
        case TangentDirections.CENTRAL:
            return p2.difference(p1).normalize();
        default:
            return tangentDirectionOption;
    }
}

function autoDirectionTangents(linkView, route, options) {
    const { sourceBBox, targetBBox } = linkView;
    const { coeff } = options;

    let sourceTangent;
    if (options.sourceTangent) {
        sourceTangent = options.sourceTangent;
    } else {
        const tangentLength = route[0].distance(route[1]) * coeff;
        if (options.sourceDirection) {
            sourceTangent = getTangentDirection(options.sourceDirection, route[0], route[1]).clone()
                .scale(tangentLength, tangentLength);
        } else {
            const sourceSide = sourceBBox.sideNearestToPoint(route[0]);
            switch (sourceSide) {
                case 'top':
                    sourceTangent = new Point(0, -tangentLength);
                    break;
                case 'bottom':
                    sourceTangent = new Point(0, tangentLength);
                    break;
                case 'right':
                    sourceTangent = new Point(tangentLength, 0);
                    break;
                case 'left':
                    sourceTangent = new Point(-tangentLength, 0);
                    break;
            }
        }
    }
    
    let targetTangent;
    if (options.targetTangent) {
        targetTangent = options.targetTangent;
    } else {
        const last = route.length - 1;
        const tangentLength = route[last].distance(route[last - 1]) * coeff;
        if (options.targetDirection) {
            targetTangent = getTangentDirection(options.sourceDirection, route[last], route[last - 1]).clone()
                .scale(tangentLength, tangentLength);
        } else {
            const targetSide = targetBBox.sideNearestToPoint(route[last]);
            switch (targetSide) {
                case 'top':
                    targetTangent = new Point(0, -tangentLength);
                    break;
                case 'bottom':
                    targetTangent = new Point(0, tangentLength);
                    break;
                case 'right':
                    targetTangent = new Point(tangentLength, 0);
                    break;
                case 'left':
                    targetTangent = new Point(-tangentLength, 0);
                    break;
            }
        }
    }

    return [sourceTangent, targetTangent];
}

function centralDirectionTangents(linkView, route, options) {
    const { coeff } = options;

    let sourceTangent;
    if (options.sorceTangent) {
        sourceTangent = options.sourceTangent;
    } else {
        const nextPoint = route[1];
        const tangentLength = route[0].distance(nextPoint) * coeff;
        if (options.sourceDirection) {
            sourceTangent = getTangentDirection(options.sourceDirection, route[0], nextPoint).clone()
                .scale(tangentLength, tangentLength);
        } else {
            sourceTangent = nextPoint.difference(route[0]).normalize().scale(tangentLength, tangentLength);
        }
    }

    let targetTangent;
    if (options.targetTangent) {
        targetTangent = options.targetTangent;
    } else {
        const last = route.length - 1;
        const prevPoint = route[last - 1];
        const tangentLength = route[last].distance(prevPoint) * coeff;
        if (options.targetDirection) {
            targetTangent = getTangentDirection(options.sourceDirection, route[last], prevPoint).clone()
                .scale(tangentLength, tangentLength);
        } else {
            targetTangent = prevPoint.difference(route[last]).normalize().scale(tangentLength, tangentLength);
        }
    }

    return [sourceTangent, targetTangent];
}

function horizontalDirectionTangents(linkView, route, options) {
    const { sourceBBox, targetBBox } = linkView;
    const { coeff, angleTangentCoefficient } = options;

    let sourceTangent;
    if (options.sourceTangent) {
        sourceTangent = options.sorceTangent;
    } else {
        const nextPoint = route[1];
        const tangentLength = route[0].distance(nextPoint) * coeff;
        if (options.sourceDirection) {
            sourceTangent = getTangentDirection(options.sourceDirection, route[0], nextPoint).clone()
                .scale(tangentLength, tangentLength);
        } else {
            const pointsVector = route[1].difference(route[0]).normalize();
            const sourceSide = sourceBBox.sideNearestToPoint(route[0]);
            switch (sourceSide) {
                case 'left': {
                    const angle = angleBetweenVectors(new Point(-1, 0), pointsVector);
                    if (angle > Math.PI / 4) {
                        sourceTangent = new Point(-tangentLength - (angle - Math.PI / 4) * angleTangentCoefficient, 0);
                    } else {
                        sourceTangent = new Point(-tangentLength, 0);
                    }
                    break;
                }   
                case 'right':
                default: {
                    const angle = angleBetweenVectors(new Point(1, 0), pointsVector);
                    if (angle > Math.PI / 4) {
                        sourceTangent = new Point(tangentLength + (angle - Math.PI / 4) * angleTangentCoefficient, 0);
                    } else {
                        sourceTangent = new Point(tangentLength, 0);
                    }
                    break;
                }
            }
        }
    }
    
    let targetTangent;
    if (options.targetTangent) {
        targetTangent = options.targetTangent;
    } else {
        const last = route.length - 1;
        const prevPoint = route[last - 1];
        const tangentLength = route[last].distance(prevPoint) * coeff;
        if (options.targetDirection) {
            targetTangent = getTangentDirection(options.sourceDirection, route[last], prevPoint).clone()
                .scale(tangentLength, tangentLength);
        } else {
            const pointsVector = route[last - 1].difference(route[last]).normalize();
            const targetSide = targetBBox.sideNearestToPoint(route[last]);
            switch (targetSide) {
                case 'left': {
                    const angle = angleBetweenVectors(new Point(-1, 0), pointsVector);
                    if (angle > Math.PI / 4) {
                        targetTangent = new Point(-tangentLength - (angle - Math.PI / 4) * angleTangentCoefficient, 0);
                    } else {
                        targetTangent = new Point(-tangentLength, 0);
                    }
                    break;
                }   
                case 'right':
                default: {
                    const angle = angleBetweenVectors(new Point(1, 0), pointsVector);
                    if (angle > Math.PI / 4) {
                        targetTangent = new Point(tangentLength + (angle - Math.PI / 4) * angleTangentCoefficient, 0);
                    } else {
                        targetTangent = new Point(tangentLength, 0);
                    }
                    break;
                }
            }
        }
    }

    return [sourceTangent, targetTangent];
}

function verticalDirectionTangents(linkView, route, options) {
    const { sourceBBox, targetBBox } = linkView;
    const { coeff, angleTangentCoefficient } = options;

    let sourceTangent;
    if (options.sourceTangent) {
        sourceTangent = options.sourceTangent;
    } else {
        const nextPoint = route[1];
        const tangentLength = route[0].distance(nextPoint) * coeff;
        if (options.sourceDirection) {
            sourceTangent = getTangentDirection(options.sourceDirection, route[0], nextPoint).clone()
                .scale(tangentLength, tangentLength);
        } else {
            const pointsVector = route[1].difference(route[0]).normalize();
            const sourceSide = sourceBBox.sideNearestToPoint(route[0]);
            switch (sourceSide) {
                case 'top': {
                    const angle = angleBetweenVectors(new Point(0, -1), pointsVector);
                    if (angle > Math.PI / 4) {
                        sourceTangent = new Point(0, -tangentLength - (angle - Math.PI / 4) * angleTangentCoefficient);
                    } else {
                        sourceTangent = new Point(0, -tangentLength);
                    }
                    break;
                }   
                case 'bottom':
                default: {
                    const angle = angleBetweenVectors(new Point(0, 1), pointsVector);
                    if (angle > Math.PI / 4) {
                        sourceTangent = new Point(0, tangentLength + (angle - Math.PI / 4) * angleTangentCoefficient);
                    } else {
                        sourceTangent = new Point(0, tangentLength);
                    }
                    break;
                }
            }
        }
    }
    
    let targetTangent;
    if (options.targetTangent) {
        targetTangent = options.targetTangent;
    } else {
        const last = route.length - 1;
        const prevPoint = route[last - 1];
        const tangentLength = route[last].distance(prevPoint) * coeff;
        if (options.targetDirection) {
            targetTangent = getTangentDirection(options.sourceDirection, route[last], prevPoint).clone()
                .scale(tangentLength, tangentLength);
        } else {
            const pointsVector = route[last - 1].difference(route[last]).normalize();
            const targetSide = targetBBox.sideNearestToPoint(route[last]);
            switch (targetSide) {
                case 'top': {
                    const angle = angleBetweenVectors(new Point(0, -1), pointsVector);
                    if (angle > Math.PI / 4) {
                        targetTangent = new Point(0, -tangentLength - (angle - Math.PI / 4) * angleTangentCoefficient);
                    } else {
                        targetTangent = new Point(0, -tangentLength);
                    }
                    break;
                }
                case 'bottom':
                default: {
                    const angle = angleBetweenVectors(new Point(0, 1), pointsVector);
                    if (angle > Math.PI / 4) {
                        targetTangent = new Point(0, tangentLength + (angle - Math.PI / 4) * angleTangentCoefficient);
                    } else {
                        targetTangent = new Point(0, tangentLength);
                    }
                    break;
                }
            }
        }
    }

    return [sourceTangent, targetTangent];
}

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

export const smooth = function(sourcePoint, targetPoint, route = [], opt = {}) {
    const linkView = this;
    const { sourceBBox, targetBBox } = linkView;

    const raw = Boolean(opt.raw);
    // distanceCoefficient - coefficient of a relation between the points distance and tangents length.
    // angleTangentCoefficient - coefficient of an increasing of the end tangents depending on the angle between the tangent and a vector towards the next point.
    // tension - Catmull-Rom curve tension parameter.
    const { direction = Directions.AUTO, algorithm = Algorithms.LEGACY } = opt;
    const options = {
        coeff: opt.distanceCoefficient || 0.6,
        angleTangentCoefficient: opt.angleTangentCoefficient || 80,
        tau: opt.tension || 0.5,
        sourceTangent: opt.sourceTangent, 
        targetTangent: opt.targetTangent,
        sourceDirection: opt.sourceDirection,
        targetDirection: opt.targetDirection
    };

    if (!sourceBBox.width || !sourceBBox.height) 
        options.sourceDirection = TangentDirections.CENTRAL;

    if (!targetBBox.width || !targetBBox.height) 
        options.targetDirection = TangentDirections.NEXT_POINT;

    switch (algorithm) {
        case Algorithms.NEW: {
            const completeRoute = [sourcePoint, ...route.map(p => new Point(p)), targetPoint];
            let tangents = [];            
            switch (direction) {
                case Directions.HORIZONTAL:
                    tangents = horizontalDirectionTangents(linkView, completeRoute, options);
                    break;
                case Directions.VERTICAL:
                    tangents = verticalDirectionTangents(linkView, completeRoute, options);
                    break;
                case Directions.CENTRAL:
                    tangents = centralDirectionTangents(linkView, completeRoute, options);
                    break;
                case Directions.AUTO:
                default:
                    tangents = autoDirectionTangents(linkView, completeRoute, options);
                    break;
            }           
            const catmullRomCurves = createCatmullRomCurves([sourcePoint, ...route.map(p => new Point(p)), targetPoint], tangents[0], tangents[1], options);
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