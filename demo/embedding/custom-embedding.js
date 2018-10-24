var Child = joint.shapes.standard.Rectangle.define('standard.Child', {
    attrs: {
        body: { stroke: 'transparent', fill: 'green', rx: 5, ry: 5 },
        label: { fontSize: 14, text: 'child1', fill: 'white' }
    }
});

var Parent = joint.shapes.standard.Rectangle.define('standard.Parent', {
    customEmebedding: true,
    attrs: {
        body: { stroke: 'transparent', fill: 'black', rx: 5, ry: 5 },
        label: { fontSize: 14, text: 'Parent', fill: 'white' }
    }
});

var graph = new joint.dia.Graph;

var EMBEDDING_OFFSET = 59;
new joint.dia.Paper({
    el: Backbone.$('<div/>').prependTo(document.body).css({
        border: '1px solid gray',
        display: 'inline-block'
    }),

    model: graph,
    width: 1000,
    height: 1000,
    gridSize: 20,
    drawGrid: 'mesh',
    embeddingMode: true,
    findParentBy: function(element) {

        var bBox = element.getBBox();

        var elements = this.getElements().filter(function(el) {

            var elBBox = el.getBBox();

            if (el.get('customEmebedding')) {
                var embeddedCells = el.getEmbeddedCells();

                if (embeddedCells.length) {
                    var embedsSize = this.getCellsBBox(embeddedCells);
                    elBBox.height += embedsSize.height;
                    elBBox.y -= embedsSize.height;
                }

                elBBox.y -= EMBEDDING_OFFSET;
                elBBox.height += EMBEDDING_OFFSET;
            }

            return bBox.intersect(elBBox);
        }.bind(this));

        return elements;
    }
});

new Parent().position(240, 400).size(160, 100).addTo(graph);

new Child({
    attrs: {
        body: { fill: 'red' },
        label: { text: 'Try to move me\n above the \n "Parent" element' }
    }
}).position(20, 120).size(160, 100).addTo(graph);

new Child({
    attrs: {
        body: { fill: 'green' },
        label: { text: 'Try to move me\n above the \n "Parent" element' }
    }
}).position(20, 240).size(160, 100).addTo(graph);

new Child({
    attrs: {
        body: { fill: 'blue' },
        label: { text: 'Try to move me\n above the \n "Parent" element' }
    }
}).position(20, 360).size(160, 100).addTo(graph);

// Result demonstration
var r = new Child({
    attrs: {
        body: { fill: 'red' },
        label: { text: 'Embedded!' }
    }
}).position(600, 120).size(160, 100).addTo(graph);

var g = new Child({
    attrs: {
        body: { fill: 'green' },
        label: { text: 'Embedded!' }
    }
}).position(660, 240).size(160, 100).addTo(graph);

var b = new Child({
    attrs: {
        body: { fill: 'blue' },
        label: { text: 'Embedded!' }
    }
}).position(600, 360).size(160, 100).addTo(graph);

new Parent({
    attrs: {
        label: { text: 'Parent\n(try to move me)' }
    }
}).position(640, 480).size(160, 100).addTo(graph).embed(r).embed(g).embed(b);


