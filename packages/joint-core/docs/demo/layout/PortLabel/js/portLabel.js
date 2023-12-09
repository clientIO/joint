var paper3 = createPaper();
var g3 = new joint.shapes.standard.Ellipse({
    position: { x: 80, y: 210 },
    size: { width: 200, height: 100 },
    attrs: {
        label: { text: 'outsideOriented', fill: '#6a6c8a' },
        body: { stroke: '#31d0c6', strokeWidth: 2 }
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
                        startAngle: 90
                    }
                },
                label: {
                    position: {
                        name: 'outsideOriented',
                        args: {
                            offset: 15,
                            attrs: {}
                        }
                    }
                },
                attrs: {
                    circle: { fill: '#ffffff', stroke: '#31d0c6', strokeWidth: 2, r: 10, magnet: true },
                    text: { fill: '#6a6c8a' }
                }
            }
        }
    }
});

function times(n, cb) {
    Array.from({ length: n }).forEach((_, i) => cb(i));
}

times(10, function(index) {
    g3.addPort({ attrs: { text: { text: 'L ' + index }}, group: 'a' });
});

g3.addPort({
    group: 'a',
    attrs: {
        circle: { stroke: '#fe854f', strokeWidth: 2, magnet: true },
        '.label-rect': { stroke: '#fe854f', fill: '#fe854f', width: 100, height: 20 },
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

var g33 = new joint.shapes.standard.Rectangle({
    position: { x: 425, y: 60 },
    size: { width: 200, height: 100 },
    attrs: {
        label: { text: 'left', fill: '#6a6c8a' },
        body: { stroke: '#31d0c6', strokeWidth: 2 }
    },
    ports: {
        groups: {
            'a': {
                position: {
                    name: 'top',
                    args: { dr: 0, dx: 0, dy: -9 }
                },
                label: { position: { name: 'left', args: { offset: 12 }}},
                attrs: {
                    circle: { fill: '#ffffff', stroke: '#31d0c6', strokeWidth: 2, r: 10 },
                    text: { fill: '#6a6c8a' }
                }
            }
        }
    }
});

times(3, function(index) {
    g33.addPort({ attrs: { text: { text: 'L' + index }, circle: { magnet: true }}, group: 'a' });
});

g33.addPort({
    group: 'a',
    attrs: {
        circle: { stroke: '#fe854f', strokeWidth: 2, magnet: true },
        '.label-rect': { stroke: '#fe854f', fill: '#fe854f', width: 150, height: 20 },
        '.label-text': { x: '0.5em', y: '0.9em' },
        'text': { x: '0.5em', text: 'custom label - manual', y: '0.9em', 'text-anchor': 'start', fill: '#ffffff' }
    },
    label: {
        position: {
            name: 'manual',
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

var b = document.createElement('b');
b.textContent = 'Click on Rectangle or Ellipse to toggle port positions alignment';
document.body.appendChild(b);

var labelPos = {
    'standard.Rectangle': 0,
    'standard.Ellipse': 0
};

paper3.on('cell:pointerclick', function(cellView, e) {

    if (cellView.model.isLink() || !cellView.model.hasPorts()) {
        return;
    }

    var positions;
    var type = cellView.model.get('type');

    if (type === 'standard.Rectangle') {
        positions = ['left', 'right', 'top', 'bottom', 'outsideOriented', 'outside', 'insideOriented', 'inside'];
    }

    if (type === 'standard.Ellipse') {
        positions = ['outsideOriented', 'outside', 'radial', 'radialOriented'];

    }

    var pos = positions[(labelPos[type]) % positions.length];

    cellView.model.prop('attrs/label/text', pos);

    cellView.model.prop('ports/groups/a/label/position/name', pos);
    labelPos[type]++;
});
