import { Point, Line, Polyline, Rect } from '../g/index.mjs';
import { toPlainMatrix, transformPoint as applyMatrixToPoint } from '../g/matrix.helpers.mjs';

// @perf The points are transformed with plain math (see `g.Point.prototype.transform()`),
// not with `SVGPoint.matrixTransform()`, which is several times slower.
// An `SVGPoint` keeps its coordinates as 32-bit floats: the coordinates passed in and the
// resulting ones are rounded the same way here (`Math.fround()`), so the results are the same
// as the ones of the DOM.
// TODO (v5): drop the rounding and use the geometry library directly (see the functions below).

const { fround, min, max } = Math;

/**
 * @param {number} x
 * @param {number} y
 * @param {{ a: number, b: number, c: number, d: number, e: number, f: number }} plainMatrix
 * @returns {g.Point}
 * @description Transforms the coordinates with the matrix the way `SVGPoint.matrixTransform()` does.
 */
function transformFloat32Point(x, y, plainMatrix) {
    const point = new Point(fround(x), fround(y));
    applyMatrixToPoint(point, plainMatrix);
    point.x = fround(point.x);
    point.y = fround(point.y);
    return point;
}

/**
 * @param {g.PlainPoint} p
 * @param {SVGMatrix|Partial<g.PlainMatrix>} matrix
 * @returns {g.Point}
 * @description Returns the point transformed by the matrix.
 */
export function transformPoint(p, matrix) {
    // TODO (v5): return new Point(p).transform(matrix);
    return transformFloat32Point(p.x, p.y, toPlainMatrix(matrix));
}

/**
 * @param {g.Line} l
 * @param {SVGMatrix|Partial<g.PlainMatrix>} matrix
 * @returns {g.Line}
 * @description Returns the line transformed by the matrix.
 */
export function transformLine(l, matrix) {
    // TODO (v5): return new Line(l).transform(matrix);
    const plainMatrix = toPlainMatrix(matrix);
    return new Line(
        transformFloat32Point(l.start.x, l.start.y, plainMatrix),
        transformFloat32Point(l.end.x, l.end.y, plainMatrix)
    );
}

/**
 * @param {g.Polyline|g.PlainPoint[]} p
 * @param {SVGMatrix|Partial<g.PlainMatrix>} matrix
 * @returns {g.Polyline}
 * @description Returns the polyline (or the array of points) transformed by the matrix.
 */
export function transformPolyline(p, matrix) {
    let inPoints = (p instanceof Polyline) ? p.points : p;
    if (!Array.isArray(inPoints)) inPoints = [];
    // no points: the matrix is not needed (and does not have to be passed)
    if (inPoints.length === 0) return new Polyline();
    // TODO (v5): return new Polyline(inPoints).transform(matrix);
    const plainMatrix = toPlainMatrix(matrix);
    const outPoints = [];
    for (let i = 0, n = inPoints.length; i < n; i++) {
        outPoints[i] = transformFloat32Point(inPoints[i].x, inPoints[i].y, plainMatrix);
    }
    return new Polyline(outPoints);
}

/**
 * @param {g.PlainRect} r
 * @param {SVGMatrix|Partial<g.PlainMatrix>} matrix
 * @returns {g.Rect}
 * @description Returns the bounding box of the rectangle transformed by the matrix.
 */
export function transformRect(r, matrix) {
    // TODO (v5): return new Rect(r).bbox(matrix);
    // @perf The four corners are transformed as numbers: no point is created for them.
    // The rounding is the same as in `transformFloat32Point()`.
    const { a, b, c, d, e, f } = toPlainMatrix(matrix);
    const x1 = fround(r.x);
    const y1 = fround(r.y);
    const x2 = fround(r.x + r.width);
    const y2 = fround(r.y + r.height);

    const corner1X = fround(a * x1 + c * y1 + e);
    const corner1Y = fround(b * x1 + d * y1 + f);
    const corner2X = fround(a * x2 + c * y1 + e);
    const corner2Y = fround(b * x2 + d * y1 + f);
    const corner3X = fround(a * x2 + c * y2 + e);
    const corner3Y = fround(b * x2 + d * y2 + f);
    const corner4X = fround(a * x1 + c * y2 + e);
    const corner4Y = fround(b * x1 + d * y2 + f);

    const minX = min(corner1X, corner2X, corner3X, corner4X);
    const maxX = max(corner1X, corner2X, corner3X, corner4X);
    const minY = min(corner1Y, corner2Y, corner3Y, corner4Y);
    const maxY = max(corner1Y, corner2Y, corner3Y, corner4Y);

    return new Rect(minX, minY, maxX - minX, maxY - minY);
}
