(function elementToolsCustomButton() {

    var graph = new joint.dia.Graph;

    var paper = new joint.dia.Paper({
        el: document.getElementById('paper-element-tools-custom-button'),
        model: graph,
        width: 600,
        height: 100,
        gridSize: 10,
        drawGrid: true,
        background: {
            color: 'rgba(255, 165, 0, 0.3)'
        }
    });

    var element = new joint.shapes.standard.Rectangle();
    element.position(240, 30);
    element.resize(100, 40);
    element.attr({
        body: {
            fill: 'white',
            stroke: 'black',
            strokeWidth: 2
        },
        label: {
            text: 'Hello, World!',
            fill: 'black'
        }
    });
    element.addTo(graph);

    joint.elementTools.InfoButton = joint.elementTools.Button.extend({
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
            x: '100%',
            y: '100%',
            offset: {
                x: 0,
                y: 0
            },
            rotate: true,
            action: function(evt) {
                alert('View id: ' + this.id + '\n' + 'Model id: ' + this.model.id);
            }
        }
    });

    var infoButton = new joint.elementTools.InfoButton();
    var toolsView = new joint.dia.ToolsView({
        tools: [infoButton]
    });

    var elementView = element.findView(paper);
    elementView.addTools(toolsView);
}());
