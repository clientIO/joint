var namespace = joint.shapes;

var graph = new joint.dia.Graph({}, { cellNamespace: namespace });

new joint.dia.Paper({
    el: document.getElementById('paper'),
    model: graph,
    width: 400,
    height: 400,
    gridSize: 1,
    cellViewNamespace: namespace
});


var r1 = new joint.shapes.standard.Rectangle({
    position: { x: 40, y: 40 },
    size: { width: 250, height: 300 },
    attrs: {
        body: { fill: '#E74C3C' }
    }
});
var r2 = new joint.shapes.standard.Rectangle({
    position: { x: 60, y: 50 },
    size: { width: 100, height: 100 },
    z: 10,
    attrs: {
        body: { fill: '#F1C40F' }
    }
});
var r3 = new joint.shapes.standard.Rectangle({
    position: { x: 140, y: 80 },
    size: { width: 100, height: 90 },
    z: 5,
    attrs: {
        body: { fill: '#46acd9' }
    }
});
var r4 = new joint.shapes.standard.Rectangle({
    position: { x: 260, y: 210 },
    size: { width: 100, height: 100 },
    z: 5,
    attrs: {
        body: { fill: '#7ac949' },
    }
});

const updateLabels = () => {
    [r1, r2, r3, r4].forEach((element) => {
        element.attr('label/text', 'Z = ' + element.get('z'));
    });
};

r1.embed(r2);
r1.embed(r3);
graph.addCells([r1, r2, r3, r4]);

updateLabels();

document.getElementById('toFrontButton').addEventListener('click', () => {
    r1.toFront({ deep: true });
    updateLabels();
});


document.getElementById('toBackButton').addEventListener('click', () => {
    r1.toBack({ deep: true });
    updateLabels();
});
