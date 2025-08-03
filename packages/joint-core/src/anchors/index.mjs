import * as util from '../util/index.mjs';
import { toRad } from '../g/index.mjs';
import { resolveRef } from '../linkAnchors/index.mjs';

const Side = {
    LEFT: 'left',
    RIGHT: 'right',
    TOP: 'top',
    BOTTOM: 'bottom',
};

const SideMode = {
    PREFER_HORIZONTAL: 'prefer-horizontal',
    PREFER_VERTICAL: 'prefer-vertical',
    HORIZONTAL: 'horizontal',
    VERTICAL: 'vertical',
    AUTO: 'auto',
};

function getModelBBoxFromConnectedLink(element, link, endType, rotate) {

    const portId = link.get(endType).port;
    if (element.hasPort(portId)) {
        return element.getPortBBox(portId, { rotate });
    }

    return element.getBBox({ rotate });
}

function getMiddleSide(rect, point, opt) {

    const { preferenceThreshold = 0, mode } = opt;
    const { x, y } = point;
    const { x: left , y: top, width, height } = rect;

    switch (mode) {

        case SideMode.PREFER_VERTICAL: {
            const {
                top: topThreshold,
                bottom: bottomThreshold
            } = util.normalizeSides(preferenceThreshold);
            const bottom = top + height;
            if (y > top - topThreshold && y < bottom + bottomThreshold) {
                const cx = left + width / 2;
                return (x < cx) ? Side.LEFT : Side.RIGHT;
            }
        }
        // eslint-disable-next-line no-fallthrough
        case SideMode.VERTICAL: {
            const cy = top + height / 2;
            return (y < cy) ? Side.TOP : Side.BOTTOM;
        }

        case SideMode.PREFER_HORIZONTAL: {
            const {
                left: leftThreshold,
                right: rightThreshold
            } = util.normalizeSides(preferenceThreshold);
            const right = left + width;
            if (x > left - leftThreshold && x < right + rightThreshold) {
                const cy = top + height / 2;
                return (y < cy) ? Side.TOP : Side.BOTTOM;
            }
        }
        // eslint-disable-next-line no-fallthrough
        case SideMode.HORIZONTAL: {
            const cx = left + width / 2;
            return (x < cx) ? Side.LEFT : Side.RIGHT;
        }

        case SideMode.AUTO:
        default: {
            return rect.sideNearestToPoint(point);
        }
    }
}

function bboxWrapper(method) {

    return function(elementView, magnet, ref, opt, endType, linkView) {

        const rotate = !!opt.rotate;
        const element = elementView.model;
        const link = linkView.model;
        const angle = element.angle();

        let bbox, center;
        if (opt.useModelGeometry) {
            bbox = getModelBBoxFromConnectedLink(element, link, endType, !rotate);
            center = bbox.center();
        } else {
            center = element.getCenter();
            bbox = (rotate) ? elementView.getNodeUnrotatedBBox(magnet) : elementView.getNodeBBox(magnet);
        }

        const anchor = bbox[method]();

        let dx = opt.dx;
        if (dx) {
            const isDxPercentage = util.isPercentage(dx);
            if (!isDxPercentage && util.isCalcExpression(dx)) {
                // calc expression
                dx = Number(util.evalCalcExpression(dx, bbox));
            } else {
                // percentage or a number
                dx = parseFloat(dx);
            }
            if (isFinite(dx)) {
                if (isDxPercentage) {
                    dx /= 100;
                    dx *= bbox.width;
                }
                anchor.x += dx;
            }
        }

        let dy = opt.dy;
        if (dy) {
            const isDyPercentage = util.isPercentage(dy);
            if (!isDyPercentage && util.isCalcExpression(dy)) {
                // calc expression
                dy = Number(util.evalCalcExpression(dy, bbox));
            } else {
                // percentage or a number
                dy = parseFloat(dy);
            }
            if (isFinite(dy)) {
                if (isDyPercentage) {
                    dy /= 100;
                    dy *= bbox.height;
                }
                anchor.y += dy;
            }
        }

        return (rotate) ? anchor.rotate(center, -angle) : anchor;
    };
}

function _perpendicular(elementView, magnet, refPoint, opt, endType, linkView) {

    const element = elementView.model;
    const angle = element.angle();

    let bbox;
    if (opt.useModelGeometry) {
        bbox = getModelBBoxFromConnectedLink(element, linkView.model, endType, true);
    } else {
        bbox = elementView.getNodeBBox(magnet);
    }

    const anchor = bbox.center();
    const topLeft = bbox.origin();
    const bottomRight = bbox.corner();

    let padding = opt.padding;
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

function _midSide(view, magnet, refPoint, opt, endType, linkView) {
    var rotate = !!opt.rotate;
    var angle = view.model.angle();
    var center = view.model.getCenter();

    var bbox;
    if (opt.useModelGeometry) {
        bbox = getModelBBoxFromConnectedLink(view.model, linkView.model, endType, !rotate);
        center = bbox.center();
    } else {
        bbox =  rotate ? view.getNodeUnrotatedBBox(magnet) : view.getNodeBBox(magnet);
    }

    var padding = opt.padding;
    if (isFinite(padding)) bbox.inflate(padding);

    if (rotate) refPoint.rotate(center, angle);

    var side = getMiddleSide(bbox, refPoint, opt);
    var anchor;
    switch (side) {
        case Side.LEFT:
            anchor = bbox.leftMiddle();
            break;
        case Side.RIGHT:
            anchor = bbox.rightMiddle();
            break;
        case Side.TOP:
            anchor = bbox.topMiddle();
            break;
        case Side.BOTTOM:
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

