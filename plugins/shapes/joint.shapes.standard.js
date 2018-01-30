(function (dia, util, env) {

    'use strict';

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
                fill: '#ffffff',
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

})(joint.dia, joint.util, joint.env);
