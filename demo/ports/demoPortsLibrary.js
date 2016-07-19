var graph = new joint.dia.Graph;

var paper = new joint.dia.Paper({
    el: document.getElementById('paper'),
    width: 800,
    height: 600,
    gridSize: 1,
    perpendicularLinks: true,
    model: graph,
    defaultLink: new joint.dia.Link({
        markup: [
            '<path class="connection" stroke="black" d="M 0 0 0 0"/>',
            '<path class="marker-source" fill="black" stroke="black" d="M 0 0 0 0"/>',
            '<path class="marker-target" fill="black" stroke="black" d="M 0 0 0 0"/>',
            '<path class="connection-wrap" d="M 0 0 0 0"/>',
            '<g class="marker-vertices"/>',
            '<g class="marker-arrowheads"/>'
        ].join(''),
        attrs: {
            '.marker-target': { fill: 'black', d: 'M 10 0 L 0 5 L 10 10 z' }
        }
    }),
    interactive: {
        vertexAdd: false
    }
});

var rect = new joint.shapes.ports.Atomic({
    position: { x: 60, y: 60 }
});
graph.addCell(rect);

rect.set('inPorts', ['lades', 'petr']);
rect.set('outPorts', ['roman']);
