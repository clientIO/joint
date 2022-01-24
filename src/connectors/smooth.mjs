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

function autoDirectionTangents(linkView, sourcePoint, targetPoint, route, minTangentMagnitude) {
    const { sourceBBox, targetBBox } = linkView;
    const sourceSide = sourceBBox.sideNearestToPoint(sourcePoint);
    const targetSide = targetBBox.sideNearestToPoint(targetPoint);

    const routeStartPoint = route[0] ? new Point(route[0]) : null;
    const routeTargetPoint = route[route.length - 1] ? new Point(route[route.length - 1]) : null;

    const offsetAnchorStart = routeStartPoint || targetPoint;
    const offsetStart = Math.max(sourcePoint.distance(offsetAnchorStart), minTangentMagnitude);

    const offsetAnchorTarget = routeTargetPoint || sourcePoint;
    const offsetTarget = Math.max(targetPoint.distance(offsetAnchorTarget), minTangentMagnitude);

    let tangentStart;
    let tangentTarget;
    switch (sourceSide) {
        case 'top':
            tangentStart = new Point(0, -offsetStart);
            break;
        case 'bottom':
            tangentStart = new Point(0, offsetStart);
            break;
        case 'right':
            tangentStart = new Point(offsetStart, 0);
            break;
        case 'left':
            tangentStart = new Point(-offsetStart, 0);
            break;
    }
    switch (targetSide) {
        case 'top':
            tangentTarget = new Point(0, offsetTarget);
            break;
        case 'bottom':
            tangentTarget = new Point(0, -offsetTarget);
            break;
        case 'right':
            tangentTarget = new Point(-offsetTarget, 0);
            break;
        case 'left':
            tangentTarget = new Point(offsetTarget, 0);
            break;
    }

    return [tangentStart, tangentTarget];
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
    const { minTangentMagnitude = 100, direction = Directions.AUTO } = opt;

    let path = new Path();
    path.appendSegment(Path.createSegment('M', sourcePoint));

    let tangents = [];
    switch (direction) {
        case Directions.LEGACY:
            tangents = legacyPoints(sourcePoint, targetPoint);
            break;
        case Directions.HORIZONTAL:
            tangents = horizontalDirectionPoints(linkView, sourcePoint, targetPoint, minTangentMagnitude);
            break;
        case Directions.VERTICAL:
            tangents = verticalDirectionPoints(linkView, sourcePoint, targetPoint, minTangentMagnitude);
            break;
        case Directions.AUTO:
        default:
            tangents = autoDirectionTangents(linkView, sourcePoint, targetPoint, route, minTangentMagnitude);
            break;
    }

    const curves = catmullRomSpline([sourcePoint, ...route.map(p => new Point(p)), targetPoint]);
    //const curves = createBezierSpline([sourcePoint, ...route.map(p => new Point(p)), targetPoint], tangents[0], tangents[1]);
    path = new Path(curves);
    /*if (true) {
            if (true) {
                //let curves = Curve.throughPoints([sourcePoint, ...route, targetPoint]);
                //let curves = throughPointsExtended([sourcePoint, ...route, targetPoint], points[0], points[1]);
                if (route.length > 0) {
                    //curves = createBezierSpline([sourcePoint, ...route, targetPoint]);
                }
                
                const last = curves.length - 1;
                const diff1 = points[0].difference(curves[0].controlPoint1);
                const diff2 = points[1].difference(curves[last].controlPoint2);
                //console.log([diff1, diff2]);
                //const normalizedDiff = new Point(Math.abs(diff2.x) - Math.abs(diff1.x), Math.abs(diff2.y) - Math.abs(diff1.y));
                curves[0].controlPoint1 = new Point(points[0]);
                //curves[0].controlPoint2 = curves[0].controlPoint2.clone().offset(diff1);
                //curves[last].controlPoint1 = curves[last].controlPoint1.clone().offset(new Point(-diff1.x, -diff1.y));
                curves[last].controlPoint2 = new Point(points[1]);
                //curves[last - 1].controlPoint2 = points[1];//new Point(points[1].x, points[1].y - diff1.y);
                //curves[last].controlPoint1 = new Point(curves[last].controlPoint1.x + diff1.x + diff2.x, points[1].y - diff1.y); //curves[last].controlPoint1.clone().offset(new Point(-diff2.x, -diff2.y));
                path = new Path(curves);        
            } else {
                path = new Path([new Curve(sourcePoint, points[0], points[1], targetPoint)]);
            }
        }
        else {
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
                        const tension1x = (next.x - cps[0].x) / 3 * tension;
                        const tension1y = (next.y - cps[0].y) / 3 * tension;         
                        cps[1] = new Point(cps[0].x - tension1x, cps[0].y - tension1y);
                    }
                }
                
                path.appendSegment(Path.createSegment('C', cps[0], cps[1], cps[2]));

                cps[0] = new Point(cps[2].x + (cps[2].x - cps[1].x), cps[2].y + (cps[2].y - cps[1].y));
                cps[1] = null;
            }
        }*/

    return (raw) ? path : path.serialize();
};

function createBezierSpline(points, tangentStart, tangentEnd) {
    const n = points.length - 1;
    const eqCount = 2 * (n - 1) + 2;
    const a = [];
    for (let i = 0; i < n; i++) {
        a.push(1 / points[i].distance(points[i + 1]));
    }

    if (n === 1) {
        const controlPoint1 = new Point((tangentStart.x + 3 * points[0].x) / 3, (tangentStart.y + 3 * points[0].y) / 3);
        const controlPoint2 = new Point((3 * points[1].x - tangentEnd.x) / 3, (3 * points[1].y - tangentEnd.y) / 3);

        return [new Curve(points[0], controlPoint1, controlPoint2, points[1])];
    }

    const cx = [];
    const cy = [];
    for (let i = 0; i < eqCount; i++) {
        const cN = (i + 1) / 2 >> 0;
        if (i === 0) {
            cx[i] = tangentStart.x + 3 * points[0].x;
            cy[i] = tangentStart.y + 3 * points[0].y;
        } else if (i === eqCount - 1) {
            cx[i] = 3 * points[n].x - tangentEnd.x;
            cy[i] = 3 * points[n].y - tangentEnd.y;
        } else {
            if (i % 2) {
                cx[i] = a[cN] * a[cN] * points[cN].x - a[cN - 1] * a[cN - 1] * points[cN - 1].x;
                cy[i] = a[cN] * a[cN] * points[cN].y - a[cN - 1] * a[cN - 1] * points[cN - 1].y;
            } else {
                cx[i] = (a[cN] + a[cN - 1]) * points[cN].x;
                cy[i] = (a[cN] + a[cN - 1]) * points[cN].y;
            }
        }
    }

    const rows = [];
    for (let i = 0; i < eqCount; i++) {
        const row = new Array(eqCount).fill(0);
        if (i === 0) {
            row[i] = 3;
        } else if (i === eqCount - 1) {
            row[i] = 3;
        } else {
            const cN = (i + 1) / 2 >> 0;
            if (i % 2) {
                row[i - 1] = a[cN - 1] * a[cN - 1];
                row[i] = -2 * a[cN - 1] * a[cN - 1];
                row[i + 1] = 2 * a[cN] * a[cN];
                row[i + 2] = -a[cN] * a[cN];
            } else {
                row[i - 1] = a[cN - 1];
                row[i] = a[cN];
            }
        }
        rows.push(row);
    }

    const rowsx = rows.map((row, i) => {
        const newRow = [...row];
        newRow.push(cx[i]);
        return newRow;
    });

    const rowsy = rows.map((row, i) => {
        const newRow = [...row];
        newRow.push(cy[i]);
        return newRow;
    });

    const resultX = reducedRowEchelonForm(rowsx).map(row => row[eqCount]);
    const resultY = reducedRowEchelonForm(rowsy).map(row => row[eqCount]);

    const curves = [];
    for (let i = 0; i < n; i++) {
        let controlPoint1 = new Point(resultX[i * 2], resultY[i * 2]);
        let controlPoint2 = new Point(resultX[i * 2 + 1], resultY[i * 2 + 1]);

        curves.push(new Curve(points[i], controlPoint1, controlPoint2, points[i + 1]));
    }

    return curves;
}

function reducedRowEchelonForm(matrix) {
    var knownPivotColumns = []; // this is our one piece of iffy state-keeping :(

    // Copy the input matrix (reusing the variable name) so we have a local copy to work on
    matrix = matrix.map(row => [...row]);

    // Now, go through the matrix and do the reduction.
    // We're using forEach here, because we want to update the matrix
    // in-place, whereas `map()` will work on a separate instance
    matrix.forEach(function(row, rowIndex) {

        // Find the row's pivot
        // This is wrapped in an IIFE just for structure
        var pivot = (function() {
            // using a regular for-loop, since we may want to break out of it early
            for (var i = 0, l = row.length; i < l; i++) {
                if (!row[i] || knownPivotColumns[i]) { continue; } // skip column if it's zero or its index is taken
                knownPivotColumns[i] = true; // "reserve" the column
                return { index: i, value: row[i] }; // return the pivot data
            }
            return null; // no pivot found
        }());

        // if there's no pivot, there's nothing else to do for this row
        if (!pivot) { return; }

        // scale the row, if necessary
        if (pivot.value !== 1) {
            // using forEach as a "map in place" here
            row.forEach(function(_, i) { row[i] /= pivot.value; });
        }

        // now reduce the other rows (calling them "siblings" here)
        matrix.forEach(function(sibling) {
            var siblingPivotValue = sibling[pivot.index];

            if (sibling === row || siblingPivotValue === 0) { return; } // skip if possible

            // subtract the sibling-pivot-scaled row from the sibling
            // (another "forEach as map-in-place")
            sibling.forEach(function(_, i) { sibling[i] -= row[i] * siblingPivotValue; });
        });
    });

    return matrix;
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

function calculateTangentPoint(t, p) {
    const ts1Length = t.magnitude();
    let tp;
    if (ts1Length > 50) {
        if (ts1Length < 200) {
            const k = (ts1Length - 50) / 150;
            tp = p.clone().offset(t.x - t.x * k, t.y - t.y * k);
        } else {
            tp = p.clone();    
        }
    } else {
        tp = p.clone().offset(t.x, t.y);
    }
    return tp;
}

function catmullRomSpline(points) {
    const tau = 0.5;

    const n = points.length - 1;

    const d1 = points[0].distance(points[1]);
    const dn = points[n - 1].distance(points[n]);

    const t11 = new Point(0, d1 * 0.6);
    const p10 = points[1].difference(t11.x / tau, t11.y / tau);

    const tn2 = new Point(0, -dn * 0.6);
    const pn3 = points[n - 1].clone().offset(tn2.x / tau, tn2.y / tau);

    const tp1 = calculateTangentPoint(t11, points[0]);
    const tpn = calculateTangentPoint(tn2, points[n]);

    const v1 = tp1.difference(points[1]).normalize();
    const v2 = tpn.difference(points[n - 1]).normalize();

    console.log('##################');
    console.log(v1, v2);
    
    const vAngle = angleBetweenVectors(v1, v2); 
    console.log(vAngle);
    let rot = (Math.PI - vAngle) / 2;
    let t;
    if (determinant(v1, v2) < 0) {
        rot = -rot;
    }
    console.log(rot);
    t = v2.clone();
    rotateVector(t, rot);
    console.log(t);
    const t1 = t.clone();
    const scaleFactor1 = Math.max(d1 / 1.5, 20);
    t1.scale(scaleFactor1, scaleFactor1);

    const t2 = t.clone();
    const scaleFactor2 = Math.max(dn / 1.5, 20);
    t2.scale(scaleFactor2, scaleFactor2);

    const p13 = new Point();
    p13.x = points[0].x - t1.x / tau;
    p13.y = points[0].y - t1.y / tau;
    const pn0 = new Point();
    pn0.x = points[n].x - t2.x / tau;
    pn0.y = points[n].y - t2.y / tau;
    const b1 = catmullRomToBezier([p10, points[0], points[1], p13]);
    const b2 = catmullRomToBezier([pn0, points[n - 1], points[n], pn3]);
    return [
        new Curve(b1[0], b1[1], b1[2], b1[3]),
        new Curve(b2[0], b2[1], b2[2], b2[3])
    ];
}

function catmullRomToBezier(points) {
    const tau = 0.5;

    const bcp1 = new Point();
    bcp1.x = points[1].x + (points[2].x - points[0].x) / (6 * tau);
    bcp1.y = points[1].y + (points[2].y - points[0].y) / (6 * tau);

    const bcp2 = new Point();
    bcp2.x = points[2].x + (points[3].x - points[1].x) / (6 * tau);
    bcp2.y = points[2].y + (points[3].y - points[1].y) / (6 * tau);
    return [
        points[1],
        bcp1,
        bcp2,
        points[2]
    ];
}