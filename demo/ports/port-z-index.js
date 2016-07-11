var paper4 = createPaper();
paper4.options.validateMagnet = function() {
    return false;
};

$('<b/>').text('Click on Rectangle to increment z-index of massive port').appendTo('body');

var g4 = new joint.shapes.basic.Rect({
    position: { x: 130, y: 30 },
    size: { width: 100, height: 150 },
    attrs: { rect: { stroke: '#31d0c6', 'stroke-width': 2 } }
});

_.times(7, function(index) {
    g4.addPort({
        z: index + 2,
        id: index + '', attrs: {
            circle: { r: 15, magnet: false, fill: '#ffffff', stroke: '#31d0c6', 'stroke-width': 2 },
            text: { text: index + ' z:' +(index+2) + '', fill: '#6a6c8a' }
        }
    });
});

g4.addPort({
    z: 5,
    attrs: {
        circle: { r: 15, magnet: false, fill: '#ff0ff0', stroke: '#31d0c6', 'stroke-width': 2 },
        text: { text:  ' z:' +(5) + '', fill: '#6a6c8a' }
    }
});
g4.addPort({
    z: 5,
    attrs: {
        circle: { r: 15, magnet: false, fill: '#ff0ff0', stroke: '#31d0c6', 'stroke-width': 2 },
        text: { text:  ' z:' +(5) + '', fill: '#6a6c8a' }
    }
});

g4.addPort({
    z: 9,
    attrs: {
        circle: { r: 15, magnet: false, fill: '#ff0f00', stroke: '#31d0c6', 'stroke-width': 2 },
        text: { text:  ' z:' +(9) + '', fill: '#6a6c8a' }
    }
});

paper4.model.addCell(g4);

paper4.on('cell:pointerclick', function(cellView, e) {

    if (!cellView.model.hasPorts()) {
        return;
    }

    var portId = $(e.target).attr('port');

    if (portId) {
        var portIndex = cellView.model.getPortIndex(portId);
        var z = parseInt(cellView.model.prop('ports/items/' + portIndex + '/z'), 10) || 0;

        console.log(z);

        cellView.model.prop('ports/items/' + portIndex + '/z', ++z);
        cellView.model.prop('ports/items/' + portIndex + '/attrs/text/text', z);
    }

    // cellView.model.prop('ports/items/' + portIndex + '/z', ++z);
    // cellView.model.prop('ports/items/' + portIndex + '/attrs/text/text', 'massive port - z-index:' + z);
});