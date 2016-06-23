$('<h2/>').text('Z index').appendTo('body');
var paper4 = createPaper();
paper4.options.validateMagnet = function() {
	return false;
}
$('<b/>').text('Click on Rectangle to increment z-index of massive port').appendTo('body');

var g4 = new joint.shapes.basic.Rect({
    position: { x: 130, y: 30 },
    size: { width: 100, height: 150 }
});

_.times(10, function(index) {
    g4.addPort({ id: index + '', attrs: { circle: { r: 15, magnet: false, stroke: '#ffffff' } } });
});

g4.addPort({
    z: 2,
    // position args
    args: {
        y: 70,
        x: 20,
        angle: 0
    },
    label: {
        position: {
            name: 'right',
            args: {
                x: 10,
                y: 70,
                angle: 30
            }
        }
    },
    attrs: {
        ellipse: {
            fill: '#ff0000',
            stroke: '#000000',
            magnet: false,
            ry: 70,
            rx: 30
        },
        text: { text: 'massive port - z-index:2', fill: 'red' }
    },
    markup: '<ellipse/>'
});

paper4.model.addCell(g4);

paper4.on('element:pointerclick', function(cellView) {

    if (!cellView.model.hasPorts()) {
        return;
    }

    var portIndex = 10;
    var z = parseInt(cellView.model.prop('ports/items/' + portIndex + '/z'), 10) || 0;

    if (z > 11) {
        z = 0;
    }

    cellView.model.prop('ports/items/' + portIndex + '/z', ++z);
    cellView.model.prop('ports/items/' + portIndex + '/attrs/text/text', 'massive port - z-index:' + z);
});