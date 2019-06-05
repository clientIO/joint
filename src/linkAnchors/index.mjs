import { Line, Point } from '../g/index.mjs';
import { isPercentage } from '../util/index.mjs';

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
