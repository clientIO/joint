import * as util from '../util/index.mjs';
import { toRad, Rect } from '../g/index.mjs';
import { resolveRef } from '../linkAnchors/index.mjs';


function getModelBBoxFromConnectedLink(element, link, endType, rotate) {

    let bbox;

    const elementBBox = element.getBBox();
    const angle = element.angle();
    const portId = link.get(endType).port;

    if (element.hasPort(portId)) {
        const port = element.getPort(portId);
        // Note: the `angle` property of the `port` is ignore here for now
        bbox = new Rect(element.getPortsRects(port.group)[portId]);
        bbox.offset(elementBBox.x, elementBBox.y);
        bbox.moveAroundPoint(elementBBox.center(), -angle);
    } else {
        bbox = elementBBox;
    }

    if (!rotate) {
        bbox.rotateAroundCenter(-angle);
    }

    return bbox;
}

function bboxWrapper(method) {

    return function(elementView, magnet, ref, opt, endType, linkView) {

        const rotate = !!opt.rotate;
        const element = elementView.model;
        const link = linkView.model;
        const angle = element.angle();

        let bbox, center
        if (opt.useModelGeometry) {

            bbox = getModelBBoxFromConnectedLink(element, link, endType, rotate);
            center = bbox.center();

        } else {
            center = element.getBBox().center();
            bbox = (rotate) ? elementView.getNodeUnrotatedBBox(magnet) : elementView.getNodeBBox(magnet);
        }

        const anchor = bbox[method]();

        let dx = opt.dx;
        if (dx) {
            const dxPercentage = util.isPercentage(dx);
            dx = parseFloat(dx);
            if (isFinite(dx)) {
                if (dxPercentage) {
                    dx /= 100;
                    dx *= bbox.width;
                }
                anchor.x += dx;
            }
        }

        let dy = opt.dy;
        if (dy) {
            const dyPercentage = util.isPercentage(dy);
            dy = parseFloat(dy);
            if (isFinite(dy)) {
                if (dyPercentage) {
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
        bbox = getModelBBoxFromConnectedLink(element, linkView.model, endType, false);
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
    var center = view.model.getBBox().center();

    var bbox;
    if (opt.useModelGeometry) {
        bbox = getModelBBoxFromConnectedLink(view.model, linkView.model, endType, rotate);
        center = bbox.center();
    } else {
        bbox =  rotate ? view.getNodeUnrotatedBBox(magnet) : view.getNodeBBox(magnet);
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

