var graph = new joint.dia.Graph;

var paper = new joint.dia.Paper({
    el: document.getElementById('paper'),
    width: 650,
    height: 400,
    gridSize: 10,
    model: graph
});

// Global special attributes
joint.dia.attributes.lineStyle = {
    set: function(lineStyle, refBBox, node, attrs) {

        var n = attrs['strokeWidth'] || attrs['stroke-width'] || 1;
        var dasharray = {
            'dashed': (4*n) + ',' + (2*n),
            'dotted': n + ',' + n
        }[lineStyle] || 'none';

        return { 'stroke-dasharray': dasharray };
    }
};

joint.dia.attributes.fitRef = {
    set: function(fitRef, refBBox, node) {
        switch (node.tagName.toUpperCase()) {
            case 'ELLIPSE':
                return {
                    rx: refBBox.width / 2,
                    ry: refBBox.height / 2,
                    cx: refBBox.width / 2,
                    cy: refBBox.height / 2
                };
            case 'RECT':
                return {
                    width: refBBox.width,
                    height: refBBox.height
                };
            case 'PATH':
                var rect = _.extend(refBBox.toJSON(), fitRef);
                return {
                    d: V.rectToPath(rect)
                };
        }
        return {};
    }
};

var Circle = joint.dia.Element.define('custom.Circle', {
    markup: '<g class="rotatable"><ellipse/><text/><path/></g>',
    attrs: {
        ellipse: {
            fill: '#FFFFFF',
            stroke: '#cbd2d7',
            strokeWidth: 3,
            lineStyle: 'dashed',
            fitRef: true
        },
        path: {
            stroke: '#cbd2d7',
            strokeWidth: 3,
            lineStyle: 'dotted',
            fill: 'none',
            d: ['M', 0, '25%', '100%', '25%', 'M', '100%', '75%', 0, '75%']
        },
        text: {
            fill: '#cbd2d7',
            fontSize: 20,
            fontFamily: 'Arial, helvetica, sans-serif',
            refX: '50%',
            refY: '50%',
            transform: 'rotate(45) scale(0.5,0.5)',
            yAlignment: 'middle',
            xAlignment: 'middle'
        }
    }

}, {

    setText: function(text) {
        return this.attr('text/text', text);
    }

}, {

    // Element specific special attributes
    attributes: {

        d: {
            // The path data `d` attribute to be defined via an array.
            // e.g. d: ['M', 0, '25%', '100%', '25%', 'M', '100%', '75%', 0, '75%']
            qualify: _.isArray,
            set: function(value, refBBox) {
                var i = 0;
                var attrValue = value.map(function(data, index) {
                    if (_.isString(data)) {
                        if (data.slice(-1) === '%') {
                            return parseFloat(data) / 100 * refBBox[((index - i) % 2) ? 'height' : 'width'];
                        } else {
                            i++;
                        }
                    }
                    return data;
                }).join(' ');
                return { d:  attrValue };
            }
        }
    }
});

var circle = (new Circle())
    .size(100, 100)
    .position(500,200)
    .setText('Special\nAttributes')
    .rotate(-45)
    .addTo(graph);

circle.transition('angle', 0, { delay: 500 });

var Rectangle = joint.dia.Element.define('custom.Rectangle', {
    markup: [
        '<rect class="body"/>',
        '<circle class="red"/>',
        '<path class="green"/>',
        '<text class="content"/>'
    ].join(''),
    attrs: {
        '.body': {
            fill: '#ddd',
            stroke: '#000',
            refWidth: '100%',
            refHeight: '100%',
            rx: 5,
            ty: 5
        },
        '.red': {
            r: 12,
            fill: '#d00',
            stroke: '#000',
            refX: '100%',
            cy: 4,
            cx: -4,
            event: 'element:delete',
            cursor: 'pointer'
        },
        '.green': {
            r: 4,
            fill: '#0d0',
            stroke: '#000',
            refX: '100%',
            d: 'M -10 0 -3 -3 0 -10 3 -3 10 0 3 3 0 10 -3 3 z',
            transform: 'translate(-4,4)',
            pointerEvents: 'none'
        },
        '.content': {
            textWrap: {
                text: 'An element with text automatically wrapped to fit the rectangle.',
                width: -10,
                height: -10
            },
            fontSize: 14,
            fontFamily: 'sans-serif',
            textAnchor: 'middle',
            refX: '50%',
            refDy: -5,
            yAlignment: 'bottom'
        }
    }
});

var rectangle = (new Rectangle())
    .size(100,90)
    .position(250,50)
    .addTo(graph);

paper.on('element:delete', function(elementView, evt) {
    evt.stopPropagation();
    if (confirm('Are you sure you want to delete this element?')) {
        elementView.model.remove();
    }
});

var Header = joint.dia.Element.define('custom.Header', {

    markup: [
        '<rect class="body"/>',
        '<rect class="header"/>',
        '<text class="caption"/>',
        '<text class="description"/>',
        '<image class="icon"/>'
    ].join(''),
    attrs: {
        '.body': {
            fitRef: true,
            fill: 'white',
            stroke: 'gray',
            strokeWidth: 3
        },
        '.header': {
            fill: 'gray',
            stroke: 'none',
            height: 20,
            refWidth: '100%'
        },
        '.caption': {
            refX: '50%',
            textAnchor: 'middle',
            fontSize: 12,
            fontFamily: 'sans-serif',
            y: 15,
            textWrap: {
                text: 'Header',
                height: 0
            },
            fill: '#fff'
        },
        '.description': {
            refX: '50%',
            refX2: 15,
            refY: 25,
            textAnchor: 'middle',
            fontSize: 12,
            fontFamily: 'sans-serif',
            textWrap: {
                text: 'Here is a description spread on multiple lines. Obviously wrapped automagically.',
                width: -40,
                height: -25
            },
            fill: '#aaa'
        },
        '.icon': {
            x: 3,
            y: 22,
            width: 30,
            height: 40,
            xlinkHref: 'http://placehold.it/30x40'
        }
    }
});

var header = (new Header())
    .size(200,140)
    .position(420,40)
    .addTo(graph);

// Animate the element size
header.transition('size', { width: 160, height: 100 }, {
    valueFunction: joint.util.interpolate.object,
    duration: 1000,
    delay: 1000
});

var link = new joint.dia.Link({
    source: { id: circle.id },
    target: { id: rectangle.id },
    router: {
        name: 'orthogonal'
    },
    labels: [{
        position: 0.5,
        markup: '<path/>',
        attrs: {
            path: {
                d: 'M 30 15 -30 15',
                stroke: '#666',
                strokeWidth: 2,
                fill: 'none',
                targetMarker: {
                    type: 'path',
                    fill: '#666',
                    stroke: '#000',
                    d: 'M 10 -10 0 0 10 10 z'
                },
                sourceMarker: {
                    type: 'circle',
                    fill: '#666',
                    stroke: '#333',
                    r: 5,
                    cx: 5
                }
            }
        }
    }],
    attrs: {
        '.connection': {
            stroke: '#333',
            strokeWidth: 2,
            sourceMarker: {
                type: 'circle',
                fill: '#666',
                stroke: '#333',
                r: 5,
                cx: 5
            },
            targetMarker: {
                type: 'path',
                fill: '#666',
                stroke: '#000',
                d: 'M 10 -10 0 0 10 10 z'
            },
            vertexMarker: {
                type: 'circle',
                fill: '#666',
                stroke: '#333',
                r: 5
            }
        }
    }
}).addTo(graph);

var Shape = joint.dia.Element.define('custom.Shape', {
    markup: 'path',
    attrs: {
        '.': {
            magnet: false
        },
        path: {
            fill: 'lightgreen',
            stroke: 'green'
        }
    },
    ports: {
        groups: {
            main: {
                position: {
                    name: 'absolute',
                    args: {
                        y: '50%'
                    }
                },
                markup: 'path',
                size: { width: 20, height: 20 },
                attrs: {
                    path: {
                        fill: 'green',
                        transform: 'translate(-10,-10)',
                        magnet: true
                    }
                }
            }
        }
    }
}, { /* no prototype methods */ }, {
    attributes: {

        shape: {
            qualify: function(value, node) {
                return _.contains([
                    'hexagon',
                    'rhombus',
                    'rounded-rectangle'
                ], value) && (node instanceof SVGPathElement);
            },
            set: function(shape, refBBox) {
                var data;
                switch (shape) {
                    case 'hexagon':
                        data = [
                            g.Line(refBBox.topMiddle(), refBBox.origin()).midpoint(),
                            g.Line(refBBox.topMiddle(), refBBox.topRight()).midpoint(),
                            refBBox.rightMiddle(),
                            g.Line(refBBox.bottomMiddle(), refBBox.corner()).midpoint(),
                            g.Line(refBBox.bottomMiddle(), refBBox.bottomLeft()).midpoint(),
                            refBBox.leftMiddle()
                        ];
                        break;
                    case 'rhombus':
                        data = [
                            refBBox.topMiddle(),
                            refBBox.rightMiddle(),
                            refBBox.bottomMiddle(),
                            refBBox.leftMiddle()
                        ];
                        break;
                    case 'rounded-rectangle':
                        var rect = refBBox.toJSON();
                        rect.rx = 5;
                        rect.ry = 5;
                        return { d: V.rectToPath(rect) };
                }
                return { d: 'M ' + data.join(' ').replace(/@/g, ' ') + ' Z' };
            }
        }
    }
});

var shape1 = (new Shape())
    .attr('path/shape', 'hexagon')
    .size(100, 100)
    .position(100, 50)
    .addPort({
        group: 'main',
        attrs: { path: { shape: 'hexagon' }}
    })
    .addPort({
        group: 'main',
        args: { x: '100%' },
        attrs: { path: { shape: 'hexagon' }}
    })
    .addTo(graph);

var shape2 = (new Shape())
    .attr('path/shape', 'rhombus')
    .size(100, 100)
    .position(100, 170)
    .addPort({
        group: 'main',
        attrs: { path: { shape: 'rhombus' }}
    })
    .addPort({
        group: 'main',
        args: { x: '100%' },
        attrs: { path: { shape: 'rhombus' }}
    })
    .addTo(graph);

var shape3 = (new Shape())
    .attr('path/shape', 'rounded-rectangle')
    .size(100, 100)
    .position(100, 290)
    .addPort({
        group: 'main',
        attrs: { path: { shape: 'rounded-rectangle' }}
    })
    .addPort({
        id: 'circle-port',
        group: 'main',
        args: { x: '100%' },
        markup: '<g><circle/><circle/></g>',
        attrs: {
            circle: {
                fill: 'green'
            },
            'circle:first': {
                r: 15
            },
            'circle:last': {
                ref: 'circle:first',
                r: 10,
                refDx: 10,
                magnet: true
            }
        }
    })
    .addTo(graph);

var portIndex = shape3.getPortIndex('circle-port');

shape3.transition('ports/items/' + portIndex + '/attrs/circle:first/r', 5, {
    delay: 2000
});
