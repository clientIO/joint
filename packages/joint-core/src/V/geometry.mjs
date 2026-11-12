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
    const plainMatrix = toPlainMatrix(matrix);
    const x1 = r.x;
    const y1 = r.y;
    const x2 = r.x + r.width;
    const y2 = r.y + r.height;

    const corner1 = transformFloat32Point(x1, y1, plainMatrix);
    const corner2 = transformFloat32Point(x2, y1, plainMatrix);
    const corner3 = transformFloat32Point(x2, y2, plainMatrix);
    const corner4 = transformFloat32Point(x1, y2, plainMatrix);

    const minX = min(corner1.x, corner2.x, corner3.x, corner4.x);
    const maxX = max(corner1.x, corner2.x, corner3.x, corner4.x);
    const minY = min(corner1.y, corner2.y, corner3.y, corner4.y);
    const maxY = max(corner1.y, corner2.y, corner3.y, corner4.y);

    return new Rect(minX, minY, maxX - minX, maxY - minY);
}
