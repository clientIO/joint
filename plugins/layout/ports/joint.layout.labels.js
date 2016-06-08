(function(_, g, joint) {

    function labelAttributes(opt1, opt2) {

        return _.defaults({}, opt1, opt2, {
            x: 0,
            y: 0,
            angle: 0,
            attrs: {
                'text-anchor': 'start',
                y: '0'
            }
        });

    }

    function outsideLayout(angle, autoOrient, opt) {

        opt = _.defaults({}, opt, { offset: 15 });

        var tx, ty, y, textAnchor;
        var offset = opt.offset;
        var orientAngle = 0;

        if (angle < 45 || angle > 315) {
            y = '.3em';
            tx = offset;
            ty = 0;
            textAnchor = 'start';
        } else if (angle < 135) {
            y = '0';
            tx = 0;
            ty = -offset;
            if (autoOrient) {
                orientAngle = -90;
                textAnchor = 'start';
            } else {
                textAnchor = 'middle';
            }
        } else if (angle < 225) {
            y = '.3em';
            tx = -offset;
            ty = 0;
            textAnchor = 'end';
        } else {
            y = '.6em';
            tx = 0;
            ty = offset;
            if (autoOrient) {
                orientAngle = 90;
                textAnchor = 'start';
            } else {
                textAnchor = 'middle';
            }
        }

        var round = Math.round;
        return labelAttributes({
            x: round(tx),
            y: round(ty),
            angle: orientAngle,
            attrs: {
                y: y,
                'text-anchor': textAnchor
            }
        });
    }

    function insideLayout(angle, autoOrient, opt) {

        opt = _.defaults({}, opt, { offset: 15 });

        var tx, ty, y, textAnchor;
        var offset = opt.offset;
        var orientAngle = 0;

        if (angle < 45 || angle > 315) {
            y = '.3em';
            tx = -offset;
            ty = 0;
            textAnchor = 'end';
        } else if (angle < 135) {
            y = '.6em';
            tx = 0;
            ty = offset;
            if (autoOrient) {
                orientAngle = 90;
                textAnchor = 'start';
            } else {
                textAnchor = 'middle';
            }
        } else if (angle < 225) {
            y = '.3em';
            tx = offset;
            ty = 0;
            textAnchor = 'start';
        } else {
            y = '0em';
            tx = 0;
            ty = -offset;
            if (autoOrient) {
                orientAngle = -90;
                textAnchor = 'start';
            } else {
                textAnchor = 'middle';
            }
        }

        var round = Math.round;
        return labelAttributes({
            x: round(tx),
            y: round(ty),
            angle: orientAngle,
            attrs: {
                y: y,
                'text-anchor': textAnchor
            }
        });
    }

    function radialLayout(portCenterOffset, autoOrient, opt) {

        opt = _.defaults({}, opt, { offset: 20 });

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
            x: (offset.x),
            y: round(offset.y),
            angle: autoOrient ? orientAngle : 0,
            attrs: {
                y: y,
                'text-anchor': textAnchor
            }
        });
    }

    joint.layout.Label = {

        manual: _.rearg(labelAttributes, 2),

        left: function(portPosition, elBBox, opt) {
            return labelAttributes(opt, { x: -15, attrs: { '.': { y: '.3em', 'text-anchor': 'end' } } });
        },

        right: function(portPosition, elBBox, opt) {
            return labelAttributes(opt, { x: 15, attrs: { '.': { y: '.3em', 'text-anchor': 'start' } } });
        },

        top: function(portPosition, elBBox, opt) {
            return labelAttributes(opt, { y: -15, attrs: { '.': { 'text-anchor': 'middle' } } });
        },

        bottom: function(portPosition, elBBox, opt) {
            return labelAttributes(opt, { y: 15, attrs: { '.': { y: '.6em', 'text-anchor': 'middle' } } });
        },

        outsideOriented: function(portPosition, elBBox, opt) {
            return outsideLayout(elBBox.center().theta(portPosition), true, opt);
        },

        outside: function(portPosition, elBBox, opt) {
            return outsideLayout(elBBox.center().theta(portPosition), false, opt);
        },

        insideOriented: function(portPosition, elBBox, opt) {
            return insideLayout(elBBox.center().theta(portPosition), true, opt);
        },

        inside: function(portPosition, elBBox, opt) {
            return insideLayout(elBBox.center().theta(portPosition), false, opt);
        },

        radial: function(portPosition, elBBox, opt) {
            return radialLayout(portPosition.difference(elBBox.center()), false, opt);
        },

        radialOriented: function(portPosition, elBBox, opt) {
            return radialLayout(portPosition.difference(elBBox.center()), true, opt);
        }
    };

})(_, g, joint);
