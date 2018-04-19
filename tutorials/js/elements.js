(function elements() {

    var graph = new joint.dia.Graph;

    var paper = new joint.dia.Paper({
        el: document.getElementById('paper-elements'),
        model: graph,
        width: 600,
        height: 300,
        gridSize: 10,
        drawGrid: true,
        background: {
            color: 'rgba(0, 255, 0, 0.3)'
        }
    });

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

    var rect2 = new joint.shapes.standard.Rectangle();
    rect2.position(400, 30);
    rect2.resize(100, 40);
    rect2.attr({
        body: {
            fill: '#2C3E50',
            rx: 5,
            ry: 5,
            strokeWidth: 2
        },
        label: {
            text: 'World!',
            fill: '#3498DB',
            fontSize: 18,
            fontWeight: 'bold',
            fontVariant: 'small-caps'
        }
    });
    rect2.addTo(graph);

    var link = new joint.shapes.standard.Link();
    link.source(rect);
    link.target(rect2);
    link.addTo(graph);

    var rect3 = new joint.shapes.standard.Rectangle();
    rect3.position(100, 130);
    rect3.resize(100, 40);
    rect3.attr({
        body: {
            fill: '#E74C3C',
            rx: 20,
            ry: 20,
            strokeWidth: 0
        },
        label: {
            text: 'Hello',
            fill: '#ECF0F1',
            fontSize: 11,
            fontVariant: 'small-caps'
        }
    });
    rect3.addTo(graph);

    var rect4 = new joint.shapes.standard.Rectangle();
    rect4.position(400, 130);
    rect4.resize(100, 40);
    rect4.attr({
        body: {
            fill: '#8E44AD',
            strokeWidth: 0
        },
        label: {
            text: 'World!',
            fill: 'white',
            fontSize: 13
        }
    });
    rect4.addTo(graph);

    var link2 = new joint.shapes.standard.Link();
    link2.source(rect3);
    link2.target(rect4);
    link2.addTo(graph);

    var rect5 = new joint.shapes.standard.Rectangle();
    rect5.position(100, 230);
    rect5.resize(100, 40);
    rect5.attr({
        body: {
            fill: '#2ECC71',
            strokeDasharray: '10,2'
        },
        label: {
            text: 'Hello',
            fill: 'black',
            fontSize: 13
        }
    });
    rect5.addTo(graph);

    var rect6 = new joint.shapes.standard.Rectangle();
    rect6.position(400, 230);
    rect6.resize(100, 40);
    rect6.attr({
        body: {
            fill: '#F39C12',
            rx: 20,
            ry: 20,
            strokeDasharray: '1,1'
        },
        label: {
            text: 'World!',
            fill: 'gray',
            fontSize: 18,
            fontWeight: 'bold',
            fontVariant: 'small-caps',
            textShadow: '1px 1px 1px black'
        }
    });
    rect6.addTo(graph);

    var link3 = new joint.shapes.standard.Link();
    link3.source(rect5);
    link3.target(rect6);
    link3.addTo(graph);
}());
