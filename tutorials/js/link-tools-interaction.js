(function linkToolsInteraction() {

    var namespace = joint.shapes;

    var graph = new joint.dia.Graph({}, { cellNamespace: namespace });

    var paper = new joint.dia.Paper({
        el: document.getElementById('paper-link-tools-interaction'),
        model: graph,
        width: 600,
        height: 300,
        gridSize: 10,
        drawGrid: true,
        background: {
            color: 'rgba(255, 165, 0, 0.3)'
        },
        cellViewNamespace: namespace
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
    link.source(source, {
        anchor: {
            name: 'center',
            args: {
                dx: 30
            }
        }
    });
    link.target(target, {
        anchor: {
            name: 'center',
            args: {
                dx: -30
            }
        },
        connectionPoint: {
            name: 'boundary'
        }
    });
    link.vertices([
        { x: 130, y: 180 },
        { x: 400, y: 180 }
    ]);
    link.addTo(graph);

    var verticesTool = new joint.linkTools.Vertices();
    var segmentsTool = new joint.linkTools.Segments();
    var sourceArrowheadTool = new joint.linkTools.SourceArrowhead();
    var targetArrowheadTool = new joint.linkTools.TargetArrowhead();
    var sourceAnchorTool = new joint.linkTools.SourceAnchor();
    var targetAnchorTool = new joint.linkTools.TargetAnchor();
    var boundaryTool = new joint.linkTools.Boundary();
    var removeButton = new joint.linkTools.Remove({
        distance: 20
    });

    var toolsView = new joint.dia.ToolsView({
        tools: [
            verticesTool, segmentsTool,
            sourceArrowheadTool, targetArrowheadTool,
            sourceAnchorTool, targetAnchorTool,
            boundaryTool, removeButton
        ]
    });

    paper.on('link:mouseenter', function(linkView) {
        linkView.addTools(toolsView);
    });

    paper.on('link:mouseleave', function(linkView) {
        linkView.removeTools();
    });
}());
