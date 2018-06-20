(function eventsGraphEvents() {

    var graph = new joint.dia.Graph;

    var paper = new joint.dia.Paper({
        el: document.getElementById('paper-events-graph-events'),
        model: graph,
        width: 600,
        height: 100,
        gridSize: 1,
        background: {
            color: 'white'
        },
        interactive: true
    });

    var element = new joint.shapes.standard.Rectangle();
    element.position(100, 30);
    element.resize(100, 40);
    element.attr({
        body: {
            fill: 'white',
            stoke: 'black'
        },
        label: {
            text: '150@50',
            cursor: 'move',
            fill: 'black'
        }
    });
    element.addTo(graph);

    var link = new joint.shapes.standard.Link();
    link.source(element);
    link.target(new g.Point(450, 50));
    link.attr({
        line: {
            cursor: 'move',
            stroke: 'black'
        },
        wrapper: {
            cursor: 'move'
        }
    })
    link.labels([
        {
            markup: [{
                tagName: 'rect',
                selector: 'body'
            }, {
                tagName: 'text',
                selector: 'label'
            }],
            attrs: {
                label: {
                    pointerEvents: 'none',
                    text: '450@50',
                    textAnchor: 'middle',
                    textVerticalAnchor: 'middle',
                    fontSize: 12,
                    fill: 'black'
                },
                body: {
                    ref: 'label',
                    refX: '-10%',
                    refY: '-10%',
                    refWidth: '120%',
                    refHeight: '120%',
                    pointerEvents: 'none',
                    fill: 'white',
                    stroke: 'black',
                    strokeWidth: 2
                }
            },
            position: -45
        }
    ]);
    link.addTo(graph);

    graph.on('change:position', function(cell) {
        var center = cell.getBBox().center();
        var label = center.toString();
        cell.attr('label/text', label);
    });

    graph.on('change:target', function(cell) {
        var target = new g.Point(cell.target());
        var label = target.toString();
        cell.label(0, {
            attrs: {
                label: {
                    text: label
                }
            }
        });
    });
}());
