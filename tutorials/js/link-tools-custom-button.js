(function linkToolsCustomButton() {

    var graph = new joint.dia.Graph;

    var paper = new joint.dia.Paper({
        el: document.getElementById('paper-link-tools-custom-button'),
        model: graph,
        width: 600,
        height: 300,
        gridSize: 10,
        drawGrid: true,
        background: {
            color: 'rgba(255, 165, 0, 0.3)'
        }
    });

    var source = new joint.shapes.standard.Rectangle();
    source.position(40, 40);
    source.resize(120, 60);
    source.attr({
        body: {
            fill: 'white',
            stroke: 'black',
            strokeWidth: 2
        },
        label: {
            text: 'Hello',
            fill: 'black'
        }
    });
    source.addTo(graph);

    var target = new joint.shapes.standard.Ellipse();
    target.position(440, 200);
    target.resize(120, 60);
    target.attr({
        body: {
            fill: 'white',
            stroke: 'black',
            strokeWidth: 2,
            rx: 60,
            ry: 30,
        },
        label: {
            text: 'World!',
            fill: 'black'
        }
    });
    target.addTo(graph);

    var link = new joint.shapes.standard.Link();
    link.source(source);
    link.target(target, {
        connectionPoint: {
            name: 'boundary'
        }
    });
    link.vertices([
        new g.Point(280, 70),
        new g.Point(280, 160),
        new g.Point(440, 160)
    ])
    link.addTo(graph);

    joint.linkTools.InfoButton = joint.linkTools.Button.extend({
        name: 'info-button',
        options: {
            markup: [{
                tagName: 'circle',
                selector: 'button',
                attributes: {
                    'r': 7,
                    'fill': '#001DFF',
                    'cursor': 'pointer'
                }
            }, {
                tagName: 'path',
                selector: 'icon',
                attributes: {
                    'd': 'M -2 4 2 4 M 0 3 0 0 M -2 -1 1 -1 M -1 -4 1 -4',
                    'fill': 'none',
                    'stroke': '#FFFFFF',
                    'stroke-width': 2,
                    'pointer-events': 'none'
                }
            }],
            distance: 60,
            offset: 0,
            action: function(evt) {
                alert('View id: ' + this.id + '\n' + 'Model id: ' + this.model.id);
            }
        }
    });

    var infoButton = new joint.linkTools.InfoButton();
    var toolsView = new joint.dia.ToolsView({
        tools: [infoButton]
    });

    var linkView = link.findView(paper);
    linkView.addTools(toolsView);
}());
