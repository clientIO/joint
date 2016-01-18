// Helpers.
// --------

var $info = $('<pre>');
$info.css({
    position: 'fixed',
    top: 50,
    right: 100
});
$(document.body).append($info);

function info(view) {

    var cell = view.model;
    var graph = view.paper.model;

    if (!cell.isLink()) {
        
        var inboundNeighbors = graph.getNeighbors(cell, { inbound: true });
        var outboundNeighbors = graph.getNeighbors(cell, { outbound: true });
        var successors = graph.getSuccessors(cell);
        var predecessors = graph.getPredecessors(cell);
        var predecessorsBreadthFirst = graph.getPredecessors(cell, { breadthFirst: true });
        var deepSuccessors = graph.getSuccessors(cell, { deep: true });
        var successorsBreadthFirst = graph.getSuccessors(cell, { breadthFirst: true });
        var outboundLinks = graph.getConnectedLinks(cell, { outbound: true });
        var inboundLinks = graph.getConnectedLinks(cell, { inbound: true });
        var bfsDistance = {};
        graph.bfs(cell, function(element, distance) { bfsDistance[element.id] = distance; }, { outbound: true });

        var i = {
            id: cell.id,
            graphSources: _.pluck(graph.getSources(), 'id'),
            graphSinks: _.pluck(graph.getSinks(), 'id'),
            inboundNeighbors: _.pluck(inboundNeighbors, 'id'),
            outboundNeighbors: _.pluck(outboundNeighbors, 'id'),
            'successors (DFS)': _.pluck(successors, 'id'),
            'successors (BFS)': _.pluck(successorsBreadthFirst, 'id'),
            'predecessors (DFS)': _.pluck(predecessors, 'id'),
            'predecessors (BFS)': _.pluck(predecessorsBreadthFirst, 'id'),
            deepSuccessors: _.pluck(deepSuccessors, 'id'),
            outboundLinks: _.pluck(outboundLinks, 'id'),
            inboundLinks: _.pluck(inboundLinks, 'id'),
            bfsDistance: bfsDistance
        };
        console.log(i);
        $info.text(JSON.stringify(i, '\t', 4));
    }
}

function clear() {
    $info.text('');
}

// make element
function me(g, id, x, y, s) {
    var e = new joint.shapes.basic.Circle({
        id: id,
        position: { x: x, y: y },
        size: { width: s || 50, height: s || 50 },
        attrs: { text: { text: id } }
    }).addTo(g);
    return e;
}

// make link
function ml(g, id, a, b, v) {
    var source = a.x ? a : { id: a.id };
    var target = b.x ? b : { id: b.id };
    var l = new joint.dia.Link({
        id: id,
        source: source,
        target: target,
        labels: [ { position: .5, attrs: { text: { text: id } } } ],
        attrs: {
            '.marker-target': { d: 'M 6 0 L 0 3 L 6 6 z' }
        },
        vertices: v
    }).addTo(g);
    return l;
}

// Testing graph.
// --------------

var graph = new joint.dia.Graph;
var paper = new joint.dia.Paper({ el: $('#paper'), width: 800, height: 600, model: graph, linkConnectionPoint: joint.util.shapePerimeterConnectionPoint });

var t = me(graph, 't', 30, 5);
var a = me(graph, 'a', 50, 100, 140);
var aa = me(graph, 'aa', 85, 100, 60);
a.embed(aa);
var aaa = me(graph, 'aaa', 110, 135, 23);
aa.embed(aaa);
var b = me(graph, 'b', 250, 250);
var c = me(graph, 'c', 50, 280);
var d = me(graph, 'd', 250, 100);
var e = me(graph, 'e', 400, 200);
var f = me(graph, 'f', 200, 400);
var g = me(graph, 'g', 100, 400);
var h = me(graph, 'h', 400, 400);

var l1 = ml(graph, 'l1', a, b);
var l2 = ml(graph, 'l2', a, c);
var l3 = ml(graph, 'l3', a, d);
var l4 = ml(graph, 'l4', d, e);
var l5 = ml(graph, 'l5', e, b);
var l6 = ml(graph, 'l6', e, a);
var l7 = ml(graph, 'l7', f, { x: 300, y: 400 });
var l8 = ml(graph, 'l8', { x: 20, y: 400 }, g);
var l9 = ml(graph, 'l9', { x: 150, y: 500 }, { x: 400, y: 500 });
var l10 = ml(graph, 'l10', t, a);
var l11 = ml(graph, 'l11', t, aaa, [{ x: 200, y: 30 }]);
var l12 = ml(graph, 'l12', aaa, t, [{ x: 20, y: 100 }]);
var l13 = ml(graph, 'l13', aaa, aaa, [{ x: 170, y: 170 }, { x: 170, y: 150 }]);
aaa.embed(l13);

paper.on('cell:mouseover', info);
paper.on('cell:mouseout', clear);

// Tree Graph.
// -----------

var treeGraph = new joint.dia.Graph;
var treePaper = new joint.dia.Paper({ el: $('#tree-paper'), width: 800, height: 600, model: treeGraph, linkConnectionPoint: joint.util.shapePerimeterConnectionPoint });

treePaper.on('cell:mouseover', info);
treePaper.on('cell:mouseout', clear);

var a = me(treeGraph, 'a', 30, 300, 40);
var b = me(treeGraph, 'b', 120, 100, 40);
var c = me(treeGraph, 'c', 120, 300, 40);
var d = me(treeGraph, 'd', 120, 500, 40);

var e = me(treeGraph, 'e', 220, 50, 40);
var f = me(treeGraph, 'f', 220, 100, 40);
var g = me(treeGraph, 'g', 220, 150, 40);

var h = me(treeGraph, 'h', 220, 250, 40);
var i = me(treeGraph, 'i', 220, 300, 40);
var j = me(treeGraph, 'j', 220, 350, 40);

var k = me(treeGraph, 'k', 220, 450, 40);
var l = me(treeGraph, 'l', 220, 500, 40);
var m = me(treeGraph, 'm', 220, 550, 40);

var n = me(treeGraph, 'n', 320, 50, 40);
var o = me(treeGraph, 'o', 320, 100, 40);
var p = me(treeGraph, 'p', 320, 150, 40);

var l1 = ml(treeGraph, 'l1', a, b);
var l2 = ml(treeGraph, 'l2', a, c);
var l3 = ml(treeGraph, 'l3', a, d);

var l4 = ml(treeGraph, 'l4', b, e);
var l5 = ml(treeGraph, 'l5', b, f);
var l6 = ml(treeGraph, 'l6', b, g);

var l7 = ml(treeGraph, 'l7', c, h);
var l8 = ml(treeGraph, 'l8', c, i);
var l9 = ml(treeGraph, 'l9', c, j);

var l10 = ml(treeGraph, 'l10', d, k);
var l11 = ml(treeGraph, 'l11', d, l);
var l12 = ml(treeGraph, 'l12', d, m);

var l13 = ml(treeGraph, 'l13', e, n);
var l14 = ml(treeGraph, 'l14', f, o);
var l15 = ml(treeGraph, 'l15', g, p);

var l16 = ml(treeGraph, 'l16', h, b);
var l17 = ml(treeGraph, 'l17', b, c);



// Cloning.
// --------
/*
var successors = treeGraph.getSuccessors(d);
var clones = treeGraph.cloneCells([d].concat(successors));
treeGraph.addCells(clones);
*/

var successors = graph.getSuccessors(graph.getCell('a'));
//var clones = graph.cloneCells([graph.getCell('a')].concat(successors), { deep: true });
var clones = graph.cloneCells([graph.getCell('a')], { deep: true });
graph.addCells(clones);

