var $info = $('<pre>');
$info.css({ position: 'fixed', top: 50, right: 100 });
$(document.body).append($info);
resetInfo();

function resetInfo() {
    $info.text('Hover over cells to see\nhow cloning and graph search works\non nested graphs.');
}

function me(id, x, y, w, h, fill) {
    return new joint.shapes.basic.Rect({
        id: id,
        name: id,
        position: { x: x, y: y },
        size: { width: w, height: h },
        attrs: {
            rect: { fill: fill || 'blue' },
            text: { text: id, fill: 'white', 'ref-x': 10, 'ref-y': 10, 'text-anchor': 'start' }
        }
    }).addTo(graph);
}

function ml(id, s, t, vertices) {
    return new joint.dia.Link({
        id: id,
        name: id,
        source: { id: s },
        target: { id: t },
        vertices: vertices,
        labels: [{ position: .5, attrs: { text: { text: id } } }],
        attrs: {
            '.marker-target': { d: 'M 6 0 L 0 3 L 6 6 z' }
        }
    }).addTo(graph);
}

// First example.

var graph = new joint.dia.Graph;
var paper = new joint.dia.Paper({ el: $('#paper'), width: 1000, height: 600, model: graph });

var a = me('a', 100, 30, 420, 200, 'lightblue');
var aa = me('aa', 130, 50, 160, 140, 'green');
a.embed(aa);
var aaa = me('aaa', 150, 120, 120, 40, 'gray');
aa.embed(aaa);
var c = me('c', 400, 50, 50, 50, 'orange');
a.embed(c);
var d = me('d', 620, 50, 50, 50, 'black');

var l1 = ml('l1', 'aa', 'c');
var l2 = ml('l2', 'aa', 'aaa', [{ x: 50, y: 110 }, { x: 50, y: 140 }]);
aa.embed(l2);
var l3 = ml('l3', 'c', 'd');
//var l4 = ml('l4', 'a', 'c');

paper.on('cell:mouseout', resetInfo);

paper.on('cell:mouseover', function(cellView) {
    var cell = cellView.model;
    var i = {};
    var keyCloneCells = 'graph.cloneCells([' + cell.id + '], { deep: true })';
    i[keyCloneCells] = _.map(graph.cloneCells([cell], { deep: true }), function(c) {
        return c.get('name');
    }).join(',');
    var keyCloneSubgraph = 'graph.cloneSubgraph([' + cell.id + '], { deep: true })';
    i[keyCloneSubgraph] = _.map(graph.cloneSubgraph([cell], { deep: true }), function(c) {
        return c.get('name');
    }).join(',');
    var keyClone = cell.id + '.clone({ deep: true })';
    i[keyClone] = _.map(cell.clone({ deep: true }), function(c) {
        return c.get('name');
    }).join(',');
    var keySubgraph = 'graph.getSubgraph([' + cell.id + '], { deep: true })';
    i[keySubgraph] = _.map(graph.getSubgraph([cell], { deep: true }), function(c) {
        return c.get('name');
    }).join(',');
    var keyGetConnectedLinks = 'graph.getConnectedLinks(' + cell.id + ', { deep: true })';
    i[keyGetConnectedLinks] = _.map(graph.getConnectedLinks(cell, { deep: true }), function(c) {
        return c.get('name');
    }).join(',');
    $info.text(JSON.stringify(i, '\t', 4));
    console.log(i);
});


