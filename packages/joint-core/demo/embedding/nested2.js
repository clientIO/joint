var graph = new joint.dia.Graph({}, { cellNamespace: joint.shapes });
new joint.dia.Paper({
    el: document.getElementById('easel'),
    width: 600,
    height: 200,
    gridSize: 1,
    model: graph,
    cellViewNamespace: joint.shapes,
});
var parent = new joint.shapes.standard.Rectangle({
    position: { x: 100, y: 30 },
    size: { width: 100, height: 30 },
    attrs: {
        body: { fill: 'blue' },
        label: { text: 'parent', fill: 'white' }
    }
});
var child = new joint.shapes.standard.Rectangle({
    position: { x: 70, y: 130 },
    size: { width: 70, height: 30 },
    attrs: {
        body: { fill: 'lightgreen', rx: 5, ry: 5 },
        label: { text: 'child', fill: 'white' }
    }
});
var child2 = child.clone().translate(100);
var link = new joint.shapes.standard.Link({
    source: { id: parent.id },
    target: { id: child.id }
});
var link2 = new joint.shapes.standard.Link({
    source: { id: parent.id },
    target: { id: child2.id },
    vertices: [{ x: 210, y: 75 }, { x: 190, y: 105 }]
});
parent.embed(child);
parent.embed(child2);
graph.addCells([parent, child, child2, link, link2]);

const buttonEl = document.getElementById('button');
buttonEl.addEventListener('click', function(event) {
    switch (buttonEl.textContent.split(' ')[0]) {
        case 'embed':
            parent.embed(link);
            parent.embed(link2);
            buttonEl.textContent = 'unembed links';
            break;
        case 'unembed':
            parent.unembed(link);
            parent.unembed(link2);
            buttonEl.textContent = 'embed links';
    }

});
