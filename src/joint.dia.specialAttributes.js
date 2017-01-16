(function(joint, _, g) {

    function isPercentage(val) {
        return _.isString(val) && val.slice(-1) === '%';
    }

    function createSetRelatively(attrName, dimension) {
        return function setRelatively(vel, value, refBBox) {
            var isValuePercentage = isPercentage(value);
            value = parseFloat(value);
            if (isValuePercentage) {
                value /= 100;
            }

            if (isFinite(value)) {
                var attrValue = (isValuePercentage || value >= 0 && value <= 1)
                    ? value * refBBox[dimension]
                    : Math.max(value + refBBox[dimension], 0);
                vel.attr(attrName, attrValue);
            }
        };
    }

    var specialAttributes = joint.dia.specialAttributes = {

        filter: {
            qualify: _.isObject,
            set: function($elements, filter) {
                this.applyFilter($elements, filter);
            }
        },

        fill: {
            qualify: _.isObject,
            set: function($elements, fill) {
                this.applyGradient($elements, 'fill', fill);
            }
        },

        stroke: {
            qualify: _.isObject,
            set: function($elements, stroke) {
                this.applyGradient($elements, 'stroke', stroke);
            }
        },

        text: {
            set: function($elements, text, attrs) {
                for (var i = 0, n = $elements.length; i < n; i++) {
                    V($elements[i]).text(text + '', {
                        lineHeight: attrs.lineHeight,
                        textPath: attrs.textPath,
                        annotations: attrs.annotations
                    });
                }
            }
        },

        lineHeight: {
            qualify: function(lh, attrs) {
                return _.isUndefined(attrs.text);
            }
        },

        textPath: {
            qualify: function(tp, attrs) {
                return _.isUndefined(attrs.text);
            }
        },

        annotations: {
            qualify: function(a, attrs) {
                return _.isUndefined(attrs.text);
            }
        },

        // `port` attribute contains the `id` of the port that the underlying magnet represents.
        port: {
            set: function($elements, port) {
                var portId = _.isUndefined(port.id) ? port : port.id;
                $elements.attr('port', portId);
            }
        },

        // `style` attribute is special in the sense that it sets the CSS style of the subelement.
        style: {
            qualify: _.isObject,
            set: function($elements, styles) {
                $elements.css(styles);
            }
        },

        html: {
            set: function($elements, html) {
                $elements.html(html + '');
            }
        },

        ref: {
            // We do not set `ref` attribute directly on an element.
            // The attribute itself does not qualify for relative positioning.
        },

        // if `refX` is in [0, 1] then `refX` is a fraction of bounding box width
        // if `refX` is < 0 then `refX`'s absolute values is the right coordinate of the bounding box
        // otherwise, `refX` is the left coordinate of the bounding box

        refX: {

            positionRelatively: function(refX, refBBox) {

                var tx;

                var refXPercentage = isPercentage(refX);
                refX = parseFloat(refX);
                if (refXPercentage) {
                    refX /= 100;
                }

                if (isFinite(refX)) {
                    if (refXPercentage || refX > 0 && refX < 1) {
                        tx = refBBox.x + refBBox.width * refX;
                    } else {
                        tx = refBBox.x + refX;
                    }
                }

                return g.Point(tx, 0);
            }
        },

        refY: {

            positionRelatively: function(refY, refBBox) {

                var ty;

                var refYPercentage = isPercentage(refY);
                refY = parseFloat(refY);
                if (refYPercentage) {
                    refY /= 100;
                }

                if (isFinite(refY)) {
                    if (refYPercentage || refY > 0 && refY < 1) {
                        ty = refBBox.y + refBBox.height * refY;
                    } else {
                        ty = refBBox.y + refY;
                    }
                }

                return g.Point(0, ty);
            }
        },

        // `ref-dx` and `ref-dy` define the offset of the subelement relative to the right and/or bottom
        // coordinate of the reference element.

        refDx: {

            positionRelatively: function(refDx, refBBox) {

                var tx;

                refDx = parseFloat(refDx);

                if (isFinite(refDx)) {
                    tx = refBBox.x + refBBox.width + refDx;
                }

                return g.Point(tx, 0);
            }
        },

        refDy: {

            positionRelatively: function(refDy, refBBox) {

                var ty;

                refDy = parseFloat(refDy);

                if (isFinite(refDy)) {
                    ty = refBBox.y + refBBox.height + refDy;
                }

                return g.Point(0, ty);
            }
        },

        // 'ref-width'/'ref-height' defines the width/height of the subelement relatively to
        // the reference element size
        // val in 0..1         ref-width = 0.75 sets the width to 75% of the ref. el. width
        // val < 0 || val > 1  ref-height = -20 sets the height to the the ref. el. height shorter by 20

        refWidth: {
            setRelatively: createSetRelatively('width', 'width')
        },

        refHeight: {
            setRelatively: createSetRelatively('height', 'height')
        },

        refRx: {
            setRelatively: createSetRelatively('rx', 'width')
        },

        refRy: {
            setRelatively: createSetRelatively('ry', 'height')
        },

        refCx: {
            setRelatively: createSetRelatively('cx', 'width')
        },

        refCy: {
            setRelatively: createSetRelatively('cy', 'height')
        },

        // The path data `d` attribute to be defined via an array.
        // e.g. d: ['M', 0, '25%', '100%', '25%', 'M', '100%', '75%', 0, '75%']
        d: {
            qualify: _.isArray,
            setRelatively: function(vel, value, elBBox) {
                var i = 0;
                var attrValue = value.map(function(data, index) {
                    if (_.isString(data)) {
                        if (isPercentage(data)) {
                            return parseFloat(data) / 100 * elBBox[ ((index - i) % 2) ? 'height' : 'width'];
                        } else {
                            i++;
                        }
                    }
                    return data;
                }).join(' ');
                vel.attr('d', attrValue);
            }
        },
        // `x-alignment` when set to `middle` causes centering of the subelement around its new x coordinate.
        // `x-alignment` when set to `right` uses the x coordinate as referenced to the right of the bbox.

        xAlignment: {

            position: function(xAlignment, elBBox) {

                var tx;

                if (xAlignment === 'middle') {

                    tx = -elBBox.width / 2;

                } else if (xAlignment === 'right') {

                    tx = -elBBox.width;

                } else if (isFinite(xAlignment)) {

                    tx = (xAlignment > -1 && xAlignment < 1) ? elBBox.width * xAlignment : xAlignment;
                }

                return g.Point(tx, 0);
            }
        },

        // `y-alignment` when set to `middle` causes centering of the subelement around its new y coordinate.
        // `y-alignment` when set to `bottom` uses the y coordinate as referenced to the bottom of the bbox.

        yAlignment: {

            position: function(yAlignment, elBBox) {

                var ty;

                if (yAlignment === 'middle') {

                    ty = -elBBox.height / 2;

                } else if (yAlignment === 'bottom') {

                    ty = -elBBox.height;

                } else if (isFinite(yAlignment)) {

                    ty = (yAlignment > -1 && yAlignment < 1) ? elBBox.height * yAlignment : yAlignment;
                }

                return g.Point(0, ty);
            }
        }
    };

    // Aliases for backwards compatibility
    specialAttributes['ref-x'] = specialAttributes.refX;
    specialAttributes['ref-y'] = specialAttributes.refY;
    specialAttributes['ref-dy'] = specialAttributes.refDy;
    specialAttributes['ref-dx'] = specialAttributes.refDx;
    specialAttributes['ref-width'] = specialAttributes.refWidth;
    specialAttributes['ref-height'] = specialAttributes.refHeight;
    specialAttributes['x-alignment'] = specialAttributes.xAlignment;
    specialAttributes['y-alignment'] = specialAttributes.yAlignment;

})(joint, _, g);
