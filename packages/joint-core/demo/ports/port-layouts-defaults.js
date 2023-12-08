// I.
var graph1 = createPaper().model;

var h2 = document.createElement('h2');
h2.textContent = 'Default settings';
document.body.appendChild(h2);

var button1 = document.createElement('button');
button1.textContent = 'add port';
document.body.appendChild(button1);
button1.addEventListener('click', function() {
    g1.addPort({ attrs: { circle: { magnet: true, stroke: '#31d0c6', 'stroke-width': 2, fill: '#ffffff' }}});
});

var button2 = document.createElement('button');
button2.textContent = 'remove port';
document.body.appendChild(button2);
button2.addEventListener('click', function() {
    g1.removePort(g1.getPorts()[0]);
});

var g1 = new joint.shapes.basic.Rect({
    position: { x: 130, y: 30 },
    size: { width: 100, height: 150 },
    attrs: {
        rect: { stroke: '#31d0c6', 'stroke-width': 2 }
    }
});
graph1.addCell(g1);
g1.addPort({ attrs: { circle: { magnet: true, stroke: '#31d0c6', 'stroke-width': 2, fill: '#ffffff' }}});
g1.addPort({ attrs: { circle: { magnet: true, stroke: '#31d0c6', 'stroke-width': 2, fill: '#ffffff' }}});
g1.addPort({ attrs: { circle: { magnet: true, stroke: '#31d0c6', 'stroke-width': 2, fill: '#ffffff' }}});
new joint.shapes.basic.Circle({
    position: { x: 20, y: 150 },
    id: 'target',
    attrs: {
        circle: { cx: 8, cy: 8, r: 8 },
        text: { text: 'test' }
    }
}).addTo(graph1);

new joint.dia.Link({ source: { id: 'target' }, target: { id: g1.id, port: g1.getPorts()[0].id }}).addTo(graph1);
new joint.dia.Link({ source: { id: 'target' }, target: { id: g1.id, port: g1.getPorts()[1].id }}).addTo(graph1);
new joint.dia.Link({ source: { id: 'target' }, target: { id: g1.id, port: g1.getPorts()[2].id }}).addTo(graph1);
