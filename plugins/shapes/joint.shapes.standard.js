(function (Element) {

    'use strict';

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
                preserveAspectRatio: 'xMaxYMin'
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

    Element.define('standard.HTML', {
        attrs: {
            border: {
                refWidth: '100%',
                refHeight: '100%',
                stroke: '#333333',
                fill: '#ffffff',
                strokeWidth: 2
            },
            htmlContainer: {
                refWidth: '100%',
                refHeight: '100%',
            },
            body: {
                style: {
                    width: '100%',
                    height: '100%',
                    position: 'static',
                    backgroundColor: 'transparent',
                    textAlign: 'center',
                    margin: 0,
                    padding: '0px 5px 0px 5px',
                    boxSizing: 'border-box',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                },
                // html: 'Content'
            }
        }
    }, {
        markup: [{
            tagName: 'rect',
            selector: 'border'
        }, {
            tagName: 'foreignObject',
            selector: 'htmlContainer',
            attributes: {
                'overflow': 'hidden'
            },
            children: [{
                tagName: 'div',
                namespaceURI: 'http://www.w3.org/1999/xhtml',
                selector: 'body',
            }]
        }]
    });

})(joint.dia.Element);