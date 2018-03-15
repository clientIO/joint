(function linksAttr() {

    var graph = new joint.dia.Graph;

    var paper = new joint.dia.Paper({
        el: document.getElementById('paper-links-attr'),
        model: graph,
        width: 600,
        height: 100,
    });

    var link = new joint.shapes.standard.Link();
    link.source(new g.Point(100, 50));
    link.target(new g.Point(500, 50));
    link.labels([{
        attrs: {
            label: {
                text: 'Hello world'
            }
        }
    }]);
    link.addTo(graph);

    graph.on('all', function(eventName, cell) {
        console.log(arguments);
    });
}());
