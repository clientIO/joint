var paper4 = createPaper();
paper4.options.validateMagnet = function() {
    return false;
};

$('<b/>').text('Click on any port to increment it\'s \'z\'').appendTo('body');

var g4 = new joint.shapes.basic.Rect({
    position: { x: 130, y: 30 },
    size: { width: 80, height: 150 },
    attrs: {
        rect: { stroke: '#31d0c6', 'stroke-width': 2 },
        text: { text: 'RECT', 'font-size': 30, stroke: '#c6c7e2', 'stroke-width': 1 }
    }
});

var portIndex = 0;
var addPort = function(z) {
    var color = '#' + Number(0xe00eee + (portIndex++ * 1000)).toString(16);

    g4.addPort({
        z: z,
        id: portIndex + '',
        attrs: {
            circle: {
                r: 20,
                magnet: false,
                fill: color,
                stroke: '#31d0c6',
                'stroke-width': 2
            },
            text: { text: ' z:' + z + '   ', fill: '#6a6c8a' }
        }
    });
};

addPort(0);
addPort(0);
addPort(0);
addPort(6);
addPort(8);
addPort(10);

paper4.model.addCell(g4);

paper4.on('cell:pointerclick', function(cellView, e) {

    if (!cellView.model.hasPorts()) {
        return;
    }

    var portId = $(e.target).attr('port');

    if (portId) {
        var portIndex = cellView.model.getPortIndex(portId);
        var z = parseInt(cellView.model.prop('ports/items/' + portIndex + '/z'), 10) || 0;

        cellView.model.prop('ports/items/' + portIndex + '/z', ++z);
        cellView.model.prop('ports/items/' + portIndex + '/attrs/text/text', 'z:' + z + '   ');
    }
});