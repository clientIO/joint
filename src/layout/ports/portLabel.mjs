import * as g from '../../g/index.mjs';
import * as util from '../../util/index.mjs';

function labelAttributes(opt1, opt2) {

    return util.defaultsDeep({}, opt1, opt2, {
        x: 0,
        y: 0,
        angle: 0,
        attrs: {}
    });
}

function outsideLayout(portPosition, elBBox, autoOrient, opt) {

    opt = util.defaults({}, opt, { offset: 15 });
    var angle = elBBox.center().theta(portPosition);
    var x = getBBoxAngles(elBBox);

    var tx, ty, y, textAnchor;
    var offset = opt.offset;
    var orientAngle = 0;

    if (angle < x[1] || angle > x[2]) {
        y = '.3em';
        tx = offset;
        ty = 0;
        textAnchor = 'start';
    } else if (angle < x[0]) {
        tx = 0;
        ty = -offset;
        if (autoOrient) {
            orientAngle = -90;
            textAnchor = 'start';
            y = '.3em';
        } else {
            textAnchor = 'middle';
            y = '0';
        }
    } else if (angle < x[3]) {
        y = '.3em';
        tx = -offset;
        ty = 0;
        textAnchor = 'end';
    } else {
        tx = 0;
        ty = offset;
        if (autoOrient) {
            orientAngle = 90;
            textAnchor = 'start';
            y = '.3em';
        } else {
            textAnchor = 'middle';
            y = '.6em';
        }
    }

    var round = Math.round;
    return labelAttributes({
        x: round(tx),
        y: round(ty),
        angle: orientAngle,
        attrs: { labelText: { y, textAnchor }}
    });
}

function getBBoxAngles(elBBox) {

    var center = elBBox.center();

    var tl = center.theta(elBBox.origin());
    var bl = center.theta(elBBox.bottomLeft());
    var br = center.theta(elBBox.corner());
    var tr = center.theta(elBBox.topRight());

    return [tl, tr, br, bl];
}

function insideLayout(portPosition, elBBox, autoOrient, opt) {

    var angle = elBBox.center().theta(portPosition);
    opt = util.defaults({}, opt, { offset: 15 });

    var tx, ty, y, textAnchor;
    var offset = opt.offset;
    var orientAngle = 0;

    var bBoxAngles = getBBoxAngles(elBBox);

    if (angle < bBoxAngles[1] || angle > bBoxAngles[2]) {
        y = '.3em';
        tx = -offset;
        ty = 0;
        textAnchor = 'end';
    } else if (angle < bBoxAngles[0]) {
        tx = 0;
        ty = offset;
        if (autoOrient) {
            orientAngle = 90;
            textAnchor = 'start';
            y = '.3em';
        } else {
            textAnchor = 'middle';
            y = '.6em';
        }
    } else if (angle < bBoxAngles[3]) {
        y = '.3em';
        tx = offset;
        ty = 0;
        textAnchor = 'start';
    } else {
        tx = 0;
        ty = -offset;
        if (autoOrient) {
            orientAngle = -90;
            textAnchor = 'start';
            y = '.3em';
        } else {
            textAnchor = 'middle';
            y = '0';
        }
    }

    var round = Math.round;
    return labelAttributes({
        x: round(tx),
        y: round(ty),
        angle: orientAngle,
        attrs: { labelText: { y, textAnchor }}
    });
}

function radialLayout(portCenterOffset, autoOrient, opt) {

    opt = util.defaults({}, opt, { offset: 20 });

    var origin = g.point(0, 0);
    var angle = -portCenterOffset.theta(origin);
    var orientAngle = angle;
    var offset = portCenterOffset.clone()
        .move(origin, opt.offset)
        .difference(portCenterOffset)
        .round();

    var y = '.3em';
    var textAnchor;

    if ((angle + 90) % 180 === 0) {
        textAnchor = autoOrient ? 'end' : 'middle';
        if (!autoOrient && angle === -270) {
            y = '0em';
        }
    } else if (angle > -270 && angle < -90) {
        textAnchor = 'start';
        orientAngle = angle - 180;
    } else {
        textAnchor = 'end';
    }

    var round = Math.round;
    return labelAttributes({
        x: round(offset.x),
        y: round(offset.y),
        angle: autoOrient ? orientAngle : 0,
        attrs: {
            labelText: {
                y,
                textAnchor
            }
        }
    });
}

export const manual = function(_portPosition, _elBBox, opt) {
    return labelAttributes(opt);
};

export const left = function(portPosition, elBBox, opt) {
    return labelAttributes(opt, {
        x: -15,
        attrs: { labelText: { y: '.3em', textAnchor: 'end' }},
    });
};

export const right = function(portPosition, elBBox, opt) {
    return labelAttributes(opt, {
        x: 15,
        attrs: { labelText: { y: '.3em', textAnchor: 'start' }},
    });
};

export const top = function(portPosition, elBBox, opt) {
    return labelAttributes(opt, {
        y: -15,
        attrs: { labelText: { y: '0', textAnchor: 'middle' }},
    });
};

export const bottom = function(portPosition, elBBox, opt) {
    return labelAttributes(opt, {
        y: 15,
        attrs: { labelText: { y: '.6em', textAnchor: 'middle' }},
    });
};

export const outsideOriented = function(portPosition, elBBox, opt) {
    return outsideLayout(portPosition, elBBox, true, opt);
};

export const outside = function(portPosition, elBBox, opt) {
    return outsideLayout(portPosition, elBBox, false, opt);
};

export const insideOriented = function(portPosition, elBBox, opt) {
    return insideLayout(portPosition, elBBox, true, opt);
};

export const inside = function(portPosition, elBBox, opt) {
    return insideLayout(portPosition, elBBox, false, opt);
};

export const radial = function(portPosition, elBBox, opt) {
    return radialLayout(portPosition.difference(elBBox.center()), false, opt);
};

export const radialOriented = function(portPosition, elBBox, opt) {
    return radialLayout(portPosition.difference(elBBox.center()), true, opt);
};

