// Helpers.
// --------

var $info = $('<pre>').css({
    position: 'fixed',
    top: 50,
    right: 100
});
$(document.body).append($info);

function pluck(array, attribute) {
    return array.map(function(item) { return item[attribute]; });
}

function clear() {
    $info.text('');
}

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
            graphSources: pluck(graph.getSources(), 'id'),
            graphSinks: pluck(graph.getSinks(), 'id'),
            inboundNeighbors: pluck(inboundNeighbors, 'id'),
            outboundNeighbors: pluck(outboundNeighbors, 'id'),
            'successors (DFS)': pluck(successors, 'id'),
            'successors (BFS)': pluck(successorsBreadthFirst, 'id'),
            'predecessors (DFS)': pluck(predecessors, 'id'),
            'predecessors (BFS)': pluck(predecessorsBreadthFirst, 'id'),
            deepSuccessors: pluck(deepSuccessors, 'id'),
            outboundLinks: pluck(outboundLinks, 'id'),
            inboundLinks: pluck(inboundLinks, 'id'),
            bfsDistance: bfsDistance
        };

        $info.text(JSON.stringify(i, '\t', 4));
    }
}


// make element
function me(g, id, x, y, s) {
    var e = new joint.shapes.standard.Circle({
        id: id,
        position: { x: x, y: y },
        size: { width: s || 50, height: s || 50 },
        attrs: {
            label: {
                text: id,
                fontWeight: 'bold'
            }
        }
    });
    e.addTo(g);
    return e;
}

// make link
function ml(g, id, a, b, v) {
    var l = new joint.shapes.standard.Link({
        id: id,
        source: (typeof a === 'string') ? { id: a } : a,
        target: (typeof b === 'string') ? { id: b } : b,
        labels: [{
            position: .5,
            attrs: {
                text: {
                    text: id,
                    fontWeight: 'bold'
                }}
        }],
        vertices: v
    });
    l.addTo(g);
    return l;
}

// Testing graph.
// --------------

var graph = new joint.dia.Graph;
var paper = new joint.dia.Paper({
    el: document.getElementById('paper'),
    width: 800,
    height: 600,
    model: graph,
    defaultConnectionPoint: { name: 'boundary' }
});

//var a, aa, aaa, b, c, d, e, f, g, h, t, l1, l2, l3, l4, l5, l6, l7, l8, l9, l10, l11, l12, l13, l14, l15, l16, l17;

me(graph, 't', 30, 5);
var a = me(graph, 'a', 50, 100, 140);
var aa = me(graph, 'aa', 85, 100, 60);
var aaa = me(graph, 'aaa', 110, 135, 23);
a.embed(aa);
aa.embed(aaa);
me(graph, 'b', 250, 250);
me(graph, 'c', 50, 280);
me(graph, 'd', 250, 100);
me(graph, 'e', 400, 200);
me(graph, 'f', 200, 400);
me(graph, 'g', 100, 400);
me(graph, 'h', 400, 400);
ml(graph, 'l1', 'a', 'b');
ml(graph, 'l2', 'a', 'c');
ml(graph, 'l3', 'a', 'd');
ml(graph, 'l4', 'd', 'e');
ml(graph, 'l5', 'e', 'b');
ml(graph, 'l6', 'e', 'a');
ml(graph, 'l7', 'f', { x: 300, y: 400 });
ml(graph, 'l8', { x: 20, y: 400 }, { x: 50, y: 500 });
ml(graph, 'l9', { x: 150, y: 500 }, { x: 400, y: 500 });
ml(graph, 'l10', 't', 'a');
ml(graph, 'l11', 't', 'aaa', [{ x: 200, y: 30 }]);
ml(graph, 'l12', 'aaa', 't', [{ x: 20, y: 100 }]);
var l13 = ml(graph, 'l13', 'aaa', 'aaa', [{ x: 170, y: 170 }, { x: 170, y: 150 }]);
aaa.embed(l13);

paper.on('cell:mouseover', info);
paper.on('cell:mouseout', clear);

// Tree Graph.
// -----------

var treeGraph = new joint.dia.Graph;
var treePaper = new joint.dia.Paper({
    el: document.getElementById('tree-paper'),
    width: 800,
    height: 600,
    model: treeGraph,
    defaultConnectionPoint: { name: 'boundary' }
});

treePaper.on('cell:mouseover', info);
treePaper.on('cell:mouseout', clear);

me(treeGraph, 'a', 30, 300, 40);
me(treeGraph, 'b', 120, 100, 40);
me(treeGraph, 'c', 120, 300, 40);
me(treeGraph, 'd', 120, 500, 40);
me(treeGraph, 'e', 220, 50, 40);
me(treeGraph, 'f', 220, 100, 40);
me(treeGraph, 'g', 220, 150, 40);
me(treeGraph, 'h', 220, 250, 40);
me(treeGraph, 'i', 220, 300, 40);
me(treeGraph, 'j', 220, 350, 40);
me(treeGraph, 'k', 220, 450, 40);
me(treeGraph, 'l', 220, 500, 40);
me(treeGraph, 'm', 220, 550, 40);
me(treeGraph, 'n', 320, 50, 40);
me(treeGraph, 'o', 320, 100, 40);
me(treeGraph, 'p', 320, 150, 40);
ml(treeGraph, 'l1', 'a', 'b');
ml(treeGraph, 'l2', 'a', 'c');
ml(treeGraph, 'l3', 'a', 'd');
ml(treeGraph, 'l4', 'b', 'e');
ml(treeGraph, 'l5', 'b', 'f');
ml(treeGraph, 'l6', 'b', 'g');
ml(treeGraph, 'l7', 'c', 'h');
ml(treeGraph, 'l8', 'c', 'i');
ml(treeGraph, 'l9', 'c', 'j');
ml(treeGraph, 'l10', 'd', 'k');
ml(treeGraph, 'l11', 'd', 'l');
ml(treeGraph, 'l12', 'd', 'm');
ml(treeGraph, 'l13', 'e', 'n');
ml(treeGraph, 'l14', 'f', 'o');
ml(treeGraph, 'l15', 'g', 'p');
ml(treeGraph, 'l16', 'h', 'b');
ml(treeGraph, 'l17', 'b', 'c');



// Cloning.
// --------

// var successors = treeGraph.getSuccessors(d);
// var clones = treeGraph.cloneCells([d].concat(successors));
// treeGraph.addCells(clones);
// var successors = graph.getSuccessors(graph.getCell('a'));
// var clones = graph.cloneCells([graph.getCell('a')].concat(successors), { deep: true });
// var clones = graph.cloneCells([graph.getCell('a')], { deep: true });
// graph.addCells(joint.util.toArray(clones));

