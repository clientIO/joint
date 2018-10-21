var paper5 = window.createPaper();
$('<b/>').text('Click on Rectangle to see various label positions').appendTo('body');

var g5 = new joint.shapes.standard.Rectangle({
    position: { x: 130, y: 100 },
    size: { width: 450, height: 50 },
    ports: {
        groups: {
            a: {
                position: function(ports) {
                    return ports.map(function(_, index) {
                        return {
                            x: index * 100,
                            y: -20,
                            angle: index * 50 + 10,
                            attrs: { root: { x: '0.8em', y: '0.9em' }, /*rect: { x: -10, y: -10 }*/ }
                        };
                    });
                },
                attrs: {
                    rect: {
                        stroke: '#000000',
                        fill: '#ffffff',
                        width: 20,
                        height: 20
                    },
                    dot: {
                        fill: '#ff0000',
                        r: 3
                    },
                    text: {
                        fill: '#000000'
                    }
                },
                markup: [{
                    tagName: 'rect',
                    selector: 'rect'
                }, {
                    tagName: 'circle',
                    selector: 'dot'
                }]
            }
        }
    }
});

Array.from({ length: 5 }).forEach(function(_, index) {
    g5.addPort({ group: 'a', id: index + '', attrs: { text: { text: 'L' + (index + 1) }}});
});

paper5.model.addCell(g5);
var labelPos5 = 0;

paper5.on('element:pointerdown', function(cellView, e) {

    if (!cellView.model.hasPorts()) return;

    var positions = Object.keys(joint.layout.PortLabel);
    var pos = positions[(labelPos5) % positions.length];

    cellView.model.prop('attrs/label/text', pos);

    g5.prop('ports/groups/a/label/position', pos);
    labelPos5++;
});
