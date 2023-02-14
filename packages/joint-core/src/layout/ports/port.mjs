import { evalCalcAttribute, isCalcAttribute } from '../../dia/attributes/calc.mjs';
import * as g from '../../g/index.mjs';
import * as util from '../../util/index.mjs';

function portTransformAttrs(point, angle, opt) {

    var trans = point.toJSON();

    trans.angle = angle || 0;

    return util.defaults({}, opt, trans);
}

function lineLayout(ports, p1, p2, elBBox) {
    return ports.map(function(port, index, ports) {
        var p = this.pointAt(((index + 0.5) / ports.length));
        // `dx`,`dy` per port offset option
        if (port.dx || port.dy) {
            p.offset(port.dx || 0, port.dy || 0);
        }
        return portTransformAttrs(p.round(), 0, argTransform(elBBox, port));
    }, g.line(p1, p2));
}

function ellipseLayout(ports, elBBox, startAngle, stepFn) {

    var center = elBBox.center();
    var ratio = elBBox.width / elBBox.height;
    var p1 = elBBox.topMiddle();

    var ellipse = g.Ellipse.fromRect(elBBox);

    return ports.map(function(port, index, ports) {

        var angle = startAngle + stepFn(index, ports.length);
        var p2 = p1.clone()
            .rotate(center, -angle)
            .scale(ratio, 1, center);

        var theta = port.compensateRotation ? -ellipse.tangentTheta(p2) : 0;

        // `dx`,`dy` per port offset option
        if (port.dx || port.dy) {
            p2.offset(port.dx || 0, port.dy || 0);
        }

        // `dr` delta radius option
        if (port.dr) {
            p2.move(center, port.dr);
        }

        return portTransformAttrs(p2.round(), theta, argTransform(elBBox, port));
    });
}


function argTransform(bbox, args) {
    let { x, y, angle } = args;
    if (util.isPercentage(x)) {
        x = parseFloat(x) / 100 * bbox.width;
    } else if (isCalcAttribute(x)) {
        x = Number(evalCalcAttribute(x, bbox));
    }
    if (util.isPercentage(y)) {
        y = parseFloat(y) / 100 * bbox.height;
    } else if (isCalcAttribute(y)) {
        y = Number(evalCalcAttribute(y, bbox));
    }
    return { x, y, angle };
}

// Creates a point stored in arguments
function argPoint(bbox, args) {
    const { x, y } = argTransform(bbox, args);
    return new g.Point(x || 0, y || 0);
}


/**
 * @param {Array<Object>} ports
 * @param {g.Rect} elBBox
 * @param {Object=} opt opt Group options
 * @returns {Array<g.Point>}
 */
export const absolute = function(ports, elBBox) {
    return ports.map(port => {
        const transformation = argPoint(elBBox, port).round().toJSON();
        transformation.angle = port.angle || 0;
        return transformation;
    });
};

/**
 * @param {Array<Object>} ports
 * @param {g.Rect} elBBox
 * @param {Object=} opt opt Group options
 * @returns {Array<g.Point>}
 */
export const fn = function(ports, elBBox, opt) {
    return opt.fn(ports, elBBox, opt);
};

/**
 * @param {Array<Object>} ports
 * @param {g.Rect} elBBox
 * @param {Object=} opt opt Group options
 * @returns {Array<g.Point>}
 */
export const line = function(ports, elBBox, opt) {

    var start = argPoint(elBBox, opt.start || elBBox.origin());
    var end = argPoint(elBBox, opt.end || elBBox.corner());

    return lineLayout(ports, start, end, elBBox);
};

/**
 * @param {Array<Object>} ports
 * @param {g.Rect} elBBox
 * @param {Object=} opt opt Group options
 * @returns {Array<g.Point>}
 */
export const left = function(ports, elBBox, opt) {
    return lineLayout(ports, elBBox.origin(), elBBox.bottomLeft(), elBBox);
};

/**
 * @param {Array<Object>} ports
 * @param {g.Rect} elBBox
 * @param {Object=} opt opt Group options
 * @returns {Array<g.Point>}
 */
export const right = function(ports, elBBox, opt) {
    return lineLayout(ports, elBBox.topRight(), elBBox.corner(), elBBox);
};

/**
 * @param {Array<Object>} ports
 * @param {g.Rect} elBBox
 * @param {Object=} opt opt Group options
 * @returns {Array<g.Point>}
 */
export const top = function(ports, elBBox, opt) {
    return lineLayout(ports, elBBox.origin(), elBBox.topRight(), elBBox);
};

/**
 * @param {Array<Object>} ports
 * @param {g.Rect} elBBox
 * @param {Object=} opt opt Group options
 * @returns {Array<g.Point>}
 */
export const bottom = function(ports, elBBox, opt) {
    return lineLayout(ports, elBBox.bottomLeft(), elBBox.corner(), elBBox);
};

/**
 * @param {Array<Object>} ports
 * @param {g.Rect} elBBox
 * @param {Object=} opt Group options
 * @returns {Array<g.Point>}
 */
export const ellipseSpread = function(ports, elBBox, opt) {

    var startAngle = opt.startAngle || 0;
    var stepAngle = opt.step || 360 / ports.length;

    return ellipseLayout(ports, elBBox, startAngle, function(index) {
        return index * stepAngle;
    });
};

/**
 * @param {Array<Object>} ports
 * @param {g.Rect} elBBox
 * @param {Object=} opt Group options
 * @returns {Array<g.Point>}
 */
export const ellipse = function(ports, elBBox, opt) {

    var startAngle = opt.startAngle || 0;
    var stepAngle = opt.step || 20;

    return ellipseLayout(ports, elBBox, startAngle, function(index, count) {
        return (index + 0.5 - count / 2) * stepAngle;
    });
};

