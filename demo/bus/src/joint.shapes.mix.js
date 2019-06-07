joint.shapes.standard.Link.define('mix.Bus', {
    z: -1,
    attrs: {
        line: {
            strokeWidth: 5,
            sourceMarker: null,
            targetMarker: null
        }
    }
}, {
    defaultLabel: {
        markup: [{
            tagName: 'text',
            selector: 'labelText'
        }],
        position: {
            distance: 10,
            offset: -20,
            args: {
                keepGradient: true,
                ensureLegibility: true
            }
        }
    }
}, {
    create: function(x, label, color) {
        return new this({
            source: { x: x, y: 700 },
            target: { x: x, y: 50 },
            attrs: {
                line: {
                    stroke: color
                }
            },
            labels: [{
                attrs: {
                    labelText: {
                        text: label,
                        fontFamily: 'monospace'
                    }
                }
            }]
        });
    }
});

joint.shapes.standard.Link.define('mix.Connector', {
    z: 0,
    attrs: {
        line: {
            sourceMarker: {
                'type': 'circle',
                'r': 4,
                'stroke': '#333333'
            },
            targetMarker: {
                'type': 'circle',
                'r': 4,
                'stroke': '#333333'
            }
        }
    }
}, {

},{
    create: function(source, target) {
        var connector = new this();
        if (Array.isArray(source)) {
            connector.source(source[0], {
                anchor: {
                    name: 'center',
                    args: {
                        dy: source[1]
                    }
                }
            });
        } else {
            connector.source(source, { selector: source.isLink() ? 'root' : 'body' });
        }
        if (Array.isArray(target)) {
            connector.target(target[0], {
                priority: true,
                anchor: {
                    name: 'center',
                    args: {
                        dy: target[1]
                    }
                }
            });
        } else {
            connector.target(target, { selector: target.isLink() ? 'root' : 'body' });
        }
        return connector;
    }
});

joint.shapes.standard.Rectangle.define('mix.Component', {
    z: 1,
    attrs: {
        label: {
            fontFamily: 'monospace',
            fontWeight: 'bold',
            fontSize: 15,
            textWrap: {
                width: -20
            }
        },
        body: {
            strokeWidth: 2,
            stroke: '#cccccc'
        }
    },
    portMarkup: [{
        tagName: 'rect',
        selector: 'portBody',
        attributes: {
            'fill': '#ffffff',
            'stroke': '#333333',
            'stroke-width': 2,
            'x': -10,
            'y': -5,
            'width': 20,
            'height': 10
        }
    }],
    ports: {
        groups: {
            'in': {
                z: -1,
                position: 'left'
            },
            'out': {
                z: -1,
                position: 'right',
            }
        }
    }
}, {

},{
    create: function(x, y, width, height, label) {
        return new this({
            position: { x: x, y: y },
            size: { width: width, height: height },
            attrs: {
                label: {
                    textWrap: {
                        text: label,
                    }
                }
            }
        });
    }
});

joint.dia.Element.define('mix.Fader', {
    z: 2,
    size: {
        width: 15,
        height: 80
    },
    attrs: {
        label: {
            fontFamily: 'monospace',
            fontSize: 12,
            text: 'Fader',
            textVerticalAnchor: 'bottom',
            textAnchor: 'middle',
            refX: '50%',
            stroke: '#333333'
        },
        arrow: {
            d: 'M -10 70 L 20 10',
            stroke: '#333333',
            strokeWidth: 3,
            targetMarker: {
                'type': 'path',
                'd': 'M 13 -8 0 0 13 8 z'
            }
        },
        body: {
            strokeWidth: 2,
            refWidth: '100%',
            refHeight: '100%',
            fill: '#ffffff',
            stroke: '#cccccc'
        }
    }
}, {
    markup: [{
        tagName: 'rect',
        selector: 'body'
    }, {
        tagName: 'path',
        selector: 'arrow'
    }, {
        tagName: 'text',
        selector: 'label'
    }]
}, {
    create: function(x, y) {
        return new this({
            position: { x: x, y: y }
        });
    }
});

joint.dia.Element.define('mix.Aux', {
    z: 2,
    size: {
        width: 30,
        height: 30
    },
    attrs: {
        label: {
            fontFamily: 'monospace',
            fontSize: 12,
            textVerticalAnchor: 'top',
            textAnchor: 'start',
            refDx: 5,
            stroke: '#333333'
        },
        auxCircle: {
            r: 10,
            refCx: '50%',
            refCy: '50%',
            stroke: '#333333',
            fill: 'none',
            strokeWidth: 2,
        },
        auxLine: {
            d: 'M 15 15 L 21 6',
            stroke: '#333333',
            strokeWidth: 3,
        },
        body: {
            strokeWidth: 2,
            refWidth: '100%',
            refHeight: '100%',
            fill: '#ffffff',
            stroke: '#cccccc'
        }
    }
}, {
    markup: [{
        tagName: 'rect',
        selector: 'body'
    }, {
        tagName: 'circle',
        selector: 'auxCircle'
    }, {
        tagName: 'path',
        selector: 'auxLine'
    }, {
        tagName: 'text',
        selector: 'label'
    }]
}, {
    create: function(x, y, label) {
        return new this({
            position: { x: x, y: y },
            attrs: {
                label: {
                    text: label
                }
            }
        });
    }
});
