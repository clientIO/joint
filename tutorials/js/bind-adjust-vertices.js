// adjust vertices when a cell is removed or its source/target was changed
graph.on('add remove change:source change:target', function(cell) {
    adjustVertices(graph, cell);
});

// also when an user stops interacting with an element.
paper.on('cell:pointerup', function(cell) {
    adjustVertices(graph, cell);
});
