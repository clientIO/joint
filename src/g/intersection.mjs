import { Line } from './line.mjs';
import { Polygon } from './polygon.mjs';
import { Rect } from './rect.mjs';
import { types } from './types.mjs';

export function exists(shape1, shape2, shape1opt, shape2opt) {
    switch (shape1.type) {
        case types.Line: {
            switch (shape2.type) {
                case types.Line: {
                    return lineWithLine(shape1, shape2);
                }
            }
            break;
        }
        case types.Ellipse: {
            switch (shape2.type) {
                case types.Line: {
                    return ellipseWithLine(shape1, shape2);
                }
                case types.Ellipse: {
                    return ellipseWithEllipse(shape1, shape2);
                }
            }
            break;
        }
        case types.Rect: {
            switch (shape2.type) {
                case types.Line: {
                    return rectWithLine(shape1, shape2);
                }
                case types.Ellipse: {
                    return rectWithEllipse(shape1, shape2);
                }
                case types.Rect: {
                    return rectWithRect(shape1, shape2);
                }
            }
            break;
        }
        case types.Polyline: {
            switch (shape2.type) {
                case types.Line: {
                    return polylineWithLine(shape1, shape2);
                }
                case types.Ellipse: {
                    return polylineWithEllipse(shape1, shape2);
                }
                case types.Rect: {
                    return polylineWithRect(shape1, shape2);
                }
                case types.Polyline: {
                    return polylineWithPolyline(shape1, shape2);
                }
            }
            break;
        }
        case types.Polygon: {
            switch (shape2.type) {
                case types.Line: {
                    return polygonWithLine(shape1, shape2);
                }
                case types.Ellipse: {
                    return polygonWithEllipse(shape1, shape2);
                }
                case types.Rect: {
                    return polygonWithRect(shape1, shape2);
                }
                case types.Polyline: {
                    return polygonWithPolyline(shape1, shape2);
                }
                case types.Polygon: {
                    return polygonWithPolygon(shape1, shape2);
                }
            }
            break;
        }
        case types.Path: {
            switch (shape2.type) {
                case types.Line: {
                    return pathWithLine(shape1, shape2, shape1opt);
                }
                case types.Ellipse: {
                    return pathWithEllipse(shape1, shape2, shape1opt);
                }
                case types.Rect: {
                    return pathWithRect(shape1, shape2, shape1opt);
                }
                case types.Polyline: {
                    return pathWithPolyline(shape1, shape2, shape1opt);
                }
                case types.Polygon: {
                    return pathWithPolygon(shape1, shape2, shape1opt);
                }
                case types.Path: {
                    return pathWithPath(shape1, shape2, shape1opt, shape2opt);
                }
            }
            break;
        }
    }
    // None of the cases above
    switch (shape2.type) {
        case types.Ellipse:
        case types.Rect:
        case types.Polyline:
        case types.Polygon:
        case types.Path: {
            return exists(shape2, shape1, shape2opt, shape1opt);
        }
        default: {
            throw Error(`The intersection for ${shape1} and ${shape2} could not be found.`);
        }
    }
}

/* Line */

export function lineWithLine(line1, line2) {
    const x1 = line1.start.x;
    const y1 = line1.start.y;
    const x2 = line1.end.x;
    const y2 = line1.end.y;
    const x3 = line2.start.x;
    const y3 = line2.start.y;
    const x4 = line2.end.x;
    const y4 = line2.end.y;
    const s1x = x2 - x1;
    const s1y = y2 - y1;
    const s2x = x4 - x3;
    const s2y = y4 - y3;
    const s3x = x1 - x3;
    const s3y = y1 - y3;
    const p = s1x * s2y - s2x * s1y;
    const s = (s1x * s3y - s1y * s3x) / p;
    const t = (s2x * s3y - s2y * s3x) / p;
    return s >= 0 && s <= 1 && t >= 0 && t <= 1;
}

/* Ellipse */

export function ellipseWithLine(ellipse, line) {
    const rex = ellipse.a;
    const rey = ellipse.b;
    const xe = ellipse.x;
    const ye = ellipse.y;
    const x1 = line.start.x - xe;
    const x2 = line.end.x - xe;
    const y1 = line.start.y - ye;
    const y2 = line.end.y - ye;
    const rex_2 = rex * rex;
    const rey_2 = rey * rey;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const A = dx * dx / rex_2 + dy * dy / rey_2;
    const B = 2 * x1 * dx / rex_2 + 2 * y1 * dy / rey_2;
    const C = x1 * x1 / rex_2 + y1 * y1 / rey_2 - 1;
    const D = B * B - 4 * A * C;
    if (D === 0) {
        const t = -B / 2 / A;
        return t >= 0 && t <= 1;
    } else if (D > 0) {
        const sqrt = Math.sqrt(D);
        const t1 = (-B + sqrt) / 2 / A;
        const t2 = (-B - sqrt) / 2 / A;
        return (t1 >= 0 && t1 <= 1) || (t2 >= 0 && t2 <= 1);
    }
    return false;
}

export function ellipseWithEllipse(ellipse1, ellipse2) {
    return _ellipsesIntersection(ellipse1, 0, ellipse2, 0);
}

/* Rect */

export function rectWithLine(rect, line) {
    const { start, end } = line;
    const { x, y, width, height } = rect;
    if (
        (start.x > x + width && end.x > x + width)
        || (start.x < x && end.x < x)
        || (start.y > y + height && end.y > y + height)
        || (start.y < y && end.y < y)
    ) {
        return false;
    }
    if (rect.containsPoint(line.start) || rect.containsPoint(line.end)) {
        return true;
    }
    return lineWithLine(rect.topLine(), line)
        || lineWithLine(rect.rightLine(), line)
        || lineWithLine(rect.bottomLine(), line)
        || lineWithLine(rect.leftLine(), line);
}

export function rectWithEllipse(rect, ellipse) {
    if (!rectWithRect(rect, Rect.fromEllipse(ellipse))) return false;
    return polygonWithEllipse(Polygon.fromRect(rect), ellipse);
}

export function rectWithRect(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width
        && rect1.x + rect1.width > rect2.x
        && rect1.y < rect2.y + rect2.height
        && rect1.y + rect1.height > rect2.y;
}

/* Polyline */

export function polylineWithLine(polyline, line) {
    return _polylineWithLine(polyline, line, { interior: false });
}

export function polylineWithEllipse(polyline, ellipse) {
    return _polylineWithEllipse(polyline, ellipse, { interior: false });
}

export function polylineWithRect(polyline, rect) {
    return _polylineWithRect(polyline, rect, { interior: false });
}

export function polylineWithPolyline(polyline1, polyline2) {
    return _polylineWithPolyline(polyline1, polyline2, { interior: false });
}

/* Polygon */

export function polygonWithLine(polygon, line) {
    return _polylineWithLine(polygon, line, { interior: true });
}

export function polygonWithEllipse(polygon, ellipse) {
    return _polylineWithEllipse(polygon, ellipse, { interior: true });
}

export function polygonWithRect(polygon, rect) {
    return _polylineWithRect(polygon, rect, { interior: true });
}

export function polygonWithPolyline(polygon, polyline) {
    return _polylineWithPolyline(polygon, polyline, { interior: true });
}

export function polygonWithPolygon(polygon1, polygon2) {
    return _polylineWithPolygon(polygon1, polygon2, { interior: true });
}

/* Path */

export function pathWithLine(path, line, pathOpt) {
    return path.getSubpaths().some(subpath => {
        const [polyline] = subpath.toPolylines(pathOpt);
        const { type } = subpath.getSegment(-1);
        if (type === 'Z') {
            return polygonWithLine(polyline, line);
        } else {
            return polylineWithLine(polyline, line);
        }
    });
}

export function pathWithEllipse(path, ellipse, pathOpt) {
    return path.getSubpaths().some(subpath => {
        const [polyline] = subpath.toPolylines(pathOpt);
        const { type } = subpath.getSegment(-1);
        if (type === 'Z') {
            return polygonWithEllipse(polyline, ellipse);
        } else {
            return polylineWithEllipse(polyline, ellipse);
        }
    });
}

export function pathWithRect(path, rect, pathOpt) {
    return pathWithPolygon(path, Polygon.fromRect(rect), pathOpt);
}

export function pathWithPolyline(path, polyline, pathOpt) {
    return _pathWithPolyline(path, polyline, pathOpt, { interior: false });
}

export function pathWithPolygon(path, polygon, pathOpt) {
    return _pathWithPolyline(path, polygon, pathOpt, { interior: true });
}

export function pathWithPath(path1, path2, pathOpt1, pathOpt2) {
    return path1.getSubpaths().some(subpath => {
        const [polyline1] = subpath.toPolylines(pathOpt1);
        const { type } = subpath.getSegment(-1);
        if (type === 'Z') {
            return pathWithPolygon(path2, polyline1, pathOpt2);
        } else {
            return pathWithPolyline(path2, polyline1, pathOpt2);
        }
    });
}

function _polylineWithLine(polyline, line, opt = {}) {
    const { interior = false } = opt;
    let thisPoints;
    if (interior) {
        if (polyline.containsPoint(line.start)) {
            // If any point of the polyline lies inside this polygon (interior = true)
            // there is an intersection (we've chosen the start point)
            return true;
        }
        const { start, end, points } = polyline;
        thisPoints = end.equals(start) ? points : [...points, start];
    } else {
        thisPoints = polyline.points;
    }
    const { length } = thisPoints;
    const segment = new Line();
    for (let i = 0; i < length - 1; i++) {
        segment.start = thisPoints[i];
        segment.end = thisPoints[i + 1];
        if (lineWithLine(line, segment)) {
            return true;
        }
    }
    return false;
}

function _polylineWithEllipse(polyline, ellipse, opt = {}) {
    const { start, end, points } = polyline;
    if (ellipse.containsPoint(start)) {
        return true;
    }
    let thisPoints;
    const { interior = false } = opt;
    if (interior) {
        if (polyline.containsPoint(ellipse.center())) {
            // If any point of the ellipse lies inside this polygon (interior = true)
            // there is an intersection (we've chosen the center point)
            return true;
        }
        thisPoints = end.equals(start) ? points : [...points, start];
    } else {
        thisPoints = points;
    }

    const { length } = thisPoints;
    const segment = new Line();
    for (let i = 0; i < length - 1; i++) {
        segment.start = thisPoints[i];
        segment.end = thisPoints[i + 1];
        if (ellipseWithLine(ellipse, segment)) {
            return true;
        }
    }
    return false;
}

function _polylineWithRect(polyline, rect, opt) {
    const polygon = Polygon.fromRect(rect);
    return _polylineWithPolygon(polyline, polygon, opt);
}

function _pathWithPolyline(path, polyline1, pathOpt, opt) {
    return path.getSubpaths().some(subpath => {
        const [polyline2] = subpath.toPolylines(pathOpt);
        const { type } = subpath.getSegment(-1);
        if (type === 'Z') {
            return _polylineWithPolygon(polyline1, polyline2, opt);
        } else {
            return _polylineWithPolyline(polyline1, polyline2, opt);
        }
    });
}

function _polylineWithPolyline(polyline1, polyline2, opt = {}) {
    const { interior = false } = opt;
    let thisPolyline;
    if (interior) {
        const { start } = polyline2;
        if (polyline1.containsPoint(start)) {
            // If any point of the polyline lies inside this polygon (interior = true)
            // there is an intersection (we've chosen the start point)
            return true;
        }
        thisPolyline = polyline1.clone().close();
    } else {
        thisPolyline = polyline1;
    }
    const otherPoints = polyline2.points;
    const { length } = otherPoints;
    const segment = new Line();
    for (let i = 0; i < length - 1; i++) {
        segment.start = otherPoints[i];
        segment.end = otherPoints[i + 1];
        if (polylineWithLine(thisPolyline, segment)) {
            return true;
        }
    }
    return false;
}

function _polylineWithPolygon(polyline, polygon, opt) {
    return polygon.containsPoint(polyline.start) || _polylineWithPolyline(polyline, polygon.clone().close(), opt);
}

function _ellipsesIntersection(e1, w1, e2, w2) {
    const { cos, sin } = Math;
    const sinW1 = sin(w1);
    const cosW1 = cos(w1);
    const sinW2 = sin(w2);
    const cosW2 = cos(w2);
    const sinW1s = sinW1 * sinW1;
    const cosW1s = cosW1 * cosW1;
    const sinCos1 = sinW1 * cosW1;
    const sinW2s = sinW2 * sinW2;
    const cosW2s = cosW2 * cosW2;
    const sinCos2 = sinW2 * cosW2;
    const a1s = e1.a * e1.a;
    const b1s = e1.b * e1.b;
    const a2s = e2.a * e2.a;
    const b2s = e2.b * e2.b;
    const A1 = a1s * sinW1s + b1s * cosW1s;
    const A2 = a2s * sinW2s + b2s * cosW2s;
    const B1 = a1s * cosW1s + b1s * sinW1s;
    const B2 = a2s * cosW2s + b2s * sinW2s;
    let C1 = 2 * (b1s - a1s) * sinCos1;
    let C2 = 2 * (b2s - a2s) * sinCos2;
    let D1 = (-2 * A1 * e1.x - C1 * e1.y);
    let D2 = (-2 * A2 * e2.x - C2 * e2.y);
    let E1 = (-C1 * e1.x - 2 * B1 * e1.y);
    let E2 = (-C2 * e2.x - 2 * B2 * e2.y);
    const F1 = A1 * e1.x * e1.x + B1 * e1.y * e1.y + C1 * e1.x * e1.y - a1s * b1s;
    const F2 = A2 * e2.x * e2.x + B2 * e2.y * e2.y + C2 * e2.x * e2.y - a2s * b2s;

    C1 = C1 / 2;
    C2 = C2 / 2;
    D1 = D1 / 2;
    D2 = D2 / 2;
    E1 = E1 / 2;
    E2 = E2 / 2;

    const l3 = det3([
        [A1, C1, D1],
        [C1, B1, E1],
        [D1, E1, F1]
    ]);
    const l0 = det3([
        [A2, C2, D2],
        [C2, B2, E2],
        [D2, E2, F2]
    ]);
    const l2 = 0.33333333 * (det3([
        [A2, C1, D1],
        [C2, B1, E1],
        [D2, E1, F1]
    ]) + det3([
        [A1, C2, D1],
        [C1, B2, E1],
        [D1, E2, F1]
    ]) + det3([
        [A1, C1, D2],
        [C1, B1, E2],
        [D1, E1, F2]
    ]));
    const l1 = 0.33333333 * (det3([
        [A1, C2, D2],
        [C1, B2, E2],
        [D1, E2, F2]
    ]) + det3([
        [A2, C1, D2],
        [C2, B1, E2],
        [D2, E1, F2]
    ]) + det3([
        [A2, C2, D1],
        [C2, B2, E1],
        [D2, E2, F1]
    ]));

    const delta1 = det2([
        [l3, l2],
        [l2, l1]
    ]);
    const delta2 = det2([
        [l3, l1],
        [l2, l0]
    ]);
    const delta3 = det2([
        [l2, l1],
        [l1, l0]
    ]);

    const dP = det2([
        [2 * delta1, delta2],
        [delta2, 2 * delta3]
    ]);

    if (dP > 0 && (l1 > 0 || l2 > 0)) {
        return false;
    }
    return true;
}

function det2(m) {
    return m[0][0] * m[1][1] - m[0][1] * m[1][0];
}

function det3(m) {
    return m[0][0] * m[1][1] * m[2][2] -
        m[0][0] * m[1][2] * m[2][1] -
        m[0][1] * m[1][0] * m[2][2] +
        m[0][1] * m[1][2] * m[2][0] +
        m[0][2] * m[1][0] * m[2][1] -
        m[0][2] * m[1][1] * m[2][0];
}
