var graph = new joint.dia.Graph;

var paper = new joint.dia.Paper({
    el: $('#paper'),
    width: 640,
    height: 500,
    gridSize: 20,
    model: graph,
    // interactive: false,
    defaultLink: new joint.dia.Link({
        markup: [
            '<path class="connection" stroke="#888888" d="M 0 0 0 0"/>',
            '<path class="marker-target" fill="#888888" stroke="#888888" d="M 10 0 L 0 5 L 10 10 z"/>'
        ].join('')
    })
});

var xx = 200;
var rect = new joint.shapes.basic.Rect({

    position: { x: 0, y: 0 }, size: { width: xx, height: xx },
    attrs: {
        // circle: { fill: '#61549C', stroke: '#61549C', r: xx / 2, cx: xx / 2, y: xx / 2 },
        rect: { fill: '#61549C', stroke: '#61549C' },
        text: { text: "" }
    }
});

graph.addCell(rect);

var log = function(text) {
    $('.log').prepend($('<div/>').text(text));
};

paper.on('cell:pointerdown', function(cellview, ev) {
    log('cell:pointerdown:' + ev.type);
});

paper.on('cell:pointermove', function(cellView, ev) {
    console.log('move', ev.originalEvent);
    log('cell:pointermove:' + ev.type);
});

paper.on('blank:gesture-stretch', function(ev, delta) {
    log('stretch: delta' + delta);
});

paper.on('blank:gesture-pinch', function(ev, delta) {
    log('pinch: delta' + delta);
});

paper.on('cell:pointerup', function(cellview, ev) {
    log('cell:pointerup:' + ev.type);
});

