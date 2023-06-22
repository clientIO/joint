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
    position: { x: 75, y: 36 },
    size: { width: 250, height: 300 },
    z: 2,
    attrs: {
        body: { fill: '#E74C3C' }
    }
});
var r2 = new joint.shapes.standard.Rectangle({
    position: { x: 198, y: 49 },
    size: { width: 100, height: 100 },
    z: 10,
    attrs: {
        body: { fill: '#F1C40F' }
    }
});
var r3 = new joint.shapes.standard.Rectangle({
    position: { x: 278, y: 100 },
    size: { width: 100, height: 90 },
    z: 1,
    attrs: {
        body: { fill: '#46acd9' }
    }
});
var r4 = new joint.shapes.standard.Rectangle({
    position: { x: 34, y: 264 },
    size: { width: 100, height: 100 },
    z: 5,
    attrs: {
        body: { fill: '#7ac949' },
    }
});
var r5 = new joint.shapes.standard.Rectangle({
    position: { x: 112, y: 65 },
    size: { width: 100, height: 60 },
    z: 8,
    attrs: {
        body: { fill: '#bf7feb' },
    }
});

const updateLabels = () => {
    [r1, r2, r3, r4, r5].forEach((element) => {
        element.attr('label/text', 'Z = ' + element.get('z'));
    });
};

r1.embed(r2);
r1.embed(r3);
r2.embed(r5);
graph.addCells([r1, r2, r3, r4, r5]);

updateLabels();

const foregroundEmbeds = document.getElementById('foregroundEmbeds');

document.getElementById('toFrontButton').addEventListener('click', () => {
    r1.toFront({ deep: true, foregroundEmbeds: foregroundEmbeds.checked });
    updateLabels();
});


document.getElementById('toBackButton').addEventListener('click', () => {
    r1.toBack({ deep: true, foregroundEmbeds: foregroundEmbeds.checked });
    updateLabels();
});
