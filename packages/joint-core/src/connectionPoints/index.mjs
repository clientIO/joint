import * as g from '../g/index.mjs';
import V from '../V/index.mjs';
import * as util from '../util/index.mjs';

function offsetPoint(p1, p2, offset) {
    if (util.isPlainObject(offset)) {
        const { x, y } = offset;
        if (isFinite(y)) {
            const line =  new g.Line(p2, p1);
            const { start, end } = line.parallel(y);
            p2 = start;
            p1 = end;
        }
        offset = x;
    }
    if (!isFinite(offset)) return p1;
    var length = p1.distance(p2);
    if (offset === 0 && length > 0) return p1;
    return p1.move(p2, -Math.min(offset, length - 1));
}

function stroke(magnet) {

    var stroke = magnet.getAttribute('stroke-width');
    if (stroke === null) return 0;
    return parseFloat(stroke) || 0;
}

function alignLine(line, type, offset = 0) {
    let coordinate, a, b, direction;
    const { start, end } = line;
    switch (type) {
        case 'left':
            coordinate = 'x';
            a = end;
            b = start;
            direction = -1;
            break;
        case 'right':
            coordinate = 'x';
            a = start;
            b = end;
            direction = 1;
            break;
        case 'top':
            coordinate = 'y';
            a = end;
            b = start;
            direction = -1;
            break;
        case 'bottom':
            coordinate = 'y';
            a = start;
            b = end;
            direction = 1;
            break;
        default:
            return;
    }
    if (start[coordinate] < end[coordinate]) {
        a[coordinate] = b[coordinate];
    } else {
        b[coordinate] = a[coordinate];
    }
    if (isFinite(offset)) {
        a[coordinate] += direction * offset;
        b[coordinate] += direction * offset;
    }
}

// Connection Points

function anchorConnectionPoint(line, _view, _magnet, opt) {
    let { offset, alignOffset, align } = opt;
    if (align) alignLine(line, align, alignOffset);
    return offsetPoint(line.end, line.start, offset);
}

function bboxIntersection(line, view, magnet, opt) {

    var bbox = view.getNodeBBox(magnet);
    if (opt.stroke) bbox.inflate(stroke(magnet) / 2);
    var intersections = line.intersect(bbox);
    var cp = (intersections)
        ? line.start.chooseClosest(intersections)
        : line.end;
    return offsetPoint(cp, line.start, opt.offset);
}

function rectangleIntersection(line, view, magnet, opt) {

    var angle = view.model.angle();
    if (angle === 0) {
        return bboxIntersection(line, view, magnet, opt);
    }

    var bboxWORotation = view.getNodeUnrotatedBBox(magnet);
    if (opt.stroke) bboxWORotation.inflate(stroke(magnet) / 2);
    var center = bboxWORotation.center();
    var lineWORotation = line.clone().rotate(center, angle);
    var intersections = lineWORotation.setLength(1e6).intersect(bboxWORotation);
    var cp = (intersections)
        ? lineWORotation.start.chooseClosest(intersections).rotate(center, -angle)
        : line.end;
    return offsetPoint(cp, line.start, opt.offset);
}

function findShapeNode(magnet) {
    if (!magnet) return null;
    var node = magnet;
    do {
        var tagName = node.tagName;
        if (typeof tagName !== 'string') return null;
        tagName = tagName.toUpperCase();
        if (tagName === 'G') {
            node = node.firstElementChild;
        } else if (tagName === 'TITLE') {
            node = node.nextElementSibling;
        } else break;
    } while (node);
    return node;
}

var BNDR_SUBDIVISIONS = 'segmentSubdivisons';
var BNDR_SHAPE_BBOX = 'shapeBBox';

function boundaryIntersection(line, view, magnet, opt) {

    var node, intersection;
    var selector = opt.selector;
    var anchor = line.end;

    if (typeof selector === 'string') {
        node = view.findNode(selector);
    } else if (selector === false) {
        node = magnet;
    } else if (Array.isArray(selector)) {
        node = util.getByPath(magnet, selector);
    } else {
        node = findShapeNode(magnet);
    }

    if (!V.isSVGGraphicsElement(node)) {
        if (node === magnet || !V.isSVGGraphicsElement(magnet)) return anchor;
        node = magnet;
    }

    var localShape = view.getNodeShape(node);
    var magnetMatrix = view.getNodeMatrix(node);
    var translateMatrix = view.getRootTranslateMatrix();
    var rotateMatrix = view.getRootRotateMatrix();
    var targetMatrix = translateMatrix.multiply(rotateMatrix).multiply(magnetMatrix);
    var localMatrix = targetMatrix.inverse();
    var localLine = V.transformLine(line, localMatrix);
    var localRef = localLine.start.clone();
    var data = view.getNodeData(node);

    if (opt.insideout === false) {
        if (!data[BNDR_SHAPE_BBOX]) data[BNDR_SHAPE_BBOX] = localShape.bbox();
        var localBBox = data[BNDR_SHAPE_BBOX];
        if (localBBox.containsPoint(localRef)) return anchor;
    }

    // Caching segment subdivisions for paths
    var pathOpt;
    if (localShape instanceof g.Path) {
        var precision = opt.precision || 2;
        if (!data[BNDR_SUBDIVISIONS]) data[BNDR_SUBDIVISIONS] = localShape.getSegmentSubdivisions({ precision: precision });
        pathOpt = {
            precision: precision,
            segmentSubdivisions: data[BNDR_SUBDIVISIONS]
        };
    }

    if (opt.extrapolate === true) localLine.setLength(1e6);

    intersection = localLine.intersect(localShape, pathOpt);
    if (intersection) {
        // More than one intersection
        if (V.isArray(intersection)) intersection = localRef.chooseClosest(intersection);
    } else if (opt.sticky === true) {
        // No intersection, find the closest point instead
        if (localShape instanceof g.Rect) {
            intersection = localShape.pointNearestToPoint(localRef);
        } else if (localShape instanceof g.Ellipse) {
            intersection = localShape.intersectionWithLineFromCenterToPoint(localRef);
        } else {
            intersection = localShape.closestPoint(localRef, pathOpt);
        }
    }

    var cp = (intersection) ? V.transformPoint(intersection, targetMatrix) : anchor;
    var cpOffset = opt.offset || 0;
    if (opt.stroke) cpOffset += stroke(node) / 2;

    return offsetPoint(cp, line.start, cpOffset);
}

export const anchor = anchorConnectionPoint;
export const bbox = bboxIntersection;
export const rectangle = rectangleIntersection;
export const boundary = boundaryIntersection;
