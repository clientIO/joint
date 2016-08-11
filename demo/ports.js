var graph = new joint.dia.Graph;
var paper = new joint.dia.Paper({ el: $('#paper'), width: 650, height: 400, gridSize: 1, model: graph });

var m1 = new joint.shapes.basic.Rect({
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
                attrs: { text: { text: 'in1' } }
            },
            {
                group: 'inPorts',
                attrs: { text: { text: 'in2' } }
            },
            {
                id: 'out',
                group: 'outPorts',
                attrs: { text: { text: 'out' } }
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

joint.shapes.devs.MyImageModel = joint.shapes.basic.Rect.extend({

    markup: '<g class="rotatable"><g class="scalable"><rect class="body"/></g><image/><text class="label"/></g>',

    defaults: _.defaultsDeep({

        type: 'devs.MyImageModel',
        size: { width: 80, height: 80 },
        attrs: {
            rect: {
                stroke: '#d1d1d1',
                fill: {
                    type: 'linearGradient',
                    stops: [{ offset: '0%', color: 'white' }, { offset: '50%', color: '#d1d1d1' }],
                    attrs: { x1: '0%', y1: '0%', x2: '0%', y2: '100%' }
                }
            },
            '.label': { text: 'My Shape', 'ref-y': -20 },
            image: {
                'xlink:href': 'http://jointjs.com/images/logo.png',
                width: 80,
                height: 50,
                'ref-x': .5,
                'ref-y': .5,
                ref: 'rect',
                'x-alignment': 'middle',
                'y-alignment': 'middle'
            }
        }

    }, joint.shapes.devs.Model.prototype.defaults)
});

joint.shapes.devs.MyImageModelView = joint.shapes.devs.ModelView;

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
                attrs: { text: { text: 'in1' } }
            },
            {
                group: 'inPorts',
                attrs: { text: { text: 'in2' } }
            },
            {
                id: 'out',
                group: 'outPorts',
                attrs: { text: { text: 'out' } }
            }
        ]
    }
});
graph.addCell(imageModel);

joint.shapes.devs.CircleModel = joint.shapes.basic.Circle.extend({

    markup: '<g class="rotatable"><g class="scalable"><circle class="body"/></g><text class="label"/></g>',
    portMarkup: '<rect/>',

    defaults: _.defaultsDeep({

        type: 'devs.CircleModel',
        attrs: {
            '.body': { cx: 50, cy: 50, r: 50, stroke: 'blue', fill: 'lightblue' },
            '.label': { text: 'Circle Model', 'ref-y': 0.5, 'y-alignment': 'middle' }
        },
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
                        rect: {
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
                        rect: {
                            width: 10,
                            height: 10,
                            stroke: 'gray',
                            fill: 'red',
                            magnet: 'active'
                        }
                    }
                }
            }
        }
    }, joint.shapes.devs.Model.prototype.defaults)
});

joint.shapes.devs.CircleModelView = joint.shapes.devs.ModelView;

var circleModel = new joint.shapes.devs.CircleModel({
    position: { x: 500, y: 100 },
    size: { width: 100, height: 100 },
    ports: {
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

// All-sides ports shape definition. (https://jsfiddle.net/yzrgvqkt/)
// ---------------------------------

joint.shapes.myShapes = {};
joint.shapes.myShapes.Component = joint.shapes.basic.Rect.extend({

    markup: '<g class="rotatable"><g class="scalable"><rect class="body"/></g><text class="label"/></g>',
    portMarkup: '<circle r="10" fill="#ff0000" stroke="#000000"/>',
    portLabelMarkup: '<text fill="#ff0000" />',

    defaults: _.defaultsDeep({

        type: 'myShapes.Component',
        size: { width: 1, height: 1 },

        ports: {
            groups: {
                'o': {
                    position: 'absolute',
                    label: { position: 'outside' },
                    attrs: { circle: { magnet: true } }
                },
                'i': {
                    position: 'absolute',
                    label: { position: 'outside' },
                    attrs: {
                        text: { fill: '#00ff00' },
                        circle: { fill: '#00ff00', magnet: true }
                    }
                }
            },
            items: [
                { group: 'i', args: { x: '35%', y: 0 }, attrs: { text: { text: 'it' } } },
                { group: 'o', args: { x: '70%', y: 0 }, attrs: { text: { text: 'ot' } } },

                { group: 'i', args: { x: '100%', y: '35%' }, attrs: { text: { text: 'ir' } } },
                { group: 'o', args: { x: '100%', y: '70%' }, attrs: { text: { text: 'or' } } },

                { group: 'i', args: { x: '35%', y: '100%' }, attrs: { text: { text: 'ib' } } },
                { group: 'o', args: { x: '70%', y: '100%' }, attrs: { text: { text: 'ob' } } },

                { group: 'i', args: { x: 0, y: '35%' }, attrs: { text: { text: 'il' } } },
                { group: 'o', args: { x: 0, y: '70%' }, attrs: { text: { text: 'ol' } } }
            ]
        },
        attrs: {
            '.': { magnet: false },
            '.body': {
                width: 150, height: 250,
                stroke: '#000000',
                fill: '#FFFFFF'
            },
            text: {
                'pointer-events': 'none'
            },
            '.label': {
                text: 'Component',
                'ref-x': .5,
                'ref-y': 10,
                ref: '.body',
                'text-anchor': 'middle',
                fill: '#000000'
            }
        }

    }, joint.shapes.basic.Generic.prototype.defaults)
});

// All-sides ports shape usage.
// ----------------------------

var myComponent = new joint.shapes.myShapes.Component({
    position: { x: 100, y: 250 },
    size: { width: 100, height: 100 }
});
graph.addCell(myComponent);
