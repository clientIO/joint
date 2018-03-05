(function elementStyling() {

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

    var rect2 = new joint.shapes.standard.Rectangle();
    rect2.position(400, 30);
    rect2.resize(100, 30);
    rect2.attr({
        body: {
            fill: '#2C3E50',
            rx: 5,
            ry: 5,
            'stroke-width': 2
        },
        label: {
            text: 'World!',
            style: {
                fill: '#3498DB',
                'font-size': 18,
                'font-weight': 'bold',
                'font-variant': 'small-caps'
            }
        }
    });

    var link = new joint.shapes.standard.Link();
    link.source({ id: rect.id });
    link.target({ id: rect2.id });

    var rect3 = new joint.shapes.standard.Rectangle();
    rect3.position(100, 130);
    rect3.resize(100, 30);
    rect3.attr({
        body: {
            fill: '#E74C3C',
            rx: 20,
            ry: 20,
            'stroke-width': 0
        },
        label: {
            text: 'Hello',
            style: {
                fill: '#ECF0F1',
                'font-size': 11,
                'font-variant': 'small-caps'
            }
        }
    });

    var rect4 = new joint.shapes.standard.Rectangle();
    rect4.position(400, 130);
    rect4.resize(100, 30);
    rect4.attr({
        body: {
            fill: '#8E44AD',
            'stroke-width': 0
        },
        label: {
            text: 'World!',
            style: {
                fill: 'white',
                'font-size': 13
            }
        }
    });

    var link2 = new joint.shapes.standard.Link();
    link2.source({ id: rect3.id });
    link2.target({ id: rect4.id });

    var rect5 = new joint.shapes.standard.Rectangle();
    rect5.position(100, 230);
    rect5.resize(100, 30);
    rect5.attr({
        body: {
            fill: '#2ECC71',
            'stroke-dasharray': '10,2'
        },
        label: {
            text: 'Hello',
            style: {
                fill: 'black',
                'font-size': 13
            }
        }
    });

    var rect6 = new joint.shapes.standard.Rectangle();
    rect6.position(400, 230);
    rect6.resize(100, 30);
    rect6.attr({
        body: {
            fill: '#F39C12',
            rx: 20,
            ry: 20,
            'stroke-dasharray': '1,1'
        },
        label: {
            text: 'World!',
            style: {
                fill: 'gray',
                'font-size': 18,
                'font-weight': 'bold',
                'font-variant': 'small-caps',
                'text-shadow': '1px 1px 1px black'
            }
        }
    });

    var link3 = new joint.shapes.standard.Link();
    link3.source({ id: rect5.id });
    link3.target({ id: rect6.id });

    graph.addCells([rect, rect2, link, rect3, rect4, link2, rect5, rect6, link3]);
}());
