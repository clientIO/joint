var graph = new joint.dia.Graph;
var paper = new joint.dia.Paper({
    el: document.getElementById('paper'),
    model: graph,
    width: '100%',
    height: '100%',
    interactive: false
});

var shape1 = new joint.shapes.standard.Rectangle({
    position: { x: 100, y: 100 },
    size: { width: 100, height: 100 },
    attrs: { label: { text: 'Shape 1' }}
});

var shape2 = new joint.shapes.standard.Rectangle({
    position: { x: 300, y: 200 },
    size: { width: 100, height: 100 },
    attrs: { label: { text: 'Shape 2' }}
});

var link = new joint.shapes.standard.Link({
    source: { id: shape1.id },
    target: { id: shape2.id },
    vertices: [{ x: 210, y: 150 }]
});

graph.addCells([shape1, shape2, link]);

function scaleContentToFit() {
    paper.scaleContentToFit({ padding: 50 });
}

window.addEventListener('resize', joint.util.debounce(scaleContentToFit), false);
scaleContentToFit();
