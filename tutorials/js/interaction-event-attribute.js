(function interactionEventAttribute() {

    var graph = new joint.dia.Graph;

    var paper = new joint.dia.Paper({
        el: document.getElementById('paper-interaction-event-attribute'),
        model: graph,
        width: 600,
        height: 100,
        gridSize: 1
    });

    var rect = new joint.shapes.standard.Rectangle();
    rect.position(250, 30);
    rect.resize(100, 40);
    rect.attr({
        body: {
            event: 'element:color-change',
            cursor: 'pointer',
            fill: 'green'
        },
        label: {
            event: 'element:color-change',
            cursor: 'pointer',
            text: 'Change Color',
            style: {
                fill: 'white'
            }
        }
    });
    rect.addTo(graph);

    paper.on('element:color-change', function(elementView, evt) {
        evt.stopPropagation(); // stop any further actions with the element view (e.g. dragging)

        var model = elementView.model;

        if (model.attr('body/fill') === 'green') model.attr('body/fill', 'red');
        else model.attr('body/fill', 'green');
    });
}());
