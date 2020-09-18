(function linkLabelsInteractionSnapLabels() {

    var graph = new joint.dia.Graph;

    new joint.dia.Paper({
        el: document.getElementById('paper-link-labels-interaction-snap-labels'),
        model: graph,
        width: 600,
        height: 100,
        background: {
            color: 'rgba(255, 165, 0, 0.3)'
        },
        snapLabels: true,
        interactive: {
            linkMove: false,
            labelMove: true,
            arrowheadMove: false,
            vertexMove: false,
            vertexAdd: false,
            vertexRemove: false,
            useLinkTools: false,
        }
    });

    var link = new joint.shapes.standard.Link();
    link.source(new g.Point(100, 50));
    link.target(new g.Point(500, 50));
    link.appendLabel({
        attrs: {
            text: {
                text: 'Draggable'
            }
        }
    });
    link.addTo(graph);
}());
