var paper2 = window.createPaper();

var g2Rect = new joint.shapes.standard.Rectangle({
    position: { x: 90, y: 100 },
    size: { width: 300, height: 150 },
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
            blacks: {
                attrs: {
                    circle: {
                        fill: '#ffffff',
                        stroke: '#31d0c6',
                        strokeWidth: 2,
                        r: 12,
                        magnet: true
                    }
                }
            },
            reds: {
                position: function(ports, elBBox) {
                    return ports.map(function(_, index) {
                        var step = -Math.PI / 8;
                        var y = Math.sin(index * step) * 50;
                        return new g.Point({ x: index * 12, y: y + elBBox.height });
                    });
                },
                label: {
                    position: {
                        name: 'manual',
                        args: {
                            attrs: {
                                text: {
                                    y: 40,
                                    textAnchor: 'middle'
                                }
                            }
                        }
                    }
                },
                attrs: {
                    rect: {
                        fill: '#fe854f',
                        width: 11
                    },
                    text: {
                        fill: '#fe854f'
                    },
                    circle: {
                        fill: '#fe854f',
                        r: 5,
                        magnet: true
                    }
                }
            },
            greens: {
                attrs: {
                    circle: {
                        fill: 'transparent',
                        stroke: '#31d0c6',
                        strokeWidth: 3,
                        r: 10,
                        magnet: true
                    },
                    rect: {
                        fill: '#31d0c6'
                    },
                    text: {
                        fill: '#31d0c6'
                    }
                },
                position: 'absolute',
                label: {
                    position: {
                        name: 'manual',
                        args: {
                            y: 20,
                            attrs: {
                                portLabel: { textAnchor: 'middle' }
                            }
                        }
                    },
                    markup: [{
                        tagName: 'text',
                        textContent: 'absolute',
                        groupSelector: 'portLabel'
                    }, {
                        tagName: 'text',
                        selector: 'layoutValue',
                        groupSelector: 'portLabel'
                    }]
                }
            }
        }
    }
});

var g2Circle = new joint.shapes.standard.Ellipse({
    position: { x: 500, y: 50 },
    size: { width: 200, height: 100 },
    attrs: {
        label: {
            text: 'ellipse',
            fill: '#6a6c8a'
        },
        body: {
            stroke: '#31d0c6',
            strokeWidth: 2
        }
    },
    ports: {
        groups: {
            'blacks': {
                position: 'ellipse',
                attrs: {
                    circle: {
                        fill: '#ffffff',
                        stroke: '#31d0c6',
                        strokeWidth: 2,
                        r: 12,
                        magnet: true
                    }
                }
            }
        }
    }
});

Array.from({ length: 4 }).forEach(function() {
    g2Rect.addPort({ group: 'blacks' });
});

Array.from({ length: 24 }).forEach(function() {
    g2Rect.addPort({ group: 'reds' });
});

g2Rect.addPort({
    group: 'reds',
    attrs: {
        text: { text: 'fn: sin(x)' }
    }
});

g2Rect.addPort({
    group: 'greens',
    attrs: {
        layoutValue: { text: 'x:80% y:20%' }
    },
    args: {
        x: '80%', y: '20%'
    }
});

Array.from({ length: 8 }).forEach(function() {
    g2Circle.addPort({ group: 'blacks' });
});

paper2.model.addCell(g2Circle);
paper2.model.addCell(g2Rect);

$('<b/>').text('Click on Rectangle or Ellipse to toggle port positions alignment').appendTo('body');
$('<div/>').html('&nbsp;').appendTo('body');

var portPosition = {
    'standard.Rectangle': 1,
    'standard.Ellipse': 1
};

paper2.on('element:pointerclick', function(cellView) {

    if (!cellView.model.hasPorts()) return;

    var positions;
    var type = cellView.model.get('type');

    if (type === 'standard.Rectangle') {
        positions = ['left', 'right', 'top', 'bottom', 'line'];
    }

    if (type === 'standard.Ellipse') {
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
    cellView.model.prop('attrs/label/text', pos.toString());
    portPosition[type]++;
});

