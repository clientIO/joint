var graph = new joint.dia.Graph;

var paper = new joint.dia.Paper({

    el: $('#paper'),
    width: 800,
    height: 600,
    gridSize: 10,
    model: graph
});

var r1 = new joint.shapes.basic.Rect({
    position: { x: 20, y: 20 },
    size: { width: 700, height: 300 },
    attrs: {
        rect: { fill: 'orange' },
        text: { text: 'Box' }
    }
}).addTo(graph);

var r11 = r1.clone();
r11.resize(300, 150).attr({ rect: { fill: 'yellow' } }).translate(10, 10).addTo(graph);

var r12 = r11.clone();
r12.resize(200, 150).attr({ rect: { fill: 'yellow' } }).translate(400).addTo(graph);

var l1 = new joint.dia.Link({
    source: { id: r11.id },
    target: { id: r12.id },
    attrs: {
        '.marker-target': {
            d: 'M 10 0 L 0 5 L 10 10 z'
        }
    }
}).addTo(graph);

var l2 = new joint.dia.Link({
    source: { x: 100, y: 100 },
    target: { x: 200, y: 200 },
    attrs: {
        '.marker-target': {
            d: 'M 10 0 L 0 5 L 10 10 z'
        }
    }
}).addTo(graph);

r1.embed(r11);
r1.embed(r12);
r1.embed(l1);
r1.embed(l2);

var r1clones = r1.clone({ deep: true })

_.each(r1clones, function(clone) { graph.addCell(clone); });

