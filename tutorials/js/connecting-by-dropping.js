(function() {

    var graph = new joint.dia.Graph;
    var paper = new joint.dia.Paper({
        el: document.getElementById('paper-connection-by-dropping'),
        width: 650,
        height: 200,
        model: graph
    });

    var el1 = new joint.shapes.standard.Rectangle({
        position: { x: 50, y: 50 },
        size: { width: 100, height: 40 },
        attrs: {
            body: {
                strokeWidth: 5,
                strokeOpacity: .7,
                stroke: 'black',
                rx: 3,
                ry: 3,
                fill: 'lightgray',
                fillOpacity: .5
            },
            label: {
                text: 'Drop me over B',
                fontSize: 10,
                style: { 'text-shadow': '1px 1px 1px lightgray' }
            }
        }
    });

    var el2 = el1.clone().translate(200, 50).attr('label/text', 'B');

    graph.addCells([el1, el2]);

    paper.on({

        'element:pointerdown': function(elementView, evt) {

            evt.data = elementView.model.position();
        },

        'element:pointerup': function(elementView, evt, x, y) {

            var coordinates = new g.Point(x, y);
            var elementAbove = elementView.model;
            var elementBelow = this.model.findModelsFromPoint(coordinates).find(function(el) {
                return (el.id !== elementAbove.id);
            });

            // If the two elements are connected already, don't
            // connect them again (this is application-specific though).
            if (elementBelow && graph.getNeighbors(elementBelow).indexOf(elementAbove) === -1) {

                // Move the element to the position before dragging.
                elementAbove.position(evt.data.x, evt.data.y);

                // Create a connection between elements.
                var link = new joint.shapes.standard.Link();
                link.source(elementAbove);
                link.target(elementBelow);
                link.addTo(graph);

                // Add remove button to the link.
                var tools = new joint.dia.ToolsView({
                    tools: [new joint.linkTools.Remove()]
                });
                link.findView(this).addTools(tools);
            }
        }
    });
}());
