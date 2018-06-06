(function multiplePapers() {

    // shared graph model
    var graph = new joint.dia.Graph;

    // main paper view
    var paper = new joint.dia.Paper({
        el: document.getElementById('paper-multiple-papers'),
        model: graph,
        width: 600,
        height: 100,
        gridSize: 1
    });

    // minimap paper view
    var paperSmall = new joint.dia.Paper({
        el: document.getElementById('paper-multiple-papers-small'),
        model: graph,
        width: 150,
        height: 25,
        gridSize: 1,
        interactive: false
    });
    paperSmall.scale(0.25);

    // graph contents
    var rect = new joint.shapes.standard.Rectangle();
    rect.position(100, 30);
    rect.resize(100, 40);
    rect.attr({
        body: {
            fill: 'blue'
        },
        label: {
            text: 'Hello',
            fill: 'white'
        }
    });
    rect.addTo(graph);

    var rect2 = rect.clone();
    rect2.translate(300, 0);
    rect2.attr('label/text', 'World!');
    rect2.addTo(graph);

    var link = new joint.shapes.standard.Link();
    link.source(rect);
    link.target(rect2);
    link.addTo(graph);
}());
