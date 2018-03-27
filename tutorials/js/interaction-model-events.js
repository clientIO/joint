(function interactionModelEvents() {

    var graph = new joint.dia.Graph;

    var paper = new joint.dia.Paper({
        el: document.getElementById('paper-interaction-model-events'),
        model: graph,
        width: 600,
        height: 100,
        gridSize: 1,
        background: {
            color: 'white'
        }
    });

    var element = new joint.shapes.standard.Rectangle();
    element.position(100, 30);
    element.resize(100, 40);
    element.attr({
        body: {
            cursor: 'pointer',
            fill: 'white',
            stoke: 'black'
        },
        label: {
            text: '150@50',
            cursor: 'pointer',
            fill: 'black'
        }
    });
    element.addTo(graph);

    var link = new joint.shapes.standard.Link();
    link.source({ id: element.id });
    link.target(new g.Point(450, 50));
    link.attr({
        line: {
            stroke: 'black'
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
                    fill: 'white',
                    stroke: 'black',
                    strokeWidth: 2
                }
            },
            position: -45
        }
    ]);
    link.addTo(graph);

    element.on('change:position', function() {
        var center = this.getBBox().center();
        var label = center.toString();
        this.attr('label/text', label);
    });

    link.on('change:target', function() {
        var target = new g.Point(this.target());
        var label = target.toString();
        this.label(0, {
            attrs: {
                label: {
                    text: label
                }
            }
        });
    });
}());
