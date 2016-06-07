(function(_, g, joint) {

    function lineLayout(ports, p1, p2) {
        return _.map(ports, function(port, index, ports) {
            var p = this.pointAt(((index + 0.5) / ports.length));
            // `dx`,`dy` per port offset option
            if (port.dx || port.dy) {
                p.offset(port.dx || 0, port.dy || 0);
            }
            return p.round();
        }, g.line(p1, p2));
    }

    function ellipseLayout(ports, elBBox, startAngle, stepFn) {

        var center = elBBox.center();
        var ratio = elBBox.width / elBBox.height;
        var p1 = g.point(elBBox.width / 2, 0);

        return _.map(ports, function(port, index, ports) {

            var p2 = p1.clone()
                    .rotate(center, startAngle + stepFn(index, ports.length))
                    .scale(ratio, 1, center);

            // `dx`,`dy` per port offset option
            if (port.dx || port.dy) {
                p2.offset(port.dx || 0, port.dy || 0);
            }

            // `dr` delta radius option
            if (port.dr) {
                p2.move(center, port.dr);
            }

            return p2.round();
        });
    }

    // Creates a point stored in arguments
    function argPoint(bbox, args) {

        var x = args.x;
        if (_.isString(x)) {
            x = parseFloat(x) / 100 * bbox.width;
        }

        var y = args.y;
        if (_.isString(y)) {
            y = parseFloat(y) / 100 * bbox.height;
        }

        return g.point(x || 0, y || 0);
    }

    joint.layout.Port = {

        /**
         * @param {Array<Object>} ports
         * @param {g.Rect} elBBox
         * @param {Object=} opt opt Group options
         * @returns {Array<g.Point>}
         */
        absolute: function(ports, elBBox, opt) {
            return _.map(ports, _.partial(argPoint, elBBox));
        },

        /**
         * @param {Array<Object>} ports
         * @param {g.Rect} elBBox
         * @param {Object=} opt opt Group options
         * @returns {Array<g.Point>}
         */
        fn: function(ports, elBBox, opt) {
            return opt.position.args.fn(ports, elBBox, opt);
        },

        /**
         * @param {Array<Object>} ports
         * @param {g.Rect} elBBox
         * @param {Object=} opt opt Group options
         * @returns {Array<g.Point>}
         */
        line: function(ports, elBBox, opt) {

            var start = argPoint(elBBox, ports[0].start || elBBox.origin());
            var end = argPoint(elBBox, ports[0].end || elBBox.corner());

            return lineLayout(ports, start, end);
        },

        /**
         * @param {Array<Object>} ports
         * @param {g.Rect} elBBox
         * @param {Object=} opt opt Group options
         * @returns {Array<g.Point>}
         */
        left: function(ports, elBBox, opt) {
            return lineLayout(ports, elBBox.origin(), elBBox.bottomLeft());
        },

        /**
         * @param {Array<Object>} ports
         * @param {g.Rect} elBBox
         * @param {Object=} opt opt Group options
         * @returns {Array<g.Point>}
         */
        right: function(ports, elBBox, opt) {
            return lineLayout(ports, elBBox.topRight(), elBBox.corner());
        },

        /**
         * @param {Array<Object>} ports
         * @param {g.Rect} elBBox
         * @param {Object=} opt opt Group options
         * @returns {Array<g.Point>}
         */
        top: function(ports, elBBox, opt) {
            return lineLayout(ports, elBBox.origin(), elBBox.topRight());
        },

        /**
         * @param {Array<Object>} ports
         * @param {g.Rect} elBBox
         * @param {Object=} opt opt Group options
         * @returns {Array<g.Point>}
         */
        bottom: function(ports, elBBox, opt) {
            return lineLayout(ports, elBBox.bottomLeft(), elBBox.corner());
        },

        /**
         * @param {Array<Object>} ports
         * @param {g.Rect} elBBox
         * @param {Object=} opt Group options
         * @returns {Array<g.Point>}
         */
        ellipseSpread: function(ports, elBBox, opt) {

            var startAngle = opt.position.args.startAngle || 0;
            var stepAngle = opt.position.args.step || 360 / ports.length;

            return ellipseLayout(ports, elBBox, startAngle, function(index) {
                return index * stepAngle;
            });
        },

        /**
         * @param {Array<Object>} ports
         * @param {g.Rect} elBBox
         * @param {Object=} opt Group options
         * @returns {Array<g.Point>}
         */
        ellipse: function(ports, elBBox, opt) {

            var startAngle = opt.position.args.startAngle || 0;
            var stepAngle = opt.position.args.step || 360 / ports.length;

            return ellipseLayout(ports, elBBox, startAngle, function(index, count) {
                return (index + 0.5 - count / 2) * stepAngle;
            });
        }
    };

})(_, g, joint);
