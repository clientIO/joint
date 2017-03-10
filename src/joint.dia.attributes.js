(function(joint, _, g, $) {

    function isPercentage(val) {
        return _.isString(val) && val.slice(-1) === '%';
    }

    function setWrapper(attrName, dimension) {
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

    function offsetWrapper(axis, dimension, corner) {
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
            } else {
                delta = 0;
            }

            var point = g.Point();
            point[axis] = -(nodeBBox[axis] + delta);
            return point;
        };
    }

    var attributesNS = joint.dia.attributes = {

        xlinkHref: {
            set: 'xlink:href'
        },

        xmlSpace: {
            set: 'xml:space'
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
            qualify: _.isPlainObject,
            set: function(marker) {
                return { 'marker-start': 'url(#' + this.paper.defineMarker(marker) + ')' };
            }
        },

        targetMarker: {
            qualify: _.isPlainObject,
            set: function(marker) {
                marker = _.assign({ transform: 'rotate(180)' }, marker);
                return { 'marker-end': 'url(#' + this.paper.defineMarker(marker) + ')' };
            }
        },

        vertexMarker: {
            qualify: _.isPlainObject,
            set: function(marker) {
                return { 'marker-mid': 'url(#' + this.paper.defineMarker(marker) + ')' };
            }
        },

        text: {
            set: function(text, refBBox, node, attrs) {
                var $node = $(node);
                var cacheName = 'joint-text';
                var cache = $node.data(cacheName);
                var textAttrs = _.pick(attrs, 'lineHeight', 'annotations', 'textPath');
                var fontSize = textAttrs.fontSize = attrs['font-size'] || attrs['fontSize'];
                var textHash = JSON.stringify([text, textAttrs]);
                // Update the text only if there was a change in the string
                // or any of its attributes.
                if (cache === undefined || cache !== textHash) {
                    // Chrome bug:
                    // Tspans positions defined as `em` are not updated
                    // when container `font-size` change.
                    if (fontSize) {
                        node.setAttribute('font-size', fontSize);
                    }
                    V(node).text('' + text, textAttrs);
                    $node.data(cacheName, textHash);
                }
            }
        },

        textWrap: {
            qualify: _.isPlainObject,
            set: function(value, refBBox, node, attrs) {
                // option `width`
                var width = value.width || 0;
                if (isPercentage(width)) {
                    refBBox.width *= parseFloat(width) / 100;
                } else if (width <= 0) {
                    refBBox.width += width;
                } else {
                    refBBox.width = width;
                }
                // option `height`
                var height = value.height || 0;
                if (isPercentage(height)) {
                    refBBox.height *= parseFloat(height) / 100;
                } else if (height <= 0) {
                    refBBox.height += height;
                } else {
                    refBBox.height = height;
                }
                // option `text`
                var wrappedText = joint.util.breakText('' + value.text, refBBox, {
                    'font-weight': attrs['font-weight'] || attrs.fontWeight,
                    'font-size': attrs['font-size'] || attrs.fontSize,
                    'font-family': attrs['font-family'] || attrs.fontFamily
                }, {
                    // Provide an existing SVG Document here
                    // instead of creating a temporary one over again.
                    svgDocument: this.paper.svg
                });

                V(node).text(wrappedText);
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
            set: function(styles, refBBox, node) {
                $(node).css(styles);
            }
        },

        html: {
            set: function(html, refBBox, node) {
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
            set: setWrapper('width', 'width')
        },

        refHeight: {
            set: setWrapper('height', 'height')
        },

        refRx: {
            set: setWrapper('rx', 'width')
        },

        refRy: {
            set: setWrapper('ry', 'height')
        },

        refCx: {
            set: setWrapper('cx', 'width')
        },

        refCy: {
            set: setWrapper('cy', 'height')
        },

        // `x-alignment` when set to `middle` causes centering of the subelement around its new x coordinate.
        // `x-alignment` when set to `right` uses the x coordinate as referenced to the right of the bbox.

        xAlignment: {
            offset: offsetWrapper('x', 'width', 'right')
        },

        // `y-alignment` when set to `middle` causes centering of the subelement around its new y coordinate.
        // `y-alignment` when set to `bottom` uses the y coordinate as referenced to the bottom of the bbox.

        yAlignment: {
            offset: offsetWrapper('y', 'height', 'bottom')
        }
    };

    // This allows to combine both absolute and relative positioning
    // refX: 50%, refX2: 20
    attributesNS.refX2 = attributesNS.refX;
    attributesNS.refY2 = attributesNS.refY;

    // Aliases for backwards compatibility
    attributesNS['ref-x'] = attributesNS.refX;
    attributesNS['ref-y'] = attributesNS.refY;
    attributesNS['ref-dy'] = attributesNS.refDy;
    attributesNS['ref-dx'] = attributesNS.refDx;
    attributesNS['ref-width'] = attributesNS.refWidth;
    attributesNS['ref-height'] = attributesNS.refHeight;
    attributesNS['x-alignment'] = attributesNS.xAlignment;
    attributesNS['y-alignment'] = attributesNS.yAlignment;

})(joint, _, g, $);
