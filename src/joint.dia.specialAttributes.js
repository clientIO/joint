(function(joint, _, g, $) {

    function isPercentage(val) {
        return _.isString(val) && val.slice(-1) === '%';
    }

    function sizeWrapper(attrName, dimension) {
        return function(value, refBBox) {
            var isValuePercentage = isPercentage(value);
            value = parseFloat(value);
            if (isValuePercentage) {
                value /= 100;
            }

            var attrs = {};
            if (isFinite(value)) {
                var attrValue = (isValuePercentage || value >= 0 && value <= 1)
                    ? value * refBBox[dimension]
                    : Math.max(value + refBBox[dimension], 0);
                attrs[attrName] = attrValue;
            }

            return attrs;
        };
    }

    function positionWrapper(axis, dimension, origin) {
        return function(value, refBBox) {
            var valuePercentage = isPercentage(value);
            value = parseFloat(value);
            if (valuePercentage) {
                value /= 100;
            }

            var delta;
            if (isFinite(value)) {
                var refOrigin = refBBox[origin]();
                if (valuePercentage || value > 0 && value < 1) {
                    delta = refOrigin[axis] + refBBox[dimension] * value;
                } else {
                    delta = refOrigin[axis] + value;
                }
            }

            var point = g.Point();
            point[axis] = delta || 0;
            return point;
        };
    }

    function anchorWrapper(axis, dimension, corner) {
        return function(value, nodeBBox) {
            var delta;
            if (value === 'middle') {
                delta = nodeBBox[dimension] / 2;
            } else if (value === corner) {
                delta = nodeBBox[dimension];
            } else if (isFinite(value)) {
                // TODO: or not to do a breaking change?
                delta = (value > -1 && value < 1) ? (-nodeBBox[dimension] * value) : -value;
            } else if (isPercentage(value)) {
                delta = nodeBBox[dimension] * parseFloat(value) / 100;
            }

            var point = g.Point();
            point[axis] = nodeBBox[axis] + delta || 0;
            return point;
        };
    }

    var specialAttributes = joint.dia.specialAttributes = {

        strokeWidth: {
            set: 'stroke-width'
        },

        fontSize: {
            set: 'font-size'
        },

        fontFamily: {
            set: 'font-family'
        },

        xlinkHref: {
            set: 'xlink:href'
        },

        filter: {
            qualify: _.isPlainObject,
            set: function(filter) {
                return 'url(#' + this.paper.defineFilter(filter) + ')';
            }
        },

        fill: {
            qualify: _.isPlainObject,
            set: function(fill) {
                return 'url(#' + this.paper.defineGradient(fill) + ')';
            }
        },

        stroke: {
            qualify: _.isPlainObject,
            set: function(stroke) {
                return 'url(#' + this.paper.defineGradient(stroke) + ')';
            }
        },

        sourceMarker: {
            qualify: _.isObject,
            set: function(marker) {
                return { 'marker-start': 'url(#' + this.paper.defineMarker(marker) + ')' };
            }
        },

        targetMarker: {
            qualify: _.isObject,
            set: function(marker) {
                marker = _.assign({ transform: 'rotate(180)' }, marker);
                return { 'marker-end': 'url(#' + this.paper.defineMarker(marker) + ')' };
            }
        },

        vertexMarker: {
            qualify: _.isObject,
            set: function(marker) {
                return { 'marker-mid': 'url(#' + this.paper.defineMarker(marker) + ')' };
            }
        },

        text: {
            set: function(text, node, attrs) {
                var $node = $(node);
                var cacheName = 'joint-text';
                var cache = $node.data(cacheName);
                var textAttrs = _.pick(attrs, 'lineHeight', 'annotations', 'textPath', 'font-size', 'fontSize');
                var textHash = JSON.stringify([text, textAttrs]);
                // Update the text only if there was a change in the string
                // or any of its attributes.
                if (cache === undefined || cache !== textHash) {
                    // Chrome bug:
                    // Tspans positions defined as `em` are not updated
                    // when container `font-size` change.
                    var fontSize = attrs['font-size'] || attrs['fontSize'];
                    if (fontSize) {
                        node.setAttribute('font-size', fontSize);
                    }
                    V(node).text('' + text, textAttrs);
                    $node.data(cacheName, textHash);
                }
            }
        },

        lineHeight: {
            qualify: function(lineHeight, node, attrs) {
                return (attrs.text !== undefined);
            }
        },

        textPath: {
            qualify: function(textPath, node, attrs) {
                return (attrs.text !== undefined);
            }
        },

        annotations: {
            qualify: function(annotations, node, attrs) {
                return (attrs.text !== undefined);
            }
        },

        // `port` attribute contains the `id` of the port that the underlying magnet represents.
        port: {
            set: function(port) {
                return (port === null || port.id === undefined) ? port : port.id;
            }
        },

        // `style` attribute is special in the sense that it sets the CSS style of the subelement.
        style: {
            qualify: _.isPlainObject,
            set: function(styles, node) {
                $(node).css(styles);
            }
        },

        html: {
            set: function(html, node) {
                $(node).html(html + '');
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
            position: positionWrapper('x', 'width', 'origin')
        },

        refY: {
            position: positionWrapper('y', 'height', 'origin')
        },

        // `ref-dx` and `ref-dy` define the offset of the subelement relative to the right and/or bottom
        // coordinate of the reference element.

        refDx: {
            position: positionWrapper('x', 'width', 'corner')
        },

        refDy: {
            position: positionWrapper('y', 'height', 'corner')
        },

        // 'ref-width'/'ref-height' defines the width/height of the subelement relatively to
        // the reference element size
        // val in 0..1         ref-width = 0.75 sets the width to 75% of the ref. el. width
        // val < 0 || val > 1  ref-height = -20 sets the height to the the ref. el. height shorter by 20

        refWidth: {
            size: sizeWrapper('width', 'width')
        },

        refHeight: {
            size: sizeWrapper('height', 'height')
        },

        refRx: {
            size: sizeWrapper('rx', 'width')
        },

        refRy: {
            size: sizeWrapper('ry', 'height')
        },

        refCx: {
            size: sizeWrapper('cx', 'width')
        },

        refCy: {
            size: sizeWrapper('cy', 'height')
        },

        // `x-alignment` when set to `middle` causes centering of the subelement around its new x coordinate.
        // `x-alignment` when set to `right` uses the x coordinate as referenced to the right of the bbox.

        xAlignment: {
            anchor: anchorWrapper('x', 'width', 'right')
        },

        // `y-alignment` when set to `middle` causes centering of the subelement around its new y coordinate.
        // `y-alignment` when set to `bottom` uses the y coordinate as referenced to the bottom of the bbox.

        yAlignment: {
            anchor: anchorWrapper('y', 'height', 'bottom')
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

})(joint, _, g, $);
