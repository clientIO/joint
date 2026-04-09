import { dia, shapes, linkTools, elementTools } from '@joint/core';
import './styles.css';

class ResizeTool extends elementTools.Control {
    getPosition(view) {
        const model = view.model;
        const { width, height } = model.size();
        return { x: width, y: height };
    }

    setPosition(view, coordinates) {
        const model = view.model;
        model.resize(
            Math.max(Math.round(coordinates.x / 2) * 2, 10),
            Math.max(Math.round(coordinates.y / 2) * 2, 10)
        );
    }
}

const graph = new dia.Graph({}, { cellNamespace: shapes });

const paper = new dia.Paper({
    el: document.getElementById('paper-container'),
    width: '100%',
    height: '100%',
    gridSize: 10,
    async: true,
    frozen: true,
    model: graph,
    cellViewNamespace: shapes,
    defaultRouter: { name: 'rightAngle', args: {
        useVertices: true,
        margin: 20,
        minMargin: 10
    }},
    defaultConnector: { name: 'rounded' },
    background: {
        color: '#151D29'
    },
    defaultLinkAnchor: {
        name: 'connectionRatio',
        args: {
            ratio: 0.25
        }
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

link.source({ id: rect.id, anchor: { name: 'top' }});
link.target({ id: rect2.id, anchor: { name: 'right' }});

graph.addCells([rect, rect2, link]);

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
        new linkTools.Vertices({
            focusOpacity: 0.5,
        }),
        new linkTools.TargetAnchor({
            focusOpacity: 0.5,
            scale: 1.2
        }),
        new linkTools.SourceAnchor({
            focusOpacity: 0.5,
            scale: 1.2
        }),
    ]
});

link.findView(paper).addTools(linkToolsView);

function scaleToFit() {
    const graphBBox = graph.getBBox();
    paper.transformToFitContent({
        contentArea: graphBBox.clone().inflate(0, 100)
    });
    const { sy } = paper.scale();
    const area = paper.getArea();
    const yTop = area.height / 2 - graphBBox.y - graphBBox.height / 2;
    const xLeft = area.width / 2 - graphBBox.x - graphBBox.width / 2;
    paper.translate(xLeft * sy, yTop * sy);
}

window.addEventListener('resize', () => scaleToFit());
scaleToFit();

paper.unfreeze();
