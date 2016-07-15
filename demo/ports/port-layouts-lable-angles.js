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
                        r: 3
                    },
                    text: {
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

    if (cellView.model.isLink() || !cellView.model.hasPorts()) {
        return;
    }

    var positions = _.keys(joint.layout.PortLabel);
    var pos = positions[(labelPos5) % positions.length];

    cellView.model.prop('attrs/text/text', pos);

    g5.prop('ports/groups/a/label/position', pos);
    labelPos5++;
});
