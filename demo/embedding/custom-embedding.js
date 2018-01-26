var Child = joint.shapes.basic.Rect.define('basic.Child', {
    attrs: {
        rect: { stroke: 'transparent', fill: 'green', rx: 5, ry: 5 },
        text: { 'font-size': 14, 'text': 'child1', fill: 'white' }
    }
});

var Parent = joint.shapes.basic.Rect.define('basic.Parent', {
    customEmebedding: true,
    attrs: {
        rect: { stroke: 'transparent', fill: 'black', rx: 5, ry: 5 },
        text: { 'font-size': 14, 'text': 'Parent', fill: 'white' }
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
                    elBBox.y -= embedsSize.height
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
        rect: { fill: 'red' },
        text: { text: 'Try to move me\n above the \n "Parent" element' }
    }
}).position(20, 120).size(160, 100).addTo(graph);

new Child({
    attrs: {
        rect: { fill: 'green' },
        text: { text: 'Try to move me\n above the \n "Parent" element' }
    }
}).position(20, 240).size(160, 100).addTo(graph);

new Child({
    attrs: {
        rect: { fill: 'blue' },
        text: { text: 'Try to move me\n above the \n "Parent" element' }
    }
}).position(20, 360).size(160, 100).addTo(graph);

// Result demonstration
var r = new Child({
    attrs: {
        rect: { fill: 'red' },
        text: { text: 'Embedded!' }
    }
}).position(600, 120).size(160, 100).addTo(graph);

var g = new Child({
    attrs: {
        rect: { fill: 'green' },
        text: { text: 'Embedded!' }
    }
}).position(660, 240).size(160, 100).addTo(graph);

var b = new Child({
    attrs: {
        rect: { fill: 'blue' },
        text: { text: 'Embedded!' }
    }
}).position(600, 360).size(160, 100).addTo(graph);

new Parent({
    attrs: {
        text: { text: 'Parent\n(try to move me)' }
    }
}).position(640, 480).size(160, 100).addTo(graph).embed(r).embed(g).embed(b);


