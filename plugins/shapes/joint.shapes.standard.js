(function(dia, util, env, V) {

    'use strict';

    // ELEMENTS

    var Element = dia.Element;

    Element.define('standard.Rectangle', {
        attrs: {
            body: {
                refWidth: '100%',
                refHeight: '100%',
                strokeWidth: 2,
                stroke: '#000000',
                fill: '#FFFFFF'
            },
            label: {
                textVerticalAnchor: 'middle',
                textAnchor: 'middle',
                refX: '50%',
                refY: '50%',
                fontSize: 14,
                fill: '#333333'
            }
        }
    }, {
        markup: [{
            tagName: 'rect',
            selector: 'body',
        }, {
            tagName: 'text',
            selector: 'label'
        }]
    });

    Element.define('standard.Circle', {
        attrs: {
            body: {
                refCx: '50%',
                refCy: '50%',
                refR: '50%',
                strokeWidth: 2,
                stroke: '#333333',
                fill: '#FFFFFF'
            },
            label: {
                textVerticalAnchor: 'middle',
                textAnchor: 'middle',
                refX: '50%',
                refY: '50%',
                fontSize: 14,
                fill: '#333333'
            }
        }
    }, {
        markup: [{
            tagName: 'circle',
            selector: 'body'
        }, {
            tagName: 'text',
            selector: 'label'
        }]
    });

    Element.define('standard.Ellipse', {
        attrs: {
            body: {
                refCx: '50%',
                refCy: '50%',
                refRx: '50%',
                refRy: '50%',
                strokeWidth: 2,
                stroke: '#333333',
                fill: '#FFFFFF'
            },
            label: {
                textVerticalAnchor: 'middle',
                textAnchor: 'middle',
                refX: '50%',
                refY: '50%',
                fontSize: 14,
                fill: '#333333'
            }
        }
    }, {
        markup: [{
            tagName: 'ellipse',
            selector: 'body'
        }, {
            tagName: 'text',
            selector: 'label'
        }]
    });

    Element.define('standard.Path', {
        attrs: {
            body: {
                refD: 'M 0 0 L 10 0 10 10 0 10 Z',
                strokeWidth: 2,
                stroke: '#333333',
                fill: '#FFFFFF'
            },
            label: {
                textVerticalAnchor: 'middle',
                textAnchor: 'middle',
                refX: '50%',
                refY: '50%',
                fontSize: 14,
                fill: '#333333'
            }
        }
    }, {
        markup: [{
            tagName: 'path',
            selector: 'body'
        }, {
            tagName: 'text',
            selector: 'label'
        }]
    });

    Element.define('standard.Polygon', {
        attrs: {
            body: {
                refPoints: '0 0 10 0 10 10 0 10',
                strokeWidth: 2,
                stroke: '#333333',
                fill: '#FFFFFF'
            },
            label: {
                textVerticalAnchor: 'middle',
                textAnchor: 'middle',
                refX: '50%',
                refY: '50%',
                fontSize: 14,
                fill: '#333333'
            }
        }
    }, {
        markup: [{
            tagName: 'polygon',
            selector: 'body'
        }, {
            tagName: 'text',
            selector: 'label'
        }]
    });

    Element.define('standard.Polyline', {
        attrs: {
            body: {
                refPoints: '0 0 10 0 10 10 0 10 0 0',
                strokeWidth: 2,
                stroke: '#333333',
                fill: '#FFFFFF'
            },
            label: {
                textVerticalAnchor: 'middle',
                textAnchor: 'middle',
                refX: '50%',
                refY: '50%',
                fontSize: 14,
                fill: '#333333'
            }
        }
    }, {
        markup: [{
            tagName: 'polyline',
            selector: 'body'
        }, {
            tagName: 'text',
            selector: 'label'
        }]
    });

    Element.define('standard.Image', {
        attrs: {
            image: {
                refWidth: '100%',
                refHeight: '100%',
                // xlinkHref: '[URL]'
            },
            label: {
                textVerticalAnchor: 'top',
                textAnchor: 'middle',
                refX: '50%',
                refY: '100%',
                refY2: 10,
                fontSize: 14,
                fill: '#333333'
            }
        }
    }, {
        markup: [{
            tagName: 'image',
            selector: 'image'
        }, {
            tagName: 'text',
            selector: 'label'
        }]
    });

    Element.define('standard.BorderedImage', {
        attrs: {
            border: {
                refWidth: '100%',
                refHeight: '100%',
                stroke: '#333333',
                strokeWidth: 2
            },
            image: {
                // xlinkHref: '[URL]'
                refWidth: -1,
                refHeight: -1,
                x: 0.5,
                y: 0.5
            },
            label: {
                textVerticalAnchor: 'top',
                textAnchor: 'middle',
                refX: '50%',
                refY: '100%',
                refY2: 10,
                fontSize: 14,
                fill: '#333333'
            }
        }
    }, {
        markup: [{
            tagName: 'image',
            selector: 'image'
        }, {
            tagName: 'rect',
            selector: 'border',
            attributes: {
                'fill': 'none'
            }
        }, {
            tagName: 'text',
            selector: 'label'
        }]
    });

    Element.define('standard.EmbeddedImage', {
        attrs: {
            body: {
                refWidth: '100%',
                refHeight: '100%',
                stroke: '#333333',
                fill: '#FFFFFF',
                strokeWidth: 2
            },
            image: {
                // xlinkHref: '[URL]'
                refWidth: '30%',
                refHeight: -20,
                x: 10,
                y: 10,
                preserveAspectRatio: 'xMidYMin'
            },
            label: {
                textVerticalAnchor: 'top',
                textAnchor: 'left',
                refX: '30%',
                refX2: 20, // 10 + 10
                refY: 10,
                fontSize: 14,
                fill: '#333333'
            }
        }
    }, {
        markup: [{
            tagName: 'rect',
            selector: 'body'
        }, {
            tagName: 'image',
            selector: 'image'
        }, {
            tagName: 'text',
            selector: 'label'
        }]
    });

    Element.define('standard.HeaderedRectangle', {
        attrs: {
            body: {
                refWidth: '100%',
                refHeight: '100%',
                strokeWidth: 2,
                stroke: '#000000',
                fill: '#FFFFFF'
            },
            header: {
                refWidth: '100%',
                height: 30,
                strokeWidth: 2,
                stroke: '#000000',
                fill: '#FFFFFF'
            },
            headerText: {
                textVerticalAnchor: 'middle',
                textAnchor: 'middle',
                refX: '50%',
                refY: 15,
                fontSize: 16,
                fill: '#333333'
            },
            bodyText: {
                textVerticalAnchor: 'middle',
                textAnchor: 'middle',
                refX: '50%',
                refY: '50%',
                refY2: 15,
                fontSize: 14,
                fill: '#333333'
            }
        }
    }, {
        markup: [{
            tagName: 'rect',
            selector: 'body'
        }, {
            tagName: 'rect',
            selector: 'header'
        }, {
            tagName: 'text',
            selector: 'headerText'
        }, {
            tagName: 'text',
            selector: 'bodyText'
        }]
    });

    var CYLINDER_TILT = 10;

    joint.dia.Element.define('standard.Cylinder', {
        attrs: {
            body: {
                lateralArea: CYLINDER_TILT,
                fill: '#FFFFFF',
                stroke: '#333333',
                strokeWidth: 2
            },
            top: {
                refCx: '50%',
                cy: CYLINDER_TILT,
                refRx: '50%',
                ry: CYLINDER_TILT,
                fill: '#FFFFFF',
                stroke: '#333333',
                strokeWidth: 2
            },
            label: {
                textVerticalAnchor: 'middle',
                textAnchor: 'middle',
                refX: '50%',
                refY: '100%',
                refY2: 15,
                fontSize: 14,
                fill: '#333333'
            }
        }
    }, {
        markup: [{
            tagName: 'path',
            selector: 'body'
        }, {
            tagName: 'ellipse',
            selector: 'top'
        }, {
            tagName: 'text',
            selector: 'label'
        }],

        topRy: function(t, opt) {
            // getter
            if (t === undefined) return this.attr('body/lateralArea');

            // setter
            var isPercentage = util.isPercentage(t);

            var bodyAttrs = { lateralArea: t };
            var topAttrs = isPercentage
                ? { refCy: t, refRy: t, cy: null, ry: null }
                : { refCy: null, refRy: null, cy: t, ry: t };

            return this.attr({ body: bodyAttrs, top: topAttrs }, opt);
        }

    }, {
        attributes: {
            lateralArea: {
                set: function(t, refBBox) {
                    var isPercentage = util.isPercentage(t);
                    if (isPercentage) t = parseFloat(t) / 100;

                    var x = refBBox.x;
                    var y = refBBox.y;
                    var w = refBBox.width;
                    var h = refBBox.height;

                    // curve control point variables
                    var rx = w / 2;
                    var ry = isPercentage ? (h * t) : t;

                    var kappa = V.KAPPA;
                    var cx = kappa * rx;
                    var cy = kappa * (isPercentage ? (h * t) : t);

                    // shape variables
                    var xLeft = x;
                    var xCenter = x + (w / 2);
                    var xRight = x + w;

                    var ySideTop = y + ry;
                    var yCurveTop = ySideTop - ry;
                    var ySideBottom = y + h - ry;
                    var yCurveBottom = y + h;

                    // return calculated shape
                    var data = [
                        'M', xLeft, ySideTop,
                        'L', xLeft, ySideBottom,
                        'C', x, (ySideBottom + cy), (xCenter - cx), yCurveBottom, xCenter, yCurveBottom,
                        'C', (xCenter + cx), yCurveBottom, xRight, (ySideBottom + cy), xRight, ySideBottom,
                        'L', xRight, ySideTop,
                        'C', xRight, (ySideTop - cy), (xCenter + cx), yCurveTop, xCenter, yCurveTop,
                        'C', (xCenter - cx), yCurveTop, xLeft, (ySideTop - cy), xLeft, ySideTop,
                        'Z'
                    ];
                    return { d: data.join(' ') };
                }
            }
        }
    });

    var foLabelMarkup = {
        tagName: 'foreignObject',
        selector: 'foreignObject',
        attributes: {
            'overflow': 'hidden'
        },
        children: [{
            tagName: 'div',
            namespaceURI: 'http://www.w3.org/1999/xhtml',
            selector: 'label',
            style: {
                width: '100%',
                height: '100%',
                position: 'static',
                backgroundColor: 'transparent',
                textAlign: 'center',
                margin: 0,
                padding: '0px 5px',
                boxSizing: 'border-box',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }
        }]
    };

    var svgLabelMarkup = {
        tagName: 'text',
        selector: 'label',
        attributes: {
            'text-anchor': 'middle'
        }
    };

    var labelMarkup = (env.test('svgforeignobject')) ? foLabelMarkup : svgLabelMarkup;

    Element.define('standard.TextBlock', {
        attrs: {
            body: {
                refWidth: '100%',
                refHeight: '100%',
                stroke: '#333333',
                fill: '#ffffff',
                strokeWidth: 2
            },
            foreignObject: {
                refWidth: '100%',
                refHeight: '100%'
            },
            label: {
                style: {
                    fontSize: 14
                }
            }
        }
    }, {
        markup: [{
            tagName: 'rect',
            selector: 'body'
        }, labelMarkup]
    }, {
        attributes: {
            text: {
                set: function(text, refBBox, node, attrs) {
                    if (node instanceof HTMLElement) {
                        node.textContent = text;
                    } else {
                        // No foreign object
                        var style = attrs.style || {};
                        var wrapValue = { text: text, width: -5, height: '100%' };
                        var wrapAttrs = util.assign({ textVerticalAnchor: 'middle' }, style);
                        dia.attributes.textWrap.set.call(this, wrapValue, refBBox, node, wrapAttrs);
                        return { fill: style.color || null };
                    }
                },
                position: function(text, refBBox, node) {
                    // No foreign object
                    if (node instanceof SVGElement) return refBBox.center();
                }
            }
        }
    });

    // LINKS

    var Link = dia.Link;

    Link.define('standard.Link', {
        attrs: {
            line: {
                connection: true,
                stroke: '#333333',
                strokeWidth: 2,
                strokeLinejoin: 'round',
                targetMarker: {
                    type: 'path',
                    d: 'M 10 -5 0 0 10 5 z'
                }
            },
            wrapper: {
                connection: true,
                strokeWidth: 10,
                strokeLinejoin: 'round'
            }
        }
    }, {
        markup: [{
            tagName: 'path',
            selector: 'wrapper',
            attributes: {
                'fill': 'none',
                'cursor': 'pointer',
                'stroke': 'transparent'
            }
        }, {
            tagName: 'path',
            selector: 'line',
            attributes: {
                'fill': 'none',
                'pointer-events': 'none'
            }
        }]
    });

    Link.define('standard.DoubleLink', {
        attrs: {
            line: {
                connection: true,
                stroke: '#DDDDDD',
                strokeWidth: 4,
                strokeLinejoin: 'round',
                targetMarker: {
                    type: 'path',
                    stroke: '#000000',
                    d: 'M 10 -3 10 -10 -2 0 10 10 10 3'
                }
            },
            outline: {
                connection: true,
                stroke: '#000000',
                strokeWidth: 6,
                strokeLinejoin: 'round'
            }
        }
    }, {
        markup: [{
            tagName: 'path',
            selector: 'outline',
            attributes: {
                'fill': 'none'
            }
        }, {
            tagName: 'path',
            selector: 'line',
            attributes: {
                'fill': 'none'
            }
        }]
    });

    Link.define('standard.ShadowLink', {
        attrs: {
            line: {
                connection: true,
                stroke: '#FF0000',
                strokeWidth: 20,
                strokeLinejoin: 'round',
                targetMarker: {
                    'type': 'path',
                    'stroke': 'none',
                    'd': 'M 0 -10 -10 0 0 10 z'
                },
                sourceMarker: {
                    'type': 'path',
                    'stroke': 'none',
                    'd': 'M -10 -10 0 0 -10 10 0 10 0 -10 z'
                }
            },
            shadow: {
                connection: true,
                refX: 3,
                refY: 6,
                stroke: '#000000',
                strokeOpacity: 0.2,
                strokeWidth: 20,
                strokeLinejoin: 'round',
                targetMarker: {
                    'type': 'path',
                    'd': 'M 0 -10 -10 0 0 10 z',
                    'stroke': 'none'
                },
                sourceMarker: {
                    'type': 'path',
                    'stroke': 'none',
                    'd': 'M -10 -10 0 0 -10 10 0 10 0 -10 z'
                }
            }
        }
    }, {
        markup: [{
            tagName: 'path',
            selector: 'shadow',
            attributes: {
                'fill': 'none'
            }
        }, {
            tagName: 'path',
            selector: 'line',
            attributes: {
                'fill': 'none'
            }
        }]
    });


})(joint.dia, joint.util, joint.env, V);
