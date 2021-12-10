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

function autoDirectionPoints(linkView, sourcePoint, targetPoint, route, minOffset) {
    const { sourceBBox, targetBBox } = linkView;
    const sourceSide = sourceBBox.sideNearestToPoint(sourcePoint);
    const targetSide = targetBBox.sideNearestToPoint(targetPoint);

    const routeStartPoint = route[0] ? new Point(route[0]) : null;
    const routeTargetPoint = route[route.length - 1] ? new Point(route[route.length - 1]) : null;

    const offsetAnchorStart = routeStartPoint || targetPoint;
    const offsetStart = Math.max((sourcePoint.distance(offsetAnchorStart) / 2), minOffset);

    const offsetAnchorTarget = routeTargetPoint || sourcePoint;
    const offsetTarget = Math.max((targetPoint.distance(offsetAnchorTarget) / 2), minOffset);

    // const centerOffsetX = Math.abs((sourcePoint.x - targetPoint.x) / 2);
    // let offsetX = Math.max(centerOffsetX, minOffset);

    // const centerOffsetY = Math.abs((sourcePoint.y - targetPoint.y) / 2);
    // let offsetY = Math.max(centerOffsetY, minOffset);

    /* const routeStartPoint = route[0] ? new Point(route[0]) : null;
    if (routeStartPoint) {
        const dist = routeStartPoint.distance(sourcePoint);
        if (dist < offsetY) {
            offsetY = offsetY * (dist / offsetY);
        }
    } */
    // const offsetAnchorStart = routeStartPoint || targetPoint;
    // const offsetStart = {
    //     x: Math.max(Math.abs((sourcePoint.x - offsetAnchorStart.x) / 2), minOffset),
    //     y: Math.max(Math.abs((sourcePoint.y - offsetAnchorStart.y) / 2), minOffset),
    // };

    // const routeTargetPoint = route[route.length - 1] ? new Point(route[route.length - 1]) : null;
    // const offsetAnchorTarget = routeTargetPoint || sourcePoint;
    // const offsetTarget = {
    //     x: Math.max(Math.abs((targetPoint.x - offsetAnchorTarget.x) / 2), minOffset),
    //     y: Math.max(Math.abs((targetPoint.y - offsetAnchorTarget.y) / 2), minOffset),
    // };

    let cp1x;
    let cp1y;
    let cp2x;
    let cp2y;
    switch (sourceSide) {
        case 'top':
            cp1x = sourcePoint.x;
            cp1y = sourcePoint.y - offsetStart;
            break;
        case 'bottom':
            cp1x = sourcePoint.x;
            cp1y = sourcePoint.y + offsetStart;
            break;
        case 'right':
            cp1x = sourcePoint.x + offsetStart;
            cp1y = sourcePoint.y;
            break;
        case 'left':
            cp1x = sourcePoint.x - offsetStart;
            cp1y = sourcePoint.y;
            break;
    }
    switch (targetSide) {
        case 'top':
            cp2x = targetPoint.x;
            cp2y = targetPoint.y - offsetTarget;
            break;
        case 'bottom':
            cp2x = targetPoint.x;
            cp2y = targetPoint.y + offsetTarget;
            break;
        case 'right':
            cp2x = targetPoint.x + offsetTarget;
            cp2y = targetPoint.y;
            break;
        case 'left':
            cp2x = targetPoint.x - offsetTarget;
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
    const { minOffset = 20, direction = Directions.AUTO, tension = 0 } = opt;

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
            points = autoDirectionPoints(linkView, sourcePoint, targetPoint, route, minOffset);
            break;
    }
 
    if (true) {
        if (true /*route.length*/) {
            let curves = Curve.throughPoints([sourcePoint, ...route, targetPoint]);
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
    }

    return (raw) ? path : path.serialize();
};

function createBezierSpline(points) {
    const n = points.length - 1;
    const eqCount = n - 1;
    const rows = [];
    const cx = [];
    const cy = [];
    for (let i = 0; i < eqCount; i++) {
        if (i === 0) {
            cx.push(6 * points[1].x - points[0].x);
            cy.push(6 * points[1].y - points[0].y);
            //cx.push(4 * points[0].x);
            //cy.push(4 * (points[0].y + 3 * Math.abs((points[1].y - points[0].y)) / 2));
            //cy.push(points[0].y + Math.abs((points[1].y - points[0].y)) / 2);
        } 
        else if (i === eqCount - 1) {
            cx.push(6 * points[eqCount].x - points[eqCount + 1].x);
            cy.push(6 * points[eqCount].y - points[eqCount + 1].y);
            //cx.push(4 * points[eqCount + 1].x);
            //cy.push(4 * (points[eqCount + 1].y - 3 * Math.abs((points[eqCount + 1].y - points[eqCount].y)) / 2));
        }
        else {
            //cx.push(6 * points[i + 1].x); 
            cx.push(points[n]);
            //cy.push(6 * points[i + 1].y); 
            cy.push((points[n - 1].y + points[n].y) / 2);
        }
    }

    for (let i = 0; i < eqCount; i++) {
        rows.push(new Array(eqCount).fill(0));
        rows[i][i] = 4;
        if (i !== 0) rows[i][i - 1] = 1;
        if (i !== eqCount - 1) rows[i][i + 1] = 1; 
    }

    const rowsx = rows.map((row, i) => {
        const newRow = [...row];
        newRow.push(cx[i]);
        return newRow;
    });

    /*rowsx[0][0] = 4;
    rowsx[0][1] = 0;

    rowsx[eqCount - 1][eqCount - 1] = 4;
    rowsx[eqCount - 1][eqCount - 2] = 0;*/
    const rowsy = rows.map((row, i) => {
        const newRow = [...row];
        newRow.push(cy[i]);
        return newRow;
    });

    /*rowsy[0][0] = 4;
    rowsy[0][1] = 0;
    rowsy[eqCount - 1][eqCount - 1] = 4;
    rowsy[eqCount - 1][eqCount - 2] = 0;*/
    console.log(rowsy);

    const xs = reducedRowEchelonForm(rowsx).map(row => row[n - 1]);
    const ys = reducedRowEchelonForm(rowsy).map(row => row[n - 1]);
    xs.unshift(points[0].x);
    xs.push(points[points.length - 1].x);
    ys.unshift(points[0].y);
    ys.push(points[points.length - 1].y);

    console.log(xs);
    console.log(ys);

    var curves = [];
    for (var i = 0; i < points.length - 1; i++) {
        let controlPoint1;
        let controlPoint2;
        /*if (i === 0) {
            controlPoint1 = new Point(xs[i], ys[0] + Math.abs((points[1].y - ys[i])) / 2);
            controlPoint2 = new Point((xs[i] + xs[i + 1]) / 2, (ys[i] + ys[i + 1]) / 2);
        } 
        else if (i === eqCount - 1) {
            controlPoint1 = new Point((2 * xs[i] + xs[i + 1]) / 3, (2 * ys[i] + ys[i + 1]) / 3);
            controlPoint2 = new Point((xs[i] + 2 * xs[i + 1]) / 3, (ys[i] + 2 * ys[i + 1]) / 3);
        }
        else {*/
        controlPoint1 = new Point((2 * xs[i] + xs[i + 1]) / 3, (2 * ys[i] + ys[i + 1]) / 3);
        controlPoint2 = new Point((xs[i] + 2 * xs[i + 1]) / 3, (ys[i] + 2 * ys[i + 1]) / 3);
        //} 

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
            for(var i = 0, l = row.length ; i < l ; i++ ) {
                if(!row[i] || knownPivotColumns[i]) { continue; } // skip column if it's zero or its index is taken
                knownPivotColumns[i] = true;                     // "reserve" the column
                return { index: i, value: row[i] };              // return the pivot data
            }
            return null; // no pivot found
        }());
  
        // if there's no pivot, there's nothing else to do for this row
        if(!pivot) { return; }
  
        // scale the row, if necessary
        if(pivot.value !== 1) {
        // using forEach as a "map in place" here
            row.forEach(function(_, i) { row[i] /= pivot.value; });
        }
  
        // now reduce the other rows (calling them "siblings" here)
        matrix.forEach(function(sibling) {
            var siblingPivotValue = sibling[pivot.index];
  
            if(sibling === row || siblingPivotValue === 0) { return; } // skip if possible
  
            // subtract the sibling-pivot-scaled row from the sibling
            // (another "forEach as map-in-place")
            sibling.forEach(function(_, i) { sibling[i] -= row[i] * siblingPivotValue; });
        });
    });
  
    return matrix;
}

function getCurveControlPoints(knots, p11, p2n) {

    var firstControlPoints = [];
    var secondControlPoints = [];
    var n = knots.length - 1;
    var i;

    // Special case: Bezier curve should be a straight line.
    if (n == 1) {
        // 3P1 = 2P0 + P3
        firstControlPoints[0] = p11;
        // P2 = 2P1 – P0
        secondControlPoints[0] = p2n;
        return [firstControlPoints, secondControlPoints];
    }
    if (n == 2) {
        const l = 2;
        const p21 = new Point(
            (p11.x * 2 * knots[1].x) / (p2n.x + p11.x),
            (p11.y * 2 * knots[1].y) / (p2n.y + p11.y)
            //(4 * knots[1].x - p2n.x + p11.x) / 4,
            //(4 * knots[1].y - p2n.y + p11.y) / 4
            //2 * p11.x - knots[0].x, 
            //2 * p11.y - knots[0].y
        );
        const p1n = new Point(
            (2 * knots[1].x) - p21.x,
            (2 * knots[1].y) - p21.y,
            //(2 * p21.x - p11.x + p2n.x + knots[2].x + knots[1].x) / 2,
            //(2 * p21.y - p11.y + p2n.y + knots[2].y - knots[1].y) / 2
        );
        firstControlPoints[0] = p11;
        firstControlPoints[1] = p1n;
        secondControlPoints[0] = p21;
        secondControlPoints[1] = p2n;

        /*firstControlPoints[1] = new Point(
            (4 * knots[1].x + 2 * knots[2].x - p1n.x - p11.x) / 4, 
            (4 * knots[1].y + 2 * knots[2].y - p1n.y - p11.y) / 4
        );
        secondControlPoints[1] = new Point(
            (knots[1].x + p11.x) / 2,
            (knots[1].y + p11.y) / 2
        );*/

        console.log([firstControlPoints, secondControlPoints]);
        return [firstControlPoints, secondControlPoints];
    }

    // Calculate first Bezier control points.
    // Right hand side vector.
    var rhs = [];

    // Set right hand side X values.
    for (i = 1; i < n - 1; i++) {
        rhs[i] = 4 * knots[i].x + 2 * knots[i + 1].x;
    }

    rhs[0] = knots[0].x + 2 * knots[1].x;
    rhs[n - 1] = (8 * knots[n - 1].x + knots[n].x) / 2.0;

    // Get first control points X-values.
    var x = getFirstControlPoints(rhs);

    // Set right hand side Y values.
    for (i = 1; i < n - 1; ++i) {
        rhs[i] = 4 * knots[i].y + 2 * knots[i + 1].y;
    }

    rhs[0] = knots[0].y + 2 * knots[1].y;
    rhs[n - 1] = (8 * knots[n - 1].y + knots[n].y) / 2.0;

    // Get first control points Y-values.
    var y = getFirstControlPoints(rhs);

    // Fill output arrays.
    for (i = 0; i < n; i++) {
        // First control point.
        firstControlPoints.push(new Point(x[i], y[i]));

        // Second control point.
        if (i < n - 1) {
            secondControlPoints.push(new Point(
                2 * knots [i + 1].x - x[i + 1],
                2 * knots[i + 1].y - y[i + 1]
            ));

        } else {
            secondControlPoints.push(new Point(
                (knots[n].x + x[n - 1]) / 2,
                (knots[n].y + y[n - 1]) / 2
            ));
        }
    }

    return [firstControlPoints, secondControlPoints];
}

// Solves a tridiagonal system for one of coordinates (x or y) of first Bezier control points.
// @param rhs Right hand side vector.
// @return Solution vector.
function getFirstControlPoints(rhs) {

    var n = rhs.length;
    // `x` is a solution vector.
    var x = [];
    var tmp = [];
    var b = 2.0;

    x[0] = rhs[0] / b;

    // Decomposition and forward substitution.
    for (var i = 1; i < n; i++) {
        tmp[i] = 1 / b;
        b = (i < n - 1 ? 4.0 : 3.5) - tmp[i];
        x[i] = (rhs[i] - x[i - 1]) / b;
    }

    for (i = 1; i < n; i++) {
        // Backsubstitution.
        x[n - i - 1] -= tmp[n - i] * x[n - i];
    }

    return x;
}

function throughPointsExtended(points, p11, p2n) {

    if (!points || (Array.isArray(points) && points.length < 2)) {
        throw new Error('At least 2 points are required');
    }

    var controlPoints = getCurveControlPoints(points, p11, p2n);

    var curves = [];
    var n = controlPoints[0].length;
    for (var i = 0; i < n; i++) {

        var controlPoint1 = new Point(controlPoints[0][i].x, controlPoints[0][i].y);
        var controlPoint2 = new Point(controlPoints[1][i].x, controlPoints[1][i].y);

        curves.push(new Curve(points[i], controlPoint1, controlPoint2, points[i + 1]));
    }

    return curves;
}