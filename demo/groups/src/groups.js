var graph = new joint.dia.Graph();

var paper = new joint.dia.Paper({
    el: document.getElementById('paper'),
    width: 695,
    height: 600,
    gridSize: 1,
    model: graph,
    linkPinning: false
});

var el1 = new joint.shapes.basic.Rect({
    position: { x: 100, y: 100 },
    size: { width: 100, height: 100 }
});

var el2 = new joint.shapes.basic.Rect({
    position: { x: 250, y: 100 },
    size: { width: 100, height: 100 }
});

graph.addCells([el1, el2]);

var group = new joint.dia.Group({
    cells: [el1, el2]
});

//group.graph = graph;
