(function multiplePapers() {

    var graph = new joint.dia.Graph;
    var paper = new joint.dia.Paper({
        el: $('#paper-multiple-papers'),
        width: 600,
        height: 100,
        model: graph,
        gridSize: 1
    });

    var paperSmall = new joint.dia.Paper({
        el: $('#paper-multiple-papers-small'),
        width: 600,
        height: 100,
        model: graph
    });
    paperSmall.scale(.5);
    paperSmall.$el.css('pointer-events', 'none');
    
    var rect = new joint.shapes.basic.Rect({
        position: { x: 100, y: 30 },
        size: { width: 100, height: 30 },
        attrs: { rect: { fill: 'blue' }, text: { text: 'my box', fill: 'white' } }
    });
    var rect2 = rect.clone();
    rect2.translate(300);
    
    var link = new joint.dia.Link({
        source: { id: rect.id },
        target: { id: rect2.id }
    });
    graph.addCell(rect).addCell(rect2).addCell(link);

}());
