(function (dia, util, env, V) {

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
                refY: '50%',
                refY2: CYLINDER_TILT,
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

        tilt: function(tilt, opt) {
            // GETTER
            if (tilt === undefined) return this.attr('body/lateralArea');

            // SETTER
            var h = this.get('size').height;
            var isPercentage = util.isPercentage(tilt);
            var rawTilt = isPercentage ? (parseFloat(tilt) % 100) : (tilt % h);
            tilt = isPercentage
                ? (((((rawTilt < 0) ? 100 : 0) + rawTilt) % 100) + '%')
                : ((((rawTilt < 0) ? h : 0) + rawTilt) % h);

            // convert from percentages if necessary
            var t = isPercentage ? (parseFloat(tilt) / 100) : tilt;
            var rawDiffT = isPercentage ? (t - 0.5) : (t - (h / 2));
            var diffT = Math.abs(rawDiffT);
            var reversedT = isPercentage ? (0.5 - diffT) : ((h / 2) - diffT);

            var isReversed = (rawDiffT > 0);
            var isMostlyTop = diffT < (isPercentage ? 0.25 : (h / 4));

            // convert to percentages if necessary
            var diffTilt = isPercentage ? (diffT * 100) + '%' : diffT;
            var reversedTilt = isPercentage
                ? ((reversedT * 100) + '%')
                : reversedT;

            // has own tilt logic
            var bodyAttrs = { lateralArea: tilt };

            // label moves to top area if lateral area becomes too small (25% - 75%)
            var labelAttrs = isMostlyTop
                ? (isReversed
                    ? { refY: '50%', refY2: diffTilt}
                    : { refY: tilt, refY2: 0 })
                : (isReversed
                    ? { refY: diffTilt, refY2: 0 }
                    : { refY: '50%', refY2: tilt });

            // the bottom of the cylinder becomes exposed if tilt goes past 50%
            var topAttrs = isPercentage
                ? (isReversed
                    ? { refCy: tilt, refRy: reversedTilt, cy: null, ry: null }
                    : { refCy: tilt, refRy: tilt, cy: null, ry: null })
                : (isReversed
                    ? { refCy: null, refRy: null, cy: tilt, ry: reversedTilt }
                    : { refCy: null, refRy: null, cy: tilt, ry: tilt });

            // return updated this
            return this.attr({ body: bodyAttrs, label: labelAttrs, top: topAttrs }, opt);
        }

    }, {
        attributes: {
            lateralArea: {
                set: function(tilt, refBBox) {
                    var x = refBBox.x;
                    var y = refBBox.y;
                    var w = refBBox.width;
                    var h = refBBox.height;

                    // tilt calculations
                    var isPercentage = util.isPercentage(tilt);
                    var rawTilt = isPercentage ? (parseFloat(tilt) % 100) : (tilt % h);
                    tilt = isPercentage
                        ? (((((rawTilt < 0) ? 100 : 0) + rawTilt) % 100) + '%')
                        : ((((rawTilt < 0) ? h : 0) + rawTilt) % h);

                    var t = isPercentage ? (parseFloat(tilt) / 100) : tilt;
                    var rawDiffT = isPercentage ? (t - 0.5) : (t - (h / 2));
                    var diffT = Math.abs(rawDiffT);
                    var reversedT = isPercentage ? (0.5 - diffT) : ((h / 2) - diffT);

                    var isReversed = (rawDiffT > 0);

                    // curve control point variables
                    var rx = w / 2;
                    var ry = isPercentage
                        ? (isReversed
                            ? h * reversedT
                            : h * t)
                        : (isReversed
                            ? reversedT
                            : t);

                    var kappa = V.KAPPA;
                    var cx = kappa * rx;
                    var cy = kappa * (isPercentage
                        ? (isReversed
                            ? (h * -reversedT)
                            : (h * t))
                        : (isReversed
                            ? -reversedT
                            : t));

                    // shape variables
                    var xLeft = x;
                    var xCenter = x + (w / 2);
                    var xRight = x + w;

                    var ySideTop = isReversed ? (y + h - ry) : (y + ry);
                    var yCurveTop = isReversed ? (ySideTop - ry) : (ySideTop + ry);
                    var ySideBottom = isReversed ? (y + ry) : (y + h - ry);
                    var yCurveBottom = isReversed ? (y) : (y + h);

                    // return calculated shape
                    var data = [
                        'M', xLeft, ySideTop,
                        'L', xLeft, ySideBottom,
                        'C', x, (ySideBottom + cy), (xCenter - cx), yCurveBottom, xCenter, yCurveBottom,
                        'C', (xCenter + cx), yCurveBottom, xRight, (ySideBottom + cy), xRight, ySideBottom,
                        'L', xRight, ySideTop,
                        'C', xRight, (ySideTop + cy), (xCenter + cx), yCurveTop, xCenter, yCurveTop,
                        'C', (xCenter - cx), yCurveTop, xLeft, (ySideTop + cy), xLeft, ySideTop,
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
        },
            (env.test('svgforeignobject')) ? foLabelMarkup : svgLabelMarkup
        ]
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
