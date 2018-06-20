(function eventsCustomViewEvents() {

    var graph = new joint.dia.Graph;

    var paper = new joint.dia.Paper({
        el: document.getElementById('paper-events-custom-view-events'),
        model: graph,
        width: 600,
        height: 100,
        gridSize: 1,
        background: {
            color: 'white'
        },
        interactive: false,
        elementView: joint.dia.ElementView.extend({
            pointerdblclick: function(evt, x, y) {
                this.model.remove();
            }
        }),
        linkView: joint.dia.LinkView.extend({
            pointerdblclick: function(evt, x, y) {
                this.model.remove();
            }
        })
    });

    var rect = new joint.shapes.standard.Rectangle();
    rect.position(100, 30);
    rect.resize(100, 40);
    rect.attr({
        body: {
            cursor: 'pointer',
            fill: 'white',
            stoke: 'black'
        },
        label: {
            text: 'Element #1',
            cursor: 'pointer',
            fill: 'black'
        }
    });
    rect.addTo(graph);

    var rect2 = rect.clone();
    rect2.translate(300, 0);
    rect2.attr('label/text', 'Element #2');
    rect2.addTo(graph);

    var link = new joint.shapes.standard.Link();
    link.source(new g.Point(210, 50));
    link.target(new g.Point(390, 50));
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
                    cursor: 'pointer',
                    text: 'Link',
                    textAnchor: 'middle',
                    textVerticalAnchor: 'middle',
                    fontSize: 12,
                    fill: 'black'
                },
                body: {
                    cursor: 'pointer',
                    ref: 'label',
                    refX: '-10%',
                    refY: '-10%',
                    refWidth: '120%',
                    refHeight: '120%',
                    fill: 'white',
                    stroke: 'black',
                    strokeWidth: 2
                }
            }
        }
    ]);
    link.addTo(graph);
}());
