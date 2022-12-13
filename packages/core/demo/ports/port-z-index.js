var paper4 = createPaper();
paper4.options.validateMagnet = function() {
    return false;
};

$('<b/>').text('Left click on any port to increment, right click to decrement \'z\'').appendTo('body');

var g4 = new joint.shapes.basic.Rect({
    markup: '<g class="rotatable"><g class="scalable"><rect class="main"/></g><rect class="inner"/></g>',

    position: { x: 130, y: 30 },
    size: { width: 80, height: 150 },
    attrs: {
        '.main': {
            width: 80, height: 150,
            stroke: '#31d0c6', 'stroke-width': 2
        },
        '.inner': {
            width: 60, height: 130, 'ref-x': 10, 'ref-y': 10,
            stroke: '#31d0c6', 'stroke-width': 2, fill: '#7c68fc'
        }
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

addPort('auto');
addPort(0);
addPort(1);
addPort(2);
addPort(3);

paper4.model.addCell(g4);

paper4.on('cell:pointerclick cell:contextmenu', function(cellView, e) {

    if (cellView.model.isLink() || !cellView.model.hasPorts()) {
        return;
    }

    var portId = $(e.target).attr('port');

    if (portId) {
        var portIndex = cellView.model.getPortIndex(portId);
        var z = parseInt(cellView.model.prop('ports/items/' + portIndex + '/z'), 10) || 0;


        z = e.type === 'contextmenu' ? Math.max(0, --z) : ++z;
        cellView.model.prop('ports/items/' + portIndex + '/z', z);
        cellView.model.prop('ports/items/' + portIndex + '/attrs/text/text', 'z:' + z + '   ');
    }
});