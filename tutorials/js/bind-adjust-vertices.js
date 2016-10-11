var myAdjustVertices = _.partial(adjustVertices, graph);

// adjust vertices when a cell is removed or its source/target was changed
graph.on('add remove change:source change:target', myAdjustVertices);

// also when an user stops interacting with an element.
paper.on('cell:pointerup', myAdjustVertices);
