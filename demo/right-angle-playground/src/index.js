const { dia, shapes, linkTools, elementTools } = joint;
class ResizeTool extends elementTools.Control {
    getPosition(view) {
        const model = view.model;
        const { width, height } = model.size();
        return { x: width, y: height };
    }

    setPosition(view, coordinates) {
        const model = view.model;
        model.resize(
            Math.max(coordinates.x, 1),
            Math.max(coordinates.y, 1)
        );
    }
}

const graph = new dia.Graph();

const paper = new dia.Paper({
    el: document.getElementById('paper'),
    width: '100%',
    height: '100%',
    gridSize: 10,
    async: true,
    frozen: true,
    model: graph,
    defaultRouter: { name: 'rightAngle', args: { useVertices: true }},
    defaultConnector: { name: 'rounded' },
    background: {
        color: '#151D29'
    }
});

const rect = new shapes.standard.Rectangle({ 
    position: { x: 120, y: 120 },
    size: { width: 220, height: 60 },
    attrs: {
        body: {
            stroke: 'none',
            fill: '#DF423D',
            rx: 10,
            ry: 10,
        }
    }
});

const rect2 = rect.clone();

rect2.resize(60, 220);
rect2.position(400, 700);

const link = new shapes.standard.Link({
    attrs: {
        line: {
            stroke: 'white'
        }
    }
});

const link2 = link.clone();

link.source({ id: rect.id, anchor: { name: 'top' }});
link.target({ id: rect2.id, anchor: { name: 'right' }});
link.vertices([
    { x: 370, y: 420 },
    { x: 500, y: 500 }
]);

link2.source({ x: 670, y: 100 });
link2.target({ x: 800, y: 800 });
link2.vertices([
    { x: 670, y: 420 },
    { x: 800, y: 500 },
]);

graph.addCells([rect, rect2, link, link2]);

rect.findView(paper).addTools(
    new dia.ToolsView({
        tools: [
            new ResizeTool({
                selector: 'body'
            })
        ]
    })
);

rect2.findView(paper).addTools(
    new dia.ToolsView({
        tools: [
            new ResizeTool({
                selector: 'body'
            })
        ]
    })
);

const linkToolsView = new dia.ToolsView({
    tools: [
        new linkTools.TargetAnchor({
            focusOpacity: 0.5
        }),
        new linkTools.SourceAnchor({
            focusOpacity: 0.5
        }),
        new linkTools.Vertices({
            focusOpacity: 0.5
        }),
    ]
});

link.findView(paper).addTools(linkToolsView);

const link2ToolsView = new dia.ToolsView({
    tools: [
        new linkTools.Vertices({
            focusOpacity: 0.5
        }),
        new linkTools.SourceArrowhead({
            focusOpacity: 0.5
        }),
        new linkTools.TargetArrowhead({
            focusOpacity: 0.5
        })
    ]
});

link2.findView(paper).addTools(link2ToolsView);

paper.unfreeze();