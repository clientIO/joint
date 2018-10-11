var graph = new joint.dia.Graph;

new joint.dia.Paper({
    el: document.getElementById('paper'),
    width: 650,
    height: 400,
    gridSize: 1,
    model: graph,
    defaultConnectionPoint: { name: 'boundary' }
});

var m1 = new joint.shapes.standard.Rectangle({
    position: { x: 50, y: 50 },
    size: { width: 90, height: 90 },
    ports: {
        groups: {
            inPorts: {
                attrs: {
                    text: { fill: '#000000' },
                    circle: { fill: '#00ff00', stroke: '#000000', magnet: true }
                }
            },
            outPorts: {
                attrs: {
                    text: { fill: '#000000' },
                    circle: { fill: '#ff0000', stroke: '#000000', magnet: true }
                },
                position: 'right',
                label: { position: 'outside' }
            }
        },
        items: [
            {
                id: 'in1',
                group: 'inPorts',
                attrs: { text: { text: 'in1' }}
            },
            {
                group: 'inPorts',
                attrs: { text: { text: 'in2' }}
            },
            {
                id: 'out',
                group: 'outPorts',
                attrs: { text: { text: 'out' }}
            }
        ]
    }
});
graph.addCell(m1);

var m2 = m1.clone();
m2.translate(200, 100);
graph.addCell(m2);

// Manually create a link connecting ports.

var l1 = new joint.dia.Link({
    source: { id: m1.id, port: 'out' },
    target: { id: m2.id, port: 'in1' }
});

graph.addCell(l1);

joint.shapes.devs.MyImageModel = joint.dia.Element.extend({

    markup: [{
        tagName: 'rect',
        selector: 'body'
    },{
        tagName: 'image',
        selector: 'image'
    },{
        tagName: 'text',
        selector: 'label'
    }],

    defaults: joint.util.defaultsDeep({

        type: 'devs.MyImageModel',
        size: { width: 80, height: 80 },
        attrs: {
            body: {
                stroke: '#d1d1d1',
                fill: {
                    type: 'linearGradient',
                    stops: [{ offset: '0%', color: 'white' }, { offset: '50%', color: '#d1d1d1' }],
                    attrs: { x1: '0%', y1: '0%', x2: '0%', y2: '100%' }
                },
                refWidth: '100%',
                refHeight: '100%'
            },
            label: {
                text: 'My Shape',
                refY: -20
            },
            image: {
                xlinkHref: 'https://via.placeholder.com/50x50',
                width: 50,
                height: 50,
                refX: '50%',
                refY: '50%',
                xAlignment: 'middle',
                yAlignment: 'middle'
            }
        }

    }, joint.dia.Element.prototype.defaults)
});

// Usage:

var imageModel = new joint.shapes.devs.MyImageModel({
    position: { x: 450, y: 250 },
    size: { width: 90, height: 81 },
    ports: {
        groups: {
            inPorts: {
                attrs: {
                    text: { fill: '#000000' },
                    circle: { fill: '#c8c8c8', stroke: 'gray', magnet: true }
                }
            },
            outPorts: {
                attrs: {
                    text: { fill: '#000000' },
                    circle: { fill: '#000000', magnet: true }
                },
                position: 'right',
                label: { position: 'right' }
            }
        },
        items: [
            {
                id: 'in1',
                group: 'inPorts',
                attrs: { text: { text: 'in1' }}
            },
            {
                group: 'inPorts',
                attrs: { text: { text: 'in2' }}
            },
            {
                id: 'out',
                group: 'outPorts',
                attrs: { text: { text: 'out' }}
            }
        ]
    }
});
graph.addCell(imageModel);

var circleModel = new joint.shapes.standard.Circle({
    position: { x: 500, y: 100 },
    size: { width: 100, height: 100 },
    attrs: {
        body: { stroke: 'blue', fill: 'lightblue' },
        label: { text: 'Circle Model' }
    },
    portMarkup: [{ tagName: 'rect', selector: 'portBody' }],
    ports: {
        groups: {
            'a': {
                position: {
                    name: 'ellipse',
                    args: {
                        dx: -5,
                        dy: -5,
                        dr: 0,
                        step: 30,
                        startAngle: 90
                    }
                },
                attrs: {
                    portBody: {
                        width: 10,
                        height: 10,
                        stroke: 'gray',
                        fill: 'lightGray',
                        magnet: 'active'
                    }
                }
            },
            'b': {
                position: {
                    name: 'ellipse',
                    args: {
                        dx: -5,
                        dy: -5,
                        dr: 0,
                        step: 10,
                        startAngle: 270
                    }
                },
                attrs: {
                    portBody: {
                        width: 10,
                        height: 10,
                        stroke: 'gray',
                        fill: 'red',
                        magnet: 'active'
                    }
                }
            }
        },
        items: [
            { group: 'a' },
            { group: 'a' },
            { group: 'a' },
            { group: 'a' },
            { group: 'b' }
        ]
    }
});
graph.addCell(circleModel);

// All-sides ports shape usage.
// ----------------------------

var myComponent = new joint.shapes.standard.Rectangle({
    position: { x: 100, y: 250 },
    size: { width: 100, height: 100 },
    portMarkup: [{
        tagName: 'circle',
        selector: 'portBody',
        attributes: {
            'fill': '#ff0000',
            'stroke': '#000000',
            'r': 10
        }
    }],
    portLabelMarkup: [{
        tagName: 'text',
        selector: 'portLabel',
        attributes: {
            'fill': '#ff0000'
        }
    }],
    ports: {
        groups: {
            'o': {
                position: 'absolute',
                label: { position: 'outside' },
                attrs: {
                    portBody: { magnet: true }
                }
            },
            'i': {
                position: 'absolute',
                label: { position: 'outside' },
                attrs: {
                    portLabel: { fill: '#00ff00' },
                    portBody: { fill: '#00ff00', magnet: true }
                }
            }
        },
        items: [
            { group: 'i', args: { x: '35%', y: 0 }, attrs: { text: { text: 'it' }}},
            { group: 'o', args: { x: '70%', y: 0 }, attrs: { text: { text: 'ot' }}},

            { group: 'i', args: { x: '100%', y: '35%' }, attrs: { text: { text: 'ir' }}},
            { group: 'o', args: { x: '100%', y: '70%' }, attrs: { text: { text: 'or' }}},

            { group: 'i', args: { x: '35%', y: '100%' }, attrs: { text: { text: 'ib' }}},
            { group: 'o', args: { x: '70%', y: '100%' }, attrs: { text: { text: 'ob' }}},

            { group: 'i', args: { x: 0, y: '35%' }, attrs: { text: { text: 'il' }}},
            { group: 'o', args: { x: 0, y: '70%' }, attrs: { text: { text: 'ol' }}}
        ]
    },
    attrs: {
        root: { magnet: false },
        label: {
            pointeEvents: 'none',
            text: 'Component',
            refX: .5,
            refY: 20,
            textAnchor: 'middle',
            fill: '#000000'
        }
    }
});

graph.addCell(myComponent);
