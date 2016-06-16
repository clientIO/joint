$('<h2/>').text('Labels').appendTo('body');
var paper3 = createPaper();
var g3 = new joint.shapes.basic.Circle({
    position: { x: 90, y: 60 },
    size: { width: 200, height: 100 },
    ellipse: { fill: 'gray', stroke: 'red', rx: 150, ry: 100, cx: 150, cy: 100 },
    attrs: {
        text: { text: 'outsideOriented' }
    },
    ports: {
        groups: {
            'a': {
                position: {
                    name: 'ellipseSpread',
                    args: {
                        dr: 0,
                        dx: 0,
                        dy: 0,
                        compensateRotation: true,
                        // step: 20,
                        startAngle: 0
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
                    circle: { fill: '#ffffff', stroke: '#000000', r: 10, magnet: true },
                    text: { fill: 'green' }
                }
            }
        }
    }
});


_.times(10, function(index) {
    g3.addPort({ attrs: { text: { text: 'L ' + index } }, group: 'a' });
});

g3.addPort({
    group: 'a',
    attrs: {
        circle: { stroke: 'red', 'stroke-width': 2, magnet: true },
        '.label-rect': { stroke: 'red', fill: '#ff0000', width: 100, height: 20 },
        '.label-text': { x: '0.5em', y: '0.9em' },
        'text': { x: '0.5em', text: 'custom label', y: '0.9em', 'text-anchor': 'start', fill: '#ffffff' }
    },
    label: {
        position: {
            name: 'right',
            args: { angle: 30, offset: 22 }
        },
        markup: '<g><rect class="label-rect"/><text class="label-text"/></g>'
    }
});

var g33 = new joint.shapes.basic.Rect({
    position: { x: 450, y: 100 },
    size: { width: 200, height: 100 },
    attrs: {
        text: { text: 'left' }
    },
    ports: {
        groups: {
            'a': {
                position: {
                    name: 'top',
                    args: { dr: 0, dx: 0, dy: -9 }
                },
                label: { position: { name: 'left', args: { offset: 12 } } },
                attrs: {
                    circle: { fill: '#ffffff', stroke: '#000000', r: 10 },
                    text: { fill: 'green' }
                }
            }
        }
    }
});

_.times(3, function(index) {
    g33.addPort({ attrs: { text: { text: 'L' + index }, circle: { magnet: true } }, group: 'a' });
});

g33.addPort({
    group: 'a',
    attrs: {
        circle: { stroke: 'red', 'stroke-width': 2, magnet: true },
        '.label-rect': { stroke: 'red', fill: '#ff0000', width: 150, height: 20 },
        '.label-text': { x: '0.5em', y: '0.9em' },
        'text': { x: '0.5em', text: 'custom label - manual', y: '0.9em', 'text-anchor': 'start', fill: '#ffffff' }
    },
    label: {
        position: {
            name: 'left',
            args: {
                angle: 10,
                x: 15,
                y: -10
                // this works as well, overrides .label-rect, .label-text attrs for current port
                // attrs: {
                // text: { y: '0.9em', x: '0.5em', 'text-anchor': 'start' },
                // rect: { fill: 'blue' }
                // }
            }
        },
        markup: '<g><rect class="label-rect"/><text class="label-text"/></g>'
    }
});

paper3.model.addCell(g3);
paper3.model.addCell(g33);

$('<b/>').text('Click on ellipse to toggle label position alignment').appendTo('body');

var labelPos = {
    'basic.Rect': 0,
    'basic.Circle': 0
};

paper3.on('cell:pointerclick', function(cellView, e) {

    if (!cellView.model.hasPorts()) {
        return;
    }

    var positions;
    var type = cellView.model.get('type');

    if (type === 'basic.Rect') {
        positions = ['left', 'right', 'top', 'bottom', 'outsideOriented', 'outside', 'insideOriented', 'inside'];
    }

    if (type === 'basic.Circle') {
        positions = ['outsideOriented', 'outside', 'radial', 'radialOriented'];

    }

    var pos = positions[(labelPos[type]) % positions.length];

    cellView.model.prop('attrs/text/text', pos);

    cellView.model.prop('ports/groups/a/label/position/name', pos);
    labelPos[type]++;
});
