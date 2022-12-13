import * as util from '../util/index.mjs';
import { toRad } from '../g/index.mjs';
import { resolveRef } from '../linkAnchors/index.mjs';

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

