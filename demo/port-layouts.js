// I.
$('<h2/>').text('Default settings').appendTo('body');
var graph1 = createPaper().model;
$('<button/>').text('add port').appendTo('body').on('click', function() {
    g1.addPort({ attrs: { circle: { magnet: true } } });
});
$('<button/>').text('remove port').appendTo('body').on('click', function() {
    g1.removePort(g1.getPorts()[0]);
});
var g1 = new joint.shapes.basic.Rect({
    position: { x: 130, y: 30 },
    size: { width: 100, height: 150 }
});
graph1.addCell(g1);
g1.addPort({ attrs: { circle: { magnet: true } } });
g1.addPort({ attrs: { circle: { magnet: true } } });
g1.addPort({ attrs: { circle: { magnet: true } } });
new joint.shapes.basic.Circle({
    position: { x: 20, y: 150 },
    id: 'target',
    attrs: {
        circle: { cx: 8, cy: 8, r: 8 },
        text: { text: 'test' }
    }
}).addTo(graph1);

new joint.dia.Link({ source: { id: 'target' }, target: { id: g1.id, port: g1.getPorts()[0].id } }).addTo(graph1);
new joint.dia.Link({ source: { id: 'target' }, target: { id: g1.id, port: g1.getPorts()[1].id } }).addTo(graph1);
new joint.dia.Link({ source: { id: 'target' }, target: { id: g1.id, port: g1.getPorts()[2].id } }).addTo(graph1);

// II.
$('<h2/>').text('Port groups - \'blacks\', \'reds\', \'greens\'').appendTo('body');
var paper2 = createPaper();
var g2 = new joint.shapes.basic.Rect({
    position: { x: 130, y: 30 },
    size: { width: 300, height: 150 },
    attrs: {
        text: { text: 'left' }
    },
    ports: {
        groups: {
            'blacks': {
                attrs: {
                    circle: {
                        fill: '#000000',
                        stroke: 'darkGray',
                        'stroke-width': 2,
                        r: 12,
                        magnet: true
                    }
                }
            },
            'reds': {
                position: function(ports, elBbox, opt) {
                    return _.map(ports, function(port, index) {
                        return g.point({ x: index * 20 + 20, y: 0 });
                    });
                },
                attrs: {
                    circle: {
                        fill: 'red',
                        r: 10,
                        magnet: true
                    }
                }
            },
            'greens': {
                attrs: {
                    circle: {
                        fill: 'transparent',
                        stroke: 'green',
                        'stroke-width': 3,
                        r: 20,
                        magnet: true
                    }
                },
                position: 'absolute'
            }
        }
    }
});

paper2.model.addCell(g2);
g2.addPort({ group: 'blacks', id: 'b1' });
g2.addPort({ group: 'blacks', id: 'b2' });
g2.addPort({ group: 'blacks' });
g2.addPort({ group: 'blacks' });
g2.addPort({ group: 'blacks' });
g2.addPort({ group: 'blacks' });

g2.addPort({ group: 'greens', args: { x: '70%', y: '60%' } });
g2.addPort({ group: 'greens', args: { x: '90%', y: '60%' } });

g2.addPort({ group: 'reds' });
//override group settings
g2.addPort({ group: 'reds', attrs: { circle: { r: 5 } } });
g2.addPort({ group: 'reds' });

$('<b/>').text('Click on Rectangle to toggle port positions alignment').appendTo('body');

var portPosition = 0;
paper2.on('element:pointerdown', function(cellView, e) {

    if (!cellView.model.hasPorts()) {
        return;
    }

    var positions = _.keys(joint.layout.Port);

    var pos = positions[(portPosition) % positions.length];

    if (pos !== 'fn') {
        g2.prop('ports/groups/blacks/position/name', pos);
    }
    cellView.model.prop('attrs/text/text', pos);
    portPosition++;
});


// III.
$('<h2/>').text('Labels').appendTo('body');
var paper3 = createPaper();
var g3 = new joint.shapes.basic.Circle({
    position: { x: 90, y: 60 },
    size: { width: 200, height: 100 },
    ellipse: { fill: 'gray', stroke: 'red', rx: 150, ry: 100, cx: 150, cy: 100 },
    attrs: {
        text: { text: 'left' }
    },
    ports: {
        groups: {
            'a': {
                position: {
                    name: 'ellipse',
                    args: { dr: 0, dx: 0, dy: 0 }
                },
                label: {
                    position: 'left',
                    args: {}
                },
                attrs: {
                    circle: {
                        fill: '#ffffff',
                        stroke: '#000000',
                        r: 10
                    },
                    text: { fill: 'green' }
                }
            }
        }
    }
});


_.times(10, function(index) {
    g3.addPort({ attrs: { text: { text: 'label ' + index }, circle: { magnet: true } }, group: 'a' });
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
            args: { angle: 30 }
        },
        markup: '<g><rect class="label-rect"/><text class="label-text"/></g>'
    }
});

var g33 = new joint.shapes.basic.Rect({
    position: { x: 450, y: 100 },
    size: { width: 200, height: 100 },
    attrs: {
        text: { text: 'left' },

    },
    ports: {
        groups: {
            'a': {
                position: {
                    name: 'top',
                    args: { dr: 0, dx: 0, dy: 0 }
                },
                label: { position: 'outsideOriented' },
                attrs: {
                    circle: { fill: '#ffffff', stroke: '#000000', r: 10 },
                    text: { fill: 'green' }
                }
            }
        }
    }
});
_.times(3, function(index) {
    g33.addPort({ attrs: { text: { text: 'label ' + index }, circle: { magnet: true } }, group: 'a' });
});

g33.addPort({
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
            args: {
                angle: 30
                //TODO this works as well, overrides .label-rect, .label-text attrs
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

var labelPos = 0;
paper3.on('element:pointerdown', function(cellView, e) {

    if (!cellView.model.hasPorts()) {
        return;
    }

    var positions = _.keys(joint.layout.Label);
    var pos = positions[(labelPos) % positions.length];

    cellView.model.prop('attrs/text/text', pos);

    cellView.model.prop('ports/groups/a/label/position', pos);
    labelPos++;
});

// IV.
$('<h2/>').text('Z index').appendTo('body');
var paper4 = createPaper();
$('<b/>').text('Click on Rectangle to increment z-index of massive port').appendTo('body');

var g4 = new joint.shapes.basic.Rect({
    position: { x: 130, y: 30 },
    size: { width: 100, height: 150 }
});

_.times(10, function(index) {
    g4.addPort({ id: index + '', attrs: { circle: { r: 15, magnet: true, stroke: '#ffffff' } } });
});

g4.addPort({
    z: 2,
    args: {
        dy: -140,
        dx: 0
    },
    label: {
        position: {
            name: 'right',
            args: {
                tx: 50,
                ty: -10
            }
        }
    },
    attrs: {
        rect: {
            fill: '#ff0000',
            stroke: '#000000',
            magnet: true,
            height: 140,
            width: 60
        },
        text: { text: 'massive port - z-index:2', fill: 'red' }
    },
    markup: '<rect/>'
});

paper4.model.addCell(g4);

paper4.on('element:pointerdown', function(cellView) {

    if (!cellView.model.hasPorts()) {
        return;
    }

    var portIndex = 10;
    var z = parseInt(cellView.model.prop('ports/items/' + portIndex + '/z'), 10) || 0;

    if (z > 10) {
        z = 0;
    }

    cellView.model.prop('ports/items/' + portIndex + '/z', ++z);
    cellView.model.prop('ports/items/' + portIndex + '/attrs/text/text', 'massive port - z-index:' + z);
});

// V. angle.
$('<h2/>').text('Z index').appendTo('body');
var paper5 = createPaper();
$('<b/>').text('Click on Rectangle to increment z-index of massive port').appendTo('body');

var g5 = new joint.shapes.basic.Rect({
    position: { x: 130, y: 100 },
    size: { width: 450, height: 50 },
    ports: {
        groups: {

            'a': {
                position: function(ports, elBBox, opt) {
                    return _.map(ports, function(port, index) {
                        return {
                            x: index * 100,
                            y: -20,
                            angle: index * 50 + 10,
                            // cx: 10,
                            // cy: 10,
                            attrs: { '.': { x: '0.8em', y: '0.9em' }, /*rect: { x: -10, y: -10 }*/ }
                        };
                    });
                },
                attrs: {
                    rect: {
                        stroke: '#000000',
                        width: 20,
                        height: 20
                    },
                    '.dot': {
                        fill: '#ff0000',
                        // cx: -10,
                        // cy: -10,
                        r: 3
                    },
                    text: {
                        text: 'dsafdsadsadsad',
                        fill: '#000000'
                    }
                },
                markup: '<g><rect/><circle class="dot"/></g>'
            }
        }
    }
});

_.times(5, function(index) {
    g5.addPort({ group: 'a', id: index + '', attrs: { text: { text: 'L' + (index + 1) } } });
});

paper5.model.addCell(g5);
var labelPos5 = 0;
paper5.on('element:pointerdown', function(cellView, e) {

    if (!cellView.model.hasPorts()) {
        return;
    }

    var positions = _.keys(joint.layout.Label);
    var pos = positions[(labelPos5) % positions.length];

    cellView.model.prop('attrs/text/text', pos);

    g5.prop('ports/groups/a/label/position', pos);
    labelPos5++;
});

/**
 * HELPERS
 */
function createPaper() {
    var graph = new joint.dia.Graph;

    return new joint.dia.Paper({
        el: $('<div/>').appendTo(document.body),
        width: 800,
        height: 300,
        gridSize: 1,
        perpendicularLinks: false,
        model: graph,
        linkView: joint.dia.LinkView.extend({
            options: _.extend({}, joint.dia.LinkView.prototype.options, {
                doubleLinkTools: true,
                linkToolsOffset: 40,
                doubleLinkToolsOffset: 60
            })
        })
    });
}

