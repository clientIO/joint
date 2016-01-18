var graph = new joint.dia.Graph;
var paper = new joint.dia.Paper({
    el: $('#paper'),
    width: 650,
    height: 400,
    gridSize: 1,
    model: graph
});

var creatingLine = false;
var lineCoords = {};
var tempLine;

paper.on('blank:pointerdown', function(evt, x, y) {
    
    var d = 'M ' + x + ' ' + y + ' L ' + x + ' ' + y;
    tempLine = V('path', { stroke: 'black', 'stroke-width': 1, d: d });
    V(paper.viewport).append(tempLine);

    creatingLine = true;
    lineCoords.x1 = x;
    lineCoords.y1 = y;

});

$(document.body).on('mousemove', function(evt) {

    if (creatingLine) {

	evt.preventDefault();
	evt.stopPropagation();
	evt = joint.util.normalizeEvent(evt);

	var clientCoords = paper.snapToGrid({ x: evt.clientX, y: evt.clientY });
	lineCoords.x2 = clientCoords.x;
	lineCoords.y2 = clientCoords.y;
	
	var d = 'M ' + lineCoords.x1 + ' ' + lineCoords.y1 + ' L ' + lineCoords.x2 + ' ' + lineCoords.y2;
	tempLine.attr('d', d);
    }
});

$(document.body).on('mouseup', function(evt) {

    if (creatingLine) {

	var position = { x: Math.min(lineCoords.x1, lineCoords.x2), y: Math.min(lineCoords.y1, lineCoords.y2) };
	var size = { width: Math.abs(lineCoords.x2 - lineCoords.x1), height: Math.abs(lineCoords.y2 - lineCoords.y1) };

	var line = new joint.shapes.basic.Path({
	    size: size,
	    position: position,
	    attrs: {
		path: {
		    d: 'M ' + (lineCoords.x1 - position.x) + ' ' + (lineCoords.y1 - position.y) + ' L ' + (lineCoords.x2 - position.x) + ' ' + (lineCoords.y2 - position.y),
		    'stroke-width': 5,
		    stroke: 'black',
		    fill: '#00ADF2'
		},
		text: { display: 'none' }
	    }
	});
	
	graph.addCell(line);
	tempLine.remove();

	creatingLine = false;
    }
});
