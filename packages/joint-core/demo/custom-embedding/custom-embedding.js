var Child = joint.shapes.standard.Rectangle.define('standard.Child', {
    attrs: {
        body: { stroke: 'transparent', fill: 'green', rx: 5, ry: 5 },
        label: { fontSize: 14, text: 'Child\n(default embedding logic)', fill: 'white' }
    }
});

var Parent = joint.shapes.standard.Rectangle.define('standard.Parent', {
    customEmbedding: true,
    attrs: {
        body: { stroke: 'transparent', fill: 'black', rx: 5, ry: 5 },
        label: { fontSize: 14, text: 'Parent\n(custom embedding logic)', fill: 'white' }
    }
});

var graph = new joint.dia.Graph;

var EMBEDDING_OFFSET = 59;
new joint.dia.Paper({
    el: document.getElementById('paper'),
    model: graph,
    width: 1000,
    height: 1000,
    gridSize: 20,
    drawGrid: 'mesh',
    embeddingMode: true,
    findParentBy: (draggedElement) => {
        const draggedBBox = draggedElement.getBBox();
        const elements = graph.getElements().filter((el) => {
            let elBBox;
            if (el.get('customEmbedding')) {
                // In case of custom embedding, we need to inflate the element's bounding box
                // that includes the element's children.
                elBBox = el.getBBox({ deep: true });
                elBBox.inflate(EMBEDDING_OFFSET);
            } else {
                elBBox = el.getBBox();
            }
            return joint.g.intersection.exists(draggedBBox, elBBox);
        });
        // Sort elements by the number of ancestors. The element with the least number of ancestors
        // comes first.
        return joint.util.sortBy(elements, (el) => (-el.getAncestors().length));
    }
});

// Call to action
new Child({
    attrs: {
        body: { fill: 'red' },
        label: { text: 'Element #1\n–\nTry to move me\nwithin 2 squares around\na "Parent" element\nor an embedded child' }
    }
}).position(20, 20).size(160, 100).addTo(graph);

new Child({
    attrs: {
        body: { fill: 'green' },
        label: { text: 'Element #2\n–\nTry to move me\nwithin 2 squares around\na "Parent" element\nor an embedded child' }
    }
}).position(20, 120).size(160, 100).addTo(graph);

new Child({
    attrs: {
        body: { fill: 'blue' },
        label: { text: 'Element #3\n–\nTry to move me\nwithin 2 squares around\na "Parent" element\nor an embedded child' }
    }
}).position(20, 220).size(160, 100).addTo(graph);

new Parent({
    attrs: {
        label: { text: 'Parent #1\n(custom embedding logic)' }
    }
}).position(240, 400).size(160, 100).addTo(graph);

// Result demonstration
var r = new Child({
    attrs: {
        body: { fill: 'red' },
        label: { text: 'Child #1\nEmbedded to Parent #2\n(despite no overlap)' }
    }
}).position(620, 60).size(160, 100).addTo(graph);

var g = new Child({
    attrs: {
        body: { fill: 'green' },
        label: { text: 'Child #2\nEmbedded to Parent #2\n(despite no overlap)' }
    }
}).position(820, 200).size(160, 100).addTo(graph);

var b = new Child({
    attrs: {
        body: { fill: 'blue' },
        label: { text: 'Child #3\nEmbedded to Parent #2\n(despite no overlap)' }
    }
}).position(620, 340).size(160, 100).addTo(graph);

new Parent({
    attrs: {
        label: { text: 'Parent #2\n(custom embedding logic)\nThree embedded children\n–\nTry to move me!' }
    }
}).position(620, 480).size(160, 100).addTo(graph).embed(r).embed(g).embed(b);


