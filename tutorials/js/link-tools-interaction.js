(function linkToolsInteraction() {

    var graph = new joint.dia.Graph;

    var paper = new joint.dia.Paper({
        el: document.getElementById('paper-link-tools-interaction'),
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
        new g.Point(130, 180),
        new g.Point(400, 180)
    ])
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

    var linkView = link.findView(paper);
    linkView.addTools(toolsView);
    linkView.hideTools();

    paper.on('link:mouseenter', function(linkView) {
        linkView.showTools();
    });

    paper.on('link:mouseleave', function(linkView) {
        linkView.hideTools();
    });
}());
