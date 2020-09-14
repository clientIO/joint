(function elementToolsInteraction() {

    var graph = new joint.dia.Graph;

    var paper = new joint.dia.Paper({
        el: document.getElementById('paper-element-tools-interaction'),
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

    var boundaryTool = new joint.elementTools.Boundary();
    var removeButton = new joint.elementTools.Remove();

    var toolsView = new joint.dia.ToolsView({
        tools: [boundaryTool, removeButton]
    });

    var elementView = element.findView(paper);
    elementView.addTools(toolsView);
    elementView.hideTools();

    paper.on('element:mouseenter', function(elementView) {
        elementView.showTools();
    });

    paper.on('element:mouseleave', function(elementView) {
        elementView.hideTools();
    });
}());
