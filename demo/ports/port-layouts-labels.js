var paper3 = window.createPaper();

var g3 = new joint.shapes.standard.Ellipse({
    position: { x: 80, y: 210 },
    size: { width: 200, height: 100 },
    attrs: {
        label: {
            text: 'outsideOriented',
            fill: '#6a6c8a'
        },
        body: {
            stroke: '#31d0c6',
            strokeWidth: 2
        }
    },
    ports: {
        groups: {
            a: {
                position: {
                    name: 'ellipseSpread',
                    args: {
                        dr: 0,
                        dx: 0,
                        dy: 0,
                        compensateRotation: true,
                        // step: 20,
                        startAngle: 90
                    }
                },
                label: {
                    position: {
                        name: 'outsideOriented',
                        args: {
                            // offset: 15,
                            // x: 0,
                            // y: 0,
                            attrs: {}
                        }
                    }
                },
                attrs: {
                    circle: {
                        fill: '#ffffff',
                        stroke: '#31d0c6',
                        strokeWidth: 2,
                        r: 10,
                        magnet: true
                    },
                    text: {
                        fill: '#6a6c8a'
                    }
                }
            }
        }
    }
});

Array.from({ length: 10 }).forEach(function(_, index) {
    g3.addPort({ attrs: { text: { text: 'L ' + index }}, group: 'a' });
});

g3.addPort({
    group: 'a',
    attrs: {
        circle: {
            stroke: '#fe854f',
            strokeWidth: 2,
            magnet: true
        },
        portLabelBody: {
            stroke: '#fe854f',
            fill: '#fe854f',
            width: 100,
            height: 20
        },
        portLabelText: {
            x: '0.5em',
            y: '0.9em'
        },
        text: {
            x: '0.5em',
            text: 'custom label',
            y: '0.9em',
            textAnchor: 'start',
            fill: '#ffffff'
        }
    },
    label: {
        position: {
            name: 'right',
            args: { angle: 30, offset: 22 }
        },
        markup: [{
            tagName: 'rect',
            selector: 'portLabelBody'
        }, {
            tagName: 'text',
            selector: 'portLabelText'
        }]
    }
});

var g33 = new joint.shapes.standard.Rectangle({
    position: { x: 425, y: 60 },
    size: { width: 200, height: 100 },
    attrs: {
        label: {
            text: 'left',
            fill: '#6a6c8a'
        },
        body: {
            stroke: '#31d0c6',
            strokeWidth: 2
        }
    },
    ports: {
        groups: {
            'a': {
                position: {
                    name: 'top',
                    args: { dr: 0, dx: 0, dy: -9 }
                },
                label: {
                    position: { name: 'left', args: { offset: 12 }}
                },
                attrs: {
                    circle: {
                        fill: '#ffffff',
                        stroke: '#31d0c6',
                        strokeWidth: 2,
                        r: 10
                    },
                    text: {
                        fill: '#6a6c8a'
                    }
                }
            }
        }
    }
});

Array.from({ length: 3 }).forEach(function(_, index) {
    g33.addPort({ attrs: { text: { text: 'L' + index }, circle: { magnet: true }}, group: 'a' });
});

g33.addPort({
    group: 'a',
    attrs: {
        circle: {
            stroke: '#fe854f',
            strokeWidth: 2,
            magnet: true
        },
        portLabelBody: {
            stroke: '#fe854f',
            fill: '#fe854f',
            width: 150,
            height: 20
        },
        portLabelText: {
            x: '0.5em',
            y: '0.9em'
        },
        text: {
            x: '0.5em',
            text: 'custom label - manual',
            y: '0.9em',
            textAnchor: 'start',
            fill: '#ffffff'
        }
    },
    label: {
        position: {
            name: 'left',
            args: {
                angle: 10,
                x: 15,
                y: -10,
                // this works as well, overrides portLabelRect, portLabelText attrs for current port
                // attrs: {
                //     portLabelText: { y: '0.9em', x: '0.5em', textAnchor: 'start' },
                //     portLabelBody: { fill: 'blue' }
                // }
            }
        },
        markup: [{
            tagName: 'rect',
            selector: 'portLabelBody'
        }, {
            tagName: 'text',
            selector: 'portLabelText'
        }]
    }
});

paper3.model.addCell(g3);
paper3.model.addCell(g33);

$('<b/>').text('Click on Ellipse or Rectangle to toggle label position alignment').appendTo('body');
$('<div/>').html('&nbsp;').appendTo('body');

var labelPos = {
    'standard.Rectangle': 0,
    'standard.Ellipse': 0
};

paper3.on('element:pointerclick', function(cellView) {

    var model = cellView.model;
    if (!model.hasPorts()) return;

    var positions;
    var type = model.get('type');

    if (type === 'standard.Rectangle') {
        positions = ['left', 'right', 'top', 'bottom', 'outsideOriented', 'outside', 'insideOriented', 'inside'];
    }

    if (type === 'standard.Ellipse') {
        positions = ['outsideOriented', 'outside', 'radial', 'radialOriented'];

    }

    var pos = positions[(labelPos[type]) % positions.length];

    model.prop('attrs/label/text', pos);
    model.prop('ports/groups/a/label/position/name', pos);
    labelPos[type]++;
});
