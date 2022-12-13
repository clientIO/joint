var graph = new joint.dia.Graph;
var paper = new joint.dia.Paper({
    el: document.getElementById('paper'),
    width: 650,
    height: 400,
    gridSize: 1,
    model: graph
});

paper.on('blank:pointerdown', function(evt, x, y) {

    var d = 'M ' + x + ' ' + y + ' L ' + x + ' ' + y;
    var tempLine = V('path', {
        'stroke': 'black',
        'stroke-width': 5,
        'd': d
    });

    tempLine.appendTo(paper.viewport);
    evt.data = {
        lineCoords: {
            x1: x,
            y1: y
        },
        tempLine: tempLine
    };
});

paper.on('blank:pointermove', function(evt, x, y) {

    var lineCoords = evt.data.lineCoords;
    lineCoords.x2 = x;
    lineCoords.y2 = y;
    var d = 'M ' + lineCoords.x1 + ' ' + lineCoords.y1 + ' L ' + x + ' ' + y;
    evt.data.tempLine.attr('d', d);
});

paper.on('blank:pointerup', function(evt) {

    var lineCoords = evt.data.lineCoords;

    var position = {
        x: Math.min(lineCoords.x1, lineCoords.x2),
        y: Math.min(lineCoords.y1, lineCoords.y2)
    };
    var size = {
        width: Math.abs(lineCoords.x2 - lineCoords.x1),
        height: Math.abs(lineCoords.y2 - lineCoords.y1)
    };

    var d = 'M ' + (lineCoords.x1 - position.x) + ' ' + (lineCoords.y1 - position.y) + ' L ' + (lineCoords.x2 - position.x) + ' ' + (lineCoords.y2 - position.y);
    var line = new joint.shapes.standard.Path({
        size: size,
        position: position,
        attrs: {
            body: {
                refD: d,
                strokeWidth: 5,
                stroke: 'black',
                fill: '#00ADF2'
            }
        }
    });

    graph.addCell(line);
    evt.data.tempLine.remove();
});
