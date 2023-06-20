var $info = $('<pre>').css({ position: 'fixed', top: 50, right: 100 }).appendTo(document.body);
resetInfo();

function resetInfo() {
    $info.text('Hover over cells to see\nhow cloning and graph search works\non nested graphs.');
}

function me(id, x, y, w, h, fill) {
    return new joint.shapes.standard.Rectangle({
        id: id,
        name: id,
        position: { x: x, y: y },
        size: { width: w, height: h },
        attrs: {
            body: {
                fill: fill || 'blue'
            },
            label: {
                text: id,
                fill: 'white',
                refX: 10,
                refY: 10,
                textAnchor: 'start'
            }
        }
    }).addTo(graph);
}

function ml(id, s, t, vertices) {
    return new joint.shapes.standard.Link({
        id: id,
        name: id,
        source: { id: s },
        target: { id: t },
        vertices: vertices,
        labels: [{
            position: .5,
            attrs: { text: { text: id }}
        }]
    }).addTo(graph);
}

// First example.

var graph = new joint.dia.Graph;
var paper = new joint.dia.Paper({
    el: document.getElementById('paper'),
    width: 1000,
    height: 600,
    model: graph
});

var a = me('a', 100, 30, 420, 200, 'lightblue');
var aa = me('aa', 130, 50, 160, 140, 'green');
var aaa = me('aaa', 150, 120, 120, 40, 'gray');
a.embed(aa);
aa.embed(aaa);
a.embed(me('c', 400, 50, 50, 50, 'orange'));
me('d', 620, 50, 50, 50, 'black');
ml('l1', 'aa', 'c');
aa.embed(ml('l2', 'aa', 'aaa', [{ x: 50, y: 110 }, { x: 50, y: 140 }]));
ml('l3', 'c', 'd');

paper.on('cell:mouseleave', resetInfo);

paper.on('cell:mouseenter', function(cellView) {
    var cell = cellView.model;
    var i = {};
    var keyCloneCells = 'graph.cloneCells([' + cell.id + '], { deep: true })';
    i[keyCloneCells] = joint.util.toArray(graph.cloneCells([cell], { deep: true })).map(function(c) {
        return c.get('name');
    }).join(',');
    var keyCloneSubgraph = 'graph.cloneSubgraph([' + cell.id + '], { deep: true })';
    i[keyCloneSubgraph] = joint.util.toArray(graph.cloneSubgraph([cell], { deep: true })).map(function(c) {
        return c.get('name');
    }).join(',');
    var keyClone = cell.id + '.clone({ deep: true })';
    i[keyClone] = joint.util.toArray(cell.clone({ deep: true })).map(function(c) {
        return c.get('name');
    }).join(',');
    var keySubgraph = 'graph.getSubgraph([' + cell.id + '], { deep: true })';
    i[keySubgraph] = joint.util.toArray(graph.getSubgraph([cell], { deep: true })).map(function(c) {
        return c.get('name');
    }).join(',');
    var keyGetConnectedLinks = 'graph.getConnectedLinks(' + cell.id + ', { deep: true })';
    i[keyGetConnectedLinks] = joint.util.toArray(graph.getConnectedLinks(cell, { deep: true })).map(function(c) {
        return c.get('name');
    }).join(',');
    $info.text(JSON.stringify(i, '\t', 4));
    console.log(i);
});


