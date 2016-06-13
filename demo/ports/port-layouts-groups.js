$('<h2/>').text('Port groups - \'blacks\', \'reds\', \'greens\'').appendTo('body');
var paper2 = createPaper();
var g2 = new joint.shapes.basic.Rect({
    position: { x: 130, y: 30 },
    size: { width: 300, height: 150 },
    attrs: {
        text: { text: 'left' }
    },
    portMarkup: '<rect width="20" height="20" fill="black"/>',
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
                    rect: {
                        fill: 'red',
                        width: 11
                    },
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
                    },
                    rect: {
                        fill: 'green'
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
g2.addPort({ group: 'blacks', args: { angle: 45, dx: 0, dy: -5 }, attrs: { rect: { fill: 'gray' } } });
g2.addPort({ group: 'blacks' });
g2.addPort({ group: 'blacks' });
g2.addPort({ group: 'blacks' });

g2.addPort({ group: 'greens', args: { x: '70%', y: '60%' } });
g2.addPort({ group: 'greens', args: { x: '90%', y: '60%', angle: 45 } });

g2.addPort({ group: 'reds' });
//override group settings
g2.addPort({ group: 'reds', attrs: { circle: { r: 5 } } });
g2.addPort({ group: 'reds' });

$('<b/>').text('Click on Rectangle to toggle port positions alignment').appendTo('body');

var portPosition = 0;
paper2.on('cell:pointerclick', function(cellView, e) {

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
