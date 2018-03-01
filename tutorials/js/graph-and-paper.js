(function basic() {

    var graph = new joint.dia.Graph;

    var paper = new joint.dia.Paper({
        el: document.getElementById('paper-basic'),
        model: graph,
        width: 600,
        height: 100,
        gridSize: 1
    });

    var rect = new joint.shapes.standard.Rectangle();
    rect.position(100, 30);
    rect.resize(100, 30);
    rect.attr({
        body: {
            fill: 'blue'
        },
        label: {
            text: 'Hello',
            style: {
                fill: 'white'
            }
        }
    });

    var rect2 = rect.clone();
    rect2.translate(300, 0);
    rect2.attr('label/text', 'World!');

    var link = new joint.shapes.standard.Link();
    link.source({ id: rect.id });
    link.target({ id: rect2.id });

    graph.addCells([rect, rect2, link]);

    graph.on('all', function(eventName, cell) {
        console.log(arguments);
    });

    var graph2 = new joint.dia.Graph;

    var paper2 = new joint.dia.Paper({
        el: document.getElementById('paper-modified'),
        model: graph2,
        width: 600,
        height: 100,
        gridSize: 10,
        drawGrid: true,
        background: {
            color: 'rgba(0, 255, 0, 0.3)'
        }
    });

    var rect3 = new joint.shapes.standard.Rectangle();
    rect3.position(100, 30);
    rect3.resize(100, 30);
    rect3.attr({
        body: {
            fill: 'blue'
        },
        label: {
            text: 'Hello',
            style: {
                fill: 'white'
            }
        }
    });

    var rect4 = rect3.clone();
    rect4.translate(300, 0);
    rect4.attr('label/text', 'World!');

    var link2 = new joint.shapes.standard.Link();
    link2.source({ id: rect3.id });
    link2.target({ id: rect4.id });

    graph2.addCells([rect3, rect4, link2]);

    graph2.on('all', function(eventName, cell) {
        console.log(arguments);
    });

    var graph3 = new joint.dia.Graph;

    var paper3 = new joint.dia.Paper({
        el: document.getElementById('paper-scaled'),
        model: graph3,
        width: 600,
        height: 100,
        gridSize: 10,
        drawGrid: true,
        background: {
            color: 'rgba(0, 255, 0, 0.3)'
        }
    });
    paper3.scale(2, 2);

    var rect5 = new joint.shapes.standard.Rectangle();
    rect5.position(10, 10);
    rect5.resize(100, 30);
    rect5.attr({
        body: {
            fill: 'blue'
        },
        label: {
            text: 'Hello',
            style: {
                fill: 'white'
            }
        }
    });

    var rect6 = rect5.clone();
    rect6.translate(180, 0);
    rect6.attr('label/text', 'World!');

    var link3 = new joint.shapes.standard.Link();
    link3.source({ id: rect5.id });
    link3.target({ id: rect6.id });

    graph3.addCells([rect5, rect6, link3]);

    graph3.on('all', function(eventName, cell) {
        console.log(arguments);
    });
}());
