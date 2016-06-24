$('<h2/>').text('Port groups - \'blacks\', \'reds\', \'greens\'').appendTo('body');
var paper2 = createPaper();
var g2Rect = new joint.shapes.basic.Rect({
    position: { x: 130, y: 30 },
    size: { width: 300, height: 150 },
    attrs: {
        text: { text: 'left' }
    },
    // portMarkup: '<rect width="20" height="20" fill="black"/>',
    ports: {
        groups: {
            'blacks': {
                attrs: {
                    circle: { fill: '#000000', stroke: 'darkGray', 'stroke-width': 2, r: 12, magnet: true }
                }
            },
            'reds': {
                position: function(ports, elBBox, opt) {
                    return _.map(ports, function(port, index) {
                        var step = -Math.PI / 8;

                        var y = Math.sin(index * step) * 50;

                        return g.point({ x: index * 12, y: y + elBBox.height });
                    });
                },
                label: { position: { name: 'manual', args: { attrs: { '.': { y: 40, 'text-anchor': 'middle' } } } } },

                attrs: {
                    rect: { fill: 'red', width: 11 },
                    text: { fill: 'red' },
                    circle: { fill: 'red', r: 5, magnet: true }
                }
            },
            'greens': {
                attrs: {
                    circle: { fill: 'transparent', stroke: 'green', 'stroke-width': 3, r: 10, magnet: true },
                    rect: { fill: 'green' },
                    text: { fill: 'green' }
                },
                position: 'absolute',

                label: {
                    position: {
                        name: 'manual',
                        args: {
                            y: 20,
                            attrs: {
                                text: { 'text-anchor': 'middle' }
                            }
                        }
                    },
                    markup: '<g><text>absolute</text><text class="layout-value"/></g>'
                }
            }
        }
    }
});

var g2Circle = new joint.shapes.basic.Circle({
    position: { x: 500, y: 30 },
    size: { width: 200, height: 100 },
    ellipse: { fill: 'gray', stroke: 'red', rx: 150, ry: 100, cx: 150, cy: 100 },
    attrs: {
        text: { text: 'ellipse' }
    },
    ports: {
        groups: {
            'blacks': {
                position: 'ellipse',
                attrs: {
                    circle: { fill: '#000000', stroke: 'darkGray', 'stroke-width': 2, r: 12, magnet: true }
                }
            }
        }
    }
});

_.times(6, function() {
    g2Rect.addPort({ group: 'blacks' });
});
_.times(24, function() {
    g2Rect.addPort({ group: 'reds' });
});
g2Rect.addPort({ group: 'reds', attrs: { text: { text: 'fn: sin(x)' } } });

g2Rect.addPort({
    group: 'greens',
    attrs: {
        '.layout-value': { text: 'x:80% y:20%' }
    },
    args: {
        x: '80%', y: '20%'
    }
});

_.times(8, function() {
    g2Circle.addPort({ group: 'blacks' });
});

paper2.model.addCell(g2Circle);
paper2.model.addCell(g2Rect);


$('<b/>').text('Click on Rectangle or Ellipse to toggle port positions alignment').appendTo('body');

var portPosition = {
    'basic.Rect': 1,
    'basic.Circle': 1
};

paper2.on('element:pointerclick', function(cellView, e) {

    if (!cellView.model.hasPorts()) {
        return;
    }

    var positions;
    var type = cellView.model.get('type');

    if (type === 'basic.Rect') {
        positions = ['line', 'left', 'right', 'top', 'bottom'];
    }

    if (type === 'basic.Circle') {
        positions = [
            'ellipse',
            'ellipseSpread',
            {
                name: 'ellipseSpread',
                args: {
                    step: 20,
                    startAngle: 90
                },
                toString: function() {
                    return 'ellipseSpread\n step: 20, startAngle: 90';
                }
            },
            {
                name: 'ellipse',
                args: {
                    step: 20,
                    startAngle: 90
                },
                toString: function() {
                    return 'ellipse\n step: 20, startAngle: 90';
                }
            }
        ];
    }

    var pos = positions[(portPosition[type]) % positions.length];

    if (pos !== 'fn') {
        cellView.model.prop('ports/groups/blacks/position', pos);
    }
    cellView.model.prop('attrs/text/text', pos.toString());
    portPosition[type]++;
});

