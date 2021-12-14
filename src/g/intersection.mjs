import { Line } from './line.mjs';
import { Polyline } from './polyline.mjs';

/* Line */

export function lineWithLine(line1, line2) {
    // TODO: no need to calculate the intersection points
    return Boolean(line1.intersectionWithLine(line2));
}

/* Ellipse */

export function ellipseWithLine(ellipse, line) {
    // TODO: no need to calculate the intersection points
    return Boolean(ellipse.intersectionWithLine(line));
}

export function ellipseWithEllipse(ellipse1, ellipse2) {
    // TBI
}

/* Rect */

export function rectWithLine(rect, line) {
    // TODO: no need to calculate the intersection points
    return Boolean(rect.intersectionWithLine(line));
}

export function rectWithEllipse(rect, ellipse) {
    // TBI
}

export function rectWithRect(rect1, rect2) {
    // TODO: no need to calculate the intersection points
    return Boolean(rect1.intersect(rect2));
}

/* Polyline */

export function polylineWithLine(polygon, line) {
    return _polylineWithLine(polygon, line, { interior: false });
}

export function polylineWithEllipse(polygon, ellipse) {
    return _polylineWithEllipse(polygon, ellipse, { interior: false });
}

export function polylineWithRect(polygon, rect) {
    return _polylineWithRect(polygon, rect, { interior: false });
}

export function polylineWithPolyline(polygon, polyline) {
    return _polylineWithPolyline(polygon, polyline, { interior: false });
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
    // TODO: no need to calculate the intersection points
    return Boolean(path.intersectionWithLine(line, pathOpt));
}

export function pathWithEllipse(path, ellipse, pathOpt) {
    // TBI
}

export function pathWithRect(path, rect, pathOpt) {
    return pathWithPolygon(path, Polyline.fromRect(rect), pathOpt);
}

export function pathWithPolyline(path, polygon, pathOpt) {
    return _pathWithPolyline(path, polygon, pathOpt, { interior: false });
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
        if (line.intersectionWithLine(segment)) {
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
        if (ellipse.intersectionWithLine(segment)) {
            return true;
        }
    }
    return false;
}

function _polylineWithRect(polyline, rect, opt) {
    const polygon = new Polyline([
        rect.topLeft(),
        rect.topRight(),
        rect.bottomRight(),
        rect.bottomLeft()
    ]);
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
