import * as util from '../util/index.mjs';
import { Point } from '../g/index.mjs';

function abs2rel(absolute, max) {

    if (max === 0) return '0%';
    // round to 3 decimal places
    const dp = 1000;
    const relative = Math.round(absolute / max * 100 * dp) / dp;
    return `${relative}%`;
}

export function pin(opt = {}) {

    return function(end, view, magnet, coords) {
        var fn = (view.isNodeConnection(magnet)) ? pinnedLinkEnd : pinnedElementEnd;
        return fn(opt, end, view, magnet, coords);
    };
}

function pinnedElementEnd(opt, end, view, magnet, coords) {

    const { relative, useModelGeometry, clamp } = opt;
    const element = view.model;
    const angle = element.angle();

    // Measure the same (unrotated) box the `topLeft` anchor resolves the offsets against,
    // and undo the rotation around the same point the anchor applies it.
    let bbox, origin;
    if (useModelGeometry) {
        const { port } = end;
        bbox = (port != null && element.hasPort(port)) ? element.getPortBBox(port) : element.getBBox();
        origin = bbox.center();
    } else {
        bbox = view.getNodeUnrotatedBBox(magnet);
        origin = element.getCenter();
    }

    const point = new Point(coords).rotate(origin, angle);
    let dx = point.x - bbox.x;
    let dy = point.y - bbox.y;

    if (clamp) {
        dx = Math.max(0, Math.min(bbox.width, dx));
        dy = Math.max(0, Math.min(bbox.height, dy));
    }

    if (relative) {
        dx = abs2rel(dx, bbox.width);
        dy = abs2rel(dy, bbox.height);
    }

    const args = { dx, dy, rotate: true };
    if (useModelGeometry) args.useModelGeometry = true;

    end.anchor = {
        name: 'topLeft',
        args
    };

    return end;
}

function pinnedLinkEnd(opt, end, view, _magnet, coords) {

    var connection = view.getConnection();
    if (!connection) return end;
    var length = connection.closestPointLength(coords);
    if (opt.relative) {
        var totalLength = connection.length();
        end.anchor = {
            name: 'connectionRatio',
            args: {
                ratio: length / totalLength
            }
        };
    } else {
        end.anchor = {
            name: 'connectionLength',
            args: {
                length: length
            }
        };
    }
    return end;
}

export const useDefaults = util.noop;
export const pinAbsolute = pin();
export const pinRelative = pin({ relative: true });
