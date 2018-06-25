(function(joint, V, g, $, util) {

    function setWrapper(attrName, dimension) {
        return function(value, refBBox) {
            var isValuePercentage = util.isPercentage(value);
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
            var valuePercentage = util.isPercentage(value);
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
            } else if (util.isPercentage(value)) {
                delta = nodeBBox[dimension] * parseFloat(value) / 100;
            } else {
                delta = 0;
            }

            var point = g.Point();
            point[axis] = -(nodeBBox[axis] + delta);
            return point;
        };
    }

    function shapeWrapper(shapeConstructor, opt) {
        var cacheName = 'joint-shape';
        var resetOffset = opt && opt.resetOffset;
        return function(value, refBBox, node) {
            var $node = $(node);
            var cache = $node.data(cacheName);
            if (!cache || cache.value !== value) {
                // only recalculate if value has changed
                var cachedShape = shapeConstructor(value);
                cache = {
                    value: value,
                    shape: cachedShape,
                    shapeBBox: cachedShape.bbox()
                };
                $node.data(cacheName, cache);
            }

            var shape = cache.shape.clone();
            var shapeBBox = cache.shapeBBox.clone();
            var shapeOrigin = shapeBBox.origin();
            var refOrigin = refBBox.origin();

            shapeBBox.x = refOrigin.x;
            shapeBBox.y = refOrigin.y;

            var fitScale = refBBox.maxRectScaleToFit(shapeBBox, refOrigin);
            // `maxRectScaleToFit` can give Infinity if width or height is 0
            var sx = (shapeBBox.width === 0 || refBBox.width === 0) ? 1 : fitScale.sx;
            var sy = (shapeBBox.height === 0 || refBBox.height === 0) ? 1 : fitScale.sy;

            shape.scale(sx, sy, shapeOrigin);
            if (resetOffset) {
                shape.translate(-shapeOrigin.x, -shapeOrigin.y);
            }

            return shape;
        };
    }

    // `d` attribute for SVGPaths
    function dWrapper(opt) {
        function pathConstructor(value) {
            return new g.Path(V.normalizePathData(value));
        }
        var shape = shapeWrapper(pathConstructor, opt);
        return function(value, refBBox, node) {
            var path = shape(value, refBBox, node);
            return {
                d: path.serialize()
            };
        };
    }

    // `points` attribute for SVGPolylines and SVGPolygons
    function pointsWrapper(opt) {
        var shape = shapeWrapper(g.Polyline, opt);
        return function(value, refBBox, node) {
            var polyline = shape(value, refBBox, node);
            return {
                points: polyline.serialize()
            };
        };
    }

    function atConnectionWrapper(method, opt) {
        var zeroVector = new g.Point(1, 0);
        return function(value) {
            var p, angle;
            var tangent = this[method](value);
            if (tangent) {
                angle = (opt.rotate) ? tangent.vector().vectorAngle(zeroVector) : 0;
                p = tangent.start;
            } else {
                p = this.path.start;
                angle = 0;
            }
            if (angle === 0) return { transform: 'translate(' + p.x + ',' + p.y + ')' };
            return { transform: 'translate(' + p.x + ',' + p.y + ') rotate(' + angle + ')' };
        }
    }

    function isTextInUse(lineHeight, node, attrs) {
        return (attrs.text !== undefined);
    }

    function isLinkView() {
        return this instanceof joint.dia.LinkView;
    }

    function contextMarker(context) {
        var marker = {};
        // Stroke
        // The context 'fill' is disregared here. The usual case is to use the marker with a connection
        // (for which 'fill' attribute is set to 'none').
        var stroke = context.stroke;
        if (typeof stroke === 'string') {
            marker['stroke'] = stroke;
            marker['fill'] = stroke;
        }
        // Opacity
        // Again the context 'fill-opacity' is ignored.
        var strokeOpacity = context.strokeOpacity;
        if (strokeOpacity === undefined) strokeOpacity = context['stroke-opacity'];
        if (strokeOpacity === undefined) strokeOpacity = context.opacity
        if (strokeOpacity !== undefined) {
            marker['stroke-opacity'] = strokeOpacity;
            marker['fill-opacity'] = strokeOpacity;
        }
        return marker;
    }

    var attributesNS = joint.dia.attributes = {

        xlinkHref: {
            set: 'xlink:href'
        },

        xlinkShow: {
            set: 'xlink:show'
        },

        xlinkRole: {
            set: 'xlink:role'
        },

        xlinkType: {
            set: 'xlink:type'
        },

        xlinkArcrole: {
            set: 'xlink:arcrole'
        },

        xlinkTitle: {
            set: 'xlink:title'
        },

        xlinkActuate: {
            set: 'xlink:actuate'
        },

        xmlSpace: {
            set: 'xml:space'
        },

        xmlBase: {
            set: 'xml:base'
        },

        xmlLang: {
            set: 'xml:lang'
        },

        preserveAspectRatio: {
            set: 'preserveAspectRatio'
        },

        requiredExtension: {
            set: 'requiredExtension'
        },

        requiredFeatures: {
            set: 'requiredFeatures'
        },

        systemLanguage: {
            set: 'systemLanguage'
        },

        externalResourcesRequired: {
            set: 'externalResourceRequired'
        },

        filter: {
            qualify: util.isPlainObject,
            set: function(filter) {
                return 'url(#' + this.paper.defineFilter(filter) + ')';
            }
        },

        fill: {
            qualify: util.isPlainObject,
            set: function(fill) {
                return 'url(#' + this.paper.defineGradient(fill) + ')';
            }
        },

        stroke: {
            qualify: util.isPlainObject,
            set: function(stroke) {
                return 'url(#' + this.paper.defineGradient(stroke) + ')';
            }
        },

        sourceMarker: {
            qualify: util.isPlainObject,
            set: function(marker, refBBox, node, attrs) {
                marker = util.assign(contextMarker(attrs), marker);
                return { 'marker-start': 'url(#' + this.paper.defineMarker(marker) + ')' };
            }
        },

        targetMarker: {
            qualify: util.isPlainObject,
            set: function(marker, refBBox, node, attrs) {
                marker = util.assign(contextMarker(attrs), { 'transform': 'rotate(180)' }, marker);
                return { 'marker-end': 'url(#' + this.paper.defineMarker(marker) + ')' };
            }
        },

        vertexMarker: {
            qualify: util.isPlainObject,
            set: function(marker, refBBox, node, attrs) {
                marker = util.assign(contextMarker(attrs), marker);
                return { 'marker-mid': 'url(#' + this.paper.defineMarker(marker) + ')' };
            }
        },

        text: {
            qualify: function(text, node, attrs) {
                return !attrs.textWrap || !util.isPlainObject(attrs.textWrap);
            },
            set: function(text, refBBox, node, attrs) {
                var $node = $(node);
                var cacheName = 'joint-text';
                var cache = $node.data(cacheName);
                var textAttrs = joint.util.pick(attrs, 'lineHeight', 'annotations', 'textPath', 'x', 'textVerticalAnchor', 'eol');
                var fontSize = textAttrs.fontSize = attrs['font-size'] || attrs['fontSize'];
                var textHash = JSON.stringify([text, textAttrs]);
                // Update the text only if there was a change in the string
                // or any of its attributes.
                if (cache === undefined || cache !== textHash) {
                    // Chrome bug:
                    // Tspans positions defined as `em` are not updated
                    // when container `font-size` change.
                    if (fontSize) node.setAttribute('font-size', fontSize);
                    // Text Along Path Selector
                    var textPath = textAttrs.textPath;
                    if (util.isObject(textPath)) {
                        var pathSelector = textPath.selector;
                        if (typeof pathSelector === 'string') {
                            var pathNode = this.findBySelector(pathSelector)[0];
                            if (pathNode instanceof SVGPathElement) {
                                textAttrs.textPath = util.assign({ 'xlink:href': '#' + pathNode.id }, textPath);
                            }
                        }
                    }
                    V(node).text('' + text, textAttrs);
                    $node.data(cacheName, textHash);
                }
            }
        },

        textWrap: {
            qualify: util.isPlainObject,
            set: function(value, refBBox, node, attrs) {
                // option `width`
                var width = value.width || 0;
                if (util.isPercentage(width)) {
                    refBBox.width *= parseFloat(width) / 100;
                } else if (width <= 0) {
                    refBBox.width += width;
                } else {
                    refBBox.width = width;
                }
                // option `height`
                var height = value.height || 0;
                if (util.isPercentage(height)) {
                    refBBox.height *= parseFloat(height) / 100;
                } else if (height <= 0) {
                    refBBox.height += height;
                } else {
                    refBBox.height = height;
                }
                // option `text`
                var wrappedText;
                var text = value.text;
                if (text === undefined) text = attrs.text;
                if (text !== undefined) {
                    wrappedText = joint.util.breakText('' + text, refBBox, {
                        'font-weight': attrs['font-weight'] || attrs.fontWeight,
                        'font-size': attrs['font-size'] || attrs.fontSize,
                        'font-family': attrs['font-family'] || attrs.fontFamily,
                        'lineHeight': attrs.lineHeight
                    }, {
                        // Provide an existing SVG Document here
                        // instead of creating a temporary one over again.
                        svgDocument: this.paper.svg
                    });
                } else {
                    wrappedText = '';
                }
                joint.dia.attributes.text.set.call(this, wrappedText, refBBox, node, attrs);
            }
        },

        title: {
            qualify: function(title, node) {
                // HTMLElement title is specified via an attribute (i.e. not an element)
                return node instanceof SVGElement;
            },
            set: function(title, refBBox, node) {
                var $node = $(node);
                var cacheName = 'joint-title';
                var cache = $node.data(cacheName);
                if (cache === undefined || cache !== title) {
                    $node.data(cacheName, title);
                    // Generally <title> element should be the first child element of its parent.
                    var firstChild = node.firstChild;
                    if (firstChild && firstChild.tagName.toUpperCase() === 'TITLE') {
                        // Update an existing title
                        firstChild.textContent = title;
                    } else {
                        // Create a new title
                        var titleNode = document.createElementNS(node.namespaceURI, 'title');
                        titleNode.textContent = title;
                        node.insertBefore(titleNode, firstChild);
                    }
                }
            }
        },

        lineHeight: {
            qualify: isTextInUse
        },

        textVerticalAnchor: {
            qualify: isTextInUse
        },

        textPath: {
            qualify: isTextInUse
        },

        annotations: {
            qualify: isTextInUse
        },

        // `port` attribute contains the `id` of the port that the underlying magnet represents.
        port: {
            set: function(port) {
                return (port === null || port.id === undefined) ? port : port.id;
            }
        },

        // `style` attribute is special in the sense that it sets the CSS style of the subelement.
        style: {
            qualify: util.isPlainObject,
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

        refRInscribed: {
            set: (function(attrName) {
                var widthFn = setWrapper(attrName, 'width');
                var heightFn = setWrapper(attrName, 'height');
                return function(value, refBBox) {
                    var fn = (refBBox.height > refBBox.width) ? widthFn : heightFn;
                    return fn(value, refBBox);
                }
            })('r')
        },

        refRCircumscribed: {
            set: function(value, refBBox) {
                var isValuePercentage = util.isPercentage(value);
                value = parseFloat(value);
                if (isValuePercentage) {
                    value /= 100;
                }

                var diagonalLength = Math.sqrt((refBBox.height * refBBox.height) + (refBBox.width * refBBox.width));

                var rValue;
                if (isFinite(value)) {
                    if (isValuePercentage || value >= 0 && value <= 1) rValue = value * diagonalLength;
                    else rValue = Math.max(value + diagonalLength, 0);
                }

                return { r: rValue };
            }
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
        },

        resetOffset: {
            offset: function(val, nodeBBox) {
                return (val)
                    ? { x: -nodeBBox.x, y: -nodeBBox.y }
                    : { x: 0, y: 0 };
            }

        },

        refDResetOffset: {
            set: dWrapper({ resetOffset: true })
        },

        refDKeepOffset: {
            set: dWrapper({ resetOffset: false })
        },

        refPointsResetOffset: {
            set: pointsWrapper({ resetOffset: true })
        },

        refPointsKeepOffset: {
            set: pointsWrapper({ resetOffset: false })
        },

        // LinkView Attributes

        connection: {
            qualify: isLinkView,
            set: function() {
                return { d: this.getSerializedConnection() };
            }
        },

        atConnectionLengthKeepGradient: {
            qualify: isLinkView,
            set: atConnectionWrapper('getTangentAtLength', { rotate: true })
        },

        atConnectionLengthIgnoreGradient: {
            qualify: isLinkView,
            set: atConnectionWrapper('getTangentAtLength', { rotate: false })
        },

        atConnectionRatioKeepGradient: {
            qualify: isLinkView,
            set: atConnectionWrapper('getTangentAtRatio', { rotate: true })
        },

        atConnectionRatioIgnoreGradient: {
            qualify: isLinkView,
            set: atConnectionWrapper('getTangentAtRatio', { rotate: false })
        }
    };

    // Aliases
    attributesNS.refR = attributesNS.refRInscribed;
    attributesNS.refD = attributesNS.refDResetOffset;
    attributesNS.refPoints = attributesNS.refPointsResetOffset;
    attributesNS.atConnectionLength = attributesNS.atConnectionLengthKeepGradient;
    attributesNS.atConnectionRatio = attributesNS.atConnectionRatioKeepGradient;

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

})(joint, V, g, $, joint.util);
