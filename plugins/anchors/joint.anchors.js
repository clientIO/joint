import * as util from '../../src/util.js';
import { toRad } from '../../src/geometry.js';
import { resolveRef } from './linkAnchors.mjs';

function bboxWrapper(method) {

    return function(view, magnet, ref, opt) {

        var rotate = !!opt.rotate;
        var bbox = (rotate) ? view.getNodeUnrotatedBBox(magnet) : view.getNodeBBox(magnet);
        var anchor = bbox[method]();

        var dx = opt.dx;
        if (dx) {
            var dxPercentage = util.isPercentage(dx);
            dx = parseFloat(dx);
            if (isFinite(dx)) {
                if (dxPercentage) {
                    dx /= 100;
                    dx *= bbox.width;
                }
                anchor.x += dx;
            }
        }

        var dy = opt.dy;
        if (dy) {
            var dyPercentage = util.isPercentage(dy);
            dy = parseFloat(dy);
            if (isFinite(dy)) {
                if (dyPercentage) {
                    dy /= 100;
                    dy *= bbox.height;
                }
                anchor.y += dy;
            }
        }

        return (rotate) ? anchor.rotate(view.model.getBBox().center(), -view.model.angle()) : anchor;
    };
}

function _perpendicular(view, magnet, refPoint, opt) {

    var angle = view.model.angle();
    var bbox = view.getNodeBBox(magnet);
    var anchor = bbox.center();
    var topLeft = bbox.origin();
    var bottomRight = bbox.corner();

    var padding = opt.padding;
    if (!isFinite(padding)) padding = 0;

    if ((topLeft.y + padding) <= refPoint.y && refPoint.y <= (bottomRight.y - padding)) {
        var dy = (refPoint.y - anchor.y);
        anchor.x += (angle === 0 || angle === 180) ? 0 : dy * 1 / Math.tan(toRad(angle));
        anchor.y += dy;
    } else if ((topLeft.x + padding) <= refPoint.x && refPoint.x <= (bottomRight.x - padding)) {
        var dx = (refPoint.x - anchor.x);
        anchor.y += (angle === 90 || angle === 270) ? 0 : dx * Math.tan(toRad(angle));
        anchor.x += dx;
    }

    return anchor;
}

function _midSide(view, magnet, refPoint, opt) {

    var rotate = !!opt.rotate;
    var bbox, angle, center;
    if (rotate) {
        bbox = view.getNodeUnrotatedBBox(magnet);
        center = view.model.getBBox().center();
        angle = view.model.angle();
    } else {
        bbox = view.getNodeBBox(magnet);
    }

    var padding = opt.padding;
    if (isFinite(padding)) bbox.inflate(padding);

    if (rotate) refPoint.rotate(center, angle);

    var side = bbox.sideNearestToPoint(refPoint);
    var anchor;
    switch (side) {
        case 'left':
            anchor = bbox.leftMiddle();
            break;
        case 'right':
            anchor = bbox.rightMiddle();
            break;
        case 'top':
            anchor = bbox.topMiddle();
            break;
        case 'bottom':
            anchor = bbox.bottomMiddle();
            break;
    }

    return (rotate) ? anchor.rotate(center, -angle) : anchor;
}

// Can find anchor from model, when there is no selector or the link end
// is connected to a port
function _modelCenter(view, _magnet, _refPoint, opt, endType) {
    return view.model.getPointFromConnectedLink(this.model, endType).offset(opt.dx, opt.dy);
}

//joint.anchors
export const center = bboxWrapper('center');
export const top = bboxWrapper('topMiddle');
export const bottom = bboxWrapper('bottomMiddle');
export const left = bboxWrapper('leftMiddle');
export const right = bboxWrapper('rightMiddle');
export const topLeft = bboxWrapper('origin');
export const topRight = bboxWrapper('topRight');
export const bottomLeft = bboxWrapper('bottomLeft');
export const bottomRight = bboxWrapper('corner');
export const perpendicular = resolveRef(_perpendicular);
export const midSide = resolveRef(_midSide);
export const modelCenter = _modelCenter;

import { Line, Point } from '../../src/geometry.js';
import { Element } from '../../src/joint.dia.element.js';
import { isPercentage } from '../../src/util.js';

function connectionRatio(view, _magnet, _refPoint, opt) {

    var ratio = ('ratio' in opt) ? opt.ratio : 0.5;
    return view.getPointAtRatio(ratio);
}

function connectionLength(view, _magnet, _refPoint, opt) {

    var length = ('length' in opt) ? opt.length : 20;
    return view.getPointAtLength(length);
}

function _connectionPerpendicular(view, _magnet, refPoint, opt) {

    var OFFSET = 1e6;
    var path = view.getConnection();
    var segmentSubdivisions = view.getConnectionSubdivisions();
    var verticalLine = new Line(refPoint.clone().offset(0, OFFSET), refPoint.clone().offset(0, -OFFSET));
    var horizontalLine = new Line(refPoint.clone().offset(OFFSET, 0), refPoint.clone().offset(-OFFSET, 0));
    var verticalIntersections = verticalLine.intersect(path, { segmentSubdivisions: segmentSubdivisions });
    var horizontalIntersections = horizontalLine.intersect(path, { segmentSubdivisions: segmentSubdivisions });
    var intersections = [];
    if (verticalIntersections) Array.prototype.push.apply(intersections, verticalIntersections);
    if (horizontalIntersections) Array.prototype.push.apply(intersections, horizontalIntersections);
        if (intersections.length > 0) return refPoint.chooseClosest(intersections);
    if ('fallbackAt' in opt) {
        return getPointAtLink(view, opt.fallbackAt);
    }
    return connectionClosest(view, _magnet, refPoint, opt);
}

function _connectionClosest(view, _magnet, refPoint, _opt) {

    var closestPoint = view.getClosestPoint(refPoint);
    if (!closestPoint) return new Point();
    return closestPoint;
}

export function resolveRef(fn) {
    return function(view, magnet, ref, opt) {
        if (ref instanceof Element) {
            var refView = this.paper.findView(ref);
            var refPoint;
            if (refView) {
                if (refView.isNodeConnection(ref)) {
                    var distance = ('fixedAt' in opt) ? opt.fixedAt : '50%';
                        refPoint = getPointAtLink(refView, distance);
                } else {
                    refPoint = refView.getNodeBBox(ref).center();
                }
            } else {
                // Something went wrong
                refPoint = new Point();
            }
            return fn.call(this, view, magnet, refPoint, opt);
        }
        return fn.apply(this, arguments);
    };
}

function getPointAtLink(view, value) {
    var parsedValue = parseFloat(value);
    if (isPercentage(value)) {
        return view.getPointAtRatio(parsedValue / 100);
    } else {
        return view.getPointAtLength(parsedValue);
    }
}

// joint.linkAnchors
export { connectionRatio, connectionLength };
export const connectionPerpendicular = resolveRef(_connectionPerpendicular);
export const connectionClosest = resolveRef(_connectionClosest);
