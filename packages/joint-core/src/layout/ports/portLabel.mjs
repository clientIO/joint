import * as g from '../../g/index.mjs';
import * as util from '../../util/index.mjs';

function labelAttributes(opt1, opt2) {

    // use value from `opt2` if it is missing in `opt1`
    // use value from this object if it is missing in `opt2` as well
    return util.defaultsDeep({}, opt1, opt2, {
        x: 0,
        y: 0,
        angle: 0,
        attrs: {}
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

function outsideLayout(portPosition, elBBox, autoOrient, opt) {

    opt = util.defaults({}, opt, { offset: 15 });
    var angle = elBBox.center().theta(portPosition);

    var tx, ty, y, textAnchor;
    var offset = opt.offset;
    var orientAngle = 0;

    const [topLeftAngle, bottomLeftAngle, bottomRightAngle, topRightAngle] = getBBoxAngles(elBBox);
    if ((angle < bottomLeftAngle) || (angle > bottomRightAngle)) {
        y = '.3em';
        tx = offset;
        ty = 0;
        textAnchor = 'start';
    } else if (angle < topLeftAngle) {
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
    } else if (angle < topRightAngle) {
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
    return labelAttributes(opt, {
        x: round(tx),
        y: round(ty),
        angle: orientAngle,
        attrs: { labelText: { y, textAnchor }}
    });
}

function insideLayout(portPosition, elBBox, autoOrient, opt) {

    opt = util.defaults({}, opt, { offset: 15 });
    var angle = elBBox.center().theta(portPosition);

    var tx, ty, y, textAnchor;
    var offset = opt.offset;
    var orientAngle = 0;

    const [topLeftAngle, bottomLeftAngle, bottomRightAngle, topRightAngle] = getBBoxAngles(elBBox);
    if ((angle < bottomLeftAngle) || (angle > bottomRightAngle)) {
        y = '.3em';
        tx = -offset;
        ty = 0;
        textAnchor = 'end';
    } else if (angle < topLeftAngle) {
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
    } else if (angle < topRightAngle) {
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
    return labelAttributes(opt, {
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
    return labelAttributes(opt, {
        x: round(offset.x),
        y: round(offset.y),
        angle: ((autoOrient) ? orientAngle : 0),
        attrs: { labelText: { y, textAnchor }}
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
