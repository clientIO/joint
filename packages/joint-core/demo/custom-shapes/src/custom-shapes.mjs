import * as joint from '../../../joint.mjs';
import * as g from '../../../src/g/index.mjs';
import V from '../../../src/V/index.mjs';

const graph = new joint.dia.Graph({}, { cellNamespace: joint.shapes });

const paper = new joint.dia.Paper({
    el: document.getElementById('paper'),
    cellViewNamespace: joint.shapes,
    width: 650,
    height: 400,
    gridSize: 10,
    model: graph
});

// Global special attributes
const lineStyleAttribute = {
    set: function(lineStyle, refBBox, node, attrs) {

        const n = attrs['stroke-width'] || 1;
        const dasharray = {
            'dashed': (4*n) + ',' + (2*n),
            'dotted': n + ',' + n
        }[lineStyle] || 'none';

        return { 'stroke-dasharray': dasharray };
    },
    unset: 'stroke-dasharray'
};

const fitRefAttribute = {
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
            case 'PATH': {
                const rect = joint.util.assign(refBBox.toJSON(), fitRef);
                return {
                    d: V.rectToPath(rect)
                };
            }
        }
        return {};
    },
    unset: ['rx', 'ry', 'cx', 'cy', 'width', 'height', 'd']
};

const shapeAttribute = {
    set: function(shape, refBBox, node) {
        if (!(node instanceof SVGPathElement)) {
            throw new Error('The shape attribute can only be set on a path element.');
        }
        let data;
        switch (shape) {
            case 'hexagon': {
                data = [
                    g.Line(refBBox.topMiddle(), refBBox.origin()).midpoint(),
                    g.Line(refBBox.topMiddle(), refBBox.topRight()).midpoint(),
                    refBBox.rightMiddle(),
                    g.Line(refBBox.bottomMiddle(), refBBox.corner()).midpoint(),
                    g.Line(refBBox.bottomMiddle(), refBBox.bottomLeft()).midpoint(),
                    refBBox.leftMiddle()
                ];
                break;
            }
            case 'rhombus': {
                data = [
                    refBBox.topMiddle(),
                    refBBox.rightMiddle(),
                    refBBox.bottomMiddle(),
                    refBBox.leftMiddle()
                ];
                break;
            }
            case 'rounded-rectangle': {
                const rect = refBBox.toJSON();
                rect.rx = 5;
                rect.ry = 5;
                return { d: V.rectToPath(rect) };
            }
            default:
                throw new Error('Unknown shape: ' + shape);
        }
        return { d: 'M ' + data.join(' ').replace(/@/g, ' ') + ' Z' };
    },
    unset: 'd'
};



const progressDataAttribute = {
    set: function(percentage, { x, y, width, height }) {
        const startAngle = 0;
        const endAngle = Math.max(360 / 100 * percentage, startAngle);
        const radius = Math.min(width / 2, height / 2);
        const origin = new g.Point(x + width / 2, y + height / 2);
        // Angle === 360
        if (endAngle >= 360) {
            return {
                d: `
                    M ${origin.x - radius} ${origin.y}
                    a ${radius},${radius} 0 1,1 ${radius * 2},0
                    a ${radius},${radius} 0 1,1 -${radius * 2},0
                `
            };
        }
        // Angle <= 360
        const p1 = g.Point.fromPolar(radius, g.toRad(-endAngle -90), origin);
        const p2 = g.Point.fromPolar(radius, g.toRad(-startAngle -90), origin);
        const largeArcFlag = endAngle - startAngle < 180 ? '0' : '1';
        return {
            d: `
                M ${p1.x} ${p1.y}
                A ${radius} ${radius} 0 ${largeArcFlag} 0 ${p2.x} ${p2.y}
            `
        };
    },
    unset: 'd'
};

const Circle = joint.dia.Element.define('custom.Circle', {
    markup: [{
        tagName: 'ellipse',
        selector: 'body'
    }, {
        tagName: 'text',
        selector: 'label'
    }, {
        tagName: 'path',
        selector: 'lines'
    }],
    attrs: {
        body: {
            fill: '#FFFFFF',
            stroke: '#cbd2d7',
            strokeWidth: 3,
            lineStyle: 'dashed',
            fitRef: true
        },
        lines: {
            stroke: '#cbd2d7',
            strokeWidth: 3,
            lineStyle: 'dotted',
            fill: 'none',
            d: 'M 0 calc(0.25 * h) L calc(w) calc(0.25 * h) M calc(w) calc(0.75 * h) L 0 calc(0.75 * h)'
        },
        label: {
            fill: '#cbd2d7',
            fontSize: 20,
            fontFamily: 'Arial, helvetica, sans-serif',
            transform: 'translate(calc(w / 2), calc(h / 2)) rotate(45) scale(0.5,0.5)',
            textVerticalAnchor: 'middle',
            textAnchor: 'middle'
        }
    }
}, {
    setText: function(text) {
        return this.attr('label/text', text);
    }
}, {
    attributes: {
        'line-style': lineStyleAttribute,
        'fit-ref': fitRefAttribute
    }
});

const circle = (new Circle())
    .size(100, 100)
    .position(500,200)
    .setText('Special\nAttributes')
    .rotate(-45)
    .addTo(graph);

circle.transition('angle', 0, { delay: 500 });

const Rectangle = joint.dia.Element.define('custom.Rectangle', {
    markup: [{
        tagName: 'rect',
        selector: 'body'
    }, {
        tagName: 'circle',
        selector: 'red'
    }, {
        tagName: 'path',
        selector: 'green'
    }, {
        tagName: 'text',
        selector: 'content'
    }],
    attrs: {
        body: {
            fill: '#ddd',
            stroke: '#000',
            width: 'calc(w)',
            height: 'calc(h)',
            rx: 5,
            ty: 5
        },
        red: {
            r: 12,
            fill: '#d00',
            stroke: '#000',
            cx: 'calc(w)',
            event: 'element:delete',
            cursor: 'pointer'
        },
        green: {
            fill: '#0d0',
            stroke: '#000',
            d: 'M calc(w - 12) 0 calc(w - 4) 4 calc(w) 12 calc(w + 4) 4 calc(w + 12) 0 calc(w + 4) -4 calc(w) -12 calc(w - 4) -4 z',
            pointerEvents: 'none'
        },
        content: {
            textWrap: {
                text: 'An element with text automatically wrapped to fit the rectangle.',
                width: -10,
                height: -10
            },
            fontSize: 14,
            fontFamily: 'sans-serif',
            textAnchor: 'middle',
            textVerticalAnchor: 'middle',
            x: 'calc(w / 2)',
            y: 'calc(h / 2)',
        }
    }
});

const rectangle = (new Rectangle())
    .size(100,90)
    .position(250,50)
    .addTo(graph);

paper.on('element:delete', function(elementView, evt) {
    evt.stopPropagation();
    if (confirm('Are you sure you want to delete this element?')) {
        elementView.model.remove();
    }
});

const Header = joint.dia.Element.define('custom.Header', {

    markup: [{
        tagName: 'rect',
        selector: 'body'
    }, {
        tagName: 'rect',
        selector: 'header'
    }, {
        tagName: 'text',
        selector: 'caption'
    }, {
        tagName: 'text',
        selector: 'description'
    }, {
        tagName: 'image',
        selector: 'icon'
    }],
    attrs: {
        body: {
            fitRef: true,
            fill: 'white',
            stroke: 'gray',
            strokeWidth: 3
        },
        header: {
            fill: 'gray',
            stroke: 'none',
            height: 20,
            width: 'calc(w)'
        },
        caption: {
            x: 'calc(w / 2)',
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
        description: {
            x: 'calc(w / 2 + 15)',
            y: 25,
            textAnchor: 'middle',
            textVerticalAnchor: 'top',
            fontSize: 12,
            fontFamily: 'sans-serif',
            textWrap: {
                text: 'Here is a description spread on multiple lines. Obviously wrapped automagically.',
                width: -40,
                height: -25
            },
            fill: '#aaa'
        },
        icon: {
            x: 3,
            y: 22,
            width: 30,
            height: 40,
            xlinkHref: 'http://placehold.it/30x40'
        }
    }
}, {
    // prototype methods
}, {
    attributes: {
        'fit-ref': fitRefAttribute
    }
});

const header = (new Header())
    .size(200,140)
    .position(420,40)
    .addTo(graph);

// Animate the element size
header.transition('size', { width: 160, height: 100 }, {
    valueFunction: joint.util.interpolate.object,
    duration: 1000,
    delay: 1000
});

new joint.shapes.standard.Link({
    source: { id: circle.id },
    target: { id: rectangle.id },
    router: {
        name: 'orthogonal'
    },
    labels: [{
        position: 0.5,
        markup: [{
            tagName: 'path',
            selector: 'arrow'
        }],
        attrs: {
            arrow: {
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
        line: {
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

const Shape = joint.dia.Element.define('custom.Shape', {
    markup: [{
        tagName: 'path',
        selector: 'body'
    }],
    attrs: {
        root: {
            magnet: false
        },
        body: {
            fill: 'lightgreen',
            stroke: 'green'
        }
    },
    ports: {
        groups: {
            main: {
                markup: [{
                    tagName: 'path',
                    selector: 'portBody'
                }],
                position: {
                    name: 'absolute',
                    args: {
                        y: '50%'
                    }
                },
                size: { width: 20, height: 20 },
                attrs: {
                    portBody: {
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
        'shape': shapeAttribute
    }
});

const shape1 = (new Shape())
    .attr('body/shape', 'hexagon')
    .size(100, 100)
    .position(100, 50)
    .addPort({
        group: 'main',
        attrs: { portBody: { shape: 'hexagon' }}
    })
    .addPort({
        group: 'main',
        args: { x: '100%' },
        attrs: { portBody: { shape: 'hexagon' }}
    });

const shape2 = (new Shape())
    .attr('body/shape', 'rhombus')
    .size(100, 100)
    .position(100, 170)
    .addPort({
        group: 'main',
        attrs: { portBody: { shape: 'rhombus' }}
    })
    .addPort({
        group: 'main',
        args: { x: '100%' },
        attrs: { portBody: { shape: 'rhombus' }}
    });

const shape3 = (new Shape())
    .attr('body/shape', 'rounded-rectangle')
    .size(100, 100)
    .position(100, 290)
    .addPort({
        group: 'main',
        attrs: { portBody: { shape: 'rounded-rectangle' }}
    })
    .addPort({
        id: 'circle-port',
        group: 'main',
        args: { x: '100%' },
        markup: [{
            tagName: 'circle',
            selector: 'first',
            groupSelector: ['circles']
        }, {
            tagName: 'circle',
            selector: 'last',
            groupSelector: ['circles']

        }],
        attrs: {
            circles: {
                fill: 'green'
            },
            first: {
                r: 15
            },
            last: {
                ref: 'first',
                r: 10,
                cx: 'calc(w / 2 + 10)',
                magnet: true
            }
        }
    });

graph.addCells([shape1, shape2, shape3]);

const portIndex = shape3.getPortIndex('circle-port');

shape3.transition('ports/items/' + portIndex + '/attrs/first/r', 5, {
    delay: 2000
});

const Progress = joint.dia.Element.define('progress', {
    attrs: {
        progressBackground: {
            stroke: 'gray',
            strokeWidth: 10,
            fill: 'white',
            r: 'calc(w / 2)',
            cx: 'calc(w / 2)',
            cy: 'calc(h / 2)'
        },
        progressForeground: {
            stroke: 'red',
            strokeWidth: 10,
            strokeLinecap: 'butt',
            fill: 'none',
        },
        progressText: {
            fill: 'red',
            fontSize: 25,
            fontWeight: 'bold',
            fontFamily: 'sans-serif',
            textAnchor: 'middle',
            textVerticalAnchor: 'middle',
            x: 'calc(w / 2)',
            y: 'calc(h / 2)'
        }
    }
}, {
    markup: [{
        tagName: 'circle',
        selector: 'progressBackground'
    }, {
        tagName: 'path',
        selector: 'progressForeground'
    }, {
        tagName: 'text',
        selector: 'progressText'
    }],
    setProgress: function(progress, opt) {
        this.attr({
            progressText: { text: progress + '%' },
            progressForeground: { progressD: progress }
        }, opt);
    }
}, {
    attributes: {
        'progress-d': progressDataAttribute
    }
});

const progress = new Progress();
progress.resize(100, 100);
progress.position(400, 280);
progress.setProgress(50);
progress.addTo(graph);
